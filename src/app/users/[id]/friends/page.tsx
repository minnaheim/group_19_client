"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/ui/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { User } from "@/app/types/user";
import UserDetailsModal from "@/components/ui/user_details";
import { useApi } from "@/app/hooks/useApi";
import ActionMessage from "@/components/ui/action_message";

const Friends: React.FC = () => {
  const { id } = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const apiService = useApi();

  // user inspection
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState("");

  // action feedback
  const [actionMessage, setActionMessage] = useState<string>("");
  const [showActionMessage, setShowActionMessage] = useState<boolean>(false);

  // friend lists
  const [friendList, setFriendList] = useState<User[]>([]);
  const [pendingList, setPendingList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // mock data for testing
  const mockFriends: User[] = [
    {
      userId: 3,
      username: "Alice",
      email: "Alice@example.com",
      password: "mypassword",
      bio: "Drama and biopic lover.",
      favoriteGenres: ["Drama", "Biography", "Action"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [
        {
          movieId: 6,
          title: "The Whale",
          posterURL: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
          description:
              "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
          genres: ["Drama"],
          directors: ["Darren Aronofsky"],
          actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
          trailerURL: "https://www.example.com/the-whale",
          year: 2022,
          originallanguage: "English",
        },
        {
          movieId: 7,
          title: "Top Gun: Maverick",
          posterURL: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
          description:
              "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
          genres: ["Action", "Drama"],
          directors: ["Joseph Kosinski"],
          actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
          trailerURL: "https://www.example.com/top-gun-maverick",
          year: 2022,
          originallanguage: "English",
        },
      ],
      watchedMovies: [
        {
          movieId: 5,
          title: "The Batman",
          posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
          description:
              "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
          genres: ["Action", "Crime", "Drama"],
          directors: ["Matt Reeves"],
          actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
          trailerURL: "https://www.example.com/the-batman",
          year: 2022,
          originallanguage: "English",
        },
      ],
    },
    {
      userId: 4,
      username: "bobbb",
      email: "bobert@example.com",
      password: "mypassword",
      bio: "Hey there!",
      favoriteGenres: ["Whodunit", "Action"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [],
      watchedMovies: [],
    },
    {
      userId: 5,
      username: "momo",
      email: "mohammed@example.com",
      password: "mypassword",
      bio: "I <3 romance!",
      favoriteGenres: ["Romance"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [],
      watchedMovies: [],
    },
  ];

  const mockPendingFriends: User[] = [
    {
      userId: 6,
      username: "ana",
      email: "ana@example.com",
      password: "mypassword",
      bio: "heyyy",
      favoriteGenres: ["Action"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [],
      watchedMovies: [],
    },
    {
      userId: 7,
      username: "robert",
      email: "robert@example.com",
      password: "mypassword",
      bio: "I love movies",
      favoriteGenres: ["Whodunit", "Action"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [],
      watchedMovies: [],
    },
    {
      userId: 8,
      username: "hamed",
      email: "mohammed123@example.com",
      password: "mypassword",
      bio: "I <3 romance!",
      favoriteGenres: ["Romance"],
      favoriteMovie: {
        movieId: 5,
        title: "The Batman",
        posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
        description:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
        genres: ["Action", "Crime", "Drama"],
        directors: ["Matt Reeves"],
        actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
        trailerURL: "https://www.example.com/the-batman",
        year: 2022,
        originallanguage: "English",
      },
      watchlist: [],
      watchedMovies: [],
    },
  ];

  // display action message function
  const showMessage = (message: string) => {
    setActionMessage(message);
    setShowActionMessage(true);
    setTimeout(() => {
      setShowActionMessage(false);
    }, 3000);
  };

  // fetch friend data
  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);

      try {
        // try to get friend data from api
        try {
          // According to REST spec: GET /friends/{userId}
          const friendsData = await apiService.get(`/friends/${id}`);
          setFriendList(friendsData as User[]);

          // Pending friends is not in the API spec, so we'll use mock data
          setPendingList(mockPendingFriends);
        } catch (apiError) {
          console.log("API error, using mock data:", apiError);
          // use mock data if api fails
          setFriendList(mockFriends);
          setPendingList(mockPendingFriends);
        }
      } catch (error) {
        showMessage("Failed to load friends data");
        console.error("Error fetching friends:", error);
        // fallback to mock data
        setFriendList(mockFriends);
        setPendingList(mockPendingFriends);
      } finally {
        setLoading(false);
      }
    };

    fetchFriends();
  }, [id, apiService]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedUser(null), 300); // delay to allow animation
  };

  const handleUserClick = (user: User) => {
    console.log("User clicked:", user);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // check for username
    if (!inputValue.trim()) {
      showMessage("Please enter a username");
      return;
    }
    try {
      console.log("Form submitted with input:", inputValue);

      // try to get user by username
      try {
        // According to REST spec: GET /friends?username={username}
        const response = await apiService.get<User>(`/friends?username=${inputValue.trim()}`);
        handleAddFriend(response);
      } catch (apiError) {
        console.error("API error when searching for user:", apiError);
        showMessage("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      showMessage("Error searching for user");
    }
  };

  const isInFriendslist = (user: User): boolean => {
    if (!user) return false; // handle null or undefined user
    return friendList.some((friend) => friend.userId === user.userId);
  };

  const isPendingFriend = (user: User): boolean => {
    if (!user) return false;
    return pendingList.some((friend) => friend.userId === user.userId);
  };

  const handleAddFriend = async (user: User) => {
    // validate user isn't already a friend
    if (isInFriendslist(user)) {
      showMessage(`${user.username} is already your friend`);
      return;
    }

    // validate user isn't already pending
    if (isPendingFriend(user)) {
      showMessage(`Friend request to ${user.username} is already pending`);
      return;
    }

    try {
      // send friend request
      try {
        // According to REST spec: POST /friends/add/{userId}
        await apiService.post(`/friends/add/${id}`, user);
      } catch (apiError) {
        console.error("API error when adding friend:", apiError);
      }

      // update pending list with the new request
      setPendingList([...pendingList, user]);
      showMessage(`Friend request sent to ${user.username}`);
      setInputValue("");
    } catch (error) {
      showMessage("Failed to send friend request");
      console.error("Error adding friend:", error);
    }
  };

  const handleRemoveFriend = async (user: User) => {
    try {
      // remove friend
      try {
        // According to REST spec: DELETE /friends/remove/{userId}
        await apiService.delete(`/friends/remove/${id}`, user);
      } catch (apiError) {
        console.error("API error when removing friend:", apiError);
      }

      // update friend list
      setFriendList(friendList.filter(friend => friend.userId !== user.userId));
      showMessage(`Removed ${user.username} from your friends`);
    } catch (error) {
      showMessage("Failed to remove friend");
      console.error("Error removing friend:", error);
    }
  };

  const handleAcceptFriendRequest = async (user: User) => {
    try {
      // accept friend request (not in API, would need to be added)
      try {
        await apiService.post(`/friends/add/${id}`, user);
      } catch (apiError) {
        console.error("API error when accepting friend request:", apiError);
      }

      // update lists
      setPendingList(pendingList.filter(friend => friend.userId !== user.userId));
      setFriendList([...friendList, user]);
      showMessage(`Accepted friend request from ${user.username}`);
    } catch (error) {
      showMessage("Failed to accept friend request");
      console.error("Error accepting friend request:", error);
    }
  };

  if (loading) {
    return (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
        </div>
    );
  }

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
        {/* sidebar */}
        <Navigation userId={userId} activeItem="Your Friends" />
        {/* main content */}
        <div className="flex-1 p-6 md:p-12">
          <h1 className="font-semibold text-[#3b3e88] text-3xl mb-8">
            Your Friendslist
          </h1>
          <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
            add friends
          </h2>
          {/* search bar start */}
          <div className="flex w-full max-w-sm items-center space-x-2">
            <Input
                type="text"
                value={inputValue}
                onChange={handleInputChange}
                className="bg-white font-bold rounded-3xl"
                placeholder="Find by Username"
            />
            <Button onClick={handleSubmit}>Add</Button>
          </div>
          {/* search bar end */}

          <br></br>
          {/* your friendlist start */}
          <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
            your friends
          </h2>
          <div className="flex flex-wrap gap-2 justify-left">
            {friendList.length > 0 ? (
                friendList.map((friend) => (
                    <button
                        key={friend.username}
                        className="px-4 py-2 rounded-full border bg-[#CCD0FF] text-white"
                        onClick={() => handleUserClick(friend)}
                    >
                      {friend.username}
                    </button>
                ))
            ) : (
                <p className="text-gray-500">You don&#39;t have any friends yet</p>
            )}
          </div>
          {/* your friendlist end */}
          <br></br>
          {/* pending invites start*/}
          <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
            pending invites
          </h2>
          <div className="flex flex-wrap gap-2 justify-left">
            {pendingList.length > 0 ? (
                pendingList.map((friend) => (
                    <button
                        key={friend.username}
                        className="px-4 py-2 rounded-full border bg-[#CCD0FF] text-white"
                        onClick={() => handleUserClick(friend)}
                    >
                      {friend.username}
                    </button>
                ))
            ) : (
                <p className="text-gray-500">No pending friend requests</p>
            )}
          </div>
          {/* pending invites end*/}

          <div className="mt-8 flex justify-between">
            <Button
                variant="destructive"
                onClick={() => router.push(`/users/${id}/dashboard`)}
            >
              back to dashboard
            </Button>
          </div>

          {/* user details modal component */}
          {selectedUser && isModalOpen && (
              <UserDetailsModal
                  user={selectedUser}
                  isOpen={isModalOpen}
                  onClose={closeModal}
                  isInFriendslist={isInFriendslist(selectedUser)}
                  isPending={isPendingFriend(selectedUser)}
                  onAddToFriendslist={handleAddFriend}
                  onRemoveFromFriendslist={handleRemoveFriend}
                  onAcceptFriendRequest={handleAcceptFriendRequest}
              />
          )}

          {/* action message component */}
          <ActionMessage
              message={actionMessage}
              isVisible={showActionMessage}
              onHide={() => setShowActionMessage(false)}
          />
        </div>
      </div>
  );
};

export default Friends;