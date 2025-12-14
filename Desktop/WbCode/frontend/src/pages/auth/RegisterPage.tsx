import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegister } from '../../api/hooks';
import { authStore } from '../../store/auth.store';
import { Eye, EyeOff } from 'lucide-react';

const RegisterPage = () => {
  const navigate = useNavigate();
  const registerMutation = useRegister();
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const profile = await registerMutation.mutateAsync(form);
    // Backend now returns role as string, just normalize to uppercase
    const role = typeof profile?.role === 'string' ? profile.role.toUpperCase() : profile?.role;
    
    // Wait a moment for store to update
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Double-check from store
    const storeUser = authStore.getState().user;
    const storeRole = typeof storeUser?.role === 'string' ? storeUser.role.toUpperCase() : storeUser?.role;
    
    const finalRole = role || storeRole;
    // Use window.location for full page navigation to force router re-evaluation
    if (finalRole === 'ADMIN') {
      window.location.href = '/admin';
    } else if (finalRole === 'PROFESSOR') {
      window.location.href = '/professor';
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-slate-950 to-indigo-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl shadow-slate-900/60"
      >
        <h1 className="text-3xl font-semibold text-white">Join WBCode</h1>
        <p className="text-sm text-slate-400">Track progress, earn badges, compete with friends.</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-sm text-slate-300">
            First name
            <input
              type="text"
              value={form.firstName}
              onChange={(e) => setForm({ ...form, firstName: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </label>
          <label className="text-sm text-slate-300">
            Last name
            <input
              type="text"
              value={form.lastName}
              onChange={(e) => setForm({ ...form, lastName: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
            />
          </label>
        </div>
        <label className="text-sm text-slate-300">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
          />
        </label>
        <label className="text-sm text-slate-300">
          Password
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-white focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>
        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          disabled={registerMutation.isPending}
        >
          Create account
        </button>
        <p className="text-center text-xs text-slate-500">
          Already learning?{' '}
          <Link to="/auth/login" className="text-primary underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;



