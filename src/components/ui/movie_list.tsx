import React from "react";
import { Movie } from "@/app/types/movie";
import { Button } from "./button";
import MovieCard from "./Movie_card";

interface MovieListProps {
  movies: Movie[];
  isLoading?: boolean;
  isEditing?: boolean;
  isSearching?: boolean;
  selectedMovieIds?: number[];
  onMovieClick: (movie: Movie) => void;
  onMovieSelect?: (movieId: number) => void;
  onAddMovieClick?: () => void;
  onClearSearch?: () => void;
  emptyMessage?: string;
  noResultsMessage?: string;
  isInWatchlistFn?: (movie: Movie) => boolean;
  isInSeenListFn?: (movie: Movie) => boolean;
  className?: string;
  isSelectingFavorite?: boolean;
}

const MovieList: React.FC<MovieListProps> = ({
  movies,
  isLoading = false,
  isEditing = false,
  isSearching = false,
  selectedMovieIds = [],
  onMovieClick,
  onMovieSelect,
  onAddMovieClick,
  onClearSearch,
  emptyMessage = "No movies found",
  noResultsMessage = "No movies match your search",
  isInWatchlistFn = () => false,
  isInSeenListFn = () => false,
  className = "",
}) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#3b3e88]"></div>
      </div>
    );
  }

  const isEmpty = movies.length === 0;

  return (
    <div
      className={`bg-white rounded-[30px] shadow-lg relative p-6 min-h-[500px] max-h-[70vh] overflow-y-auto ${className}`}
    >
      {/* No results message when searching */}
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

      {/* Empty state message when not searching */}
      {!isSearching && isEmpty && (
        <div className="flex flex-col items-center justify-center h-full">
          <p className="text-gray-500 text-lg mb-4">{emptyMessage}</p>
          {onAddMovieClick && (
            <Button variant="secondary" onClick={onAddMovieClick}>
              Find Movies to Add
            </Button>
          )}
        </div>
      )}

      {/* Movies grid */}
      <div className="flex flex-wrap gap-6">
        {movies.map((movie) => (
          <MovieCard
            key={movie.movieId}
            movie={movie}
            isEditing={isEditing}
            isSelected={selectedMovieIds.includes(movie.movieId)}
            isInWatchlist={isInWatchlistFn(movie)}
            isInSeenList={isInSeenListFn(movie)}
            onClick={onMovieClick}
            onSelect={onMovieSelect}
          />
        ))}

        {/* Add Movie Button */}
        {!isEditing && onAddMovieClick && !isEmpty && (
          <div
            className="w-[71px] h-[107px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] bg-[#ccd1ff] rounded-[10px] flex items-center justify-center cursor-pointer"
            onClick={onAddMovieClick}
          >
            <div className="relative w-[52px] h-[52px]">
              <img
                className="w-[50px] h-[50px] sm:w-[55px] sm:h-[55px] md:w-[60px] md:h-[60px] object-cover"
                alt="Plus"
                src="/plus.png"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MovieList;
