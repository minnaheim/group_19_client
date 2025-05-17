"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message"; // For success messages
import ErrorMessage from "@/components/ui/ErrorMessage"; // For ALL error messages
import { retry } from "src/utils/retry";
import { ApplicationError } from "@/app/types/error";

// --- Interfaces (Unchanged) ---
interface FriendRequest {
  requestId: number;
  sender: User;
  receiver: User;
  accepted: boolean | null;
  creationTime: string;
  responseTime: string | null;
}

interface UserSearchResponse {
  userId: number;
  username: string;
}

// --- Component Definition ---
const FriendsManagement: React.FC = () => {
  // --- Hooks (Unchanged) ---
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  // --- State Variables ---
  const [friends, setFriends] = useState<User[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Unified Error State
  const [error, setError] = useState<string | null>(null);

  // Success Message State
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"friends" | "requests">("friends");

  // Friend request form state
  const [friendUsername, setFriendUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search functionality state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);

  // New states for user search functionality with client-side filtering
  const [allUsers, setAllUsers] = useState<UserSearchResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSearchResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [showUserSearchResults, setShowUserSearchResults] = useState<boolean>(
    false,
  );
  const [usersLoaded, setUsersLoaded] = useState<boolean>(false);

  // Ref for click outside handling
  const searchResultsRef = useRef<HTMLDivElement>(null);

  // Local storage hook (Unchanged)
  const { value: userId } = useLocalStorage<string>("userId", "");

  // --- Helper Function for Success Messages (Unchanged) ---
  const showSuccessMessageFn = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    // Clear any existing error when showing success
    setError(null);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000); // Auto-hide after 3 seconds
  };

  // --- Fetch All Users Once ---
  const fetchAllUsers = useCallback(async () => {
    if (usersLoaded || isLoadingUsers) return;

    setIsLoadingUsers(true);
    try {
      const users = await retry(() =>
        apiService.get<UserSearchResponse[]>("/users/all")
      );

      if (Array.isArray(users)) {
        setAllUsers(users);
        setUsersLoaded(true);
      } else {
        console.error("Expected array of users but got:", users);
        setError("Failed to load user data for search");
      }
    } catch (err) {
      console.error("Error fetching all users:", err);
      setError("Could not load user search. Using regular search instead.");
      setUsersLoaded(false);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // --- Filter Users Client-Side ---
  const filterUsers = useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      setFilteredUsers([]);
      setShowUserSearchResults(false);
      return;
    }

    // If we haven't loaded all users yet, try to load them
    if (!usersLoaded && !isLoadingUsers) {
      fetchAllUsers();
    }

    const normalizedSearch = searchTerm.toLowerCase().trim();

    // Get existing friend IDs and usernames of pending requests
    const existingFriendIds = friends.map((friend) => friend.userId);
    const existingSentRequestUsernames = sentRequests.map((req) =>
      req.receiver.username
    );

    // Filter users
    const filtered = allUsers.filter((user) =>
      // Contains search term
      user.username.toLowerCase().includes(normalizedSearch) &&
      // Not already a friend
      !existingFriendIds.includes(user.userId) &&
      // Not already sent a request to
      !existingSentRequestUsernames.includes(user.username) &&
      // Not the current user
      user.userId !== parseInt(userId)
    );

    setFilteredUsers(filtered);
    setShowUserSearchResults(filtered.length > 0);
  }, [allUsers, friends, sentRequests, userId]); // Remove fetchAllUsers and loading states

  // Listen for outside clicks to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node)
      ) {
        setShowUserSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // --- Fetch Friends Data Effect ---
  useEffect(() => {
    let mounted = true;

    const fetchFriendsData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch friends list
        try {
          const friendsData = await retry(() =>
            apiService.get<User[]>("/friends")
          );
          if (mounted) {
            const sortedFriends = Array.isArray(friendsData)
              ? [...friendsData].sort((a, b) =>
                a.username.localeCompare(b.username)
              )
              : [];
            setFriends(sortedFriends);
            showSuccessMessageFn("Friends list loaded");
          }
        } catch (friendsError: unknown) {
          console.error("Error fetching friends list:", friendsError);
          if (mounted) {
            if (friendsError instanceof Error && "status" in friendsError) {
              const status = (friendsError as ApplicationError).status;
              if (status === 401) {
                setError("Your session has expired. Please log in again.");
              } else if (status === 404) {
                setError("Could not find your user account.");
              } else {
                setError(
                  "Failed to load friends list. Please try again later.",
                );
              }
            } else {
              setError("Failed to load friends list. Please try again later.");
            }
          }
          setLoading(false);
          return;
        }

        // Get received friend requests
        try {
          const receivedRequestsData = await retry(() =>
            apiService.get<FriendRequest[]>("/friends/friendrequests/received")
          );
          if (mounted) {
            setReceivedRequests(
              Array.isArray(receivedRequestsData) ? receivedRequestsData : [],
            );
          }
        } catch (receivedRequestsError: unknown) {
          console.error(
            "Error fetching received friend requests:",
            receivedRequestsError,
          );
          if (mounted) {
            if (
              receivedRequestsError instanceof Error &&
              "status" in receivedRequestsError &&
              (receivedRequestsError as ApplicationError).status === 401
            ) {
              setError("Session expired. Cannot load received requests.");
            } else {
              setError("Failed to load received friend requests.");
            }
          }
        }

        // Get sent friend requests
        try {
          const sentRequestsData = await retry(() =>
            apiService.get<FriendRequest[]>("/friends/friendrequests/sent")
          );
          if (mounted) {
            setSentRequests(
              Array.isArray(sentRequestsData) ? sentRequestsData : [],
            );
          }
        } catch (sentRequestsError: unknown) {
          console.error(
            "Error fetching sent friend requests:",
            sentRequestsError,
          );
          if (mounted) {
            if (
              sentRequestsError instanceof Error &&
              "status" in sentRequestsError &&
              (sentRequestsError as ApplicationError).status === 401
            ) {
              setError("Session expired. Cannot load sent requests.");
            } else {
              setError("Failed to load sent friend requests.");
            }
          }
        }
      } catch (error) {
        console.error("Critical error loading friends data:", error);
        if (mounted) {
          setError("Failed to load friends data. Server may be unavailable.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    fetchFriendsData();

    return () => {
      mounted = false;
    };
  }, [id]); // Only depend on id

  useEffect(() => {
    // Only fetch if not already loaded or loading
    if (!usersLoaded && !isLoadingUsers) {
      fetchAllUsers();
    }
  }, []); //

  // --- Filter Friends Effect ---
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFriends(friends);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    const filtered = friends.filter((friend) =>
      friend.username.toLowerCase().includes(query) ||
      (friend.bio && friend.bio.toLowerCase().includes(query))
    );
    setFilteredFriends(filtered);
  }, [searchQuery, friends]);

  // Update filtered users whenever friendUsername changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (friendUsername.trim().length >= 1) {
        filterUsers(friendUsername);
      } else {
        setFilteredUsers([]);
        setShowUserSearchResults(false);
      }
    }, 200); // Quick response time for autocomplete feeling

    return () => clearTimeout(debounceTimer);
  }, [friendUsername, filterUsers]);

  // --- Handle Clicking on a User Search Result ---
  const handleSelectUser = (user: UserSearchResponse) => {
    setFriendUsername(user.username);
    setShowUserSearchResults(false);
  };

  // --- Handle Sending Friend Request ---
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Validation Error
    if (!friendUsername.trim()) {
      setError("Please enter a username");
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(""); // Clear previous success

    try {
      // --- Block: Find user by username ---
      try {
        const searchResults = await retry(() =>
          apiService.get<UserSearchResponse[]>(
            `/users/search?username=${encodeURIComponent(friendUsername)}`,
          )
        );
        if (
          !searchResults || !Array.isArray(searchResults) ||
          searchResults.length === 0
        ) {
          setError(
            `User "${friendUsername}" not found. Please check the username.`,
          );
          setIsSubmitting(false);
          return;
        }
        // --- End Block: Find user by username ---

        // --- Block: Send the actual request ---
        const receiverId = searchResults[0].userId;
        try {
          await apiService.post(`/friends/add/${receiverId}`, {});
          showSuccessMessageFn(`Friend request sent to ${friendUsername}`); // Success
          setFriendUsername("");

          // --- Block: Refresh sent requests list after sending ---
          try {
            const updatedSentRequests = await retry(() =>
              apiService.get<FriendRequest[]>("/friends/friendrequests/sent")
            );
            setSentRequests(
              Array.isArray(updatedSentRequests) ? updatedSentRequests : [],
            );
          } catch (refreshError) {
            console.error(
              "Error refreshing sent requests after sending new request:",
              refreshError,
            );
            setError(
              "Request sent, but failed to refresh list. Please reload.",
            );
          }
          // --- End Block: Refresh sent requests list ---

          setActiveTab("requests");
        } catch (sendRequestError) {
          console.error(
            "Error sending friend request to user:",
            sendRequestError,
          );
          if (sendRequestError instanceof Error) {
            setError(`Failed to send request: ${sendRequestError.message}`);
          } else {
            setError(
              "Failed to send request. User may be friend or request pending.",
            );
          }
        }
        // --- End Block: Send the actual request ---
      } catch (searchError: unknown) {
        console.error("Error searching for user by username:", searchError);
        if (
          searchError instanceof Error && "status" in searchError &&
          (searchError as ApplicationError).status === 401
        ) {
          setError("Session expired. Please log in again.");
        } else {
          setError(`Error searching for user "${friendUsername}".`);
        }
      }
    } catch (error) {
      console.error("Critical error in friend request process:", error);
      setError("Friend request failed unexpectedly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Other existing methods remain unchanged
  const handleAcceptRequest = async (requestId: number) => {
    // Existing implementation
    setError(null);
    setSuccessMessage("");
    try {
      try {
        await apiService.post(`/friends/friendrequest/${requestId}/accept`, {});
        showSuccessMessageFn("Friend request accepted");

        // Refresh friends list after accepting
        try {
          const updatedFriends = await retry(() =>
            apiService.get<User[]>("/friends")
          );
          setFriends(
            Array.isArray(updatedFriends)
              ? [...updatedFriends].sort((a, b) =>
                a.username.localeCompare(b.username)
              )
              : [],
          );
        } catch (refreshFriendsError) {
          console.error(
            "Error refreshing friends list after accepting request:",
            refreshFriendsError,
          );
          setError(
            "Accepted, but failed to refresh friends list. Please reload.",
          );
        }

        // Refresh received requests list after accepting
        try {
          const updatedRequests = await retry(() =>
            apiService.get<FriendRequest[]>("/friends/friendrequests/received")
          );
          setReceivedRequests(
            Array.isArray(updatedRequests) ? updatedRequests : [],
          );
        } catch (refreshRequestsError) {
          console.error(
            "Error refreshing received requests after accepting:",
            refreshRequestsError,
          );
          setError(
            "Accepted, but failed to refresh requests list. Please reload.",
          );
        }
      } catch (acceptError: unknown) {
        console.error(
          `Error accepting friend request ID ${requestId}:`,
          acceptError,
        );
        if (acceptError instanceof Error && "status" in acceptError) {
          const status = (acceptError as ApplicationError).status;
          switch (status) {
            case 400:
              setError("Invalid friend request.");
              break;
            case 401:
              setError("Session expired. Please log in again.");
              break;
            case 404:
              setError("Request not found (may be cancelled).");
              break;
            default:
              setError("Failed to accept friend request.");
          }
        } else {
          setError("Failed to accept friend request.");
        }
      }
    } catch (error) {
      console.error("Critical error in accept friend request process:", error);
      setError("Server error accepting request.");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    // Existing implementation
    setError(null);
    setSuccessMessage("");
    try {
      try {
        await apiService.post(`/friends/friendrequest/${requestId}/reject`, {});
        showSuccessMessageFn("Friend request rejected");

        try {
          const updatedRequests = await retry(() =>
            apiService.get<FriendRequest[]>("/friends/friendrequests/received")
          );
          setReceivedRequests(
            Array.isArray(updatedRequests) ? updatedRequests : [],
          );
        } catch (refreshError) {
          console.error(
            "Error refreshing received requests after rejection:",
            refreshError,
          );
          setError("Rejected, but failed to refresh list. Please reload.");
        }
      } catch (rejectError: unknown) {
        console.error(
          `Error rejecting friend request ID ${requestId}:`,
          rejectError,
        );
        if (rejectError instanceof Error && "status" in rejectError) {
          const status = (rejectError as ApplicationError).status;
          switch (status) {
            case 400:
              setError("Invalid friend request.");
              break;
            case 401:
              setError("Session expired. Please log in again.");
              break;
            case 404:
              setError("Request not found (may be cancelled).");
              break;
            default:
              setError("Failed to reject friend request.");
          }
        } else {
          setError("Failed to reject friend request.");
        }
      }
    } catch (error) {
      console.error("Critical error in reject friend request process:", error);
      setError("Server error rejecting request.");
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    // Existing implementation
    setError(null);
    setSuccessMessage("");
    try {
      const request = sentRequests.find((req) => req.requestId === requestId);
      if (!request) {
        setError("Cannot find the request to cancel");
        return;
      }

      try {
        await apiService.delete(`/friends/friendrequest/${request.requestId}`);
        showSuccessMessageFn("Friend request canceled");

        try {
          const updatedSentRequests = await retry(() =>
            apiService.get<FriendRequest[]>("/friends/friendrequests/sent")
          );
          setSentRequests(
            Array.isArray(updatedSentRequests) ? updatedSentRequests : [],
          );
        } catch (refreshError) {
          console.error(
            "Error refreshing sent requests after cancellation:",
            refreshError,
          );
          setError("Canceled, but failed to refresh list. Please reload.");
        }
      } catch (cancelError: unknown) {
        console.error(
          `Error canceling friend request ID ${requestId}:`,
          cancelError,
        );
        if (cancelError instanceof Error && "status" in cancelError) {
          const status = (cancelError as ApplicationError).status;
          switch (status) {
            case 400:
              setError("Invalid friend request.");
              break;
            case 401:
              setError("Session expired. Please log in again.");
              break;
            case 403:
              setError("Cannot cancel request you didn't send.");
              break;
            case 404:
              setError("Request not found.");
              break;
            default:
              setError("Failed to cancel friend request.");
          }
        } else {
          setError("Failed to cancel friend request.");
        }
      }
    } catch (error) {
      console.error("Critical error in cancel friend request process:", error);
      setError("Unexpected error canceling request.");
    }
  };

  const handleRemoveFriend = async (friendId: number) => {
    // Existing implementation
    setError(null);
    setSuccessMessage("");
    try {
      try {
        await apiService.delete(`/friends/remove/${friendId}`);
        showSuccessMessageFn("Friend removed successfully");

        try {
          const updatedFriends = await retry(() =>
            apiService.get<User[]>("/friends")
          );
          setFriends(
            Array.isArray(updatedFriends)
              ? [...updatedFriends].sort((a, b) =>
                a.username.localeCompare(b.username)
              )
              : [],
          );
        } catch (refreshError) {
          console.error(
            "Error refreshing friends list after removing friend:",
            refreshError,
          );
          setError("Removed, but failed to refresh list. Please reload.");
        }
      } catch (removeError: unknown) {
        console.error(
          `Error removing friend with ID ${friendId}:`,
          removeError,
        );
        if (removeError instanceof Error && "status" in removeError) {
          const status = (removeError as ApplicationError).status;
          switch (status) {
            case 400:
              setError("Could not remove friend (Invalid request).");
              break;
            case 401:
              setError("Session expired. Please log in again.");
              break;
            case 404:
              setError("Could not find friend/user account.");
              break;
            default:
              setError("Failed to remove friend.");
          }
        } else {
          setError("Failed to remove friend.");
        }
      }
    } catch (error) {
      console.error("Critical error in remove friend process:", error);
      setError("Server error removing friend.");
    }
  };

  const navigateToFriendWatchlist = (friendId: number) => {
    router.push(`/users/${userId}/friends/${friendId}/watchlist`);
  };

  const getRequestCount = () => {
    return receivedRequests.length + sentRequests.length;
  };

  // --- Render Logic ---
  // Loading state (Unchanged)
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]">
        </div>
      </div>
    );
  }

  // Determine friends to display (Unchanged)
  const displayFriends = searchQuery ? filteredFriends : friends;

  // Main component return (JSX)
  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation (Unchanged) */}
      <Navigation userId={userId} activeItem="Your Friends" />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto relative">
        {/* --- Unified Error Display --- */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* --- Success Message Display Area --- */}
        <div className="fixed bottom-4 right-4 z-50">
          <ActionMessage
            message={successMessage}
            isVisible={showSuccessMessage}
            onHide={() => setShowSuccessMessage(false)}
            className="bg-green-500" // Success styling
          />
        </div>

        {/* Page Header (Unchanged) */}
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">
            Your Friends
          </h1>
          <p className="text-[#3b3e88] mt-2">
            Connect and share movie experiences with friends
          </p>
        </div>

        {/* Add friend form (CLIENT-SIDE FILTERING) */}
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-3xl p-6 mb-8 shadow-md text-white">
          <h2 className="text-xl font-semibold mb-4">Add a Friend</h2>
          <form
            onSubmit={handleSendFriendRequest}
            className="flex flex-col sm:flex-row gap-4"
          >
            <div className="flex-grow relative">
              <input
                type="text"
                value={friendUsername}
                onChange={(e) => setFriendUsername(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl border-0 bg-white/20 backdrop-blur-sm placeholder-white/70 text-white focus:ring-2 focus:ring-white/50 focus:outline-none"
                placeholder="Start typing a username..."
                disabled={isSubmitting}
                autoComplete="off"
              />

              {/* Client-Side Filtered Results Dropdown */}
              {showUserSearchResults && friendUsername.trim().length >= 1 && (
                <div
                  ref={searchResultsRef}
                  className="absolute z-50 mt-2 w-full bg-white rounded-2xl shadow-lg max-h-64 overflow-y-auto"
                >
                  {isLoadingUsers && !usersLoaded
                    ? (
                      <div className="p-4 text-center text-gray-600">
                        <div className="inline-block animate-spin h-4 w-4 border-2 border-[#3b3e88] border-t-transparent rounded-full mr-2">
                        </div>
                        Loading users...
                      </div>
                    )
                    : filteredUsers.length > 0
                    ? (
                      <ul>
                        {filteredUsers.map((user) => (
                          <li
                            key={user.userId}
                            onClick={() => handleSelectUser(user)}
                            className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors text-[#3b3e88] font-medium border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl flex items-center"
                          >
                            <span>{user.username}</span>
                          </li>
                        ))}
                      </ul>
                    )
                    : usersLoaded
                    ? (
                      <div className="p-4 text-center text-gray-600">
                        {allUsers.length > 0
                          ? "No matching users found"
                          : "No users available to add"}
                      </div>
                    )
                    : (
                      <div className="p-4 text-center text-gray-600">
                        Failed to load users for search
                      </div>
                    )}
                </div>
              )}
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

        {/* Tab navigation (Unchanged) */}
        <div className="flex border-b border-[#3b3e88]/20 mb-6">
          <button
            className={`px-6 py-3 font-medium text-base ${
              activeTab === "friends"
                ? "text-[#3b3e88] border-b-2 border-[#3b3e88]"
                : "text-[#3b3e88]/60 hover:text-[#3b3e88]/80"
            }`}
            onClick={() => setActiveTab("friends")}
          >
            Friends
          </button>
          <button
            className={`px-6 py-3 font-medium text-base relative ${
              activeTab === "requests"
                ? "text-[#3b3e88] border-b-2 border-[#3b3e88]"
                : "text-[#3b3e88]/60 hover:text-[#3b3e88]/80"
            }`}
            onClick={() => setActiveTab("requests")}
          >
            Requests
            {getRequestCount() > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs flex items-center justify-center rounded-full">
                {getRequestCount()}
              </span>
            )}
          </button>
        </div>

        {/* Conditional Rendering of Tabs (Structure Unchanged) */}
        {activeTab === "friends" && (
          <>
            {/* Search bar */}
            <div className="mb-6 relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
                <svg
                  className="w-5 h-5 text-white/70"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  >
                  </path>
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
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M6 18L18 6M6 6l12 12"
                    >
                    </path>
                  </svg>
                </button>
              )}
            </div>

            {/* Friends grid */}
            {displayFriends.length > 0
              ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayFriends.map((friend) => (
                    <div
                      key={friend.userId}
                      className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden"
                    >
                      <div>
                        <h3 className="font-semibold text-[#3b3e88] mb-1">
                          {friend.username}
                        </h3>
                        {friend.bio && (
                          <p className="text-[#838bad] text-xs mb-2">
                            {friend.bio}
                          </p>
                        )}

                        {/* Favorite movie section */}
                        {friend.favoriteMovie && (
                          <div className="mb-2">
                            <p className="text-xs text-[#3b3e88]/60 mb-1">
                              Favorite Movie
                            </p>
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
                        {friend.favoriteGenres &&
                          friend.favoriteGenres.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-[#3b3e88]/60 mb-1">
                              Favorite Genres
                            </p>
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
                            onClick={() =>
                              navigateToFriendWatchlist(friend.userId)}
                          >
                            View Watchlist
                          </Button>
                          <Button
                            variant="outline"
                            className="border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl w-8 p-0 flex items-center justify-center"
                            onClick={() => handleRemoveFriend(friend.userId)}
                          >
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              >
                              </path>
                            </svg>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                  {searchQuery
                    ? (
                      <div>
                        <p className="text-[#838bad] mb-4">
                          No friends match your search &#34;{searchQuery}&#34;
                        </p>
                        <Button
                          variant="outline"
                          className="rounded-xl border-[#3b3e88] text-[#3b3e88]"
                          onClick={() => setSearchQuery("")}
                        >
                          Clear Search
                        </Button>
                      </div>
                    )
                    : (
                      <div>
                        <div className="flex justify-center mb-4">
                          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                            <svg
                              className="w-10 h-10 text-indigo-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                              >
                              </path>
                            </svg>
                          </div>
                        </div>
                        <p className="text-[#3b3e88] mb-2">
                          You don&#39;t have any friends yet
                        </p>
                        <p className="text-[#838bad] mb-6">
                          Send a friend request to get started!
                        </p>
                      </div>
                    )}
                </div>
              )}
          </>
        )}

        {activeTab === "requests" && (
          <div className="space-y-6">
            {/* Received requests section */}
            {receivedRequests.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[#3b3e88] font-medium text-lg mb-4">
                  Received Requests
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-400"
                    >
                      <div className="mb-3">
                        <h4 className="font-semibold text-[#3b3e88]">
                          {request.sender.username}
                        </h4>
                        <p className="text-[#3b3e88] text-xs">
                          Sent{" "}
                          {new Date(request.creationTime).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1"
                          onClick={() => handleAcceptRequest(request.requestId)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1"
                          onClick={() => handleRejectRequest(request.requestId)}
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
                <h3 className="text-[#3b3e88] font-medium text-lg mb-4">
                  Sent Requests
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sentRequests.map((request) => (
                    <div
                      key={request.requestId}
                      className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-indigo-400"
                    >
                      <div className="mb-3">
                        <h4 className="font-semibold text-[#3b3e88]">
                          {request.receiver.username}
                        </h4>
                        <p className="text-[#3b3e88] text-xs">
                          Sent{" "}
                          {new Date(request.creationTime).toLocaleDateString()}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl"
                        onClick={() => handleCancelRequest(request.requestId)}
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
                    <svg
                      className="w-10 h-10 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      >
                      </path>
                    </svg>
                  </div>
                </div>
                <p className="text-[#3b3e88] mb-2">
                  No pending friend requests
                </p>
                <p className="text-[#838bad]">
                  Send a request or wait for someone to add you!
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsManagement;
