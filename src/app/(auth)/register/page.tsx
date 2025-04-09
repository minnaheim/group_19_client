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
// import { Form } from "antd"; // npm install antd

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  // State to manage form inputs
  const [formValues, setFormValues] = useState({
    email: "",
    username: "",
    password: "",
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
      const [response, headers] = await apiService.post<User>(
        "/register",
        formValues
      );
      console.log(response);
      const token =
        headers.get("Authorization") || headers.get("authorization");
      if (token) {
        setToken(token.replace("Bearer", "")); // if it has bearer prefix, remove it
      }
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
              <Label htmlFor="name">Email</Label>
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
              <Label htmlFor="framework">Username</Label>
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
              <Label htmlFor="framework">Password</Label>
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
