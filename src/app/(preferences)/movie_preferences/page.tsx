"use client";

import { useState } from "react";
import { Movie } from "@/app/types/movie";

const Preferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);

  // simulate movies which we would get from backend
  const mockMovies: Movie[] = [
    {
      id: 1,
      title: "To All the Boys I've Loved Before",
      posterUrl: "/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
      details:
        "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
      genre: "Teen Romance",
      director: "Susan Johnson",
      actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
      trailerURL: "https://www.example.com/to-all-the-boys",
    },
    {
      id: 2,
      title: "The Kissing Booth",
      posterUrl: "/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
      details:
        "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
      genre: "Teen Romance",
      director: "Vince Marcello",
      actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
      trailerURL: "https://www.example.com/kissing-booth",
    },

    {
      id: 35,
      title: "Dune: Part Two",
      posterUrl: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      details:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genre: "Science Fiction",
      director: "Denis Villeneuve",
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
    },
  ];

  // TODO: get overlay type click thingy
  const toggleMovie = (movie: Movie) => {
    setSelectedMovies((prev) => {
      console.log(prev);
      if (prev.includes(movie)) {
        return prev.filter((m) => m !== movie);
      } else {
        // TODO: currently throws error if you click on the same movie twice
        if (prev.length >= 1) {
          throw new Error("You can only select one favorite movie");
        }
        console.log([...prev, movie]);
        return [...prev, movie];
      }
    });
  };

  return (
    <div>
      <h3 className="text-center text-[#3C3F88] mb-6">
        Based on the previous genre you have selected, select one favorite
        movie!
      </h3>
      <div className="flex flex-wrap gap-2 justify-center">
        {mockMovies.map((movie) => (
          <button
            key={movie.title}
            onClick={() => toggleMovie(movie)}
            className={`px-4 py-2 rounded-full border ${
              selectedMovies.includes(movie)
                ? "bg-[#AFB3FF] text-white"
                : "bg-[#CDD1FF]  text-white"
            }`}
          >
            {movie.title}
          </button>
        ))}
      </div>
      <p className="text-center mt-4 text-sm text-[#3C3F88]">
        {selectedMovies.length} movies selected
      </p>
    </div>
  );
};

export default Preferences;
