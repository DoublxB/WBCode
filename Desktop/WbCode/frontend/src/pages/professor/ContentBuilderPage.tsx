import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useSubmitForApproval } from '../../api/hooks';

const ContentBuilderPage = () => {
  const queryClient = useQueryClient();
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    difficulty: 'Beginner'
  });
  const submitForApproval = useSubmitForApproval();
  const createLesson = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/lessons', {
        ...lessonForm,
        tags: ['curriculum']
      });
      return data;
    },
    onSuccess: () => setLessonForm({ title: '', description: '', content: '', difficulty: 'Beginner' })
  });

  const handleSubmit = async (event: FormEvent, withApproval: boolean) => {
    event.preventDefault();
    const created = await createLesson.mutateAsync();
    if (withApproval && created?.id) {
      await submitForApproval.mutateAsync({
        contentType: 'LESSON',
        contentId: created.id
      });
      // Refresh pending approvals lists for admin and submissions list for professor
      queryClient.invalidateQueries({ queryKey: ['pending-approvals'] });
      queryClient.invalidateQueries({ queryKey: ['my-submissions'] });
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Create lessons & challenges</p>
        <h1 className="text-3xl font-semibold text-white">Professor Content Builder</h1>
      </header>
      <form className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
        <h2 className="text-xl font-semibold text-white">New Lesson</h2>
        <input
          type="text"
          value={lessonForm.title}
          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
          placeholder="Lesson title"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          required
        />
        <textarea
          value={lessonForm.description}
          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
          placeholder="Short description"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          required
        />
        <textarea
          value={lessonForm.content}
          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
          placeholder="Markdown content"
          className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
          rows={6}
          required
        />
        <div className="flex gap-3">
          <button
            onClick={(e) => handleSubmit(e, false)}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-50"
            disabled={createLesson.isPending || submitForApproval.isPending}
          >
            Save draft
          </button>
          <button
            onClick={(e) => handleSubmit(e, true)}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
            disabled={createLesson.isPending || submitForApproval.isPending}
          >
            Submit for approval
          </button>
        </div>
      </form>
    </div>
  );
};

export default ContentBuilderPage;



