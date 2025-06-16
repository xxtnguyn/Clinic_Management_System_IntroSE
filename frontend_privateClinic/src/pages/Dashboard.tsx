import React from "react";
import { useLocation } from "react-router-dom";
import Footer from "../components/Footer";
import HeroSection from "../components/HeroSection";
import HeaderDashboard from "../components/HeaderDashboard";

const Dashboard: React.FC = () => {
  const location = useLocation();

  const { currentUser } = location.state || {};
  const name = currentUser.full_name;
  const role = currentUser.role_name;
  const capitalizedRole = role.charAt(0).toUpperCase() + role.slice(1);

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
