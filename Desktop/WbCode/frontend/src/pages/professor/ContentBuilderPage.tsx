import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { api } from '../../api/client';

const ContentBuilderPage = () => {
  const [lessonForm, setLessonForm] = useState({
    title: '',
    description: '',
    content: '',
    difficulty: 'Beginner'
  });
  const createLesson = useMutation({
    mutationFn: () =>
      api.post('/lessons', {
        ...lessonForm,
        tags: ['curriculum']
      }),
    onSuccess: () => setLessonForm({ title: '', description: '', content: '', difficulty: 'Beginner' })
  });

  const submitLesson = (event: FormEvent) => {
    event.preventDefault();
    createLesson.mutate();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Create lessons & challenges</p>
        <h1 className="text-3xl font-semibold text-white">Professor Content Builder</h1>
      </header>
      <form onSubmit={submitLesson} className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 space-y-4">
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
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={createLesson.isLoading}
        >
          Publish lesson
        </button>
      </form>
    </div>
  );
};

export default ContentBuilderPage;



