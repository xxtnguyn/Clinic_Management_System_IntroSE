import { useAuth } from "../contexts/AuthContext";

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import medicalBgImage from "../assets/medical-bg.png";
import logoImage from "../assets/logo.jpg";
import themeImage from "../assets/theme.png";
import { Modal, Input } from "@mui/joy";
import { authService } from "../api/auth.service";
import type { LoginPayload } from "../api/auth.service";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

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
      console.log(user);
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

      {/* Hero Section */}
      <div className="relative h-[80vh]">
        {/* Background Image Layers */}
        <div className="absolute inset-0">
          {/* Base medical background */}
          <img
            src={medicalBgImage}
            alt="Medical Background"
            className="absolute w-full h-full object-cover"
          />
          {/* Theme overlay */}
          <img
            src={themeImage}
            alt="Theme Overlay"
            className="absolute w-full h-full object-cover z-10"
          />
        </div>

        {/* Content Layer */}
        <div className="relative z-20 h-full flex flex-col justify-center items-center text-white text-center px-4">
          <h1 className="text-6xl font-bold mb-6">Your health, our priority</h1>
          <p className="text-2xl">Welcome!</p>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white py-8 px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
          {/* Logo and Address Section */}
          <div className="col-span-3">
            <img src={logoImage} alt="NDCC Logo" className="h-16 mb-4" />
            <p className="!text-[#1250B1] text-sm">
              149N Trung Ward, Thu Duc City,
              <br />
              Ho Chi Minh City
            </p>
            <p className="!text-[#1250B1] text-sm mt-4">
              Copyright 2024 © NDCC Company
            </p>
          </div>

          {/* About Us Section */}
          <div className="col-span-3">
            <h3 className="font-bold text-blue-900 mb-4 uppercase">About Us</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/doctor"
                  className="text-[#1250B1] hover:opacity-80 text-xs"
                >
                  Doctor
                </Link>
              </li>
              <li>
                <Link
                  to="/staff"
                  className="text-[#1250B1] hover:opacity-80 text-xs"
                >
                  Staff
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Section */}
          <div className="col-span-3">
            <h3 className="font-bold text-blue-900 mb-4 uppercase">Contact</h3>
            <p className="!text-[#1250B1]">Hotline: (+84) 123 123 123</p>
            <p className="!text-[#1250B1]">Email: ndcc.clinic@info.com</p>
          </div>

          {/* Social Media Tags */}
          <div className="col-span-3">
            <div className="space-y-2">
              <p className="text-blue-600">#tantamchamso</p>
              <p className="text-blue-600">#hienhonghiepthonggia</p>
              <p className="text-blue-600">#suckhoekhonghangiau</p>
            </div>
            <div className="mt-4">
              <p className="text-gray-600 mb-2">Follow us on social media:</p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <i className="fab fa-facebook"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <i className="fab fa-twitter"></i>
                </a>
                <a href="#" className="text-gray-600 hover:text-blue-600">
                  <i className="fab fa-linkedin"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};

export default Home;
