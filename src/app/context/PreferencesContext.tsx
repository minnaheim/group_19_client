"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

type PreferencesContextType = {
  selectedGenre: string;
  setSelectedGenre: (genre: string) => void;
};

const PreferencesContext = createContext<PreferencesContextType | undefined>(
  undefined
);

export const PreferencesProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [selectedGenre, setSelectedGenre] = useState<string>("");

  return (
    <PreferencesContext.Provider value={{ selectedGenre, setSelectedGenre }}>
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
