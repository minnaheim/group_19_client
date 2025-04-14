import React, { useState } from "react";
import { User } from "@/app/types/user";
import { Movie } from "@/app/types/movie";
import { X, UserPlus, UserMinus, ListTodo } from "lucide-react";
import { useRouter } from "next/navigation";
import MovieCard from "@/components/ui/Movie_card";
import MovieDetailsModal from "@/components/ui/movie_details";
import { Button } from "@/components/ui/button";

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isInFriendslist?: boolean;
  isPending?: boolean;
  onAddToFriendslist?: (user: User) => void;
  onRemoveFromFriendslist?: (user: User) => void;
  onAcceptFriendRequest?: (user: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
                                                             user,
                                                             isOpen,
                                                             onClose,
                                                             isInFriendslist = false,
                                                             isPending = false,
                                                             onAddToFriendslist,
                                                             onRemoveFromFriendslist,
                                                             onAcceptFriendRequest,
                                                           }) => {
  const router = useRouter();

  // State for movie details modal
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null);
  const [isMovieModalOpen, setIsMovieModalOpen] = useState<boolean>(false);

  if (!isOpen || !user) return null;

  const handleViewWatchlist = () => {
    // Navigate to friend's watchlist
    router.push(`/users/${user.userId}/friend_watchlist`);
  };

  const handleMovieClick = (movie: Movie) => {
    setSelectedMovie(movie);
    setIsMovieModalOpen(true);
  };

  const closeMovieModal = () => {
    setIsMovieModalOpen(false);
    setTimeout(() => setSelectedMovie(null), 300); // Delay to allow animation
  };

  return (
      <>
        {/* Modal Overlay */}
        <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(200, 200, 200, 0.8)" }}
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
              {user.username}&#39;s Profile
            </h3>

            <div className="flex flex-col gap-4">
              {/* User Bio */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium mb-2">Bio</h4>
                <p>{user.bio || "No bio available"}</p>
              </div>

              {/* Favorite Genres */}
              <div>
                <h4 className="font-medium mb-2">Favorite Genres</h4>
                <div className="flex flex-wrap gap-2">
                  {user.favoriteGenres && user.favoriteGenres.length > 0 ? (
                      user.favoriteGenres.map((genre) => (
                          <span
                              key={genre}
                              className="px-3 py-1 bg-[#CCD0FF] text-[#3b3e88] rounded-full text-sm"
                          >
                      {genre}
                    </span>
                      ))
                  ) : (
                      <span className="text-gray-500">No favorite genres</span>
                  )}
                </div>
              </div>

              {/* Favorite Movie */}
              <div>
                <h4 className="font-medium mb-2">Favorite Movie</h4>
                {user.favoriteMovie ? (
                    <div className="flex items-center gap-4">
                      <MovieCard
                          movie={user.favoriteMovie}
                          isInWatchlist={false}
                          isInSeenList={false}
                          isFavorite={true}
                          onClick={(movie) => handleMovieClick(movie)}
                      />
                      <span className="text-sm">{user.favoriteMovie.title}</span>
                    </div>
                ) : (
                    <span className="text-gray-500">No favorite movie selected</span>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2 mt-4">
                <Button
                    variant="secondary"
                    className="flex items-center gap-1"
                    onClick={handleViewWatchlist}
                >
                  <ListTodo size={16} /> View Watchlist
                </Button>

                {!isInFriendslist && !isPending && onAddToFriendslist && (
                    <Button
                        variant="secondary"
                        className="flex items-center gap-1"
                        onClick={() => {
                          onAddToFriendslist(user);
                          onClose();
                        }}
                    >
                      <UserPlus size={16} /> Add Friend
                    </Button>
                )}

                {isPending && onAcceptFriendRequest && (
                    <Button
                        variant="secondary"
                        className="flex items-center gap-1"
                        onClick={() => {
                          onAcceptFriendRequest(user);
                          onClose();
                        }}
                    >
                      <UserPlus size={16} /> Accept Friend Request
                    </Button>
                )}

                {isInFriendslist && onRemoveFromFriendslist && (
                    <Button
                        variant="destructive"
                        className="flex items-center gap-1"
                        onClick={() => {
                          onRemoveFromFriendslist(user);
                          onClose();
                        }}
                    >
                      <UserMinus size={16} /> Remove Friend
                    </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Movie Details Modal */}
        {selectedMovie && (
            <MovieDetailsModal
                movie={selectedMovie}
                isOpen={isMovieModalOpen}
                onClose={closeMovieModal}
                isInWatchlist={false}
                isInSeenList={false}
            />
        )}
      </>
  );
};

export default UserDetailsModal;