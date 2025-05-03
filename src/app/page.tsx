"use client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Image from "next/image";
import React from "react";

const LandingPage = () => {
  const router = useRouter();

  // Auth navigation
  const handleLogin = () => {
    router.push("/login");
  };

  const handleSignUp = () => {
    router.push("/register");
  };

  // Scroll to features section
  const scrollToFeatures = () => {
    document.getElementById("features-section")?.scrollIntoView({
      behavior: "smooth",
    });
  };

  // CTA actions
  const handleGetStarted = () => {
    router.push("/register");
  };

  return (
    <div className="bg-[#ebefff] min-h-screen text-[#3b3e88] flex flex-col">
      {/* Header */}
      <header className="p-6 flex justify-between items-center">
        <div className="flex items-center mb-12">
          <div
            className="absolute top-4 left-4 flex items-center space-x-2 cursor-pointer"
            onClick={() => router.push("/")}
          >
            <Image src="/Projector.png" alt="App Icon" width={50} height={50} />
            <div className="ml-4 font-semibold text-[#3b3e88] text-xl">
              Movie Night
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="ghost"
            className="text-[#3b3e88] hover:bg-[#3b3e88]/10"
            onClick={handleLogin}
          >
            Login
          </Button>
          <Button
            className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white"
            onClick={handleSignUp}
          >
            Sign Up
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row items-center justify-center px-6 md:px-12 lg:px-24 py-12 gap-8 md:gap-12">
        <div className="md:w-1/2 space-y-6 text-center md:text-left">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-[#3b3e88]">
            No More Movie Night
            <span className="block text-rose-500">Debates</span>
          </h2>
          <p className="text-lg md:text-xl text-[#b9c0de] max-w-lg">
            Plan the perfect movie night with friends, without the endless
            &#34;what should we watch?&#34; back-and-forth.
          </p>
          <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
            <Button
              className="bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 text-white text-lg h-12 px-8"
              onClick={handleSignUp}
            >
              Get Started
            </Button>
            <Button
              variant="outline"
              className="border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 text-lg h-12 px-8"
              onClick={scrollToFeatures}
            >
              How It Works
            </Button>
          </div>
        </div>

        {/* Visuals */}
        <div className="md:w-1/2 relative">
          <div className="w-full h-64 md:h-96 bg-white rounded-3xl overflow-hidden shadow-xl relative">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-rose-500 rounded-2xl transform rotate-12 opacity-30 blur-xl">
            </div>
            <div className="absolute bottom-8 -left-8 w-32 h-32 bg-orange-500 rounded-full opacity-30 blur-xl">
            </div>

            {/* Movie cards floating */}
            <div className="absolute top-1/4 left-1/4 w-32 h-48 bg-white rounded-xl shadow-lg transform -rotate-6">
              <div className="w-full h-2/3 bg-[#3b3e88]/20 rounded-t-xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-[#3b3e88]/60 to-[#3b3e88]/80">
                </div>
              </div>
              <div className="p-2">
                <div className="h-3 w-3/4 bg-[#b9c0de] rounded-full mb-2"></div>
                <div className="h-2 w-1/2 bg-[#b9c0de] rounded-full"></div>
              </div>
            </div>

            <div className="absolute top-1/3 right-1/4 w-32 h-48 bg-white rounded-xl shadow-lg transform rotate-12">
              <div className="w-full h-2/3 bg-rose-400/20 rounded-t-xl overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-rose-500/60 to-rose-500/80">
                </div>
              </div>
              <div className="p-2">
                <div className="h-3 w-3/4 bg-[#b9c0de] rounded-full mb-2"></div>
                <div className="h-2 w-1/2 bg-[#b9c0de] rounded-full"></div>
              </div>
            </div>

            {/* Voting UI */}
            <div className="absolute bottom-10 right-10 w-48 bg-white/80 backdrop-blur-md rounded-xl p-3 border border-[#3b3e88]/10 shadow-lg">
              <div className="flex justify-between items-center mb-2">
                <div className="h-3 w-20 bg-[#b9c0de] rounded-full"></div>
                <div className="h-5 w-5 bg-orange-500 rounded-full"></div>
              </div>
              <div className="space-y-2">
                <div className="h-6 w-full bg-[#b9c0de]/30 rounded-lg"></div>
                <div className="h-6 w-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-lg">
                </div>
                <div className="h-6 w-full bg-[#b9c0de]/30 rounded-lg"></div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section
        id="features-section"
        className="bg-white py-16 px-6 md:px-12 lg:px-24"
      >
        <h3 className="text-2xl md:text-3xl font-bold text-center mb-12 text-[#3b3e88]">
          How it works
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#ebefff] rounded-2xl p-6 border border-[#3b3e88]/10 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                >
                </path>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-[#3b3e88]">
              Create Your Watchlist
            </h4>
            <p className="text-[#b9c0de]">
              Build your personal watchlist of movies you&#39;re dying to see.
              Search the vast library or browse by genre.
            </p>
          </div>

          <div className="bg-[#ebefff] rounded-2xl p-6 border border-[#3b3e88]/10 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-rose-400 to-rose-500 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
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
                >
                </path>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-[#3b3e88]">
              Form Movie Crews
            </h4>
            <p className="text-[#b9c0de]">
              Create groups with friends and easily schedule movie nights
              together. Invite anyone with just a username.
            </p>
          </div>

          <div className="bg-[#ebefff] rounded-2xl p-6 border border-[#3b3e88]/10 shadow-lg">
            <div className="w-12 h-12 bg-gradient-to-r from-[#3b3e88] to-indigo-600 rounded-full flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                >
                </path>
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 text-[#3b3e88]">
              Vote & Enjoy
            </h4>
            <p className="text-[#b9c0de]">
              Everyone contributes movie suggestions and votes on their
              favorites. Our algorithm selects the winner - no more debating!
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 md:px-12 lg:px-24 text-center">
        <div className="bg-gradient-to-r from-orange-400 to-orange-500 rounded-3xl p-12 shadow-lg text-white">
          <h3 className="text-2xl md:text-3xl font-bold mb-6">
            Ready to transform movie night?
          </h3>
          <p className="text-white/90 max-w-2xl mx-auto mb-8">
            Join thousands of movie lovers who have simplified their movie
            nights. Sign up today and make your next movie night drama-free
            (except for the movies themselves).
          </p>
          <Button
            className="bg-white text-orange-500 hover:bg-white/90 text-lg h-12 px-8 rounded-2xl"
            onClick={handleGetStarted}
          >
            Get Started Now
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-8 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="bg-gradient-to-r from-orange-400 to-orange-500 p-1 rounded">
              <svg
                className="w-4 h-4 text-white"
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
                >
                </path>
              </svg>
            </div>
            <span className="text-sm font-medium text-[#3b3e88]">
              Movie Night Planner{" "}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
