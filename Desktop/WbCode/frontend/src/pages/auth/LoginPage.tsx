import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLogin } from '../../api/hooks';
import { authStore } from '../../store/auth.store';
import { Eye, EyeOff, ArrowRight, Code2 } from 'lucide-react';

const LoginPage = () => {
  const navigate = useNavigate();
  const login = useLogin();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    try {
      const profile = await login.mutateAsync(form);
      // Backend now returns role as string, just normalize to uppercase
      const role = typeof profile?.role === 'string' ? profile.role.toUpperCase() : profile?.role;
      console.log('Login redirect - profile:', profile, 'role:', role);
      
      // Wait a moment for store to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Double-check from store
      const storeUser = authStore.getState().user;
      const storeRole = typeof storeUser?.role === 'string' ? storeUser.role.toUpperCase() : storeUser?.role;
      console.log('Login redirect - storeUser:', storeUser, 'storeRole:', storeRole);
      
      const finalRole = role || storeRole;
      // Use window.location for full page navigation to force router re-evaluation
      if (finalRole === 'ADMIN') {
        window.location.href = '/admin';
      } else if (finalRole === 'PROFESSOR') {
        window.location.href = '/professor';
      } else {
        window.location.href = '/';
      }
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Login failed. Please check your credentials.';
      setError(message);
      console.error('Login error:', error);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-4">
      <div
        className="relative w-full max-w-md"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Animated neon border */}
        <div className="absolute inset-0 rounded-2xl opacity-75">
          <div className="absolute inset-0 rounded-2xl">
            {/* Top border - pink/red gradient */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-pink-500 via-red-500 to-transparent opacity-80 blur-sm"
              style={{
                animation: 'glow-top 3s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(236, 72, 153, 0.5), 0 0 20px rgba(236, 72, 153, 0.3)'
              }}
            />
            {/* Bottom border - cyan/blue gradient */}
            <div
              className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-transparent opacity-80 blur-sm"
              style={{
                animation: 'glow-bottom 3s ease-in-out infinite',
                boxShadow: '0 0 10px rgba(6, 182, 212, 0.5), 0 0 20px rgba(6, 182, 212, 0.3)'
              }}
            />
          </div>
        </div>

        {/* Main container */}
        <div
          className={`relative rounded-2xl border border-slate-800 bg-slate-950/90 backdrop-blur-sm transition-all duration-700 ease-in-out ${
            isHovered ? 'p-8 shadow-2xl shadow-slate-900/60' : 'p-6'
          }`}
          style={{
            transform: isHovered ? 'scale(1.02)' : 'scale(1)',
            transition: 'all 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
          }}
        >
          {!isHovered ? (
            /* Button state */
            <button
              type="button"
              className="w-full relative overflow-hidden rounded-xl bg-slate-900/50 border border-slate-700/50 px-8 py-4 transition-all duration-500 ease-in-out hover:border-slate-600"
              style={{
                transform: 'translateY(0)',
                opacity: 1,
                transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div className="flex items-center justify-center gap-3">
                <ArrowRight className="text-pink-500 w-5 h-5 animate-pulse" />
                <span className="text-xl font-semibold text-white tracking-wide">LOGIN</span>
                <Code2 className="text-cyan-500 w-5 h-5 animate-pulse" />
              </div>
              {/* Animated background gradient */}
              <div className="absolute inset-0 opacity-0 hover:opacity-20 transition-opacity duration-500 ease-in-out bg-gradient-to-r from-pink-500/20 via-cyan-500/20 to-pink-500/20 animate-shimmer" />
            </button>
          ) : (
            /* Form state */
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              style={{
                animation: 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <ArrowRight className="text-pink-500 w-5 h-5" />
                <h1 className="text-2xl font-semibold text-white tracking-wide">LOGIN</h1>
                <Code2 className="text-cyan-500 w-5 h-5" />
              </div>

              {error && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/50 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}

              {/* Email field */}
              <label 
                className="block text-sm"
                style={{
                  animation: 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.1s both'
                }}
              >
                <span className="text-slate-300 mb-2 block">Username</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Username"
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                  required
                  autoFocus
                />
              </label>

              {/* Password field */}
              <label 
                className="block text-sm"
                style={{
                  animation: 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.2s both'
                }}
              >
                <span className="text-slate-300 mb-2 block">Password</span>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Password"
                    className="w-full rounded-lg border border-slate-700 bg-slate-900/50 px-4 py-3 pr-10 text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 transition-all duration-300"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors duration-300"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {/* Sign in button */}
              <button
                type="submit"
                className="w-full rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-400 disabled:opacity-50 transition-all duration-300 shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50"
                disabled={login.isPending}
                style={{
                  animation: 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.3s both'
                }}
              >
                Sign in
              </button>

              {/* Footer links */}
              <div 
                className="flex items-center justify-between text-sm"
                style={{
                  animation: 'fadeInUp 0.7s cubic-bezier(0.4, 0, 0.2, 1) 0.4s both'
                }}
              >
                <Link to="/auth/forgot-password" className="text-primary hover:text-primary/80 transition-colors duration-300">
                  Forgot Password
                </Link>
                <Link to="/auth/register" className="text-pink-500 hover:text-pink-400 transition-colors duration-300 font-medium">
                  Sign up
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      <style>{`
        @keyframes glow-top {
          0%, 100% {
            opacity: 0.6;
            transform: translateX(-10px);
          }
          50% {
            opacity: 1;
            transform: translateX(10px);
          }
        }
        
        @keyframes glow-bottom {
          0%, 100% {
            opacity: 0.6;
            transform: translateX(10px);
          }
          50% {
            opacity: 1;
            transform: translateX(-10px);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-shimmer {
          background-size: 200% auto;
          animation: shimmer 4s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
