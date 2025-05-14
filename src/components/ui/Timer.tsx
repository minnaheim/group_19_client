import React, { useEffect, useState, useRef } from "react";
import { useApi } from "@/app/hooks/useApi";

interface TimerProps {
  groupId: string;
}

const formatTime = (seconds: number) => {
  const h = Math.floor(seconds / 3600)
    .toString()
    .padStart(2, "0");
  const m = Math.floor((seconds % 3600) / 60)
    .toString()
    .padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${h}:${m}:${s}`;
};

const Timer: React.FC<TimerProps> = ({ groupId }) => {
  const [remaining, setRemaining] = useState<number | null>(null);
  const [noTimeLimit, setNoTimeLimit] = useState(false);
  const apiService = useApi();
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const localIntervalRef = useRef<NodeJS.Timeout | null>(null);

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
      return;
    }
    localIntervalRef.current = setInterval(() => {
      setRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
    }, 1000);
    return () => {
      if (localIntervalRef.current) clearInterval(localIntervalRef.current);
    };
  }, [remaining, noTimeLimit]);

  if (noTimeLimit) return <span>No time limit</span>;
  if (remaining === null) return <span>Loading Timer...</span>;
  if (remaining <= 0) return <span>Time's up!</span>;

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
