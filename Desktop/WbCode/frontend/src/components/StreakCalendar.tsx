import { Flame } from 'lucide-react';

type StreakCalendarProps = {
  streak?: number;
};

const StreakCalendar = ({ streak = 0 }: StreakCalendarProps) => {
  
  // Generate 49 days (7x7 grid) - last 49 days
  const days = Array.from({ length: 49 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (48 - i));
    return date;
  });
  
  // Mock function - in real app, get from activity data
  const getIntensity = (date: Date): number => {
    const dayOfWeek = date.getDay();
    const daysAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    // Simulate activity: more recent = more activity
    if (daysAgo === 0) return 1.0; // Today
    if (daysAgo <= streak) return 0.8; // Within streak
    if (dayOfWeek === 0 || dayOfWeek === 6) return 0.2; // Weekends less active
    return 0.4; // Default
  };
  
  const getColorClass = (intensity: number): string => {
    if (intensity > 0.7) return 'bg-success-500';
    if (intensity > 0.4) return 'bg-success-600';
    if (intensity > 0) return 'bg-success-700';
    return 'bg-slate-800';
  };
  
  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6 shadow-lg">
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
      
      <div className="grid grid-cols-7 gap-1 mb-4">
        {days.map((date, i) => {
          const intensity = getIntensity(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const colorClass = getColorClass(intensity);
          
          return (
            <div
              key={i}
              className={`aspect-square rounded ${
                colorClass
              } ${
                isToday ? 'ring-2 ring-orange-500 ring-offset-2 ring-offset-slate-900' : ''
              } transition-all hover:scale-110 cursor-pointer`}
              title={`${date.toLocaleDateString()} - ${intensity > 0 ? 'Active' : 'No activity'}`}
            />
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-400">
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

