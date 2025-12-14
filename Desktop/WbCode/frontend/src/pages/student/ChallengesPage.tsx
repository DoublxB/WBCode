import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useProfile } from '../../api/hooks';
import { 
  Sword, 
  Users, 
  Zap, 
  Database, 
  Code, 
  Bug, 
  CheckCircle, 
  XCircle, 
  Trophy,
  Clock,
  User,
  Sparkles,
  FileText
} from 'lucide-react';

interface Friend {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  xp?: number;
  level?: number;
  requesterUser?: any;
  addresseeUser?: any;
}

interface Challenge {
  id: number;
  challengerId: number;
  opponentId: number;
  status: 'PENDING' | 'ACCEPTED' | 'COMPLETED' | 'FAILED';
  codingExercise?: {
    id: number;
    title: string;
    category: string;
  };
  challenger?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  opponent?: {
    id: number;
    firstName: string;
    lastName: string;
    avatarUrl?: string;
  };
  challengerScore?: number;
  opponentScore?: number;
  bonusXP?: number;
  createdAt: string;
}

const CATEGORIES = [
  { id: 'Algorithms', name: 'Algorithms', icon: Zap, color: 'from-yellow-500 to-orange-500', bgColor: 'bg-yellow-500/10', borderColor: 'border-yellow-500/30' },
  { id: 'Data Structures', name: 'Data Structures', icon: Database, color: 'from-blue-500 to-cyan-500', bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/30' },
  { id: 'Python Basics', name: 'Python Basics', icon: Code, color: 'from-emerald-500 to-teal-500', bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/30' },
  { id: 'Object-Oriented Programming', name: 'OOP (Python)', icon: Code, color: 'from-purple-500 to-pink-500', bgColor: 'bg-purple-500/10', borderColor: 'border-purple-500/30' },
  { id: 'File Handling', name: 'File Handling & I/O', icon: FileText, color: 'from-green-500 to-emerald-500', bgColor: 'bg-green-500/10', borderColor: 'border-green-500/30' },
  { id: 'Libraries & Modules', name: 'Libraries & Modules', icon: Code, color: 'from-indigo-500 to-blue-500', bgColor: 'bg-indigo-500/10', borderColor: 'border-indigo-500/30' },
  { id: 'Error Handling', name: 'Error Handling & Debugging', icon: Bug, color: 'from-red-500 to-rose-500', bgColor: 'bg-red-500/10', borderColor: 'border-red-500/30' },
];

const ChallengesPage = () => {
  const { data: profile } = useProfile();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showToast, setShowToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Fetch friends
  const { data: friendships = [], isLoading: friendsLoading } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const { data } = await api.get('/friends');
      return data as any[];
    }
  });

  // Transform friendships to get actual friend objects
  const friends: Friend[] = friendships.map((f: any) => {
    const friend = f.requesterUser?.id === profile?.id ? f.addresseeUser : f.requesterUser;
    return {
      id: friend.id,
      firstName: friend.firstName,
      lastName: friend.lastName,
      email: friend.email,
      avatarUrl: friend.avatarUrl,
      xp: friend.xp,
      level: friend.level
    };
  }).filter((f: Friend) => f.id !== profile?.id);

  // Fetch challenges
  const { data: challenges = [], refetch: refetchChallenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const { data } = await api.get('/challenges');
      return data as Challenge[];
    }
  });

  // Separate incoming and outgoing challenges
  const incomingChallenges = challenges.filter(
    (c: Challenge) => c.opponentId === profile?.id && c.status === 'PENDING'
  );
  const outgoingChallenges = challenges.filter(
    (c: Challenge) => c.challengerId === profile?.id && c.status === 'PENDING'
  );
  const activeChallenges = challenges.filter(
    (c: Challenge) => c.status === 'ACCEPTED' || c.status === 'COMPLETED'
  );

  // Send challenge mutation
  const sendChallenge = useMutation({
    mutationFn: async (payload: { targetUserId: number; category: string; mode: 'RANDOM' }) => {
      const { data } = await api.post('/challenges', {
        opponentId: payload.targetUserId,
        category: payload.category,
        mode: payload.mode
      });
      return data;
    },
    onSuccess: (data, variables) => {
      const friendName = selectedFriend 
        ? `${selectedFriend.firstName} ${selectedFriend.lastName}`
        : 'Friend';
      setShowToast({ 
        message: `🎯 Challenge sent to ${friendName}!`, 
        type: 'success' 
      });
      setSelectedFriend(null);
      setSelectedCategory(null);
      refetchChallenges();
      setTimeout(() => setShowToast(null), 3000);
    },
    onError: (error: any) => {
      setShowToast({ 
        message: error.response?.data?.message || 'Failed to send challenge', 
        type: 'error' 
      });
      setTimeout(() => setShowToast(null), 3000);
    }
  });

  // Accept challenge mutation
  const acceptChallenge = useMutation({
    mutationFn: async (challengeId: number) => {
      const { data } = await api.post(`/challenges/${challengeId}/accept`);
      return data;
    },
    onSuccess: (data, challengeId) => {
      setShowToast({ message: '✅ Challenge accepted!', type: 'success' });
      refetchChallenges();
      // Navigate to challenge solve page
      setTimeout(() => {
        navigate(`/challenges/${challengeId}/solve`);
      }, 1000);
    }
  });

  // Decline challenge (delete or mark as declined)
  const declineChallenge = useMutation({
    mutationFn: async (challengeId: number) => {
      // For now, we'll just refetch - you might want to add a decline endpoint
      return Promise.resolve();
    },
    onSuccess: () => {
      setShowToast({ message: 'Challenge declined', type: 'success' });
      refetchChallenges();
      setTimeout(() => setShowToast(null), 2000);
    }
  });

  const handleSendChallenge = () => {
    if (!selectedFriend || !selectedCategory) {
      setShowToast({ message: 'Please select a friend and category', type: 'error' });
      return;
    }

    sendChallenge.mutate({
      targetUserId: selectedFriend.id,
      category: selectedCategory,
      mode: 'RANDOM'
    });
  };

  const getFriendAvatar = (friend: Friend) => {
    if (friend.avatarUrl) return friend.avatarUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(`${friend.firstName} ${friend.lastName}`)}&background=6366f1&color=fff&size=128`;
  };

  const getCategoryIcon = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId)?.icon || Code;
  };

  return (
    <div className="space-y-8 pb-8">
      {/* Toast Notification */}
      {showToast && (
        <div className={`fixed top-4 right-4 z-50 animate-slide-in ${
          showToast.type === 'success' 
            ? 'bg-emerald-500/90 text-white' 
            : 'bg-red-500/90 text-white'
        } px-6 py-3 rounded-lg shadow-xl flex items-center gap-2 font-semibold`}>
          {showToast.type === 'success' ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <XCircle className="h-5 w-5" />
          )}
          {showToast.message}
        </div>
      )}

      {/* Header */}
      <header className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-primary/10 via-purple-500/10 to-indigo-500/10 p-6 md:p-8">
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-purple-600 shadow-lg">
            <Sword className="h-6 w-6 md:h-8 md:w-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Challenges</h1>
            <p className="text-slate-400 mt-1 text-sm md:text-base">Battle your friends in coding duels</p>
          </div>
        </div>
      </header>

      {/* Incoming Challenges Section */}
      {incomingChallenges.length > 0 && (
        <div className="rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-500/20">
              <Clock className="h-6 w-6 text-red-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Incoming Challenges</h2>
            <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-sm font-semibold">
              {incomingChallenges.length}
            </span>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {incomingChallenges.map((challenge: Challenge) => {
              const challenger = challenge.challenger;
              const category = challenge.codingExercise?.category || 'Unknown';
              const CategoryIcon = getCategoryIcon(category);
              
              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-slate-700 bg-slate-900/80 p-6 backdrop-blur-sm hover:border-red-500/50 transition-all"
                >
                  <div className="flex items-start gap-4 mb-4">
                    <div className="relative">
                      <img
                        src={challenger?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${challenger?.firstName} ${challenger?.lastName}`)}&background=ef4444&color=fff&size=64`}
                        alt={challenger?.firstName}
                        className="w-16 h-16 rounded-full border-2 border-red-500/50"
                      />
                      <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-red-500 border-2 border-slate-900">
                        <CategoryIcon className="h-4 w-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-white">
                        {challenger?.firstName} {challenger?.lastName}
                      </h3>
                      <p className="text-sm text-slate-400">Challenged you to</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CategoryIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">{category}</span>
                      </div>
                      {challenge.codingExercise && (
                        <p className="text-xs text-slate-500 mt-1">
                          {challenge.codingExercise.title}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => acceptChallenge.mutate(challenge.id)}
                      disabled={acceptChallenge.isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 px-4 py-3 text-sm font-bold text-white hover:from-emerald-600 hover:to-green-700 transition-all shadow-lg hover:shadow-emerald-500/50 disabled:opacity-50"
                    >
                      <CheckCircle className="h-5 w-5" />
                      Accept
                    </button>
                    <button
                      onClick={() => declineChallenge.mutate(challenge.id)}
                      disabled={declineChallenge.isPending}
                      className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-red-500 to-rose-600 px-4 py-3 text-sm font-bold text-white hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-red-500/50 disabled:opacity-50"
                    >
                      <XCircle className="h-5 w-5" />
                      Decline
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Send Challenge Section */}
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Friends Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-primary/20">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-white">Select Opponent</h2>
          </div>
          
          {friendsLoading ? (
            <div className="text-center py-8 text-slate-400">Loading friends...</div>
          ) : friends.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No friends yet. Add friends to start challenging!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`relative rounded-xl border-2 p-4 cursor-pointer transition-all ${
                    selectedFriend?.id === friend.id
                      ? 'border-primary bg-primary/10 shadow-lg shadow-primary/20'
                      : 'border-slate-700 bg-slate-800/50 hover:border-primary/50 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <img
                        src={getFriendAvatar(friend)}
                        alt={friend.firstName}
                        className="w-14 h-14 rounded-full border-2 border-slate-600"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900"></div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {friend.firstName} {friend.lastName}
                      </h3>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-400">Level {friend.level || 1}</span>
                        <span className="text-xs text-primary font-semibold">
                          {friend.xp || 0} XP
                        </span>
                      </div>
                    </div>
                    {selectedFriend?.id === friend.id && (
                      <div className="p-2 rounded-lg bg-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Category Selection */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Sparkles className="h-6 w-6 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Choose Category</h2>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isSelected = selectedCategory === category.id;
              
              return (
                <div
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`relative rounded-xl border-2 p-5 cursor-pointer transition-all transform hover:scale-105 ${
                    isSelected
                      ? `${category.borderColor} ${category.bgColor} shadow-lg shadow-primary/20`
                      : 'border-slate-700 bg-slate-800/50 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${
                      isSelected 
                        ? `bg-gradient-to-br ${category.color}` 
                        : 'bg-slate-700'
                    }`}>
                      <Icon className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white">{category.name}</h3>
                      <p className="text-xs text-slate-400 mt-1">Random problem from this category</p>
                    </div>
                    {isSelected && (
                      <div className="p-2 rounded-lg bg-primary/20">
                        <CheckCircle className="h-5 w-5 text-primary" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Send Challenge Button */}
          <button
            onClick={handleSendChallenge}
            disabled={!selectedFriend || !selectedCategory || sendChallenge.isPending}
            className="w-full mt-6 flex items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-primary to-purple-600 px-6 py-4 text-lg font-bold text-white hover:from-primary/90 hover:to-purple-600/90 transition-all shadow-lg hover:shadow-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
          >
            {sendChallenge.isPending ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                Sending...
              </>
            ) : (
              <>
                <Sword className="h-6 w-6" />
                Send Challenge
              </>
            )}
          </button>
        </div>
      </div>

      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Trophy className="h-6 w-6 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Active Challenges</h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {activeChallenges.map((challenge: Challenge) => {
              const opponent = challenge.challengerId === profile?.id 
                ? challenge.opponent 
                : challenge.challenger;
              const category = challenge.codingExercise?.category || 'Unknown';
              
              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-5"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <img
                        src={opponent?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${opponent?.firstName} ${opponent?.lastName}`)}&background=6366f1&color=fff&size=48`}
                        alt={opponent?.firstName}
                        className="w-12 h-12 rounded-full border-2 border-slate-600"
                      />
                      <div>
                        <h3 className="font-semibold text-white">
                          {opponent?.firstName} {opponent?.lastName}
                        </h3>
                        <p className="text-xs text-slate-400">{category}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      challenge.status === 'COMPLETED' 
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {challenge.status}
                    </span>
                  </div>
                  {challenge.status === 'COMPLETED' && (
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <span className="text-slate-400">Your Score: </span>
                        <span className="text-white font-bold">{challenge.opponentScore || 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Opponent: </span>
                        <span className="text-white font-bold">{challenge.challengerScore || 0}</span>
                      </div>
                      {challenge.bonusXP && challenge.bonusXP > 0 && (
                        <div className="text-emerald-400 font-bold">
                          +{challenge.bonusXP} XP Bonus
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Outgoing Challenges */}
      {outgoingChallenges.length > 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Clock className="h-6 w-6 text-blue-400" />
            </div>
            <h2 className="text-2xl font-bold text-white">Pending Challenges</h2>
          </div>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {outgoingChallenges.map((challenge: Challenge) => {
              const opponent = challenge.opponent;
              const category = challenge.codingExercise?.category || 'Unknown';
              
              return (
                <div
                  key={challenge.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-5"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={opponent?.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(`${opponent?.firstName} ${opponent?.lastName}`)}&background=3b82f6&color=fff&size=48`}
                      alt={opponent?.firstName}
                      className="w-12 h-12 rounded-full border-2 border-slate-600"
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">
                        {opponent?.firstName} {opponent?.lastName}
                      </h3>
                      <p className="text-xs text-slate-400">{category}</p>
                      <p className="text-xs text-slate-500 mt-1">Waiting for response...</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChallengesPage;
