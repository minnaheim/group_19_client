"use client";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { PoolEntry } from "@/app/types/poolEntry";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import ActionMessage from "@/components/ui/action_message";
import ErrorMessage from "@/components/ui/ErrorMessage";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ConfirmationDialog from "@/components/ui/confirmation_dialog";
import { retry } from "src/utils/retry";
import type { ApplicationError } from "@/app/types/error";
import Timer from "@/components/ui/Timer";
import SetTimer from "@/components/ui/SetTimer";

// --- Interfaces ---
interface Group {
  groupId: number;
  groupName: string;
  creator: User;
  creatorId: number;
  memberIds: number[];
  movieIds: number[];
  phase: string;
}

interface GroupWithDetails {
  groupId: number;
  groupName: string;
  creatorId: number;
  creator: User;
  members: User[];
  movies: Movie[];
  phase: string;
}

interface GroupInvitation {
  invitationId: number;
  sender: User;
  receiver: User;
  group: Group;
  accepted: boolean;
  creationTime: string;
  responseTime: string;
}

interface UserSearchResponse {
  userId: number;
  username: string;
}
type Friend = User;
// --- End Interfaces ---

const GroupsManagement: React.FC = () => {
  const apiService = useApi();
  const router = useRouter();

  // Component State
  const [groups, setGroups] = useState<Group[]>([]);
  const [groupsWithDetails, setGroupsWithDetails] = useState<
    GroupWithDetails[]
  >([]);
  const [receivedInvitations, setReceivedInvitations] = useState<
    GroupInvitation[]
  >([]);
  const [sentInvitations, setSentInvitations] = useState<GroupInvitation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<"groups" | "invitations">(
    "groups",
  );

  // Flag for combined loading: data fetched but details not enriched yet
  const isGroupDataLoading = loading ||
    (groups.length > 0 && groupsWithDetails.length === 0);

  // --- Refactored State for Errors and Success ---
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [createGroupError, setCreateGroupError] = useState<string | null>(null);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // Confirmation dialog states
  const [showLeaveConfirmDialog, setShowLeaveConfirmDialog] = useState<boolean>(
    false,
  );
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState<
    boolean
  >(false);
  const [showRemoveMemberConfirmDialog, setShowRemoveMemberConfirmDialog] =
    useState<boolean>(false);
  const [groupToLeave, setGroupToLeave] = useState<number | null>(null);
  const [groupToDelete, setGroupToDelete] = useState<number | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<
    {
      groupId: number;
      memberId: number;
    } | null
  >(null);

  // Dialog visibility states
  const [isCreateGroupDialogOpen, setIsCreateGroupDialogOpen] = useState<
    boolean
  >(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [isGroupDetailDialogOpen, setIsGroupDetailDialogOpen] = useState<
    boolean
  >(false);

  // Input/Selection states
  const [newGroupName, setNewGroupName] = useState<string>("");
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<GroupWithDetails | null>(
    null,
  );
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Submission states
  const [isSubmittingGroup, setIsSubmittingGroup] = useState<boolean>(false);
  const [isSubmittingInvite, setIsSubmittingInvite] = useState<boolean>(false);

  // Local storage values
  const { value: userId } = useLocalStorage<string>("userId", "");

  // --- New Client-Side User Search States and Functions ---
  const [allUsers, setAllUsers] = useState<UserSearchResponse[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserSearchResponse[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);
  const [showUserSearchResults, setShowUserSearchResults] = useState<boolean>(
    false,
  );
  const [usersLoaded, setUsersLoaded] = useState<boolean>(false);
  const [isValidUser, setIsValidUser] = useState<boolean>(false);

  const [inviteMethod, setInviteMethod] = useState<"friends" | "search">(
    "friends",
  );
  const [availableFriends, setAvailableFriends] = useState<Friend[]>([]);
  const [loadingFriends, setLoadingFriends] = useState<boolean>(false);
  const [selectedFriends, setSelectedFriends] = useState<Friend[]>([]);
  const [friendSearchQuery, setFriendSearchQuery] = useState<string>("");
  const [filteredAvailableFriends, setFilteredAvailableFriends] = useState<
    Friend[]
  >([]);

  // Track pool count for enabling phase transitions
  const [poolCount, setPoolCount] = useState<number>(0);

  // Fetch counts when a group is selected
  useEffect(() => {
    if (selectedGroup) {
      apiService
        .get<unknown[]>(`/groups/${selectedGroup.groupId}/pool`)
        .then((res) => Array.isArray(res) && setPoolCount(res.length))
        .catch(() => setPoolCount(0));
    }
  }, [selectedGroup, apiService]);

  // Ref for click outside handling
  const searchResultsRef = useRef<HTMLDivElement>(null);

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
        setInviteError("Failed to load user data for search");
      }
    } catch (err) {
      console.error("Error fetching all users:", err);
      setInviteError(
        "Could not load user search. Using regular search instead.",
      );
      setUsersLoaded(false);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // --- Filter Users Client-Side ---
  const filterUsers = useCallback(
    (searchTerm: string) => {
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

      // Get current group details if we have a selected group
      const currentGroup = selectedGroupId
        ? groupsWithDetails.find((g) => g.groupId === selectedGroupId)
        : null;

      // Filter users based on multiple conditions
      const filtered = allUsers.filter((user) => {
        // 1. Contains search term
        const matchesSearch = user.username
          .toLowerCase()
          .includes(normalizedSearch);
        if (!matchesSearch) return false;

        // 2. Not the current user
        if (user.userId === parseInt(userId)) return false;

        // 3. Not already a member of the group
        if (
          currentGroup &&
          currentGroup.members.some((m) => m.userId === user.userId)
        ) {
          return false;
        }

        // 4. Not already invited to the group
        if (
          selectedGroupId &&
          sentInvitations.some(
            (inv) =>
              inv.group.groupId === selectedGroupId &&
              inv.receiver.userId === user.userId,
          )
        ) {
          return false;
        }

        return true;
      });

      setFilteredUsers(filtered);
      setShowUserSearchResults(filtered.length > 0);
    },
    [
      allUsers,
      userId,
      usersLoaded,
      isLoadingUsers,
      fetchAllUsers,
      selectedGroupId,
      groupsWithDetails,
      sentInvitations,
    ],
  );

  useEffect(() => {
    const fetchAvailableFriends = async () => {
      if (!isInviteDialogOpen || !selectedGroupId) return;

      setLoadingFriends(true);
      setInviteError(null);

      try {
        // Fetch all friends
        const friendsData = await retry(() =>
          apiService.get<Friend[]>("/friends")
        );

        if (!Array.isArray(friendsData)) {
          throw new Error("Invalid friends data format");
        }

        // If we have a selected group, filter out friends who are already members
        if (selectedGroupId) {
          const groupDetails = groupsWithDetails.find(
            (g) => g.groupId === selectedGroupId,
          );

          if (groupDetails) {
            // Filter out friends who are already in the group
            const existingMemberIds = groupDetails.members.map((m) => m.userId);
            const filteredFriends = friendsData.filter(
              (friend) => !existingMemberIds.includes(friend.userId),
            );

            // Also filter out friends who have pending invitations
            const pendingInviteeIds = sentInvitations
              .filter((inv) => inv.group.groupId === selectedGroupId)
              .map((inv) => inv.receiver.userId);

            const availableFriendsToInvite = filteredFriends.filter(
              (friend) => !pendingInviteeIds.includes(friend.userId),
            );

            setAvailableFriends(availableFriendsToInvite);
          } else {
            setAvailableFriends(friendsData);
          }
        } else {
          setAvailableFriends(friendsData);
        }
      } catch (err) {
        console.error("Error fetching available friends:", err);
        setInviteError("Failed to load friends list. Please try again.");
        setAvailableFriends([]);
      } finally {
        setLoadingFriends(false);
      }
    };

    fetchAvailableFriends();
  }, [
    isInviteDialogOpen,
    selectedGroupId,
    apiService,
    groupsWithDetails,
    sentInvitations,
  ]);

  useEffect(() => {
    if (!friendSearchQuery.trim()) {
      setFilteredAvailableFriends(availableFriends);
      return;
    }

    const query = friendSearchQuery.toLowerCase().trim();
    const filtered = availableFriends.filter((friend) =>
      friend.username.toLowerCase().includes(query)
    );

    setFilteredAvailableFriends(filtered);
  }, [friendSearchQuery, availableFriends]);

  const toggleFriendSelection = (friend: Friend) => {
    setSelectedFriends((prev) => {
      // If friend is already selected, remove them
      if (prev.some((f) => f.userId === friend.userId)) {
        return prev.filter((f) => f.userId !== friend.userId);
      }
      // Otherwise add them to selection
      return [...prev, friend];
    });
  };

  const handleInviteSelectedFriends = async () => {
    if (selectedFriends.length === 0 || !selectedGroupId) {
      setInviteError("Please select at least one friend to invite.");
      return;
    }

    setIsSubmittingInvite(true);
    setInviteError(null);

    try {
      // Send invitations to all selected friends
      const invitationPromises = selectedFriends.map((friend) =>
        apiService.post(
          `/groups/invitations/send/${selectedGroupId}/${friend.userId}`,
          {},
        )
      );

      // Wait for all invitations to be sent
      await Promise.all(invitationPromises);

      // Refresh the sent invitations list
      const updatedSentInvites = await apiService.get<GroupInvitation[]>(
        "/groups/invitations/sent",
      );
      if (Array.isArray(updatedSentInvites)) {
        setSentInvitations(updatedSentInvites);
      }

      // Show success message
      const friendCount = selectedFriends.length;
      showSuccessMessage(
        `Invitation${
          friendCount !== 1 ? "s" : ""
        } sent to ${friendCount} friend${friendCount !== 1 ? "s" : ""}`,
      );

      // Reset state
      setSelectedFriends([]);
      setIsInviteDialogOpen(false);
      setActiveTab("invitations"); // Switch tab to see sent invites
    } catch (err) {
      console.error("Error inviting friends:", err);
      setInviteError(
        "Failed to send one or more invitations. Maybe another member in the Group already invited this User",
      );
    } finally {
      setIsSubmittingInvite(false);
      // Ensure success message is not lingering if error occurred
      if (inviteError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

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

  // Update filtered users whenever inviteUsername changes
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (inviteUsername.trim().length >= 1) {
        filterUsers(inviteUsername);
      } else {
        setFilteredUsers([]);
        setShowUserSearchResults(false);
      }
    }, 200); // Quick response time for autocomplete feeling

    return () => clearTimeout(debounceTimer);
  }, [inviteUsername, filterUsers]);

  // --- Handle Clicking on a User Search Result ---

  const handleSelectUser = (user: UserSearchResponse) => {
    setInviteUsername(user.username);
    setIsValidUser(true);
    setShowUserSearchResults(false);
  };
  // --- End New Client-Side User Search States and Functions ---

  // --- Success Message Handler ---
  const showSuccessMessage = (message: string) => {
    // Clear all errors when showing success
    setError(null);
    setDialogError(null);
    setCreateGroupError(null);
    setInviteError(null);

    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
      setActionMessage(""); // Clear message after hiding
    }, 3000); // Display for 3 seconds
  };
  // --- End Success Message Handler ---

  // --- Helper function to extract error message ---
  const getErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error && "status" in err) {
      const appErr = err as ApplicationError;
      // Prioritize backend message if available and meaningful
      if (
        appErr.message &&
        typeof appErr.message === "string" &&
        appErr.message.length > 0 &&
        appErr.message !== "No message available"
      ) {
        return appErr.message;
      }
    }
    // Use standard error message if available
    if (err instanceof Error && err.message) {
      return err.message;
    }
    // Fallback to the default message provided
    return defaultMessage;
  };
  // --- End Helper function ---

  // --- Data Fetching and Processing ---

  const fetchUserById = useCallback(
    async (userIdToFetch: number): Promise<User> => {
      // No specific error state clearing here, rely on caller context
      try {
        // Assuming User type matches /users/{id}/profile response
        return await retry(() =>
          apiService.get<User>(`/users/${userIdToFetch}/profile`)
        );
      } catch (err: unknown) {
        console.error(
          `Error fetching user profile for ID ${userIdToFetch}:`,
          err,
        );
        const message = getErrorMessage(
          err,
          `Could not load profile for user ID ${userIdToFetch}.`,
        );
        // Use page-level error as this is a background detail fetch
        setError(message);
        // Return a placeholder matching the User interface structure
        return {
          userId: userIdToFetch,
          username: userIdToFetch.toString() === userId
            ? "You"
            : "Unknown User",
          // Add other mandatory User fields with default/empty values if necessary
          email: "",
          password: "", // Should not be included in profile response
          bio: "",
          watchlist: [],
          watchedMovies: [],
        };
      }
    },
    [apiService, userId],
  ); // Dependencies: apiService, current userId for "You" check

  const loadGroupDetails = useCallback(
    async (groupId: number): Promise<GroupWithDetails> => {
      // Clear relevant dialog error if this is called while dialog is open
      if (isGroupDetailDialogOpen) {
        setDialogError(null);
      }
      try {
        // Fetch individual pieces of data for the detailed view
        const group: Group = await apiService.get<Group>(`/groups/${groupId}`);
        const members: User[] = await apiService.get<User[]>(
          `/groups/${groupId}/members`,
        );

        // Get pool entries (with movie and addedBy properties)
        const poolEntries: PoolEntry[] = await apiService.get<PoolEntry[]>(
          `/groups/${groupId}/pool`,
        );

        // Extract just the movies from pool entries
        const movies: Movie[] = Array.isArray(poolEntries)
          ? poolEntries.map((entry) => entry.movie)
          : [];

        const creator = group.creator; // fetchUserById handles its own errors/placeholders

        // Construct the detailed object
        return {
          groupId: group.groupId,
          groupName: group.groupName,
          creatorId: group.creatorId, // Keep creatorId if needed elsewhere
          creator: creator, // The fetched User object
          members: Array.isArray(members) ? members : [],
          movies: Array.isArray(movies) ? movies : [],
          phase: group.phase,
        };
      } catch (err: unknown) {
        console.error(
          `Error loading group details for group ID ${groupId}:`,
          err,
        );
        const message = getErrorMessage(
          err,
          `Failed to load details for the group.`,
        );
        // Display error within the dialog if it's open, otherwise page level
        if (isGroupDetailDialogOpen) {
          setDialogError(message);
        } else {
          setError(message);
        }
        // Re-throw to signal failure to the caller (e.g., enhanceGroupsWithDetails)
        throw new Error(message);
      }
    },
    [apiService, fetchUserById, isGroupDetailDialogOpen],
  ); // Dependencies

  useEffect(() => {
    if (!usersLoaded && !isLoadingUsers) {
      fetchAllUsers();
    }
  }, []);

  const isMountedRef = useRef(true);
  const fetchGroupsData = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const [groupsData, receivedData, sentData] = await Promise.all([
        retry(() => apiService.get<Group[]>("/groups")),
        retry(() =>
          apiService.get<GroupInvitation[]>("/groups/invitations/received")
        ),
        retry(() =>
          apiService.get<GroupInvitation[]>("/groups/invitations/sent")
        ),
      ]);
      if (!isMountedRef.current) return;
      const base = Array.isArray(groupsData)
        ? groupsData.sort((a, b) => a.groupName.localeCompare(b.groupName))
        : [];
      setGroups(base);
      setReceivedInvitations(Array.isArray(receivedData) ? receivedData : []);
      setSentInvitations(Array.isArray(sentData) ? sentData : []);
      const details = await Promise.all(
        base.map((g) =>
          loadGroupDetails(g.groupId).catch(() => ({
            groupId: g.groupId,
            groupName: g.groupName,
            creatorId: g.creatorId,
            creator: { userId: g.creatorId, username: "Unknown" } as User,
            members: [],
            movies: [],
            phase: g.phase,
          } as GroupWithDetails))
        ),
      );
      if (!isMountedRef.current) return;
      setGroupsWithDetails(details);
    } catch (err) {
      if (isMountedRef.current) {
        setError(getErrorMessage(err, "Failed to load groups."));
        setGroups([]);
        setReceivedInvitations([]);
        setSentInvitations([]);
        setGroupsWithDetails([]);
      }
    } finally {
      if (isMountedRef.current) setLoading(false);
    }
  }, [apiService, userId, loadGroupDetails]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchGroupsData();
    return () => {
      isMountedRef.current = false;
    };
  }, [fetchGroupsData]);

  // --- Filtering State ---
  const [filteredGroups, setFilteredGroups] = useState<GroupWithDetails[]>([]);
  useEffect(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) {
      setFilteredGroups(groupsWithDetails);
    } else {
      setFilteredGroups(
        groupsWithDetails.filter((group) =>
          group.groupName.toLowerCase().includes(query)
        ),
      );
    }
  }, [searchQuery, groupsWithDetails]);

  // --- Action Handlers ---

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateGroupError(null);
    setError(null);

    if (!newGroupName.trim()) {
      setCreateGroupError("Please enter a group name");
      return;
    }
    setIsSubmittingGroup(true);
    try {
      await retry(() =>
        apiService.post("/groups", { groupName: newGroupName })
      );
      await fetchGroupsData(); // Refresh lists is crucial
      showSuccessMessage(`Group "${newGroupName}" created successfully`);
      setNewGroupName("");
      setIsCreateGroupDialogOpen(false);
    } catch (err: unknown) {
      console.error("Error creating group:", err);
      let specificErrorMessage = "Failed to create group. Please try again.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 409:
            specificErrorMessage =
              `A group named "${newGroupName}" already exists.`;
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setCreateGroupError(specificErrorMessage);
    } finally {
      setIsSubmittingGroup(false);
      // Ensure success message is not lingering if error occurred
      if (createGroupError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setError(null);

    if (!inviteUsername.trim() || !selectedGroupId) {
      setInviteError("Please enter a username."); // Group selection check implied by selectedGroupId
      return;
    }
    setIsSubmittingInvite(true);
    try {
      // Step 1: Search for user
      const results = await apiService.get<UserSearchResponse[]>(
        `/users/search?username=${encodeURIComponent(inviteUsername)}`,
      );
      if (!Array.isArray(results) || results.length === 0) {
        throw new Error(`User '${inviteUsername}' not found.`); // Throw error to be caught below
      }
      const receiverId = results[0].userId;

      // Prevent inviting self
      if (receiverId.toString() === userId) {
        throw new Error("You cannot invite yourself to a group.");
      }

      // Step 2: Send invitation
      await apiService.post(
        `/groups/invitations/send/${selectedGroupId}/${receiverId}`,
        {},
      );
      const updatedSentInvites = await apiService.get<GroupInvitation[]>(
        "/groups/invitations/sent",
      );
      if (Array.isArray(updatedSentInvites)) {
        setSentInvitations(updatedSentInvites);
      }
      showSuccessMessage(`Invitation sent to ${inviteUsername}`);
      setInviteUsername("");
      setIsInviteDialogOpen(false);
      setActiveTab("invitations"); // Switch tab to see sent invite
    } catch (err: unknown) {
      console.error("Error inviting member:", err);
      let specificErrorMessage = "Failed to send invitation. Please try again.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 400:
            specificErrorMessage =
              "Could not send invitation. Check group/user details or if already invited/member.";
            break;
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "You don't have permission to invite members to this group.";
            break;
          case 404:
            specificErrorMessage =
              "Could not find the specified group or user.";
            break;
          case 409:
            specificErrorMessage = getErrorMessage(
              err,
              "User is already a member or has a pending invitation.",
            );
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage); // Handles custom Error messages too
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage); // Handles custom Error messages too
      }
      setInviteError(specificErrorMessage);
    } finally {
      setIsSubmittingInvite(false);
      // Ensure success message is not lingering if error occurred
      if (inviteError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleAcceptInvitation = async (invitationId: number) => {
    setError(null);
    const originalInvitations = [...receivedInvitations];
    setReceivedInvitations((prev) =>
      prev.filter((inv) => inv.invitationId !== invitationId)
    );
    try {
      await apiService.post(`/groups/invitations/${invitationId}/accept`, {});
      await fetchGroupsData(); // Refresh everything
      showSuccessMessage("Group invitation accepted"); // Show success message (will likely be cleared by state update)
    } catch (err: unknown) {
      console.error("Error accepting invitation:", err);
      setReceivedInvitations(originalInvitations); // Rollback UI
      let specificErrorMessage =
        "An error occurred while accepting the invitation.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 400:
            specificErrorMessage =
              "This invitation seems to be invalid or already processed.";
            break;
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "You cannot accept this invitation (perhaps not the recipient?).";
            break;
          case 404:
            specificErrorMessage = "This group invitation could not be found.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setError(specificErrorMessage); // Set PAGE level error
    } finally {
      // Ensure success message is not lingering if error occurred
      if (error && !showActionMessage) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleRejectInvitation = async (invitationId: number) => {
    setError(null);
    const originalInvitations = [...receivedInvitations];
    setReceivedInvitations((prev) =>
      prev.filter((inv) => inv.invitationId !== invitationId)
    );
    try {
      await apiService.post(`/groups/invitations/${invitationId}/reject`, {});
      const invites = await apiService.get<GroupInvitation[]>(
        "/groups/invitations/received",
      );
      if (Array.isArray(invites)) setReceivedInvitations(invites); // Refresh just received list
      showSuccessMessage("Group invitation rejected");
    } catch (err: unknown) {
      console.error("Error rejecting invitation:", err);
      setReceivedInvitations(originalInvitations); // Rollback
      let specificErrorMessage =
        "An error occurred while rejecting the invitation.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 400:
            specificErrorMessage =
              "This invitation seems to be invalid or already processed.";
            break;
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage = "You cannot reject this invitation.";
            break;
          case 404:
            specificErrorMessage = "This group invitation could not be found.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setError(specificErrorMessage); // Set PAGE level error
    } finally {
      // Ensure success message is not lingering if error occurred
      if (error && !showActionMessage) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleCancelInvitation = async (invitationId: number) => {
    setError(null);
    const originalInvitations = [...sentInvitations];
    setSentInvitations((prev) =>
      prev.filter((inv) => inv.invitationId !== invitationId)
    );
    try {
      await apiService.delete(`/groups/invitations/${invitationId}`);
      const invites = await apiService.get<GroupInvitation[]>(
        "/groups/invitations/sent",
      );
      if (Array.isArray(invites)) setSentInvitations(invites); // Refresh sent list
      showSuccessMessage("Invitation cancelled");
    } catch (err: unknown) {
      console.error("Error cancelling invitation:", err);
      setSentInvitations(originalInvitations); // Rollback
      let specificErrorMessage =
        "An error occurred while cancelling the invitation.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 400:
            specificErrorMessage =
              "This invitation seems to be invalid or already processed.";
            break;
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "You cannot cancel this invitation (must be sender).";
            break;
          case 404:
            specificErrorMessage = "This group invitation could not be found.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setError(specificErrorMessage); // Set PAGE level error
    } finally {
      // Ensure success message is not lingering if error occurred
      if (error && !showActionMessage) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleLeaveGroup = async (groupId: number) => {
    setDialogError(null);
    setError(null);
    setGroupToLeave(groupId);
    setShowLeaveConfirmDialog(true);
  };

  const confirmLeaveGroup = async () => {
    if (!groupToLeave) return;

    try {
      await apiService.delete(`/groups/${groupToLeave}/leave`);
      await fetchGroupsData(); // Refresh lists
      showSuccessMessage("Left group successfully");
      setIsGroupDetailDialogOpen(false);
      setSelectedGroup(null);
    } catch (err: unknown) {
      console.error("Error leaving group:", err);
      let specificErrorMessage = "An error occurred while leaving the group.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "You cannot leave a group you are not a member of (or creator cannot leave).";
            break;
          case 404:
            specificErrorMessage =
              "Could not find the group or your user account.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setDialogError(specificErrorMessage); // Show error INSIDE the dialog
    } finally {
      // Close the confirmation dialog regardless of success or failure
      setShowLeaveConfirmDialog(false);
      setGroupToLeave(null);

      // Ensure success message is not lingering if error occurred
      if (dialogError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleDeleteGroup = async (groupId: number) => {
    setDialogError(null);
    setError(null);
    setGroupToDelete(groupId);
    setShowDeleteConfirmDialog(true);
  };

  const confirmDeleteGroup = async () => {
    if (!groupToDelete) return;

    try {
      await apiService.delete(`/groups/${groupToDelete}`);
      await fetchGroupsData(); // Refresh lists
      showSuccessMessage("Group deleted successfully");
      setIsGroupDetailDialogOpen(false);
      setSelectedGroup(null);
    } catch (err: unknown) {
      console.error("Error deleting group:", err);
      let specificErrorMessage = "An error occurred while deleting the group.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "Only the group creator can delete this group.";
            break;
          case 404:
            specificErrorMessage = "The specified group could not be found.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setDialogError(specificErrorMessage); // Show error INSIDE the dialog
    } finally {
      // Close the confirmation dialog regardless of success or failure
      setShowDeleteConfirmDialog(false);
      setGroupToDelete(null);

      // Ensure success message is not lingering if error occurred
      if (dialogError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleRemoveMember = async (groupId: number, memberId: number) => {
    setDialogError(null);
    setError(null);
    setMemberToRemove({ groupId, memberId });
    setShowRemoveMemberConfirmDialog(true);
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;

    try {
      await apiService.delete(
        `/groups/${memberToRemove.groupId}/members/${memberToRemove.memberId}`,
      );
      showSuccessMessage("Member removed successfully");
      // Refresh details in the dialog
      const refreshedGroup = await loadGroupDetails(memberToRemove.groupId);
      setSelectedGroup(refreshedGroup);
      fetchGroupsData(); // Refresh main list (for member counts, etc.)
    } catch (err: unknown) {
      console.error("Error removing member:", err);
      let specificErrorMessage = "An error occurred while removing the member.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage = "Only the group creator can remove members.";
            break;
          case 404:
            specificErrorMessage =
              "Could not find the group or the specified member.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setDialogError(specificErrorMessage); // Show error INSIDE the dialog
    } finally {
      // Close the confirmation dialog regardless of success or failure
      setShowRemoveMemberConfirmDialog(false);
      setMemberToRemove(null);

      // Ensure success message is not lingering if error occurred
      if (dialogError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleRenameGroup = async (groupId: number, inputElementId: string) => {
    setDialogError(null);
    setError(null);
    const input = document.getElementById(inputElementId) as HTMLInputElement;
    const newName = input?.value.trim();

    if (!newName || !selectedGroup || newName === selectedGroup.groupName) {
      setDialogError("Please enter a new, valid group name.");
      return;
    }
    try {
      await apiService.put(`/groups/${groupId}`, { groupName: newName });
      showSuccessMessage("Group name updated successfully");
      const refreshedGroup = await loadGroupDetails(groupId);
      setSelectedGroup(refreshedGroup);
      input.value = newName; // Reflect change in input
      fetchGroupsData(); // Refresh main list
    } catch (err: unknown) {
      console.error("Error updating group name:", err);
      let specificErrorMessage =
        "An error occurred while updating the group name.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 409:
            specificErrorMessage =
              `The group name "${newName}" is already taken.`;
            break;
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "Only the group creator can change the group name.";
            break;
          case 404:
            specificErrorMessage = "The specified group could not be found.";
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setDialogError(specificErrorMessage); // Show error INSIDE the dialog
    } finally {
      // Ensure success message is not lingering if error occurred
      if (dialogError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  const handleAdvancePhase = async (groupId: number, currentPhase: string) => {
    setDialogError(null);
    setError(null);
    const nextPhaseAction = currentPhase === "POOL"
      ? "start-voting"
      : "show-results";
    const successMessage = currentPhase === "POOL"
      ? "Voting started"
      : "Results shown";
    const nextRoute = currentPhase === "POOL"
      ? `/users/${userId}/groups/${groupId}/vote`
      : `/users/${userId}/groups/${groupId}/results`;

    try {
      await apiService.post(`/groups/${groupId}/${nextPhaseAction}`, {});
      showSuccessMessage(successMessage);
      router.push(nextRoute); // Navigate after success
      setIsGroupDetailDialogOpen(false); // Close dialog
    } catch (err: unknown) {
      console.error("Error advancing group phase:", err);
      let specificErrorMessage =
        "An error occurred while changing the group phase.";
      if (err instanceof Error && "status" in err) {
        const appErr = err as ApplicationError;
        switch (appErr.status) {
          case 401:
            specificErrorMessage =
              "Your session has expired. Please log in again.";
            break;
          case 403:
            specificErrorMessage =
              "Only the group creator can change the phase.";
            break;
          case 404:
            specificErrorMessage = "The specified group could not be found.";
            break;
          case 409: // Conflict - Phase mismatch or condition not met
            specificErrorMessage = getErrorMessage(
              err,
              "Cannot change phase. Ensure conditions are met (e.g., movies in pool).",
            );
            break;
          default:
            specificErrorMessage = getErrorMessage(err, specificErrorMessage);
            break;
        }
      } else {
        specificErrorMessage = getErrorMessage(err, specificErrorMessage);
      }
      setDialogError(specificErrorMessage); // Show error INSIDE the dialog
    } finally {
      // Ensure success message is not lingering if error occurred
      if (dialogError) {
        setShowActionMessage(false);
        setActionMessage("");
      }
    }
  };

  // Navigation functions
  const navigateToGroupPool = (groupId: number) =>
    router.push(`/users/${userId}/groups/${groupId}/pool`);
  const navigateToGroupVoting = (groupId: number) =>
    router.push(`/users/${userId}/groups/${groupId}/vote`);
  const navigateToGroupResults = (groupId: number) =>
    router.push(`/users/${userId}/groups/${groupId}/results`);

  // Open group details dialog (loads fresh data)
  const openGroupDetails = async (group: GroupWithDetails) => {
    setDialogError(null);
    setError(null); // Clear page errors too
    setShowActionMessage(false); // Hide old success messages
    setActionMessage("");
    try {
      // Trigger loading state maybe?
      const freshDetails = await loadGroupDetails(group.groupId);
      setSelectedGroup(freshDetails);
      setIsGroupDetailDialogOpen(true);
    } catch (err) {
      // Error is set by loadGroupDetails, log maybe?
      console.error("Failed to open group details due to load error:", err);
      // If dialog didn't open, page error might still be relevant
      if (!isGroupDetailDialogOpen && !error) {
        setError("Could not load group details. Please try again.");
      }
    }
  };

  // Get invitation count for badge (Adjust logic as needed, e.g., sum received + sent?)
  const getInvitationCount = () =>
    receivedInvitations.length + sentInvitations.length;

  // --- JSX Rendering ---

  if (loading) {
    return (
      <div className="bg-[#ebefff] flex min-h-screen w-full">
        <Navigation userId={userId} activeItem="Movie Groups" />
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]" />
        </div>
      </div>
    );
  }

  // Display Page Level Error centrally if critical load failed
  if (
    error &&
    !groups.length &&
    !receivedInvitations.length &&
    !sentInvitations.length
  ) {
    return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        <Navigation userId={userId} activeItem="Movie Groups" />
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-2xl text-center bg-white p-8 rounded-2xl shadow-md">
            <ErrorMessage message={error} onClose={() => setError(null)} />
            <Button
              onClick={() => {
                setError(null);
                fetchGroupsData();
              }}
              className="mt-6 bg-[#3b3e88] hover:bg-[#3b3e88]/90 rounded-xl"
            >
              Retry Loading
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main component structure
  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem="Movie Groups" />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Display Non-critical Page Level Errors (e.g., accept/reject fails) */}
        {error && (
          <div className="mb-4">
            <ErrorMessage
              message={error}
              onClose={() => setError(null)}
            />
          </div>
        )}

        {/* Create group button section */}
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
        <div className="flex border-b border-violet-600/20 mb-6">
          <button
            className={`px-6 py-3 font-medium text-base ${
              activeTab === "groups"
                ? "text-[#3b3e88] border-b-2 border-violet-600"
                : "text-[#3b3e88]/80 hover:text-[#3b3e88]/70"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </button>
          <button
            className={`px-6 py-3 font-medium text-base relative ${
              activeTab === "invitations"
                ? "text-[#3b3e88] border-b-2 border-violet-600"
                : "text-[#3b3e88]/80 hover:text-[#3b3e88]/70"
            }`}
            onClick={() => setActiveTab("invitations")}
          >
            Invitations
            {getInvitationCount() > 0 && (
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs flex items-center justify-center rounded-full">
                {getInvitationCount()}
              </span>
            )}
          </button>
        </div>

        {/* Groups list Tab */}
        {activeTab === "groups" && (
          <>
            {/* Search bar */}
            <div className="mb-6 relative">
              {/* Search Icon */}
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
                className="w-full pl-12 pr-12 py-3 bg-gradient-to-r from-violet-600 to-indigo-900 rounded-2xl border-0 text-white placeholder-white/70 focus:ring-2 focus:ring-white/30 focus:outline-none"
                placeholder="Search groups..."
              />
              {/* Clear Search Button */}
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

            {/* Groups grid */}
            {isGroupDataLoading
              ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]" />
                </div>
              )
              : filteredGroups.length > 0
              ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredGroups.map((group) => (
                    <div
                      key={group.groupId}
                      className="bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      onClick={() => openGroupDetails(group)}
                    >
                      {/* Group Card Content */}
                      <div className="flex items-center justify-between mb-2">
                        <h3
                          className="font-semibold text-[#3b3e88] text-lg truncate"
                          title={group.groupName}
                        >
                          {group.groupName}
                        </h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full flex-shrink-0">
                          {group.members?.length ?? 0}{"  "}
                          {group.members?.length === 1 ? "member" : "members"}
                        </span>
                      </div>
                      {/* Movie pool preview */}
                      <div className="mb-4 min-h-[80px] flex flex-col justify-end">
                        {group.movies && group.movies.length > 0
                          ? (
                            <>
                              <p className="text-xs text-[#3b3e88]/80 mb-2">
                                Movie Pool ({group.movies.length})
                              </p>
                              <div className="flex gap-2 overflow-x-auto pb-2">
                                {/* Movie posters */}
                                {group.movies.slice(0, 4).map((movie) => (
                                  <div
                                    key={movie.movieId}
                                    className="w-10 h-14 flex-shrink-0 rounded overflow-hidden"
                                  >
                                    <img
                                      src={movie.posterURL &&
                                          movie.posterURL.startsWith("http")
                                        ? movie.posterURL
                                        : movie.posterURL
                                        ? `https://image.tmdb.org/t/p/w500${movie.posterURL}`
                                        : "/placeholder.png"}
                                      alt={movie.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                ))}
                                {/* More indicator */}
                                {group.movies.length > 4 && (
                                  <div className="w-10 h-14 bg-indigo-100 flex-shrink-0 flex items-center justify-center rounded">
                                    <span className="text-xs font-medium text-indigo-700">
                                      +{group.movies.length - 4}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </>
                          )
                          : (
                            <p className="text-[#3b3e88]/80 text-xs">
                              No movies in pool yet
                            </p>
                          )}
                      </div>
                      {/* Creator and Phase */}
                      <div className="flex justify-between items-center text-xs text-[#3b3e88]/80">
                        <span>
                          {group.creator
                            ? group.creator.userId.toString() === userId
                              ? "Created by you"
                              : `Created by ${group.creator.username}`
                            : "Loading creator..."}
                        </span>
                        <span>
                          {`Phase: ${group.phase?.toUpperCase() ?? "UNKNOWN"}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
              : (
                // No groups / No search results message
                <div className="bg-white rounded-3xl p-12 text-center shadow-sm">
                  {searchQuery
                    ? (
                      /* No search results */ <div>
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
                    )
                    : (
                      /* No groups at all */ <div>
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
                                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                              >
                              </path>
                            </svg>
                          </div>
                        </div>
                        <p className="text-[#838bad] mb-2">
                          You are not part of any groups yet
                        </p>
                        <p className="text-[#3b3e88]/80 mb-6">
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

        {/* Invitations Tab */}
        {activeTab === "invitations" && (
          <div className="space-y-6">
            {/* Page Level Error can be displayed here too */}
            {/* Received invitations section */}
            {receivedInvitations.length > 0 && (
              <div className="mb-8">
                <h3 className="text-[#3b3e88] font-medium text-lg mb-4">
                  Received Invitations
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {receivedInvitations.map((invitation) => (
                    <div
                      key={invitation.invitationId}
                      className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-rose-500"
                    >
                      <div className="mb-3">
                        <h4 className="font-semibold text-[#3b3e88]">
                          {invitation.group.groupName}
                        </h4>
                        <p className="text-[#3b3e88]/80 text-xs mb-1">
                          Invited by {invitation.sender.username} on {new Date(
                            invitation.creationTime,
                          ).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-xs h-8 rounded-xl flex-1"
                          onClick={() =>
                            handleAcceptInvitation(invitation.invitationId)}
                        >
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          className="border-violet-600 text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1"
                          onClick={() =>
                            handleRejectInvitation(invitation.invitationId)}
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
                      key={invitation.invitationId}
                      className="bg-white rounded-2xl p-4 shadow-sm border-l-4 border-orange-400"
                    >
                      <div className="mb-3">
                        <h4 className="font-semibold text-[#3b3e88]">
                          {invitation.group.groupName}
                        </h4>
                        <p className="text-[#3b3e88]/80 text-xs mb-1">
                          Invited {invitation.receiver.username} on {new Date(
                            invitation.creationTime,
                          ).toLocaleDateString()}
                        </p>
                        <p className="text-[#838bad] text-xs italic mb-1">
                          Status: Pending
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full border-rose-500 text-rose-500 hover:bg-rose-50 text-xs h-8 rounded-xl"
                        onClick={() =>
                          handleCancelInvitation(invitation.invitationId)}
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
                      >
                      </path>
                    </svg>
                  </div>
                </div>
                <p className="text-[#838bad] mb-2">No pending invitations</p>
                <p className="text-[#3b3e88]/80">
                  Invite friends to your groups or wait for invitations
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- Dialogs --- */}

        {/* Create Group Dialog */}
        <Dialog
          open={isCreateGroupDialogOpen}
          onOpenChange={(open) => {
            setIsCreateGroupDialogOpen(open);
            if (!open) {
              setCreateGroupError(null);
              setNewGroupName("");
            }
          }}
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
              {/* Error Message Area */}
              <div className="min-h-[40px] py-2">
                {createGroupError && (
                  <ErrorMessage
                    message={createGroupError}
                    onClose={() => setCreateGroupError(null)}
                  />
                )}
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

        {/* Invite Member Dialog - UPDATED with client-side search */}
        {/* Enhanced Invite Member Dialog with both friends selection and user search */}
        <Dialog
          open={isInviteDialogOpen}
          onOpenChange={(open) => {
            setIsInviteDialogOpen(open);
            if (!open) {
              setInviteError(null);
              setInviteUsername("");
              setSelectedFriends([]);
              /* Don't clear selectedGroupId here if multi-invite is desired */
            }
          }}
        >
          <DialogContent className="max-w-md md:max-w-2xl w-full rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#3b3e88] text-xl">
                {selectedGroup
                  ? `Invite to ${selectedGroup.groupName}`
                  : "Invite to Group"}
              </DialogTitle>
            </DialogHeader>

            {/* Tab navigation for invite methods */}
            <div className="flex border-b border-[#3b3e88]/20 mb-4">
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  inviteMethod === "friends"
                    ? "text-[#3b3e88] border-b-2 border-[#3b3e88]"
                    : "text-[#3b3e88]/80 hover:text-[#3b3e88]/80"
                }`}
                onClick={() => setInviteMethod("friends")}
              >
                Invite Friends
              </button>
              <button
                className={`px-4 py-2 font-medium text-sm ${
                  inviteMethod === "search"
                    ? "text-[#3b3e88] border-b-2 border-[#3b3e88]"
                    : "text-[#3b3e88]/80 hover:text-[#3b3e88]/80"
                }`}
                onClick={() => setInviteMethod("search")}
              >
                Search Users
              </button>
            </div>

            {/* Error Message Area */}
            <div className="min-h-[40px] pb-2">
              {inviteError && (
                <ErrorMessage
                  message={inviteError}
                  onClose={() => setInviteError(null)}
                />
              )}
            </div>

            {/* Friend Selection Method */}
            {inviteMethod === "friends" && (
              <div className="space-y-4">
                {loadingFriends
                  ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin h-6 w-6 border-2 border-[#3b3e88] border-t-transparent rounded-full">
                      </div>
                    </div>
                  )
                  : availableFriends.length > 0
                  ? (
                    <>
                      <div className="mb-2">
                        <Label className="text-[#3b3e88] mb-2 block">
                          Select friends to invite ({selectedFriends.length}
                          {" "}
                          selected)
                        </Label>
                        {/* Friend search filter */}
                        <div className="relative mb-3">
                          <input
                            type="text"
                            value={friendSearchQuery}
                            onChange={(e) =>
                              setFriendSearchQuery(e.target.value)}
                            placeholder="Filter friends..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3b3e88] focus:outline-none"
                          />
                          {friendSearchQuery && (
                            <button
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                              onClick={() => setFriendSearchQuery("")}
                            >
                              ✕
                            </button>
                          )}
                        </div>

                        {/* Friends grid with checkboxes */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                          {filteredAvailableFriends.map((friend) => (
                            <div
                              key={friend.userId}
                              className={`flex items-center p-2 rounded-xl transition-colors ${
                                selectedFriends.some(
                                    (f) => f.userId === friend.userId,
                                  )
                                  ? "bg-indigo-50 border border-indigo-200"
                                  : "hover:bg-gray-50 border border-transparent"
                              }`}
                            >
                              <input
                                type="checkbox"
                                id={`friend-${friend.userId}`}
                                checked={selectedFriends.some(
                                  (f) => f.userId === friend.userId,
                                )}
                                onChange={() => toggleFriendSelection(friend)}
                                className="h-4 w-4 rounded border-gray-300 text-[#3b3e88] focus:ring-[#3b3e88]"
                              />
                              <label
                                htmlFor={`friend-${friend.userId}`}
                                className="ml-2 flex-grow cursor-pointer font-medium text-sm text-[#3b3e88]"
                              >
                                {friend.username}
                              </label>
                            </div>
                          ))}
                        </div>

                        {filteredAvailableFriends.length === 0 && (
                          <div className="text-center py-4 text-[#838bad]">
                            No friends match your filter
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end">
                        <Button
                          type="button"
                          className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-sm"
                          onClick={handleInviteSelectedFriends}
                          disabled={isSubmittingInvite ||
                            selectedFriends.length === 0}
                        >
                          {isSubmittingInvite
                            ? "Sending..."
                            : `Invite ${selectedFriends.length} Friend${
                              selectedFriends.length !== 1 ? "s" : ""
                            }`}
                        </Button>
                      </div>
                    </>
                  )
                  : (
                    <div className="text-center py-8">
                      <div className="mb-3 flex justify-center">
                        <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-indigo-400"
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
                      <p className="text-[#838bad]">
                        You have no further friends to invite
                      </p>
                      <p className="text-[#3b3e88]/80 text-sm mb-4">
                        Add friends first or use the search option
                      </p>
                      <Button
                        variant="outline"
                        className="rounded-xl border-[#3b3e88] text-[#3b3e88] text-sm"
                        onClick={() => setInviteMethod("search")}
                      >
                        Switch to User Search
                      </Button>
                    </div>
                  )}
              </div>
            )}

            {/* User Search Method */}
            {inviteMethod === "search" && (
              <form onSubmit={handleInviteMember}>
                <div className="space-y-4 py-2">
                  <div className="space-y-2 relative">
                    <Label htmlFor="invite-username" className="text-[#3b3e88]">
                      Search by Username
                    </Label>
                    <Input
                      id="invite-username"
                      value={inviteUsername}
                      onChange={(e) => setInviteUsername(e.target.value)}
                      placeholder="Start typing a username..."
                      className="w-full rounded-xl"
                      autoComplete="off"
                      required
                    />

                    {/* Client-Side Filtered Results Dropdown */}
                    {showUserSearchResults &&
                      inviteUsername.trim().length >= 1 && (
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
                                  className="px-4 py-3 hover:bg-gray-100 cursor-pointer transition-colors text-[#3b3e88] font-medium border-b border-gray-100 last:border-b-0 first:rounded-t-2xl last:rounded-b-2xl"
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
                                : "No users available to invite"}
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
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="submit"
                    className="bg-[#3b3e88] hover:bg-[#3b3e88]/90 min-w-[220px]"
                    disabled={isSubmittingInvite || !isValidUser}
                  >
                    {isSubmittingInvite
                      ? "Sending..."
                      : !isValidUser && usersLoaded
                      ? "Please search for and select an existing user"
                      : "Send Invitation"}
                  </Button>
                </div>
              </form>
            )}

            <DialogFooter className="mt-4 border-t border-gray-100 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsInviteDialogOpen(false)}
                className="rounded-xl"
              >
                Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Group Details Dialog */}
        <Dialog
          open={isGroupDetailDialogOpen}
          onOpenChange={(open) => {
            setIsGroupDetailDialogOpen(open);
            if (!open) {
              setDialogError(null);
              setSelectedGroup(null);
              setShowActionMessage(false);
              setActionMessage("");
            }
          }}
        >
          <DialogContent className="max-w-3xl rounded-2xl">
            {selectedGroup
              ? (
                <>
                  <DialogHeader>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      {/* Group Title and Phase */}
                      <div>
                        <DialogTitle className="text-[#3b3e88] text-xl">
                          {selectedGroup.groupName}
                        </DialogTitle>
                        <p className="text-sm text-[#838bad] mt-1">
                          Current Phase:{" "}
                          {selectedGroup.phase?.toUpperCase() ?? "UNKNOWN"}
                        </p>
                        <div className="text-sm text-[#838bad] mt-1">
                          <Timer groupId={selectedGroup.groupId.toString()} />
                        </div>
                      </div>
                      {/* Admin Actions (Rename/Delete) or Leave Button */}
                      {selectedGroup.creatorId === parseInt(userId || "-1")
                        ? (
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                            <div className="flex items-center gap-2 flex-grow">
                              <Input
                                id={`editGroupName-${selectedGroup.groupId}`}
                                defaultValue={selectedGroup.groupName}
                                className="border rounded-xl px-2 py-1 text-sm focus:outline-none focus:ring focus:ring-indigo-200 flex-grow"
                                aria-label="Edit Group Name"
                              />
                              <Button
                                onClick={() =>
                                  handleRenameGroup(
                                    selectedGroup.groupId,
                                    `editGroupName-${selectedGroup.groupId}`,
                                  )}
                              >
                                Rename
                              </Button>
                            </div>
                            <Button
                              className="bg-white text-red-600 border border-red-600 hover:bg-red-50"
                              onClick={() =>
                                handleDeleteGroup(selectedGroup.groupId)}
                            >
                              Delete Group
                            </Button>
                          </div>
                        )
                        : (
                          <Button
                            className="bg-white text-red-600 border border-red-600 hover:bg-red-50"
                            onClick={() =>
                              handleLeaveGroup(selectedGroup.groupId)}
                          >
                            Leave Group
                          </Button>
                        )}
                      {selectedGroup.creatorId === parseInt(userId || "-1") &&
                        ["voting", "pool"].includes(
                          selectedGroup.phase.toLowerCase(),
                        ) && (
                        <SetTimer
                          groupId={selectedGroup.groupId}
                          isCreator={true}
                        />
                      )}
                    </div>
                  </DialogHeader>
                  <div className="py-4">
                    {/* Main dialog content area */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Group Details Section */}
                      <div>
                        <h4 className="font-medium text-[#3b3e88] mb-2">
                          Group Details
                        </h4>
                        <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                          <div>
                            <span className="text-[#838bad] text-sm">
                              Created by:
                            </span>
                            <p className="text-[#3b3e88] font-medium">
                              {selectedGroup.creator?.username ?? "Unknown"}
                              {" "}
                              {selectedGroup.creatorId ===
                                  parseInt(userId || "-1") && "(You)"}
                            </p>
                          </div>
                          <div>
                            <span className="text-[#838bad] text-sm">
                              Members ({selectedGroup.members?.length ?? 0}):
                            </span>
                            <ul className="text-[#3b3e88] space-y-0.5 max-h-40 overflow-y-auto pr-2 mt-1">
                              {selectedGroup.members?.map((member) => (
                                <li
                                  key={member.userId}
                                  className="flex items-center justify-between text-sm py-1"
                                >
                                  <span>
                                    {member.username}
                                    {member.userId ===
                                        selectedGroup.creatorId &&
                                      " (Creator)"}
                                    {member.userId.toString() === userId &&
                                      " (You)"}
                                  </span>
                                  {selectedGroup.creatorId ===
                                      parseInt(userId || "-1") &&
                                    member.userId !== selectedGroup.creatorId &&
                                    (
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-rose-400 text-rose-500 hover:bg-rose-50 rounded-lg text-xs h-6 px-2 ml-2"
                                        onClick={() =>
                                          handleRemoveMember(
                                            selectedGroup.groupId,
                                            member.userId,
                                          )}
                                      >
                                        Remove
                                      </Button>
                                    )}
                                </li>
                              ))}
                              {sentInvitations
                                .filter(
                                  (inv) =>
                                    inv.group.groupId ===
                                      selectedGroup.groupId &&
                                    !inv.accepted,
                                )
                                .map((inv) => (
                                  <li
                                    key={inv.invitationId}
                                    className="italic text-xs leading-none py-0.5"
                                  >
                                    {inv.receiver.username} (invited)
                                  </li>
                                ))}
                            </ul>

                            {/* Update the Add Member button with enhanced styling */}
                            <Button
                              className="mt-3 w-full bg-[#3b3e88] hover:bg-[#3b3e88]/90 text-white"
                              onClick={() => {
                                setSelectedGroupId(selectedGroup.groupId);
                                setInviteMethod("friends"); // Default to friends tab
                                setFriendSearchQuery(""); // Clear any previous search
                                setSelectedFriends([]); // Clear any previous selections
                                setInviteUsername(""); // Clear any previous search username
                                setIsInviteDialogOpen(true);
                              }}
                            >
                              Invite Members
                            </Button>
                          </div>
                        </div>
                      </div>
                      {/* Movie Pool & Actions Section */}
                      <div>
                        <h4 className="font-medium text-[#3b3e88] mb-2">
                          Movie Pool
                        </h4>
                        {selectedGroup.movies &&
                            selectedGroup.movies.length > 0
                          ? (
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 bg-indigo-50 rounded-xl p-4">
                              {selectedGroup.movies.map((movie) => (
                                <div
                                  key={movie.movieId}
                                  className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm"
                                >
                                  <div className="w-10 h-14 rounded overflow-hidden flex-shrink-0">
                                    <img
                                      src={movie.posterURL &&
                                          movie.posterURL.startsWith("http")
                                        ? movie.posterURL
                                        : movie.posterURL
                                        ? `https://image.tmdb.org/t/p/w500${movie.posterURL}`
                                        : "/placeholder.png"}
                                      alt={movie.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-grow min-w-0">
                                    <p className="font-medium text-[#3b3e88] truncate text-sm">
                                      {movie.title}
                                    </p>
                                    <p className="text-xs text-[#3b3e88]/80">
                                      {movie.year} •{" "}
                                      {movie.genres?.slice(0, 2).join(", ")}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )
                          : (
                            <div className="bg-indigo-50 rounded-xl p-6 text-center">
                              <p className="text-[#3b3e88]/90 mb-2">
                                No movies in pool yet
                              </p>
                              <p className="text-[#3b3e88]/80 text-sm mb-4">
                                Add movies to the pool for your group to vote on
                              </p>
                            </div>
                          )}
                        {/* Action buttons */}
                        <div className="flex flex-col gap-3 mt-4">
                          <Button
                            variant="secondary"
                            className="bg-[#7824ec] hover:bg-opacity-90"
                            onClick={() => {
                              const phase = selectedGroup.phase;
                              if (phase === "POOL") {
                                navigateToGroupPool(selectedGroup.groupId);
                              } else if (phase === "VOTING") {
                                navigateToGroupVoting(selectedGroup.groupId);
                              } else {
                                navigateToGroupResults(selectedGroup.groupId);
                              }
                            }}
                          >
                            {selectedGroup.phase === "POOL"
                              ? "View & Edit Movie Pool"
                              : selectedGroup.phase === "VOTING"
                              ? "Go to Voting"
                              : "View Results"}
                          </Button>
                          {selectedGroup.creatorId ===
                              parseInt(userId || "-1") &&
                            selectedGroup.phase !== "RESULTS" && (
                            <Button
                              variant="secondary"
                              disabled={selectedGroup.phase === "POOL" &&
                                poolCount < 2}
                              onClick={() =>
                                handleAdvancePhase(
                                  selectedGroup.groupId,
                                  selectedGroup.phase,
                                )}
                            >
                              {selectedGroup.phase === "POOL"
                                ? "End Pooling & Start Voting"
                                : "End Voting & Show Results"}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Error and Success Message Area at the bottom */}
                  <div className="min-h-[40px] py-2 space-y-2">
                    {dialogError && (
                      <ErrorMessage
                        message={dialogError}
                        onClose={() => setDialogError(null)}
                      />
                    )}
                    {showActionMessage && actionMessage && !dialogError && (
                      <ActionMessage
                        message={actionMessage}
                        isVisible={showActionMessage}
                        onHide={() => setShowActionMessage(false)}
                        className="bg-green-500"
                      />
                    )}
                  </div>
                </>
              )
              : (
                // Fallback if selectedGroup is null (should ideally not happen if dialog open state is managed correctly)
                <div className="p-4 text-center text-gray-500">
                  Loading group details or group not found...
                </div>
              )}
          </DialogContent>
        </Dialog>

        {/* Success Message Display Area */}
        <div className="fixed bottom-4 right-4 z-50">
          <ActionMessage
            message={actionMessage}
            isVisible={showActionMessage}
            onHide={() => setShowActionMessage(false)}
            className="bg-green-500" // Success styling
          />
        </div>

        {/* Leave Group Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showLeaveConfirmDialog}
          onClose={() => setShowLeaveConfirmDialog(false)}
          onConfirm={confirmLeaveGroup}
          onCancel={() => setShowLeaveConfirmDialog(false)}
          title="Leave Group"
          message="Are you sure you want to leave this group?"
          confirmText="Yes, leave group"
          cancelText="No, stay in group"
        />

        {/* Delete Group Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirmDialog}
          onClose={() => setShowDeleteConfirmDialog(false)}
          onConfirm={confirmDeleteGroup}
          onCancel={() => setShowDeleteConfirmDialog(false)}
          title="Delete Group"
          message="Are you sure you want to permanently delete this group? This cannot be undone."
          confirmText="Yes, delete group"
          cancelText="No, keep group"
        />

        {/* Remove Member Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showRemoveMemberConfirmDialog}
          onClose={() => setShowRemoveMemberConfirmDialog(false)}
          onConfirm={confirmRemoveMember}
          onCancel={() => setShowRemoveMemberConfirmDialog(false)}
          title="Remove Member"
          message="Are you sure you want to remove this member from the group?"
          confirmText="Yes, remove member"
          cancelText="No, keep member"
        />
      </div>
    </div>
  );
};

export default GroupsManagement;
