# WBCode Design System - Implementation Guide

This guide provides concrete implementation steps and code examples for upgrading WBCode's UI/UX.

## Quick Start

### 1. Update Tailwind Config

Create/update `frontend/tailwind.config.js`:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#6366f1',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        success: {
          DEFAULT: '#10b981',
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        },
        // Add other colors from design system
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'xp-gain': 'xp-gain 1.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'level-up': 'level-up 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'slide-in': 'slide-in 0.3s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
      },
      keyframes: {
        'xp-gain': {
          '0%': { transform: 'scale(0) rotate(-10deg)', opacity: '0' },
          '50%': { transform: 'scale(1.2) rotate(5deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '0' },
        },
        'level-up': {
          '0%': { transform: 'scale(0) rotateY(180deg)', opacity: '0' },
          '50%': { transform: 'scale(1.1) rotateY(0deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotateY(0deg)', opacity: '1' },
        },
        'slide-in': {
          'from': { transform: 'translateX(100%)', opacity: '0' },
          'to': { transform: 'translateX(0)', opacity: '1' },
        },
        'fade-in': {
          'from': { opacity: '0', transform: 'translateY(10px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
```

### 2. Update Global CSS

Add to `frontend/src/index.css`:

```css
/* Import Inter font */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* Import JetBrains Mono for code */
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600&display=swap');

/* Card base styles */
.card {
  @apply rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.card:hover {
  @apply border-primary/50;
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.1);
  transform: translateY(-2px);
}

/* Button base styles */
.btn-primary {
  @apply px-6 py-3 rounded-lg font-semibold text-white;
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.3);
  transition: all 0.2s;
}

.btn-primary:hover {
  box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
```

## Component Examples

### Persistent XP Bar Component

Create `frontend/src/components/XPBar.tsx`:

```tsx
import { useProfile } from '../api/hooks';
import { Zap } from 'lucide-react';

const XPBar = () => {
  const { data: profile } = useProfile();
  
  if (!profile) return null;
  
  const currentXP = profile.xp || 0;
  const currentLevel = profile.level || 1;
  const xpForNextLevel = currentLevel * 100;
  const xpInCurrentLevel = currentXP % 100;
  const progress = (xpInCurrentLevel / 100) * 100;
  
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-success-400" />
        <span className="text-sm font-semibold text-slate-200">
          {currentXP.toLocaleString()} XP
        </span>
      </div>
      <div className="w-32 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-success-500 to-success-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center border-2 border-slate-800">
          <span className="text-xs font-bold text-white">{currentLevel}</span>
        </div>
        <span className="text-xs text-slate-400">
          {100 - xpInCurrentLevel} to {currentLevel + 1}
        </span>
      </div>
    </div>
  );
};

export default XPBar;
```

### Level Up Celebration Modal

Create `frontend/src/components/LevelUpModal.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { X, Trophy, Sparkles } from 'lucide-react';

interface LevelUpModalProps {
  level: number;
  onClose: () => void;
}

const LevelUpModal = ({ level, onClose }: LevelUpModalProps) => {
  const [show, setShow] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 300);
    }, 3000);
    
    return () => clearTimeout(timer);
  }, [onClose]);
  
  if (!show) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative bg-slate-900 rounded-3xl border-2 border-success-500/50 p-12 max-w-md text-center animate-level-up">
        <button
          onClick={() => {
            setShow(false);
            onClose();
          }}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        
        <div className="mb-6 flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-success-500/20 rounded-full blur-2xl animate-pulse" />
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-success-500 to-success-600 flex items-center justify-center border-4 border-success-400">
              <Trophy className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-white mb-2">
          Level {level} Unlocked!
        </h2>
        <p className="text-slate-300 mb-6">
          Congratulations! You've reached a new milestone.
        </p>
        
        <div className="flex items-center justify-center gap-2 text-success-400">
          <Sparkles className="h-5 w-5" />
          <span className="font-semibold">Keep up the great work!</span>
        </div>
      </div>
    </div>
  );
};

export default LevelUpModal;
```

### Improved Stat Card

Update `frontend/src/components/StatCard.tsx`:

```tsx
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: 'primary' | 'success' | 'warning' | 'info';
}

