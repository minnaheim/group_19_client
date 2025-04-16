"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApi } from "@/app/hooks/useApi";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { User } from "@/app/types/user";
import { useState } from "react";

// Define the response type based on your API implementation
interface ApiResponse<T> {
  data: T;
  headers: Headers;
}

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  const { set: setUserId } = useLocalStorage<string>("userId", "");
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  // State to manage form inputs
  const [formValues, setFormValues] = useState({
    username: "",
    password: "",
    email: "",
  });

  // set error if fields are empty
  const [errors, setErrors] = useState({
    email: "",
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
      email: "",
      username: "",
      password: "",
    };

    // Check if email is valid
    if (!formValues.email) {
      newErrors.email = "Email is required.";
      // email regex needs to be met
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
    try {
      console.log(formValues);

      // Use the correct type for your API response
      const response = await apiService.post<User>("/register", formValues);
      console.log(response);

      // Based on your REST specs, the register endpoint returns a User object
      if (response && typeof response === "object") {
        // Handle case where apiService returns a User object
        if ("userId" in response) {
          // It's a User object
          const userData = response as User;
          setUserId(userData.userId.toString());

          // If the token is in the User object
          if (userData.token) {
            setToken(userData.token.replace("Bearer ", ""));
          }
        }
        // Handle case where apiService returns {data, headers}
        else if ("data" in response && "headers" in response) {
          const apiResponse = response as unknown as ApiResponse<User>;
          const userData = apiResponse.data;
          const headers = apiResponse.headers;

          // Get token from headers
          const token =
            headers?.get("Authorization") || headers?.get("authorization");

          if (token) {
            setToken(token.replace("Bearer ", ""));
          }

          // Store user ID if available
          if (userData && userData.userId) {
            setUserId(userData.userId.toString());
          }
        }
      }

      // Navigate to preferences page after successful registration
      router.push("/preferences");
    } catch (error) {
      if (error instanceof Error) {
        alert(`Something went wrong during the registration:\n ${error}`);
      } else {
        console.error("An unknown error occurred during registration.");
      }
    }
  };

  return (
    <Card>
      <CardContent className="space-y-2">
        <form>
          <div className="grid w-full items-center gap-4">
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="Input your Email"
                value={formValues.email} // initially empty unless changed
                onChange={handleInputChange}
              />
              {errors.email && (
                <p className="text-red-500 text-sm">{errors.email}</p>
              )}
            </div>
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
        <Button onClick={handleRegister}>Register</Button>
      </CardFooter>
    </Card>
  );
};

export default Register;
