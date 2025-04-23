"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { useApi } from "@/app/hooks/useApi";
import { Button } from "@/components/ui/button";
import Navigation from "@/components/ui/navigation";
import { retry } from 'src/utils/retry';

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { value: userId } = useLocalStorage<string>("userId", "");
  const router = useRouter();
  const apiService = useApi();

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const group = await retry(() => apiService.post("/groups", {
        groupName,
        creatorId: userId
      }));
      router.replace(`/users/${userId}/groups/${group.groupId}/pool`);
    } catch (err: unknown) {
      setError(err?.message || "Failed to create group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#ebefff] flex flex-col md:flex-row min-h-screen w-full">
      <Navigation userId={userId} activeItem="Movie Groups" />
      <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col items-center justify-center">
        <form onSubmit={handleCreateGroup} className="bg-white rounded-lg shadow-md p-8 w-full max-w-md flex flex-col gap-6">
          <h1 className="text-2xl font-bold text-[#3b3e88] mb-2">Create a New Group</h1>
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group Name"
            className="border border-[#b9c0de] rounded px-4 py-2 text-lg focus:outline-none focus:ring-2 focus:ring-blue-200"
            required
            minLength={2}
            maxLength={50}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={loading || !groupName.trim()}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Cancel
          </Button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;
