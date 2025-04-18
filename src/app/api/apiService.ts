import { getApiDomain } from "@/app/utils/domain";
import { ApplicationError } from "@/app/types/error";

// Interface for custom headers option
export interface ApiRequestOptions {
  headers?: Record<string, string>;
  skipAuth?: boolean;
}

import { UserPreferencesGenresDTO, UserPreferencesFavoriteMovieDTO, UserPreferencesDTO } from "@/app/types/userPreferences";
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
   * @returns Parsed JSON data.
   * @throws ApplicationError if res.ok is false.
   */
  private async processResponse<T>(
      res: Response,
      errorMessage: string,
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
      const detailedMessage = `${errorMessage} (${res.status}: ${errorDetail})`;
      const error: ApplicationError = new Error(
          detailedMessage,
      ) as ApplicationError;
      error.info = JSON.stringify(
          { status: res.status, statusText: res.statusText },
          null,
          2,
      );
      error.status = res.status;
      throw error;
    }
    return res.json() as Promise<T>;
  }

  /**
   * GET request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(options),
    });
    return this.processResponse<T>(
        res,
        "An error occurred while fetching the data.\n",
    );
  }

  /**
   * POST request.
   * @param endpoint - The API endpoint (e.g. "/users").
   * @param data - The payload to post.
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async post<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      headers: this.getHeaders(options),
      method: "POST",
      body: JSON.stringify(data),
    });

    // Process response body
    return this.processResponse<T>(
        res,
        "An error occurred while posting the data.\n",
    );
  }

  /**
   * Version of POST that returns both the response body and headers
   */
  public async postWithHeaders<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<[T, Headers]> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      headers: this.getHeaders(options),
      method: "POST",
      body: JSON.stringify(data),
    });

    // Process response body
    const responseBody = await this.processResponse<T>(
        res,
        "An error occurred while posting the data.\n",
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
  public async put<T>(endpoint: string, data: unknown, options?: ApiRequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const res = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(options),
      body: JSON.stringify(data),
    });
    return this.processResponse<T>(
        res,
        "An error occurred while updating the data.\n",
    );
  }

  /**
   * DELETE request.
   * @param endpoint - The API endpoint (e.g. "/users/123").
   * @param data - Optional payload for the delete request.
   * @param options - Optional request configuration.
   * @returns JSON data of type T.
   */
  public async delete<T>(endpoint: string, data?: unknown, options?: ApiRequestOptions): Promise<T> {
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
        "An error occurred while deleting the data.\n",
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
        const cleanToken = token.startsWith("\"") ? token.slice(1,-1) : token
        headers["Authorization"] = `Bearer ${cleanToken}`;
      }
    }

    // Add any custom headers from options
    if (options?.headers) {
      Object.assign(headers, options.headers);
    }

    return headers;
  }

  // --- User Preferences API ---

  // Get all genres
  public async getGenres(): Promise<{ id: number; name: string }[]> {
    return this.get<{ id: number; name: string }[]>(`/movies/genres`, { skipAuth: true });
  }

  // Save genre preferences for a user
  public async saveUserGenres(userId: number, genreIds: string[]): Promise<UserPreferencesGenresDTO> {
    return this.post<UserPreferencesGenresDTO>(
      `/users/${userId}/preferences/genres`,
      { genreIds }
    );
  }

  // Get genre preferences for a user
  public async getUserGenres(userId: number): Promise<UserPreferencesGenresDTO> {
    return this.get<UserPreferencesGenresDTO>(`/users/${userId}/preferences/genres`);
  }

  // Save favorite movie for a user
  public async saveFavoriteMovie(userId: number, movieId: number): Promise<UserPreferencesFavoriteMovieDTO> {
    return this.post<UserPreferencesFavoriteMovieDTO>(
      `/users/${userId}/preferences/favorite-movie`,
      { movieId }
    );
  }

  // Get favorite movie for a user
  public async getFavoriteMovie(userId: number): Promise<{ movie: Movie }> {
    return this.get<{ movie: Movie }>(`/users/${userId}/preferences/favorite-movie`);
  }

  // Get all preferences for a user (genres + favorite movie)
  public async getUserPreferences(userId: number): Promise<UserPreferencesDTO> {
    return this.get<UserPreferencesDTO>(`/users/${userId}/preferences`);
  }
}