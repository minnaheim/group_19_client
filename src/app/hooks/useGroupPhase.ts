import { useEffect, useState } from "react";
import { useApi } from "@/app/hooks/useApi";

export type GroupPhase = "POOLING" | "VOTING" | "RESULTS";

export interface GroupDetails {
  groupId: number;
  groupName: string;
  creatorId: number;
  memberIds: number[];
  movieIds: number[];
  phase: GroupPhase;
}

interface UseGroupPhaseResult {
  group: GroupDetails | null;
  phase: GroupPhase | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useGroupPhase(groupId?: string | number): UseGroupPhaseResult {
  const apiService = useApi();
  const [group, setGroup] = useState<GroupDetails | null>(null);
  const [phase, setPhase] = useState<GroupPhase | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGroup = async () => {
    if (!groupId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.get<GroupDetails>(`/groups/${groupId}`);
      setGroup(data);
      setPhase(data.phase);
    } catch (err: unknown) {
      let message = "Failed to fetch group details. Please try again.";
      if (err && typeof err === "object" && "message" in err) {
        message = (err as { message?: string }).message || message;
      }
      setError(message);
      setGroup(null);
      setPhase(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  return {
    group,
    phase,
    loading,
    error,
    refetch: fetchGroup,
  };
}
