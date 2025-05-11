import { Movie } from './movie'; // Assuming Movie is your MovieGetDTO equivalent

export interface PoolEntry {
  movie: Movie;
  addedBy: number; // Or string if your user IDs are strings on the frontend
}
