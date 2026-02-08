import { useNavigate } from 'react-router-dom';
import { FolderKanban, FileQuestion, ArrowRight } from 'lucide-react';
import { quizTracks } from '../../data/quiz-tracks';

const QuizHubPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-blue-500/10 via-indigo-500/10 to-purple-500/10 p-6 md:p-8">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-10 left-10 w-40 h-40 bg-blue-500/15 rounded-full blur-3xl animate-pulse-slow" />
          <div
            className="absolute bottom-10 right-10 w-52 h-52 bg-indigo-500/15 rounded-full blur-3xl animate-pulse-slow"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-500/30 bg-gradient-to-br from-blue-500/20 to-indigo-500/20 shadow-lg shadow-blue-500/10">
                <FolderKanban className="h-5 w-5 text-blue-300" />
              </div>
              <div>
                <p className="text-sm text-slate-300 font-medium">Quiz-uri • Track-uri</p>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white">Alege un traseu de învățare</h1>
              </div>
            </div>
            <p className="text-slate-300 max-w-2xl">
              Cardurile nu pornesc un quiz direct. Intră într-un track, apoi rezolvă quiz-urile în ordine (progresie liniară).
            </p>
          </div>

          <button
            onClick={() => navigate('/quizzes/explore')}
            className="btn-press hidden sm:inline-flex items-center gap-2 rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-950/45"
          >
            <FileQuestion className="h-4 w-4 text-blue-300" />
            Explorează toate quiz-urile
            <ArrowRight className="h-4 w-4 text-slate-400" />
          </button>
        </div>
      </header>

      {/* Tracks grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {quizTracks.map((track, idx) => (
          <button
            key={track.slug}
            onClick={() => navigate(`/quizzes/${track.slug}`)}
            className="btn-press item-enter group relative text-left rounded-2xl border border-slate-800 bg-slate-900/20 p-6 hover:bg-slate-900/30 hover:border-blue-500/25 transition-all shadow-lg shadow-black/20 overflow-hidden"
            style={{ animationDelay: `${Math.min(idx * 60, 240)}ms` }}
          >
            {/* Hover shine (subtle) */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none" />

            {/* Badge: collection count */}
            <div className="absolute top-5 right-5">
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-[11px] font-bold text-blue-200">
                {track.quizCount} quiz-uri
              </span>
            </div>

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-gradient-to-br from-slate-950/60 to-slate-900/30">
              <FolderKanban className="h-6 w-6 text-slate-200 group-hover:text-blue-300 transition-colors" />
            </div>

            <h3 className="text-xl font-bold text-white group-hover:text-blue-200 transition-colors">{track.titleRo}</h3>
            <p className="mt-2 text-sm text-slate-300/90">{track.subtitleRo}</p>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Nivel: <span className="font-semibold text-slate-200">{track.levelRo}</span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200">
                Vezi track-ul <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* Mobile explore button */}
      <button
        onClick={() => navigate('/quizzes/explore')}
        className="btn-press sm:hidden w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-950/45"
      >
        <FileQuestion className="h-4 w-4 text-blue-300" />
        Explorează toate quiz-urile
        <ArrowRight className="h-4 w-4 text-slate-400" />
      </button>
    </div>
  );
};

export default QuizHubPage;
