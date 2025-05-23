import { getApiDomain } from "@/app/utils/domain";
import { ApplicationError } from "@/app/types/error";

// Interface for custom headers option
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

import {
  UserFavoritesDTO,
  UserFavoritesGenresDTO,
  UserFavoritesMovieDTO,
} from "@/app/types/userFavorites";
import { Movie } from "@/app/types/movie";

export class ApiService {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.baseURL = getApiDomain();
    this.defaultHeaders = {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    };
  }

  /**
   * Helper function to check the response, parse JSON,
   * and throw an error if the response is not OK.
   *
   * @param res - The response from fetch.
   * @param errorMessage - A descriptive error message for this call.
   * @returns Parsed JSON data or null for empty responses.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(
    res: Response,
    errorMessage: string
  ): Promise<T> {
    if (!res.ok) {
      let errorDetail = res.statusText;
      try {
        const errorInfo = await res.json();
        if (errorInfo?.message) {
          errorDetail = errorInfo.message;
        } else {
          errorDetail = JSON.stringify(errorInfo);
        }
      } catch {
        // If parsing fails, keep using res.statusText
      }
      const detailedMessage = `${errorMessage}${errorDetail}`;
      const error: ApplicationError = new Error(
        detailedMessage
      ) as ApplicationError;
      error.info = JSON.stringify(
        { status: res.status, statusText: res.statusText },
        null,
        2
      );
      error.status = res.status;
      throw error;
    }

    // Handle NO CONTENT (204) responses
    if (res.status === 204 || res.headers.get("Content-Length") === "0") {
      return {} as T; // Return empty object for NO CONTENT
    }

    return res.json() as Promise<T>;
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async get<T>(
    endpoint: string,
    options?: ApiRequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(options),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while fetching the data.\n"
    );
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post.
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async post<T>(
    endpoint: string,
    data: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      headers: this.getHeaders(options),
      method: "POST",
      body: JSON.stringify(data),
    });

    // Process response body
    return this.processResponse<T>(
      res,
      "An error occurred while posting the data.\n"
    );
  }

  /**
   * Version of POST that returns both the response body and headers
   */
  public async postWithHeaders<T>(
    endpoint: string,
    data: unknown,
    options?: ApiRequestOptions
  ): Promise<[T, Headers]> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      headers: this.getHeaders(options),
      method: "POST",
      body: JSON.stringify(data),
    });

    // Process response body
    const responseBody = await this.processResponse<T>(
      res,
      "An error occurred while posting the data.\n"
    );

    // Return both the response body and headers
    return [responseBody, res.headers];
  }

  /**
   * PUT request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - The payload to update.
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async put<T>(
    endpoint: string,
    data: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(options),
      body: JSON.stringify(data),
    });
    return this.processResponse<T>(
      res,
      "An error occurred while updating the data.\n"
    );
  }

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - Optional payload for the delete request.
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async delete<T>(
    endpoint: string,
    data?: unknown,
    options?: ApiRequestOptions
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const fetchOptions: RequestInit = {
      method: "DELETE",
      headers: this.getHeaders(options),
    };

    // Only add body if data is provided
    if (data !== undefined) {
      fetchOptions.body = JSON.stringify(data);
    }

    const res = await fetch(url, fetchOptions);
    return this.processResponse<T>(
      res,
      "An error occurred while deleting the data.\n"
    );
  }

  /**
   * Get headers for the request, combining default headers, auth token (if not skipped),
   * and any custom headers provided in options.
   *
   * @param options - Optional request configuration with custom headers.
   * @returns Combined headers for the request.
   */
  private getHeaders(options?: ApiRequestOptions): Record<string, string> {
    // Create a new headers object based on the defaults
    const headers: Record<string, string> = { ...this.defaultHeaders };

    // Add authorization token if not explicitly skipped
    if (!options?.skipAuth) {
      const token = localStorage.getItem("token");
      if (token) {
        const cleanToken = token.startsWith('"') ? token.slice(1, -1) : token;
        headers["Authorization"] = `Bearer ${cleanToken}`;
      }
    }

    // Add any custom headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  // --- User Favorites API ---

  // Get all genres
  public async getGenres(): Promise<{ id: number; name: string }[]> {
    return this.get<{ id: number; name: string }[]>(`/movies/genres`, {
      skipAuth: true,
    });
  }

  // Save genre favorites for a user
  public async saveUserGenres(
    userId: number,
    genreIds: string[]
  ): Promise<UserFavoritesGenresDTO> {
    return this.post<UserFavoritesGenresDTO>(
      `/users/${userId}/favorites/genres`,
      { genreIds }
    );
  }

  // Get genre favorites for a user
  public async getUserGenres(userId: number): Promise<UserFavoritesGenresDTO> {
    return this.get<UserFavoritesGenresDTO>(
      `/users/${userId}/favorites/genres`
    );
  }

  // Save favorite movie for a user
  public async saveFavoriteMovie(
    userId: number,
    movieId: number
  ): Promise<UserFavoritesMovieDTO> {
    return this.post<UserFavoritesMovieDTO>(
      `/users/${userId}/favorites/movie`,
      { movieId }
    );
  }

  // Get favorite movie for a user
  public async getFavoriteMovie(userId: number): Promise<{ movie: Movie }> {
    return this.get<{ movie: Movie }>(`/users/${userId}/favorites/movie`);
  }

  // Get all favorites for a user (genres + favorite movie)
  public async getUserFavorites(userId: number): Promise<UserFavoritesDTO> {
    return this.get<UserFavoritesDTO>(`/users/${userId}/favorites`);
  }
}
