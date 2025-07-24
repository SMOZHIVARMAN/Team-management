import React, { useState, useEffect } from 'react'
import { Search, UserPlus, Check, X, Users, MessageCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface User {
  id: string
  username: string
  email: string
  bio: string | null
  avatar_url: string | null
}

interface Friend {
  id: string
  username: string
  email: string
  bio: string | null
  avatar_url: string | null
}

interface FriendRequest {
  id: string
  requester_id: string
  addressee_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  requester: User
  addressee: User
}

const Friends: React.FC = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([])
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (user) {
      fetchFriends()
      fetchFriendRequests()
      fetchSentRequests()
    }
  }, [user])

  const fetchFriends = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, email, bio, avatar_url),
          requester:profiles!friendships_requester_id_fkey(id, username, email, bio, avatar_url)
        `)
        .or(`requester_id.eq.${user!.id},addressee_id.eq.${user!.id}`)
        .eq('status', 'accepted')

      if (error) throw error

      const friendsList = data?.map(friendship => {
        const friend = friendship.requester_id === user!.id 
          ? friendship.addressee 
          : friendship.requester
        return friend
      }) || []
      
      setFriends(friendsList)
    } catch (error) {
      console.error('Error fetching friends:', error)
      toast.error('Failed to fetch friends')
    } finally {
      setLoading(false)
    }
  }

  const fetchFriendRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          requester:profiles!friendships_requester_id_fkey(id, username, email, bio, avatar_url)
        `)
        .eq('addressee_id', user!.id)
        .eq('status', 'pending')

      if (error) throw error
      setFriendRequests(data || [])
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    }
  }

  const fetchSentRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('friendships')
        .select(`
          *,
          addressee:profiles!friendships_addressee_id_fkey(id, username, email, bio, avatar_url)
        `)
        .eq('requester_id', user!.id)
        .eq('status', 'pending')

      if (error) throw error
      setSentRequests(data || [])
    } catch (error) {
      console.error('Error fetching sent requests:', error)
    }
  }

  const searchUsers = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, email, bio, avatar_url')
        .ilike('username', `%${searchQuery}%`)
        .neq('id', user!.id)
        .limit(10)

      if (error) throw error

      // Filter out existing friends and pending requests
      const existingFriendIds = friends.map(f => f.id)
      const pendingRequestIds = [
        ...friendRequests.map(r => r.requester_id),
        ...sentRequests.map(r => r.addressee_id)
      ]

      const filteredResults = data?.filter(u => 
        !existingFriendIds.includes(u.id) && 
        !pendingRequestIds.includes(u.id)
      ) || []

      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
      toast.error('Failed to search users')
    } finally {
      setSearching(false)
    }
  }

  const sendFriendRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user!.id,
          addressee_id: userId,
          status: 'pending',
        })

      if (error) throw error

      // Send notification
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Friend Request',
          message: 'You have received a new friend request',
          type: 'friend_request',
        })

      setSearchResults(searchResults.filter(u => u.id !== userId))
      fetchSentRequests()
      toast.success('Friend request sent!')
    } catch (error) {
      console.error('Error sending friend request:', error)
      toast.error('Failed to send friend request')
    }
  }

  const respondToFriendRequest = async (requestId: string, status: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('friendships')
        .update({ status })
        .eq('id', requestId)

      if (error) throw error

      if (status === 'accepted') {
        fetchFriends()
        toast.success('Friend request accepted!')
      } else {
        toast.success('Friend request declined')
      }

      fetchFriendRequests()
    } catch (error) {
      console.error('Error responding to friend request:', error)
      toast.error('Failed to respond to friend request')
    }
  }

  const cancelFriendRequest = async (requestId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      fetchSentRequests()
      toast.success('Friend request cancelled')
    } catch (error) {
      console.error('Error cancelling friend request:', error)
      toast.error('Failed to cancel friend request')
    }
  }

  const removeFriend = async (friendId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user!.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user!.id})`)

      if (error) throw error

      setFriends(friends.filter(f => f.id !== friendId))
      toast.success('Friend removed')
    } catch (error) {
      console.error('Error removing friend:', error)
      toast.error('Failed to remove friend')
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      searchUsers()
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-transparent">
            Friends
          </h1>
          <p className="text-gray-400 mt-2">Connect and collaborate with other users</p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Find Friends</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-gray-700/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search users by username..."
          />
        </div>

        {/* Search Results */}
        {searchQuery && (
          <div className="mt-4">
            {searching ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              </div>
            ) : searchResults.length === 0 ? (
              <p className="text-gray-400 text-center py-4">No users found</p>
            ) : (
              <div className="space-y-3">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                        {user.avatar_url ? (
                          <img
                            src={user.avatar_url}
                            alt={user.username}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <span className="text-white font-medium">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-white">{user.username}</h4>
                        <p className="text-gray-400 text-sm">{user.email}</p>
                        {user.bio && (
                          <p className="text-gray-400 text-xs mt-1">{user.bio}</p>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => sendFriendRequest(user.id)}
                      className="bg-gradient-to-r from-blue-500 to-violet-600 text-white px-4 py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center space-x-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      <span>Add Friend</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Friend Requests */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Friend Requests ({friendRequests.length})
          </h3>
          {friendRequests.length === 0 ? (
            <div className="text-center py-8">
              <UserPlus className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No pending requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friendRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                      {request.requester.avatar_url ? (
                        <img
                          src={request.requester.avatar_url}
                          alt={request.requester.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {request.requester.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{request.requester.username}</h4>
                      <p className="text-gray-400 text-sm">{request.requester.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => respondToFriendRequest(request.id, 'accepted')}
                      className="bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => respondToFriendRequest(request.id, 'declined')}
                      className="bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sent Requests */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">
            Sent Requests ({sentRequests.length})
          </h3>
          {sentRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No sent requests</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sentRequests.map(request => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                      {request.addressee.avatar_url ? (
                        <img
                          src={request.addressee.avatar_url}
                          alt={request.addressee.username}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-white font-medium">
                          {request.addressee.username.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-white">{request.addressee.username}</h4>
                      <p className="text-gray-400 text-sm">Request pending</p>
                    </div>
                  </div>
                  <button
                    onClick={() => cancelFriendRequest(request.id)}
                    className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Friends List */}
      <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">
          My Friends ({friends.length})
        </h3>
        {friends.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h4 className="text-xl font-semibold text-white mb-2">No friends yet</h4>
            <p className="text-gray-400">Search for users above to send friend requests</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {friends.map(friend => (
              <div key={friend.id} className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/30">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-violet-600 rounded-full flex items-center justify-center">
                    {friend.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.username}
                        className="w-12 h-12 rounded-full"
                      />
                    ) : (
                      <span className="text-white font-medium">
                        {friend.username.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white">{friend.username}</h4>
                    <p className="text-gray-400 text-sm">{friend.email}</p>
                  </div>
                </div>
                {friend.bio && (
                  <p className="text-gray-400 text-sm mb-3">{friend.bio}</p>
                )}
                <div className="flex items-center space-x-2">
                  <button className="flex-1 bg-gradient-to-r from-blue-500 to-violet-600 text-white py-2 rounded-lg hover:from-blue-600 hover:to-violet-700 transition-all duration-200 flex items-center justify-center space-x-2 text-sm">
                    <MessageCircle className="w-4 h-4" />
                    <span>Chat</span>
                  </button>
                  <button
                    onClick={() => removeFriend(friend.id)}
                    className="bg-red-500 text-white px-3 py-2 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Friends