const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendValue,
  color = 'primary'
}: StatCardProps) => {
  const colorClasses = {
    primary: 'from-primary-500/20 to-primary-600/20 border-primary-500/30',
    success: 'from-success-500/20 to-success-600/20 border-success-500/30',
    warning: 'from-warning-500/20 to-warning-600/20 border-warning-500/30',
    info: 'from-blue-500/20 to-blue-600/20 border-blue-500/30',
  };
  
  const iconColorClasses = {
    primary: 'text-primary-400',
    success: 'text-success-400',
    warning: 'text-warning-400',
    info: 'text-blue-400',
  };
  
  return (
    <div className={`card bg-gradient-to-br ${colorClasses[color]} animate-fade-in`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className={`h-5 w-5 ${iconColorClasses[color]}`} />}
          <span className="text-sm font-medium text-slate-400 uppercase tracking-wide">
            {title}
          </span>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${
            trend === 'up' ? 'text-success-400' : 
            trend === 'down' ? 'text-error-400' : 
            'text-slate-400'
          }`}>
            {trend === 'up' && '↑'}
            {trend === 'down' && '↓'}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="mb-2">
        <span className="text-3xl font-bold text-white">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </span>
      </div>
      
      {subtitle && (
        <p className="text-xs text-slate-400">{subtitle}</p>
      )}
    </div>
  );
};

export default StatCard;
```

### Streak Calendar Component

Create `frontend/src/components/StreakCalendar.tsx`:

```tsx
import { useProfile } from '../api/hooks';
import { Flame } from 'lucide-react';

const StreakCalendar = () => {
  const { data: profile } = useProfile();
  const streak = (profile as any)?.streak || 0;
  
  // Generate 49 days (7x7 grid)
  const days = Array.from({ length: 49 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (48 - i));
    return date;
  });
  
  const getIntensity = (date: Date): number => {
    // Mock: In real app, get from activity data
    const dayOfWeek = date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 0.8;
  };
  
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="h-5 w-5 text-orange-500" />
          <h3 className="text-lg font-semibold text-white">Streak</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-orange-500">{streak}</span>
          <span className="text-sm text-slate-400">days</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, i) => {
          const intensity = getIntensity(date);
          const isToday = date.toDateString() === new Date().toDateString();
          
          return (
            <div
              key={i}
              className={`aspect-square rounded ${
                intensity > 0.7
                  ? 'bg-success-500'
                  : intensity > 0.4
                  ? 'bg-success-600'
                  : intensity > 0
                  ? 'bg-success-700'
                  : 'bg-slate-800'
              } ${
                isToday ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900' : ''
              }`}
              title={date.toLocaleDateString()}
            />
          );
        })}
      </div>
      
      <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-success-700" />
          <div className="w-3 h-3 rounded bg-success-600" />
          <div className="w-3 h-3 rounded bg-success-500" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
};

export default StreakCalendar;
```

## Integration Steps

### 1. Update AppLayout Header

Add XP bar to header in `AppLayout.tsx`:

```tsx
import XPBar from '../components/XPBar';

// In the header section:
<div className="flex items-center gap-4">
  <XPBar />
  {/* Profile menu */}
</div>
```

### 2. Update Student Dashboard

Replace stat cards with improved versions:

```tsx
import StatCard from '../../components/StatCard';
import { Zap, TrendingUp, Flame, Trophy } from 'lucide-react';

// In dashboard:
<StatCard
  title="XP"
  value={profile?.xp ?? 0}
  subtitle="Earn XP by completing exercises"
  icon={Zap}
  color="success"
  trend="up"
  trendValue="+50 today"
/>
```

### 3. Add Level Up Detection

In components that award XP:

```tsx
import { useState, useEffect } from 'react';
import { useProfile } from '../api/hooks';
import LevelUpModal from '../components/LevelUpModal';

const ExercisePage = () => {
  const { data: profile, refetch } = useProfile();
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [newLevel, setNewLevel] = useState(0);
  const previousLevel = useRef(profile?.level || 1);
  
  useEffect(() => {
    if (profile?.level && profile.level > previousLevel.current) {
      setNewLevel(profile.level);
      setShowLevelUp(true);
      previousLevel.current = profile.level;
    }
  }, [profile?.level]);
  
  return (
    <>
      {/* Your content */}
      {showLevelUp && (
        <LevelUpModal
          level={newLevel}
          onClose={() => setShowLevelUp(false)}
        />
      )}
    </>
  );
};
```

## Next Steps

1. **Week 1:** Implement design system foundation (colors, typography, base components)
2. **Week 2:** Add XP bar, level up modal, improved stat cards
3. **Week 3:** Implement streak calendar, badge grid
4. **Week 4:** Redesign dashboard with new components
5. **Week 5-6:** Update all pages with new design system
6. **Week 7-8:** Polish, animations, responsive adjustments

## Testing Checklist

- [ ] All colors match design system
- [ ] Typography scale is consistent
- [ ] Animations are smooth (60fps)
- [ ] Components are accessible (keyboard navigation, screen readers)
- [ ] Responsive on mobile, tablet, desktop
- [ ] Dark mode works correctly
- [ ] Performance is good (no layout shifts)

---

**This guide should be used alongside DESIGN_SYSTEM.md for complete implementation.**








