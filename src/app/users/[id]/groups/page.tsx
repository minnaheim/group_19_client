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

interface Group {
  groupId: number;
  name: string;
  description: string;
  creator: User;
  members: User[];
  createdAt: string;
  moviePool: Movie[];
}

interface GroupInvitation {
  id: number;
  sender: User;
  receiver: User;
  group: Group;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  createdAt: string;
}

/*
interface UserSearchResponse {
    userId: number;
    username: string;
}
*/

const GroupsManagement: React.FC = () => {
  const { id } = useParams();
  const apiService = useApi();
  const router = useRouter();

  const [groups, setGroups] = useState<Group[]>([]);
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
  const [newGroupDescription, setNewGroupDescription] = useState<string>("");
  const [isSubmittingGroup, setIsSubmittingGroup] = useState<boolean>(false);

  // Member invitation dialog
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState<boolean>(false);
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [inviteUsername, setInviteUsername] = useState<string>("");
  const [isSubmittingInvite, setIsSubmittingInvite] = useState<boolean>(false);

  // Group detail dialog
  const [isGroupDetailDialogOpen, setIsGroupDetailDialogOpen] =
    useState<boolean>(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);

  // Search functionality
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredGroups, setFilteredGroups] = useState<Group[]>([]);

  const { value: userId } = useLocalStorage<string>("userId", "");

  // Mock movie data for pools
  const mockMovies: Movie[] = [
    {
      movieId: 1,
      title: "To All the Boys I've Loved Before",
      posterURL:
        "https://image.tmdb.org/t/p/w500/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
      description:
        "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
      genres: ["Teen Romance", "Comedy", "Drama"],
      directors: ["Susan Johnson"],
      actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
      trailerURL: "https://www.example.com/to-all-the-boys",
      year: 2018,
      originallanguage: "English",
    },
    {
      movieId: 2,
      title: "The Kissing Booth",
      posterURL:
        "https://image.tmdb.org/t/p/w500/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
      description:
        "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
      genres: ["Teen Romance", "Comedy"],
      directors: ["Vince Marcello"],
      actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
      trailerURL: "https://www.example.com/kissing-booth",
      year: 2018,
      originallanguage: "English",
    },
    {
      movieId: 301,
      title: "Dune: Part Two",
      posterURL:
        "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genres: ["Science Fiction", "Adventure", "Action"],
      directors: ["Denis Villeneuve"],
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
      year: 2024,
      originallanguage: "English",
    },
    {
      movieId: 300,
      title: "Oppenheimer",
      posterURL:
        "https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genres: ["Drama", "Biography", "History"],
      directors: ["Christopher Nolan"],
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 3,
      title: "Poor Things",
      posterURL:
        "https://image.tmdb.org/t/p/w500/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      description:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genres: ["Science Fiction", "Comedy", "Drama"],
      directors: ["Yorgos Lanthimos"],
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
      year: 2023,
      originallanguage: "English",
    },
  ];

  // Fetch groups data
  useEffect(() => {
    const fetchGroupsData = async () => {
      if (!id) return;

      try {
        setLoading(true);

        try {
          // This would be the actual API call
          // const groupsData = await apiService.get<Group[]>('/groups');
          // setGroups(groupsData);

          // Get received group invitations
          // const receivedInvitationsData = await apiService.get<GroupInvitation[]>('/groups/invitations/received');
          // setReceivedInvitations(receivedInvitationsData);

          // Get sent group invitations
          // const sentInvitationsData = await apiService.get<GroupInvitation[]>('/groups/invitations/sent');
          // setSentInvitations(sentInvitationsData);

          // Mock data for testing
          const mockUsers: User[] = [
            {
              userId: 2,
              username: "alex.np",
              email: "alex@example.com",
              bio: "Horror fan with a passion for classic slasher films and psychological thrillers. Always looking for the next scare!",
              favoriteGenres: ["Horror", "Thriller", "Mystery"],
              favoriteMovie: mockMovies[0],
              watchlist: [mockMovies[0], mockMovies[1]],
              password: "",
              watchedMovies: [],
            },
            {
              userId: 3,
              username: "cinematic_soul",
              email: "cinematic@example.com",
              bio: "Finding meaning through cinema since 1995.",
              favoriteGenres: ["Drama", "Independent", "Foreign"],
              favoriteMovie: mockMovies[2],
              watchlist: [mockMovies[2], mockMovies[3]],
              password: "",
              watchedMovies: [],
            },
            {
              userId: 4,
              username: "film_buff",
              email: "buff@movies.com",
              bio: "Movie enthusiast with a passion for classics.",
              favoriteGenres: ["Drama", "Classic", "Film Noir"],
              favoriteMovie: mockMovies[3],
              watchlist: [mockMovies[3], mockMovies[4]],
              password: "",
              watchedMovies: [],
            },
          ];

          const currentUser: User = {
            password: "",
            watchedMovies: [],
            userId: parseInt(id as string),
            username: "current_user",
            email: "user@example.com",
            bio: "Movie lover",
            favoriteGenres: ["Action", "Comedy"],
            favoriteMovie: mockMovies[0],
            watchlist: [mockMovies[0], mockMovies[1]],
          };

          const mockGroups: Group[] = [
            {
              groupId: 1,
              name: "Weekend Movie Club",
              description: "We watch movies every weekend and discuss them!",
              creator: currentUser,
              members: [currentUser, mockUsers[0], mockUsers[1]],
              createdAt: new Date(
                Date.now() - 30 * 24 * 60 * 60 * 1000
              ).toISOString(),
              moviePool: [mockMovies[0], mockMovies[1], mockMovies[2]],
            },
            {
              groupId: 2,
              name: "Sci-Fi Enthusiasts",
              description: "Only the best science fiction films!",
              creator: mockUsers[1],
              members: [currentUser, mockUsers[1], mockUsers[2]],
              createdAt: new Date(
                Date.now() - 60 * 24 * 60 * 60 * 1000
              ).toISOString(),
              moviePool: [mockMovies[2], mockMovies[4]],
            },
            {
              groupId: 3,
              name: "Oscar Winners Club",
              description: "We watch and rate Oscar-winning movies",
              creator: mockUsers[0],
              members: [currentUser, mockUsers[0]],
              createdAt: new Date(
                Date.now() - 15 * 24 * 60 * 60 * 1000
              ).toISOString(),
              moviePool: [mockMovies[3], mockMovies[4]],
            },
          ];

          // Sort groups alphabetically
          setGroups(mockGroups.sort((a, b) => a.name.localeCompare(b.name)));

          setReceivedInvitations([
            {
              id: 1,
              sender: mockUsers[2],
              receiver: currentUser,
              group: {
                groupId: 4,
                name: "Cinema Classics",
                description: "Appreciating the golden age of cinema",
                creator: mockUsers[2],
                members: [mockUsers[2]],
                createdAt: new Date().toISOString(),
                moviePool: [],
              },
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ]);

          setSentInvitations([
            {
              id: 2,
              sender: currentUser,
              receiver: mockUsers[2],
              group: mockGroups[0],
              status: "PENDING",
              createdAt: new Date().toISOString(),
            },
          ]);
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
  }, [id, apiService]);

  // Filter groups based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredGroups(groups);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = groups.filter(
      (group) =>
        group.name.toLowerCase().includes(query) ||
        (group.description && group.description.toLowerCase().includes(query))
    );

    setFilteredGroups(filtered);
  }, [searchQuery, groups]);

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
      // This would be the actual API call
      // const createdGroup = await apiService.post('/groups', {
      //   name: newGroupName,
      //   description: newGroupDescription
      // });

      // For mock purposes, create a new group
      const newGroup: Group = {
        groupId: groups.length + 4, // Just for mock ID
        name: newGroupName,
        description: newGroupDescription,
        creator: {
          userId: parseInt(id as string),
          username: "current_user",
        } as User,
        members: [
          {
            userId: parseInt(id as string),
            username: "current_user",
          } as User,
        ],
        createdAt: new Date().toISOString(),
        moviePool: [],
      };

      // Update groups list
      const updatedGroups = [...groups, newGroup];
      setGroups(updatedGroups.sort((a, b) => a.name.localeCompare(b.name)));

      showMessage(`Group "${newGroupName}" created successfully`);
      setNewGroupName("");
      setNewGroupDescription("");
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
      // This would be the actual API call
      // First, find the receiverId based on username
      // const searchResults = await apiService.get<UserSearchResponse[]>(
      //    `/friends/search?username=${encodeURIComponent(inviteUsername)}`
      // );

      // if (!searchResults || searchResults.length === 0) {
      //    showMessage(`Could not find user with username ${inviteUsername}`);
      //    setIsSubmittingInvite(false);
      //    return;
      // }

      // const receiverId = searchResults[0].userId;
      // await apiService.post(`/groups/invitations/send/${selectedGroupId}/${receiverId}`, {});

      // For mock purposes
      const mockReceiverId = 4; // Just for mock

      const updatedSentInvitations = [
        ...sentInvitations,
        {
          id: sentInvitations.length + 3,
          sender: {
            userId: parseInt(id as string),
            username: "current_user",
          } as User,
          receiver: {
            userId: mockReceiverId,
            username: inviteUsername,
          } as User,
          group: groups.find((g) => g.groupId === selectedGroupId) as Group,
          status: "PENDING" as "PENDING" | "ACCEPTED" | "REJECTED",
          createdAt: new Date().toISOString(),
        },
      ];

      setSentInvitations(updatedSentInvitations);

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
      // This would be the actual API call
      // await apiService.post(`/groups/invitations/${invitationId}/accept`, {});

      const invitation = receivedInvitations.find(
        (inv) => inv.id === invitationId
      );
      if (!invitation) return;

      // Add group to user's groups
      const updatedGroups = [...groups, invitation.group];
      setGroups(updatedGroups.sort((a, b) => a.name.localeCompare(b.name)));

      // Remove invitation from received invitations
      const updatedInvitations = receivedInvitations.filter(
        (inv) => inv.id !== invitationId
      );
      setReceivedInvitations(updatedInvitations);

      showMessage("Group invitation accepted");
    } catch (error) {
      console.error("Error accepting invitation:", error);
      showMessage("Failed to accept invitation");
    }
  };

  // Handle rejecting a group invitation
  const handleRejectInvitation = async (invitationId: number) => {
    try {
      // This would be the actual API call
      // await apiService.post(`/groups/invitations/${invitationId}/reject`, {});

      // Remove invitation from received invitations
      const updatedInvitations = receivedInvitations.filter(
        (inv) => inv.id !== invitationId
      );
      setReceivedInvitations(updatedInvitations);

      showMessage("Group invitation rejected");
    } catch (error) {
      console.error("Error rejecting invitation:", error);
      showMessage("Failed to reject invitation");
    }
  };

  // Handle canceling a sent group invitation
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      // This would be the actual API call
      // await apiService.delete(`/groups/invitations/${invitationId}`);

      // Remove invitation from sent invitations
      const updatedInvitations = sentInvitations.filter(
        (inv) => inv.id !== invitationId
      );
      setSentInvitations(updatedInvitations);

      showMessage("Invitation canceled");
    } catch (error) {
      console.error("Error canceling invitation:", error);
      showMessage("Failed to cancel invitation");
    }
  };

  // Handle leaving a group
  const handleLeaveGroup = async (groupId: number) => {
    try {
      // This would be the actual API call if needed
      // For now, just remove from the local state
      const updatedGroups = groups.filter((group) => group.groupId !== groupId);
      setGroups(updatedGroups);

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
  const openGroupDetails = (group: Group) => {
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

  const displayGroups = searchQuery ? filteredGroups : groups;

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem="Movie Groups" />

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
              <span className="absolute top-2 right-2 w-5 h-5 bg-rose-500 text-white text-xs flex items-center justify-center rounded-full">
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
                          {group.name}
                        </h3>
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                          {group.members.length}{" "}
                          {group.members.length === 1 ? "member" : "members"}
                        </span>
                      </div>

                      {group.description && (
                        <p className="text-[#838bad] text-sm mb-3">
                          {group.description}
                        </p>
                      )}

                      {/* Movie pool preview */}
                      {group.moviePool && group.moviePool.length > 0 ? (
                        <div className="mb-4">
                          <p className="text-xs text-[#3b3e88]/60 mb-2">
                            Movie Pool ({group.moviePool.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {group.moviePool.slice(0, 4).map((movie) => (
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
                            {group.moviePool.length > 4 && (
                              <div className="w-10 h-14 bg-indigo-100 flex-shrink-0 flex items-center justify-center rounded">
                                <span className="text-xs font-medium text-indigo-700">
                                  +{group.moviePool.length - 4}
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
                          Created{" "}
                          {new Date(group.createdAt).toLocaleDateString()}
                        </span>
                        <span>
                          {group.creator.username === "current_user"
                            ? "Created by you"
                            : `Created by ${group.creator.username}`}
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
                      className="rounded-xl  border-violet-600 text-[#3b3e88]"
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
                          {invitation.group.name}
                        </h4>
                        <p className="text-[#b9c0de] text-xs mb-1">
                          Invited by {invitation.sender.username} on{" "}
                          {new Date(invitation.createdAt).toLocaleDateString()}
                        </p>
                        {invitation.group.description && (
                          <p className="text-[#838bad] text-xs italic mb-2">
                            &#34;{invitation.group.description}&#34;
                          </p>
                        )}
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
                          className=" border-violet-600 text-[#3b3e88] hover:bg-[#3b3e88]/10 text-xs h-8 rounded-xl flex-1"
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
                          {invitation.group.name}
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
                <div className="space-y-2">
                  <Label htmlFor="group-description" className="text-[#3b3e88]">
                    Description (Optional)
                  </Label>
                  <Input
                    id="group-description"
                    value={newGroupDescription}
                    onChange={(e) => setNewGroupDescription(e.target.value)}
                    placeholder="What kind of movies does your group watch?"
                    className="rounded-xl"
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
                    {selectedGroup.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  {selectedGroup.description && (
                    <p className="text-[#838bad] mb-4">
                      {selectedGroup.description}
                    </p>
                  )}

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
                            {selectedGroup.creator.username}{" "}
                            {selectedGroup.creator.userId ===
                              parseInt(id as string) && "(You)"}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#838bad] text-sm">
                            Created on:
                          </span>
                          <p className="text-[#3b3e88]">
                            {new Date(
                              selectedGroup.createdAt
                            ).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <span className="text-[#838bad] text-sm">
                            Members ({selectedGroup.members.length}):
                          </span>
                          <p className="text-[#3b3e88]">
                            {formatMembersList(selectedGroup.members)}
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

                          {selectedGroup.creator.userId !==
                            parseInt(id as string) && (
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
                      {selectedGroup.moviePool &&
                      selectedGroup.moviePool.length > 0 ? (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                          {selectedGroup.moviePool.map((movie) => (
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
};

export default GroupsManagement;
