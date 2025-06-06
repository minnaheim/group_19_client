import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import React, { useState } from "react";
import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";

import { useGroupPhase, GroupPhase } from "@/app/hooks/useGroupPhase";

interface SetTimerProps {
  groupId: number;
  isCreator: boolean;
  phase?: GroupPhase | null;
}

const parseHHMMSS = (value: string): number => {
  const parts = value.split(":").map(Number);
  if (parts.length === 3) {
    const [h, m, s] = parts;
    return h * 3600 + m * 60 + s;
  } else if (parts.length === 2) {
    const [m, s] = parts;
    return m * 60 + s;
  } else if (parts.length === 1) {
    return parts[0];
  }
  return 0;
};

const SetTimer: React.FC<SetTimerProps> = ({
  groupId,
  isCreator,
  phase: propPhase,
}) => {
  // Use the useGroupPhase hook to get the current phase if not provided via props
  const { phase: hookPhase } = useGroupPhase(groupId.toString());
  // Use the phase from props if available, otherwise use the one from the hook
  const phase = propPhase || hookPhase;
  const [votingInput, setVotingInput] = useState("00:05:00");
  const [poolInput, setPoolInput] = useState("00:05:00");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const apiService = useApi();

  if (!isCreator) return null;

  const handleSetVotingTimer = async () => {
    if (phase !== "VOTING") {
      setError("Voting timer can only be set during the VOTING phase");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const seconds = parseHHMMSS(votingInput);
      await apiService.post(`/groups/${groupId}/voting-timer`, seconds);
      await apiService.post(`/groups/${groupId}/start-voting-timer`, {});
      setMessage("Voting Timer started!");
      setOpen(true); // Close the dialog
    } catch {
      setError("Failed to set and start Voting Timer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPoolTimer = async () => {
    if (phase !== "POOLING") {
      setError("Pool timer can only be set during the POOLING phase");
      return;
    }

    setLoading(true);
    setMessage("");
    setError("");
    try {
      const seconds = parseHHMMSS(poolInput);
      await apiService.post(`/groups/${groupId}/pool-timer`, seconds);
      await apiService.post(`/groups/${groupId}/start-pool-timer`, {});
      setMessage("Pool Timer started!");
      setOpen(false); // Close the dialog
    } catch {
      setError("Failed to set pool timer.");
    } finally {
      setLoading(false);
    }
  };

  // const handleStartPoolTimer = async () => {
  //   setLoading(true);
  //   setMessage("");
  //   setError("");
  //   try {
  //     await apiService.post(`/groups/${groupId}/start-pool-timer`, {});
  //     setMessage("Pool timer started!");
  //     setOpen(false); // Close the dialog
  //   } catch {
  //     setError("Failed to start pool timer.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Set Time Limit</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#3b3e88]">Set Phase Timers</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3 w-full">
          <div className="flex items-center gap-2 w-full">
            <label
              htmlFor="pool-seconds"
              className="font-medium text-[#838bad]"
            >
              Time to Pool (HH:MM:SS):
            </label>
            <input
              id="pool-seconds"
              type="text"
              pattern="^\\d{2}:\\d{2}:\\d{2}$"
              value={poolInput}
              onChange={(e) => setPoolInput(e.target.value)}
              className="border rounded px-2 py-1 w-24"
              placeholder="00:05:00"
              disabled={loading}
            />
            <Button
              onClick={handleSetPoolTimer}
              disabled={loading || poolInput === "00:00:00"}
              className={
                phase !== "POOLING" ? "opacity-50 cursor-not-allowed" : ""
              }
              title={
                phase !== "POOLING"
                  ? "Pool timer can only be set during the POOLING phase"
                  : ""
              }
            >
              Set Pool Time
            </Button>
          </div>

          {/* Voting Timer Section */}
          <div className="flex items-center gap-2 w-full">
            <label
              htmlFor="voting-seconds"
              className="font-medium text-[#838bad]"
            >
              Time to Vote (HH:MM:SS):
            </label>
            <input
              id="voting-seconds"
              type="text"
              pattern="^\\d{2}:\\d{2}:\\d{2}$"
              value={votingInput}
              onChange={(e) => setVotingInput(e.target.value)}
              className="border rounded px-2 py-1 w-24"
              placeholder="00:05:00"
              disabled={loading}
            />
            <Button
              onClick={handleSetVotingTimer}
              disabled={loading || votingInput === "00:00:00"}
              className={
                phase !== "VOTING" ? "opacity-50 cursor-not-allowed" : ""
              }
              title={
                phase !== "VOTING"
                  ? "Voting timer can only be set during the VOTING phase"
                  : ""
              }
            >
              Set Voting Time
            </Button>
          </div>
          {message && (
            <div className="text-green-600 text-sm mb-1">{message}</div>
          )}
          {error && <div className="text-red-600 text-sm mb-1">{error}</div>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SetTimer;
