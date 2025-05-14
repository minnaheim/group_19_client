"use client";

import React, { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Film,
  Home,
  ListChecks,
  LogOut,
  Menu,
  Search,
  User,
  Users,
  X,
} from "lucide-react";
import { ApiService } from "@/app/api/apiService";

// Define all navigation item configurations with Lucide icons
const NAV_ITEMS = [
  {
    id: "Dashboard",
    icon: Home,
    path: (userId: string) => `/users/${userId}/dashboard`,
  },
  {
    id: "Profile Page",
    icon: User,
    path: (userId: string) => `/users/${userId}/profile`,
  },
  {
    id: "Watch List",
    icon: ListChecks,
    path: (userId: string) => `/users/${userId}/watchlist`,
  },
  {
    id: "Movie Groups",
    icon: Film,
    path: (userId: string) => `/users/${userId}/groups`,
  },
  {
    id: "Search Movies",
    icon: Search,
    path: (userId: string) => `/users/${userId}/movie_search`,
  },
  {
    id: "Your Friends",
    icon: Users,
    path: (userId: string) => `/users/${userId}/friends`,
  },
];

type NavItemProps = {
  id: string;
  Icon: React.ElementType;
  active: boolean;
  href: string;
};

type NavigationProps = {
  userId: string;
  activeItem?: string;
};

const NavItem = ({ id, Icon, active, href }: NavItemProps) => {
  return (
    <Link href={href} className="block">
      <div className="flex items-center gap-2.5 relative cursor-pointer">
        <Icon
          size={20}
          stroke={active ? "#1657FF" : "#3b3e88"}
          className={active ? "text-[#1657FF]" : "text-[#3b3e88]"}
        />
        <div
          className={`font-normal text-[15px] tracking-wide ${
            active ? "text-[#1657ff]" : "text-[#3b3e88]"
          }`}
        >
          {id}
        </div>
        {active && (
          <div className="absolute right-0 w-1 h-6 bg-[#1657ff] rounded-full shadow-[-2px_0px_10px_2px_#0038ff26]" />
        )}
      </div>
    </Link>
  );
};

const Navigation = ({ userId, activeItem = "Dashboard" }: NavigationProps) => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const apiService = new ApiService();

  usePathname();

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      await apiService.post("/logout", {});
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
    
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:block w-72 bg-[#ffffffcc] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)_brightness(100%)]">
        <div className="p-6">
          <div className="flex items-center mb-12">
            <div
              className="absolute top-4 left-4 flex items-center space-x-2 cursor-pointer"
              onClick={() => router.push(`/users/${userId}/dashboard`)}
            >
              <Image
                src="/Projector.png"
                alt="App Icon"
                width={50}
                height={50}
              />
              <div className="ml-4 font-semibold text-[#3b3e88] text-xl">
                Movie Night Planner
              </div>
            </div>
          </div>
          {/* Navigation menu */}
          <div className="pt-5">
            <nav className="flex flex-col space-y-8">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  Icon={item.icon}
                  active={item.id === activeItem}
                  href={item.path(userId)}
                />
              ))}

              {/* Logout Button */}
              <div
                className="flex items-center gap-2.5 relative cursor-pointer mt-auto"
                onClick={handleLogout}
              >
                <LogOut 
                  size={20} 
                  stroke={isLoggingOut ? "#1657FF" : "#3b3e88"}
                  className={`text-[${isLoggingOut ? "#1657FF" : "#3b3e88"}]`}
                />
                <div className="font-normal text-[15px] tracking-wide text-[#3b3e88]">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-gray-200 shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div
            className="flex items-center"
            onClick={() => router.push(`/users/${userId}/dashboard`)}
          >
            <Image src="/Projector.png" alt="App Icon" width={30} height={30} />
            <div className="ml-2 font-semibold text-[#3b3e88] text-lg">
              Movie Night Planner
            </div>
          </div>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen
              ? <X size={24} className="text-[#3b3e88]" />
              : <Menu size={24} className="text-[#3b3e88]" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-out Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-16 left-0 right-0 z-50 bg-white shadow-md h-screen">
          <div className="p-6">
            <nav className="flex flex-col space-y-6">
              {NAV_ITEMS.map((item) => (
                <NavItem
                  key={item.id}
                  id={item.id}
                  Icon={item.icon}
                  active={item.id === activeItem}
                  href={item.path(userId)}
                />
              ))}

              {/* Logout Button */}
              <div
                className="flex items-center gap-2.5 relative cursor-pointer"
                onClick={handleLogout}
              >
                <LogOut 
                  size={20} 
                  stroke={isLoggingOut ? "#1657FF" : "#3b3e88"}
                  className={`text-[${isLoggingOut ? "#1657FF" : "#3b3e88"}]`}
                />
                <div className="font-normal text-[15px] tracking-wide text-[#3b3e88]">
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
      {/* TODO: change this, its brittle */}
      <br></br>
      <br></br>
      <br></br>
    </>
  );
};

export default Navigation;
