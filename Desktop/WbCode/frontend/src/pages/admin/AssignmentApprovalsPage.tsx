import { useState } from 'react';
import { usePendingAssignments, useReviewAssignment } from '../../api/hooks';
import { CheckCircle, XCircle, BookOpen, AlertCircle, Clock, User } from 'lucide-react';
import classNames from 'classnames';

const AssignmentApprovalsPage = () => {
  const { data: assignments = [], refetch } = usePendingAssignments();
  const reviewAssignment = useReviewAssignment();
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedAssignment) return;
    await reviewAssignment.mutateAsync({
      id: selectedAssignment.id,
      status,
      adminNotes: reviewNotes
    });
    setSelectedAssignment(null);
    setReviewNotes('');
    refetch();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'advanced':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'PROBLEM':
        return 'bg-red-500/20 text-red-300';
      case 'HOMEWORK':
        return 'bg-blue-500/20 text-blue-300';
      case 'MATERIAL':
        return 'bg-green-500/20 text-green-300';
      default:
        return 'bg-slate-500/20 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Review and approve class assignments</p>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-primary" />
          Assignment Approvals
          {assignments.length > 0 && (
            <span className="ml-2 rounded-full bg-yellow-500 px-3 py-1 text-sm font-semibold text-white">
              {assignments.length} pending
            </span>
          )}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment List */}
        <div className="space-y-4">
          {assignments.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
              <CheckCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-slate-300 mb-2">No pending assignments</p>
              <p className="text-slate-500">All assignments have been reviewed</p>
            </div>
          ) : (
            assignments.map((assignment: any) => (
              <div
                key={assignment.id}
                onClick={() => setSelectedAssignment(assignment)}
                className={classNames(
                  'rounded-xl border p-4 cursor-pointer transition-all',
                  selectedAssignment?.id === assignment.id
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h3 className="font-semibold text-white mb-1">{assignment.title}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2">{assignment.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={classNames('px-2 py-0.5 rounded-full text-xs', getTypeColor(assignment.type))}>
                    {assignment.type}
                  </span>
                  <span className={classNames('px-2 py-0.5 rounded-full text-xs border', getDifficultyColor(assignment.difficulty))}>
                    {assignment.difficulty}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                  <User className="h-3 w-3" />
                  <span>{assignment.professor?.firstName} {assignment.professor?.lastName}</span>
                  <span>•</span>
                  <span>{assignment.class?.name}</span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  Submitted {new Date(assignment.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Review Panel */}
        {selectedAssignment && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Review Assignment</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Title</p>
                <p className="text-white">{selectedAssignment.title}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Description</p>
                <p className="text-slate-300">{selectedAssignment.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Type</p>
                  <span className={classNames('px-2 py-1 rounded-full text-xs', getTypeColor(selectedAssignment.type))}>
                    {selectedAssignment.type}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-slate-400 mb-1">Difficulty</p>
                  <span className={classNames('px-2 py-1 rounded-full text-xs border', getDifficultyColor(selectedAssignment.difficulty))}>
                    {selectedAssignment.difficulty}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Class</p>
                <p className="text-white">{selectedAssignment.class?.name}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Professor</p>
                <p className="text-white">{selectedAssignment.professor?.firstName} {selectedAssignment.professor?.lastName}</p>
              </div>
              {selectedAssignment.dueDate && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Due Date</p>
                  <p className="text-white">{new Date(selectedAssignment.dueDate).toLocaleString()}</p>
                </div>
              )}
            </div>

            <div className="mb-6">
              <label className="text-sm text-slate-300 mb-2 block">Review Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Add notes about difficulty verification or any concerns..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReview('APPROVED')}
                disabled={reviewAssignment.isPending}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleReview('REJECTED')}
                disabled={reviewAssignment.isPending}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssignmentApprovalsPage;

