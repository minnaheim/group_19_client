import React, { useEffect, useState } from "react"; // ANI CHANGE: Added useState to manage loading states
import { Movie } from "@/app/types/movie";
import { Eye, Play, Plus, X, Loader } from "lucide-react"; // ANI CHANGE: Added Loader icon
import { Button } from "./button";

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
  isAddingMovie?: boolean; // ANI CHANGE: Added isAddingMovie prop from parent
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
                                                                 onRemoveFromSeenList,
                                                                 isAddingMovie = false, // ANI CHANGE: Default to false
                                                             }) => {
    // ANI CHANGE: Added state to track loading states for each action
    const [isAddingToWatchlist, setIsAddingToWatchlist] = useState(false);
    const [isMarkingAsSeen, setIsMarkingAsSeen] = useState(false);
    const [isRemovingFromWatchlist, setIsRemovingFromWatchlist] = useState(false);
    const [isRemovingFromSeenList, setIsRemovingFromSeenList] = useState(false);
  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      globalThis.addEventListener("keydown", handleEsc);
    }

    return () => {
      globalThis.removeEventListener("keydown", handleEsc);
    };
  }, [isOpen, onClose]);

    // ANI CHANGE: Reset loading states when modal is closed or opened
    useEffect(() => {
        setIsAddingToWatchlist(false);
        setIsMarkingAsSeen(false);
        setIsRemovingFromWatchlist(false);
        setIsRemovingFromSeenList(false);
    }, [isOpen]);

  if (!isOpen || !movie) return null;

  const handleWatchTrailer = () => {
      if (movie.trailerURL) {
          globalThis.open(movie.trailerURL, "_blank");
      }
  };

    // ANI CHANGE: Added handlers with loading states
    const handleAddToWatchlist = async () => {
        if (isMarkingAsSeen || isAddingMovie) return; // ANI CHANGE: Prevent action if another action is in progress
        setIsAddingToWatchlist(true);
        if (onAddToWatchlist) {
            await onAddToWatchlist(movie);
            setIsAddingToWatchlist(false);
            onClose();
        }
    };

    const handleMarkAsSeen = async () => {
        if (isAddingToWatchlist || isAddingMovie) return; // ANI CHANGE: Prevent action if another action is in progress
        setIsMarkingAsSeen(true);
        if (onMarkAsSeen) {
            await onMarkAsSeen(movie);
            setIsMarkingAsSeen(false);
            onClose();
        }
    };

    const handleRemoveFromWatchlist = async () => {
        if (isAddingMovie) return; // ANI CHANGE: Prevent action if global adding is in progress
        setIsRemovingFromWatchlist(true);
        if (onRemoveFromWatchlist) {
            await onRemoveFromWatchlist(movie);
            setIsRemovingFromWatchlist(false);
            onClose();
        }
    };

    const handleRemoveFromSeenList = async () => {
        if (isAddingMovie) return; // ANI CHANGE: Prevent action if global adding is in progress
        setIsRemovingFromSeenList(true);
        if (onRemoveFromSeenList) {
            await onRemoveFromSeenList(movie);
            setIsRemovingFromSeenList(false);
            onClose();
        }
    };

    // ANI Empty values CHANGE: Helper function to check if array is empty and return appropriate message
    const displayArray = (arr: string[] | undefined, limit?: number) => {
        if (!arr || arr.length === 0) {
            return <em className="text-gray-500">No information available via the external API: TMDB</em>;
        }
        // If a limit is specified, slice the array to that limit
        const displayArr = limit ? arr.slice(0, limit) : arr;
        return displayArr.join(", ");
    };

    // ANI Empty values CHANGE: Helper function to check if string is empty and return appropriate message in frontend
    const displayText = (text: string | undefined) => {
        if (!text || text.trim() === "") {
            return <em className="text-gray-500">No information available via the external API: TMDB</em>;
        }
        return text;
    };

  return (
    <>
      {/* Modal Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(200, 200, 200, 0.8)" }}
        onClick={onClose}
      >
      </div>

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
                src={movie.posterURL}
              />
            </div>
              <div className="px-6 pb-6">
                    <div className="mb-4">
                        <h3 className="text-[#3b3e88] font-medium mb-1">Description</h3>
                        <p className="text-gray-700 text-sm">
                            {/* ANI Empty values CHANGE: Using helper function for description */}
                            {displayText(movie.description)}
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[#3b3e88] font-medium mb-1">Genres</h3>
                        <p className="text-gray-700 text-sm">
                            {/* ANI Empty values CHANGE: Using helper function for genres array */}
                            {displayArray(movie.genres, 5)}
                        </p>
                    </div>

                    <div className="mb-4">
                        <h3 className="text-[#3b3e88] font-medium mb-1">Directors</h3>
                        <p className="text-gray-700 text-sm">
                            {/* ANI Empty values CHANGE: Using helper function for directors array */}
                            {displayArray(movie.directors, 5)}
                        </p>
                    </div>

                    <div className="mb-6">
                        <h3 className="text-[#3b3e88] font-medium mb-1">Actors</h3>
                        <p className="text-gray-700 text-sm">
                            {/* ANI Empty values CHANGE: Using helper function for actors array */}
                            {displayArray(movie.actors, 5)}
                        </p>
                    </div>

              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                  variant="secondary"
                  className="flex items-center gap-1"
                  onClick={handleWatchTrailer}
                >
                    {movie.trailerURL ? (
                          <>
                            <Play size={16} />
                            Watch Trailer
                          </>
                    ) : (
                        "No Trailer Available for this Movie"
                    )}
                </Button>


                  {/* Conditional buttons based on what actions are available */}
                {onAddToWatchlist && !isInWatchlist && (
                  <Button
                    variant="secondary"
                    className="flex items-center gap-1"
                    onClick={handleAddToWatchlist}
                                        disabled={isAddingToWatchlist || isMarkingAsSeen} // ANI CHANGE: Disable when loading or other action in progress
                                    >
                                        {isAddingToWatchlist ? (
                                            <>
                                                <Loader size={16} className="animate-spin" /> Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={16} /> Add to Watchlist
                                            </>
                                        )}
                                    </Button>
                                )}

                                {isInWatchlist && onRemoveFromWatchlist && (
                                    <Button
                                        variant="destructive"
                                        className="flex items-center gap-1"
                                        onClick={handleRemoveFromWatchlist}
                                        disabled={isRemovingFromWatchlist || isAddingMovie}
                                    >
                                        {isRemovingFromWatchlist ? (
                                            <>
                                                <Loader size={16} className="animate-spin" /> Removing...
                                            </>
                                        ) : (
                                            <>
                                                <X size={16} /> Remove from Watchlist
                                            </>
                                        )}
                                    </Button>
                                )}

                                {onMarkAsSeen && (
                                    <Button
                                        variant="secondary"
                                        className={`flex items-center gap-1 ${
                                            isInSeenList ? "opacity-50" : ""
                                        }`}
                                        onClick={handleMarkAsSeen}
                                        disabled={isInSeenList || isMarkingAsSeen || isAddingToWatchlist || isAddingMovie}
                                    >
                                        {isMarkingAsSeen ? (
                                            <>
                                                <Loader size={16} className="animate-spin" /> Marking...
                                            </>
                                        ) : (
                                            <>
                                                <Eye size={16} />
                                                {isInSeenList ? "Already Seen" : "Mark as Seen"}
                                            </>
                                        )}
                                    </Button>
                                )}

                                {isInSeenList && onRemoveFromSeenList && (
                                    <Button
                                        variant="destructive"
                                        className="flex items-center gap-1"
                                        onClick={handleRemoveFromSeenList}
                                        disabled={isRemovingFromSeenList || isAddingMovie}
                                    >
                                        {isRemovingFromSeenList ? (
                                            <>
                                                <Loader size={16} className="animate-spin" /> Removing...
                                            </>
                                        ) : (
                                            <>
                                                <X size={16} /> Remove from Seen List
                                            </>
                                        )}
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