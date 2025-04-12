"use client";

import { useState } from "react";
import { Movie } from "@/app/types/movie";
import MovieListHorizontal from "@/components/ui/movie_list_horizontal";
import { Button } from "@/components/ui/button";
import { useRouter, useParams } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";

interface MoviePreferencesProps {
  setSelectedMovie: (movieId: number | null) => void;
}

const moviePreferences: React.FC = () => {
  const [selectedMovies, setSelectedMovies] = useState<Movie[]>([]);
  const apiService = useApi();
  const router = useRouter();
  const { id } = useParams();

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
    {
      id: 40,
      title: "Oppenheimer",
      posterUrl: "/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg",
      details:
        "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb.",
      genre: "Drama",
      director: "Christopher Nolan",
      actors: ["Cillian Murphy", "Emily Blunt", "Matt Damon"],
      trailerURL: "https://www.example.com/oppenheimer",
    },
    {
      id: 3,
      title: "Poor Things",
      posterUrl: "/kCGlIMHnOm8JPXq3rXM6c5wMxcT.jpg",
      details:
        "The incredible tale about the fantastical evolution of Bella Baxter, a young woman brought back to life by the brilliant and unorthodox scientist Dr. Godwin Baxter.",
      genre: "Science Fiction",
      director: "Yorgos Lanthimos",
      actors: ["Emma Stone", "Mark Ruffalo", "Willem Dafoe"],
      trailerURL: "https://www.example.com/poor-things",
    },
    {
      id: 4,
      title: "The Fall Guy",
      posterUrl: "/6OnoMgGFuZ921eV8v8yEyXoag19.jpg",
      details:
        "A stuntman is drawn back into service when the star of a mega-budget studio movie goes missing.",
      genre: "Action",
      director: "David Leitch",
      actors: ["Ryan Gosling", "Emily Blunt", "Aaron Taylor-Johnson"],
      trailerURL: "https://www.example.com/fall-guy",
    },
    {
      id: 5,
      title: "The Batman",
      posterUrl: "/74xTEgt7R36Fpooo50r9T25onhq.jpg",
      details:
        "When a sadistic serial killer begins murdering key political figures in Gotham, Batman is forced to investigate the city's hidden corruption and question his family's involvement.",
      genre: "Action",
      director: "Matt Reeves",
      actors: ["Robert Pattinson", "Zoë Kravitz", "Paul Dano"],
      trailerURL: "https://www.example.com/the-batman",
    },
    {
      id: 6,
      title: "The Whale",
      posterUrl: "/jQ0gylJMxWSL490sy0RrPj1Lj7e.jpg",
      details:
        "A reclusive English teacher attempts to reconnect with his estranged teenage daughter.",
      genre: "Drama",
      director: "Darren Aronofsky",
      actors: ["Brendan Fraser", "Sadie Sink", "Hong Chau"],
      trailerURL: "https://www.example.com/the-whale",
    },
    {
      id: 7,
      title: "Top Gun: Maverick",
      posterUrl: "/62HCnUTziyWcpDaBO2i1DX17ljH.jpg",
      details:
        "After more than thirty years of service as one of the Navy's top aviators, Pete Mitchell is where he belongs, pushing the envelope as a courageous test pilot and dodging the advancement in rank that would ground him.",
      genre: "Action",
      director: "Joseph Kosinski",
      actors: ["Tom Cruise", "Miles Teller", "Jennifer Connelly"],
      trailerURL: "https://www.example.com/top-gun-maverick",
    },
    {
      id: 8,
      title: "Everything Everywhere All at Once",
      posterUrl: "/w3LxiVYdWWRvEVdn5RYq6jIqkb1.jpg",
      details:
        "An aging Chinese immigrant is swept up in an insane adventure, where she alone can save the world by exploring other universes connecting with the lives she could have led.",
      genre: "Science Fiction",
      director: "Daniel Kwan, Daniel Scheinert",
      actors: ["Michelle Yeoh", "Ke Huy Quan", "Jamie Lee Curtis"],
      trailerURL: "https://www.example.com/everything-everywhere",
    },

    {
      id: 10,
      title: "Killers of the Flower Moon",
      posterUrl: "/dB6Krk806zeqd0YNp2ngQ9zXteH.jpg",
      details:
        "When oil is discovered in 1920s Oklahoma under Osage Nation land, the Osage people are murdered one by one—until the FBI steps in to unravel the mystery.",
      genre: "Crime",
      director: "Martin Scorsese",
      actors: ["Leonardo DiCaprio", "Robert De Niro", "Lily Gladstone"],
      trailerURL: "https://www.example.com/killers-flower-moon",
    },

    {
      id: 13,
      title: "Anatomy of a Fall",
      posterUrl: "/kQs6keheMwCxJxrzV83VUwFtHkB.jpg",
      details:
        "A woman is suspected of her husband's murder, and their blind son faces a moral dilemma as the sole witness.",
      genre: "Legal Drama",
      director: "Justine Triet",
      actors: ["Sandra Hüller", "Swann Arlaud", "Milo Machado Graner"],
      trailerURL: "https://www.example.com/anatomy-of-a-fall",
    },

    {
      id: 15,
      title: "Mission: Impossible - Dead Reckoning Part One",
      posterUrl: "/NNxYkU70HPurnNCSiCjYAmacwm.jpg",
      details:
        "Ethan Hunt and his IMF team embark on their most dangerous mission yet: To track down a terrifying new weapon that threatens all of humanity before it falls into the wrong hands.",
      genre: "Action",
      director: "Christopher McQuarrie",
      actors: ["Tom Cruise", "Hayley Atwell", "Simon Pegg"],
      trailerURL: "https://www.example.com/mission-impossible",
    },
  ];

  const toggleMovie = (movie: Movie) => {
    setSelectedMovies((prev) => {
      console.log(prev);
      // can be adjusted to checking by title not ID, but ID usually unique
      if (prev.some((m) => m.id === movie.id)) {
        return prev.filter((m) => m.id !== movie.id);
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

  const handleNext = async () => {
    if (selectedMovies.length === 0) {
      alert("Please select a movie before proceeding.");
      return;
    }

    try {
      await apiService.post(`/preferences/${id}`, {
        userId: id,
        favoriteMovies: selectedMovies,
      });

      router.push("/users/no_token/profile");
    } catch (error) {
      console.error("Failed to save preferences:", error);
      alert(
        "An error occurred while saving your preferences. Please try again."
      );
    }
  };
  // TODO: wait for backend to finish this endpoint
  // const movies = await apiService.get(`/movies?GenreList=${}`);

  return (
    <div>
      {/* Subheading - preference specific */}
      <h3 className="text-center text-[#3C3F88] mb-6">
        Based on the previous genre you have selected, select one favorite
        movie!
      </h3>
      {/* map mockMovies  */}
      <div className="overflow-x-auto">
        <MovieListHorizontal
          movies={mockMovies}
          // isLoading={false}
          onMovieClick={toggleMovie} // TODO: decide where endpoint call happens
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
      {/* TODO: make padding work, not br */}
      <br></br>
      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={() => router.push("/genre_preferences")}
        >
          Back
        </Button>
        {/* onClick={handleNext} */}
        <Button onClick={() => router.push("/users/no_token/profile")}>
          Next
        </Button>
      </div>
    </div>
  );
};

export default moviePreferences;
