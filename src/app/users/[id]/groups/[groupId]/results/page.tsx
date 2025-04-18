"use client";

import { Movie } from "@/app/types/movie";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import Navigation from "@/components/ui/navigation";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useApi } from "@/app/hooks/useApi";

const Results: React.FC = () => {
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const { value: groupId } = useLocalStorage<string>("groupId", "");
  const [results, setResults] = useState<Movie[]>([]);
  // TODO: find out format of average rank
  const [averageRank, setAverageRank] = useState<string>("");
  const apiService = useApi();

  // Fetch results
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await apiService.get<Movie[]>(
          `/groups/${groupId}/results`
        );
        setResults(response);
      } catch (error) {
        console.error("Failed to fetch winning movie:", error);
        alert(
          "An error occurred while fetching the winning movie. Please try again."
        );
      }
    };
    fetchResults();
  }, [apiService, groupId]);

  // get average rank of winning movie

  useEffect(() => {
    const fetchAverageRank = async () => {
      try {
        // TODO: find out accurate endpoint here
        const response = await apiService.get<string>(
          `/groups/${groupId}/results`
        );
        setAverageRank(response);
      } catch (error) {
        console.error("Failed to fetch average rank:", error);
        alert(
          "An error occurred while fetching the average rank. Please try again."
        );
      }
    };
    fetchAverageRank();
  }, [apiService, groupId]);

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      {/* Sidebar navigation */}
      <Navigation userId={userId} activeItem=" Movie Groups" />

      {/* Main content */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-semibold text-[#3b3e88] text-3xl">Results</h1>
        </div>

        {/* Winner Section */}
        <div className="flex flex-col items-center justify-center text-center">
          {results.length > 0 ? (
            <>
              <h2 className="font-semibold text-[#3b3e88] text-xl mb-4">
                And the winner is ...
              </h2>
              <div className="relative w-[200px] h-[300px] md:w-[250px] md:h-[375px] rounded-lg shadow-lg overflow-hidden">
                <img
                  src={results[0].posterURL}
                  alt={results[0].title}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="font-semibold text-[#3b3e88] text-xl mt-4">
                {results[0].title}
              </h2>
              <p className="text-[#b9c0de] text-lg mt-2">
                ... with an average rank of {averageRank}!
              </p>
            </>
          ) : (
            <p className="text-[#b9c0de] text-lg mt-2">Loading results...</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mt-8">
          <Button
            variant="destructive"
            onClick={() => router.push(`/users/${userId}/dashboard`)}
          >
            Back
          </Button>
          <Button onClick={() => router.push(`/users/${userId}/dashboard`)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Results;
