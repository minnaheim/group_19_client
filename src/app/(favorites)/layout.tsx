"use client";

import React from "react";
import Image from "next/image";
import { FavoritesProvider } from "@/app/context/FavoritesContext";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <FavoritesProvider>
      <div className="bg-[#ebefff] min-h-screen flex flex-col">
        {/* Header with Logo - Optimized padding */}
        <header className="p-3 sm:p-4">
          <div className="flex items-center space-x-2 cursor-pointer">
            <Image
              src="/Projector.png"
              alt="App Icon"
              width={40}
              height={40}
              className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10"
            />
            <div className="ml-2 font-semibold text-[#3b3e88] text-base sm:text-lg">
              Movie Night Planner
            </div>
          </div>
        </header>

        {/* Main Content - Optimized padding */}
        <main className="flex-1 flex items-center justify-center px-4 py-3 sm:py-5">
          <div className="w-full max-w-xs sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl mx-auto">
            {/* Decorative elements - Smaller blur effects */}
            <div className="relative mb-3 hidden sm:block">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500 rounded-full transform rotate-12 opacity-20 blur-xl">
              </div>
              <div className="absolute bottom-8 -left-8 w-28 h-28 bg-orange-500 rounded-full opacity-20 blur-xl">
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-0 relative z-10">
              {/* Decorative top bar */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-rose-500">
              </div>

              <div className="p-5 sm:p-6">
                <div className="text-center mb-4 sm:mb-5">
                  <h2 className="text-2xl font-bold text-[#3b3e88]">
                    Let&apos;s get to know you!
                  </h2>
                  <p className="text-[#3b3e88] mt-1 text-sm">
                    Select your preferences to personalize your movie experience
                  </p>
                </div>

                {children}

                {/* Movie poster decoration - More compact */}
                <div className="mt-4 flex justify-center space-x-2 hidden sm:flex">
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-[#3b3e88]/20 rounded-lg shadow-sm transform -rotate-6">
                  </div>
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-rose-500/20 rounded-lg shadow-sm">
                  </div>
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-orange-500/20 rounded-lg shadow-sm transform rotate-6">
                  </div>
                  <div className="hidden md:block w-7 h-10 sm:w-8 sm:h-12 bg-indigo-500/20 rounded-lg shadow-sm transform -rotate-3">
                  </div>
                  <div className="hidden lg:block w-7 h-10 sm:w-8 sm:h-12 bg-amber-500/20 rounded-lg shadow-sm transform rotate-12">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer - Optimized */}
        <footer className="bg-white py-3 px-4">
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-2">
              <Image
                src="/Projector.png"
                alt="App Icon"
                width={24}
                height={24}
              />
              <span className="text-sm font-medium text-[#3b3e88]">
                Movie Night Planner
              </span>
            </div>
          </div>
        </footer>
      </div>
    </FavoritesProvider>
  );
}
