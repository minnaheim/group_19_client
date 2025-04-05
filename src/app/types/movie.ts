export interface Movie {
    id: number; // maps to movieId on server
    title: string;
    posterURL: string;
    description: string; 
    genre: string;
    director: string;
    actors: string[];
    trailerURL: string;
    year?: number; // Optional, not used in all components
    originallanguage?: string; // Optional, not used in all components
}