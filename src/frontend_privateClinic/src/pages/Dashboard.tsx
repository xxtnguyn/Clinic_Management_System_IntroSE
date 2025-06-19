import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import HeaderDashboard from "../components/HeaderDashboard";

const Dashboard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  let { currentUser } = location.state || {};

  // Try to recover user from localStorage if not present
  useEffect(() => {
    if (!currentUser) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        currentUser = JSON.parse(storedUser);
      } else {
        navigate("/", { replace: true });
      }
    }
  }, []);

  if (!currentUser) return null; // Or a loading spinner

  const name = currentUser.fullName;
  const role = currentUser?.role?.name || "";
  const capitalizedRole = role
    ? role.charAt(0).toUpperCase() + role.slice(1)
    : "";

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={currentUser} />

      <HeroSection
        big_text={"Welcome back, " + name}
        small_text={capitalizedRole}
      />

      <Footer />
    </div>
  );
};

export default Dashboard;
