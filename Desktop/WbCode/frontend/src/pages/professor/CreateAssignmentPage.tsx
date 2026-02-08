import { useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCreateAssignment, useLessons, useQuizzes } from '../../api/hooks';
import { api } from '../../api/client';
import { ArrowLeft, Calendar, Search, Filter, BookOpen, Code2, GraduationCap, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { cn } from '../../lib/utils';
import { EDUCATION_CURRICULUM } from '../../data/education-curriculum';

const CreateAssignmentPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const createAssignment = useCreateAssignment();
  const { data: lessons = [] } = useLessons();
  const { data: quizzes = [] } = useQuizzes();
  
  const { data: exercises = [] } = useQuery({
    queryKey: ['coding'],
    queryFn: async () => {
      const { data } = await api.get('/coding');
      return data as any[];
    }
  });

  const [form, setForm] = useState({
    title: '',
    description: '',
    type: 'PROBLEM' as 'PROBLEM' | 'HOMEWORK' | 'MATERIAL',
    difficulty: 'Beginner',
    contentType: '' as '' | 'LESSON' | 'QUIZ' | 'CODING_EXERCISE',
    contentId: '',
    dueDate: ''
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Picker state (CODING_EXERCISE)
  const shouldAutoOpenPicker = searchParams.get('picker') === '1';
  const [showPicker, setShowPicker] = useState<boolean>(shouldAutoOpenPicker);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerDifficulty, setPickerDifficulty] = useState<'all' | 'Beginner' | 'Intermediate' | 'Advanced'>('all');
  const [activeTrackId, setActiveTrackId] = useState<string>(EDUCATION_CURRICULUM[0]?.id || '');
  const [activeSubtopicId, setActiveSubtopicId] = useState<string>(EDUCATION_CURRICULUM[0]?.subtopics?.[0]?.id || '');

  const handleSubmit = async () => {
    if (!classId || !form.title || !form.description) return;
    
    try {
      setErrorMsg(null);
      await createAssignment.mutateAsync({
        classId: parseInt(classId),
        title: form.title,
        description: form.description,
        type: form.type,
        difficulty: form.difficulty,
        contentId: form.contentId ? parseInt(form.contentId) : undefined,
        contentType: form.contentType || undefined,
        dueDate: form.dueDate || undefined
      });
      navigate(`/professor/classes/${classId}`);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.message || 'Nu am putut crea tema.');
    }
  };

  const availableContent = form.contentType === 'LESSON' ? lessons :
                           form.contentType === 'QUIZ' ? quizzes :
                           form.contentType === 'CODING_EXERCISE' ? exercises : [];

  const activeTrack = useMemo(() => EDUCATION_CURRICULUM.find((t) => t.id === activeTrackId) || EDUCATION_CURRICULUM[0], [activeTrackId]);
  const activeSubtopic = useMemo(
    () => activeTrack?.subtopics?.find((s) => s.id === activeSubtopicId) || activeTrack?.subtopics?.[0],
    [activeTrack, activeSubtopicId]
  );

  const normalize = (v: any) => String(v || '').toLowerCase().trim();

  const matchesSubtopic = (ex: any, sub: any) => {
    const cat = normalize(ex?.category);
    const matchCats = (sub?.matchCategories || []).map((c: string) => normalize(c));
    if (matchCats.length) {
      return matchCats.includes(cat);
    }
    const kw = (sub?.matchKeywords || []).map((k: string) => normalize(k)).filter(Boolean);
    if (!kw.length) return false;
    const hay = `${cat} ${normalize(ex?.title)} ${normalize(ex?.prompt)}`;
    return kw.some((k: string) => hay.includes(k));
  };

  const subtopicCounts = useMemo(() => {
    const list = exercises || [];
    const counts: Record<string, number> = {};
    for (const t of EDUCATION_CURRICULUM) {
      for (const s of t.subtopics) {
        const n = list.filter((ex: any) => matchesSubtopic(ex, s)).length;
        counts[s.id] = n;
      }
    }
    return counts;
  }, [exercises]);

  const filteredExercises = useMemo(() => {
    const list = exercises || [];
    const query = normalize(pickerQuery);
    const cat = normalize((activeSubtopic as any)?.matchCategories?.[0]);
    return list
      .filter((ex: any) => {
        const d = String(ex?.difficulty || '').toLowerCase();
        const mapped =
          d.includes('easy') || d.includes('beginner') ? 'Beginner' : d.includes('medium') || d.includes('intermediate') ? 'Intermediate' : 'Advanced';
        if (pickerDifficulty !== 'all' && mapped !== pickerDifficulty) return false;

        // Prefer strict category match when available, to avoid counting unrelated problems.
        if (activeSubtopic && !matchesSubtopic(ex, activeSubtopic)) return false;

        const hay = `${normalize(ex?.category)} ${normalize(ex?.title)} ${normalize(ex?.prompt)}`;
        if (query && !hay.includes(query)) return false;
        return true;
      })
      .slice(0, 80);
  }, [activeSubtopic, exercises, pickerDifficulty, pickerQuery]);

  const pickExercise = (ex: any) => {
    const d = String(ex?.difficulty || '').toLowerCase();
    const mapped =
      d.includes('easy') || d.includes('beginner') ? 'Beginner' : d.includes('medium') || d.includes('intermediate') ? 'Intermediate' : 'Advanced';

    const topicLabel = activeSubtopic ? `${activeTrack?.title} • ${activeSubtopic.title}` : undefined;
    setForm((prev) => ({
      ...prev,
      type: prev.type === 'MATERIAL' ? 'PROBLEM' : prev.type,
      difficulty: mapped,
      contentType: 'CODING_EXERCISE',
      contentId: String(ex?.id || ''),
      title: ex?.title || prev.title,
      description: topicLabel ? `[Edu: ${topicLabel}]\n\nRezolvă problema: ${ex?.title || ''}` : `Rezolvă problema: ${ex?.title || ''}`
    }));
    setShowPicker(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate(-1)} className="rounded-xl">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <h1 className="text-3xl md:text-4xl font-bold text-white">Creează temă</h1>
          <p className="text-sm text-slate-400 mt-1">Poți crea o temă custom sau selecta direct din problemele existente pe platformă.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 backdrop-blur-md p-6 max-w-4xl">
        <div className="space-y-6">
          {errorMsg && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-rose-200 flex items-start gap-3">
              <ShieldAlert className="h-5 w-5 mt-0.5" />
              <div className="min-w-0">
                <p className="font-semibold text-white">Eroare</p>
                <p className="text-sm text-rose-200/80 break-words">{errorMsg}</p>
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Titlu temă..."
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
              placeholder="Descriere..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
              >
                <option value="PROBLEM">Problem</option>
                <option value="HOMEWORK">Homework</option>
                <option value="MATERIAL">Material</option>
              </select>
            </div>

            <div>
              <label className="text-sm text-slate-300 mb-2 block">Difficulty *</label>
              <select
                value={form.difficulty}
                onChange={(e) => setForm({ ...form, difficulty: e.target.value })}
                className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          {(form.type === 'PROBLEM' || form.type === 'HOMEWORK') && (
            <>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Content Type (Optional)</label>
                <select
                  value={form.contentType}
                  onChange={(e) => setForm({ ...form, contentType: e.target.value as any, contentId: '' })}
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
                >
                  <option value="">None - Custom Assignment</option>
                  <option value="LESSON">Lesson</option>
                  <option value="QUIZ">Quiz</option>
                  <option value="CODING_EXERCISE">Coding Exercise</option>
                </select>
              </div>

              {form.contentType && (
                <div>
                  <label className="text-sm text-slate-300 mb-2 block">
                    Select {form.contentType === 'LESSON' ? 'Lesson' : form.contentType === 'QUIZ' ? 'Quiz' : 'Coding Exercise'}
                  </label>
                  {form.contentType === 'CODING_EXERCISE' ? (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          variant="secondary"
                          onClick={() => {
                            setShowPicker(true);
                          }}
                        >
                          <Code2 className="h-4 w-4" />
                          Alege din problemele existente
                        </Button>
                        {form.contentId && (
                          <Badge variant="success">
                            <CheckCircle2 className="h-4 w-4" />
                            Selectat: #{form.contentId}
                          </Badge>
                        )}
                      </div>

                      <select
                        value={form.contentId}
                        onChange={(e) => setForm({ ...form, contentId: e.target.value })}
                        className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
                      >
                        <option value="">Selectează rapid (listă simplă)...</option>
                        {availableContent.map((item: any) => (
                          <option key={item.id} value={item.id}>
                            {item.title} {item.difficulty ? `(${item.difficulty})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <select
                      value={form.contentId}
                      onChange={(e) => setForm({ ...form, contentId: e.target.value })}
                      className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
                    >
                      <option value="">Select...</option>
                      {availableContent.map((item: any) => (
                        <option key={item.id} value={item.id}>
                          {item.title} {item.difficulty ? `(${item.difficulty})` : ''}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </>
          )}

          <div>
            <label className="text-sm text-slate-300 mb-2 block flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Due Date (Optional)
            </label>
            <input
              type="datetime-local"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 px-4 py-3 text-white"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={createAssignment.isPending || !form.title || !form.description}
              className="bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-white shadow-lg shadow-cyan-500/20 px-6"
            >
              {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
            </Button>
            <Button variant="secondary" onClick={() => navigate(-1)} className="px-6">
              Cancel
            </Button>
          </div>

          {(form.type === 'PROBLEM' || form.type === 'HOMEWORK') && (
            <div className="rounded-lg border border-yellow-500/40 bg-yellow-500/10 p-4">
              <p className="text-sm text-yellow-200">
                <strong>Note:</strong> This assignment will be submitted for admin approval to verify the difficulty level matches the content.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Problem picker modal (CODING_EXERCISE) */}
      {showPicker && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-[min(1100px,96vw)] h-[min(720px,88vh)] overflow-hidden rounded-2xl border border-cyan-500/25 bg-slate-950/70 backdrop-blur-xl shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center gap-3">
              <div className="p-3 rounded-xl bg-gradient-to-br from-cyan-500/20 to-emerald-500/10 border border-cyan-500/25">
                <GraduationCap className="h-6 w-6 text-cyan-300" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold tracking-[0.22em] text-cyan-300/80">PROBLEME EXISTENTE</div>
                <div className="text-xl font-bold text-white">Selectează o problemă pentru temă</div>
                <div className="text-sm text-slate-400">Filtrat după curriculum (RO) + căutare.</div>
              </div>
              <Button variant="secondary" className="ml-auto" onClick={() => setShowPicker(false)}>
                <X className="h-4 w-4" />
                Închide
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 h-full">
              {/* Left: curriculum */}
              <div className="md:col-span-2 border-r border-white/10 overflow-auto">
                <div className="p-4 space-y-3">
                  {EDUCATION_CURRICULUM.map((t) => {
                    const active = t.id === activeTrackId;
                    return (
                      <div key={t.id} className={cn('rounded-2xl border overflow-hidden', active ? 'border-cyan-500/30 bg-cyan-500/5' : 'border-slate-800/60 bg-slate-950/25')}>
                        <button
                          className="w-full text-left p-4"
                          onClick={() => {
                            setActiveTrackId(t.id);
                            setActiveSubtopicId(t.subtopics?.[0]?.id || '');
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-white font-bold truncate">{t.title}</div>
                              <div className="text-xs text-slate-500 mt-1">{t.grade}</div>
                              <div className="text-xs text-slate-400 mt-1 line-clamp-2">{t.focus}</div>
                            </div>
                            <Badge variant="default">{t.totalTargetProblems}</Badge>
                          </div>
                        </button>
                        {active && (
                          <div className="px-4 pb-4 space-y-2">
                            {t.subtopics.map((s) => {
                              const isActive = s.id === activeSubtopicId;
                              const have = subtopicCounts[s.id] || 0;
                              const pct = s.targetProblems > 0 ? Math.min(100, Math.round((have / s.targetProblems) * 100)) : 0;
                              return (
                                <button
                                  key={s.id}
                                  className={cn(
                                    'w-full text-left rounded-xl border p-3 transition-colors',
                                    isActive ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-slate-800/60 bg-slate-950/20 hover:bg-slate-950/30'
                                  )}
                                  onClick={() => setActiveSubtopicId(s.id)}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="min-w-0">
                                      <div className="text-sm font-semibold text-white truncate">{s.title}</div>
                                      <div className="text-xs text-slate-500 mt-1">
                                        {have}/{s.targetProblems} existente • {pct}%
                                      </div>
                                    </div>
                                    <Badge variant={pct >= 100 ? 'success' : pct >= 50 ? 'warning' : 'default'}>{have}</Badge>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right: list */}
              <div className="md:col-span-3 overflow-auto">
                <div className="p-4 space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <input
                        value={pickerQuery}
                        onChange={(e) => setPickerQuery(e.target.value)}
                        placeholder="Caută în titlu/categorie/prompt..."
                        className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 pl-10 pr-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      />
                    </div>
                    <div className="sm:w-[220px]">
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <select
                          value={pickerDifficulty}
                          onChange={(e) => setPickerDifficulty(e.target.value as any)}
                          className="w-full rounded-xl border border-slate-700/70 bg-slate-900/60 pl-10 pr-4 py-3 text-white"
                        >
                          <option value="all">Toate dificultățile</option>
                          <option value="Beginner">Beginner</option>
                          <option value="Intermediate">Intermediate</option>
                          <option value="Advanced">Advanced</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800/60 bg-slate-950/25 p-4">
                    <div className="text-sm text-slate-300">
                      <span className="font-semibold text-white">Filtru:</span>{' '}
                      {activeTrack?.title} • {activeSubtopic?.title}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      Găsite: <span className="font-semibold text-slate-200">{filteredExercises.length}</span> (max 80 afișate)
                    </div>
                  </div>

                  {filteredExercises.length === 0 ? (
                    <div className="rounded-2xl border border-slate-800/60 bg-slate-950/25 p-10 text-center">
                      <p className="text-white font-semibold">Nu am găsit probleme pentru filtrul ales</p>
                      <p className="text-sm text-slate-500 mt-2">Schimbă subcapitolul sau caută după cuvinte cheie.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredExercises.map((ex: any) => (
                        <button
                          key={ex.id}
                          className="w-full text-left rounded-2xl border border-slate-800/60 bg-slate-950/30 hover:bg-slate-950/40 hover:border-cyan-500/25 transition-colors p-4"
                          onClick={() => pickExercise(ex)}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="text-white font-bold truncate">{ex.title}</div>
                              <div className="text-xs text-slate-500 mt-1 truncate">
                                #{ex.id} • {ex.category || 'fără categorie'} • {ex.language || 'LANG'}
                              </div>
                              <div className="text-sm text-slate-400 mt-2 line-clamp-2">{ex.prompt}</div>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <Badge variant="info">
                                <Code2 className="h-4 w-4" />
                                Coding
                              </Badge>
                              {ex.difficulty && <Badge variant="default">{ex.difficulty}</Badge>}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreateAssignmentPage;

