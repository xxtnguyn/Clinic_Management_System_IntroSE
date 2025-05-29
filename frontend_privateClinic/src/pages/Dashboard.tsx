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

  return (
    <div className="min-h-screen w-full">
      <HeaderDashboard currentUser={currentUser} />

      <HeroSection big_text={"Wellcome back, " + name} small_text={role} />

      <Footer />
    </div>
  );
};

export default Dashboard;
