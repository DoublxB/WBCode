import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useProfile, useNotifications } from '../api/hooks';
import { authStore } from '../store/auth.store';
import { useMemo, useState } from 'react';
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
  Shield,
  MessageSquare,
  CheckCircle,
  LifeBuoy,
  BookOpen,
  Search,
  Bell,
  Settings,
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  badge?: number | boolean;
  section?: string;
}

const studentNav: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
  { to: '/code-lab', label: 'Code Lab', icon: Code2, section: 'learn' },
  { to: '/quizzes', label: 'Quizzes', icon: FileQuestion, section: 'learn' },
  { to: '/missions', label: 'Weekly Missions', icon: Target, section: 'learn' },
  { to: '/leaderboard', label: 'Leaderboard', icon: Trophy, section: 'compete' },
  { to: '/challenges', label: 'Challenges', icon: Sword, section: 'compete' },
  { to: '/classes', label: 'Classes', icon: GraduationCap, section: 'social' },
  { to: '/friends', label: 'Friends', icon: Users, section: 'social' },
  { to: '/chat', label: 'Chat', icon: MessageSquare, section: 'social' },
  { to: '/profile', label: 'Profile', icon: User, section: 'main' }
];

const professorNav: NavItem[] = [
  { to: '/professor', label: 'Dashboard', icon: LayoutDashboard, section: 'professor' },
  { to: '/professor/content', label: 'Content Builder', icon: FileEdit, section: 'professor' },
  { to: '/professor/reports', label: 'Reports', icon: FileText, section: 'professor' },
  { to: '/professor/classes', label: 'My Classes', icon: GraduationCap, section: 'professor' }
];

const adminNav: NavItem[] = [
  { to: '/admin', label: 'User Management', icon: Shield, section: 'admin' },
  { to: '/admin/approvals', label: 'Content Approvals', icon: CheckCircle, section: 'admin' },
  { to: '/admin/assignment-approvals', label: 'Assignment Approvals', icon: BookOpen, section: 'admin' },
  { to: '/admin/support', label: 'Support Tickets', icon: LifeBuoy, section: 'admin' }
];

const Navbar = () => {
  const { data: profile } = useProfile();
  const { data: notifications } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const logout = () => {
    authStore.getState().logout();
    navigate('/auth/login');
  };

  // Get notification count for a specific route
  const getNotificationCount = (route: string): number => {
    if (!notifications) return 0;
    
    if (route === '/challenges') {
      return notifications.challenges || 0;
    }
    if (route === '/classes') {
      return notifications.classes || 0;
    }
    if (route === '/chat') {
      return notifications.chat || 0;
    }
    if (route === '/missions') {
      return notifications.missions ? 1 : 0;
    }
    return 0;
  };

  // Build menu with sections
  const menuSections = useMemo(() => {
    const items: NavItem[] = [...studentNav];
    
    if (profile?.role === 'PROFESSOR' || profile?.role === 'ADMIN') {
      items.push(...professorNav);
    }
    if (profile?.role === 'ADMIN') {
      items.push(...adminNav);
    }

    // Add notification badges
    items.forEach(item => {
      item.badge = getNotificationCount(item.to);
    });

    // Group by section
    const sections: Record<string, NavItem[]> = {};
    items.forEach(item => {
      const section = item.section || 'main';
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(item);
    });

    return sections;
  }, [profile, notifications]);

  const sectionLabels: Record<string, string> = {
    main: 'Main',
    learn: 'Learn',
    compete: 'Compete',
    social: 'Social',
    professor: 'Professor',
    admin: 'Admin'
  };

  const filteredMenuSections = useMemo(() => {
    if (!searchQuery) return menuSections;
    
    const filtered: Record<string, NavItem[]> = {};
    Object.entries(menuSections).forEach(([section, items]) => {
      const filteredItems = items.filter(item =>
        item.label.toLowerCase().includes(searchQuery.toLowerCase())
      );
      if (filteredItems.length > 0) {
        filtered[section] = filteredItems;
      }
    });
    return filtered;
  }, [menuSections, searchQuery]);

  return (
    <aside className={`relative h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-slate-800/50 flex flex-col transition-all duration-300 ${isCollapsed ? 'w-20' : 'w-72'}`}>
      {/* Logo & Header */}
      <div className="p-6 border-b border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-950"></div>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-bold">WBCODE</p>
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
                Learning Hub
              </h1>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1.5 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            title={isCollapsed ? 'Expand' : 'Collapse'}
          >
            <ChevronRight className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      {!isCollapsed && (
        <div className="p-4 border-b border-slate-800/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 transition-all"
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
        {Object.entries(filteredMenuSections).map(([section, items]) => (
          <div key={section} className="space-y-1">
            {!isCollapsed && (
              <div className="px-3 py-2 mb-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {sectionLabels[section] || section}
                </span>
              </div>
            )}
            {items.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.to || 
                (item.to !== '/' && location.pathname.startsWith(item.to));
              const badgeCount = typeof item.badge === 'number' ? item.badge : (item.badge ? 1 : 0);
              
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 text-white shadow-lg shadow-primary-500/10 border border-primary-500/30'
                      : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <div className="relative">
                    <Icon
                      className={`w-5 h-5 transition-all ${
                        isActive
                          ? 'text-primary-400 scale-110'
                          : 'text-slate-400 group-hover:text-primary-400 group-hover:scale-110'
                      }`}
                    />
                    {badgeCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold shadow-lg shadow-red-500/50 animate-pulse">
                        {badgeCount > 99 ? '99+' : badgeCount}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-pulse"></div>
                      )}
                    </>
                  )}
                  {!isActive && !isCollapsed && (
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-primary-500 to-purple-500 rounded-r-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  )}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Profile & Actions */}
      <div className="p-4 border-t border-slate-800/50 space-y-3">
        {/* Notifications Summary */}
        {!isCollapsed && notifications && (
          <div className="rounded-lg bg-slate-800/30 p-3 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Bell className="w-4 h-4 text-primary-400" />
              <span className="text-xs font-semibold text-slate-400 uppercase">Notifications</span>
            </div>
            <div className="space-y-1.5">
              {(notifications.challenges > 0 || notifications.classes > 0 || notifications.chat > 0) && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-300">New items</span>
                  <span className="px-2 py-0.5 rounded-full bg-primary-500/20 text-primary-300 font-semibold">
                    {notifications.challenges + notifications.classes + notifications.chat}
                  </span>
                </div>
              )}
              {notifications.missions && (
                <div className="flex items-center gap-2 text-xs text-slate-300">
                  <Sparkles className="w-3 h-3 text-yellow-400" />
                  <span>New missions available</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User Status */}
        <div className="rounded-lg bg-slate-800/30 p-3 border border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-500 flex items-center justify-center text-white font-semibold text-xs">
                {profile?.firstName?.[0]}{profile?.lastName?.[0]}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-800"></div>
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {profile?.firstName} {profile?.lastName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-xs text-slate-400 uppercase">{profile?.role || 'STUDENT'}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          {!isCollapsed && (
            <button
              className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-slate-800/50 border border-slate-700/50 px-3 py-2 text-sm text-slate-300 hover:bg-slate-800 hover:text-white transition-all"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          )}
          <button
            onClick={logout}
            className={`flex items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400 hover:bg-red-500/20 hover:border-red-500/50 transition-all ${isCollapsed ? 'w-full' : 'flex-1'}`}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
            {!isCollapsed && <span>Sign out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Navbar;

