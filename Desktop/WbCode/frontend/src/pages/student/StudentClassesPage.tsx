import { useState } from 'react';
import { useMyJoinedClasses, useJoinClass, useNotifications } from '../../api/hooks';
import { GraduationCap, Plus, Users, FileText, BookOpen, Key } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const StudentClassesPage = () => {
  const { data: classes = [], refetch, isPending } = useMyJoinedClasses();
  const { data: notifications } = useNotifications();
  const joinClass = useJoinClass();
  const navigate = useNavigate();
  const [showJoin, setShowJoin] = useState(false);
  const [invitationCode, setInvitationCode] = useState('');

  // Debug logging
  console.log('📚 StudentClassesPage:', {
    classesCount: classes.length,
    classes: classes.map((c: any) => ({ id: c.id, name: c.name, isActive: c.isActive })),
    isPending
  });

  const handleJoin = async () => {
    if (!invitationCode.trim()) return;
    try {
      await joinClass.mutateAsync(invitationCode.trim().toUpperCase());
      setInvitationCode('');
      setShowJoin(false);
      refetch();
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Failed to join class');
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Your classes and assignments</p>
          <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
            <GraduationCap className="h-8 w-8 text-primary" />
            My Classes
          </h1>
        </div>
        <button
          onClick={() => setShowJoin(!showJoin)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Join Class
        </button>
      </header>

      {showJoin && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Key className="h-5 w-5" />
            Join Class with Invitation Code
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Invitation Code</label>
              <input
                type="text"
                value={invitationCode}
                onChange={(e) => setInvitationCode(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-center text-lg tracking-wider"
                placeholder="XXXXXX"
                maxLength={6}
              />
              <p className="text-xs text-slate-500 mt-2">Enter the 6-character code provided by your professor</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleJoin}
                disabled={joinClass.isPending || !invitationCode.trim()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Join Class
              </button>
              <button
                onClick={() => setShowJoin(false)}
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
            <p className="text-slate-500 mb-4">Join a class using an invitation code from your professor</p>
            <button
              onClick={() => setShowJoin(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
            >
              Join Your First Class
            </button>
          </div>
        ) : (
          classes.map((classItem: any) => {
            const classNotificationCount = notifications?.classNotifications?.[classItem.id] || 0;
            return (
            <div
              key={classItem.id}
              className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 hover:border-primary/50 transition-all cursor-pointer relative"
              onClick={() => navigate(`/classes/${classItem.id}`)}
            >
              {classNotificationCount > 0 && (
                <span className="absolute top-4 right-4 flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-red-500 text-white text-xs font-bold animate-pulse shadow-lg">
                  {classNotificationCount > 99 ? '99+' : classNotificationCount}
                </span>
              )}
              <h3 className="text-xl font-semibold text-white mb-2">{classItem.name}</h3>
              {classItem.description && (
                <p className="text-sm text-slate-400 mb-4 line-clamp-2">{classItem.description}</p>
              )}

              <div className="mb-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Users className="h-4 w-4" />
                  <span>Professor: {classItem.professor?.firstName} {classItem.professor?.lastName}</span>
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
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default StudentClassesPage;

