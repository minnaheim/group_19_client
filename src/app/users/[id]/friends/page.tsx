"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message";

interface FriendRequest {
  id: number;
  sender: User;
  receiver: User;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
}

interface UserSearchResponse {
  userId: number;
  username: string;
}

const FriendsManagement: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // Friend request form
  const [friendUsername, setFriendUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);

  const { value: userId } = useLocalStorage<string>("userId", "");

  // Fetch friends data
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        // Get all friends
        const friendsData = await apiService.get<User[]>('/friends');
        // Sort friends alphabetically by username
        const sortedFriends = Array.isArray(friendsData)
            ? [...friendsData].sort((a, b) => a.username.localeCompare(b.username))
            : [];
        setFriends(sortedFriends);

        // Get received friend requests
        const receivedRequestsData = await apiService.get<FriendRequest[]>('/friends/friendrequests/received');
        setReceivedRequests(Array.isArray(receivedRequestsData) ? receivedRequestsData : []);

        // Get sent friend requests
        const sentRequestsData = await apiService.get<FriendRequest[]>('/friends/friendrequests/sent');
        setSentRequests(Array.isArray(sentRequestsData) ? sentRequestsData : []);
      } catch (error) {
        setError("Failed to load friends data");
        console.error("Error loading friends:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [id, apiService]);

  // Filter friends based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = friends.filter(friend =>
        friend.username.toLowerCase().includes(query) ||
        (friend.bio && friend.bio.toLowerCase().includes(query))
    );

    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  // Show notification message
  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  // Handle sending a friend request
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!friendUsername.trim()) {
      showMessage("Please enter a username");
      return;
    }

    setIsSubmitting(true);

    try {
      // First, find the receiverId based on username
      const searchResults = await apiService.get<UserSearchResponse[]>(
          `/users/search?username=${encodeURIComponent(friendUsername)}`
      );

      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        showMessage(`Could not find user with username ${friendUsername}`);
        setIsSubmitting(false);
        return;
      }

      // Take the first matching user
      const receiverId = searchResults[0].userId;

      await apiService.post(`/friends/add/${receiverId}`, {});

      showMessage(`Friend request sent to ${friendUsername}`);
      setFriendUsername("");

      // Refresh
      const updatedSentRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/sent');
      setSentRequests(Array.isArray(updatedSentRequests) ? updatedSentRequests : []);

      // Switch to requests tab to show the new request
      setActiveTab('requests');
    } catch (error) {
      console.error("Error sending friend request:", error);
      if (error instanceof Error) {
        showMessage(`Failed to send friend request: ${error.message}`);
      } else {
        showMessage("Failed to send friend request");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle accepting a friend request
  const handleAcceptRequest = async (requestId: number) => {
    try {
      await apiService.post(`/friends/friendrequest/${requestId}/accept`, {});

      showMessage("Friend request accepted");

      // Refresh data
      const updatedFriends = await apiService.get<User[]>('/friends');
      // Sort friends alphabetically
      setFriends(Array.isArray(updatedFriends)
          ? [...updatedFriends].sort((a, b) => a.username.localeCompare(b.username))
          : []);

      const updatedRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/received');
      setReceivedRequests(Array.isArray(updatedRequests) ? updatedRequests : []);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      showMessage("Failed to accept friend request");
    }
  };

  // Handle rejecting a friend request
  const handleRejectRequest = async (requestId: number) => {
    try {
      await apiService.post(`/friends/friendrequest/${requestId}/reject`, {});

      showMessage("Friend request rejected");

      // Refresh data
      const updatedRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/received');
      setReceivedRequests(Array.isArray(updatedRequests) ? updatedRequests : []);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      showMessage("Failed to reject friend request");
    }
  };

  // Handle canceling a sent friend request
  const handleCancelRequest = async (requestId: number) => {
    try {
      const request = sentRequests.find(req => req.id === requestId);
      if (!request) return;

      // Use remove friend endpoint
      await apiService.delete(`/friends/remove/${request.receiver.userId}`);

      showMessage("Friend request canceled");

      // Refresh sent requests
      const updatedSentRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/sent');
      setSentRequests(Array.isArray(updatedSentRequests) ? updatedSentRequests : []);
    } catch (error) {
      console.error("Error canceling friend request:", error);
      showMessage("Failed to cancel friend request");
    }
  };

  // Handle removing a friend
  const handleRemoveFriend = async (friendId: number) => {
    try {
      // Remove friend
      await apiService.delete(`/friends/remove/${friendId}`);

      showMessage("Friend removed");

      // Refresh friends list
      const updatedFriends = await apiService.get<User[]>('/friends');
      // Sort friends alphabetically
      setFriends(Array.isArray(updatedFriends)
          ? [...updatedFriends].sort((a, b) => a.username.localeCompare(b.username))
          : []);
    } catch (error) {
      console.error("Error removing friend:", error);
      showMessage("Failed to remove friend");
    }
  };

  // Navigate to friend's watchlist
  const navigateToFriendWatchlist = (friendId: number) => {
    router.push(`/users/${userId}/friends/${friendId}/watchlist`);
  };

  // Get request count for badge
  const getRequestCount = () => {
    return receivedRequests.length + sentRequests.length;
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  const displayFriends = searchQuery ? filteredFriends : friends;

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation */}
        <Navigation userId={userId} activeItem="Your Friends" />

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">Your Friends</h1>
            <p className="text-[#b9c0de] mt-2">
              Connect and share movie experiences with friends
            </p>
          </div>

          {/* Add friend form */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-3xl p-6 mb-8 shadow-md text-white">
            <h2 className="text-xl font-semibold mb-4">Add a Friend</h2>
            <form onSubmit={handleSendFriendRequest} className="flex flex-col sm:flex-row gap-4">
              <div className="flex-grow">
                <input
                    type="text"
                    value={friendUsername}
                    onChange={(e) => setFriendUsername(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl border-0 bg-white/20 backdrop-blur-sm placeholder-white/70 text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
                    placeholder="Enter username"
                    disabled={isSubmitting}
                />
              </div>
              <Button
                  type="submit"
                  className="bg-white text-orange-500 hover:bg-white/90 px-6 py-3 rounded-2xl font-medium shadow-sm transition-all"
                  disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Request"}
              </Button>
            </form>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b border-[#3b3e88]/20 mb-6">
            <button
                className={`px-6 py-3 font-medium text-base ${
                    activeTab === 'friends'
                        ? 'text-[#3b3e88] border-b-2 border-[#3b3e88]'
                        : 'text-[#b9c0de] hover:text-[#3b3e88]/70'
                }`}
                onClick={() => setActiveTab('friends')}
            >
              Friends
            </button>
            <button
                className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === 'requests'
                        ? 'text-[#3b3e88] border-b-2 border-[#3b3e88]'
                        : 'text-[#b9c0de] hover:text-[#3b3e88]/70'
                }`}
                onClick={() => setActiveTab('requests')}
            >
              Requests
              {getRequestCount() > 0 && (
                  <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs flex items-center justify-center rounded-full">
                {getRequestCount()}
              </span>
              )}
            </button>
          </div>

          {/* Friends list */}
          {activeTab === 'friends' && (
              <>
                {/* Search bar */}
                <div className="mb-6 relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                    <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-rose-400 to-rose-500 rounded-2xl border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:outline-none"
                      placeholder="Search friends..."
                  />
                  {searchQuery && (
                      <button
                          className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/70 hover:text-white"
                          onClick={() => setSearchQuery("")}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                      </button>
                  )}
                </div>

                {/* Friends grid */}
                {displayFriends.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {displayFriends.map(friend => (
                          <div key={friend.userId} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden">
                            <div>
                              <h3 className="font-semibold text-[#3b3e88] mb-1">{friend.username}</h3>
                              {friend.bio && (
                                  <p className="text-[#838bad] text-xs mb-2">{friend.bio}</p>
                              )}

                              {/* Favorite movie section */}
                              {friend.favoriteMovie && (
                                  <div className="mb-2">
                                    <p className="text-xs text-[#3b3e88]/60 mb-1">Favorite Movie</p>
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-12 bg-indigo-100 rounded overflow-hidden flex-shrink-0">
                                        <img
                                            src={friend.favoriteMovie.posterURL}
                                            alt={friend.favoriteMovie.title}
                                            className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <span className="text-xs font-medium line-clamp-1 text-[#3b3e88]">
                              {friend.favoriteMovie.title}
                            </span>
                                    </div>
                                  </div>
                              )}

                              {/* Favorite genres */}
                              {friend.favoriteGenres && friend.favoriteGenres.length > 0 && (
                                  <div className="mb-3">
                                    <div className="flex flex-wrap gap-1">
                                      {friend.favoriteGenres.map((genre, idx) => (
                                          <span
                                              key={idx}
                                              className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full"
                                          >
                                {genre}
                              </span>
                                      ))}
                                    </div>
                                  </div>
                              )}

                              <div className="flex flex-row gap-2">
                                <Button
                                    className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1"
                                    onClick={() => navigateToFriendWatchlist(friend.userId)}
                                >
                                  View Watchlist
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl w-8 p-0 flex items-center justify-center"
                                    onClick={() => handleRemoveFriend(friend.userId)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                  </svg>
                                </Button>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                      {searchQuery ? (
                          <div>
                            <p className="text-[#838bad] mb-4">No friends match your search &#34;{searchQuery}&#34;</p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-[#3b3e88] text-[#3b3e88]"
                                onClick={() => setSearchQuery("")}
                            >
                              Clear Search
                            </Button>
                          </div>
                      ) : (
                          <div>
                            <div className="flex justify-center mb-4">
                              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                                <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                                </svg>
                              </div>
                            </div>
                            <p className="text-[#838bad] mb-2">You don&#39;t have any friends yet</p>
                            <p className="text-[#b9c0de] mb-6">Send a friend request to get started!</p>
                          </div>
                      )}
                    </div>
                )}
              </>
          )}

          {/* Friend Requests */}
          {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Received requests section */}
                {receivedRequests.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-[#3b3e88] font-medium text-lg mb-4">Received Requests</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {receivedRequests.map(request => (
                            <div key={request.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-400">
                              <div className="mb-3">
                                <h4 className="font-semibold text-[#3b3e88]">{request.sender.username}</h4>
                                <p className="text-[#b9c0de] text-xs">
                                  Sent {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                    className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1"
                                    onClick={() => handleAcceptRequest(request.id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1"
                                    onClick={() => handleRejectRequest(request.id)}
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* Sent requests section */}
                {sentRequests.length > 0 && (
                    <div>
                      <h3 className="text-[#3b3e88] font-medium text-lg mb-4">Sent Requests</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sentRequests.map(request => (
                            <div key={request.id} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-indigo-400">
                              <div className="mb-3">
                                <h4 className="font-semibold text-[#3b3e88]">{request.receiver.username}</h4>
                                <p className="text-[#b9c0de] text-xs">
                                  Sent {new Date(request.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Button
                                  variant="outline"
                                  className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl"
                                  onClick={() => handleCancelRequest(request.id)}
                              >
                                Cancel Request
                              </Button>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* No requests state */}
                {receivedRequests.length === 0 && sentRequests.length === 0 && (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                      <div className="flex justify-center mb-4">
                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                          </svg>
                        </div>
                      </div>
                      <p className="text-[#838bad] mb-2">No pending friend requests</p>
                      <p className="text-[#b9c0de]">Send a request or wait for someone to add you!</p>
                    </div>
                )}
              </div>
          )}

          {/* Action Message */}
          <ActionMessage
              message={actionMessage}
              isVisible={showActionMessage}
              onHide={() => setShowActionMessage(false)}
          />
        </div>
      </div>
  );
};

export default FriendsManagement;