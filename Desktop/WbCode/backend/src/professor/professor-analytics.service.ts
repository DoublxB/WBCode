import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../common/constants/roles';

type DateRange = { from: Date; to: Date };

function clampDateRange(from: Date, to: Date) {
  if (from.getTime() > to.getTime()) return { from: to, to: from };
  return { from, to };
}

function toDayKey(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function csvEscape(value: any) {
  const s = String(value ?? '');
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

@Injectable()
export class ProfessorAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  private static readonly ROADMAP_MODULE_SLUGS = [
    'procedural-programming',
    'object-oriented',
    'data-structures',
    'algorithms-logic',
    'databases-sql',
    'software-architecture'
  ] as const;

  private ensureProfessor(user: { id: number; role: Role }) {
    if (user.role !== Role.PROFESSOR && user.role !== Role.ADMIN) {
      throw new ForbiddenException('Only professors can access analytics');
    }
  }

  private async assertCanAccessClass(user: { id: number; role: Role }, classId: number) {
    this.ensureProfessor(user);
    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, professorId: true }
    });
    if (!cls) throw new NotFoundException('Class not found');
    if (user.role !== Role.ADMIN && cls.professorId !== user.id) {
      throw new ForbiddenException('You are not the professor of this class');
    }
    return cls;
  }

  private parseRange(from?: string, to?: string): DateRange {
    const now = new Date();
    const defaultTo = new Date(now);
    const defaultFrom = new Date(now);
    defaultFrom.setDate(defaultFrom.getDate() - 6);

    const fromD = from ? new Date(from) : defaultFrom;
    const toD = to ? new Date(to) : defaultTo;
    const normalized = clampDateRange(fromD, toD);

    // normalize to day boundaries
    const fromDay = new Date(normalized.from);
    fromDay.setHours(0, 0, 0, 0);
    const toDay = new Date(normalized.to);
    toDay.setHours(23, 59, 59, 999);
    return { from: fromDay, to: toDay };
  }

  private async getClassStudentIds(classId: number) {
    const members = await this.prisma.classMember.findMany({
      where: { classId },
      select: { studentId: true }
    });
    return members.map((m) => m.studentId);
  }

  async getClassSummary(user: { id: number; role: Role }, classId: number, from?: string, to?: string) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);
    const studentIds = await this.getClassStudentIds(classId);

    const studentCount = studentIds.length;
    if (studentCount === 0) {
      return {
        classId,
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        studentCount: 0,
        activeStudents: 0,
        submissions: 0,
        avgScorePct: 0,
        xpGain: 0,
        avgXpGainPerStudent: 0,
        solvedProblems: 0,
        quizzesTaken: 0
      };
    }

    const [activeRows, submissionsCount, avgScoreAgg, xpGainAgg, solvedPairs, quizzesTaken] = await Promise.all([
      this.prisma.activityEvent.findMany({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        distinct: ['userId'],
        select: { userId: true }
      }),
      this.prisma.submission.count({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } }
      }),
      this.prisma.submission.aggregate({
        _avg: { score: true, maxScore: true },
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } }
      }),
      this.prisma.xPEvent.aggregate({
        _sum: { delta: true },
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } }
      }),
      this.prisma.submission.findMany({
        where: {
          userId: { in: studentIds },
          type: 'CODING',
          score: { gt: 0 },
          codingId: { not: null },
          createdAt: { gte: range.from, lte: range.to }
        },
        distinct: ['userId', 'codingId'],
        select: { userId: true, codingId: true }
      }),
      this.prisma.submission.count({
        where: { userId: { in: studentIds }, type: 'QUIZ', createdAt: { gte: range.from, lte: range.to } }
      })
    ]);

    const activeStudents = activeRows.length;
    const xpGain = xpGainAgg._sum.delta ?? 0;

    const avgScorePct = (() => {
      const score = Number(avgScoreAgg._avg.score ?? 0);
      const maxScore = Number(avgScoreAgg._avg.maxScore ?? 0);
      if (!maxScore) return 0;
      return Math.round(((score / maxScore) * 100 + Number.EPSILON) * 10) / 10;
    })();

    const solvedProblems = solvedPairs.length; // unique (userId,codingId) pairs in period

    return {
      classId,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      studentCount,
      activeStudents,
      submissions: submissionsCount,
      avgScorePct,
      xpGain,
      avgXpGainPerStudent: studentCount ? Math.round((xpGain / studentCount) * 10) / 10 : 0,
      solvedProblems,
      quizzesTaken
    };
  }

  async getClassLeaderboard(
    user: { id: number; role: Role },
    classId: number,
    metric: 'xpGain' | 'xpTotal' | 'solved' = 'xpGain',
    from?: string,
    to?: string,
    limit = 25
  ) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);
    const studentIds = await this.getClassStudentIds(classId);

    const safeLimit = Math.max(1, Math.min(100, Number(limit) || 25));
    if (studentIds.length === 0) return { metric, rows: [] };

    const students = await this.prisma.user.findMany({
      where: { id: { in: studentIds } },
      select: { id: true, firstName: true, lastName: true, email: true, xp: true, level: true, streak: true }
    });
    const byId = new Map<number, any>(students.map((s) => [s.id, s]));

    if (metric === 'xpTotal') {
      const rows = [...students]
        .sort((a, b) => (b.xp - a.xp) || (b.level - a.level) || (a.id - b.id))
        .slice(0, safeLimit)
        .map((s, idx) => ({
          rank: idx + 1,
          user: { id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email },
          value: s.xp,
          meta: { level: s.level ?? 1, streak: s.streak ?? 0 }
        }));
      return { metric, rows };
    }

    if (metric === 'xpGain') {
      const grouped = await this.prisma.xPEvent.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        _sum: { delta: true }
      });
      const gainByUser = new Map<number, number>(grouped.map((g) => [g.userId, g._sum.delta ?? 0]));
      const rows = studentIds
        .map((id) => ({
          id,
          gain: gainByUser.get(id) ?? 0
        }))
        .sort((a, b) => (b.gain - a.gain) || (a.id - b.id))
        .slice(0, safeLimit)
        .map((r, idx) => {
          const s = byId.get(r.id);
          return {
            rank: idx + 1,
            user: { id: r.id, firstName: s?.firstName ?? '', lastName: s?.lastName ?? '', email: s?.email ?? '' },
            value: r.gain,
            meta: { xpTotal: s?.xp ?? 0, level: s?.level ?? 1, streak: s?.streak ?? 0 }
          };
        });
      return { metric, rows };
    }

    // solved (unique problems in range)
    const pairs = await this.prisma.submission.findMany({
      where: {
        userId: { in: studentIds },
        type: 'CODING',
        score: { gt: 0 },
        codingId: { not: null },
        createdAt: { gte: range.from, lte: range.to }
      },
      distinct: ['userId', 'codingId'],
      select: { userId: true, codingId: true }
    });
    const solvedByUser = new Map<number, number>();
    for (const p of pairs) {
      const uid = p.userId;
      solvedByUser.set(uid, (solvedByUser.get(uid) ?? 0) + 1);
    }
    const rows = studentIds
      .map((id) => ({ id, solved: solvedByUser.get(id) ?? 0 }))
      .sort((a, b) => (b.solved - a.solved) || (a.id - b.id))
      .slice(0, safeLimit)
      .map((r, idx) => {
        const s = byId.get(r.id);
        return {
          rank: idx + 1,
          user: { id: r.id, firstName: s?.firstName ?? '', lastName: s?.lastName ?? '', email: s?.email ?? '' },
          value: r.solved,
          meta: { xpTotal: s?.xp ?? 0, level: s?.level ?? 1 }
        };
      });
    return { metric, rows };
  }

  async getClassTimeseries(
    user: { id: number; role: Role },
    classId: number,
    metric: 'submissions' | 'activeStudents' | 'xpGain' = 'submissions',
    from?: string,
    to?: string
  ) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);
    const studentIds = await this.getClassStudentIds(classId);

    // Create all day buckets first (stable charts)
    const buckets = new Map<string, { day: string; value: number; _set?: Set<number> }>();
    const cur = new Date(range.from);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(range.to);
    end.setHours(0, 0, 0, 0);
    while (cur.getTime() <= end.getTime()) {
      const day = toDayKey(cur);
      buckets.set(day, { day, value: 0, _set: metric === 'activeStudents' ? new Set<number>() : undefined });
      cur.setDate(cur.getDate() + 1);
    }

    if (studentIds.length === 0) {
      return { metric, from: range.from.toISOString(), to: range.to.toISOString(), points: [...buckets.values()].map(({ day, value }) => ({ day, value })) };
    }

    if (metric === 'submissions') {
      const rows = await this.prisma.submission.findMany({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true }
      });
      for (const r of rows) {
        const day = toDayKey(new Date(r.createdAt));
        const b = buckets.get(day);
        if (b) b.value += 1;
      }
    } else if (metric === 'xpGain') {
      const rows = await this.prisma.xPEvent.findMany({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true, delta: true }
      });
      for (const r of rows) {
        const day = toDayKey(new Date(r.createdAt));
        const b = buckets.get(day);
        if (b) b.value += Number(r.delta || 0);
      }
    } else {
      const rows = await this.prisma.activityEvent.findMany({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        select: { createdAt: true, userId: true }
      });
      for (const r of rows) {
        const day = toDayKey(new Date(r.createdAt));
        const b = buckets.get(day);
        if (b?._set) b._set.add(r.userId);
      }
      for (const b of buckets.values()) {
        if (b._set) b.value = b._set.size;
      }
    }

    return {
      metric,
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      points: [...buckets.values()].map(({ day, value }) => ({ day, value }))
    };
  }

  async getClassStudentsTable(user: { id: number; role: Role }, classId: number, from?: string, to?: string) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);
    const studentIds = await this.getClassStudentIds(classId);
    if (studentIds.length === 0) return { from: range.from.toISOString(), to: range.to.toISOString(), students: [] };

    const [students, xpGainGrouped, activeRows, submissionsGrouped, solvedPairs, avgScoreGrouped] = await Promise.all([
      this.prisma.user.findMany({
        where: { id: { in: studentIds } },
        select: { id: true, firstName: true, lastName: true, email: true, xp: true, level: true, streak: true, wbcCoins: true }
      }),
      this.prisma.xPEvent.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        _sum: { delta: true }
      }),
      this.prisma.activityEvent.findMany({
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        select: { userId: true, createdAt: true }
      }),
      this.prisma.submission.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        _count: { _all: true }
      }),
      this.prisma.submission.findMany({
        where: {
          userId: { in: studentIds },
          type: 'CODING',
          score: { gt: 0 },
          codingId: { not: null },
          createdAt: { gte: range.from, lte: range.to }
        },
        distinct: ['userId', 'codingId'],
        select: { userId: true, codingId: true }
      }),
      this.prisma.submission.groupBy({
        by: ['userId'],
        where: { userId: { in: studentIds }, createdAt: { gte: range.from, lte: range.to } },
        _avg: { score: true, maxScore: true }
      })
    ]);

    const xpGainBy = new Map<number, number>(xpGainGrouped.map((g) => [g.userId, g._sum.delta ?? 0]));
    const activeSet = new Set<number>(activeRows.map((r) => r.userId));
    const submissionsBy = new Map<number, number>(submissionsGrouped.map((g: any) => [g.userId, g._count._all ?? 0]));

    const solvedBy = new Map<number, number>();
    for (const p of solvedPairs) {
      solvedBy.set(p.userId, (solvedBy.get(p.userId) ?? 0) + 1);
    }

    const lastActiveAtBy = new Map<number, Date>();
    for (const r of activeRows) {
      const prev = lastActiveAtBy.get(r.userId);
      const ts = new Date(r.createdAt);
      if (!prev || ts.getTime() > prev.getTime()) lastActiveAtBy.set(r.userId, ts);
    }

    const avgScorePctBy = new Map<number, number>();
    for (const g of avgScoreGrouped as any[]) {
      const score = Number(g?._avg?.score ?? 0);
      const maxScore = Number(g?._avg?.maxScore ?? 0);
      const pct = maxScore ? Math.round(((score / maxScore) * 100 + Number.EPSILON) * 10) / 10 : 0;
      avgScorePctBy.set(Number(g.userId), pct);
    }

    const now = new Date();
    const inactivityDaysBy = new Map<number, number>();
    for (const id of studentIds) {
      const last = lastActiveAtBy.get(id);
      if (!last) {
        inactivityDaysBy.set(id, 999);
      } else {
        const diffMs = now.getTime() - last.getTime();
        inactivityDaysBy.set(id, Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24))));
      }
    }

    return {
      from: range.from.toISOString(),
      to: range.to.toISOString(),
      students: students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        email: s.email,
        xpTotal: s.xp ?? 0,
        level: s.level ?? 1,
        streak: (s as any).streak ?? 0,
        coins: (s as any).wbcCoins ?? 0,
        activeInRange: activeSet.has(s.id),
        xpGain: xpGainBy.get(s.id) ?? 0,
        submissions: submissionsBy.get(s.id) ?? 0,
        solvedProblems: solvedBy.get(s.id) ?? 0,
        avgScorePct: avgScorePctBy.get(s.id) ?? 0,
        lastActiveAt: (lastActiveAtBy.get(s.id) ?? null)?.toISOString?.() ?? null,
        inactivityDays: inactivityDaysBy.get(s.id) ?? null
      }))
    };
  }

  async getClassRisks(user: { id: number; role: Role }, classId: number, from?: string, to?: string) {
    // Uses the same table payload so UI can reuse it without extra heavy joins.
    const table = await this.getClassStudentsTable(user, classId, from, to);
    const students = (table as any).students as any[];

    // Simple, literature-aligned early warning signals (interpretable + actionable):
    // - inactivity (>= 7 days)
    // - zero engagement in interval (xpGain==0 AND submissions==0)
    // - low performance (avgScorePct < 60 with >= 3 submissions)
    const atRisk = students
      .map((s) => {
        const flags: Array<{ code: string; severity: 'LOW' | 'MEDIUM' | 'HIGH'; label: string }> = [];

        const inactivityDays = Number(s.inactivityDays ?? 999);
        if (inactivityDays >= 14) flags.push({ code: 'INACTIVE_14D', severity: 'HIGH', label: `Inactiv ${inactivityDays} zile` });
        else if (inactivityDays >= 7) flags.push({ code: 'INACTIVE_7D', severity: 'MEDIUM', label: `Inactiv ${inactivityDays} zile` });

        const xpGain = Number(s.xpGain ?? 0);
        const submissions = Number(s.submissions ?? 0);
        if (xpGain === 0 && submissions === 0) flags.push({ code: 'NO_ENGAGEMENT', severity: 'MEDIUM', label: 'Fără activitate (XP/submisii) în interval' });

        const avgScorePct = Number(s.avgScorePct ?? 0);
        if (submissions >= 3 && avgScorePct > 0 && avgScorePct < 60) {
          flags.push({ code: 'LOW_ACCURACY', severity: 'HIGH', label: `Performanță scăzută (${avgScorePct}%)` });
        }

        const solved = Number(s.solvedProblems ?? 0);
        if (submissions >= 3 && solved === 0) flags.push({ code: 'NO_SOLVES', severity: 'MEDIUM', label: 'Multe încercări, 0 rezolvări' });

        const severityRank = (sev: string) => (sev === 'HIGH' ? 3 : sev === 'MEDIUM' ? 2 : 1);
        const score = flags.reduce((acc, f) => acc + severityRank(f.severity), 0);

        return {
          user: { id: s.id, firstName: s.firstName, lastName: s.lastName, email: s.email },
          score,
          flags
        };
      })
      .filter((r) => r.flags.length > 0)
      .sort((a, b) => (b.score - a.score) || (a.user.id - b.user.id))
      .slice(0, 25);

    const counts = { HIGH: 0, MEDIUM: 0, LOW: 0 };
    for (const r of atRisk) for (const f of r.flags) (counts as any)[f.severity] = ((counts as any)[f.severity] || 0) + 1;

    return {
      classId,
      from: (table as any).from,
      to: (table as any).to,
      counts,
      atRisk
    };
  }

  async getClassModuleDistribution(user: { id: number; role: Role }, classId: number, from?: string, to?: string) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);
    const studentIds = await this.getClassStudentIds(classId);

    const empty = ProfessorAnalyticsService.ROADMAP_MODULE_SLUGS.map((slug) => ({ slug, solved: 0 }));
    if (studentIds.length === 0) {
      return { classId, from: range.from.toISOString(), to: range.to.toISOString(), modules: empty, totalSolved: 0 };
    }

    // Unique solved coding IDs in range for the class (distinct by userId+codingId then rolled up)
    const solvedPairs = await this.prisma.submission.findMany({
      where: {
        userId: { in: studentIds },
        type: 'CODING',
        score: { gt: 0 },
        codingId: { not: null },
        createdAt: { gte: range.from, lte: range.to }
      },
      distinct: ['userId', 'codingId'],
      select: {
        codingId: true,
        coding: { select: { category: true } }
      }
    });

    const counts = new Map<string, number>();
    for (const p of solvedPairs as any[]) {
      const cat = String(p?.coding?.category || '').trim();
      if (!cat) continue;
      // Only count roadmap modules
      if (!(ProfessorAnalyticsService.ROADMAP_MODULE_SLUGS as readonly string[]).includes(cat)) continue;
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }

    const modules = ProfessorAnalyticsService.ROADMAP_MODULE_SLUGS.map((slug) => ({
      slug,
      solved: counts.get(slug) ?? 0
    }));
    const totalSolved = modules.reduce((acc, m) => acc + m.solved, 0);

    return { classId, from: range.from.toISOString(), to: range.to.toISOString(), modules, totalSolved };
  }

  async exportClassCsv(user: { id: number; role: Role }, classId: number, from?: string, to?: string) {
    await this.assertCanAccessClass(user, classId);
    const range = this.parseRange(from, to);

    const cls = await this.prisma.class.findUnique({
      where: { id: classId },
      select: { id: true, name: true }
    });
    if (!cls) throw new NotFoundException('Class not found');

    const [summary, table, risks, modules] = await Promise.all([
      this.getClassSummary(user, classId, range.from.toISOString(), range.to.toISOString()),
      this.getClassStudentsTable(user, classId, range.from.toISOString(), range.to.toISOString()),
      this.getClassRisks(user, classId, range.from.toISOString(), range.to.toISOString()),
      this.getClassModuleDistribution(user, classId, range.from.toISOString(), range.to.toISOString())
    ]);

    const timestamp = new Date().toISOString().split('T')[0];

    const lines: string[] = [];
    lines.push(`WBCode Class Report,${csvEscape(timestamp)}`);
    lines.push(`Class,${csvEscape(cls.name)}`);
    lines.push(`RangeFrom,${csvEscape((summary as any).from)}`);
    lines.push(`RangeTo,${csvEscape((summary as any).to)}`);
    lines.push('');

    // Summary section
    lines.push('Summary');
    lines.push(`Students,${csvEscape((summary as any).studentCount)}`);
    lines.push(`ActiveStudents,${csvEscape((summary as any).activeStudents)}`);
    lines.push(`Submissions,${csvEscape((summary as any).submissions)}`);
    lines.push(`AvgScorePct,${csvEscape((summary as any).avgScorePct)}`);
    lines.push(`XPGain,${csvEscape((summary as any).xpGain)}`);
    lines.push(`SolvedProblems,${csvEscape((summary as any).solvedProblems)}`);
    lines.push(`QuizzesTaken,${csvEscape((summary as any).quizzesTaken)}`);
    lines.push('');

    // Module distribution section
    lines.push('ModuleDistribution (Solved in range)');
    lines.push('ModuleSlug,Solved');
    for (const m of (modules as any).modules || []) {
      lines.push(`${csvEscape(m.slug)},${csvEscape(m.solved)}`);
    }
    lines.push('');

    // Risks section (top 25)
    lines.push('AtRisk (Top)');
    lines.push('StudentId,Name,Email,Flags');
    for (const r of (risks as any).atRisk || []) {
      const name = `${r.user.firstName} ${r.user.lastName}`.trim();
      const flags = (r.flags || []).map((f: any) => `${f.severity}:${f.code}`).join(' | ');
      lines.push(`${csvEscape(r.user.id)},${csvEscape(name)},${csvEscape(r.user.email)},${csvEscape(flags)}`);
    }
    lines.push('');

    // Students table section
    lines.push('Students');
    lines.push(
      [
        'StudentId',
        'FirstName',
        'LastName',
        'Email',
        'ActiveInRange',
        'LastActiveAt',
        'InactivityDays',
        'XP_Total',
        'Level',
        'Streak',
        'Coins',
        'XP_Gain',
        'Submissions',
        'SolvedProblems',
        'AvgScorePct'
      ].join(',')
    );

    for (const s of (table as any).students || []) {
      lines.push(
        [
          csvEscape(s.id),
          csvEscape(s.firstName),
          csvEscape(s.lastName),
          csvEscape(s.email),
          csvEscape(s.activeInRange ? 'yes' : 'no'),
          csvEscape(s.lastActiveAt || ''),
          csvEscape(s.inactivityDays ?? ''),
          csvEscape(s.xpTotal),
          csvEscape(s.level),
          csvEscape(s.streak),
          csvEscape(s.coins),
          csvEscape(s.xpGain),
          csvEscape(s.submissions),
          csvEscape(s.solvedProblems),
          csvEscape(s.avgScorePct)
        ].join(',')
      );
    }

    return {
      mime: 'text/csv; charset=utf-8',
      filename: `wbcode-class-${classId}-${timestamp}.csv`,
      data: lines.join('\n')
    };
  }
}


