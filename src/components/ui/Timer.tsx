import React, { useEffect, useRef, useState } from "react";
import { useApi } from "@/app/hooks/useApi";
import { useGroupPhase } from "@/app/hooks/useGroupPhase";
import ErrorMessage from "@/components/ui/ErrorMessage";

interface TimerProps {
  groupId: string;
}

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;
};

const Timer: React.FC<TimerProps> = ({ groupId }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const [showTimeoutError, setShowTimeoutError] = useState(false);
  const apiService = useApi();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { phase } = useGroupPhase(groupId);

  useEffect(() => {
    let isMounted = true;
    const fetchTime = async () => {
      try {
        const seconds = await apiService.get<number>(
          `/groups/${groupId}/timer`
        );
        if (isMounted) {
          setRemaining(seconds);
          setNoTimeLimit(false);
          setShowTimeoutError(false);
        }
      } catch {
        setNoTimeLimit(true);
      }
    };
    fetchTime();
    pollIntervalRef.current = setInterval(() => {
      fetchTime();
    }, 5000);
    return () => {
      isMounted = false;
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (localIntervalRef.current) clearInterval(localIntervalRef.current);
    };
  }, [apiService, groupId]);

  // Local decrement interval
  useEffect(() => {
    if (remaining === null || remaining <= 0 || noTimeLimit) {
      if (localIntervalRef.current) clearInterval(localIntervalRef.current);
      if (remaining === 0 && phase === "VOTING") {
        setShowTimeoutError(true);
      }
      return;
    }
    localIntervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => {
      if (localIntervalRef.current) clearInterval(localIntervalRef.current);
    };
  }, [remaining, noTimeLimit, phase]);

  if (noTimeLimit) return <span>No time limit</span>;
  if (remaining === null) return <span>Loading Timer...</span>;
  if (remaining <= 0) {
    return (
      <div className="space-y-2">
        <span>Time&apos;s up!</span>
        {showTimeoutError && phase === "VOTING" && (
          <ErrorMessage
            message="The voting time has expired. You will be redirected to the results page."
            onClose={() => setShowTimeoutError(false)}
          />
        )}
      </div>
    );
  }

  return (
    <span
      style={{
        color: remaining < 60 ? "#e3342f" : undefined,
        fontWeight: "bold",
      }}
    >
      {formatTime(remaining)}
    </span>
  );
};

export default Timer;
