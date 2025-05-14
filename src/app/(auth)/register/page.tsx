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
import { ApplicationError } from "@/app/types/error";
import Image from "next/image";

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
      const userData = await apiService.post<User>("/register", formValues);

      if (userData && userData.userId) {
        // Store the user ID
        setUserId(userData.userId.toString());

        // Store the token if available
        if (userData.token) {
          setToken(userData.token.replace("Bearer ", ""));
        }

        // Navigate to genre favorites page after successful registration
        router.push("/favorite_genres");
      } else {
        setRegisterError("Invalid response received from server");
      }
    } catch (error: unknown) {
      console.error("Registration error:", error);
      if (error instanceof Error && "status" in error) {
        const status = (error as ApplicationError).status;
        switch (status) {
          case 400:
            setRegisterError(
              "This username or email is already registered. Try logging in.",
            );
            break;
          case 409:
            setRegisterError(
              "This username or email is already registered. Try logging in.",
            );
            break;
          default:
            setRegisterError(`Registration failed: ${error.message}`);
        }
      } else if (
        error instanceof Error &&
        (error.message.includes("Network Error") ||
          error.message.includes("Failed to fetch"))
      ) {
        setRegisterError(
          "Network error. Please check your connection and try again.",
        );
      } else {
        setRegisterError("An unknown error occurred during registration");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
      <div className="bg-[#ebefff] min-h-screen flex flex-col">
        {/* Header with Logo */}
        <header className="p-3 sm:p-4">
          <div
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => router.push("/")}
          >
            <Image
                src="/Projector.png"
                alt="App Icon"
                width={40}
                height={40}
                className="w-7 h-7 sm:w-9 sm:h-9 md:w-10 md:h-10"
            />
            <div className="ml-2 font-semibold text-[#3b3e88] text-base sm:text-lg">
              Movie Night Planner
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center px-4 py-3 sm:py-5">
          <div className="w-full max-w-md mx-auto">
            {/* Decorative elements */}
            <div className="relative mb-3 hidden sm:block">
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-rose-500 rounded-full transform rotate-12 opacity-20 blur-xl">
              </div>
              <div className="absolute bottom-8 -left-8 w-28 h-28 bg-orange-500 rounded-full opacity-20 blur-xl">
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-0 relative z-10">
              {/* Decorative top bar */}
              <div className="h-1.5 bg-gradient-to-r from-orange-400 to-rose-500">
              </div>

              <div className="p-5 sm:p-6">
                <div className="text-center mb-4 sm:mb-5">
                  <h2 className="text-2xl font-bold text-[#3b3e88]">
                    Create Account
                  </h2>
                  <p className="text-[#3b3e88] mt-1 text-sm">
                    Sign up and start planning your perfect movie nights
                  </p>
                </div>

                {registerError && (
                    <ErrorMessage
                        message={registerError}
                        onClose={() => setRegisterError("")}
                    />
                )}

                <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleRegister();
                    }}
                    className="space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex flex-col space-y-1.5">
                      <Label
                          htmlFor="email"
                          className="text-xs sm:text-sm font-medium text-[#3b3e88]"
                      >
                        Email
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
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            >
                            </path>
                          </svg>
                        </div>
                        <Input
                            id="email"
                            type="email"
                            placeholder="Enter your email"
                            value={formValues.email}
                            onChange={handleInputChange}
                            autoComplete="email"
                            className="pl-10 p-2.5 text-sm border border-[#b9c0de]/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-[#ebefff]/50"
                            style={{ paddingLeft: "2.5rem" }}
                        />
                      </div>
                      {errors.email && (
                          <ErrorMessage
                              message={errors.email}
                              onClose={() =>
                                  setErrors((prev) => ({ ...prev, email: "" }))}
                          />
                      )}
                    </div>

                    <div className="flex flex-col space-y-1.5">
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
                            className="pl-10 p-2.5 text-sm border border-[#b9c0de]/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-[#ebefff]/50"
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

                    <div className="flex flex-col space-y-1.5">
                      <Label
                          htmlFor="password"
                          className="text-xs sm:text-sm font-medium text-[#3b3e88]"
                      >
                        Password
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
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            >
                            </path>
                          </svg>
                        </div>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Create a password"
                            value={formValues.password}
                            onChange={handleInputChange}
                            autoComplete="new-password"
                            className="pl-10 p-2.5 text-sm border border-[#b9c0de]/30 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-[#ebefff]/50"
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
                        className="w-full bg-gradient-to-r from-orange-400 to-rose-500 hover:from-orange-500 hover:to-rose-600 text-white py-2 text-sm sm:text-base rounded-lg font-medium transition duration-200 h-10 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
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
                                Registering...
                              </div>
                          )
                          : "Create Account"}
                    </Button>

                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/")}
                        disabled={isLoading}
                        className="w-full mt-3 border-[#3b3e88] text-[#3b3e88] hover:bg-[#3b3e88]/10 py-2 text-sm sm:text-base rounded-lg font-medium h-10"
                    >
                      Back to Home
                    </Button>
                  </div>
                </form>

                <div className="mt-4 sm:mt-5 text-center">
                  <p className="text-[#3b3e88] text-sm">
                    Already have an account?{" "}
                    <a
                        href="/login"
                        className="font-medium text-orange-500 hover:text-orange-600"
                        onClick={(e) => {
                          e.preventDefault();
                          router.push("/login");
                        }}
                    >
                      Sign in
                    </a>
                  </p>
                </div>

                {/* Movie poster decoration */}
                <div className="mt-4 flex justify-center space-x-2 hidden sm:flex">
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-[#3b3e88]/20 rounded-lg shadow-sm transform -rotate-6">
                  </div>
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-rose-500/20 rounded-lg shadow-sm">
                  </div>
                  <div className="w-7 h-10 sm:w-8 sm:h-12 bg-orange-500/20 rounded-lg shadow-sm transform rotate-6">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white py-3 px-4">
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-2">
              <Image src="/Projector.png" alt="App Icon" width={24} height={24} />
              <span className="text-sm font-medium text-[#3b3e88]">
            Movie Night Planner
          </span>
            </div>
          </div>
        </footer>
      </div>
  );
};

export default Register;
