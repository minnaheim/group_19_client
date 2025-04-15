"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message";

// Define interfaces for API responses
interface FriendRequest {
    id: number;
    sender: {
        userId: number;
        username: string;
    };
    receiver: {
        userId: number;
        username: string;
    };
    status: string;
    createdAt: string;
}

interface GroupInvitation {
    id: number;
    groupId: number;
    groupName: string;
    sender: string;
    receiver: {
        userId: number;
        username: string;
    };
    status: string;
    createdAt: string;
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

                // Fetch user profile
                const userData = await apiService.get<User>(`/profile/${id}`);
                setUser(userData);

                // Get friend requests
                const friendRequests = await apiService.get<FriendRequest[]>('/friends/friendrequests/received');

                // Get group invitations
                const groupInvites = await apiService.get<GroupInvitation[]>('/groups/invitations/received');

                // Convert API responses to notification format
                const notificationsList: Notification[] = [];

                // Add friend requests to notifications
                if (friendRequests && Array.isArray(friendRequests)) {
                    friendRequests.forEach((request) => {
                        notificationsList.push({
                            id: notificationsList.length + 1,
                            type: 'friend_request',
                            message: `${request.sender.username} wants to be your friend`,
                            actionType: 'accept_decline',
                            sender: request.sender.username,
                            requestId: request.id
                        });
                    });
                }

                // Add group invitations to notifications
                if (groupInvites && Array.isArray(groupInvites)) {
                    groupInvites.forEach((invite) => {
                        notificationsList.push({
                            id: notificationsList.length + 1,
                            type: 'group_invite',
                            message: `${invite.sender} invited you to ${invite.groupName}!`,
                            actionType: 'accept_decline',
                            sender: invite.sender,
                            invitationId: invite.id,
                            groupId: invite.groupId
                        });
                    });
                }

                setNotifications(notificationsList);
            } catch (error) {
                setError("Failed to load user data");
                console.error("Error loading dashboard:", error);
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
                await apiService.post<FriendRequest>(
                    `/friends/friendrequest/${notification.requestId}/accept`,
                    {} // empty data object
                );

                showMessage(`Friend request from ${notification.sender} accepted!`);
            } else if (notification.type === 'group_invite' && notification.invitationId) {
                await apiService.post<GroupInvitation>(
                    `/groups/invitations/${notification.invitationId}/accept`,
                    {} // empty data object
                );

                showMessage(`Invitation to join from ${notification.sender} accepted!`);
            }

            // remove the notification
            setNotifications(notifications.filter(n => n.id !== notification.id));
        } catch (error) {
            console.error("Error accepting notification:", error);
            showMessage("Failed to process the request");
        }
    };

    const handleDecline = async (notification: Notification, e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            if (notification.type === 'friend_request' && notification.requestId) {
                await apiService.post<FriendRequest>(
                    `/friends/friendrequest/${notification.requestId}/reject`,
                    {}
                );

                showMessage(`Friend request declined`);
            } else if (notification.type === 'group_invite' && notification.invitationId) {
                await apiService.post<GroupInvitation>(
                    `/groups/invitations/${notification.invitationId}/reject`,
                    {}
                );

                showMessage(`Group invitation declined`);
            }

            // Remove the notification
            setNotifications(notifications.filter(n => n.id !== notification.id));
        } catch (error) {
            console.error("Error declining notification:", error);
            showMessage("Failed to process the request");
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
    const navigateToWatchlist = () => router.push(`/users/${id}/watchlist`);
    const navigateToGroups = () => router.push(`/users/${id}/groups`);
    const navigateToSearchMovies = () => router.push(`/users/${id}/movie_search`);
    const navigateToProfile = () => router.push(`/users/${id}/profile`);

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

    return (
        <div className="bg-indigo-50 flex flex-col md:flex-row min-h-screen w-full">
            {/* Use your existing Navigation component */}
            <Navigation userId={userId} activeItem="Dashboard" />

            {/* Main content - Two column layout */}
            <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-hidden">
                <h1 className="text-indigo-900 text-2xl font-semibold mb-6">Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-auto md:h-[calc(100vh-140px)]">
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
                             style={{ height: 'auto', minHeight: '20rem', maxHeight: 'calc(4 * 8rem + 3 * 1.5rem)' }}>
                            <h2 className="text-indigo-900 text-xl font-medium mb-5">Notifications</h2>

                            {/* Made this container scrollable with exact height matching left cards */}
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
                                                        {notification.actionLabel}
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