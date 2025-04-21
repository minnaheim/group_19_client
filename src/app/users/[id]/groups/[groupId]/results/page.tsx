"use client";
import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import {useParams, useRouter} from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/app/hooks/useApi";

// Define interfaces for the data coming from the backend
interface MovieAverageRankDTO {
  movie: Movie;
  averageRank: number | null;
}

interface RankingResultGetDTO {
  resultId: number;
  groupId: number;
  calculatedAt: string;
  winningMovie: Movie;
  numberOfVoters: number;
}


const Results: React.FC = () => {
  const {id, groupId} = useParams();
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const [rankingResult, setRankingResult] = useState<RankingResultGetDTO | null>(null);
  const [detailedResults, setDetailedResults] = useState<MovieAverageRankDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const apiService = useApi();

  // Fetch ranking result
  useEffect(() => {
    const fetchRankingResult = async () => {
      if (!groupId || !id) return;

      try {
        setLoading(true);
        // Using the endpoint from your backend controller
        const response = await apiService.get<RankingResultGetDTO>(
            `/groups/${groupId}/rankings/result`
        );
        setRankingResult(response);
      } catch (error) {
        console.error("Failed to fetch ranking result:", error);
        // We'll handle this in the UI rather than showing an alert
      } finally {
        setLoading(false);
      }
    };

    fetchRankingResult();
  }, [apiService, groupId]);

  // Fetch detailed ranking results
  useEffect(() => {
    const fetchDetailedResults = async () => {
      if (!groupId) return;

      try {
        // Using the detailed rankings endpoint from your backend controller
        const response = await apiService.get<MovieAverageRankDTO[]>(
            `/groups/${groupId}/rankings/details`
        );
        setDetailedResults(response);
      } catch (error) {
        console.error("Failed to fetch detailed ranking results:", error);
        // We'll handle this in the UI
      }
    };

    fetchDetailedResults();
  }, [apiService, groupId]);

  // Helper function to get complete image URL
  const getFullPosterUrl = (posterPath: string) => {
    return `https://image.tmdb.org/t/p/w500${posterPath}`;
  };

  // Helper function to format the average rank for display
  const formatAverageRank = (rank: number | null): string => {
    if (rank === null) return "N/A";
    return rank.toFixed(2);
  };

  return (
      <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
        {/* Sidebar navigation */}
        <Navigation userId={userId} activeItem=" Movie Groups" />

        {/* Main content */}
        <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="font-semibold text-[#3b3e88] text-3xl">Movie Ranking Results</h1>
            <p className="text-[#b9c0de] mt-2">See what your group has chosen to watch</p>
          </div>

          {/* Winner Section */}
          <div className="flex flex-col items-center justify-center text-center mb-12">
            {loading ? (
                <p className="text-[#b9c0de] text-lg mt-2">Loading results...</p>
            ) : rankingResult ? (
                <>
                  <h2 className="font-semibold text-[#3b3e88] text-2xl mb-6">
                    And the winner is...
                  </h2>
                  <div className="relative w-[200px] h-[300px] md:w-[250px] md:h-[375px] rounded-lg shadow-lg overflow-hidden mb-4">
                    <img
                        src={getFullPosterUrl(rankingResult.winningMovie.posterURL)}
                        alt={rankingResult.winningMovie.title}
                        className="w-full h-full object-cover"
                    />
                  </div>
                  <h2 className="font-semibold text-[#3b3e88] text-2xl mt-4">
                    {rankingResult.winningMovie.title}
                  </h2>

                  {detailedResults.length > 0 && (
                      <p className="text-[#b9c0de] text-lg mt-2">
                        With an average rank of {formatAverageRank(
                          detailedResults.find(item =>
                              item.movie.movieId === rankingResult.winningMovie.movieId
                          )?.averageRank || null
                      )}!
                      </p>
                  )}

                  <p className="text-[#b9c0de] mt-2">
                    Based on votes from {rankingResult.numberOfVoters} group members
                  </p>
                </>
            ) : (
                <div className="text-center p-6 bg-white rounded-lg shadow-md">
                  <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                    No Results Available Yet
                  </h2>
                  <p className="text-[#b9c0de] mb-4">
                    It looks like the voting period is still ongoing or not enough members have voted yet.
                  </p>
                  <p className="text-[#b9c0de]">
                    Check back later to see the winning movie!
                  </p>
                </div>
            )}
          </div>

          {/* All Rankings Section (if we have detailed results) */}
          {detailedResults.length > 0 && (
              <div className="mb-8">
                <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">All Rankings</h2>
                <div className="bg-white rounded-lg shadow-md p-4">
                  <table className="w-full">
                    <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-2 text-[#3b3e88]">Rank</th>
                      <th className="text-left py-2 text-[#3b3e88]">Movie</th>
                      <th className="text-right py-2 text-[#3b3e88]">Average Score</th>
                    </tr>
                    </thead>
                    <tbody>
                    {detailedResults.map((item, index) => (
                        <tr key={item.movie.movieId} className="border-b border-gray-100">
                          <td className="py-2 text-[#3b3e88]">{index + 1}</td>
                          <td className="py-2 text-[#3b3e88]">{item.movie.title}</td>
                          <td className="py-2 text-right text-[#3b3e88]">
                            {formatAverageRank(item.averageRank)}
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
                variant="outline"
                onClick={() => router.push(`/users/${userId}/groups/${groupId}/pool`)}
            >
              Back to Pool
            </Button>
            <Button onClick={() => router.push(`/users/${userId}/dashboard`)}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
  );
};

export default Results;