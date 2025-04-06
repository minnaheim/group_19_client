import React, { useEffect } from "react";
import { Movie } from "@/app/types/movie";
import { X, Play, Eye, Plus } from "lucide-react";
import {Button} from "./button";

interface MovieDetailsModalProps {
    movie: Movie;
    isOpen: boolean;
    onClose: () => void;
    isInWatchlist?: boolean;
    isInSeenList?: boolean;
    onAddToWatchlist?: (movie: Movie) => void;
    onMarkAsSeen?: (movie: Movie) => void;
    onRemoveFromWatchlist?: (movie: Movie) => void;
    onRemoveFromSeenList?: (movie: Movie) => void;
}

const MovieDetailsModal: React.FC<MovieDetailsModalProps> = ({
                                                                 movie,
                                                                 isOpen,
                                                                 onClose,
                                                                 isInWatchlist = false,
                                                                 isInSeenList = false,
                                                                 onAddToWatchlist,
                                                                 onMarkAsSeen,
                                                                 onRemoveFromWatchlist,
                                                                 onRemoveFromSeenList
                                                             }) => {
    // Handle ESC key press to close modal
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleEsc);
        }

        return () => {
            window.removeEventListener('keydown', handleEsc);
        };
    }, [isOpen, onClose]);

    if (!isOpen || !movie) return null;

    const handleWatchTrailer = () => {
        window.open(movie.trailerURL, '_blank');
    };

    return (
        <>
            {/* Modal Overlay */}
            <div
                className="fixed inset-0 z-40"
                style={{ backgroundColor: 'rgba(200, 200, 200, 0.8)' }}
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div
                    className="bg-white rounded-[30px] p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto relative animate-fadeIn"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                        aria-label="close"
                    >
                        <X size={24} />
                    </button>

                    {/* Modal title */}
                    <h3 className="text-[#3b3e88] text-xl font-semibold mb-4 pr-6">
                        {movie.title}
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-shrink-0">
                            <img
                                className="w-[120px] h-[180px] object-cover rounded-md mx-auto sm:mx-0"
                                alt={movie.title}
                                src={`https://image.tmdb.org/t/p/w500${movie.posterUrl}`}
                            />
                        </div>
                        <div className="flex-grow">
                            <p className="mb-2">{movie.details}</p>

                            <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                                <div>
                                    <span className="font-medium">Genre:</span> {movie.genre}
                                </div>
                                <div>
                                    <span className="font-medium">Director:</span> {movie.director}
                                </div>
                                <div className="col-span-2">
                                    <span className="font-medium">Cast:</span> {movie.actors.join(", ")}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-4">
                                <Button
                                    variant="secondary"
                                    className="flex items-center gap-1"
                                    onClick={handleWatchTrailer}
                                >
                                    <Play size={16} /> Watch Trailer
                                </Button>

                                {/* Conditional buttons based on what actions are available */}
                                {onAddToWatchlist && !isInWatchlist && (
                                    <Button
                                        variant="secondary"
                                        className="flex items-center gap-1"
                                        onClick={() => {
                                            onAddToWatchlist(movie);
                                            onClose();
                                        }}
                                    >
                                        <Plus size={16} /> Add to Watchlist
                                    </Button>
                                )}

                                {isInWatchlist && onRemoveFromWatchlist && (
                                    <Button
                                        variant="destructive"
                                        className="flex items-center gap-1"
                                        onClick={() => {
                                            onRemoveFromWatchlist(movie);
                                            onClose();
                                        }}
                                    >
                                        <X size={16} /> Remove from Watchlist
                                    </Button>
                                )}

                                {onMarkAsSeen && (
                                    <Button
                                        variant="secondary"
                                        className={`flex items-center gap-1 ${isInSeenList ? 'opacity-50' : ''}`}
                                        onClick={() => {
                                            onMarkAsSeen(movie);
                                            onClose();
                                        }}
                                        disabled={isInSeenList}
                                    >
                                        <Eye size={16} />
                                        {isInSeenList ? 'Already Seen' : 'Mark as Seen'}
                                    </Button>
                                )}

                                {isInSeenList && onRemoveFromSeenList && (
                                    <Button
                                        variant="destructive"
                                        className="flex items-center gap-1"
                                        onClick={() => {
                                            onRemoveFromSeenList(movie);
                                            onClose();
                                        }}
                                    >
                                        <X size={16} /> Remove from Seen List
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default MovieDetailsModal;