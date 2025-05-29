import { useAuth } from "../contexts/AuthContext";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Input } from "@mui/joy";
import { authService } from "../api/auth.service";
import type { LoginPayload } from "../api/auth.service";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";

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
  const { login } = useAuth();

  const handleLogin = async () => {
    const payload: LoginPayload = { username, password };
    try {
      setIsLoading(true);
      await authService.login(payload);
      login(); // thêm dòng này
      onClose();
      const user = (await authService.getCurrentUser()).data;
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleLogin();
  };

  if (!isOpen) return null;

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      className="flex items-center justify-center min-h-screen"
    >
      <div className="p-6 bg-white rounded-xl shadow-xl w-full max-w-sm">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Username
          </label>
          <Input
            placeholder="Type your username"
            value={username}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Type your password"
              value={password}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPassword(e.target.value)
              }
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
        </div>
        <button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
        <div className="mt-4 text-sm text-center">
          <a href="#" className="text-blue-600 hover:underline">
            Forgot password?
          </a>
        </div>
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
          NDCC
        </Link>
        <div className="space-x-6">
          <Link to="/register" className="text-white font-normal text-lg">
            Register
          </Link>
          <button
            onClick={() => setIsLoginModalOpen(true)}
            className="bg-white text-[#1250B1] px-8 py-2 rounded-md hover:bg-opacity-90 text-lg font-normal cursor-pointer transition duration-300 hover:shadow-lg"
          >
            Login
          </button>
        </div>
      </nav>

      <HeroSection />

      {/* Footer */}
      <Footer />
      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default Home;
