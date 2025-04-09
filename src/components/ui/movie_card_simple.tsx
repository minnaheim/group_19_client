import React from "react";
import { Movie } from "@/app/types/movie";
import { Heart } from "lucide-react";

interface MovieCardSimpleProps {
  movie: Movie;
  onClick: (movie: Movie) => void;
  onSelect?: (movieId: number) => void;
}

const MovieCardSimple: React.FC<MovieCardSimpleProps> = ({
  movie,
  onClick,
  onSelect,
}) => {
  const handleClick = () => {
    if (onSelect) {
      onSelect(movie.id);
    } else {
      onClick(movie);
    }
  };

  return (
    // TODO: add endpoints
    <div className="relative group" onClick={handleClick}>
      <img
        className="w-[90px] h-[130px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] object-cover rounded-md group-hover:opacity-75 transition-opacity"
        alt={movie.title}
        src={`https://image.tmdb.org/t/p/w500${movie.posterUrl}`}
      />
      {
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-[#3b3e88] text-white rounded-full p-2">
            <Heart size={20} />
          </div>
        </div>
      }

      {/* Status indicators */}
      <div className="absolute bottom-1 right-1 flex space-x-1">
        {/* TODO: change status indicators, so that <3 if selected  */}
      </div>
    </div>
  );
};

export default MovieCardSimple;
