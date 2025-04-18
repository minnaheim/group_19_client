"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { User } from "@/app/types/user";
import { useState } from "react";
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

  const [loginError, setLoginError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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
    setLoginError("");
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

    setIsLoading(true);
    setLoginError("");

    try {
      // Based on your backend controller, the login endpoint returns a User object directly
      const userData = await apiService.post<User>("/login", formValues);

      if (userData && userData.userId) {
        // Store the user ID
        setUserId(userData.userId.toString());

        // Store the token - in Spring Boot REST APIs, the token is typically returned as a field in the response
        if (userData.token) {
          setToken(userData.token.replace("Bearer ", ""));
        }

        // Navigate to the user profile page
        router.push(`/users/${userData.userId}/profile`);
      } else {
        setLoginError("Invalid response received from server");
      }
    } catch (error) {
      console.error("Login error:", error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes("401") || error.message.includes("Unauthorized")) {
          setLoginError("Invalid username or password");
        } else if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
          setLoginError("Network error. Please check your connection and try again.");
        } else {
          setLoginError(`Login failed: ${error.message}`);
        }
      } else {
        setLoginError("An unknown error occurred during login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-center mb-6">Login</h2>

          {loginError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <p>{loginError}</p>
              </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="username">Username</Label>
                <Input
                    id="username"
                    placeholder="Enter your username"
                    value={formValues.username}
                    onChange={handleInputChange}
                    autoComplete="username"
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
                    placeholder="Enter your password"
                    value={formValues.password}
                    onChange={handleInputChange}
                    autoComplete="current-password"
                />
                {errors.password && (
                    <p className="text-red-500 text-sm">{errors.password}</p>
                )}
              </div>
            </div>
          </form>
        </CardContent>
        <CardFooter className="flex justify-between">
          <Button
              variant="outline"
              onClick={() => router.push("/")}
              disabled={isLoading}
          >
            Back
          </Button>
          <Button
              onClick={handleLogin}
              disabled={isLoading}
          >
            {isLoading ? "Logging in..." : "Login"}
          </Button>
        </CardFooter>
        <div className="text-center pb-4">
          <p className="text-sm text-gray-500">
            Don&#39;t have an account?{" "}
            <a
                href="/register"
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/register");
                }}
            >
              Register here
            </a>
          </p>
        </div>
      </Card>
  );
};

export default Login;