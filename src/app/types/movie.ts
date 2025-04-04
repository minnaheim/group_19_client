export interface Movie {
    id: number; // maps to movieId on server
    title: string;
    posterURL: string; // Changed to match server naming
    description: string; // Changed from details to match server
    genre: string;
    director: string; // This will map to crew on server
    actors: string[]; // This will be parsed from actor string on server
    trailerURL: string;
}