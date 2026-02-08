import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCodingExerciseDto, SupportedLanguage, SubmitCodeDto } from './dto/create-coding-exercise.dto';
import { Role } from '../common/constants/roles';
import { SandboxService } from '../sandbox/sandbox.service';
import { GamificationService } from '../gamification/gamification.service';
import { WBCCoinsService } from '../gamification/wbc-coins.service';
import { BadgesService } from '../gamification/badges.service';
import { AnalyticsService } from '../analytics/analytics.service';
import { ActivityEventType } from '@prisma/client';

@Injectable()
export class CodingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sandbox: SandboxService,
    private readonly gamification: GamificationService,
    private readonly wbcCoins: WBCCoinsService,
    private readonly badges: BadgesService,
    private readonly analytics: AnalyticsService
  ) {}

  private static readonly ROADMAP_MODULE_SLUGS = [
    'procedural-programming',
    'object-oriented',
    'data-structures',
    'algorithms-logic',
    'databases-sql',
    'software-architecture'
  ] as const;

  private normalizeKey(s: string) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s-]/gu, '');
  }

  async listExercises(user?: { id?: number; role?: Role }) {
    const userId = user?.id;
    const role = user?.role;

    // Student-facing list: ONLY the 6 roadmap modules (45 problems per module), and NEVER boss-only exercises.
    // Professors/Admins: keep the broader list (non-boss) so they can still manage legacy/custom exercises.
    const where: any =
      role === Role.PROFESSOR || role === Role.ADMIN
        ? {
            // IMPORTANT: `category` is nullable, so we must include NULL rows explicitly (SQL 3-valued logic).
            OR: [{ category: null }, { category: { not: { startsWith: 'boss:' } } }]
          }
        : {
            category: { in: [...CodingService.ROADMAP_MODULE_SLUGS] }
          };
    // NOTE: We intentionally do NOT filter by status here, because CodeLab exercises are part of the core product
    // and the platform expects students to see them even if they were seeded as DRAFT.
    // Boss exercises are still hidden via the category filter above.

    const exercises = await this.prisma.codingExercise.findMany({
      where,
      orderBy: { id: 'asc' },
      include: {
        submissions: userId
          ? {
              where: {
                userId,
                score: { gt: 0 },
                type: 'CODING'
              },
              orderBy: { createdAt: 'desc' },
              take: 1
            }
          : false
      }
    });

    // Map exercises to include solved status + de-dupe by title/prompt (protect against accidental reseeds)
    const seen = new Set<string>();
    const out: any[] = [];

    for (const ex of exercises as any[]) {
      const hasSolvedSubmission =
        Boolean(userId) && ex.submissions && Array.isArray(ex.submissions) && ex.submissions.length > 0;

      const key = `${this.normalizeKey(ex.title)}::${this.normalizeKey(ex.prompt).slice(0, 180)}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const { submissions, ...exerciseWithoutSubmissions } = ex;
      out.push({
        ...exerciseWithoutSubmissions,
        isSolved: hasSolvedSubmission
      });
    }

    return out;
  }

  async getExercise(id: number) {
    const exercise = await this.prisma.codingExercise.findUnique({ where: { id } });
    if (!exercise) throw new NotFoundException('Exercise not found');
    return exercise;
  }

  async createExercise(user: { id: number; role: Role }, dto: CreateCodingExerciseDto) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can create coding exercises');
    }
    await this.prisma.lesson.findUniqueOrThrow({ where: { id: dto.lessonId } });
    return this.prisma.codingExercise.create({ 
      data: {
        ...dto,
        status: 'DRAFT'
      }
    });
  }

  async submit(userId: number, codingId: number, dto: SubmitCodeDto) {
    const exercise = await this.getExercise(codingId);
    
    // Verificare anti-copiat: multiple criterii
    const SUSPICIOUS_TYPING_SPEED = 25; // caractere/secundă
    const LARGE_PASTE_THRESHOLD = 50; // caractere
    
    // Verifică dacă există paste mare (indiferent de rata medie)
    const hasLargePaste = dto.hasLargePaste || (dto.largestPasteSize && dto.largestPasteSize > LARGE_PASTE_THRESHOLD);
    const isSuspicious = (dto.typingSpeed && dto.typingSpeed > SUSPICIOUS_TYPING_SPEED) || hasLargePaste;
    
    // Debug logging
    console.log('🔍 Anti-copy check:', {
      typingSpeed: dto.typingSpeed,
      timeSpent: dto.timeSpent,
      hasLargePaste,
      largestPasteSize: dto.largestPasteSize,
      isSuspicious,
      codeLength: dto.sourceCode.length,
      userId,
      exerciseId: codingId
    });
    
    // Normalize stdin: trim whitespace, but keep empty string if truly empty
    const normalizedStdin = (dto.stdin ?? '').trim();
    
    console.log('📥 Submitting code:', { 
      exerciseId: codingId, 
      userId, 
      hasStdin: !!normalizedStdin, 
      stdinLength: normalizedStdin.length,
      stdinPreview: normalizedStdin.substring(0, 50) 
    });
    
    const result = await this.sandbox.execute(
      exercise.language as SupportedLanguage, 
      dto.sourceCode, 
      normalizedStdin
    );
    
    // Validare output: compară cu examples/testCases dacă există sau calculează expected output
    let isValidOutput = false;
    let actualOutput = result.stdout.trim();
    
    // Verifică dacă există test cases în baza de date sau examples pentru validare
    const dbTestCases = exercise.testCases ? (Array.isArray(exercise.testCases) ? exercise.testCases : [exercise.testCases]) : [];
    const examples = (exercise as any).examples || [];
    const testData = dbTestCases.length > 0 ? dbTestCases : examples;
    
    // Verifică dacă exercițiul necesită stdin (bazat pe prompt/title)
    const requiresStdin = this.exerciseRequiresStdin(exercise);
    
    if (requiresStdin && !normalizedStdin) {
      // Dacă exercițiul necesită stdin dar nu este furnizat, respinge soluția
      console.log('❌ Exercise requires stdin but none provided:', { 
        exerciseId: codingId,
        exerciseTitle: exercise.title,
        hasStdin: !!normalizedStdin
      });
      isValidOutput = false;
    } else if (testData.length > 0 && result.exitCode === 0) {
      // Folosește test cases din baza de date pentru validare
      // Testăm cu primul test case care se potrivește cu stdin-ul furnizat
      let matchedTest: any = null;
      
      // Caută un test case care se potrivește cu stdin-ul furnizat
      if (normalizedStdin) {
        matchedTest = testData.find((test: any) => {
          if (typeof test === 'object') {
            const testStdin = (test.stdin || test.input || '').toString().trim();
            return testStdin === normalizedStdin || testStdin === '';
          }
          return false;
        });
      }
      
      // Dacă nu găsim un match, folosim primul test case
      if (!matchedTest && testData.length > 0) {
        matchedTest = testData[0];
      }
      
      if (matchedTest) {
        let expectedOutput = '';
        
        if (typeof matchedTest === 'object') {
          expectedOutput = (matchedTest.output || matchedTest.stdout || '').toString().trim();
        } else if (typeof matchedTest === 'string') {
          expectedOutput = matchedTest.trim();
        }
        
        // Compară output-ul (normalize whitespace)
        if (expectedOutput) {
          const normalizedActual = actualOutput.replace(/\s+/g, ' ').trim();
          const normalizedExpected = expectedOutput.replace(/\s+/g, ' ').trim();
          isValidOutput = normalizedActual === normalizedExpected;
          console.log('✅ Validating with test case:', { 
            expected: normalizedExpected, 
            actual: normalizedActual, 
            isValid: isValidOutput 
          });
        } else if (normalizedStdin) {
          // Dacă nu există expected output în test case dar avem stdin, încearcă să calculeze din stdin
          const validationResult = this.validateOutputFromStdin(exercise, normalizedStdin, actualOutput);
          // Dacă validarea returnează null (nu poate calcula), consideră invalid pentru siguranță
          isValidOutput = validationResult === true;
        } else {
          // Nu avem expected output și nici stdin - nu putem valida
          isValidOutput = false;
        }
      } else {
        // Nu avem test cases valide
        isValidOutput = false;
      }
    } else if (result.exitCode === 0 && normalizedStdin) {
      // Dacă nu există test cases dar avem stdin (nu gol), încearcă să valideze din stdin și prompt
      const validationResult = this.validateOutputFromStdin(exercise, normalizedStdin, actualOutput);
      // Dacă validarea returnează null (nu poate calcula), consideră invalid pentru siguranță
      isValidOutput = validationResult === true;
    } else {
      // Dacă nu avem stdin sau stdin este gol sau nu putem valida, consideră invalid (nu acceptă automat)
      console.log('⚠️ Cannot validate output:', { 
        hasStdin: !!dto.stdin, 
        stdinValue: dto.stdin, 
        stdinTrimmed: dto.stdin?.trim(), 
        exitCode: result.exitCode,
        actualOutput,
        requiresStdin
      });
      isValidOutput = false;
    }
    
    const success = isValidOutput && result.exitCode === 0;
    let score = success ? 100 : 0;
    
    // Aplicăm penalizare dacă e suspect
    if (isSuspicious && success) {
      score = Math.max(0, score - 20); // Penalizare de 20 puncte
      console.log('⚠️ Penalty applied! Score reduced from 100 to', score);
    }
    
    let feedback = '';
    if (success) {
      feedback = isSuspicious 
        ? 'Execution successful (⚠️ Suspicious typing pattern detected)' 
        : 'Execution successful! Your solution is correct.';
    } else if (result.exitCode !== 0) {
      feedback = `Runtime error: ${result.stderr || 'Unknown error'}`;
    } else {
      // Codul rulează dar output-ul nu este corect
      const expectedHint = this.getExpectedOutputHint(exercise, normalizedStdin);
      feedback = expectedHint 
        ? `Output mismatch. Expected: "${expectedHint}", but got: "${actualOutput}"`
        : `Output mismatch. Your output: "${actualOutput}" is not correct.`;
    }

    await this.prisma.submission.create({
      data: {
        userId,
        codingId,
        type: 'CODING',
        sourceCode: dto.sourceCode,
        score,
        maxScore: 100,
        feedback,
        runtimeStdout: result.stdout,
        runtimeStderr: result.stderr,
        explanation: isSuspicious 
          ? '⚠️ Your submission was flagged for suspicious typing patterns. Please write code yourself.'
          : (success ? 'Great job! Try optimizing further.' : 'Review the error output to fix your code.')
      }
    });

    // XP awarded for a clean (non-suspicious) solution
    let xpGain = 0;
    if (success && !isSuspicious) {
      xpGain = 50;
      await this.gamification.awardXP(userId, xpGain, `Coding exercise: ${exercise.title}`);
      
      // Award WBC Coins for successful completion
      const coinsReward = this.wbcCoins.calculateExerciseReward(exercise.difficulty, score);
      if (coinsReward > 0) {
        await this.wbcCoins.awardCoins(userId, coinsReward, `Exercise completed: ${exercise.title}`, 'CODING');
      }
      
      // Check badges for problems solved
      await this.gamification.checkProblemSolvedBadges(userId);
      
      // Check badges for first try
      await this.gamification.checkFirstTryBadges(userId, codingId);

      // Scalable CodeLab progression badges (unique solved + all solved)
      await this.badges.checkCodeLabProgression(userId);
      
      console.log('✅ XP awarded:', { userId, xpGain, exerciseId: codingId, score, isSuspicious });
    } else {
      console.log('❌ XP NOT awarded:', { userId, success, isSuspicious, score, exerciseId: codingId });
    }

    // Update weekly missions automatically based on this coding success
    if (success) {
      const now = new Date();
      const missions = await this.prisma.weeklyMission.findMany({
        where: {
          status: 'ACTIVE',
          startDate: { lte: now },
          endDate: { gte: now }
        }
      });

      // CODING missions: +1 per successful coding submission
      // If mission is bound to a specific codingExerciseId, only count when it matches.
      const codingMissions = missions.filter((m) => m.goalType === 'CODING');
      for (const mission of codingMissions) {
        if (mission.codingExerciseId && mission.codingExerciseId !== exercise.id) continue;
        await this.gamification.applyMissionProgress(userId, mission as any, 1);
      }

      // XP missions: progress grows with XP gained from this coding exercise
      if (xpGain > 0) {
        const xpMissions = missions.filter((m) => m.goalType === 'XP');
        for (const mission of xpMissions) {
          await this.gamification.applyMissionProgress(userId, mission as any, xpGain);
        }
      }

      // DAILY_CODING missions: count coding activity days (max 1 per day)
      const dailyMissions = missions.filter((m) => m.goalType === 'DAILY_CODING');
      if (dailyMissions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const mission of dailyMissions) {
          const participant = await this.prisma.missionParticipant.findUnique({
            where: { missionId_userId: { missionId: mission.id, userId } }
          });

          const lastUpdate = participant ? (participant as any).updatedAt ?? null : null;
          const alreadyCountedToday =
            lastUpdate && new Date(lastUpdate).getTime() >= today.getTime();

          if (!alreadyCountedToday) {
            await this.gamification.applyMissionProgress(userId, mission as any, 1);
          }
        }
      }

      // ACTIVE_DAYS missions: mark the day as active (max 1 per day)
      const activeDayMissions = missions.filter((m) => m.goalType === 'ACTIVE_DAYS');
      if (activeDayMissions.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (const mission of activeDayMissions) {
          const participant = await this.prisma.missionParticipant.findUnique({
            where: { missionId_userId: { missionId: mission.id, userId } }
          });

          const lastUpdate = participant ? (participant as any).updatedAt ?? null : null;
          const alreadyCountedToday =
            lastUpdate && new Date(lastUpdate).getTime() >= today.getTime();

          if (!alreadyCountedToday) {
            await this.gamification.applyMissionProgress(userId, mission as any, 1);
          }
        }
      }
    }

    const response = { 
      success, 
      stdout: result.stdout, 
      stderr: result.stderr, 
      score,
      isSuspicious,
      xpGain: success && !isSuspicious ? xpGain : 0
    };
    
    console.log('📤 Submit response:', { 
      success: response.success, 
      score: response.score, 
      xpGain: response.xpGain,
      isSuspicious: response.isSuspicious 
    });
    
    return response;
  }

  /**
   * Verifică dacă exercițiul necesită stdin bazat pe prompt/title
   */
  private exerciseRequiresStdin(exercise: any): boolean {
    const title = String(exercise.title || '').toLowerCase();
    const prompt = String(exercise.prompt || '').toLowerCase();
    const combined = `${title} ${prompt}`;
    
    // Cuvinte cheie care indică că exercițiul necesită input
    const stdinKeywords = [
      'input', 'introduce', 'citește', 'read', 'scanf', 'input()',
      'suma', 'sum', 'adună', 'add', 'diferență', 'difference',
      'produs', 'product', 'înmulțește', 'multiply', 'factorial',
      'fibonacci', 'palindrom', 'palindrome', 'număr', 'number',
      'par', 'impar', 'even', 'odd', 'maxim', 'maximum', 'minim', 'minimum',
      'cmmdc', 'gcd', 'cmmmc', 'lcm', 'prim', 'prime', 'divizor', 'divisor',
      'mai mare', 'largest', 'mai mic', 'smallest', 'cel mai mare', 'cel mai mic',
      'media', 'average', 'mean', 'putere', 'power', 'exponent',
      'invers', 'reverse', 'vocale', 'vowels', 'consoane', 'consonants',
      'cifre', 'digits', 'cuvinte', 'words', 'apariții', 'occurrences',
      'bisect', 'leap', 'sortare', 'sort', 'căutare', 'search',
      'duplicate', 'duplicat', 'anagram', 'anagramă', 'paranteze', 'parentheses',
      'subșir', 'substring', 'permutări', 'permutations', 'validare', 'validation'
    ];
    
    return stdinKeywords.some(keyword => combined.includes(keyword));
  }

  /**
   * Calculează expected output hint pentru feedback
   */
  private getExpectedOutputHint(exercise: any, stdin: string): string | null {
    if (!stdin) return null;

    const title = String(exercise.title || '').toLowerCase();
    const prompt = String(exercise.prompt || '').toLowerCase();
    const combined = `${title} ${prompt}`;
    const stdinLines = stdin.trim().split('\n').filter(line => line.trim());

    try {
      if (combined.includes('suma') || combined.includes('sum') || combined.includes('adună') || combined.includes('add')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            return (a + b).toString();
          }
        }
      }
      
      if (combined.includes('diferență') || combined.includes('difference') || combined.includes('scade') || combined.includes('subtract')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            return (a - b).toString();
          }
        }
      }
      
      if (combined.includes('produs') || combined.includes('product') || combined.includes('înmulțește') || combined.includes('multiply')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            return (a * b).toString();
          }
        }
      }
      
      if (combined.includes('factorial')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n) && n >= 0) {
            let fact = 1;
            for (let i = 2; i <= n; i++) fact *= i;
            return fact.toString();
          }
        }
      }
      
      // Par/Impar (Even/Odd)
      if (combined.includes('par') || combined.includes('impar') || combined.includes('even') || combined.includes('odd')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n)) {
            return n % 2 === 0 ? 'par' : 'impar';
          }
        }
      }
      
      // Maxim/Maximum - "Cel mai mare", "mai mare", "maxim", "maximum"
      if (combined.includes('maxim') || combined.includes('maximum') || 
          combined.includes('mai mare') || combined.includes('largest') ||
          (combined.includes('max') && !combined.includes('maxim'))) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseInt(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            return Math.max(...numbers).toString();
          }
        }
      }
      
      // Minim/Minimum - "Cel mai mic", "mai mic", "minim", "minimum"
      if (combined.includes('minim') || combined.includes('minimum') || 
          combined.includes('mai mic') || combined.includes('smallest') ||
          (combined.includes('min') && !combined.includes('minim'))) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseInt(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            return Math.min(...numbers).toString();
          }
        }
      }
      
      // Media aritmetică / Average
      if (combined.includes('media') || combined.includes('average') || combined.includes('mean')) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseFloat(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            const sum = numbers.reduce((a, b) => a + b, 0);
            return (sum / numbers.length).toString();
          }
        }
      }
      
      // Puterea unui număr / Power
      if (combined.includes('putere') || combined.includes('power') || combined.includes('exponent')) {
        if (stdinLines.length >= 2) {
          const base = parseInt(stdinLines[0]);
          const exp = parseInt(stdinLines[1]);
          if (!isNaN(base) && !isNaN(exp)) {
            return Math.pow(base, exp).toString();
          }
        }
      }
      
      // Inversarea unui șir / Reverse string
      if (combined.includes('invers') || combined.includes('reverse')) {
        if (stdinLines.length >= 1) {
          const str = stdinLines[0].trim();
          return str.split('').reverse().join('');
        }
      }
      
      // Numărul de cifre / Number of digits
      if (combined.includes('cifre') || combined.includes('digits')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n)) {
            return Math.abs(n).toString().length.toString();
          }
        }
      }
      
      // Numărul de vocale / Number of vowels
      if (combined.includes('vocale') || combined.includes('vowels')) {
        if (stdinLines.length >= 1) {
          const str = stdinLines[0].trim().toLowerCase();
          const vowels = 'aeiouăâî';
          return str.split('').filter(c => vowels.includes(c)).length.toString();
        }
      }
      
      // Suma elementelor unei liste / Sum of list elements
      if (combined.includes('suma') && (combined.includes('element') || combined.includes('list'))) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseInt(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            return numbers.reduce((a, b) => a + b, 0).toString();
          }
        }
      }
      
      // Numărul de apariții / Number of occurrences
      if (combined.includes('apariții') || combined.includes('occurrences') || combined.includes('count')) {
        if (stdinLines.length >= 2) {
          const text = stdinLines[0].trim();
          const target = stdinLines[1].trim();
          return (text.split(target).length - 1).toString();
        }
      }
      
      // Numărul de cuvinte / Number of words
      if (combined.includes('cuvinte') || combined.includes('words')) {
        if (stdinLines.length >= 1) {
          const text = stdinLines[0].trim();
          return text.split(/\s+/).filter(w => w.length > 0).length.toString();
        }
      }
      
      // Verificare an bisect / Leap year
      if (combined.includes('bisect') || combined.includes('leap')) {
        if (stdinLines.length >= 1) {
          const year = parseInt(stdinLines[0]);
          if (!isNaN(year)) {
            const isLeap = (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
            return isLeap ? 'da' : 'nu';
          }
        }
      }
    } catch (error) {
      console.error('❌ Error in getExpectedOutputHint:', error);
      return null;
    }

    // Dacă nu recunoaștem tipul de exercițiu, returnăm null (nu putem valida)
    console.log('⚠️ getExpectedOutputHint: Exercise type not recognized', { 
      title: exercise.title, 
      prompt: exercise.prompt?.substring(0, 50),
      stdinLines 
    });
    return null;
  }

  /**
   * Validează output-ul calculând expected output din stdin și prompt
   * Returnează: true dacă valid, false dacă invalid, null dacă nu poate valida
   */
  private validateOutputFromStdin(exercise: any, stdin: string, actualOutput: string): boolean | null {
    // Verifică strict dacă stdin și output există și nu sunt goale
    if (!stdin || !stdin.trim() || !actualOutput || !actualOutput.trim()) {
      console.log('❌ validateOutputFromStdin: Missing stdin or output', { 
        hasStdin: !!stdin, 
        stdinValue: stdin, 
        hasOutput: !!actualOutput,
        outputValue: actualOutput 
      });
      return false;
    }

    const title = String(exercise.title || '').toLowerCase();
    const prompt = String(exercise.prompt || '').toLowerCase();
    const combined = `${title} ${prompt}`;
    const stdinLines = stdin.trim().split('\n').filter(line => line.trim());
    
    // Dacă nu avem linii valide în stdin, nu putem valida
    if (stdinLines.length === 0) {
      console.log('❌ validateOutputFromStdin: No valid stdin lines', { stdin, stdinLines });
      return false;
    }

    // Calculăm expected output bazat pe tipul de exercițiu
    try {
      if (combined.includes('suma') || combined.includes('sum') || combined.includes('adună') || combined.includes('add')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            const expected = (a + b).toString();
            const isValid = actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
            console.log('🔍 Validating sum:', { a, b, expected, actual: actualOutput.trim(), isValid });
            return isValid;
          }
        }
      }
      
      if (combined.includes('diferență') || combined.includes('difference') || combined.includes('scade') || combined.includes('subtract')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            const expected = (a - b).toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
      
      if (combined.includes('produs') || combined.includes('product') || combined.includes('înmulțește') || combined.includes('multiply')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            const expected = (a * b).toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
      
      if (combined.includes('factorial')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n) && n >= 0) {
            let fact = 1;
            for (let i = 2; i <= n; i++) fact *= i;
            const expected = fact.toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
      
      // Par/Impar (Even/Odd)
      if (combined.includes('par') || combined.includes('impar') || combined.includes('even') || combined.includes('odd')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n)) {
            const expected = n % 2 === 0 ? 'par' : 'impar';
            const actual = actualOutput.trim().toLowerCase().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
            // Acceptă "par" sau "impar" cu sau fără newline
            const isValid = actual === expected || 
                           actual === expected + '\n' ||
                           actual.startsWith(expected) && (actual.length === expected.length || actual.length === expected.length + 1);
            console.log('🔍 Validating par/impar:', { 
              n, 
              expected, 
              actual, 
              actualLength: actual.length,
              expectedLength: expected.length,
              isValid,
              combined: combined.substring(0, 100)
            });
            return isValid;
          }
        }
      }
      
      // Maxim/Maximum - "Cel mai mare", "mai mare", "maxim", "maximum"
      if (combined.includes('maxim') || combined.includes('maximum') || 
          combined.includes('mai mare') || combined.includes('largest') ||
          (combined.includes('max') && !combined.includes('maxim'))) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseInt(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            const expected = Math.max(...numbers).toString();
            const isValid = actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
            console.log('🔍 Validating maxim:', { numbers, expected, actual: actualOutput.trim(), isValid });
            return isValid;
          }
        }
      }
      
      // Minim/Minimum - "Cel mai mic", "mai mic", "minim", "minimum"
      if (combined.includes('minim') || combined.includes('minimum') || 
          combined.includes('mai mic') || combined.includes('smallest') ||
          (combined.includes('min') && !combined.includes('minim'))) {
        if (stdinLines.length >= 1) {
          const numbers = stdinLines.map(line => parseInt(line.trim())).filter(n => !isNaN(n));
          if (numbers.length > 0) {
            const expected = Math.min(...numbers).toString();
            const isValid = actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
            console.log('🔍 Validating minim:', { numbers, expected, actual: actualOutput.trim(), isValid });
            return isValid;
          }
        }
      }
      
      // CMMDC/GCD
      if (combined.includes('cmmdc') || combined.includes('gcd')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
            const expected = Math.abs(gcd(a, b)).toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
      
      // CMMMC/LCM
      if (combined.includes('cmmmc') || combined.includes('lcm')) {
        if (stdinLines.length >= 2) {
          const a = parseInt(stdinLines[0]);
          const b = parseInt(stdinLines[1]);
          if (!isNaN(a) && !isNaN(b)) {
            const gcd = (x: number, y: number): number => y === 0 ? x : gcd(y, x % y);
            const lcm = Math.abs(a * b) / gcd(a, b);
            const expected = lcm.toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
      
      // Număr prim / Prime number
      if (combined.includes('prim') || combined.includes('prime')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n) && n >= 2) {
            let isPrime = true;
            for (let i = 2; i <= Math.sqrt(n); i++) {
              if (n % i === 0) {
                isPrime = false;
                break;
              }
            }
            const expected = isPrime ? 'da' : 'nu';
            const actual = actualOutput.trim().toLowerCase();
            return actual === expected || actual === expected + '\n' || 
                   actual === 'true' || actual === 'false' ||
                   (isPrime && actual === '1') || (!isPrime && actual === '0');
          }
        }
      }
      
      // Palindrom
      if (combined.includes('palindrom') || combined.includes('palindrome')) {
        if (stdinLines.length >= 1) {
          const str = stdinLines[0].trim();
          const reversed = str.split('').reverse().join('');
          const isPalindrome = str.toLowerCase() === reversed.toLowerCase();
          const expected = isPalindrome ? 'da' : 'nu';
          const actual = actualOutput.trim().toLowerCase();
          return actual === expected || actual === expected + '\n' ||
                 actual === 'true' || actual === 'false' ||
                 (isPalindrome && actual === '1') || (!isPalindrome && actual === '0');
        }
      }
      
      // Fibonacci
      if (combined.includes('fibonacci')) {
        if (stdinLines.length >= 1) {
          const n = parseInt(stdinLines[0]);
          if (!isNaN(n) && n >= 0) {
            let fib = [0, 1];
            for (let i = 2; i <= n; i++) {
              fib[i] = fib[i - 1] + fib[i - 2];
            }
            const expected = fib[n].toString();
            return actualOutput.trim() === expected || actualOutput.trim() === expected + '\n';
          }
        }
      }
    } catch (error) {
      console.error('Error validating output:', error);
      // Dacă nu putem calcula, consideră invalid pentru siguranță
      return false;
    }

    // Dacă nu recunoaștem tipul de exercițiu, returnăm null (nu putem valida)
    return null;
  }

  async getHint(userId: number, codingId: number) {
    const exercise = await this.getExercise(codingId);
    const HINT_COST = 50;

    // Check if user has enough coins
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { wbcCoins: true }
    });

    if (!user || user.wbcCoins < HINT_COST) {
      throw new ForbiddenException('Insufficient WBC Coins. You need 50 WBC to purchase a hint.');
    }

    // Spend coins
    const updatedUser = await this.wbcCoins.spendCoins(userId, HINT_COST, `Hint purchased for: ${exercise.title}`);

    await this.analytics.recordEvent(userId, {
      type: 'HINT_PURCHASE' as ActivityEventType,
      codingId,
      metadata: { exerciseId: codingId }
    });

    // Dacă există hint custom în baza de date, folosește-l
    if (exercise.hint) {
      return {
        hint: exercise.hint,
        coinsSpent: HINT_COST,
        remainingCoins: updatedUser.wbcCoins
      };
    }

    // Altfel, generează hint inteligent bazat pe tipul problemei (în română)
    const hint = this.generateHintForExercise(exercise);

    return {
      hint,
      coinsSpent: HINT_COST,
      remainingCoins: updatedUser.wbcCoins
    };
  }

  /**
   * Generează hint personalizat în română bazat pe tipul problemei
   */
  private generateHintForExercise(exercise: any): string {
    const title = (exercise.title || '').toLowerCase();
    const prompt = (exercise.prompt || '').toLowerCase();
    const combined = `${title} ${prompt}`;

    // Sumă a două numere
    if (combined.includes('sumă') || combined.includes('suma') || combined.includes('adună') || combined.includes('aduna')) {
      return 'Încearcă să citești două numere de la input folosind input() și apoi adună-le. Nu uita să convertești string-urile la int!';
    }

    // Diferență / Scădere
    if (combined.includes('diferență') || combined.includes('diferenta') || combined.includes('scădere') || combined.includes('scadere')) {
      return 'Citește două numere și calculează diferența dintre ele. Atenție la ordinea numerelor!';
    }

    // Produs / Înmulțire
    if (combined.includes('produs') || combined.includes('înmulțire') || combined.includes('inmultire')) {
      return 'Citește două numere și calculează produsul lor folosind operatorul *.';
    }

    // Factorial
    if (combined.includes('factorial')) {
      return 'Factorialul unui număr n (notat n!) este produsul tuturor numerelor de la 1 la n. Poți folosi o buclă for sau recursie.';
    }

    // Par/Impar
    if (combined.includes('par') || combined.includes('impar') || combined.includes('even') || combined.includes('odd')) {
      return 'Un număr este par dacă restul împărțirii la 2 este 0. Folosește operatorul % (modulo) pentru a verifica.';
    }

    // Maxim / Cel mai mare
    if (combined.includes('maxim') || combined.includes('mai mare') || combined.includes('cel mai mare') || combined.includes('largest') || combined.includes('maximum')) {
      return 'Pentru a găsi maximul, compară fiecare număr cu un maxim inițial. Poți folosi funcția max() sau o comparație manuală.';
    }

    // Minim / Cel mai mic
    if (combined.includes('minim') || combined.includes('mai mic') || combined.includes('cel mai mic') || combined.includes('smallest') || combined.includes('minimum')) {
      return 'Pentru a găsi minimul, compară fiecare număr cu un minim inițial. Poți folosi funcția min() sau o comparație manuală.';
    }

    // CMMDC / GCD
    if (combined.includes('cmmdc') || combined.includes('gcd')) {
      return 'CMMDC (cel mai mare divizor comun) poate fi calculat folosind algoritmul lui Euclid: repetă împărțirea până când restul devine 0.';
    }

    // CMMMC / LCM
    if (combined.includes('cmmmc') || combined.includes('lcm')) {
      return 'CMMMC (cel mai mic multiplu comun) = (a * b) / CMMDC(a, b). Calculează mai întâi CMMDC, apoi folosește formula.';
    }

    // Număr prim
    if (combined.includes('prim') || combined.includes('prime')) {
      return 'Un număr este prim dacă este divizibil doar cu 1 și cu el însuși. Verifică dacă are divizori între 2 și sqrt(n).';
    }

    // Palindrom
    if (combined.includes('palindrom') || combined.includes('palindrome')) {
      return 'Un palindrom este un șir care se citește la fel de la stânga la dreapta și invers. Compară primul caracter cu ultimul, al doilea cu penultimul, etc.';
    }

    // Fibonacci
    if (combined.includes('fibonacci')) {
      return 'Șirul Fibonacci: F(0)=0, F(1)=1, F(n)=F(n-1)+F(n-2). Poți folosi o buclă sau recursie.';
    }

    // Medie
    if (combined.includes('medie') || combined.includes('average') || combined.includes('mean')) {
      return 'Media = suma tuturor numerelor / numărul de elemente. Citește toate numerele, adună-le, apoi împarte la numărul lor.';
    }

    // Putere
    if (combined.includes('putere') || combined.includes('power') || combined.includes('ridicare')) {
      return 'Pentru a calcula a^b, poți folosi operatorul ** în Python sau o buclă care înmulțește a cu el însuși de b ori.';
    }

    // Reverse string
    if (combined.includes('invers') || combined.includes('reverse') || combined.includes('oglindit')) {
      return 'Pentru a inversa un șir, poți folosi slicing [::-1] în Python sau să construiești un nou șir caracter cu caracter de la sfârșit.';
    }

    // Număr de cifre
    if (combined.includes('cifr') || combined.includes('digit')) {
      return 'Pentru a număra cifrele, convertește numărul la string și folosește len(), sau împarte repetat la 10 până devine 0.';
    }

    // Număr de vocale
    if (combined.includes('vocal') || combined.includes('vowel')) {
      return 'Vocalele sunt a, e, i, o, u (și variantele cu diacritice). Parcurge șirul și numără caracterele care sunt vocale.';
    }

    // Sumă elemente listă
    if (combined.includes('listă') || combined.includes('lista') || combined.includes('array') || combined.includes('element')) {
      return 'Parcurge lista/array-ul cu o buclă și adună fiecare element la o variabilă sumă inițializată cu 0.';
    }

    // Număr de apariții
    if (combined.includes('apariți') || combined.includes('aparitii') || combined.includes('count') || combined.includes('numără')) {
      return 'Parcurge șirul sau lista și incrementează un contor când găsești elementul căutat.';
    }

    // Număr de cuvinte
    if (combined.includes('cuvânt') || combined.includes('cuvant') || combined.includes('word')) {
      return 'Poți folosi metoda split() pentru a separa șirul în cuvinte, apoi len() pentru a număra cuvintele.';
    }

    // An bisect
    if (combined.includes('bisect') || combined.includes('leap')) {
      return 'Un an este bisect dacă este divizibil cu 4, EXCEPT dacă este divizibil cu 100 (atunci nu e bisect), EXCEPT dacă este divizibil cu 400 (atunci e bisect).';
    }

    // Hint generic bazat pe dificultate (în română)
    const difficultyHints: Record<string, string> = {
      'EASY': 'Încearcă să spargi problema în pași mai mici. Ce trebuie să citești de la input? Ce trebuie să calculezi? Ce trebuie să afișezi?',
      'MEDIUM': 'Gândește-te la cazurile limită. Ce se întâmplă cu input-uri goale sau valori la limite? Verifică toate condițiile!',
      'HARD': 'Analizează complexitatea algoritmului. Poți optimiza abordarea? Există o structură de date sau un algoritm mai eficient?',
      'BEGINNER': 'Încearcă să înțelegi problema pas cu pas. Ce primești ca input? Ce trebuie să returnezi? Uită-te la exemplele date!',
      'INTERMEDIATE': 'Verifică toate cazurile posibile. Ce se întâmplă cu valori mari, mici, negative sau zero?',
      'ADVANCED': 'Folosește tehnici avansate: programare dinamică, grafuri, sau structuri de date complexe. Optimizează pentru timp și memorie.'
    };

    return difficultyHints[exercise.difficulty?.toUpperCase()] || 
      'Citește cu atenție enunțul problemei. Uită-te la exemplele date și la constrângerile problemei. Încearcă să identifici pattern-ul!';
  }
}



