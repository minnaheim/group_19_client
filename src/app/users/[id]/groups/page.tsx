"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Updated Group interface to match the new DTO
interface Group {
  groupId: number;
  groupName: string;
  creatorId: number;
  memberIds: number[];
  movieIds: number[];
}

// Extended Group data with user and movie details
interface GroupWithDetails {
  groupId: number;
  groupName: string;
  creatorId: number;
  creator: User;
  members: User[];
  movies: Movie[];
}

interface GroupInvitation {
  id: number;
  sender: User;
  receiver: User;
  group: Group;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

interface UserSearchResponse {
  userId: number;
  username: string;
}

const GroupsManagement: React.FC = () => {
  const {id} = useParams();
  const apiService = useApi();
  const router = useRouter();

  // Basic groups data from initial endpoint
  const [groups, setGroups] = useState<Group[]>([]);
  // Enhanced groups with member and movie details
  const [groupsWithDetails, setGroupsWithDetails] = useState<GroupWithDetails[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<
      GroupInvitation[]
  >([]);
  const [sentInvitations, setSentInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"groups" | "invitations">(
      "groups"
  );

  // Action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // Group creation dialog
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] =
      useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState<boolean>(false);

  // Member invitation dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState<boolean>(false);

  // Group detail dialog
  const [isGroupDetailDialogOpen, setIsGroupDetailDialogOpen] =
      useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredGroups, setFilteredGroups] = useState<GroupWithDetails[]>([]);

  const {value: userId} = useLocalStorage<string>("userId", "");
  const {value: token} = useLocalStorage<string>("token", "");

  // Helper function to load group details (members and movie pool)
  const loadGroupDetails = async (group: Group) => {
    try {
      // Fetch group members
      const members: User[] = await apiService.get<User[]>(`/groups/${group.groupId}/members`);

      // Fetch group movie pool
      const movies: Movie[] = await apiService.get<Movie[]>(`/groups/${group.groupId}/pool`);

      // Return enhanced group with details
      return {
        ...group,
        creator: await fetchUserById(group.creatorId),
        members: Array.isArray(members) ? members : [],
        movies: Array.isArray(movies) ? movies : []
      };
    } catch (error) {
      console.error("Error loading group details:", error);
      return {
        ...group,
        creator: await fetchUserById(group.creatorId),
        members: [],
        movies: []
      };
    }
  };

  // Helper function to fetch user by ID
  const fetchUserById = async (userId: number): Promise<User> => {
    try {
      return await apiService.get<User>(`/users/${userId}/profile`);
    } catch (error) {
      console.error("Error fetching user:", error);
      // Return a placeholder user if we can't fetch the real one
      return {
        userId: userId,
        username: userId.toString() === id ? "You" : "Unknown User"
      } as User;
    }
  };

  // Fetch groups data
  useEffect(() => {
    const fetchGroupsData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        try {
          // Get user's groups
          const groupsData: Group[] = await apiService.get<Group[]>("/groups");
          setGroups(
              Array.isArray(groupsData)
                  ? groupsData.sort((a, b) => a.groupName.localeCompare(b.groupName))
                  : []
          );

          // Get received group invitations
          const receivedInvitationsData = await apiService.get<
              GroupInvitation[]
          >("/groups/invitations/received");

          setReceivedInvitations(
              Array.isArray(receivedInvitationsData)
                  ? receivedInvitationsData
                  : []
          );

          // Get sent group invitations
          const sentInvitationsData = await apiService.get<GroupInvitation[]>(
              "/groups/invitations/sent");
          setSentInvitations(
              Array.isArray(sentInvitationsData) ? sentInvitationsData : []
          );
        } catch (apiError) {
          console.log("API error:", apiError);
          setError("Failed to connect to the server");
        }
      } catch (error) {
        setError("Failed to load groups data");
        console.error("Error loading groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGroupsData();
  }, [id, apiService, token]);

  // Load detailed information for each group
  useEffect(() => {
    const enhanceGroupsWithDetails = async () => {
      if (groups.length === 0) return;

      try {
        const enhancedGroups = await Promise.all(
            groups.map(group => loadGroupDetails(group))
        );

        setGroupsWithDetails(enhancedGroups);
      } catch (error) {
        console.error("Error enhancing groups with details:", error);
      }
    };

    enhanceGroupsWithDetails();
  }, [groups]);

  // Filter groups based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groupsWithDetails);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = groupsWithDetails.filter(
        (group) =>
            group.groupName.toLowerCase().includes(query)
    );

    setFilteredGroups(filtered);
  }, [searchQuery, groupsWithDetails]);

  // Show notification message
  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  // Handle creating a new group
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newGroupName.trim()) {
      showMessage("Please enter a group name");
      return;
    }

    setIsSubmittingGroup(true);

    try {
      const createdGroup = await apiService.post("/groups", {
        groupName: newGroupName,
      });

      // Update groups list by fetching all groups again
      if (createdGroup) {
        const updatedGroups = await apiService.get<Group[]>("/groups");
        setGroups(
            Array.isArray(updatedGroups)
                ? updatedGroups.sort((a, b) => a.groupName.localeCompare(b.groupName))
                : []
        );
      }

      showMessage(`Group "${newGroupName}" created successfully`);
      setNewGroupName("");
      setIsCreateGroupDialogOpen(false);
    } catch (error) {
      console.error("Error creating group:", error);
      if (error instanceof Error) {
        showMessage(`Failed to create group: ${error.message}`);
      } else {
        showMessage("Failed to create group");
      }
    } finally {
      setIsSubmittingGroup(false);
    }
  };

  // Handle inviting a member to a group
  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inviteUsername.trim() || !selectedGroupId) {
      showMessage("Please enter a username");
      return;
    }

    setIsSubmittingInvite(true);

    try {
      // First, find the receiverId based on username
      const searchResults = await apiService.get<UserSearchResponse[]>(
          `/users/search?username=${encodeURIComponent(inviteUsername)}`);

      if (
          !searchResults ||
          !Array.isArray(searchResults) ||
          searchResults.length === 0
      ) {
        showMessage(`Could not find user with username ${inviteUsername}`);
        setIsSubmittingInvite(false);
        return;
      }

      const receiverId = searchResults[0].userId;
      const response = await apiService.post(
          `/groups/invitations/send/${selectedGroupId}/${receiverId}`,
          {}
      );

      if (response) {
        // Refresh sent invitations
        const updatedSentInvitations = await apiService.get<GroupInvitation[]>(
            "/groups/invitations/sent"
        );
        if (Array.isArray(updatedSentInvitations)) {
          setSentInvitations(updatedSentInvitations);
        }
      }

      showMessage(`Invitation sent to ${inviteUsername}`);
      setInviteUsername("");
      setIsInviteDialogOpen(false);
      setSelectedGroupId(null);

      // Switch to invitations tab to show the new invitation
      setActiveTab("invitations");
    } catch (error) {
      console.error("Error sending invitation:", error);
      if (error instanceof Error) {
        showMessage(`Failed to send invitation: ${error.message}`);
      } else {
        showMessage("Failed to send invitation");
      }
    } finally {
      setIsSubmittingInvite(false);
    }
  };

  // Handle accepting a group invitation
  const handleAcceptInvitation = async (invitationId: number) => {
    try {
      await apiService.post(
          `/groups/invitations/${invitationId}/accept`,
          {}
      );
      // Refresh groups and invitations
      const updatedGroups = await apiService.get<Group[]>(
          "/groups"
      );
      if (Array.isArray(updatedGroups)) {
        setGroups(updatedGroups.sort((a, b) => a.groupName.localeCompare(b.groupName)));
      }

      const updatedInvitations = await apiService.get<GroupInvitation[]>(
          "/groups/invitations/received"
      );

      if (Array.isArray(updatedInvitations)) {
        setReceivedInvitations(updatedInvitations);
      }

      showMessage("Group invitation accepted");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      showMessage("Failed to accept invitation");
    }
  };

  // Handle rejecting a group invitation
  const handleRejectInvitation = async (invitationId: number) => {
    try {
      await apiService.post(
          `/groups/invitations/${invitationId}/reject`,
          {}
      );
      // Refresh invitations
      const updatedInvitations = await apiService.get<GroupInvitation[]>(
          "/groups/invitations/received"
      );
      if (Array.isArray(updatedInvitations)) {
        setReceivedInvitations(updatedInvitations);
      }

      showMessage("Group invitation rejected");
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      showMessage("Failed to reject invitation");
    }
  };

  // Handle canceling a sent group invitation
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await apiService.delete(
          `/groups/invitations/${invitationId}`
      );
      // Refresh sent invitations
      const updatedInvitations = await apiService.get<GroupInvitation[]>(
          "/groups/invitations/sent"
      );
      if (Array.isArray(updatedInvitations)) {
        setSentInvitations(updatedInvitations);
      }

      showMessage("Invitation canceled");
    } catch (error) {
      console.error("Error canceling invitation:", error);
      showMessage("Failed to cancel invitation");
    }
  };

  // Handle leaving a group
  const handleLeaveGroup = async (groupId: number) => {
    try {
      await apiService.delete(
          `/groups/${groupId}/leave`
      );
      // Refresh groups
      const updatedGroups = await apiService.get<Group[]>(
          "/groups"
      );
      if (Array.isArray(updatedGroups)) {
        setGroups(updatedGroups.sort((a, b) => a.groupName.localeCompare(b.groupName)));
      }

      setIsGroupDetailDialogOpen(false);
      setSelectedGroup(null);

      showMessage("You have left the group");
    } catch (error) {
      console.error("Error leaving group:", error);
      showMessage("Failed to leave the group");
    }
  };

  // Navigate to group pool
  const navigateToGroupPool = (groupId: number) => {
    router.push(`/users/${userId}/groups/${groupId}/pool`);
  };

  // Navigate to group voting
  const navigateToGroupVoting = (groupId: number) => {
    router.push(`/users/${userId}/groups/${groupId}/vote`);
  };

  // Navigate to group results
  const navigateToGroupResults = (groupId: number) => {
    router.push(`/users/${userId}/groups/${groupId}/results`);
  };

  // Open group details
  const openGroupDetails = (group: GroupWithDetails) => {
    setSelectedGroup(group);
    setIsGroupDetailDialogOpen(true);
  };

  // Get invitation count for badge
  const getInvitationCount = () => {
    return receivedInvitations.length + sentInvitations.length;
  };

  // Format member list for display
  const formatMembersList = (members: User[]) => {
    if (!members || members.length === 0) return "No members";

    return members.map((member) => member.username).join(", ");
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2  border-violet-600"></div>
        </div>
    );
  }

  if (error) {
    return <div className="text-red-500 text-center py-8">{error}</div>;
  }

  const displayGroups = searchQuery ? filteredGroups : groupsWithDetails;

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation */}
        <Navigation userId={userId} activeItem="Movie Groups"/>

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">
              Your Movie Groups
            </h1>
            <p className="text-[#b9c0de] mt-2">
              Create and join groups to watch movies together
            </p>
          </div>

          {/* Create group button */}
          <div className="bg-gradient-to-r from-orange-400 to-rose-500 rounded-3xl p-6 mb-8 shadow-md text-white">
            <h2 className="text-xl font-semibold mb-4">
              Create a New Movie Group
            </h2>
            <p className="mb-4 opacity-80">
              Invite friends, suggest movies, and vote on what to watch together
            </p>
            <Button
                onClick={() => setIsCreateGroupDialogOpen(true)}
                className="bg-white text-indigo-600 hover:bg-white/90 px-6 py-3 rounded-2xl font-medium shadow-sm transition-all"
            >
              Create Group
            </Button>
          </div>

          {/* Tab navigation */}
          <div className="flex border-b  border-violet-600/20 mb-6">
            <button
                className={`px-6 py-3 font-medium text-base ${
                    activeTab === "groups"
                        ? "text-[#3b3e88] border-b-2  border-violet-600"
                        : "text-[#b9c0de] hover:text-[#3b3e88]/70"
                }`}
                onClick={() => setActiveTab("groups")}
            >
              Groups
            </button>
            <button
                className={`px-6 py-3 font-medium text-base relative ${
                    activeTab === "invitations"
                        ? "text-[#3b3e88] border-b-2  border-violet-600"
                        : "text-[#b9c0de] hover:text-[#3b3e88]/70"
                }`}
                onClick={() => setActiveTab("invitations")}
            >
              Invitations
              {getInvitationCount() > 0 && (
                  <span
                      className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs flex items-center justify-center rounded-full">
                {getInvitationCount()}
              </span>
              )}
            </button>
          </div>

          {/* Groups list */}
          {activeTab === "groups" && (
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
                      ></path>
                    </svg>
                  </div>
                  <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-violet-600 to-indigo-900 rounded-2xl border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:outline-none"
                      placeholder="Search groups..."
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
                          ></path>
                        </svg>
                      </button>
                  )}
                </div>

                {/* Groups grid */}
                {displayGroups.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {displayGroups.map((group) => (
                          <div
                              key={group.groupId}
                              className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                              onClick={() => openGroupDetails(group)}
                          >
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-[#3b3e88] text-lg">
                                  {group.groupName}
                                </h3>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {group.members.length}{" "}
                                  {group.members.length === 1 ? "member" : "members"}
                        </span>
                              </div>

                              {/* Movie pool preview */}
                              {group.movies && group.movies.length > 0 ? (
                                  <div className="mb-4">
                                    <p className="text-xs text-[#3b3e88]/60 mb-2">
                                      Movie Pool ({group.movies.length})
                                    </p>
                                    <div className="flex gap-2 overflow-x-auto pb-2">
                                      {group.movies.slice(0, 4).map((movie) => (
                                          <div
                                              key={movie.movieId}
                                              className="w-10 h-14 flex-shrink-0 rounded overflow-hidden"
                                          >
                                            <img
                                                src={movie.posterURL}
                                                alt={movie.title}
                                                className="w-full h-full object-cover"
                                            />
                                          </div>
                                      ))}
                                      {group.movies.length > 4 && (
                                          <div
                                              className="w-10 h-14 bg-indigo-100 flex-shrink-0 flex items-center justify-center rounded">
                                <span className="text-xs font-medium text-indigo-700">
                                  +{group.movies.length - 4}
                                </span>
                                          </div>
                                      )}
                                    </div>
                                  </div>
                              ) : (
                                  <p className="text-[#b9c0de] text-xs mb-4">
                                    No movies in pool yet
                                  </p>
                              )}

                              <div className="flex justify-between items-center text-xs text-[#b9c0de]">
                        <span>
                          {group.creator && (group.creator.userId.toString() === id)
                              ? "Created by you"
                              : group.creator
                                  ? `Created by ${group.creator.username}`
                                  : "Loading creator..."}
                        </span>
                              </div>
                            </div>
                          </div>
                      ))}
                    </div>
                ) : (
                    <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                      {searchQuery ? (
                          <div>
                            <p className="text-[#838bad] mb-4">
                              No groups match your search &#34;{searchQuery}&#34;
                            </p>
                            <Button
                                variant="outline"
                                className="rounded-xl border-violet-600 text-[#3b3e88]"
                                onClick={() => setSearchQuery("")}
                            >
                              Clear Search
                            </Button>
                          </div>
                      ) : (
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
                                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                  ></path>
                                </svg>
                              </div>
                            </div>
                            <p className="text-[#838bad] mb-2">
                              You aren&#39;t part of any groups yet
                            </p>
                            <p className="text-[#b9c0de] mb-6">
                              Create a group to start watching movies with friends!
                            </p>
                            <Button
                                className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 rounded-xl"
                                onClick={() => setIsCreateGroupDialogOpen(true)}
                            >
                              Create Your First Group
                            </Button>
                          </div>
                      )}
                    </div>
                )}
              </>
          )}

          {/* Invitations */}
          {activeTab === "invitations" && (
              <div className="space-y-6">
                {/* Received invitations section */}
                {receivedInvitations.length > 0 && (
                    <div className="mb-8">
                      <h3 className="text-[#3b3e88] font-medium text-lg mb-4">
                        Received Invitations
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {receivedInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-500"
                            >
                              <div className="mb-3">
                                <h4 className="font-semibold text-[#3b3e88]">
                                  {invitation.group.groupName}
                                </h4>
                                <p className="text-[#b9c0de] text-xs mb-1">
                                  Invited by {invitation.sender.username} on{" "}
                                  {new Date(invitation.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                    className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1"
                                    onClick={() => handleAcceptInvitation(invitation.id)}
                                >
                                  Accept
                                </Button>
                                <Button
                                    variant="outline"
                                    className="border-violet-600 text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1"
                                    onClick={() => handleRejectInvitation(invitation.id)}
                                >
                                  Decline
                                </Button>
                              </div>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* Sent invitations section */}
                {sentInvitations.length > 0 && (
                    <div>
                      <h3 className="text-[#3b3e88] font-medium text-lg mb-4">
                        Sent Invitations
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sentInvitations.map((invitation) => (
                            <div
                                key={invitation.id}
                                className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400"
                            >
                              <div className="mb-3">
                                <h4 className="font-semibold text-[#3b3e88]">
                                  {invitation.group.groupName}
                                </h4>
                                <p className="text-[#b9c0de] text-xs mb-1">
                                  Invited {invitation.receiver.username} on{" "}
                                  {new Date(invitation.createdAt).toLocaleDateString()}
                                </p>
                                <p className="text-[#838bad] text-xs italic mb-1">
                                  Status: Pending
                                </p>
                              </div>
                              <Button
                                  variant="outline"
                                  className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl"
                                  onClick={() => handleCancelInvitation(invitation.id)}
                              >
                                Cancel Invitation
                              </Button>
                            </div>
                        ))}
                      </div>
                    </div>
                )}

                {/* No invitations state */}
                {receivedInvitations.length === 0 &&
                    sentInvitations.length === 0 && (
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
                                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                ></path>
                              </svg>
                            </div>
                          </div>
                          <p className="text-[#838bad] mb-2">No pending invitations</p>
                          <p className="text-[#b9c0de]">
                            Invite friends to your groups or wait for invitations
                          </p>
                        </div>
                    )}
              </div>
          )}

          {/* Create Group Dialog */}
          <Dialog
              open={isCreateGroupDialogOpen}
              onOpenChange={setIsCreateGroupDialogOpen}
          >
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#3b3e88] text-xl">
                  Create New Group
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateGroup}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="group-name" className="text-[#3b3e88]">
                      Group Name
                    </Label>
                    <Input
                        id="group-name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        placeholder="Weekend Movie Club"
                        className="rounded-xl"
                        required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCreateGroupDialogOpen(false)}
                      className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                      type="submit"
                      className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 rounded-xl"
                      disabled={isSubmittingGroup}
                  >
                    {isSubmittingGroup ? "Creating..." : "Create Group"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Invite Member Dialog */}
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogContent className="max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[#3b3e88] text-xl">
                  Invite to Group
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleInviteMember}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="invite-username" className="text-[#3b3e88]">
                      Friend&#39;s Username
                    </Label>
                    <Input
                        id="invite-username"
                        value={inviteUsername}
                        onChange={(e) => setInviteUsername(e.target.value)}
                        placeholder="username"
                        className="rounded-xl"
                        required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteDialogOpen(false)}
                      className="rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                      type="submit"
                      className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 rounded-xl"
                      disabled={isSubmittingInvite}
                  >
                    {isSubmittingInvite ? "Sending..." : "Send Invitation"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Group Details Dialog */}
          <Dialog
              open={isGroupDetailDialogOpen}
              onOpenChange={setIsGroupDetailDialogOpen}
          >
            <DialogContent className="max-w-3xl rounded-2xl">
              {selectedGroup && (
                  <>
                    <DialogHeader>
                      <DialogTitle className="text-[#3b3e88] text-xl">
                        {selectedGroup.groupName}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-[#3b3e88] mb-2">
                            Group Details
                          </h4>
                          <div className="bg-indigo-50 rounded-xl p-4 space-y-2">
                            <div>
                          <span className="text-[#838bad] text-sm">
                            Created by:
                          </span>
                              <p className="text-[#3b3e88] font-medium">
                                {selectedGroup.creator?.username || "Unknown"}{" "}
                                {selectedGroup.creatorId === parseInt(id as string) && "(You)"}
                              </p>
                            </div>
                            <div>
                          <span className="text-[#838bad] text-sm">
                            Members ({selectedGroup.members?.length || 0}):
                          </span>
                              <p className="text-[#3b3e88]">
                                {formatMembersList(selectedGroup.members || [])}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6">
                            <h4 className="font-medium text-[#3b3e88] mb-2">
                              Actions
                            </h4>
                            <div className="space-y-2">
                              <Button
                                  onClick={() => {
                                    setSelectedGroupId(selectedGroup.groupId);
                                    setIsInviteDialogOpen(true);
                                  }}
                                  className="w-full bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm"
                              >
                                Invite Friends
                              </Button>

                              {selectedGroup.creatorId !== parseInt(id as string) && (
                                  <Button
                                      onClick={() =>
                                          handleLeaveGroup(selectedGroup.groupId)
                                      }
                                      variant="outline"
                                      className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 rounded-xl text-sm"
                                  >
                                    Leave Group
                                  </Button>
                              )}
                            </div>
                          </div>
                        </div>

                        <div>
                          <h4 className="font-medium text-[#3b3e88] mb-2">
                            Movie Pool
                          </h4>
                          {selectedGroup.movies && selectedGroup.movies.length > 0 ? (
                              <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                                {selectedGroup.movies.map((movie) => (
                                    <div
                                        key={movie.movieId}
                                        className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm"
                                    >
                                      <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                        <img
                                            src={movie.posterURL}
                                            alt={movie.title}
                                            className="w-full h-full object-cover"
                                        />
                                      </div>
                                      <div className="flex-grow min-w-0">
                                        <p className="font-medium text-[#3b3e88] truncate">
                                          {movie.title}
                                        </p>
                                        <p className="text-xs text-[#b9c0de]">
                                          {movie.year} •{" "}
                                          {movie.genres.slice(0, 2).join(", ")}
                                        </p>
                                      </div>
                                    </div>
                                ))}
                              </div>
                          ) : (
                              <div className="bg-indigo-50 rounded-xl p-6 text-center">
                                <p className="text-[#838bad] mb-2">
                                  No movies in pool yet
                                </p>
                                <p className="text-[#b9c0de] text-sm mb-4">
                                  Add movies to the pool for your group to vote on
                                </p>
                              </div>
                          )}

                          <div className="grid grid-cols-2 gap-3 mt-4">
                            <Button
                                onClick={() =>
                                    navigateToGroupPool(selectedGroup.groupId)
                                }
                                className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 rounded-xl text-sm"
                            >
                              Manage Pool
                            </Button>
                            <Button
                                onClick={() =>
                                    navigateToGroupVoting(selectedGroup.groupId)
                                }
                                className="bg-indigo-600 hover:bg-indigo-700 rounded-xl text-sm"
                            >
                              Vote
                            </Button>
                            <Button
                                onClick={() =>
                                    navigateToGroupResults(selectedGroup.groupId)
                                }
                                className="bg-purple-600 hover:bg-purple-700 rounded-xl text-sm col-span-2"
                            >
                              View Results
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
              )}
            </DialogContent>
          </Dialog>

          {/* Action Message */}
          <ActionMessage
              message={actionMessage}
              isVisible={showActionMessage}
              onHide={() => setShowActionMessage(false)}
          />
        </div>
      </div>
  );
}
export default GroupsManagement;
