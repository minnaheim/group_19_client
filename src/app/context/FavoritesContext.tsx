"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

import { Movie } from "@/app/types/movie";

export type FavoritesContextType = {
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  favoriteMovieId: number | null;
  setFavoriteMovieId: (id: number | null) => void;
  favoriteMovie: Movie | null;
  setFavoriteMovie: (movie: Movie | null) => void;
};

export const FavoritesContext = createContext<FavoritesContextType | undefined>(
  undefined
);

export const FavoritesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteMovieId, setFavoriteMovieId] = useState<number | null>(null);
  const [favoriteMovie, setFavoriteMovie] = useState<Movie | null>(null);

  return (
    <FavoritesContext.Provider
      value={{
        selectedGenres,
        setSelectedGenres,
        favoriteMovieId,
        setFavoriteMovieId,
        favoriteMovie,
        setFavoriteMovie,
      }}
    >
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error("useFavorites must be used within a FavoritesProvider");
  }
  return context;
};
