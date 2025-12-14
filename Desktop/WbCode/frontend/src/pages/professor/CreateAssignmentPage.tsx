import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useCreateAssignment, useLessons, useQuizzes } from '../../api/hooks';
import { api } from '../../api/client';
import { ArrowLeft, Calendar } from 'lucide-react';

const CreateAssignmentPage = () => {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
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

  const handleSubmit = async () => {
    if (!classId || !form.title || !form.description) return;
    
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
  };

  const availableContent = form.contentType === 'LESSON' ? lessons :
                           form.contentType === 'QUIZ' ? quizzes :
                           form.contentType === 'CODING_EXERCISE' ? exercises : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-3xl font-semibold text-white">Create Assignment</h1>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 max-w-3xl">
        <div className="space-y-6">
          <div>
            <label className="text-sm text-slate-300 mb-2 block">Title *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              placeholder="Assignment title..."
            />
          </div>

          <div>
            <label className="text-sm text-slate-300 mb-2 block">Description *</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              placeholder="Assignment description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Type *</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as any })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
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
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
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
                  <select
                    value={form.contentId}
                    onChange={(e) => setForm({ ...form, contentId: e.target.value })}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                  >
                    <option value="">Select...</option>
                    {availableContent.map((item: any) => (
                      <option key={item.id} value={item.id}>
                        {item.title} {item.difficulty ? `(${item.difficulty})` : ''}
                      </option>
                    ))}
                  </select>
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
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              onClick={handleSubmit}
              disabled={createAssignment.isPending || !form.title || !form.description}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              {createAssignment.isPending ? 'Creating...' : 'Create Assignment'}
            </button>
            <button
              onClick={() => navigate(-1)}
              className="rounded-lg border border-slate-700 px-6 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
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
    </div>
  );
};

export default CreateAssignmentPage;

