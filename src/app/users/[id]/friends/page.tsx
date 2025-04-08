"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/ui/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { User } from "@/app/types/user";
import UserDetailsModal from "@/components/ui/user_details";
import { useApi } from "@/app/hooks/useApi";
// TODO: create User Detail Modal -> add remove from UserList to ind. Modal

const Friends: React.FC = () => {
  const { id } = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const apiService = useApi();

  // user inspection
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState("");
  // const friendList = await apiService.get(`/friends/${id}`);
  const [friendList] = useState<User[]>([
    {
      id: 3,
      username: "Alice",
      email: "Alice@example.com",
      password: "mypassword",
      bio: "Drama and biopic lover.",
      favoriteGenres: ["Drama", "Biography", "Action"],
      favoriteMovie: [
        {
          id: 5,
          title: "The Batman",
          posterUrl: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
          details:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
          genre: "Action",
          director: "Matt Reeves",
          actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
          trailerURL: "https://www.example.com/the-batman",
        },
      ],
      watchlist: [
        {
          id: 6,
          title: "The Whale",
          posterUrl: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
          details:
            "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
          genre: "Drama",
          director: "Darren Aronofsky",
          actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
          trailerURL: "https://www.example.com/the-whale",
        },
        {
          id: 7,
          title: "Top Gun: Maverick",
          posterUrl: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
          details:
            "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
          genre: "Action",
          director: "Joseph Kosinski",
          actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
          trailerURL: "https://www.example.com/top-gun-maverick",
        },
      ],
      watchedMovies: [
        {
          id: 5,
          title: "The Batman",
          posterUrl: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
          details:
            "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
          genre: "Action",
          director: "Matt Reeves",
          actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
          trailerURL: "https://www.example.com/the-batman",
        },
      ],
    },
    {
      id: 4,
      username: "bobbb",
      email: "bobert@example.com",
      password: "mypassword",
      bio: "Hey there!",
      favoriteGenres: ["Whodunit", "Action"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 5,
      username: "momo",
      email: "mohammed@example.com",
      password: "mypassword",
      bio: "I <3 romance!",
      favoriteGenres: ["Romance"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
  ]);

  useEffect(() => {
    console.log("Modal state changed:", isModalOpen);
  }, [isModalOpen]);

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedUser(null), 300); // Delay to allow animation
  };

  const handleUserClick = async (user: User) => {
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
      console.log("The Username is not given");
      return;
    }
    try {
      console.log("Form submitted with input:", inputValue);
      const response = await apiService.get<User>(
        `/friends?username=${inputValue.trim()}`
      );
      if (response) {
        console.log("User found:", response);

        // Add the user to the friend list
        handleAddFriend(response);
      } else {
        console.log("User not found");
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    }
  };

  const isInFriendslist = (user: User): boolean => {
    if (!user) return false; // Handle null or undefined user
    return friendList.some((friend) => friend.id === user.id);
  };

  const pendingList: User[] = [
    {
      id: 3,
      username: "ana",
      email: "ana@example.com",
      password: "mypassword",
      bio: "heyyy",
      favoriteGenres: ["Action"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },

    {
      id: 3,
      username: "robert",
      email: "robert@example.com",
      password: "mypassword",
      bio: "I love movies",
      favoriteGenres: ["Whodunit", "Action"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 3,
      username: "hamed",
      email: "mohammed123@example.com",
      password: "mypassword",
      bio: "I <3 romance!",
      favoriteGenres: ["Romance"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
  ];
  // get this from backend: List of All Users (incl. those which are already our friends or have been requested) -> if re-request, then error from backend

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row justify-center min-h-screen w-full">
      {/* Sidebar */}
      <Navigation userId={userId} activeItem="Your Friends" />
      {/* Main content */}
      <div className="flex-1 p-6 md:p-12">
        <h1 className="font-semibold text-[#3b3e88] text-3xl mb-8">
          Your Friendslist
        </h1>
        <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
          add friends
        </h2>
        {/* Search bar Start */}
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Input
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            className="bg-white font-bold rounded-3xl"
            placeholder="Find by Username"
          />
          <Button onClick={handleSubmit}>Add</Button>
          {/* <Button>Add</Button> */}
        </div>
        {/* Search bar End */}

        <br></br>
        {/* Your friendlist start */}
        <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
          your friends
        </h2>
        <div className="flex flex-wrap gap-2 justify-left">
          {friendList.map((friend) => (
            <button
              key={friend.username}
              className="px-4 py-2 rounded-full border bg-[#CCD0FF] text-white"
              onClick={() => handleUserClick(friend)}
            >
              {friend.username}
            </button>
          ))}
        </div>
        {/* Your friendlist end */}
        <br></br>
        {/* Pending Invites start*/}
        <h2 className="font-semibold text-[#3b3e88] text-xl mb-8">
          pending invites
        </h2>
        <div className="flex flex-wrap gap-2 justify-left">
          {pendingList.map((friend) => (
            <button
              key={friend.username}
              className={`px-4 py-2 rounded-full border ${"bg-[#CCD0FF]  text-white"}`}
              onClick={() => handleUserClick(friend)}
            >
              {friend.username}
            </button>
          ))}
        </div>
        {/* Pending Invites end*/}

        <div className="mt-8 flex justify-between">
          <Button
            variant={"destructive"}
            onClick={() => router.push(`/users/${id}/dashboard`)}
          >
            back to dashboard
          </Button>
        </div>
        <div className="mt-8 flex justify-between">
          <Button
            variant={"secondary"}
            onClick={() => router.push(`/users/${id}/watchlist`)}
          >
            View Watchlist
          </Button>

          {/* User Details Modal Component */}
          {selectedUser && isModalOpen && (
            <UserDetailsModal
              user={selectedUser}
              isOpen={isModalOpen}
              onClose={closeModal}
              isInFriendslist={isInFriendslist(selectedUser)} // TODO: check if pending or not
              // onAddToFriendslist={handleAddFriend()}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
