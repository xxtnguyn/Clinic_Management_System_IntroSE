import React from "react";
import { Link } from "react-router-dom";
import medicalBgImage from "../assets/medical-bg.png";
import logoImage from "../assets/logo.jpg";
import themeImage from "../assets/theme.png";
import { useLocation } from "react-router-dom";

const Dashboard: React.FC = () => {
  const location = useLocation();

  const { currentUser } = location.state || {};
  const name = currentUser.full_name;
  const role = currentUser.role_name;
  const role_navigations = {
    admin: ["Account Approval", "Report", "Regulations", "Patient Record"],
    doctor: ["Medical Examination Form", "Patient Records"],
    staff: ["Patient List", "Invoice"],
    receptionist: ["Patient List", "Invoice"],
  };

  const pages = {
    "Account Approval": "/account-approval",
    Report: "/report",
    Regulations: "/regulations",
    "Patient Record": "/patient-record",
    "Medical Examination Form": "/medical-examination-form",
    "Patient Records": "/patient-records",
    "Patient List": "/patient-list",
    Invoice: "/invoice",
  };

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
        <div className="flex items-center space-x-6">
          {role_navigations[role as keyof typeof role_navigations].map(
            (navigation: string, index: number) => (
              <Link
                to={pages[navigation as keyof typeof pages]}
                className="text-white font-normal text-lg"
                key={index}
              >
                {navigation}
              </Link>
            )
          )}

          <a
            href="#"
            className="flex items-center gap-2 text-lg text-white font-normal"
          >
            <img
              src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
              alt="Avatar"
              className="w-6 h-6 rounded-full"
            />
            <span>My Account</span>
          </a>
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
          <h1 className="text-6xl font-bold mb-6">Welcome back, {name}</h1>
          <p className="text-2xl">{role}</p>
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
    </div>
  );
};

export default Dashboard;
