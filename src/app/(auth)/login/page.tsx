"use client";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation"; // use NextJS router for navigation
import { useApi } from "@/hooks/useApi";
import useLocalStorage from "@/hooks/useLocalStorage";
import { User } from "@/types/user";
import { useState } from "react";

const Login: React.FC = () => {
  const router = useRouter();
  const apiService = useApi();
  const { set: setToken } = useLocalStorage<string>("token", "");

  const [formValues, setFormValues] = useState({
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

  const handleLogin = async () => {
    try {
      console.log(formValues);
      const response = await apiService.put<User>("/login", formValues); // changed post to put -> TODO: need to change to ONLINE
      if (response.token) {
        console.log(response.token);
        setToken(response.token);
      }

      // Navigate to the user overview
      router.push("/users/[id]/profile"); // changed to users instead of users/dashboard
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
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="password">Password</Label>
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
        <Button onClick={handleLogin}>Login</Button>
      </CardFooter>
    </Card>
  );
};

export default Login;

// from https://nextjs.org/docs/pages/building-your-application/authentication
// import { FormEvent } from 'react'
// import { useRouter } from 'next/router'

// export default function LoginPage() {
//   const router = useRouter()

//   async function handleSubmit(event: FormEvent<HTMLFormElement>) {
//     event.preventDefault()

//     const formData = new FormData(event.currentTarget)
//     const email = formData.get('email')
//     const password = formData.get('password')

//     const response = await fetch('/api/auth/login', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ email, password }),
//     })

//     if (response.ok) {
//       router.push('/profile')
//     } else {
//       // Handle errors
//     }
//   }

//   return (
//     <form onSubmit={handleSubmit}>
//       <input type="email" name="email" placeholder="Email" required />
//       <input type="password" name="password" placeholder="Password" required />
//       <button type="submit">Login</button>
//     </form>
//   )
// }
