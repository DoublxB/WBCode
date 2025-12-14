import { useState } from 'react';
import { useFriends, useAddFriend, useLeaderboard, useProfile, useCreateDirectConversation } from '../../api/hooks';
import { UserPlus, Users, Search, MessageSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FriendsPage = () => {
  const { data: friends = [], refetch } = useFriends();
  const { data: leaderboard = [] } = useLeaderboard();
  const addFriend = useAddFriend();
  const createDirect = useCreateDirectConversation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [addingFriendId, setAddingFriendId] = useState<number | null>(null);
  const [messagingUserId, setMessagingUserId] = useState<number | null>(null);

  const handleAddFriend = async (friendId: number) => {
    setAddingFriendId(friendId);
    try {
      await addFriend.mutateAsync(friendId);
      refetch();
    } catch (error: any) {
      console.error('Failed to add friend:', error);
      alert(error?.response?.data?.message || 'Failed to add friend');
    } finally {
      setAddingFriendId(null);
    }
  };

  const handleMessage = async (userId: number) => {
    setMessagingUserId(userId);
    try {
      const conversation = await createDirect.mutateAsync(userId);
      navigate(`/chat?conversation=${conversation.id}`);
    } catch (error: any) {
      console.error('Failed to create conversation:', error);
      alert(error?.response?.data?.message || 'Failed to start conversation');
    } finally {
      setMessagingUserId(null);
    }
  };

  // Get current user ID from profile
  const { data: profile } = useProfile();
  const currentUserId = profile?.id;

  // Filter leaderboard to show users who are not already friends
  const friendIds = new Set(friends.map((f: any) => f.addresseeUser?.id || f.addressee || f.user?.id));
  const availableUsers = leaderboard
    .filter((entry: any) => {
      const userId = entry.user?.id;
      return userId && userId !== currentUserId && !friendIds.has(userId);
    })
    .filter((entry: any) => {
      if (!searchQuery) return true;
      const name = `${entry.user?.firstName || ''} ${entry.user?.lastName || ''}`.toLowerCase();
      const email = entry.user?.email?.toLowerCase() || '';
      return name.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    });

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-slate-400">Connect with other learners</p>
        <h1 className="text-3xl font-semibold text-white flex items-center gap-3">
          <Users className="h-8 w-8 text-primary" />
          Friends
        </h1>
      </header>

      {/* Friends List */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          My Friends ({friends.length})
        </h2>
        {friends.length === 0 ? (
          <p className="text-slate-400 text-sm">You don't have any friends yet. Add some from the leaderboard below!</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {friends.map((friendship: any) => {
              const friend = friendship.addresseeUser || friendship.user;
              if (!friend) return null;
              return (
                <div
                  key={friendship.id || friend.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={friend.avatarUrl || 'https://placehold.co/64x64?text=' + friend.firstName?.[0]}
                      alt={friend.firstName}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {friend.firstName} {friend.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                      <p className="text-xs text-primary mt-1">
                        {friend.xp || 0} XP • Level {friend.level || 1}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleMessage(friend.id)}
                    disabled={messagingUserId === friend.id}
                    className="mt-3 w-full rounded-lg border border-primary/50 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {messagingUserId === friend.id ? 'Opening...' : 'Message'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Friends from Leaderboard */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <UserPlus className="h-5 w-5 text-primary" />
          Add Friends
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 pl-10 pr-4 py-2 text-white placeholder:text-slate-500 focus:border-primary focus:outline-none"
          />
        </div>

        {availableUsers.length === 0 ? (
          <p className="text-slate-400 text-sm">
            {searchQuery ? 'No users found matching your search.' : 'No users available to add as friends.'}
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableUsers.map((entry: any) => {
              const user = entry.user;
              if (!user) return null;
              return (
                <div
                  key={user.id}
                  className="rounded-lg border border-slate-700 bg-slate-800/50 p-4 hover:border-primary/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={user.avatarUrl || 'https://placehold.co/64x64?text=' + user.firstName?.[0]}
                      alt={user.firstName}
                      className="h-12 w-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{user.email}</p>
                      <p className="text-xs text-primary mt-1">
                        {entry.xp || user.xp || 0} XP • Level {user.level || 1} • Rank #{entry.rank || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddFriend(user.id)}
                    disabled={addingFriendId === user.id}
                    className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    {addingFriendId === user.id ? (
                      <>Adding...</>
                    ) : (
                      <>
                        <UserPlus className="h-4 w-4" />
                        Add Friend
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;

