import React from "react";
import { Movie } from "@/app/types/movie";

import MovieCard from "./Movie_card";
import MovieCardSimple from "./movie_card_simple";

interface MovieListHorizontalProps {
  movies: Movie[];
  selectedMovieIds?: number[];
  onMovieClick: (movie: Movie) => void;
  emptyMessage?: string;
  noResultsMessage?: string;
  hasOuterContainer?: boolean; // New prop to control the outer container
}
const MovieListHorizontal: React.FC<MovieListHorizontalProps> = ({
  movies,
  onMovieClick,
  selectedMovieIds = [],
  emptyMessage = "No movies found",
  noResultsMessage = "No movies match your search",
  hasOuterContainer = true,
}) => {
  const isEmpty = movies.length === 0;

  const content = (
    <>
      {isEmpty ? (
        <div className="text-center text-gray-500">{emptyMessage}</div>
      ) : (
        <div className="flex flex-nowrap gap-4">
          {movies.map((movie) => (
            <div key={movie.id} className="flex-shrink-0">
              <MovieCardSimple movie={movie} onClick={onMovieClick} />
            </div>
          ))}
        </div>
      )}
    </>
  );

  if (!hasOuterContainer) {
    return content;
  }

  return <div className="bg-white rounded-[30px] shadow-lg p-6">{content}</div>;
};

export default MovieListHorizontal;
