import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useApi } from "./useApi";
import { GroupPhase } from "./useGroupPhase";

const phaseToPath: Record<GroupPhase, string> = {
  POOLING: "pool",
  VOTING: "vote",
  RESULTS: "results",
};

export function usePhaseCheck(
  groupId: string | string[] | undefined,
  currentPhase: GroupPhase | null,
) {
  const router = useRouter();
  const params = useParams();
  const apiService = useApi();

  useEffect(() => {
    if (!groupId || !currentPhase) return;

    // Convert groupId to string if it's an array
    const groupIdStr = Array.isArray(groupId) ? groupId[0] : groupId;
    const userId = Array.isArray(params.id) ? params.id[0] : params.id;

    // Function to check the current phase
    const checkPhase = async () => {
      try {
        // Use the ApiService to make API calls
        const data = await apiService.get<{ phase: GroupPhase }>(
          `/groups/${groupIdStr}`,
        );
        const newPhase = data.phase;

        // Log for debugging
        console.log(
          `Current page phase: ${currentPhase}, server phase: ${newPhase}`,
        );
        console.log(`Current path: ${window.location.pathname}`);

        // If the phase has changed, navigate to the correct page
        if (newPhase && newPhase !== currentPhase) {
          const targetPath = `/users/${userId}/groups/${groupIdStr}/${
            phaseToPath[newPhase]
          }`;
          console.log(
            `Phase change detected! From ${currentPhase} to ${newPhase}, navigating to ${targetPath}`,
          );

          // Hard navigation to ensure page reload
          window.location.href = targetPath;
        }
      } catch (error) {
        console.error("Error checking phase:", error);
      }
    };

    // Check phase change every 1 second
    const intervalId = setInterval(checkPhase, 1000);

    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [groupId, currentPhase, router, params.id, apiService]);
}

export default usePhaseCheck;
