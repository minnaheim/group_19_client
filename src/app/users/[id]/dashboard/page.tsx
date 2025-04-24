"use client";
import React, { useEffect, useState } from "react";
import type { ApplicationError } from "@/app/types/error";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { useApi } from "@/app/hooks/useApi";
import { retry } from 'src/utils/retry';
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";

interface FriendRequest {
    requestId: number;
    sender: User;
    receiver: User;
    accepted: boolean | null;
    creationTime: string;
    responseTime: string | null;
}

interface Group {
    groupId: number;
    groupName: string;
    creatorId: number; // Updated to match new DTO
    memberIds: number[]; // Updated to match new DTO
    movieIds: number[];
    phase?: string; // Add phase property for backend compatibility
}

interface GroupInvitation {
    invitationId: number; // Updated field name
    sender: User;
    receiver: User;
    group: Group;
    accepted: boolean; // Updated field
    creationTime: string;
    responseTime: string;
}

interface Notification {
    id: number;
    type: 'friend_request' | 'group_invite' | 'group_update' | 'custom';
    message: string;
    actionType?: 'accept_decline' | 'go_to' | 'view';
    actionLabel?: string;
    actionUrl?: string;
    sender?: string;
    requestId?: number;
    invitationId?: number;
    groupId?: number;
}

