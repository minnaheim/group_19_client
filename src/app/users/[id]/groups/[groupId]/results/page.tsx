"use client";

import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import MovieCard from "@/components/ui/Movie_card";
import { useRouter } from "next/navigation";

interface MoviePoolEntry {
  userId: number;
  movie: Movie;
}

const mockMoviePool: MoviePoolEntry[] = [
  {
    userId: 2,
    movie: {
      movieId: 3,
      title: "Dune: Part Two",
      posterURL:
        "https://image.tmdb.org/t/p/w500/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genres: ["Science Fiction"],
      directors: ["Denis Villeneuve"],
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
      year: 2023,
      originallanguage: "English",
    },
  },
];

const Results: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const winner = mockMoviePool[0].movie; // Mock winner
  const averageRank = 1.25; // Mock average rank

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem=" Movie Groups" />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">Results</h1>
        </div>

        {/* Winner Section */}
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
            And the winner is ...
          </h2>
          <div className="relative w-[200px] h-[300px] md:w-[250px] md:h-[375px] rounded-lg shadow-lg overflow-hidden">
            <img
              src={winner.posterURL}
              alt={winner.title}
              className="w-full h-full object-cover"
            />
          </div>
          <h2 className="font-semibold text-[#3b3e88] text-xl mt-4">
            {winner.title}
          </h2>
          <p className="text-[#b9c0de] text-lg mt-2">
            ... with an average rank of {averageRank}!
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="destructive"
            onClick={() => router.push(`/users/${userId}/dashboard`)}
          >
            Back
          </Button>
          <Button onClick={() => router.push(`/users/${userId}/dashboard`)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
