import { useEffect, useMemo, useRef, useState } from 'react';
import { useMyJoinedClasses, useJoinClass, useNotifications } from '../../api/hooks';
import { GraduationCap, Users, FileText, BookOpen, Key, ShieldAlert, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const StudentClassesPage = () => {
  const { data: classes = [], refetch, isPending } = useMyJoinedClasses();
  const { data: notifications } = useNotifications();
  const joinClass = useJoinClass();
  const navigate = useNavigate();
  const [invitationCode, setInvitationCode] = useState('');
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const hideToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideToastTimerRef.current) window.clearTimeout(hideToastTimerRef.current);
    };
  }, []);

  const activeCount = useMemo(() => classes.filter((c: any) => c?.isActive !== false).length, [classes]);
  const notifCount = useMemo(() => {
    const map = notifications?.classNotifications || {};
    return Object.values(map).reduce((acc: number, v: any) => acc + (Number(v) || 0), 0);
  }, [notifications]);

  const handleJoin = async () => {
    if (!invitationCode.trim()) return;
    try {
      setErrorMsg(null);
      const code = invitationCode.trim().toUpperCase();
      await joinClass.mutateAsync(code);
      setInvitationCode('');
      setShowJoinModal(false);
      refetch();
      setSuccessMsg(`Ai intrat în clasă (${code}).`);
      if (hideToastTimerRef.current) window.clearTimeout(hideToastTimerRef.current);
      hideToastTimerRef.current = window.setTimeout(() => setSuccessMsg(null), 3500);
    } catch (error: any) {
      setErrorMsg(error?.response?.data?.message || 'Nu am putut face join la clasă.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header (Roadmap-like, integrated) */}
      <div className="pt-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Clasele mele
            </h1>
            <p className="mt-2 text-sm text-slate-400">Clase, anunțuri și teme – totul într-un singur loc.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="info">
                <Users className="h-4 w-4" />
                {activeCount}/{classes.length} active
              </Badge>
              <Badge variant="default">
                <FileText className="h-4 w-4" />
                {notifCount} notificări
              </Badge>
            </div>
          </div>

          <Button
            onClick={() => {
              setErrorMsg(null);
              setShowJoinModal(true);
            }}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
          >
            <Key className="h-4 w-4" />
            Join cu cod
          </Button>
        </div>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div className="fixed top-20 right-6 z-[60] animate-slide-in">
          <div className="relative rounded-2xl border border-emerald-400/40 bg-gradient-to-br from-emerald-500/20 via-slate-950/70 to-cyan-500/15 backdrop-blur-xl px-5 py-4 shadow-2xl shadow-emerald-500/20">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shine" />
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-emerald-500/15 border border-emerald-400/30 p-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">Succes</p>
                <p className="text-sm text-slate-200/80 truncate">{successMsg}</p>
              </div>
              <button
                className="ml-2 rounded-lg p-1 text-slate-200/70 hover:text-slate-200 hover:bg-white/5"
                onClick={() => setSuccessMsg(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isPending ? (
          <>
            <SkeletonLoader type="card" count={6} />
          </>
        ) : classes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md p-10 md:p-12 text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fillRule=\'evenodd\'%3E%3Cg fill=\'%2306b6d4\' fillOpacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
              }}
            />
            <div className="relative">
              <div className="mx-auto mb-4 grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 border border-cyan-500/20">
                <GraduationCap className="h-8 w-8 text-cyan-300" />
              </div>
              <p className="text-xl font-bold text-white">Încă nu ai clase</p>
              <p className="text-slate-400 mt-2 max-w-md mx-auto">
                Intră într-o clasă cu codul de invitație primit de la profesor. După join, apar automat anunțurile și temele.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={() => {
                    setErrorMsg(null);
                    setShowJoinModal(true);
                  }}
                  className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
                >
                  <Key className="h-4 w-4" />
                  Join prima clasă
                </Button>
              </div>
            </div>
          </div>
        ) : (
          classes.map((classItem: any) => {
            const classNotificationCount = Number(notifications?.classNotifications?.[classItem.id] || 0);
            const isActive = classItem?.isActive !== false;

            const cardBase = cn(
              'group relative rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-500 cursor-pointer',
              'bg-slate-900/70 border-slate-800/60 hover:border-cyan-500/40 hover:bg-slate-900/80'
            );

            return (
              <div key={classItem.id} className={cardBase} onClick={() => navigate(`/classes/${classItem.id}`)}>
                <div
                  className="absolute inset-0 opacity-[0.035]"
                  style={{
                    backgroundImage:
                      'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fillRule=\'evenodd\'%3E%3Cg fill=\'%2310b981\' fillOpacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")'
                  }}
                />

                {/* Soft glow */}
                <div className="pointer-events-none absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-cyan-500/15 blur-2xl" />

                {classNotificationCount > 0 && (
                  <div className="absolute right-4 top-4 z-20">
                    <Badge variant="warning" className="animate-pulse">
                      <FileText className="h-4 w-4" />
                      {classNotificationCount > 99 ? '99+' : classNotificationCount}
                    </Badge>
                  </div>
                )}

                <div className="relative z-10 p-6 flex flex-col h-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-white truncate">{classItem.name}</h3>
                      {classItem.description && (
                        <p className="text-sm text-slate-400 mt-2 leading-relaxed line-clamp-2">{classItem.description}</p>
                      )}
                    </div>
                    <Badge variant={isActive ? 'success' : 'default'} className={cn(!isActive && 'opacity-80')}>
                      {isActive ? 'Activă' : 'Inactivă'}
                    </Badge>
                  </div>

                  <div className="mt-5 space-y-2 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-cyan-300/80" />
                      <span className="truncate">
                        Prof: {classItem.professor?.firstName} {classItem.professor?.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-300/80" />
                      <span>{classItem._count?.announcements || 0} anunțuri</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 text-emerald-300/80" />
                      <span>{classItem._count?.assignments || 0} teme</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/60">
                    <Button
                      variant="secondary"
                      className="w-full justify-center border-cyan-500/20 hover:border-cyan-500/35"
                    >
                      Deschide
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Join modal */}
      {showJoinModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-[min(520px,92vw)] rounded-2xl border border-cyan-500/25 bg-slate-950/70 backdrop-blur-xl p-6 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/25">
                <Key className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.22em] text-cyan-300/80">JOIN CLASS</div>
                <div className="text-xl font-bold text-white">Cod de invitație</div>
              </div>
              <button
                className="ml-auto rounded-lg p-2 text-slate-200/70 hover:text-slate-200 hover:bg-white/5"
                onClick={() => setShowJoinModal(false)}
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {errorMsg && (
                <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 flex items-start gap-3">
                  <ShieldAlert className="h-5 w-5 mt-0.5" />
                  <div className="min-w-0">
                    <p className="font-semibold text-white">Nu pot face join</p>
                    <p className="text-sm text-rose-200/80 break-words">{errorMsg}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-300 mb-2 block">Cod (6 caractere)</label>
                <input
                  type="text"
                  value={invitationCode}
                  onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white font-mono text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  placeholder="XXXXXX"
                  maxLength={6}
                  autoFocus
                />
                <p className="text-xs text-slate-500 mt-2">Îl primești de la profesor (ex: pe tablă sau în mesaj).</p>
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowJoinModal(false)}
                disabled={joinClass.isPending}
              >
                Înapoi
              </Button>
              <Button
                className="flex-1 bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
                onClick={handleJoin}
                disabled={joinClass.isPending || !invitationCode.trim()}
              >
                {joinClass.isPending ? 'Se conectează...' : 'Join'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentClassesPage;

