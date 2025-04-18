"use client";

import React from "react";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Film, Home, ListChecks, Search, User, Users, LogOut } from "lucide-react";

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
              stroke={active ? "#1657FF" : "#B9C0DE"}
              className={active ? "text-[#1657FF]" : "text-[#B9C0DE]"}
          />
          <div
              className={`font-normal text-[15px] tracking-wide ${
                  active ? "text-[#1657ff]" : "text-[#b9c0de]"
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
  // Use pathname from next/navigation
  usePathname();

  const handleLogout = async () => {
    try {
      // Clear token from localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('userId');

      // Optional: Make a call to the backend to invalidate the token
      // const response = await fetch('http://your-backend-url/users/logout', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`
      //   }
      // });

      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
      <div className="w-full md:w-72 bg-[#ffffffcc] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)_brightness(100%)]">
        <div className="p-6">
          <div className="flex items-center mb-12">
            <div
                className="absolute top-4 left-4 flex items-center space-x-2 cursor-pointer"
                onClick={() => router.push("/")}
            >
              <Image src="/projector.png" alt="App Icon" width={50} height={50} />
              <div className="ml-4 font-semibold text-[#3b3e88] text-xl">
                Movie Night
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
                    stroke="#B9C0DE"
                    className="text-[#B9C0DE]"
                />
                <div className="font-normal text-[15px] tracking-wide text-[#b9c0de]">
                  Logout
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>
  );
};

export default Navigation;