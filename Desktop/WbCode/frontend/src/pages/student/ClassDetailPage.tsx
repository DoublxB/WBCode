import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useClass, useClassAnnouncements, useClassAssignments, useCreateAnnouncement, useProfile } from '../../api/hooks';
import { ArrowLeft, Bell, BookOpen, Plus, Calendar, CheckCircle, Clock } from 'lucide-react';

const ClassDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const classId = id ? parseInt(id) : null;
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: classData } = useClass(classId);
  const { data: announcements = [], refetch: refetchAnnouncements } = useClassAnnouncements(classId);
  const { data: assignments = [] } = useClassAssignments(classId);
  const createAnnouncement = useCreateAnnouncement();
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' });

  const isProfessor = profile?.role === 'PROFESSOR' || profile?.role === 'ADMIN';

  const handleCreateAnnouncement = async () => {
    if (!classId || !announcementForm.title || !announcementForm.content) return;
    await createAnnouncement.mutateAsync({
      classId,
      title: announcementForm.title,
      content: announcementForm.content
    });
    setAnnouncementForm({ title: '', content: '' });
    setShowAnnouncementForm(false);
    refetchAnnouncements();
  };

  if (!classData) {
    return <div className="text-center py-12 text-slate-400">Loading class...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="rounded-lg border border-slate-700 px-3 py-2 text-slate-300 hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-semibold text-white">{classData.name}</h1>
          {classData.description && (
            <p className="text-slate-400 mt-1">{classData.description}</p>
          )}
          <p className="text-sm text-slate-500 mt-1">
            Professor: {classData.professor?.firstName} {classData.professor?.lastName}
          </p>
        </div>
      </div>

      {/* Announcements Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Announcements
          </h2>
          {isProfessor && (
            <button
              onClick={() => setShowAnnouncementForm(!showAnnouncementForm)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Announcement
            </button>
          )}
        </div>

        {showAnnouncementForm && (
          <div className="mb-6 p-4 rounded-lg border border-slate-700 bg-slate-800">
            <h3 className="text-lg font-semibold text-white mb-4">Create Announcement</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Title</label>
                <input
                  type="text"
                  value={announcementForm.title}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="Announcement title..."
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-2 block">Content</label>
                <textarea
                  value={announcementForm.content}
                  onChange={(e) => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                  placeholder="Announcement content..."
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAnnouncement}
                  disabled={createAnnouncement.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  Post
                </button>
                <button
                  onClick={() => setShowAnnouncementForm(false)}
                  className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {announcements.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No announcements yet</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((announcement: any) => (
              <div key={announcement.id} className="rounded-lg border border-slate-700 bg-slate-800/50 p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-semibold text-white">{announcement.title}</h3>
                  <span className="text-xs text-slate-500">
                    {new Date(announcement.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-slate-300 whitespace-pre-wrap">{announcement.content}</p>
                <p className="text-xs text-slate-500 mt-2">
                  By {announcement.professor?.firstName} {announcement.professor?.lastName}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignments Section */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            Assignments
          </h2>
          {isProfessor && (
            <button
              onClick={() => navigate(`/professor/classes/${classId}/create-assignment`)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Assignment
            </button>
          )}
        </div>

        {assignments.length === 0 ? (
          <p className="text-slate-400 text-center py-8">No assignments yet</p>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment: any) => (
              <div
                key={assignment.id}
                className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => {
                  navigate(`/classes/${id}/assignments/${assignment.id}`);
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{assignment.title}</h3>
                    <p className="text-sm text-slate-400 mt-1">{assignment.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assignment.type === 'PROBLEM' ? 'bg-red-500/20 text-red-300' :
                      assignment.type === 'HOMEWORK' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {assignment.type}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      assignment.difficulty === 'Beginner' ? 'bg-emerald-500/20 text-emerald-300' :
                      assignment.difficulty === 'Intermediate' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-red-500/20 text-red-300'
                    }`}>
                      {assignment.difficulty}
                    </span>
                  </div>
                </div>
                {assignment.dueDate && (
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-2">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                  </div>
                )}
                {assignment.submissions && assignment.submissions.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-emerald-400 mt-2">
                    <CheckCircle className="h-4 w-4" />
                    <span>Submitted</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassDetailPage;

