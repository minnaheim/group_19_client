"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { User } from "@/app/types/user";
import { useState } from "react";

// Define the response type based on your API implementation
interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
  });

  const [errors, setErrors] = useState({
    username: "",
    password: "",
  });

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [id]: value,
    }));
    // clear error message
    setErrors((prev) => ({
      ...prev,
      [id]: "",
    }));
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {
      username: "",
      password: "",
    };

    // Check if username is empty
    if (!formValues.username) {
      newErrors.username = "Username is required.";
    }

    // Check if password is empty
    if (!formValues.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    // Return true if there are no errors
    return !newErrors.username && !newErrors.password;
  };

  const handleLogin = async () => {
    if (!validateForm()) {
      return;
    }
    try {
      console.log(formValues);

      // Use the correct type for your API response
      const response = await apiService.post<User>("/login", formValues);
      console.log(response);

      // Based on your REST specs, the login endpoint returns a User object
      // The token should be in the headers
      if (response && typeof response === 'object') {
        // Handle case where apiService returns a User object
        if ('userId' in response) {
          // It's a User object
          const userData = response as User;
          setUserId(userData.userId.toString());

          // If the token is in the User object
          if (userData.token) {
            setToken(userData.token.replace("Bearer ", ""));
          }

          router.push(`/users/${userData.userId}/profile`);
        }
        // Handle case where apiService returns {data, headers}
        else if ('data' in response && 'headers' in response) {
          const apiResponse = response as unknown as ApiResponse<User>;
          const userData = apiResponse.data;
          const headers = apiResponse.headers;

          // Get token from headers
          const token = headers?.get("Authorization") ||
              headers?.get("authorization");

          if (token) {
            setToken(token.replace("Bearer ", ""));
          }

          setUserId(userData.userId.toString());
          router.push(`/users/${userData.userId}/profile`);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the login:\n${error}`);
      } else {
        console.error("An unknown error occurred during login.");
      }
    }
  };

  return (
      <Card>
        <CardContent className="space-y-2">
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    placeholder="Input your Username"
                    value={formValues.username}
                    onChange={handleInputChange}
                />
                {errors.username && (
                    <p className="text-red-500 text-sm">{errors.username}</p>
                )}
              </div>
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input
                    id="password"
                    type="password"
                    placeholder="Input your password"
                    value={formValues.password}
                    onChange={handleInputChange}
                />
                {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button variant="destructive" onClick={() => router.push("/")}>
            Back
          </Button>
          <Button onClick={handleLogin}>Login</Button>
        </CardFooter>
      </Card>
  );
};

export default Login;