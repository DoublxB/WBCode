import { FormEvent, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../api/client';
import { useSubmitForApproval } from '../../api/hooks';
import { PageHeader } from '../../components/ui/page-header';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader } from '../../components/ui/card';
import { PenLine } from 'lucide-react';

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
      <PageHeader
        eyebrow="Create lessons & challenges"
        title="Content Builder"
        subtitle="Creează lecții în Markdown și trimite-le la approval. Totul e păstrat în stilul WBCode (glass + focus)."
        icon={PenLine}
      />

      <Card className="bg-slate-900/40 border-white/5">
        <CardHeader>
          <h2 className="text-xl font-semibold text-white">New Lesson</h2>
        </CardHeader>
        <CardContent>
          <form className="space-y-4">
        <input
          type="text"
          value={lessonForm.title}
          onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
          placeholder="Lesson title"
          className="w-full rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-white"
          required
        />
        <textarea
          value={lessonForm.description}
          onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
          placeholder="Short description"
          className="w-full rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-white"
          required
        />
        <textarea
          value={lessonForm.content}
          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
          placeholder="Markdown content"
          className="w-full rounded-lg border border-white/5 bg-slate-950/50 px-3 py-2 text-sm text-white font-mono"
          rows={6}
          required
        />
        <div className="flex gap-3">
          <Button
            onClick={(e) => handleSubmit(e, false)}
            variant="secondary"
            disabled={createLesson.isPending || submitForApproval.isPending}
          >
            Save draft
          </Button>
          <Button
            onClick={(e) => handleSubmit(e, true)}
            disabled={createLesson.isPending || submitForApproval.isPending}
          >
            Submit for approval
          </Button>
        </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentBuilderPage;



