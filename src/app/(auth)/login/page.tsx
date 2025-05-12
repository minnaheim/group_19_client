"use client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useApi } from "@/app/hooks/useApi";
import useLocalStorage from "@/app/hooks/useLocalStorage";
import { User } from "@/app/types/user";
import { useState } from "react";
import ErrorMessage from "@/components/ui/ErrorMessage";
import Image from "next/image";
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

  const handleLogin = async (): Promise<void> => {
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
        router.push(`/users/${userData.userId}/dashboard`);
      } else {
        setLoginError("Invalid response received from server");
      }
    } catch (error) {
      console.error("Login error:", error);
      let userMessage = "An unknown error occurred during login.";
      // Type guard for Axios-like error
      type ErrorWithResponse = {
        response: { status: number; data?: { message?: string } };
      };
      if (
        typeof error === "object" &&
        error !== null &&
        "response" in error &&
        typeof (error as ErrorWithResponse).response === "object" &&
        (error as ErrorWithResponse).response !== null &&
        "status" in (error as ErrorWithResponse).response
      ) {
        const errResp = (error as ErrorWithResponse).response;
        switch (errResp.status) {
          case 400:
            userMessage = "Please enter both username/email and password.";
            break;
          case 404:
            userMessage =
              "We couldn't find an account with that username/email. Do you want to register?";
            break;
          case 401:
            userMessage = "Incorrect password. Please try again.";
            break;
          default:
            userMessage = errResp.data?.message || userMessage;
        }
      } else if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          userMessage = "Incorrect password. Please try again.";
        } else if (error.message.includes("404")) {
          userMessage =
            "We couldn't find an account with that username/email. Do you want to register?";
        } else if (error.message.includes("400")) {
          userMessage = "Please enter both username/email and password.";
        } else if (
          error.message.includes("Network Error") ||
          error.message.includes("Failed to fetch")
        ) {
          userMessage =
            "Network error. Please check your connection and try again.";
        } else {
          userMessage = `Login failed: ${error.message}`;
        }
      }
      setLoginError(userMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#ebefff] min-h-screen flex flex-col">
      {/* Header with Logo */}
      <header className="p-4 sm:p-6">
        <div
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => router.push("/")}
        >
          <Image
            src="/Projector.png"
            alt="App Icon"
            width={40}
            height={40}
            className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12"
          />
          <div className="ml-2 sm:ml-4 font-semibold text-[#3b3e88] text-base sm:text-lg md:text-xl">
            Movie Night
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6 sm:py-8 md:py-12">
        <div className="w-full max-w-md mx-auto">
          {/* Decorative elements - hidden on smallest screens */}
          <div className="relative mb-4 sm:mb-6 hidden sm:block">
            <div className="absolute -top-10 -right-10 w-24 sm:w-32 h-24 sm:h-32 bg-rose-500 rounded-full transform rotate-12 opacity-20 blur-xl">
            </div>
            <div className="absolute bottom-10 -left-10 w-32 sm:w-40 h-32 sm:h-40 bg-orange-500 rounded-full opacity-20 blur-xl">
            </div>
          </div>

          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden border-0 relative z-10">
            {/* Decorative top bar */}
            <div className="h-1 sm:h-2 bg-gradient-to-r from-orange-400 to-rose-500">
            </div>

            <div className="p-5 sm:p-6 md:p-8">
              <div className="text-center mb-6 sm:mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#3b3e88]">
                  Welcome Back
                </h2>
                <p className="text-[#b9c0de] mt-1 sm:mt-2 text-sm sm:text-base">
                  Sign in to continue planning amazing movie nights
                </p>
              </div>

              {loginError && (
                <ErrorMessage
                  message={loginError}
                  onClose={() => setLoginError("")}
                />
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleLogin();
                }}
                className="space-y-4 sm:space-y-6"
              >
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex flex-col space-y-1 sm:space-y-2">
                    <Label
                      htmlFor="username"
                      className="text-xs sm:text-sm font-medium text-[#3b3e88]"
                    >
                      Username
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9c0de]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          >
                          </path>
                        </svg>
                      </div>
                      <Input
                        id="username"
                        placeholder="Enter your username"
                        value={formValues.username}
                        onChange={handleInputChange}
                        autoComplete="username"
                        className="pl-10 p-2 sm:p-3 text-sm sm:text-base border border-[#b9c0de]/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-[#ebefff]/50"
                        style={{ paddingLeft: "2.5rem" }}
                      />
                    </div>
                    {errors.username && (
                      <ErrorMessage
                        message={errors.username}
                        onClose={() =>
                          setErrors((prev) => ({ ...prev, username: "" }))}
                      />
                    )}
                  </div>

                  <div className="flex flex-col space-y-1 sm:space-y-2">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="password"
                        className="text-xs sm:text-sm font-medium text-[#3b3e88]"
                      >
                        Password
                      </Label>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg
                          className="w-4 h-4 sm:w-5 sm:h-5 text-[#b9c0de]"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          >
                          </path>
                        </svg>
                      </div>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={formValues.password}
                        onChange={handleInputChange}
                        autoComplete="current-password"
                        className="pl-10 p-2 sm:p-3 text-sm sm:text-base border border-[#b9c0de]/30 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-[#ebefff]/50"
                        style={{ paddingLeft: "2.5rem" }}
                      />
                    </div>
                    {errors.password && (
                      <ErrorMessage
                        message={errors.password}
                        onClose={() =>
                          setErrors((prev) => ({ ...prev, password: "" }))}
                      />
                    )}
                  </div>
                </div>

                <div className="pt-1 sm:pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl font-medium transition duration-200 h-10 sm:h-12 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    {isLoading
                      ? (
                        <div className="flex items-center justify-center">
                          <svg
                            className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            >
                            </circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            >
                            </path>
                          </svg>
                          Signing in...
                        </div>
                      )
                      : "Sign In"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push("/")}
                    disabled={isLoading}
                    className="w-full mt-3 sm:mt-4 border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 py-2 sm:py-3 text-sm sm:text-base rounded-lg sm:rounded-xl font-medium h-10 sm:h-12"
                  >
                    Back to Home
                  </Button>
                </div>
              </form>

              <div className="mt-6 sm:mt-8 text-center">
                <p className="text-[#b9c0de] text-sm sm:text-base">
                  Don&#39;t have an account?{" "}
                  <a
                    href="/register"
                    className="font-medium text-orange-500 hover:text-orange-600"
                    onClick={(e) => {
                      e.preventDefault();
                      router.push("/register");
                    }}
                  >
                    Sign up
                  </a>
                </p>
              </div>

              {/* Movie poster decoration - hidden on smallest screens */}
              <div className="mt-6 sm:mt-8 flex justify-center space-x-2 hidden sm:flex">
                <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-[#3b3e88]/20 rounded-lg shadow-sm transform -rotate-6">
                </div>
                <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-rose-500/20 rounded-lg shadow-sm">
                </div>
                <div className="w-8 h-12 sm:w-10 sm:h-14 md:w-12 md:h-16 bg-orange-500/20 rounded-lg shadow-sm transform rotate-6">
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white py-8 px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <Image src="/Projector.png" alt="App Icon" width={30} height={30} />
            <span className="text-sm font-medium text-[#3b3e88]">
              Movie Night Planner{" "}
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Login;
