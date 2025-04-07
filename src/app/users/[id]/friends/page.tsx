"use client";
import React from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import Navigation from "@/components/ui/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { Button } from "@/components/ui/button";
import { User } from "@/app/types/user";
// TODO: create handleUserInspection & Search for user and add user with Modal pop-up or Add button?

const Friends: React.FC = () => {
  const { id } = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();

  // Mock objects
  const friendList: User[] = [
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
  const handleAddFriend = () => {
    // if user not already in friendlist
    // add user
    router.push("/");
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
        {/* TODO: overlay */}
        {/* Search bar Start */}
        <div className="flex w-full max-w-sm items-center space-x-2">
          {/* TODO: increase text size and bold, corner radius */}
          <Command className="rounded-lg border shadow-md md:min-w-[450px]">
            <CommandInput placeholder="Type a command or search..." />
            <CommandList>
              <CommandEmpty>No users found.</CommandEmpty>
              {mockUsers.map((user) => (
                <CommandItem key={user.username} onClick={handleAddFriend}>
                  <span>{user.username}</span>
                </CommandItem>
              ))}
              <CommandSeparator />
            </CommandList>
          </Command>
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
              className={`px-4 py-2 rounded-full border ${"bg-[#CCD0FF]  text-white"}`}
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
        </div>
      </div>
    </div>
  );
};

export default Friends;
