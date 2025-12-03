import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useProfile } from '../api/hooks';
import { authStore } from '../store/auth.store';
import { useMemo } from 'react';
import {
  LayoutDashboard,
  Code2,
  FileQuestion,
  Target,
  Trophy,
  Sword,
  User,
  Users,
  GraduationCap,
  FileEdit,
  FileText,
  Shield
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/code-lab', label: 'Code Lab', icon: Code2 },
  { to: '/quizzes', label: 'Quizzes', icon: FileQuestion },
  { to: '/missions', label: 'Weekly Missions', icon: Target },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  { to: '/challenges', label: 'Challenges', icon: Sword },
  { to: '/friends', label: 'Friends', icon: Users },
  { to: '/profile', label: 'Profile', icon: User }
];

const professorNav: NavItem[] = [
  { to: '/professor', label: 'Professor Dashboard', icon: GraduationCap },
  { to: '/professor/content', label: 'Content Builder', icon: FileEdit },
  { to: '/professor/reports', label: 'Reports', icon: FileText }
];

const adminNav: NavItem[] = [{ to: '/admin', label: 'Admin Panel', icon: Shield }];

const AppLayout = () => {
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const location = useLocation();
  const logout = () => {
    authStore.getState().logout();
    navigate('/auth/login');
  };

  const menu = useMemo(() => {
    const items = [...navItems];
    if (profile?.role === 'PROFESSOR' || profile?.role === 'ADMIN') {
      items.push(...professorNav);
    }
    if (profile?.role === 'ADMIN') {
      items.push(...adminNav);
    }
    return items;
  }, [profile]);

  return (
    <div className="h-screen w-full bg-slate-950 text-slate-100 flex">
      <aside className="w-64 border-r border-slate-800 p-6 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">WBCODE</p>
          <h1 className="text-2xl font-semibold">Learning Hub</h1>
        </div>
        <nav className="flex flex-col gap-2">
          {menu.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.to || (item.to !== '/' && location.pathname.startsWith(item.to));
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={`group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-300 ease-in-out ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white hover:translate-x-1'
                }`}
              >
                <Icon
                  className={`transition-all duration-300 ${
                    isActive
                      ? 'w-5 h-5 scale-110'
                      : 'w-4 h-4 group-hover:scale-110 group-hover:text-cyan-400'
                  }`}
                />
                <span className="flex-1">{item.label}</span>
                {!isActive && (
                  <div className="absolute left-0 top-0 h-full w-1 bg-cyan-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                )}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto pt-6 border-t border-slate-800">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wide text-slate-400 mb-1">System</p>
            <p className="text-sm font-semibold text-white">{profile?.role ?? 'STUDENT'}</p>
          </div>
          <button
            onClick={logout}
            className="group w-full rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all duration-300 ease-in-out hover:translate-x-1"
          >
            Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;



