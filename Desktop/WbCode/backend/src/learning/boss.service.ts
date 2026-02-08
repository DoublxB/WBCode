import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type BossStep =
  | { type: 'QUIZ'; quizId: number; title: string }
  | { type: 'CODING'; codingId: number; title: string; mode: 'BUGFIX' | 'SOLVE' };

const DEFAULT_TIME_LIMIT_SEC = 45 * 60; // 45 minutes (boss test)

@Injectable()
export class BossService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyCompletions(userId: number) {
    const rows = await this.prisma.bossCompletion.findMany({
      where: { userId },
      select: { moduleSlug: true, passedAt: true },
      orderBy: { passedAt: 'desc' }
    });
    return { completions: rows };
  }

  private normalizeSlug(s: string) {
    return String(s || '')
      .trim()
      .toLowerCase();
  }

  private normalizeKey(s: string) {
    return String(s || '')
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\p{L}\p{N}\s-]/gu, '');
  }

  private matchesModuleExercise(ex: { title?: string; prompt?: string; category?: string | null }, moduleSlug: string) {
    const slug = this.normalizeSlug(moduleSlug);
    const catRaw = String(ex?.category || '').trim();
    const cat = catRaw ? this.normalizeSlug(catRaw).replace(/[_\s]+/g, '-').replace(/[^a-z0-9-]/g, '') : '';

    if (cat && (cat === slug || cat.includes(slug))) return true;

    const hay = `${ex?.title || ''} ${ex?.prompt || ''} ${catRaw}`.toLowerCase();
    const tokensBySlug: Record<string, string[]> = {
      'procedural-programming': ['procedural', 'fundamente', 'basics', 'intro', 'variabile', 'operatori', 'if', 'else', 'for', 'while', 'func'],
      'object-oriented': ['oop', 'obiect', 'clase', 'clasă', 'constructor', '__init__', 'moștenire', 'polimorf', 'încaps'],
      'data-structures': ['structuri', 'list', 'liste', 'array', 'vector', 'stiv', 'coad', 'dicț', 'hash', 'map', 'tree', 'arbore', 'set'],
      'algorithms-logic': ['algoritm', 'logic', 'complexitate', 'sort', 'search', 'greedy', 'recurs', 'dp', 'dynamic', 'binar', 'hanoi'],
      'databases-sql': ['sql', 'database', 'bază de date', 'join', 'select', 'where', 'group by', 'having', 'insert', 'update', 'delete', 'crud'],
      'software-architecture': ['arhitect', 'design', 'pattern', 'solid', 'scal', 'layer', 'clean', 'service', 'api', 'modul']
    };

    return (tokensBySlug[slug] || []).some((t) => hay.includes(t));
  }

  private async canStartBoss(userId: number, moduleSlug: string) {
    const slug = this.normalizeSlug(moduleSlug);

    // Boss unlock should match what students see in /coding:
    // exactly the 45 exercises where category === moduleSlug (and never boss:*).
    const moduleExercisesRaw = await this.prisma.codingExercise.findMany({
      where: {
        // Do NOT filter by status here; exercises may be seeded as DRAFT but still playable.
        category: slug
      },
      select: { id: true, title: true, prompt: true, category: true }
    });

    if (moduleExercisesRaw.length === 0) return false;

    // IMPORTANT: de-dupe by the same rule as student-facing /coding.
    // Otherwise, duplicate DB rows can keep the boss "locked" even when the UI shows 100%.
    const seen = new Set<string>();
    const moduleExercises = moduleExercisesRaw.filter((ex) => {
      const key = `${this.normalizeKey(ex.title)}::${this.normalizeKey(String(ex.prompt || '')).slice(0, 180)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    const solved = await this.prisma.submission.findMany({
      where: {
        userId,
        type: 'CODING',
        score: { gt: 0 },
        codingId: { in: moduleExercises.map((e) => e.id) }
      },
      select: { codingId: true },
      distinct: ['codingId']
    });

    const solvedSet = new Set<number>(solved.map((s) => s.codingId!).filter(Boolean));
    const allSolved = moduleExercises.every((e) => solvedSet.has(e.id));
    return allSolved;
  }

  async getBossTestDefinition(userId: number, moduleSlug: string) {
    const slug = this.normalizeSlug(moduleSlug);

    const passed = await this.prisma.bossCompletion.findUnique({
      where: { userId_moduleSlug: { userId, moduleSlug: slug } },
      select: { id: true, passedAt: true }
    });

    const unlocked = await this.canStartBoss(userId, slug);

    // Boss content is selected by convention (seeded):
    // - Quizzes: title starts with "[BOSS:<moduleSlug>]"
    // - Coding: category is "boss:<moduleSlug>" and titles start with "[BUGFIX]" or "[SOLVE]"
    let steps: BossStep[] = [];
    if (unlocked) {
      const quizzesAll = await this.prisma.quiz.findMany({
        where: { title: { startsWith: `[BOSS:${slug}]` } },
        orderBy: { id: 'asc' },
        select: { id: true, title: true }
      });

      const quizIds = quizzesAll.map((q) => q.id);
      const quizSubmissions = quizIds.length
        ? await this.prisma.submission.findMany({
            where: {
              userId,
              type: 'QUIZ',
              quizId: { in: quizIds }
            },
            select: { quizId: true },
            distinct: ['quizId']
          })
        : [];
      const solvedQuizIds = new Set<number>(quizSubmissions.map((s) => s.quizId!).filter(Boolean));

      const unsolvedQuizzes = quizzesAll.filter((q) => !solvedQuizIds.has(q.id));
      const solvedQuizzes = quizzesAll.filter((q) => solvedQuizIds.has(q.id));

      const shuffle = <T,>(arr: T[]) => {
        const copy = [...arr];
        for (let i = copy.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [copy[i], copy[j]] = [copy[j], copy[i]];
        }
        return copy;
      };

      const quizzes = [
        ...shuffle(unsolvedQuizzes),
        ...shuffle(solvedQuizzes)
      ].slice(0, 8);

      const coding = await this.prisma.codingExercise.findMany({
        where: { category: `boss:${slug}` },
        orderBy: { id: 'asc' },
        take: 12,
        select: { id: true, title: true }
      });

      const bugfix = coding.filter((c) => c.title.toUpperCase().includes('[BUGFIX]')).slice(0, 2);
      const solve = coding.filter((c) => c.title.toUpperCase().includes('[SOLVE]')).slice(0, 2);
      const fallback = coding
        .filter((c) => !bugfix.some((b) => b.id === c.id) && !solve.some((s) => s.id === c.id))
        .slice(0, Math.max(0, 4 - (bugfix.length + solve.length)));

      steps = [
        ...quizzes.map((q) => ({ type: 'QUIZ' as const, quizId: q.id, title: q.title })),
        ...bugfix.map((c) => ({ type: 'CODING' as const, codingId: c.id, title: c.title, mode: 'BUGFIX' as const })),
        ...solve.map((c) => ({ type: 'CODING' as const, codingId: c.id, title: c.title, mode: 'SOLVE' as const })),
        ...fallback.map((c) => ({ type: 'CODING' as const, codingId: c.id, title: c.title, mode: 'SOLVE' as const }))
      ];
    }

    return {
      moduleSlug: slug,
      title: `Final Boss • ${slug}`,
      timeLimitSec: DEFAULT_TIME_LIMIT_SEC,
      unlocked,
      isPassed: Boolean(passed),
      passedAt: passed?.passedAt ?? null,
      steps
    };
  }

  async completeBoss(userId: number, moduleSlug: string, passed: boolean) {
    const slug = this.normalizeSlug(moduleSlug);
    if (!passed) return { ok: true, passed: false };

    const unlocked = await this.canStartBoss(userId, slug);
    if (!unlocked) {
      return { ok: true, passed: false, reason: 'LOCKED' };
    }

    await this.prisma.bossCompletion.upsert({
      where: { userId_moduleSlug: { userId, moduleSlug: slug } },
      update: { passedAt: new Date() },
      create: { userId, moduleSlug: slug }
    });

    return { ok: true, passed: true };
  }
}


