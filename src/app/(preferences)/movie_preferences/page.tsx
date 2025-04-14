"use client";

import { useState, useEffect } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import SearchBar from "@/components/ui/search_bar";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

const MoviePreferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchCategory, setSearchCategory] = useState<string>("all");
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchResults, setSearchResults] = useState<Movie[]>([]);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();

  // Mock movies for testing
  const mockMovies: Movie[] = [
    {
      movieId: 1,
      title: "To All the Boys I've Loved Before",
      posterURL: "/hKHZhUbIyUAjcSrqJThFGYIR6kI.jpg",
      description:
        "A teenage girl's secret love letters are exposed and wreak havoc on her love life. To save face, she begins a fake relationship with one of the recipients.",
      genres: ["Teen Romance"],
      directors: ["Susan Johnson"],
      actors: ["Lana Condor", "Noah Centineo", "Janel Parrish"],
      trailerURL: "https://www.example.com/to-all-the-boys",
      year: 2002,
      originallanguage: "English",
    },
    {
      movieId: 2,
      title: "The Kissing Booth",
      posterURL: "/7Dktk2ST6aL8h9Oe5rpk903VLhx.jpg",
      description:
        "A high school student finds herself face-to-face with her long-term crush when she signs up to run a kissing booth at the spring carnival.",
      genres: ["Teen Romance"],
      directors: ["Vince Marcello"],
      actors: ["Joey King", "Jacob Elordi", "Joel Courtney"],
      trailerURL: "https://www.example.com/kissing-booth",
      year: 2018,
      originallanguage: "English",
    },
    {
      movieId: 3,
      title: "Dune: Part Two",
      posterURL: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
      description:
        "Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family.",
      genres: ["Science Fiction"],
      directors: ["Denis Villeneuve"],
      actors: ["Timothée Chalamet", "Zendaya", "Rebecca Ferguson"],
      trailerURL: "https://www.example.com/dune-part-two",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 4,
      title: "Oppenheimer",
      posterURL: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genres: ["Drama"],
      directors: ["Christopher Nolan"],
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 5,
      title: "Poor Things",
      posterURL: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      description:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genres: ["Science Fiction"],
      directors: ["Yorgos Lanthimos"],
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 11,
      title: "Oppenheimer",
      posterURL: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      description:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genres: ["Drama"],
      directors: ["Christopher Nolan"],
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 12,
      title: "Poor Things",
      posterURL: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      description:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genres: ["Science Fiction"],
      directors: ["Yorgos Lanthimos"],
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
      year: 2023,
      originallanguage: "English",
    },
    {
      movieId: 6,
      title: "The Fall Guy",
      posterURL: "/6OnoMgGFuZ921eV8v8yEyXoag19.jpg",
      description:
        "A stuntman is drawn back into service when the star of a mega-budget studio movie goes missing.",
      genres: ["Action"],
      directors: ["David Leitch"],
      actors: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson"],
      trailerURL: "https://www.example.com/fall-guy",
      year: 2024,
      originallanguage: "English",
    },
    {
      movieId: 7,
      title: "The Batman",
      posterURL: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      description:
        "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
      genres: ["Action"],
      directors: ["Matt Reeves"],
      actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
      trailerURL: "https://www.example.com/the-batman",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 8,
      title: "The Whale",
      posterURL: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
      description:
        "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
      genres: ["Drama"],
      directors: ["Darren Aronofsky"],
      actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
      trailerURL: "https://www.example.com/the-whale",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 9,
      title: "Top Gun: Maverick",
      posterURL: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      description:
        "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
      genres: ["Action"],
      directors: ["Joseph Kosinski"],
      actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
      trailerURL: "https://www.example.com/top-gun-maverick",
      year: 2022,
      originallanguage: "English",
    },
    {
      movieId: 10,
      title: "Everything Everywhere All at Once",
      posterURL: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
      description:
        "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
      genres: ["Science Fiction"],
      directors: ["Daniel Kwan", "Daniel Scheinert"],
      actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
      trailerURL: "https://www.example.com/everything-everywhere",
      year: 2022,
      originallanguage: "English",
    },
  ];

  // Search logic
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }

    setIsSearching(true);

    const query = searchQuery.toLowerCase().trim();
    const filtered = mockMovies.filter((movie) => {
      if (searchCategory === "title" || searchCategory === "all") {
        if (movie.title.toLowerCase().includes(query)) return true;
      }

      if (searchCategory === "genre" || searchCategory === "all") {
        if (movie.genres.some((genre) => genre.toLowerCase().includes(query))) {
          return true;
        }
      }

      return false;
    });

    setSearchResults(filtered);
  }, [searchQuery, searchCategory]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSearchCategory(e.target.value);
  };

  const clearSearch = () => {
    setSearchQuery("");
    setSearchCategory("all");
    setIsSearching(false);
    setSearchResults([]);
  };

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies((prev) => {
      console.log(prev);
      if (prev.some((m) => m.movieId === movie.movieId)) {
        return prev.filter((m) => m.movieId !== movie.movieId);
      } else {
        if (prev.length >= 1) {
          alert("You can only select one favorite movie");
          return prev;
        }
        console.log([...prev, movie]);
        return [...prev, movie];
      }
    });
  };
  // const handleNext = async () => {
  //   if (selectedMovies.length === 0) {
  //     alert("Please select a movie before proceeding.");
  //     return;
  //   }

  //   try {
  //     // Send the selected movie to the backend
  //     await apiService.post(`/preferences/${id}`, {
  //       userId: id,
  //       favoriteMovies: selectedMovies.map((movie) => movie.title), // Send movie titles
  //     });

  //     // Navigate to the profile page
  //     router.push(`/users/${id}/profile`);
  //   } catch (error) {
  //     console.error("Failed to save preferences:", error);
  //     alert(
  //       "An error occurred while saving your preferences. Please try again."
  //     );
  //   }
  // };

  const displayMovies = isSearching ? searchResults : mockMovies;

  return (
    <div>
      {/* Subheading */}
      <h3 className="text-center text-[#3C3F88] mb-6">
        Based on the previous genre you have selected, select one favorite
        movie!
      </h3>

      {/* Search Bar */}
      <SearchBar
        searchQuery={searchQuery}
        searchCategory={searchCategory}
        onSearchChange={handleSearchChange}
        onCategoryChange={handleCategoryChange}
        onClearSearch={clearSearch}
        placeholder="Search for movies..."
        className="mb-6"
      />

      {/* Movie List */}
      <div className="overflow-x-auto">
        <MovieListHorizontal
          movies={displayMovies}
          onMovieClick={toggleMovie}
          emptyMessage="No movies match your genre"
          noResultsMessage="No movies match your search"
          hasOuterContainer={false}
        />
      </div>

      {/* Selected Movie Info */}
      <p className="text-center mt-4 text-sm text-[#3C3F88]">
        {selectedMovies.length > 0
          ? `You selected: ${selectedMovies[0].title}`
          : "No movie selected"}
      </p>

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-4">
        <Button
          variant="destructive"
          onClick={() => router.push("/genre_preferences")}
        >
          Back
        </Button>
        <Button
          // onClick={handleNext}
          onClick={() => router.push("/users/no_token/profile")}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

export default MoviePreferences;
