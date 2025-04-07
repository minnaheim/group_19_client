"use client";
import React, { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import Navigation from "@/components/ui/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { User } from "@/app/types/user";
import UserDetailsModal from "@/components/ui/movie_details";
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
  const [friendList, setFriendList] = useState<User[]>([
    {
      id: 3,
      username: "Alice",
      email: "Alice@example.com",
      password: "mypassword",
      bio: "Drama and biopic lover.",
      favoriteGenres: ["Drama", "Biography", "Action"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
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

  const closeModal = () => {
    setIsModalOpen(false);
  };
  const handleUserClick = async (user: User) => {
    console.log("User clicked:", user);
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };

  const handleSubmit = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault;

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

  // Mock objects
  const mockUsers: User[] = [
    {
      id: 1,
      username: "ben",
      email: "ben@example.com",
      password: "password123",
      bio: "I love action movies!",
      favoriteGenres: ["Action", "Thriller"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 2,
      username: "julian_2000",
      email: "julian@example.com",
      password: "securepassword",
      bio: "Sci-fi enthusiast.",
      favoriteGenres: ["Sci-Fi", "Adventure"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 3,
      username: "forrest",
      email: "forrest@example.com",
      password: "mypassword",
      bio: "Drama and biopic lover.",
      favoriteGenres: ["Drama", "Biography"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 3,
      username: "Alice",
      email: "Alice@example.com",
      password: "mypassword",
      bio: "Drama and biopic lover.",
      favoriteGenres: ["Drama", "Biography", "Action"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
    {
      id: 3,
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
      id: 3,
      username: "momo",
      email: "mohammed@example.com",
      password: "mypassword",
      bio: "I <3 romance!",
      favoriteGenres: ["Romance"],
      favoriteMovie: [],
      watchlist: [],
      watchedMovies: [],
    },
  ];
  const handleAddFriend = async (user: User) => {
    if (!isInFriendslist(user)) {
      // mock for now create put request
      setFriendList((prevList) => [...prevList, user]);
      // const response = await apiService.post<User>(`friends/add/${id}`, user);
      console.log("Friend added:", user);
    } else {
      console.log("User is already in the friend list");
    }
  };

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
            type="usernameInput"
            value={inputValue}
            onChange={handleInputChange}
            className="bg-white font-bold text-[#3b3e88] rounded-3xl"
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
            <>
              {console.log("Modal is rendering for:", selectedUser)}
              <UserDetailsModal
                user={selectedUser}
                isOpen={isModalOpen}
                onClose={closeModal}
                isInFriendslist={isInFriendslist(selectedUser)}
                // onAddToFriendslist={handleAddFriend()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Friends;
