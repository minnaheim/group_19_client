"use client";

import React from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Define all navigation item configurations within the component
const NAV_ITEMS = [
    {
        id: "Dashboard",
        icon: "/secondary-all-games.svg",
        activeIcon: "/secondary-all-games-selected.svg",
        path: (userId: string) => `/users/${userId}/dashboard`
    },
    {
        id: "Profile Page",
        icon: "/live.png",
        activeIcon: "/live_selected.png",
        path: (userId: string) => `/users/${userId}/profile`
    },
    {
        id: "Watch List",
        icon: "/squares.png",
        activeIcon: "/squares_selected.png",
        path: (userId: string) => `/users/${userId}/watchlist`
    },
    {
        id: "Movie Groups",
        icon: "/Video.png",
        activeIcon: "/Video_selected.png",
        path: (userId: string) => `/users/${userId}/movieGroups`
    },
    {
        id: "Search Movies",
        icon: "/Video.png",
        activeIcon: "/Video_selected.png",
        path: (userId: string) => `/users/${userId}/search`
    },
    {
        id: "Your Friends",
        icon: "/squares.png",
        activeIcon: "/squares_selected.png",
        path: (userId: string) => `/users/${userId}/friends`
    }
];

type NavItemProps = {
    id: string;
    icon: string;
    activeIcon: string;
    active: boolean;
    href: string;
};

type NavigationProps = {
    userId: string;
    activeItem?: string;
};

const NavItem = ({ id, icon, activeIcon, active, href }: NavItemProps) => {
    return (
        <Link href={href} className="block">
            <div className="flex items-center gap-2.5 relative cursor-pointer">
                <img className="w-5 h-5" alt={id} src={active ? activeIcon : icon} />
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
    // Use pathname from next/navigation instead of router
    usePathname();
    return (
        <div className="w-full md:w-72 bg-[#ffffffcc] backdrop-blur-2xl [-webkit-backdrop-filter:blur(40px)_brightness(100%)]">
            <div className="p-6">
                <div className="flex items-center mb-12">
                    <div className="absolute top-4 left-4 flex items-center space-x-2">
                        <Image src="/projector.png" alt="App Icon" width={50} height={50} />
                        <div className="ml-4 font-semibold text-[#3b3e88] text-xl">
                            Movie Night
                        </div>
                    </div>
                </div>

                {/* Navigation menu */}
                <nav className="flex flex-col space-y-8">
                    {NAV_ITEMS.map((item) => (
                        <NavItem
                            key={item.id}
                            id={item.id}
                            icon={item.icon}
                            activeIcon={item.activeIcon}
                            active={item.id === activeItem}
                            href={item.path(userId)}
                        />
                    ))}
                </nav>
            </div>
        </div>
    );
};

export default Navigation;