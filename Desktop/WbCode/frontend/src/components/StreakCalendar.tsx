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
  
  const getColorClass = (intensity: number, isToday: boolean): string => {
    // PORTOCALIU pentru ziua curentă (recompensă), VERDE pentru activitate
    if (isToday) return 'bg-gradient-to-br from-amber-500 to-orange-500 shadow-lg shadow-amber-500/50 animate-pulse';
    if (intensity > 0.7) return 'bg-gradient-to-br from-green-500 to-emerald-500 hover:shadow-lg hover:shadow-green-500/50';
    if (intensity > 0.4) return 'bg-gradient-to-br from-green-600 to-emerald-600';
    if (intensity > 0) return 'bg-gradient-to-br from-green-700 to-emerald-700';
    return 'bg-slate-800 border border-slate-700';
  };
  
  return (
    <div className="group relative rounded-2xl border-2 border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-amber-500/10 backdrop-blur-sm p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:border-amber-400/50">
      {/* Animated background glow - PORTOCALIU pentru recompensă */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500/30 to-orange-500/30 group-hover:scale-110 transition-transform duration-300">
            <Flame className="h-6 w-6 text-amber-400 drop-shadow-lg animate-pulse" />
          </div>
          <h3 className="text-lg font-bold text-white">Streak</h3>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-400/40">
          <span className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 drop-shadow-lg animate-float">
            {streak}
          </span>
          <span className="text-sm text-slate-300 font-semibold">days</span>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-1.5 mb-4">
        {days.map((date, i) => {
          const intensity = getIntensity(date);
          const isToday = date.toDateString() === new Date().toDateString();
          const colorClass = getColorClass(intensity, isToday);
          
          return (
            <div
              key={i}
              className={`aspect-square rounded-lg transition-all duration-300 cursor-pointer hover:scale-125 hover:z-10 ${
                colorClass
              } ${
                isToday ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-900 animate-pulse' : ''
              }`}
              title={`${date.toLocaleDateString()} - ${intensity > 0 ? 'Active' : 'No activity'}`}
            />
          );
        })}
      </div>
      
      <div className="flex items-center justify-between text-xs text-slate-300">
        <span className="font-semibold">Less</span>
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-700 to-emerald-700" />
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-600 to-emerald-600" />
          <div className="w-3 h-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg shadow-green-500/50" />
        </div>
        <span className="font-semibold">More</span>
      </div>
    </div>
  );
};

export default StreakCalendar;

