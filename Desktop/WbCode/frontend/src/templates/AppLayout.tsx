import { Outlet } from 'react-router-dom';
import XPBar from '../components/XPBar';
import Navbar from '../components/Navbar';

const AppLayout = () => {
  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gradient-to-br from-slate-950 via-slate-900/50 to-slate-950 flex flex-col">
        {/* Header with XP Bar */}
        <div className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm px-6 py-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-end">
            <XPBar />
          </div>
        </div>
        {/* Main Content */}
        <div className="flex-1 p-6 md:p-8 min-h-full max-w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AppLayout;
