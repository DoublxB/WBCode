import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useConversations, useConversation, useSendChatMessage, useCreateDirectConversation, useCreateSupportConversation, useNotifications } from '../../api/hooks';
import { 
  MessageSquare, 
  Send, 
  Search, 
  Plus, 
  MoreVertical,
  Phone,
  Video,
  Info,
  Check,
  CheckCheck,
  Clock,
  User,
  Shield,
  Sparkles
} from 'lucide-react';
import { useProfile } from '../../api/hooks';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../api/client';

const ChatPage = () => {
  const { data: profile } = useProfile();
  const { data: notifications } = useNotifications();
  const [searchParams] = useSearchParams();
  const { data: conversations = [], refetch: refetchConversations } = useConversations();
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(
    searchParams.get('conversation') ? parseInt(searchParams.get('conversation')!) : null
  );
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const sendMessage = useSendChatMessage();
  const createDirect = useCreateDirectConversation();
  const createSupport = useCreateSupportConversation();

  const { data: selectedConversation, refetch: refetchConversation, isLoading: isLoadingConversation } = useConversation(
    selectedConversationId || 0,
    { enabled: !!selectedConversationId }
  );

  // Update selected conversation when URL param changes
  useEffect(() => {
    const convId = searchParams.get('conversation');
    if (convId) {
      const parsedId = parseInt(convId);
      if (!isNaN(parsedId) && parsedId !== selectedConversationId) {
        setSelectedConversationId(parsedId);
      }
    }
  }, [searchParams, selectedConversationId]);

  // Auto-refresh messages every 2 seconds
  useEffect(() => {
    if (selectedConversationId) {
      const interval = setInterval(() => {
        refetchConversation();
        refetchConversations();
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedConversationId, refetchConversation, refetchConversations]);

  // Auto-scroll to bottom with smooth behavior
  useEffect(() => {
    if (messagesEndRef.current && selectedConversation?.messages) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [selectedConversation?.messages]);

  const handleSend = async () => {
    if (!message.trim() || !selectedConversationId || sendMessage.isPending) return;
    try {
      await sendMessage.mutateAsync({ conversationId: selectedConversationId, content: message });
      setMessage('');
      refetchConversation();
      refetchConversations();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCreateSupport = async () => {
    try {
      const conv = await createSupport.mutateAsync();
      setSelectedConversationId(conv.id);
      refetchConversations();
    } catch (error) {
      console.error('Error creating support conversation:', error);
    }
  };

  const filteredConversations = conversations.filter((conv: any) =>
    conv.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.participants?.some((p: any) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  const getOtherParticipant = (conversation: any) => {
    if (!conversation?.participants) return null;
    return conversation.participants.find((p: any) => p.id !== profile?.id) || conversation.participants[0];
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 7) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (days > 0) {
      return `${days}d ago`;
    } else if (hours > 0) {
      return `${hours}h ago`;
    } else if (minutes > 0) {
      return `${minutes}m ago`;
    } else {
      return 'Just now';
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    }
  };

  const groupMessagesByDate = (messages: any[]) => {
    if (!messages || messages.length === 0) return [];
    
    const grouped: { [key: string]: any[] } = {};
    messages.forEach((msg) => {
      const date = new Date(msg.createdAt);
      const dateKey = date.toDateString();
      
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(msg);
    });
    
    return Object.entries(grouped).map(([date, msgs]) => ({
      date,
      messages: msgs
    }));
  };

  const groupedMessages = selectedConversation?.messages 
    ? groupMessagesByDate(selectedConversation.messages)
    : [];

  return (
    <div className="h-[calc(100vh-4rem)] flex rounded-2xl border border-slate-800 bg-slate-900/95 backdrop-blur-xl overflow-hidden shadow-2xl">
      {/* Conversations Sidebar */}
      <div className="w-96 border-r border-slate-800/50 flex flex-col bg-slate-900/50 backdrop-blur-sm">
        {/* Header */}
        <div className="p-5 border-b border-slate-800/50 bg-gradient-to-r from-slate-900/80 to-slate-800/80">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 shadow-lg">
                <MessageSquare className="h-5 w-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">Messages</h2>
            </div>
            {(profile?.role === 'PROFESSOR' || profile?.role === 'STUDENT') && (
              <button
                onClick={handleCreateSupport}
                className="p-2 rounded-xl bg-primary-500/20 border border-primary-500/30 text-primary-400 hover:bg-primary-500/30 transition-all duration-200 hover:scale-105"
                title="Contact Support"
              >
                <Shield className="h-5 w-5" />
              </button>
            )}
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-slate-700/50 bg-slate-800/50 pl-11 pr-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-slate-800 transition-all duration-200"
            />
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-10 w-10 text-slate-500" />
              </div>
              <p className="text-slate-400 font-medium mb-2">No conversations yet</p>
              <p className="text-sm text-slate-500">Start a conversation to begin chatting</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conv: any) => {
                const other = getOtherParticipant(conv);
                const isSelected = selectedConversationId === conv.id;
                const unreadCount = notifications?.chatNotifications?.[conv.id] || 0;
                const isUnread = unreadCount > 0;
                
                return (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversationId(conv.id)}
                    className={`group relative p-4 rounded-xl mb-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'bg-gradient-to-r from-primary-500/20 to-purple-500/20 border border-primary-500/30 shadow-lg' 
                        : 'hover:bg-slate-800/50 border border-transparent hover:border-slate-700/50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                          conv.type === 'SUPPORT' 
                            ? 'from-yellow-500 to-orange-600' 
                            : 'from-primary-500 to-purple-600'
                        } flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-slate-800`}>
                          {conv.type === 'SUPPORT' ? (
                            <Shield className="h-7 w-7" />
                          ) : other ? (
                            `${other.firstName?.[0]}${other.lastName?.[0]}`
                          ) : (
                            <User className="h-7 w-7" />
                          )}
                        </div>
                        {isUnread && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[22px] h-5 px-1.5 rounded-full bg-red-500 text-white text-xs font-bold shadow-lg ring-2 ring-slate-900 animate-pulse">
                            {unreadCount > 99 ? '99+' : unreadCount}
                          </span>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-bold truncate ${
                              isUnread ? 'text-white' : 'text-slate-200'
                            }`}>
                              {conv.name || (other ? `${other.firstName} ${other.lastName}` : 'Unknown')}
                            </p>
                            {conv.type === 'SUPPORT' && (
                              <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-[10px] font-bold uppercase">
                                Support
                              </span>
                            )}
                          </div>
                          {conv.lastMessage && (
                            <span className={`text-xs ml-2 flex-shrink-0 ${
                              isUnread ? 'text-primary-400 font-semibold' : 'text-slate-500'
                            }`}>
                              {formatTime(conv.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        {conv.lastMessage && (
                          <div className="flex items-center gap-2">
                            <p className={`text-sm truncate flex-1 ${
                              isUnread ? 'text-white font-medium' : 'text-slate-400'
                            }`}>
                              {conv.lastMessage.sender.id === profile?.id ? (
                                <span className="text-slate-500">You: </span>
                              ) : (
                                <span className="text-slate-500">
                                  {conv.lastMessage.sender.firstName}:{' '}
                                </span>
                              )}
                              {conv.lastMessage.content}
                            </p>
                            {isUnread && (
                              <div className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0"></div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                    selectedConversation.type === 'SUPPORT' 
                      ? 'from-yellow-500 to-orange-600' 
                      : 'from-primary-500 to-purple-600'
                  } flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-slate-800`}>
                    {selectedConversation.type === 'SUPPORT' ? (
                      <Shield className="h-6 w-6" />
                    ) : getOtherParticipant(selectedConversation) ? (
                      `${getOtherParticipant(selectedConversation)?.firstName?.[0]}${getOtherParticipant(selectedConversation)?.lastName?.[0]}`
                    ) : (
                      <User className="h-6 w-6" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-lg">
                        {selectedConversation.name || (getOtherParticipant(selectedConversation)
                          ? `${getOtherParticipant(selectedConversation)?.firstName} ${getOtherParticipant(selectedConversation)?.lastName}`
                          : 'Unknown')}
                      </p>
                      {selectedConversation.type === 'SUPPORT' && (
                        <span className="px-2 py-0.5 rounded-md bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 text-xs font-bold uppercase">
                          Support
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedConversation.type === 'SUPPORT' ? 'Support Team' : 'Active now'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                    <Phone className="h-5 w-5" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                    <Video className="h-5 w-5" />
                  </button>
                  <button className="p-2 rounded-xl hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors">
                    <Info className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Container */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar"
              style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.03) 0%, transparent 50%),
                                  radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.03) 0%, transparent 50%)`
              }}
            >
              {isLoadingConversation ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading messages...</p>
                  </div>
                </div>
              ) : groupedMessages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-4">
                      <Sparkles className="h-10 w-10 text-slate-500" />
                    </div>
                    <p className="text-slate-400 font-medium">No messages yet</p>
                    <p className="text-sm text-slate-500 mt-1">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                groupedMessages.map((group, groupIndex) => (
                  <div key={group.date}>
                    {/* Date Separator */}
                    <div className="flex items-center gap-4 my-6">
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                      <span className="text-xs font-semibold text-slate-500 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                        {new Date(group.date).toLocaleDateString('en-US', { 
                          weekday: 'long',
                          month: 'long', 
                          day: 'numeric',
                          year: new Date(group.date).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                        })}
                      </span>
                      <div className="flex-1 h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>
                    </div>
                    
                    {/* Messages */}
                    {group.messages.map((msg: any, msgIndex: number) => {
                      const isOwn = msg.sender.id === profile?.id;
                      const prevMsg = msgIndex > 0 ? group.messages[msgIndex - 1] : null;
                      const nextMsg = msgIndex < group.messages.length - 1 ? group.messages[msgIndex + 1] : null;
                      const showAvatar = !isOwn && (!nextMsg || nextMsg.sender.id !== msg.sender.id);
                      const showTime = !nextMsg || nextMsg.sender.id !== msg.sender.id || 
                        new Date(nextMsg.createdAt).getTime() - new Date(msg.createdAt).getTime() > 300000; // 5 minutes
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 group ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {!isOwn && (
                            <div className={`w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 ${showAvatar ? 'opacity-100' : 'opacity-0'}`}>
                              {msg.sender.firstName?.[0]}{msg.sender.lastName?.[0]}
                            </div>
                          )}
                          
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[65%]`}>
                            {!isOwn && showAvatar && (
                              <p className="text-xs text-slate-400 mb-1 px-2 font-medium">
                                {msg.sender.firstName} {msg.sender.lastName}
                              </p>
                            )}
                            <div
                              className={`relative rounded-2xl px-4 py-2.5 shadow-lg ${
                                isOwn
                                  ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white rounded-br-sm'
                                  : 'bg-slate-800/80 text-slate-100 rounded-bl-sm border border-slate-700/50'
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                                {msg.content}
                              </p>
                            </div>
                            {showTime && (
                              <div className={`flex items-center gap-1 mt-1 px-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                                <span className="text-[10px] text-slate-500">
                                  {formatMessageTime(msg.createdAt)}
                                </span>
                                {isOwn && (
                                  <CheckCheck className="h-3 w-3 text-primary-400" />
                                )}
                              </div>
                            )}
                          </div>
                          
                          {isOwn && (
                            <div className="w-8 h-8 flex-shrink-0"></div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="p-4 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-end gap-3">
                <div className="flex-1 relative">
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full rounded-2xl border border-slate-700/50 bg-slate-800/50 px-5 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:bg-slate-800 focus:ring-2 focus:ring-primary-500/20 transition-all duration-200 resize-none max-h-32 overflow-y-auto custom-scrollbar"
                    style={{ minHeight: '48px' }}
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!message.trim() || sendMessage.isPending}
                  className={`p-3 rounded-2xl transition-all duration-200 flex-shrink-0 ${
                    message.trim() && !sendMessage.isPending
                      ? 'bg-gradient-to-br from-primary-500 to-purple-600 text-white hover:shadow-lg hover:scale-105 active:scale-95'
                      : 'bg-slate-800/50 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {sendMessage.isPending ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary-500/20 to-purple-600/20 flex items-center justify-center mx-auto mb-6 shadow-2xl">
                <MessageSquare className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Select a conversation</h3>
              <p className="text-slate-400">Choose a conversation from the sidebar to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
