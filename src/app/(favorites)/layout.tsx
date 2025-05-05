"use client";

import React from "react";
import Image from "next/image";
import { FavoritesProvider } from "@/app/context/FavoritesContext";

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <FavoritesProvider>
            <div className="bg-[#ebefff] min-h-screen flex flex-col">
                {/* Header with Logo */}
                <header className="p-4 sm:p-6">
                    <div className="flex items-center space-x-2 cursor-pointer">
                        <Image src="/Projector.png" alt="App Icon" width={40} height={40} className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12" />
                        <div className="ml-2 sm:ml-4 font-semibold text-[#3b3e88] text-base sm:text-lg md:text-xl">
                            Movie Night
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-12">
                    <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto">
                        {/* Decorative elements */}
                        <div className="relative mb-4 sm:mb-6 hidden sm:block">
                            <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-rose-500 rounded-full transform rotate-12 opacity-20 blur-xl"></div>
                            <div className="absolute bottom-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 bg-orange-500 rounded-full opacity-20 blur-xl"></div>
                        </div>

                        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border-0 relative z-10">
                            {/* Decorative top bar */}
                            <div className="h-1 sm:h-2 bg-gradient-to-r from-orange-400 to-rose-500"></div>

                            <div className="p-5 sm:p-6 md:p-8 lg:p-10">
                                <div className="text-center mb-6 sm:mb-8">
                                    <h2 className="text-2xl sm:text-3xl font-bold text-[#3b3e88]">Let&apos;s get to know you!</h2>
                                    <p className="text-[#b9c0de] mt-1 sm:mt-2 text-sm sm:text-base">
                                        Select your preferences to personalize your movie experience
                                    </p>
                                </div>

                                {children}

                                {/* Movie poster decoration */}
                                <div className="mt-6 sm:mt-8 flex justify-center space-x-2 hidden sm:flex">
                                    <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-[#3b3e88]/20 rounded-lg shadow-sm transform -rotate-6"></div>
                                    <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-rose-500/20 rounded-lg shadow-sm"></div>
                                    <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-orange-500/20 rounded-lg shadow-sm transform rotate-6"></div>
                                    <div className="hidden md:block w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-indigo-500/20 rounded-lg shadow-sm transform -rotate-3"></div>
                                    <div className="hidden lg:block w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-amber-500/20 rounded-lg shadow-sm transform rotate-12"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                {/* Footer */}
                <footer className="bg-white py-4 sm:py-6 px-4 sm:px-6 mt-auto">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <div className="flex items-center gap-1 sm:gap-2 mb-2 md:mb-0">
                            <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-1 rounded">
                                <svg
                                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
                                    ></path>
                                </svg>
                            </div>
                            <span className="text-xs sm:text-sm font-medium text-[#3b3e88]">
                Movie Night Planner{" "}
              </span>
                        </div>
                    </div>
                </footer>
            </div>
        </FavoritesProvider>
    );
}