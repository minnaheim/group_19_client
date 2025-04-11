import React from "react";
import { Movie } from "@/app/types/movie";
import { Eye, Film } from "lucide-react";

interface MovieCardProps {
    movie: Movie;
    isEditing?: boolean;
    isSelected?: boolean;
    isInWatchlist?: boolean;
    isInSeenList?: boolean;
    isSelectingFavorite?: boolean;
    isFavorite?: boolean;
    onClick: (movie: Movie) => void;
    onSelect?: (movieId: number) => void;
}

const MovieCard: React.FC<MovieCardProps> = ({
                                                 movie,
                                                 isEditing = false,
                                                 isSelected = false,
                                                 isInWatchlist = false,
                                                 isInSeenList = false,
                                                 isSelectingFavorite = false,
                                                 isFavorite = false,
                                                 onClick,
                                                 onSelect,
                                             }) => {
    const handleClick = () => {
        if (isEditing && onSelect) {
            onSelect(movie.movieId);
        } else {
            onClick(movie);
        }
    };

    return (
        <div
            className="relative cursor-pointer group"
            onClick={handleClick}
        >
            <img
                className={`w-[71px] h-[107px] sm:w-[90px] sm:h-[135px] md:w-[120px] md:h-[180px] object-cover rounded-md ${
                    isEditing
                        ? "opacity-50 hover:opacity-80"
                        : "group-hover:opacity-75 transition-opacity"
                } ${isEditing && isSelected ? "border-2 border-destructive" : ""}
        ${isSelectingFavorite ? "border border-gray-300" : ""}`}
                alt={movie.title}
                src={`https://image.tmdb.org/t/p/w500${movie.posterURL}`}
            />

            {isEditing && isSelected && (
                <div className="absolute top-1 right-1 bg-destructive text-white rounded-full p-1 text-xs sm:p-1.5 md:p-2 md:text-sm">
                    ✕
                </div>
            )}

            {/* Add a star icon when in favorite selection mode */}
            {isSelectingFavorite && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#ff9a3e] text-white rounded-full p-2">
                        <svg
                            width="20"
                            height="20"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                        </svg>
                    </div>
                </div>
            )}

            {/* Display a star for explicitly marked favorite movies */}
            {isFavorite && !isSelectingFavorite && !isEditing && (
                <div className="absolute top-1 right-1 bg-[#ff9a3e] text-white rounded-full p-1">
                    <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="currentColor"
                        stroke="none"
                    >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                    </svg>
                </div>
            )}

            {!isEditing && !isSelectingFavorite && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-[#3b3e88] text-white rounded-full p-2">
                        <Film size={20} />
                    </div>
                </div>
            )}

            {/* Status indicators */}
            <div className="absolute bottom-1 right-1 flex space-x-1">
                {isInWatchlist && (
                    <div
                        className="bg-[#f44771] text-white rounded-full p-1"
                        title="In your watchlist"
                    >
                        <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                    </div>
                )}
                {isInSeenList && (
                    <div
                        className="bg-[#f44771] text-white rounded-full p-1"
                        title="Already seen"
                    >
                        <Eye size={12} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default MovieCard;