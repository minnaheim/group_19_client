import React, { useEffect } from "react";
import { User } from "@/app/types/user";
import { X } from "lucide-react";
import { Button } from "./button";

interface UserDetailsModalProps {
  user: User;
  isOpen: boolean;
  onClose: () => void;
  isInFriendslist?: boolean;
  // onAddToFriendslist?: (user: User) => void;
  onRemoveFromFriendslist?: (user: User) => void;
}

const UserDetailsModal: React.FC<UserDetailsModalProps> = ({
  user,
  isOpen,
  onClose,
  isInFriendslist = false,
  // onAddToFriendslist,
  onRemoveFromFriendslist,
}) => {
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

  if (!isOpen || !user) return null;

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
      <div className="fixed inset-0 flex items-center justify-center z-40 p-4">
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
            {user.username}
          </h3>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-grow">
              <p className="mb-2">{user.bio}</p>

              <div>
                <span className="font-bold">Favorite Genres:</span>{" "}
                {user.favoriteGenres.join(", ")}
              </div>
              <div>
                <span className="font-bold">Favorite Movie:</span>{" "}
                {user.favoriteMovie.title}
              </div>
              <div className="col-span-2">
                <span className="font-bold">Watch List:</span>{" "}
                {user.watchlist.map((movie) => movie.title).join(", ")}
              </div>
              <div className="col-span-2">
                <span className="font-bold">Watched Movies:</span>{" "}
                {user.watchedMovies.map((movie) => movie.title).join(", ")}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              {isInFriendslist && onRemoveFromFriendslist && (
                <Button
                  variant="destructive"
                  className="flex items-center gap-1"
                  onClick={() => {
                    onRemoveFromFriendslist(user);
                    onClose();
                  }}
                >
                  <X size={16} /> Remove from Friendslist
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserDetailsModal;