const Dashboard: React.FC = () => {
    const { id } = useParams();
    const apiService = useApi();
    const router = useRouter();

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);

    // action feedback
    const [actionMessage, setActionMessage] = useState<string>("");
    const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

    // get user ID from local storage
    const { value: userId } = useLocalStorage<string>("userId", "");

    // fetch user data
    useEffect(() => {
        const fetchUserData = async () => {
            if (!id) return;
            try {
                setLoading(true);

                // Fetch user profile with retry
                try {
                    const userData = await retry(() => apiService.get<User>(`/users/${id}/profile`));
                    setUser(userData);
                    showMessage('User profile loaded');
                } catch (err: unknown) {
                    console.error("Error fetching user profile:", err);
                    if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 404) {
                        showMessage("Welcome! We couldn't fetch your profile details right now.");
                    } else {
                        setError("Failed to load profile data. Please try again later.");
                    }
                    return;
                }

                // Initialize empty array for all notifications
                const allNotifications: Notification[] = [];

                // Get friend requests with retry
                // Get friend requests
                try {
                    const friendRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/received');

                    // Process friend requests into notifications with unique IDs
                    if (friendRequests && Array.isArray(friendRequests)) {
                        friendRequests.forEach((request, index) => {
                            allNotifications.push({
                                id: index + 1, // Use simple integer IDs
                                type: 'friend_request',
                                message: `${request.sender.username} wants to be your friend`,
                                actionType: 'accept_decline',
                                sender: request.sender.username,
                                requestId: request.requestId
                            });
                        });
                    }
                    showMessage('Received friend requests loaded');
                } catch (err: unknown) {
                    console.error("Error fetching friend requests:", err);
                    if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 401) {
                        showMessage('Your session has expired. Please log in again to see friend requests.');
                    } else {
                        showMessage('Failed to load friend requests. Please try again later.');
                    }
                }

                // Get group invitations
                try {
                    const groupInvites = await apiService.get<GroupInvitation[]>('/groups/invitations/received');

                    // Process group invitations into notifications with unique IDs
                    if (groupInvites && Array.isArray(groupInvites)) {
                        const startId = allNotifications.length + 1; // Start after friend request IDs
                        groupInvites.forEach((invite, index) => {
                            allNotifications.push({
                                id: startId + index,
                                type: 'group_invite',
                                message: `${invite.sender.username} invited you to ${invite.group.groupName}!`,
                                actionType: 'accept_decline',
                                sender: invite.sender.username,
                                invitationId: invite.invitationId,
                                groupId: invite.group.groupId
                            });
                        });
                    }
                    showMessage('Received group invitations loaded');
                } catch (err: unknown) {
                    console.error("Error fetching group invitations:", err);
                    if (err instanceof Error && 'status' in err && (err as ApplicationError).status === 401) {
                        showMessage('Your session has expired. Please log in again to see group invitations.');
                    } else {
                        showMessage('Failed to load group invitations. Please try again later.');
                    }
                }

                // Set all notifications at once
                setNotifications(allNotifications);
            } catch (error) {
                setError("Failed to load user data. Server may be unavailable.");
                console.error("Critical error loading dashboard:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUserData();
    }, [id, apiService]);

    // show a message to the user
    const showMessage = (message: string) => {
        setActionMessage(message);
        setShowActionMessage(true);
        setTimeout(() => {
            setShowActionMessage(false);
        }, 3000);
    };

    // Handle notification actions
    const handleAccept = async (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (notification.type === 'friend_request' && notification.requestId) {
                try {
                    await apiService.post(
                        `/friends/friendrequest/${notification.requestId}/accept`,
                        {} // empty data object
                    );
                    showMessage('Friend request accepted');
                } catch (err: unknown) {
                    console.error(`Error accepting friend request ID ${notification.requestId}:`, err);
                    if (err instanceof Error && 'status' in err) {
                        const appErr = err as ApplicationError;
                        switch (appErr.status) {
                            case 400:
                                showMessage('This friend request appears to be invalid.');
                                break;
                            case 401:
                                showMessage('Your session has expired. Please log in again to accept requests.');
                                break;
                            case 404:
                                showMessage('This friend request could not be found. It might have been cancelled.');
                                break;
                            default:
                                showMessage('An error occurred while accepting the friend request. Please try again.');
                        }
                    } else {
                        showMessage('An error occurred while accepting the friend request. Please try again.');
                    }
                }
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            } else if (notification.type === 'group_invite' && notification.invitationId) {
                try {
                    await apiService.post(
                        `/groups/invitations/${notification.invitationId}/accept`,
                        {} // empty data object
                    );
                    showMessage('Group invitation accepted');
                } catch (err: unknown) {
                    console.error(`Error accepting group invitation ID ${notification.invitationId}:`, err);
                    if (err instanceof Error && 'status' in err) {
                        const appErr = err as ApplicationError;
                        switch (appErr.status) {
                            case 400:
                                showMessage('This group invitation appears to be invalid.');
                                break;
                            case 401:
                                showMessage('Your session has expired. Please log in again to accept invitations.');
                                break;
                            case 403:
                                showMessage('You cannot accept this invitation.');
                                break;
                            case 404:
                                showMessage('This group invitation could not be found. It might have been cancelled.');
                                break;
                            default:
                                showMessage('An error occurred while accepting the group invitation. Please try again.');
                        }
                    } else {
                        showMessage('An error occurred while accepting the group invitation. Please try again.');
                    }
                }
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }
        } catch (error) {
            console.error("Critical error in accept notification process:", error);
            showMessage("Failed to process the request due to a server error.");
        }
    };

    const handleDecline = async (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (notification.type === 'friend_request' && notification.requestId) {
                try {
                    await apiService.post(
                        `/friends/friendrequest/${notification.requestId}/reject`,
                        {}
                    );
                    showMessage('Friend request rejected');
                } catch (err: unknown) {
                    console.error(`Error rejecting friend request ID ${notification.requestId}:`, err);
                    if (err instanceof Error && 'status' in err) {
                        const appErr = err as ApplicationError;
                        switch (appErr.status) {
                            case 400:
                                showMessage('This friend request appears to be invalid.');
                                break;
                            case 401:
                                showMessage('Your session has expired. Please log in again to reject requests.');
                                break;
                            case 404:
                                showMessage('This friend request could not be found. It might have been cancelled.');
                                break;
                            default:
                                showMessage('An error occurred while rejecting the friend request. Please try again.');
                        }
                    } else {
                        showMessage('An error occurred while rejecting the friend request. Please try again.');
                    }
                }
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            } else if (notification.type === 'group_invite' && notification.invitationId) {
                try {
                    await apiService.post(
                        `/groups/invitations/${notification.invitationId}/reject`,
                        {}
                    );
                    showMessage('Group invitation rejected');
                } catch (err: unknown) {
                    console.error(`Error rejecting group invitation ID ${notification.invitationId}:`, err);
                    if (err instanceof Error && 'status' in err) {
                        const appErr = err as ApplicationError;
                        switch (appErr.status) {
                            case 400:
                                showMessage('This group invitation appears to be invalid.');
                                break;
                            case 401:
                                showMessage('Your session has expired. Please log in again to reject invitations.');
                                break;
                            case 403:
                                showMessage('You cannot reject this invitation.');
                                break;
                            case 404:
                                showMessage('This group invitation could not be found. It might have been cancelled.');
                                break;
                            default:
                                showMessage('An error occurred while rejecting the group invitation. Please try again.');
                        }
                    } else {
                        showMessage('An error occurred while rejecting the group invitation. Please try again.');
                    }
                }
                setNotifications(prev => prev.filter(n => n.id !== notification.id));
            }
        } catch (error) {
            console.error("Critical error in decline notification process:", error);
            showMessage("Failed to process the request due to a server error.");
        }
    };

    const handleAction = (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation();
        // Handle the action based on the notification type
        if (notification.actionUrl) {
            router.push(notification.actionUrl);
        }
    };

    // Navigation handlers
    const navigateToWatchlist = () => router.push(`/users/${userId}/watchlist`);
    const navigateToGroups = () => router.push(`/users/${userId}/groups`);
    const navigateToFriends = () => router.push(`/users/${userId}/friends`);
    const navigateToSearchMovies = () => router.push(`/users/${userId}/movie_search`);
    const navigateToProfile = () => router.push(`/users/${userId}/profile`);

    if (loading) {
        return (
            <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
            </div>
        );
    }

    if (error) {
        return <ErrorMessage message={error} onClose={() => setError(null)} />;
    }

    return (
        <div className="bg-indigo-50 flex flex-col md:flex-row min-h-screen w-full">
            {/* Use your existing Navigation component */}
            <Navigation userId={userId} activeItem="Dashboard" />

            {/* Main content - Two column layout */}
            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
                <h1 className="text-indigo-900 text-2xl font-semibold mb-6">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-auto">
                    {/* Left Column - Navigation Cards */}
                    <div className="space-y-6 mb-6 md:mb-0"> {/* Increased spacing between cards */}
                        {/* Watch List Card */}
                        <div
                            onClick={navigateToWatchlist}
                            className="bg-rose-500 rounded-3xl p-6 h-32 relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {/* Decorative circles */}
                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-rose-400/30 rounded-full -mr-10 -mb-10"></div>
                            <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/30 rounded-full -mr-14 -mb-14"></div>

                            <h2 className="text-white text-xl font-medium relative z-10">Watch List</h2>
                        </div>

                        {/* Movie Groups Card */}
                        <div
                            onClick={navigateToGroups}
                            className="bg-orange-400 rounded-3xl p-6 h-32 relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {/* Decorative circles */}
                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-orange-300/30 rounded-full -mr-10 -mb-10"></div>
                            <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/30 rounded-full -mr-14 -mb-14"></div>

                            <h2 className="text-white text-xl font-medium relative z-10">Movie Groups</h2>
                        </div>

                        {/* Friends Card */}
                        <div
                            onClick={navigateToFriends}
                            className="bg-indigo-500 rounded-3xl p-6 h-32 relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {/* Decorative circles */}
                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-indigo-400/30 rounded-full -mr-10 -mb-10"></div>
                            <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/30 rounded-full -mr-14 -mb-14"></div>

                            <h2 className="text-white text-xl font-medium relative z-10">Friends</h2>
                        </div>

                        {/* Search Movies Card */}
                        <div
                            onClick={navigateToSearchMovies}
                            className="bg-indigo-900 rounded-3xl p-6 h-32 relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {/* Decorative circles */}
                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-slate-400/20 rounded-full -mr-10 -mb-10"></div>
                            <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/30 rounded-full -mr-14 -mb-14"></div>

                            <h2 className="text-white text-xl font-medium relative z-10">Search Movies</h2>
                        </div>

                        {/* Profile Card */}
                        <div
                            onClick={navigateToProfile}
                            className="bg-violet-600 rounded-3xl p-6 h-32 relative overflow-hidden cursor-pointer hover:shadow-md"
                        >
                            {/* Decorative circles */}
                            <div className="absolute right-0 bottom-0 w-40 h-40 bg-violet-500/30 rounded-full -mr-10 -mb-10"></div>
                            <div className="absolute right-0 bottom-0 w-48 h-48 border border-white/30 rounded-full -mr-14 -mb-14"></div>

                            <div className="relative z-10">
                                <h2 className="text-white text-xl font-medium">Your Profile</h2>
                                <p className="text-white/80 text-sm mt-1">
                                    {user?.username}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Notifications */}
                    <div className="mt-6 md:mt-0">
                        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 flex flex-col shadow-sm"
                             style={{ height: 'auto', minHeight: '20rem', maxHeight: 'max(calc(100vh - 200px), 600px)' }}>
                            <h2 className="text-indigo-900 text-xl font-medium mb-5">Notifications</h2>

                            {/* Made this container scrollable with dynamic height */}
                            <div className="overflow-y-auto pr-2 flex-grow">
                                <div className="space-y-5">
                                    {notifications.length > 0 ? notifications.map(notification => (
                                        <div key={notification.id}
                                             className={`rounded-3xl p-5 shadow-sm ${
                                                 notification.type === 'friend_request'
                                                     ? 'bg-rose-50 border border-rose-100'
                                                     : notification.type === 'group_invite'
                                                         ? 'bg-orange-50 border border-orange-100'
                                                         : notification.type === 'group_update'
                                                             ? 'bg-indigo-50 border border-indigo-100'
                                                             : 'bg-violet-50 border border-violet-100'
                                             }`}
                                        >
                                            <p className={`mb-3 ${
                                                notification.type === 'friend_request'
                                                    ? 'text-rose-800'
                                                    : notification.type === 'group_invite'
                                                        ? 'text-orange-800'
                                                        : notification.type === 'group_update'
                                                            ? 'text-indigo-800'
                                                            : 'text-violet-800'
                                            }`}>{notification.message}</p>

                                            {notification.actionType === 'accept_decline' && (
                                                <div className="flex justify-end items-center">
                                                    <Button
                                                        className={`hover:bg-opacity-70 text-white rounded-3xl px-4 py-1 h-8 text-sm ${
                                                            notification.type === 'friend_request'
                                                                ? 'bg-rose-500 hover:bg-rose-600'
                                                                : notification.type === 'group_invite'
                                                                    ? 'bg-orange-400 hover:bg-orange-500'
                                                                    : notification.type === 'group_update'
                                                                        ? 'bg-indigo-500 hover:bg-indigo-600'
                                                                        : 'bg-violet-500 hover:bg-violet-600'
                                                        }`}
                                                        onClick={(e) => handleAccept(notification, e)}
                                                    >
                                                        Accept
                                                    </Button>
                                                    <button
                                                        className={`ml-4 underline text-sm ${
                                                            notification.type === 'friend_request'
                                                                ? 'text-rose-700'
                                                                : notification.type === 'group_invite'
                                                                    ? 'text-orange-700'
                                                                    : notification.type === 'group_update'
                                                                        ? 'text-indigo-700'
                                                                        : 'text-violet-700'
                                                        }`}
                                                        onClick={(e) => handleDecline(notification, e)}
                                                    >
                                                        Decline
                                                    </button>
                                                </div>
                                            )}

                                            {(notification.actionType === 'go_to' || notification.actionType === 'view') && (
                                                <div className="flex justify-end">
                                                    <Button
                                                        className={`hover:bg-opacity-70 text-white rounded-3xl px-4 py-1 h-8 text-sm ${
                                                            notification.type === 'friend_request'
                                                                ? 'bg-rose-500 hover:bg-rose-600'
                                                                : notification.type === 'group_invite'
                                                                    ? 'bg-orange-400 hover:bg-orange-500'
                                                                    : notification.type === 'group_update'
                                                                        ? 'bg-indigo-500 hover:bg-indigo-600'
                                                                        : 'bg-violet-500 hover:bg-violet-600'
                                                        }`}
                                                        onClick={(e) => handleAction(notification, e)}
                                                    >
                                                        {notification.actionLabel || 'View'}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    )) : (
                                        <p className="text-gray-500 text-center py-4">No notifications</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Action Message Component */}
                <ActionMessage
                    message={actionMessage}
                    isVisible={showActionMessage}
                    onHide={() => setShowActionMessage(false)}
                />
            </div>
        </div>
    );
};

export default Dashboard;