import { useState } from 'react';
import { useSupportTickets, useAssignTicket, useResolveTicket, useAddTicketReply } from '../../api/hooks';
import { LifeBuoy, CheckCircle, Clock, AlertCircle, MessageSquare, User } from 'lucide-react';
import classNames from 'classnames';

const AdminSupportPage = () => {
  const { data: tickets = [], refetch } = useSupportTickets();
  const assignTicket = useAssignTicket();
  const resolveTicket = useResolveTicket();
  const addReply = useAddTicketReply();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [replyContent, setReplyContent] = useState('');
  const [internalNote, setInternalNote] = useState('');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-red-500/20 text-red-300 border-red-500/40';
      case 'HIGH':
        return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'MEDIUM':
        return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40';
      case 'LOW':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/40';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'RESOLVED':
        return 'bg-emerald-500/20 text-emerald-300';
      case 'IN_PROGRESS':
        return 'bg-blue-500/20 text-blue-300';
      case 'CLOSED':
        return 'bg-slate-500/20 text-slate-300';
      default:
        return 'bg-yellow-500/20 text-yellow-300';
    }
  };

  const handleAssign = async (ticketId: number) => {
    await assignTicket.mutateAsync(ticketId);
    refetch();
  };

  const handleResolve = async () => {
    if (!selectedTicket || !replyContent) return;
    await resolveTicket.mutateAsync({
      ticketId: selectedTicket.id,
      resolution: replyContent
    });
    setReplyContent('');
    setSelectedTicket(null);
    refetch();
  };

  const handleAddReply = async (isInternal: boolean = false) => {
    if (!selectedTicket || (!replyContent && !internalNote)) return;
    await addReply.mutateAsync({
      ticketId: selectedTicket.id,
      content: isInternal ? internalNote : replyContent,
      isInternal
    });
    setReplyContent('');
    setInternalNote('');
    refetch();
  };

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Technical support and assistance</p>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <LifeBuoy className="h-8 w-8 text-primary" />
          Support Tickets
        </h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 space-y-4">
          {tickets.length === 0 ? (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-8 text-center">
              <LifeBuoy className="h-12 w-12 text-slate-600 mx-auto mb-4" />
              <p className="text-lg font-semibold text-slate-300 mb-2">No tickets</p>
              <p className="text-slate-500 text-sm">All support requests have been handled</p>
            </div>
          ) : (
            tickets.map((ticket: any) => (
              <div
                key={ticket.id}
                onClick={() => setSelectedTicket(ticket)}
                className={classNames(
                  'rounded-xl border p-4 cursor-pointer transition-all',
                  selectedTicket?.id === ticket.id
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 bg-slate-900/80 hover:border-slate-700'
                )}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="font-semibold text-white mb-1">{ticket.subject}</p>
                    <p className="text-xs text-slate-400 line-clamp-2">{ticket.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-3 flex-wrap">
                  <span className={classNames('px-2 py-0.5 rounded-full text-xs border', getPriorityColor(ticket.priority))}>
                    {ticket.priority}
                  </span>
                  <span className={classNames('px-2 py-0.5 rounded-full text-xs', getStatusColor(ticket.status))}>
                    {ticket.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Ticket Details */}
        {selectedTicket && (
          <div className="lg:col-span-2 space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white mb-2">{selectedTicket.subject}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={classNames('px-2 py-1 rounded-full text-xs border', getPriorityColor(selectedTicket.priority))}>
                      {selectedTicket.priority}
                    </span>
                    <span className={classNames('px-2 py-1 rounded-full text-xs', getStatusColor(selectedTicket.status))}>
                      {selectedTicket.status}
                    </span>
                    <span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300">
                      {selectedTicket.category}
                    </span>
                  </div>
                </div>
                {selectedTicket.status === 'OPEN' && (
                  <button
                    onClick={() => handleAssign(selectedTicket.id)}
                    className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
                  >
                    Assign to Me
                  </button>
                )}
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-400 mb-1">From</p>
                <p className="text-white flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {selectedTicket.user?.firstName} {selectedTicket.user?.lastName} ({selectedTicket.user?.email})
                </p>
              </div>

              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-2">Description</p>
                <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedTicket.description}</p>
                </div>
              </div>

              {selectedTicket.resolution && (
                <div className="mb-6">
                  <p className="text-sm text-slate-400 mb-2">Resolution</p>
                  <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-4">
                    <p className="text-emerald-200 whitespace-pre-wrap">{selectedTicket.resolution}</p>
                  </div>
                </div>
              )}

              {/* Replies */}
              <div className="mb-6">
                <p className="text-sm text-slate-400 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Replies ({selectedTicket.replies?.length || 0})
                </p>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTicket.replies?.map((reply: any) => (
                    <div
                      key={reply.id}
                      className={classNames(
                        'rounded-lg border p-3',
                        reply.isInternal
                          ? 'border-purple-500/40 bg-purple-500/10'
                          : 'border-slate-700 bg-slate-800'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-semibold text-white">
                          {reply.user?.firstName} {reply.user?.lastName}
                          {reply.isInternal && (
                            <span className="ml-2 text-xs text-purple-300">(Internal Note)</span>
                          )}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(reply.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm text-slate-300 whitespace-pre-wrap">{reply.content}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Reply */}
              {selectedTicket.status !== 'RESOLVED' && selectedTicket.status !== 'CLOSED' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Public Reply</label>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                      placeholder="Type your reply..."
                    />
                    <button
                      onClick={() => handleAddReply(false)}
                      disabled={!replyContent || addReply.isPending}
                      className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                    >
                      Send Reply
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-slate-300 mb-2 block">Internal Note (Admin Only)</label>
                    <textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      rows={2}
                      className="w-full rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-white"
                      placeholder="Add internal note..."
                    />
                    <button
                      onClick={() => handleAddReply(true)}
                      disabled={!internalNote || addReply.isPending}
                      className="mt-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
                    >
                      Add Internal Note
                    </button>
                  </div>

                  {selectedTicket.status === 'IN_PROGRESS' && (
                    <button
                      onClick={handleResolve}
                      disabled={!replyContent || resolveTicket.isPending}
                      className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-600 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Resolve Ticket
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportPage;

