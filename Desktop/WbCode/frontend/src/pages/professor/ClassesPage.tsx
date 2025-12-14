import { useState } from 'react';
import { useMyClasses, useCreateClass, useRegenerateInvitationCode } from '../../api/hooks';
import { GraduationCap, Plus, Copy, RefreshCw, Users, FileText, BookOpen, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const ClassesPage = () => {
  const { data: classes = [], refetch } = useMyClasses();
  const createClass = useCreateClass();
  const regenerateCode = useRegenerateInvitationCode();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [showSuccess, setShowSuccess] = useState(false);

  const handleCreate = async () => {
    if (!form.name) return;
    try {
      await createClass.mutateAsync({ name: form.name, description: form.description });
      setForm({ name: '', description: '' });
      setShowCreate(false);
      setShowSuccess(true);
      refetch();
      // Hide success animation after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error creating class:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to create class');
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert('Invitation code copied to clipboard!');
  };

  return (
    <div className="space-y-6 relative">
      {/* Success Animation Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="relative">
            {/* Animated Checkmark Circle */}
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl animate-scale-in">
              <CheckCircle2 className="w-16 h-16 text-white animate-checkmark" strokeWidth={3} />
            </div>
            {/* Ripple Effect */}
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ripple"></div>
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ripple-delayed"></div>
            {/* Success Text */}
            <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
              <p className="text-2xl font-bold text-white animate-fade-in">Clasa a fost creata!</p>
            </div>
          </div>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Manage your classes</p>
          <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            My Classes
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Class
        </button>
      </header>

      {showCreate && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Create New Class</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Class Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="e.g., CS101 - Introduction to Programming"
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Description (Optional)</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={3}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Class description..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreate}
                disabled={createClass.isPending || !form.name}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {classes.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
            <GraduationCap className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-300 mb-2">No classes yet</p>
            <p className="text-slate-500">Create your first class to get started</p>
          </div>
        ) : (
          classes.map((classItem: any) => (
            <div
              key={classItem.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-primary/50 transition-all cursor-pointer"
              onClick={() => navigate(`/professor/classes/${classItem.id}`)}
            >
              <h3 className="text-xl font-semibold text-white mb-2">{classItem.name}</h3>
              {classItem.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{classItem.description}</p>
              )}

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>{classItem._count?.members || 0} students</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <FileText className="h-4 w-4" />
                  <span>{classItem._count?.announcements || 0} announcements</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <BookOpen className="h-4 w-4" />
                  <span>{classItem._count?.assignments || 0} assignments</span>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-500">Invitation Code</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyCode(classItem.invitationCode);
                    }}
                    className="text-primary hover:text-primary/80 transition-colors"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-mono text-white text-center">
                    {classItem.invitationCode}
                  </code>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      regenerateCode.mutateAsync(classItem.id).then(() => refetch());
                    }}
                    className="rounded-lg border border-slate-700 px-3 py-2 text-slate-400 hover:bg-slate-800 transition-colors"
                    title="Regenerate code"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ClassesPage;

