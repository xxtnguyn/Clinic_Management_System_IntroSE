import React from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
// import Footer from "../components/Footer";

const AccountApproval: React.FC = () => {
  const location = useLocation();
  const { user } = location.state || {};

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <HeaderDashboard currentUser={user} />
      <main className="container mx-auto px-8 py-6 mt-16">
        {/* Content will be added later */}
      </main>
      {/* <Footer /> */}
    </div>
  );
};

export default AccountApproval;