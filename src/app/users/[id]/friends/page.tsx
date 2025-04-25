"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message"; // For success messages
import ErrorMessage from "@/components/ui/ErrorMessage"; // For ALL error messages
import { retry } from 'src/utils/retry';
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

  // Unified Error State (NEW APPROACH: Handles ALL errors)
  const [error, setError] = useState<string | null>(null);

  // Success Message State (Unchanged from previous refactor)
  const [successMessage, setSuccessMessage] = useState<string>("");
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);

  // REMOVED Temporary Error State
  // const [tempError, setTempError] = useState<string>("");
  // const [showTempError, setShowTempError] = useState<boolean>(false);


  const [activeTab, setActiveTab] = useState<'friends' | 'requests'>('friends');

  // Friend request form state
  const [friendUsername, setFriendUsername] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search functionality state
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredFriends, setFilteredFriends] = useState<User[]>([]);

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

  // REMOVED Helper Function for Temporary Errors
  // const showTemporaryErrorFn = (message: string) => { ... };


  // --- Fetch Friends Data Effect ---
  useEffect(() => {
    const fetchFriendsData = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null); // Clear previous errors on new fetch attempt

        // --- Block: Fetch friends list ---
        try {
          const friendsData = await retry(() => apiService.get<User[]>('/friends'));
          const sortedFriends = Array.isArray(friendsData)
              ? [...friendsData].sort((a, b) => a.username.localeCompare(b.username))
              : [];
          setFriends(sortedFriends);
          showSuccessMessageFn('Friends list loaded'); // Success
        } catch (friendsError: unknown) {
          console.error("Error fetching friends list:", friendsError);
          // ALL errors now use setError
          if (friendsError instanceof Error && 'status' in friendsError) {
            const status = (friendsError as ApplicationError).status;
            if (status === 401) {
              setError('Your session has expired. Please log in again.'); // Use setError
            } else if (status === 404) {
              setError('Could not find your user account.'); // Use setError
            } else {
              setError('Failed to load friends list. Please try again later.'); // Use setError
            }
          } else {
            setError('Failed to load friends list. Please try again later.'); // Use setError
          }
          setLoading(false);
          return; // Stop fetching if primary data failed
        }
        // --- End Block: Fetch friends list ---


        // --- Block: Get received friend requests ---
        try {
          const receivedRequestsData = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/received'));
          setReceivedRequests(Array.isArray(receivedRequestsData) ? receivedRequestsData : []);
          // showSuccessMessageFn('Received requests loaded'); // Optional success message
        } catch (receivedRequestsError: unknown) {
          console.error("Error fetching received friend requests:", receivedRequestsError);
          // ALL errors now use setError
          if (receivedRequestsError instanceof Error && 'status' in receivedRequestsError && (receivedRequestsError as ApplicationError).status === 401) {
             setError('Session expired. Cannot load received requests.'); // Use setError
          } else {
            setError('Failed to load received friend requests.'); // Use setError
          }
          // Do not return here, allow component to render with partial data if possible
        }
        // --- End Block: Get received friend requests ---


        // --- Block: Get sent friend requests ---
        try {
          const sentRequestsData = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/sent'));
          setSentRequests(Array.isArray(sentRequestsData) ? sentRequestsData : []);
           // showSuccessMessageFn('Sent requests loaded'); // Optional success message
        } catch (sentRequestsError: unknown) {
          console.error("Error fetching sent friend requests:", sentRequestsError);
          // ALL errors now use setError
          if (sentRequestsError instanceof Error && 'status' in sentRequestsError && (sentRequestsError as ApplicationError).status === 401) {
            setError('Session expired. Cannot load sent requests.'); // Use setError
          } else {
            setError('Failed to load sent friend requests.'); // Use setError
          }
        }
        // --- End Block: Get sent friend requests ---

      } catch (error) {
        console.error("Critical error loading friends data:", error);
        setError("Failed to load friends data. Server may be unavailable."); // Use setError
      } finally {
        setLoading(false);
      }
    };

    fetchFriendsData();
  }, [id, apiService]); // Dependencies unchanged


  // --- Filter Friends Effect (Unchanged) ---
  useEffect(() => {
    // ... (filtering logic remains the same) ...
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


  // --- Handle Sending Friend Request ---
  const handleSendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // Validation Error
    if (!friendUsername.trim()) {
      setError("Please enter a username"); // Use setError
      return;
    }

    setIsSubmitting(true);
    setSuccessMessage(""); // Clear previous success

    try {
      // --- Block: Find user by username ---
      try {
        const searchResults = await retry(() => apiService.get<UserSearchResponse[]>(
          `/users/search?username=${encodeURIComponent(friendUsername)}`
        ));
        if (!searchResults) {
          setError(`User "${friendUsername}" not found. Please check the username.`);
          setIsSubmitting(false);
          return;
        }
        // Use exact match to avoid ambiguous substring results
        const matchedUser = searchResults.find(u =>
          u.username.toLowerCase() === friendUsername.trim().toLowerCase()
        );
        if (!matchedUser) {
          setError(`User "${friendUsername}" not found. Please check the username.`);
          setIsSubmitting(false);
          return;
        }
        const receiverId = matchedUser.userId;
        // --- End Block: Find user by username ---


        // --- Block: Send the actual request ---
        try {
          await apiService.post(`/friends/add/${receiverId}`, {});
          showSuccessMessageFn(`Friend request sent to ${friendUsername}`); // Success
          setFriendUsername("");

          // --- Block: Refresh sent requests list after sending ---
          try {
            const updatedSentRequests = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/sent'));
            setSentRequests(Array.isArray(updatedSentRequests) ? updatedSentRequests : []);
          } catch (refreshError) {
            console.error("Error refreshing sent requests after sending new request:", refreshError);
            // Warning treated as error
            setError("Request sent, but failed to refresh list. Please reload."); // Use setError
          }
          // --- End Block: Refresh sent requests list ---

          setActiveTab('requests');
        } catch (sendRequestError) {
          console.error("Error sending friend request to user:", sendRequestError);
          if (sendRequestError instanceof Error) {
             setError(`Failed to send request: ${sendRequestError.message}`); // Use setError
          } else {
            setError("Failed to send request. User may be friend or request pending."); // Use setError
          }
        }
        // --- End Block: Send the actual request ---

      } catch (searchError: unknown) {
        console.error("Error searching for user by username:", searchError);
        if (searchError instanceof Error && 'status' in searchError && (searchError as ApplicationError).status === 401) {
          setError('Session expired. Please log in again.'); // Use setError
        } else {
          setError(`Error searching for user "${friendUsername}".`); // Use setError
        }
      }
    } catch (error) {
      console.error("Critical error in friend request process:", error);
      setError("Friend request failed unexpectedly."); // Use setError
    } finally {
      setIsSubmitting(false);
    }
  };


  // --- Handle Accepting Friend Request ---
  const handleAcceptRequest = async (requestId: number) => {
    setError(null); // Clear previous errors
    setSuccessMessage(""); // Clear previous success
    try {
      // --- Block: Accept request API call ---
      try {
        await apiService.post(`/friends/friendrequest/${requestId}/accept`, {});
        showSuccessMessageFn("Friend request accepted"); // Success

        // --- Block: Refresh friends list after accepting ---
        try {
          const updatedFriends = await retry(() => apiService.get<User[]>('/friends'));
          setFriends(Array.isArray(updatedFriends)
              ? [...updatedFriends].sort((a, b) => a.username.localeCompare(b.username))
              : []);
        } catch (refreshFriendsError) {
          console.error("Error refreshing friends list after accepting request:", refreshFriendsError);
          setError("Accepted, but failed to refresh friends list. Please reload."); // Use setError
        }
        // --- End Block: Refresh friends list ---

        // --- Block: Refresh received requests list after accepting ---
        try {
          const updatedRequests = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/received'));
          setReceivedRequests(Array.isArray(updatedRequests) ? updatedRequests : []);
        } catch (refreshRequestsError) {
          console.error("Error refreshing received requests after accepting:", refreshRequestsError);
           setError("Accepted, but failed to refresh requests list. Please reload."); // Use setError
        }
        // --- End Block: Refresh received requests list ---

      } catch (acceptError: unknown) {
        console.error(`Error accepting friend request ID ${requestId}:`, acceptError);
        if (acceptError instanceof Error && 'status' in acceptError) {
          const status = (acceptError as ApplicationError).status;
          switch (status) {
            case 400:
              setError('Invalid friend request.'); // Use setError
              break;
            case 401:
              setError('Session expired. Please log in again.'); // Use setError
              break;
            case 404:
              setError('Request not found (may be cancelled).'); // Use setError
              break;
            default:
              setError('Failed to accept friend request.'); // Use setError
          }
        } else {
          setError('Failed to accept friend request.'); // Use setError
        }
      }
      // --- End Block: Accept request API call ---
    } catch (error) {
      console.error("Critical error in accept friend request process:", error);
      setError("Server error accepting request."); // Use setError
    }
  };


  // --- Handle Rejecting Friend Request ---
  const handleRejectRequest = async (requestId: number) => {
     setError(null); // Clear previous errors
     setSuccessMessage(""); // Clear previous success
    try {
      // --- Block: Reject request API call ---
      try {
        await apiService.post(`/friends/friendrequest/${requestId}/reject`, {});
        showSuccessMessageFn("Friend request rejected"); // Success

        // --- Block: Refresh received requests list after rejecting ---
        try {
          const updatedRequests = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/received'));
          setReceivedRequests(Array.isArray(updatedRequests) ? updatedRequests : []);
        } catch (refreshError) {
          console.error("Error refreshing received requests after rejection:", refreshError);
          setError("Rejected, but failed to refresh list. Please reload."); // Use setError
        }
        // --- End Block: Refresh received requests list ---

      } catch (rejectError: unknown) {
        console.error(`Error rejecting friend request ID ${requestId}:`, rejectError);
        if (rejectError instanceof Error && 'status' in rejectError) {
          const status = (rejectError as ApplicationError).status;
          switch (status) {
             case 400: setError('Invalid friend request.'); break; // Use setError
             case 401: setError('Session expired. Please log in again.'); break; // Use setError
             case 404: setError('Request not found (may be cancelled).'); break; // Use setError
             default: setError('Failed to reject friend request.'); // Use setError
          }
        } else {
          setError('Failed to reject friend request.'); // Use setError
        }
      }
      // --- End Block: Reject request API call ---
    } catch (error) {
      console.error("Critical error in reject friend request process:", error);
      setError("Server error rejecting request."); // Use setError
    }
  };


  // --- Handle Canceling Sent Friend Request ---
  const handleCancelRequest = async (requestId: number) => {
     setError(null); // Clear previous errors
     setSuccessMessage(""); // Clear previous success
    try {
      const request = sentRequests.find(req => req.requestId === requestId);
      if (!request) {
        setError("Cannot find the request to cancel"); // Use setError
        return;
      }

      // --- Block: Cancel request API call ---
      try {
        await apiService.delete(`/friends/friendrequest/${request.requestId}`);
        showSuccessMessageFn("Friend request canceled"); // Success

        // --- Block: Refresh sent requests list after cancelling ---
        try {
          const updatedSentRequests = await retry(() => apiService.get<FriendRequest[]>('/friends/friendrequests/sent'));
          setSentRequests(Array.isArray(updatedSentRequests) ? updatedSentRequests : []);
        } catch (refreshError) {
          console.error("Error refreshing sent requests after cancellation:", refreshError);
          setError("Canceled, but failed to refresh list. Please reload."); // Use setError
        }
        // --- End Block: Refresh sent requests list ---

      } catch (cancelError: unknown) {
        console.error(`Error canceling friend request ID ${requestId}:`, cancelError);
        if (cancelError instanceof Error && 'status' in cancelError) {
          const status = (cancelError as ApplicationError).status;
          switch (status) {
             case 400: setError('Invalid friend request.'); break; // Use setError
             case 401: setError('Session expired. Please log in again.'); break; // Use setError
             case 403: setError("Cannot cancel request you didn't send."); break; // Use setError
             case 404: setError('Request not found.'); break; // Use setError
             default: setError('Failed to cancel friend request.'); // Use setError
          }
        } else {
          setError('Failed to cancel friend request.'); // Use setError
        }
      }
      // --- End Block: Cancel request API call ---
    } catch (error) {
      console.error("Critical error in cancel friend request process:", error);
      setError("Unexpected error canceling request."); // Use setError
    }
  };


  // --- Handle Removing Friend ---
  const handleRemoveFriend = async (friendId: number) => {
     setError(null); // Clear previous errors
     setSuccessMessage(""); // Clear previous success
    try {
      // --- Block: Remove friend API call ---
      try {
        await apiService.delete(`/friends/remove/${friendId}`);
        showSuccessMessageFn("Friend removed successfully"); // Success

        // --- Block: Refresh friends list after removing ---
        try {
          const updatedFriends = await retry(() => apiService.get<User[]>('/friends'));
          setFriends(Array.isArray(updatedFriends)
              ? [...updatedFriends].sort((a, b) => a.username.localeCompare(b.username))
              : []);
        } catch (refreshError) {
          console.error("Error refreshing friends list after removing friend:", refreshError);
          setError("Removed, but failed to refresh list. Please reload."); // Use setError
        }
        // --- End Block: Refresh friends list ---

      } catch (removeError: unknown) {
        console.error(`Error removing friend with ID ${friendId}:`, removeError);
        if (removeError instanceof Error && 'status' in removeError) {
          const status = (removeError as ApplicationError).status;
          switch (status) {
             case 400: setError('Could not remove friend (Invalid request).'); break; // Use setError
             case 401: setError('Session expired. Please log in again.'); break; // Use setError
             case 404: setError('Could not find friend/user account.'); break; // Use setError
             default: setError('Failed to remove friend.'); // Use setError
          }
        } else {
          setError('Failed to remove friend.'); // Use setError
        }
      }
      // --- End Block: Remove friend API call ---
    } catch (error) {
      console.error("Critical error in remove friend process:", error);
      setError("Server error removing friend."); // Use setError
    }
  };


  // --- Navigation Function (Unchanged) ---
  const navigateToFriendWatchlist = (friendId: number) => {
    router.push(`/users/${userId}/friends/${friendId}/watchlist`);
  };

  // --- Request Count Function (Unchanged) ---
  const getRequestCount = () => {
    return receivedRequests.length + sentRequests.length;
  };


  // --- Render Logic ---

  // Loading state (Unchanged)
  if (loading) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
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
          {/* Display ErrorMessage component prominently if error state is set */}
          {error && (
            <div className="mb-4"> {/* Adjust positioning as needed */}
              <ErrorMessage message={error} onClose={() => setError(null)} />
            </div>
          )}

          {/* --- Success Message Display Area --- */}
          {/* Place temporary success message component */}
          <div className="fixed bottom-4 right-4 z-50">
             <ActionMessage
                message={successMessage}
                isVisible={showSuccessMessage}
                onHide={() => setShowSuccessMessage(false)}
                className="bg-green-500" // Success styling
             />
             {/* REMOVED the temporary error ActionMessage */}
          </div>
          {/* --- End Success Message Display Area --- */}


          {/* Render the rest of the UI only if NOT loading (already handled) */}
          {/* But note: ErrorMessage might overlay or appear above this content */}

          {/* Page Header (Unchanged) */}
          <div className="mb-8">
            {/* ... header content ... */}
             <h1 className="font-semibold text-[#3b3e88] text-3xl">Your Friends</h1>
             <p className="text-[#b9c0de] mt-2">Connect and share movie experiences with friends</p>
          </div>

          {/* Add friend form (Unchanged) */}
          <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-3xl p-6 mb-8 shadow-md text-white">
             {/* ... form content ... */}
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

          {/* Tab navigation (Unchanged) */}
          <div className="flex border-b border-[#3b3e88]/20 mb-6">
             {/* ... tab buttons ... */}
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

          {/* Conditional Rendering of Tabs (Structure Unchanged) */}
          {activeTab === 'friends' && (
              <>
                {/* Search bar */}
                {/* ... search input ... */}
                 <div className="mb-6 relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none"><svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg></div>
                    <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-rose-400 to-rose-500 rounded-2xl border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:outline-none" placeholder="Search friends..." />
                    {searchQuery && (<button className="absolute inset-y-0 right-0 flex items-center pr-4 text-white/70 hover:text-white" onClick={() => setSearchQuery("")}><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>)}
                 </div>
                {/* Friends grid */}
                {/* ... grid content ... */}
                 {displayFriends.length > 0 ? (
                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                         {displayFriends.map(friend => (
                             <div key={friend.userId} className="bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-all overflow-hidden">
                                 {/* ... friend card content ... */}
                                  <div>
                                      <h3 className="font-semibold text-[#3b3e88] mb-1">{friend.username}</h3>
                                      {/* ... rest of friend card ... */}
                                      <div className="flex flex-row gap-2">
                                          <Button className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1" onClick={() => navigateToFriendWatchlist(friend.userId)}>View Watchlist</Button>
                                          <Button variant="outline" className="border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl w-8 p-0 flex items-center justify-center" onClick={() => handleRemoveFriend(friend.userId)}>
                                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                          </Button>
                                      </div>
                                  </div>
                             </div>
                         ))}
                     </div>
                 ) : (
                     <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                         {/* ... no friends / no search results ... */}
                           {searchQuery ? (<div><p className="text-[#838bad] mb-4">No friends match your search &#34;{searchQuery}&#34;</p><Button variant="outline" className="rounded-xl border-[#3b3e88] text-[#3b3e88]" onClick={() => setSearchQuery("")}>Clear Search</Button></div>) : (<div><div className="flex justify-center mb-4"><div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center"><svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg></div></div><p className="text-[#838bad] mb-2">You don&#39;t have any friends yet</p><p className="text-[#b9c0de] mb-6">Send a friend request to get started!</p></div>)}
                     </div>
                 )}
              </>
          )}

          {activeTab === 'requests' && (
              <div className="space-y-6">
                {/* Received requests section */}
                {/* ... received requests content ... */}
                 {receivedRequests.length > 0 && (
                     <div className="mb-8">
                         <h3 className="text-[#3b3e88] font-medium text-lg mb-4">Received Requests</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             {receivedRequests.map(request => (
                                 <div key={request.requestId} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-400">
                                     {/* ... card content ... */}
                                      <div className="mb-3"><h4 className="font-semibold text-[#3b3e88]">{request.sender.username}</h4><p className="text-[#b9c0de] text-xs">Sent {new Date(request.creationTime).toLocaleDateString()}</p></div>
                                      <div className="flex gap-2"><Button className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1" onClick={() => handleAcceptRequest(request.requestId)}>Accept</Button><Button variant="outline" className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1" onClick={() => handleRejectRequest(request.requestId)}>Decline</Button></div>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                {/* Sent requests section */}
                {/* ... sent requests content ... */}
                 {sentRequests.length > 0 && (
                     <div>
                         <h3 className="text-[#3b3e88] font-medium text-lg mb-4">Sent Requests</h3>
                         <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                             {sentRequests.map(request => (
                                 <div key={request.requestId} className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-indigo-400">
                                     {/* ... card content ... */}
                                      <div className="mb-3"><h4 className="font-semibold text-[#3b3e88]">{request.receiver.username}</h4><p className="text-[#b9c0de] text-xs">Sent {new Date(request.creationTime).toLocaleDateString()}</p></div>
                                      <Button variant="outline" className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl" onClick={() => handleCancelRequest(request.requestId)}>Cancel Request</Button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                {/* No requests state */}
                {/* ... no requests content ... */}
                 {receivedRequests.length === 0 && sentRequests.length === 0 && (
                     <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                         <div className="flex justify-center mb-4"><div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center"><svg className="w-10 h-10 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path></svg></div></div>
                         <p className="text-[#838bad] mb-2">No pending friend requests</p>
                         <p className="text-[#b9c0de]">Send a request or wait for someone to add you!</p>
                     </div>
                 )}
              </div>
          )}

        </div> {/* End Main content */}
      </div> // End Outer div
  );
};

export default FriendsManagement;
