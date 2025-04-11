import React from "react";
import { Movie } from "@/app/types/movie";
import MovieCard from "@/components/ui/Movie_card";

interface MovieListProps {
  movies: Movie[];
  isLoading: boolean;
  isSearching: boolean;
  onMovieClick: (movie: Movie) => void;
  onClearSearch: () => void;
  emptyMessage?: string;
  noResultsMessage?: string;
  isInWatchlistFn?: (movie: Movie) => boolean;
  isInSeenListFn?: (movie: Movie) => boolean;
  isSelectingFavorite?: boolean;
}

const MovieList: React.FC<MovieListProps> = ({
                                               movies,
                                               isLoading,
                                               isSearching,
                                               onMovieClick,
                                               onClearSearch,
                                               emptyMessage = "no movies available",
                                               noResultsMessage = "no results found",
                                               isInWatchlistFn = () => false,
                                               isInSeenListFn = () => false,
                                               isSelectingFavorite = false,
                                             }) => {
  if (isLoading) {
    return (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#3b3e88]"></div>
        </div>
    );
  }

  // no movies found while searching
  if (isSearching && movies.length === 0) {
    return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">{noResultsMessage}</p>
          <button
              onClick={onClearSearch}
              className="text-[#3b3e88] hover:underline"
          >
            clear search
          </button>
        </div>
    );
  }

  // no movies available to display (not searching)
  if (!isSearching && movies.length === 0) {
    return <div className="text-center py-10 text-gray-500">{emptyMessage}</div>;
  }

  return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
        {movies.map((movie) => (
            <MovieCard
                key={movie.movieId}
                movie={movie}
                isInWatchlist={isInWatchlistFn(movie)}
                isInSeenList={isInSeenListFn(movie)}
                onClick={() => onMovieClick(movie)}
                isSelectingFavorite={isSelectingFavorite}
            />
        ))}
      </div>
  );
};

export default MovieList;