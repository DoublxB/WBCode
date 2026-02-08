import { useProfile } from '../api/hooks';

interface ActivityGraphProps {
  weeks?: number;
}

const ActivityGraph = ({ weeks = 52 }: ActivityGraphProps) => {
  const { data: profile } = useProfile();
  
  // Generate weeks data (mock - in real app, get from API)
  const generateWeeks = () => {
    const weekData: { date: Date; intensity: number }[] = [];
    const now = new Date();
    
    for (let i = weeks - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - (i * 7));
      
      // Mock intensity based on day of week and randomness
      const dayOfWeek = date.getDay();
      const random = Math.random();
      let intensity = 0;
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        intensity = random * 0.3; // Weekends less active
      } else {
        intensity = 0.3 + random * 0.7; // Weekdays more active
      }
      
      weekData.push({ date, intensity });
    }
    
    return weekData;
  };

  const weeksData = generateWeeks();
  
  const getIntensityColor = (intensity: number): string => {
    if (intensity > 0.7) return 'bg-success-500';
    if (intensity > 0.4) return 'bg-success-600';
    if (intensity > 0.1) return 'bg-success-700';
    return 'bg-slate-800';
  };

  const getIntensityLabel = (intensity: number): string => {
    if (intensity > 0.7) return 'High activity';
    if (intensity > 0.4) return 'Medium activity';
    if (intensity > 0.1) return 'Low activity';
    return 'No activity';
  };

  // Group by months for labels
  const monthLabels: string[] = [];
  const currentMonth = new Date().getMonth();
  for (let i = 11; i >= 0; i--) {
    const monthDate = new Date();
    monthDate.setMonth(currentMonth - i);
    monthLabels.push(monthDate.toLocaleDateString('en-US', { month: 'short' }));
  }

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-slate-800/60 backdrop-blur-sm p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Activity Graph</h3>
        <p className="text-sm text-slate-400">Your coding activity over the past {weeks} weeks</p>
      </div>

      <div className="overflow-x-auto">
        <div className="flex gap-1 mb-2" style={{ minWidth: `${weeks * 12}px` }}>
          {weeksData.map((week, index) => {
            const isToday = week.date.toDateString() === new Date().toDateString();
            return (
              <div
                key={index}
                className={`w-3 h-3 rounded ${getIntensityColor(week.intensity)} ${
                  isToday ? 'ring-2 ring-primary-400 ring-offset-2 ring-offset-slate-800' : ''
                } transition-all hover:scale-125 cursor-pointer`}
                title={`${week.date.toLocaleDateString()}: ${getIntensityLabel(week.intensity)}`}
              />
            );
          })}
        </div>
        
        {/* Month labels */}
        <div className="flex justify-between text-xs text-slate-500 mt-2">
          {monthLabels.map((month, i) => (
            <span key={i} className={i % 2 === 0 ? 'visible' : 'invisible'}>
              {month}
            </span>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center justify-between text-xs">
        <span className="text-slate-400">Less</span>
        <div className="flex gap-1">
          <div className="w-3 h-3 rounded bg-slate-800" />
          <div className="w-3 h-3 rounded bg-success-700" />
          <div className="w-3 h-3 rounded bg-success-600" />
          <div className="w-3 h-3 rounded bg-success-500" />
        </div>
        <span className="text-slate-400">More</span>
      </div>
    </div>
  );
};

export default ActivityGraph;








