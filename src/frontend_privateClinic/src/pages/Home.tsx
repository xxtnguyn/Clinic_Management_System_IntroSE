import { useAuth } from "../contexts/AuthContext";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Input, Typography } from "@mui/joy";
import { authService } from "../api/auth.service";
import type { LoginPayload, ForgotPasswordPayload } from "../api/auth.service";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import logo from "../assets/logo_without_text.png";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

// Schemas for validation (copied from ForgotPasswordModal.tsx)
const forgotPasswordSchema = yup
  .object({
    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email"),
  })
  .required();

const loginSchema = yup
  .object({
    username: yup.string().required("Username is required"),
    password: yup
      .string()
      .required("Password is required")
      .min(6, "Password must be at least 6 characters"),
  })
  .required();

type LoginFormInputs = yup.InferType<typeof loginSchema>;
type ForgotPasswordFormInputs = yup.InferType<typeof forgotPasswordSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"login" | "forgotPassword">("login");
  const { login } = useAuth();

  // RHF for Login Form
  const {
    register: registerLogin,
    handleSubmit: handleSubmitLogin,
    formState: { errors: loginErrors },
  } = useForm<LoginFormInputs>({
    resolver: yupResolver(loginSchema),
  });

  // RHF for Forgot Password Form
  const {
    register: registerForgotPassword,
    handleSubmit: handleSubmitForgotPassword,
    formState: { errors: forgotPasswordErrors },
  } = useForm<ForgotPasswordFormInputs>({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const handleLogin = async (data: LoginFormInputs) => {
    const payload: LoginPayload = {
      username: data.username,
      password: data.password,
    };
    try {
      setIsLoading(true);
      await authService.login(payload);
      login();
      onClose();
      const user = await authService.getCurrentUser();
      navigate("/dashboard", {
        state: {
          currentUser: user,
        },
      });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (data: ForgotPasswordFormInputs) => {
    console.log("Submitting forgot password email:", data.email);
    try {
      setIsLoading(true);
      await authService.forgotPassword({ email: data.email });
      alert("If your email exists, a password reset link has been sent to it.");
      setViewMode("login");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (viewMode === "login") handleSubmitLogin(handleLogin)();
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="p-6 bg-white rounded-xl shadow-xl w-full max-w-sm">
        <Typography
          component="h3"
          level="h3"
          className="text-2xl font-normal text-center mb-6"
        >
          {viewMode === "login" ? "Sign In" : "Forgot Password"}
        </Typography>

        {viewMode === "login" ? (
          <form onSubmit={handleSubmitLogin(handleLogin)} className="space-y-4">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <Input
                placeholder="Type your username"
                {...registerLogin("username")}
                onKeyDown={handleKeyDown}
              />
              {loginErrors.username && (
                <span className="text-red-500 text-xs">
                  {loginErrors.username.message}
                </span>
              )}
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Type your password"
                  {...registerLogin("password")}
                  onKeyDown={handleKeyDown}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500"
                  onClick={() => setShowPassword((prev) => !prev)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
              {loginErrors.password && (
                <span className="text-red-500 text-xs">
                  {loginErrors.password.message}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
            <div className="mt-4 text-sm text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("forgotPassword");
                }}
                className="text-blue-600 hover:underline"
              >
                Forgot password?
              </a>
            </div>
          </form>
        ) : (
          <form
            onSubmit={handleSubmitForgotPassword(handleForgotPasswordSubmit)}
            className="space-y-4"
          >
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                placeholder="Enter your email"
                {...registerForgotPassword("email")}
              />
              {forgotPasswordErrors.email && (
                <span className="text-red-500 text-xs">
                  {forgotPasswordErrors.email.message}
                </span>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Sending..." : "Send Reset Link"}
            </button>
            <div className="mt-4 text-sm text-center">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setViewMode("login");
                }}
                className="text-blue-600 hover:underline"
              >
                &larr; Back to Login
              </a>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

const Home: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="min-h-screen w-full">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-16 py-6">
        <Link
          to="/"
          className="!text-white text-3xl font-semibold tracking-wide"
        >
          <img src={logo} alt="NDCC Logo" className="h-12 w-auto" />
        </Link>
        <div className="space-x-6">
          {/* <Link to="/register" className="text-white font-normal text-lg">
            Register
          </Link> */}
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-white text-[#1250B1] px-8 py-2 rounded-md hover:bg-opacity-90 text-lg font-normal cursor-pointer transition duration-300 hover:shadow-lg"
          >
            Sign in
          </button>
        </div>
      </nav>

      <HeroSection />

      {/* Footer */}
      <Footer />
      {/* Login Modal */}
      {isLoginModalOpen && (
        <LoginModal
          isOpen={isLoginModalOpen}
          onClose={() => {
            setIsLoginModalOpen(false);
            const loginModalInstance = document.querySelector(".MuiModal-root");
            if (loginModalInstance) {
            }
          }}
        />
      )}
    </div>
  );
};

export default Home;
