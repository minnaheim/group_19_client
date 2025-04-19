import { ApiService } from "@/app/api/apiService";
import { useMemo } from "react"; // think of usememo like a singleton, it ensures only one instance exists
import useLocalStorage from "./useLocalStorage";

export const useApi = () => {
  const { value: token } = useLocalStorage<string>("token", "");
  
  return useMemo(() => {
    const apiService = new ApiService();
    // Force token refresh from localStorage on each hook call
    return apiService;
  }, [token]); // Recreate API service when token changes
};
