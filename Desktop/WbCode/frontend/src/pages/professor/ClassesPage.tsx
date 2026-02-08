import { useEffect, useRef, useState } from 'react';
import { useMyClasses, useCreateClass, useRegenerateInvitationCode } from '../../api/hooks';
import { GraduationCap, Plus, Copy, RefreshCw, Users, FileText, BookOpen, CheckCircle2, X, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import SkeletonLoader from '../../components/SkeletonLoader';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';

const ClassesPage = () => {
  const { data: classes = [], refetch } = useMyClasses();
  const createClass = useCreateClass();
  const regenerateCode = useRegenerateInvitationCode();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', usesRoadmap: false });
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const hideToastTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (hideToastTimerRef.current) window.clearTimeout(hideToastTimerRef.current);
    };
  }, []);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      setErrorMsg(null);
      await createClass.mutateAsync({ name: form.name, description: form.description, usesRoadmap: form.usesRoadmap });
      setForm({ name: '', description: '', usesRoadmap: false });
      setShowCreate(false);
      setShowSuccess(true);
      refetch();
      // Hide success animation after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error creating class:', error);
      setErrorMsg(error?.response?.data?.message || error?.message || 'Nu am putut crea clasa.');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    if (hideToastTimerRef.current) window.clearTimeout(hideToastTimerRef.current);
    hideToastTimerRef.current = window.setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="space-y-6 relative">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative">
            {/* Animated Checkmark Circle */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl animate-scale-in">
              <CheckCircle2 className="w-16 h-16 text-white animate-checkmark" strokeWidth={3} />
            </div>
            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ripple"></div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ripple-delayed"></div>
            {/* Success Text */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-2xl font-bold text-white animate-fade-in">Clasa a fost creata!</p>
            </div>
          </div>
        </div>
      )}

      {/* Header (Roadmap-like) */}
      <div className="pt-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-primary" />
              Clasele mele
            </h1>
            <p className="mt-2 text-sm text-slate-400">Creează clase, distribuie coduri de invitație și gestionează teme/anunțuri.</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <Badge variant="info">
                <Users className="h-4 w-4" />
                {classes.length} clase
              </Badge>
              <Badge variant="default">
                <BookOpen className="h-4 w-4" />
                Dashboard profesor
              </Badge>
            </div>
          </div>

          <Button
            onClick={() => {
              setErrorMsg(null);
              setShowCreate((v) => !v);
            }}
            className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
          >
            <Plus className="h-4 w-4" />
            Creează clasă
          </Button>
        </div>
      </div>

      {/* Copy toast */}
      {copiedCode && (
        <div className="fixed top-20 right-6 z-[60] animate-slide-in">
          <div className="relative rounded-2xl border border-cyan-500/25 bg-slate-950/70 backdrop-blur-xl px-5 py-4 shadow-2xl shadow-cyan-500/15">
            <div className="relative flex items-start gap-3">
              <div className="mt-0.5 rounded-xl bg-cyan-500/15 border border-cyan-500/25 p-2">
                <Copy className="h-5 w-5 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white">Copiat</p>
                <p className="text-sm text-slate-200/80 truncate">Cod: {copiedCode}</p>
              </div>
              <button
                className="ml-2 rounded-lg p-1 text-slate-200/70 hover:text-slate-200 hover:bg-white/5"
                onClick={() => setCopiedCode(null)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md p-6">
          <h2 className="text-xl font-bold text-white mb-4">Creează o clasă nouă</h2>

          {errorMsg && (
            <div className="mb-4 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Eroare</p>
                <p className="text-sm text-rose-200/80 break-words">{errorMsg}</p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Numele clasei</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="ex: Informatica X-A • Roadmap"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Descriere (opțional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                placeholder="Scurt context: materie, obiective, reguli..."
              />
            </div>
            <div className="flex items-center gap-3 p-4 rounded-xl border border-slate-700/70 bg-slate-900/60">
              <input
                type="checkbox"
                id="usesRoadmap"
                checked={form.usesRoadmap}
                onChange={(e) => setForm({ ...form, usesRoadmap: e.target.checked })}
                className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-2 focus:ring-cyan-500/40 cursor-pointer"
              />
              <label htmlFor="usesRoadmap" className="text-sm text-slate-300 cursor-pointer">
                Enable Educational Roadmap
              </label>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreate}
                disabled={createClass.isPending || !form.name}
                className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
              >
                {createClass.isPending ? 'Se creează...' : 'Creează'}
              </Button>
              <Button variant="secondary" onClick={() => setShowCreate(false)}>
                Închide
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {createClass.isPending && classes.length === 0 ? (
          <SkeletonLoader type="card" count={6} />
        ) : classes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md p-12 text-center">
            <div className="mx-auto mb-4 grid place-items-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-emerald-500/10 border border-cyan-500/20">
              <GraduationCap className="h-8 w-8 text-cyan-300" />
            </div>
            <p className="text-xl font-bold text-white mb-2">Nu ai clase încă</p>
            <p className="text-slate-400 mb-6">Creează o clasă și distribuie codul de invitație elevilor.</p>
            <Button
              onClick={() => setShowCreate(true)}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20"
            >
              <Plus className="h-4 w-4" />
              Creează prima clasă
            </Button>
          </div>
        ) : (
          classes.map((classItem: any) => {
            const cardBase = cn(
              'group relative rounded-2xl border backdrop-blur-md overflow-hidden transition-all duration-500 cursor-pointer',
              'bg-slate-900/70 border-slate-800/60 hover:border-cyan-500/40 hover:bg-slate-900/80'
            );
            return (
              <div key={classItem.id} className={cardBase} onClick={() => navigate(`/professor/classes/${classItem.id}`)}>
                <div className="pointer-events-none absolute -inset-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-r from-cyan-500/15 via-emerald-500/10 to-cyan-500/15 blur-2xl" />
                <div className="relative z-10 p-6">
                  <h3 className="text-xl font-bold text-white mb-2 truncate">{classItem.name}</h3>
                  {classItem.description && <p className="text-sm text-slate-400 mb-4 line-clamp-2">{classItem.description}</p>}

                  <div className="mb-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Users className="h-4 w-4 text-cyan-300/80" />
                      <span>{classItem._count?.members || 0} elevi</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <FileText className="h-4 w-4 text-cyan-300/80" />
                      <span>{classItem._count?.announcements || 0} anunțuri</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <BookOpen className="h-4 w-4 text-emerald-300/80" />
                      <span>{classItem._count?.assignments || 0} teme</span>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/60 bg-slate-950/30 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-500">Cod invitație</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyCode(classItem.invitationCode);
                        }}
                        className="text-cyan-300 hover:text-cyan-200 transition-colors"
                        aria-label="Copy invitation code"
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 rounded-xl bg-slate-900/60 border border-slate-800/60 px-3 py-2 text-sm font-mono text-white text-center">
                        {classItem.invitationCode}
                      </code>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          regenerateCode.mutateAsync(classItem.id).then(() => refetch());
                        }}
                        className="rounded-xl border border-slate-800/60 px-3 py-2 text-slate-300 hover:bg-slate-900/60 transition-colors"
                        title="Regenerează cod"
                        aria-label="Regenerate invitation code"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <Button variant="secondary" className="w-full justify-center">
                      Deschide
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ClassesPage;

