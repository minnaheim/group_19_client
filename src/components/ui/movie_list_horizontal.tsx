import React from "react";
import { Movie } from "@/app/types/movie";
import { Button } from "./button";
import MovieCardSimple from "./movie_card_simple";

interface MovieListHorizontalProps {
  movies: Movie[];
  isEditing?: boolean;
  isSearching?: boolean;
  selectedMovieIds?: number[];
  onMovieClick: (movie: Movie) => void;
  onMovieSelect?: (movieId: number) => void;
  onAddMovieClick?: () => void;
  onClearSearch?: () => void;
  emptyMessage?: string;
  noResultsMessage?: string;
  hasOuterContainer?: boolean; // New prop to control the outer container
}
const MovieListHorizontal: React.FC<MovieListHorizontalProps> = ({
  movies,
  onMovieClick,
  isEditing = false,
  isSearching = false,
  // selectedMovieIds = [],
  // onMovieSelect,
  onAddMovieClick,
  onClearSearch,
  emptyMessage = "No movies found",
  noResultsMessage = "No movies match your search",
  hasOuterContainer = true,
}) => {
  const isEmpty = movies.length === 0;

  const content = (
    <>
      {/* Empty state when searching */}
      {isSearching && isEmpty && (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 text-lg mb-4">{noResultsMessage}</p>
          {onClearSearch && (
            <Button variant="destructive" onClick={onClearSearch}>
              Clear Search
            </Button>
          )}
        </div>
      )}
      {/* Empty state when not searching */}
      {!isSearching && isEmpty && (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 text-lg mb-4">{emptyMessage}</p>
          {onAddMovieClick && (
            <Button variant="secondary" onClick={onAddMovieClick}>
              Add Movies to your Watchlist
            </Button>
          )}
        </div>
      )}
      {/* Movies Grid */}
      <div className="flex flex-nowrap gap-4">
        {movies.map((movie) => (
          <div key={movie.movieId} className="flex-shrink-0">
            <MovieCardSimple movie={movie} onClick={onMovieClick} />
          </div>
        ))}
        {/* Add Movie Button */}
        {!isEditing && onAddMovieClick && !isEmpty && (
          <div
            className="aspect-[2/3] w-[71px] sm:w-[90px] md:w-[120px] bg-[#ccd1ff] rounded-[10px] flex items-center justify-center cursor-pointer flex-shrink-0"
            onClick={onAddMovieClick}
          >
            <div className="relative w-1/2 aspect-square">
              <img
                className="w-full h-full object-contain"
                alt="Plus"
                src="/plus.png"
              />
            </div>
          </div>
        )}
      </div>
    </>
  );

  if (!hasOuterContainer) {
    return content;
  }

  return <div className="bg-white rounded-[30px] shadow-lg p-6">{content}</div>;
};

export default MovieListHorizontal;
