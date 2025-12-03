import { FormEvent, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useProfile } from '../../api/hooks';
import { api } from '../../api/client';

const avatars = [
  'https://placekitten.com/200/200',
  'https://placebear.com/200/200',
  'https://placehold.co/200x200?text=WB'
];

const titles = ['Novice Coder', 'Algorithm Explorer', 'Bug Basher', 'AI Whisperer'];

const ProfilePage = () => {
  const { data: profile, refetch } = useProfile();
  const [form, setForm] = useState({ avatarUrl: profile?.avatarUrl ?? avatars[0], title: profile?.title ?? titles[0] });
  const mutation = useMutation({
    mutationFn: async () => {
      await api.patch('/users/profile', form);
    },
    onSuccess: () => refetch()
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    mutation.mutate();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Show your style</p>
        <h1 className="text-3xl font-semibold text-white">Profile & Avatar</h1>
      </header>
      <form onSubmit={submit} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 space-y-6">
        <div>
          <p className="text-sm text-slate-400">Choose avatar</p>
          <div className="mt-3 flex gap-4">
            {avatars.map((avatar) => (
              <button
                type="button"
                key={avatar}
                onClick={() => setForm({ ...form, avatarUrl: avatar })}
                className={`rounded-full border-4 ${form.avatarUrl === avatar ? 'border-primary' : 'border-transparent'}`}
              >
                <img src={avatar} alt="" className="h-16 w-16 rounded-full" />
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-sm text-slate-400">Select title</p>
          <div className="mt-3 flex flex-wrap gap-3">
            {titles.map((title) => (
              <button
                type="button"
                key={title}
                onClick={() => setForm({ ...form, title })}
                className={`rounded-full px-4 py-2 text-sm ${
                  form.title === title ? 'bg-primary text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                {title}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          disabled={mutation.isLoading}
        >
          Save changes
        </button>
      </form>
    </div>
  );
};

export default ProfilePage;



