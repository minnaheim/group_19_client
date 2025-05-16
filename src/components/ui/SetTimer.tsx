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

interface SetTimerProps {
  groupId: number;
  isCreator: boolean;
}

const SetTimer: React.FC<SetTimerProps> = ({ groupId, isCreator }) => {
  const [votingSeconds, setVotingSeconds] = useState(120);
  const [poolSeconds, setPoolSeconds] = useState(120);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [open, setOpen] = useState(false);
  const apiService = useApi();

  if (!isCreator) return null;

  const handleSetVotingTimer = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiService.post(`/groups/${groupId}/voting-timer`, votingSeconds);
      setMessage("Set voting Timer");
    } catch {
      setError("Failed to set voting timer.");
    } finally {
      setLoading(false);
    }
  };

  const handleSetPoolTimer = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiService.post(`/groups/${groupId}/pool-timer`, poolSeconds);
      setMessage("Set pool Timer");
    } catch {
      setError("Failed to set pool timer.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartPoolTimer = async () => {
    setLoading(true);
    setMessage("");
    setError("");
    try {
      await apiService.post(`/groups/${groupId}/start-pool-timer`, {});
      setMessage("Pool timer started!");
      setOpen(false); // Close the dialog
    } catch {
      setError("Failed to start pool timer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Set Timers</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-[#3b3e88]">
            Set Voting and Pool Timers
          </DialogTitle>
        </DialogHeader>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="voting-seconds"
              className="font-medium text-[#838bad]"
            >
              Voting Seconds:
            </label>
            <input
              id="voting-seconds"
              type="number"
              min={0}
              value={votingSeconds}
              onChange={(e) => setVotingSeconds(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
              placeholder="Voting Seconds"
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label
              htmlFor="pool-seconds"
              className="font-medium text-[#838bad]"
            >
              Pool Seconds:
            </label>
            <input
              id="pool-seconds"
              type="number"
              min={0}
              value={poolSeconds}
              onChange={(e) => setPoolSeconds(Number(e.target.value))}
              className="border rounded px-2 py-1 w-24"
              placeholder="Pool Seconds"
              disabled={loading}
            />
          </div>
          <div className="flex items-center gap-2 mb-2">
            <Button
              onClick={handleSetPoolTimer}
              disabled={loading || poolSeconds <= 0}
            >
              Set Pool Time
            </Button>
            <Button
              onClick={handleSetVotingTimer}
              disabled={loading || votingSeconds <= 0}
            >
              Set Voting Time
            </Button>
            <Button onClick={handleStartPoolTimer} disabled={loading}>
              Start Pool Timer
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
