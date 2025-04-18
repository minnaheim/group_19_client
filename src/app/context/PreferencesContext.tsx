"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

import { Movie } from "@/app/types/movie";

export type PreferencesContextType = {
  selectedGenres: string[];
  setSelectedGenres: (genres: string[]) => void;
  favoriteMovieId: number | null;
  setFavoriteMovieId: (id: number | null) => void;
  favoriteMovie: Movie | null;
  setFavoriteMovie: (movie: Movie | null) => void;
};

export const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteMovieId, setFavoriteMovieId] = useState<number | null>(null);
  const [favoriteMovie, setFavoriteMovie] = useState<Movie | null>(null);

  return (
    <PreferencesContext.Provider
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
    </PreferencesContext.Provider>
  );
};

export const usePreferences = () => {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error("usePreferences must be used within a PreferencesProvider");
  }
  return context;
};
