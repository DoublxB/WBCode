import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import XPBar from '../components/XPBar';
import Navbar from '../components/Navbar';
import BadgeUnlockToaster from '../components/BadgeUnlockToaster';
import { api } from '../api/client';

const AppLayout = () => {
  const location = useLocation();
  const isRoadmap = location.pathname === '/roadmap';

  useEffect(() => {
    // Low-overhead "app open" event (once per tab session)
    const key = 'wbcode_ae_app_opened';
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    api.post('/analytics/event', { type: 'APP_OPEN' }).catch(() => null);
  }, []);

  return (
    <div className="relative h-screen w-full text-slate-100 flex overflow-hidden">
      {/* Global circuit background (fixed layers across the whole platform) */}
      <div className="pointer-events-none fixed inset-0 z-0">
        {/* 1) Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />

        {/* 2) Circuit grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage:
              'linear-gradient(to right, #06b6d4 1px, transparent 1px), linear-gradient(to bottom, #06b6d4 1px, transparent 1px)',
            backgroundSize: '40px 40px'
          }}
        />

        {/* 3) Radial glow blobs */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />

        {/* 4) Bottom circuit decoration */}
        <div className="absolute bottom-0 left-0 right-0">
          <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
          <div className="h-8 bg-gradient-to-t from-cyan-500/5 to-transparent" />
        </div>
      </div>

      <Navbar />
      <main
        className={[
          'relative z-10 flex-1 overflow-x-hidden flex flex-col',
          // On Roadmap (desktop), we don't want the vertical scrollbar panel at all.
          // Mobile keeps normal scrolling.
          isRoadmap ? 'overflow-y-auto md:overflow-y-hidden' : 'overflow-y-auto'
        ].join(' ')}
      >
        {/* Header with XP Bar */}
        <div className="sticky top-0 z-40 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm px-6 py-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-end">
            <XPBar />
          </div>
        </div>
        {/* Main Content */}
        <div className="relative flex-1 p-6 md:p-8 min-h-full max-w-full">
          <div key={location.pathname} className="page-enter">
            <Outlet />
          </div>
        </div>
      </main>
      <BadgeUnlockToaster />
    </div>
  );
};

export default AppLayout;
