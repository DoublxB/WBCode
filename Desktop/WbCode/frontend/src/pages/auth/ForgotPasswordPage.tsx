import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForgotPassword } from '../../api/hooks';
import { Code2 } from 'lucide-react';

const ForgotPasswordPage = () => {
  const forgotPassword = useForgotPassword();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSuccess(false);
    try {
      await forgotPassword.mutateAsync({ email });
      setSuccess(true);
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to send reset email. Please try again.';
      setError(message);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-purple-900 via-slate-950 to-indigo-900">
        <div className="w-full max-w-md space-y-4 rounded-2xl border border-slate-800 bg-slate-950/80 p-8 shadow-xl shadow-slate-900/60 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Code2 className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-semibold text-white">Check Your Email</h1>
          <p className="text-sm text-slate-400">
            If an account with that email exists, we've sent you a password reset link.
          </p>
          <p className="text-xs text-slate-500">
            The link will expire in 1 hour.
          </p>
          <Link
            to="/auth/login"
            className="mt-4 inline-block text-sm text-primary underline hover:text-primary/80"
          >
            Back to Login
          </Link>
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
          <h1 className="text-3xl font-semibold text-white">Reset Password</h1>
        </div>
        <p className="text-sm text-slate-400">
          Enter your email address and we'll send you a link to reset your password.
        </p>
        
        {error && (
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <label className="text-sm text-slate-300">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white focus:border-primary focus:outline-none"
            placeholder="your.email@example.com"
          />
        </label>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
          disabled={forgotPassword.isLoading}
        >
          {forgotPassword.isLoading ? 'Sending...' : 'Send Reset Link'}
        </button>

        <p className="text-center text-xs text-slate-500">
          Remember your password?{' '}
          <Link to="/auth/login" className="text-primary underline">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
};

export default ForgotPasswordPage;

