import { create } from 'zustand';

export type Role = 'STUDENT' | 'PROFESSOR' | 'ADMIN';

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  xp: number;
  level: number;
  wbcCoins?: number;
  streak?: number;
  badges?: any[];
  avatarUrl?: string | null;
  title?: string | null;
  bio?: string | null;
  cosmeticsEquipped?: Record<string, string | null>;
}

type AuthState = {
  user?: UserProfile;
  accessToken?: string;
  refreshToken?: string;
  isAuthenticated: boolean;
  setSession: (payload: { accessToken: string; refreshToken: string; user: UserProfile }) => void;
  logout: () => void;
};

const persisted =
  typeof window !== 'undefined' ? localStorage.getItem('wbcode_auth') : undefined;
const parsed = persisted ? (JSON.parse(persisted) as any) : {};
// Transform role from object to string if needed when loading from localStorage
const initial = parsed.user
  ? {
      ...parsed,
      user: {
        ...parsed.user,
        role: typeof parsed.user.role === 'string' ? parsed.user.role.toUpperCase() : parsed.user.role
      }
    }
  : parsed;

export const authStore = create<AuthState>((set) => ({
  user: initial.user,
  accessToken: initial.accessToken,
  refreshToken: initial.refreshToken,
  isAuthenticated: Boolean(initial.accessToken),
  setSession: ({ accessToken, refreshToken, user }) => {
      // Backend now returns role as string, just normalize to uppercase
      const normalizedRole = (typeof user.role === 'string' ? user.role.toUpperCase() : user.role) as Role;
      const userWithStringRole: UserProfile = {
        ...user,
        role: normalizedRole
      };
    const payload = { accessToken, refreshToken, user: userWithStringRole };
    localStorage.setItem('wbcode_auth', JSON.stringify(payload));
    set({ accessToken, refreshToken, user: userWithStringRole, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('wbcode_auth');
    set({ user: undefined, accessToken: undefined, refreshToken: undefined, isAuthenticated: false });
  }
}));

