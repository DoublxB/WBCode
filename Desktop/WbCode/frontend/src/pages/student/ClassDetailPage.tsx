import { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClass, useClassAnnouncements, useClassAssignments, useCreateAnnouncement, useProfile } from '../../api/hooks';
import {
  ArrowLeft,
  Bell,
  BookOpen,
  Plus,
  Calendar,
  CheckCircle,
  Trophy,
  Users,
  Flame,
  Hash,
  Sparkles,
  ShieldAlert,
  Map
} from 'lucide-react';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const ClassDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const classId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: classData } = useClass(classId);
  const { data: announcements = [], refetch: refetchAnnouncements } = useClassAnnouncements(classId);
  const { data: assignments = [] } = useClassAssignments(classId);
  const createAnnouncement = useCreateAnnouncement();
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const isProfessor = profile?.role === 'PROFESSOR' || profile?.role === 'ADMIN';
  const usesRoadmap = Boolean((classData as any)?.usesRoadmap);

  const handleCreateAnnouncement = async () => {
    if (!classId || !announcementForm.title || !announcementForm.content) return;
    await createAnnouncement.mutateAsync({
      classId,
      title: announcementForm.title,
      content: announcementForm.content
    });
    setAnnouncementForm({ title: '', content: '' });
    setShowAnnouncementForm(false);
    refetchAnnouncements();
  };

  // XP thresholds mirrored from backend/common/utils/xp.utils.ts (display-only)
  const LEVEL_THRESHOLDS = useMemo(() => [0, 100, 250, 500, 900, 1400, 2000, 2700, 3500], []);

  const xpProgress = useMemo(() => {
    const xp = Number(profile?.xp || 0);
    const level = Number(profile?.level || 1);
    const idx = Math.max(0, Math.min(LEVEL_THRESHOLDS.length - 1, level - 1));
    const cur = LEVEL_THRESHOLDS[idx] ?? 0;
    const next = LEVEL_THRESHOLDS[idx + 1] ?? (cur + 1000);
    const denom = Math.max(1, next - cur);
    const pct = Math.max(0, Math.min(100, Math.round(((xp - cur) / denom) * 100)));
    return { xp, level, cur, next, pct };
  }, [LEVEL_THRESHOLDS, profile?.xp, profile?.level]);

  const members = useMemo(() => {
    const raw = (classData as any)?.members || [];
    return raw
      .map((m: any) => m?.student)
      .filter(Boolean)
      .map((s: any) => ({
        id: Number(s.id),
        firstName: String(s.firstName || ''),
        lastName: String(s.lastName || ''),
        xp: Number(s.xp || 0),
        level: Number(s.level || 1)
      }));
  }, [classData]);

  const leaderboard = useMemo(() => {
    const sorted = [...members].sort((a, b) => (b.xp - a.xp) || (b.level - a.level));
    const myId = Number(profile?.id || 0);
    const myRankIdx = myId ? sorted.findIndex((s) => s.id === myId) : -1;
    const myRank = myRankIdx >= 0 ? myRankIdx + 1 : null;
    const avgLevel = sorted.length ? Math.round((sorted.reduce((acc, s) => acc + s.level, 0) / sorted.length) * 10) / 10 : 0;
    return { sorted, myRank, avgLevel };
  }, [members, profile?.id]);

  const assignmentStats = useMemo(() => {
    const total = assignments.length;
    const completed = assignments.filter((a: any) => (a?.submissions?.length || 0) > 0).length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, pct };
  }, [assignments]);

  const recentAnnouncementsCount = useMemo(() => {
    const now = Date.now();
    return announcements.filter((a: any) => {
      const ts = new Date(a?.createdAt || 0).getTime();
      return ts && now - ts < 1000 * 60 * 60 * 48; // 48h
    }).length;
  }, [announcements]);

  const myStreak = Number(profile?.streak || 0);

  const formatRelative = (date: string) => {
    const ts = new Date(date).getTime();
    if (!ts) return '';
    const diffMs = Date.now() - ts;
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return 'acum';
    if (mins < 60) return `acum ${mins} min`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `acum ${hrs} ore`;
    const days = Math.floor(hrs / 24);
    return `${days} zile`;
  };

  if (!classData) {
    return (
      <div className="space-y-4">
        <SkeletonLoader type="card" count={2} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <SkeletonLoader type="card" count={2} />
          </div>
          <SkeletonLoader type="card" count={2} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header (dashboard-like) */}
      <div className="flex items-start gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-3xl md:text-4xl font-bold text-white truncate">{(classData as any).name}</h1>
              {(classData as any).description && <p className="text-slate-400 mt-1">{(classData as any).description}</p>}
              <p className="text-sm text-slate-500 mt-1">
                Profesor: {(classData as any).professor?.firstName} {(classData as any).professor?.lastName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">
                <Users className="h-4 w-4" />
                {leaderboard.sorted.length} studenți
              </Badge>
              <Badge variant="default">
                <Sparkles className="h-4 w-4" />
                Media nivel: {leaderboard.avgLevel || 0}
              </Badge>
              {leaderboard.myRank && (
                <Badge variant="active">
                  <Hash className="h-4 w-4" />#{leaderboard.myRank}
                </Badge>
              )}
              {usesRoadmap && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => navigate('/roadmap')}
                  className="border-cyan-500/20 hover:border-cyan-500/35"
                >
                  <Map className="h-4 w-4" />
                  Roadmap
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats bar (inspired by model, adapted to WBCode style) */}
      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md overflow-hidden">
        <div className="p-5 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-4">
            {/* Level tile */}
            <div className="flex items-center gap-4 min-w-[260px]">
              <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-emerald-500 grid place-items-center shadow-lg shadow-cyan-500/20">
                <span className="text-2xl font-extrabold text-white">{xpProgress.level}</span>
                <div className="absolute -bottom-2 -right-2 w-7 h-7 rounded-xl bg-slate-950/70 border border-white/10 grid place-items-center">
                  <Flame className="h-4 w-4 text-amber-300" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400">Nivel curent</div>
                <div className="text-xl font-bold text-white truncate">{profile?.title || 'Explorer'}</div>
              </div>
            </div>

            {/* XP progress */}
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span>Progres nivel</span>
                <span className="font-semibold text-cyan-300">
                  {xpProgress.xp} / {xpProgress.next} XP
                </span>
              </div>
              <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-cyan-500 bg-[length:200%_100%] animate-shine rounded-full"
                  style={{ width: `${Math.max(2, xpProgress.pct)}%` }}
                />
              </div>
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3 lg:w-[360px]">
              <div className="rounded-2xl bg-slate-950/35 border border-white/5 p-4 text-center">
                <div className="text-2xl font-extrabold text-amber-300">{myStreak}</div>
                <div className="text-[10px] tracking-[0.2em] text-slate-500 font-semibold">STREAK</div>
              </div>
              <div className="rounded-2xl bg-slate-950/35 border border-white/5 p-4 text-center">
                <div className="text-2xl font-extrabold text-indigo-300">#{leaderboard.myRank ?? '-'}</div>
                <div className="text-[10px] tracking-[0.2em] text-slate-500 font-semibold">RANK</div>
              </div>
              <div className="rounded-2xl bg-slate-950/35 border border-white/5 p-4 text-center">
                <div className="text-2xl font-extrabold text-emerald-300">
                  {assignmentStats.completed}/{assignmentStats.total}
                </div>
                <div className="text-[10px] tracking-[0.2em] text-slate-500 font-semibold">TEME</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: announcements + assignments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/20 grid place-items-center">
                    <Bell className="h-5 w-5 text-cyan-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Anunțuri</div>
                    <div className="text-sm text-slate-400">
                      {recentAnnouncementsCount > 0 ? `${recentAnnouncementsCount} noi` : 'Fără noutăți'}
                    </div>
                  </div>
                  {recentAnnouncementsCount > 0 && (
                    <Badge variant="warning" className="ml-2">
                      {recentAnnouncementsCount} noi
                    </Badge>
                  )}
                </div>

                {isProfessor && (
                  <Button
                    onClick={() => setShowAnnouncementForm((v) => !v)}
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
                  >
                    <Plus className="h-4 w-4" />
                    Anunț nou
                  </Button>
                )}
              </div>

              {showAnnouncementForm && (
                <div className="mb-5 rounded-2xl border border-slate-800/60 bg-slate-950/35 p-5">
                  <div className="text-sm font-semibold text-white mb-3">Creează anunț</div>
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={announcementForm.title}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="Titlu..."
                    />
                    <textarea
                      value={announcementForm.content}
                      onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                      rows={4}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      placeholder="Conținut..."
                    />
                    <div className="flex gap-3">
                      <Button onClick={handleCreateAnnouncement} disabled={createAnnouncement.isPending}>
                        {createAnnouncement.isPending ? 'Se postează...' : 'Postează'}
                      </Button>
                      <Button variant="secondary" onClick={() => setShowAnnouncementForm(false)}>
                        Renunță
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {announcements.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/25 p-8 text-center">
                  <p className="text-slate-300 font-semibold">Nu există anunțuri încă</p>
                  <p className="text-sm text-slate-500 mt-2">Când profesorul postează, apar aici imediat.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.slice(0, 6).map((a: any, idx: number) => {
                    const isNew = idx < recentAnnouncementsCount;
                    return (
                      <div
                        key={a.id}
                        className={cn(
                          'rounded-2xl border p-5 transition-colors',
                          'bg-slate-950/30 border-slate-800/60 hover:border-cyan-500/30'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-lg font-bold text-white truncate">{a.title}</p>
                              {isNew && <Badge variant="warning">NOU</Badge>}
                            </div>
                            <p className="text-xs text-slate-500 mt-1">
                              {formatRelative(a.createdAt)} • {a.professor?.firstName} {a.professor?.lastName}
                            </p>
                          </div>
                        </div>
                        <p className="text-slate-300 mt-3 whitespace-pre-wrap leading-relaxed">{a.content}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Assignments */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500/15 to-cyan-500/10 border border-emerald-500/20 grid place-items-center">
                    <BookOpen className="h-5 w-5 text-emerald-300" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-white">Teme</div>
                    <div className="text-sm text-slate-400">
                      {assignmentStats.total > 0 ? `${assignmentStats.completed}/${assignmentStats.total} completate` : 'Fără teme'}
                    </div>
                  </div>
                </div>

                {isProfessor && (
                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={() => navigate(`/professor/classes/${classId}/create-assignment`)}
                      className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
                    >
                      <Plus className="h-4 w-4" />
                      Temă nouă
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => navigate(`/professor/classes/${classId}/create-assignment?picker=1`)}
                      className="border-cyan-500/20 hover:border-cyan-500/35"
                    >
                      <BookOpen className="h-4 w-4" />
                      Alege problemă existentă
                    </Button>
                  </div>
                )}
              </div>

              {assignmentStats.total > 0 && (
                <div className="mb-5">
                  <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                    <span>Progres teme</span>
                    <span className="font-semibold text-emerald-300">{assignmentStats.pct}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 via-emerald-300 to-cyan-400 bg-[length:200%_100%] animate-shine rounded-full"
                      style={{ width: `${Math.max(2, assignmentStats.pct)}%` }}
                    />
                  </div>
                </div>
              )}

              {assignments.length === 0 ? (
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/25 p-8 text-center">
                  <p className="text-slate-300 font-semibold">Nu există teme încă</p>
                  <p className="text-sm text-slate-500 mt-2">Când apare o temă, o vezi aici și o poți deschide imediat.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {assignments.slice(0, 6).map((assignment: any) => {
                    const submitted = (assignment?.submissions?.length || 0) > 0;
                    const typeBadge: any =
                      assignment.type === 'PROBLEM' ? 'warning' : assignment.type === 'HOMEWORK' ? 'info' : 'success';
                    const diff = String(assignment.difficulty || '').toLowerCase();
                    const diffBadge: any =
                      diff.includes('beginner') || diff.includes('easy')
                        ? 'success'
                        : diff.includes('intermediate') || diff.includes('medium')
                          ? 'warning'
                          : 'default';

                    return (
                      <div
                        key={assignment.id}
                        className={cn(
                          'rounded-2xl border p-5 cursor-pointer transition-all duration-300',
                          'bg-slate-950/30 border-slate-800/60 hover:border-emerald-400/30 hover:bg-slate-950/40'
                        )}
                        onClick={() => navigate(`/classes/${id}/assignments/${assignment.id}`)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="text-lg font-bold text-white line-clamp-2">{assignment.title}</div>
                            <div className="text-sm text-slate-400 mt-2 line-clamp-2">{assignment.description}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge variant={typeBadge}>{assignment.type}</Badge>
                            <Badge variant={diffBadge}>{assignment.difficulty}</Badge>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                          {assignment.dueDate ? (
                            <div className="flex items-center gap-2 text-slate-400">
                              <Calendar className="h-4 w-4" />
                              <span>{new Date(assignment.dueDate).toLocaleDateString()}</span>
                            </div>
                          ) : (
                            <div />
                          )}

                          {isProfessor ? (
                            <div className="text-slate-400">
                              {(assignment?._count?.submissions ?? 0) > 0 ? (
                                <span className="font-semibold text-emerald-300">
                                  {assignment._count.submissions} trimise
                                </span>
                              ) : (
                                <span>0 trimise</span>
                              )}
                            </div>
                          ) : submitted ? (
                            <div className="flex items-center gap-2 text-emerald-300 font-semibold">
                              <CheckCircle className="h-4 w-4" />
                              <span>Completat</span>
                            </div>
                          ) : (
                            <div className="text-slate-500">Neînceput</div>
                          )}
                        </div>

                        <div className="mt-5">
                          <Button
                            variant="secondary"
                            className="w-full justify-center border-emerald-500/15 hover:border-emerald-500/25"
                          >
                            {submitted ? 'Vezi' : 'Începe'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: leaderboard + achievements */}
        <div className="space-y-6">
          {/* Leaderboard (local per class) */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20 grid place-items-center">
                  <Trophy className="h-5 w-5 text-amber-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-bold text-white">Clasament</div>
                  <div className="text-sm text-slate-400">Local (doar pentru clasa asta)</div>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {leaderboard.sorted.slice(0, 5).map((s, idx) => {
                  const isMe = Number(profile?.id) === s.id;
                  return (
                    <div
                      key={s.id}
                      className={cn(
                        'rounded-2xl border p-4 flex items-center gap-3',
                        'bg-slate-950/30 border-slate-800/60',
                        isMe && 'border-cyan-500/35 bg-cyan-500/5'
                      )}
                    >
                      <div
                        className={cn(
                          'w-9 h-9 rounded-xl grid place-items-center text-sm font-bold',
                          idx === 0
                            ? 'bg-amber-500/20 text-amber-200'
                            : idx === 1
                              ? 'bg-slate-400/15 text-slate-200'
                              : idx === 2
                                ? 'bg-orange-500/15 text-orange-200'
                                : 'bg-slate-800/40 text-slate-200'
                        )}
                      >
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">
                          {s.firstName} {s.lastName}
                          {isMe && <span className="text-cyan-300"> • tu</span>}
                        </div>
                        <div className="text-xs text-slate-500">Nivel {s.level}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{s.xp.toLocaleString()}</div>
                        <div className="text-xs text-slate-500">XP</div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5">
                <Button variant="secondary" className="w-full justify-center" onClick={() => setShowLeaderboard(true)}>
                  Vezi tot clasamentul
                </Button>
              </div>
            </div>
          </div>

          {/* Achievements (simple, platform-style) */}
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md overflow-hidden">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-indigo-500/20 grid place-items-center">
                  <Sparkles className="h-5 w-5 text-indigo-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-2xl font-bold text-white">Realizări</div>
                  <div className="text-sm text-slate-400">În clasa ta</div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4">
                  <div className="text-white font-semibold">Primul pas</div>
                  <div className="text-xs text-slate-500 mt-1">Completează prima temă</div>
                  <div className="mt-3">
                    <Badge variant={assignmentStats.completed > 0 ? 'success' : 'default'}>
                      {assignmentStats.completed > 0 ? 'Deblocat' : 'În lucru'}
                    </Badge>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4">
                  <div className="text-white font-semibold">Streak Master</div>
                  <div className="text-xs text-slate-500 mt-1">Menține un streak 7 zile</div>
                  <div className="mt-3">
                    <Badge variant={myStreak >= 7 ? 'success' : 'warning'}>{myStreak}/7</Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard modal */}
      {showLeaderboard && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-[min(720px,94vw)] max-h-[86vh] overflow-hidden rounded-2xl border border-amber-500/25 bg-slate-950/70 backdrop-blur-xl shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/10 border border-amber-500/20">
                <Trophy className="h-6 w-6 text-amber-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.22em] text-amber-300/80">CLASAMENT</div>
                <div className="text-xl font-bold text-white">Local (clasa)</div>
              </div>
              <Button variant="secondary" className="ml-auto" onClick={() => setShowLeaderboard(false)}>
                Închide
              </Button>
            </div>

            <div className="p-6 overflow-auto">
              {leaderboard.sorted.length === 0 ? (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-rose-200 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 mt-0.5" />
                  <div>
                    <p className="font-semibold text-white">Nu pot încărca clasamentul</p>
                    <p className="text-sm text-rose-200/80">Nu există membri disponibili în această clasă.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {leaderboard.sorted.map((s, idx) => {
                    const isMe = Number(profile?.id) === s.id;
                    return (
                      <div
                        key={s.id}
                        className={cn(
                          'rounded-2xl border p-4 flex items-center gap-3',
                          'bg-slate-950/30 border-slate-800/60',
                          isMe && 'border-cyan-500/35 bg-cyan-500/5'
                        )}
                      >
                        <div className="w-10 text-center font-extrabold text-slate-200">#{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-semibold truncate">
                            {s.firstName} {s.lastName}
                            {isMe && <span className="text-cyan-300"> • tu</span>}
                          </div>
                          <div className="text-xs text-slate-500">Nivel {s.level}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{s.xp.toLocaleString()}</div>
                          <div className="text-xs text-slate-500">XP</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassDetailPage;

