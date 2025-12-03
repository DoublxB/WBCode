import { FormEvent, useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useResetPassword } from '../../api/hooks';
import { Code2, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const resetPassword = useResetPassword();
  const [form, setForm] = useState({ token: '', newPassword: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setForm((prev) => ({ ...prev, token }));
    } else {
      setError('Invalid reset link. Please request a new one.');
    }
  }, [searchParams]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    if (form.newPassword !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.newPassword.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      await resetPassword.mutateAsync({
        token: form.token,
        newPassword: form.newPassword
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/auth/login');
      }, 2000);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to reset password. The link may have expired.';
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-slate-950 to-indigo-900">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl shadow-slate-900/60 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <Code2 className="h-8 w-8 text-green-500" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Password Reset Successful!</h1>
          <p className="text-sm text-slate-400">
            Your password has been reset. Redirecting to login...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-slate-950 to-indigo-900">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl shadow-slate-900/60"
      >
        <div className="flex items-center gap-3">
          <Code2 className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-semibold text-white">New Password</h1>
        </div>
        <p className="text-sm text-slate-400">
          Enter your new password below.
        </p>
        
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <label className="text-sm text-slate-300">
          New Password
          <div className="relative mt-1">
            <input
              type={showPassword ? 'text' : 'password'}
              value={form.newPassword}
              onChange={(e) => setForm({ ...form, newPassword: e.target.value })}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-white focus:border-primary focus:outline-none"
              placeholder="At least 8 characters"
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

        <label className="text-sm text-slate-300">
          Confirm Password
          <div className="relative mt-1">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              required
              minLength={8}
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-10 text-white focus:border-primary focus:outline-none"
              placeholder="Confirm your password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          disabled={resetPassword.isLoading || !form.token}
        >
          {resetPassword.isLoading ? 'Resetting...' : 'Reset Password'}
        </button>

        <p className="text-center text-xs text-slate-500">
          <Link to="/auth/login" className="text-primary underline">
            Back to Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ResetPasswordPage;

