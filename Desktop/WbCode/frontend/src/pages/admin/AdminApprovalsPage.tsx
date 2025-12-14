import { useState } from 'react';
import { usePendingApprovals, useReviewApproval } from '../../api/hooks';
import { CheckCircle, XCircle, AlertCircle, FileText, BookOpen, Code2, FileQuestion } from 'lucide-react';
import classNames from 'classnames';

const AdminApprovalsPage = () => {
  const { data: approvals = [], refetch } = usePendingApprovals();
  const reviewApproval = useReviewApproval();
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState('');

  const handleReview = async (status: 'APPROVED' | 'REJECTED' | 'REVISIONS_REQUESTED') => {
    if (!selectedApproval) return;
    await reviewApproval.mutateAsync({
      id: selectedApproval.id,
      status,
      adminNotes: reviewNotes
    });
    setSelectedApproval(null);
    setReviewNotes('');
    refetch();
  };

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'LESSON':
        return <BookOpen className="h-5 w-5" />;
      case 'QUIZ':
        return <FileQuestion className="h-5 w-5" />;
      case 'CODING_EXERCISE':
        return <Code2 className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getContentTypeLabel = (type: string) => {
    switch (type) {
      case 'LESSON':
        return 'Lesson';
      case 'QUIZ':
        return 'Quiz';
      case 'CODING_EXERCISE':
        return 'Coding Exercise';
      default:
        return type;
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Review and approve professor content</p>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <CheckCircle className="h-8 w-8 text-primary" />
          Content Approvals
          {approvals.length > 0 && (
            <span className="ml-2 rounded-full bg-yellow-500 px-3 py-1 text-sm font-semibold text-white">
              {approvals.length} pending
            </span>
          )}
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approval List */}
        <div className="space-y-4">
          {approvals.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
              <CheckCircle className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-xl font-semibold text-slate-300 mb-2">No pending approvals</p>
              <p className="text-slate-500">All content has been reviewed</p>
            </div>
          ) : (
            approvals.map((approval: any) => (
              <div
                key={approval.id}
                onClick={() => setSelectedApproval(approval)}
                className={classNames(
                  'rounded-xl border p-4 cursor-pointer transition-all',
                  selectedApproval?.id === approval.id
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  {getContentIcon(approval.contentType)}
                  <div className="flex-1">
                    <p className="font-semibold text-white">
                      {getContentTypeLabel(approval.contentType)}
                    </p>
                    <p className="text-xs text-slate-400">
                      By {approval.professor?.firstName} {approval.professor?.lastName}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-slate-300">
                  {approval.content?.title || `Content ID: ${approval.contentId}`}
                </p>
                <p className="text-xs text-slate-500 mt-2">
                  Submitted {new Date(approval.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Review Panel */}
        {selectedApproval && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Review Content</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <p className="text-sm text-slate-400 mb-1">Type</p>
                <p className="text-white flex items-center gap-2">
                  {getContentIcon(selectedApproval.contentType)}
                  {getContentTypeLabel(selectedApproval.contentType)}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400 mb-1">Title</p>
                <p className="text-white">{selectedApproval.content?.title || 'N/A'}</p>
              </div>
              {selectedApproval.content?.description && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Description</p>
                  <p className="text-slate-300">{selectedApproval.content.description}</p>
                </div>
              )}
              {selectedApproval.content?.difficulty && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Difficulty</p>
                  <p className="text-white">{selectedApproval.content.difficulty}</p>
                </div>
              )}
              {selectedApproval.content?.content && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Content</p>
                  <div className="rounded-lg border border-slate-700 bg-slate-800 p-3 max-h-60 overflow-y-auto">
                    <pre className="text-sm text-slate-300 whitespace-pre-wrap">
                      {selectedApproval.content.content}
                    </pre>
                  </div>
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
                placeholder="Add notes for the professor..."
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => handleReview('APPROVED')}
                disabled={reviewApproval.isPending}
                className="flex-1 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={() => handleReview('REVISIONS_REQUESTED')}
                disabled={reviewApproval.isPending}
                className="flex-1 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-white hover:bg-yellow-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                <AlertCircle className="h-4 w-4" />
                Request Revisions
              </button>
              <button
                onClick={() => handleReview('REJECTED')}
                disabled={reviewApproval.isPending}
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

export default AdminApprovalsPage;

