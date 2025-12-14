import { useState } from 'react';
import { useMessages, useSendMessage, useUnreadCount, useProfile } from '../../api/hooks';
import { MessageSquare, Send, Mail, User } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

const AdminMessagingPage = () => {
  const { data: messages = [], refetch } = useMessages();
  const { data: unreadCount = 0 } = useUnreadCount();
  const { data: profile } = useProfile();
  const sendMessage = useSendMessage();
  
  const { data: professors = [] } = useQuery({
    queryKey: ['professors'],
    queryFn: async () => {
      const { data } = await api.get('/admin/users');
      return (data as any[]).filter((u: any) => u.role === 'PROFESSOR' || u.role?.name === 'PROFESSOR');
    }
  });

  const [showCompose, setShowCompose] = useState(false);
  const [form, setForm] = useState({ receiverId: '', subject: '', content: '' });

  const handleSend = async () => {
    if (!form.receiverId || !form.subject || !form.content) return;
    await sendMessage.mutateAsync({
      receiverId: Number(form.receiverId),
      subject: form.subject,
      content: form.content
    });
    setForm({ receiverId: '', subject: '', content: '' });
    setShowCompose(false);
    refetch();
  };

  const handleMarkAsRead = async (messageId: number) => {
    await api.post(`/admin/messages/${messageId}/read`);
    refetch();
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-slate-400">Communicate with professors</p>
          <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Messages
            {unreadCount > 0 && (
              <span className="ml-2 rounded-full bg-red-500 px-3 py-1 text-sm font-semibold text-white">
                {unreadCount} unread
              </span>
            )}
          </h1>
        </div>
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 transition-colors flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          New Message
        </button>
      </header>

      {showCompose && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Compose Message</h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-slate-300 mb-2 block">To (Professor)</label>
              <select
                value={form.receiverId}
                onChange={(e) => setForm({ ...form, receiverId: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
              >
                <option value="">Select professor...</option>
                {professors.map((prof: any) => (
                  <option key={prof.id} value={prof.id}>
                    {prof.firstName} {prof.lastName} ({prof.email})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Subject</label>
              <input
                type="text"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Message subject..."
              />
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Message</label>
              <textarea
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                rows={6}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white"
                placeholder="Type your message..."
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSend}
                disabled={sendMessage.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Send
              </button>
              <button
                onClick={() => setShowCompose(false)}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {messages.length === 0 ? (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-12 text-center">
            <Mail className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <p className="text-xl font-semibold text-slate-300 mb-2">No messages</p>
            <p className="text-slate-500">Start a conversation with a professor</p>
          </div>
        ) : (
          messages.map((message: any) => {
            const isSender = message.senderId === profile?.id;
            const otherUser = isSender ? message.receiver : message.sender;
            return (
              <div
                key={message.id}
                className={`rounded-2xl border p-6 ${
                  !message.isRead && !isSender
                    ? 'border-primary bg-primary/10'
                    : 'border-slate-800 bg-slate-900/80'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="font-semibold text-white">
                        {isSender ? 'To' : 'From'}: {otherUser?.firstName} {otherUser?.lastName}
                      </p>
                      <p className="text-xs text-slate-400">{otherUser?.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400">
                      {new Date(message.createdAt).toLocaleString()}
                    </p>
                    {!message.isRead && !isSender && (
                      <button
                        onClick={() => handleMarkAsRead(message.id)}
                        className="mt-2 text-xs text-primary hover:underline"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{message.subject}</h3>
                <p className="text-slate-300 whitespace-pre-wrap">{message.content}</p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default AdminMessagingPage;

