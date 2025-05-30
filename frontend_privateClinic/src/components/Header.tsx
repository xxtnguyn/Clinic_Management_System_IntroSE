// components/Header.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Header: React.FC = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="bg-[#1250B1] text-white py-4 px-8 flex justify-between items-center">
      <Link to="/" className="text-3xl font-normal">
        NDCC
      </Link>
      <div className="flex items-center space-x-8">
        <button onClick={handleLogout} className="hover:underline">
          Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
