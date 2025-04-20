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

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");

  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
    email: "",
  });

  const [errors, setErrors] = useState({
    email: "",
    username: "",
    password: "",
  });

  const [registerError, setRegisterError] = useState("");
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
    setRegisterError("");
  };

  // Validate form inputs
  const validateForm = () => {
    const newErrors = {
      email: "",
      username: "",
      password: "",
    };

    // Check if email is valid
    if (!formValues.email) {
      newErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

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
    return !newErrors.email && !newErrors.username && !newErrors.password;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setRegisterError("");

    try {
      // Based on your backend controller, the register endpoint returns a User object directly
      const userData = await apiService.post<User>("/register", formValues);

      if (userData && userData.userId) {
        // Store the user ID
        setUserId(userData.userId.toString());

        // Store the token if available
        if (userData.token) {
          setToken(userData.token.replace("Bearer ", ""));
        }

        // Navigate to genre preferences page after successful registration
        router.push("/genre_preferences");
      } else {
        setRegisterError("Invalid response received from server");
      }
    } catch (error) {
      console.error("Registration error:", error);

      // Handle different types of errors
      if (error instanceof Error) {
        if (error.message.includes("409") || error.message.includes("Conflict")) {
          setRegisterError("Username or email already exists");
        } else if (error.message.includes("Network Error") || error.message.includes("Failed to fetch")) {
          setRegisterError("Network error. Please check your connection and try again.");
        } else {
          setRegisterError(`Registration failed: ${error.message}`);
        }
      } else {
        setRegisterError("An unknown error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="space-y-4 pt-6">
          <h2 className="text-2xl font-bold text-center mb-6">Register</h2>

          {registerError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                <p>{registerError}</p>
              </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleRegister(); }}>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    placeholder="Enter your email"
                    value={formValues.email}
                    onChange={handleInputChange}
                    autoComplete="email"
                />
                {errors.email && (
                    <p className="text-red-500 text-sm">{errors.email}</p>
                )}
              </div>
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
                    autoComplete="new-password"
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
              onClick={handleRegister}
              disabled={isLoading}
          >
            {isLoading ? "Registering..." : "Register"}
          </Button>
        </CardFooter>
        <div className="text-center pb-4">
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <a
                href="/login"
                className="text-blue-600 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  router.push("/login");
                }}
            >
              Login here
            </a>
          </p>
        </div>
      </Card>
  );
};

export default Register;