"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useApi } from "@/hooks/useApi";
import { useRouter } from "next/navigation";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { useState } from "react";
// import { Form } from "antd"; // npm install antd

const Register: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");
  // if you want to pick a different token, i.e "usertoken", the line above would look as follows: } = useLocalStorage<string>("usertoken", "");

  // State to manage form inputs
  const [formValues, setFormValues] = useState({
    email: "", //TODO: requirements for email & co.
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
  };

  const handleRegister = async () => {
    try {
      const response = await apiService.post<User>("/register", formValues);

      if (response.token) {
        setToken(response.token);
      }
      router.push("/users/[id]/profile");
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
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Username</Label>
              <Input
                id="username"
                placeholder="Input your Username"
                value={formValues.username}
                onChange={handleInputChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="framework">Password</Label>
              <Input
                id="password"
                placeholder="Input your password"
                value={formValues.password}
                onChange={handleInputChange}
              />
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
