import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import medicalBgImage from '../assets/medical-bg.png';
import logoImage from '../assets/logo.jpg';
import themeImage from '../assets/theme.png';
import LoginModal from '../components/LoginModal';

const Home: React.FC = () => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    return (
        <div className="min-h-screen w-full font-poppins">
            {/* Navigation Bar */}
            <nav className="sticky top-0 left-0 right-0 z-50 flex justify-between items-center px-16 py-6">
                <Link to="/" className="text-white text-3xl font-normal">NDCC</Link>
                <div className="space-x-6">
                    <Link to="/register" className="text-white font-normal text-lg">Register</Link>
                    <button
                        onClick={() => setIsLoginModalOpen(true)}
                        className="bg-white text-[#1250B1] px-8 py-2 rounded-md hover:bg-opacity-90 text-lg font-normal"
                    >
                        Login
                    </button>
                </div>
            </nav>

            {/* Hero Section */}
            <div className="relative h-screen">
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
                    <h1 className="text-6xl font-normal mb-6">Your health, our priority</h1>
                    <p className="text-2xl">Welcome!</p>
                </div>
            </div>

            {/* Footer */}
            <footer className="bg-white py-8 px-16">
                <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8">
                    {/* Logo and Address Section */}
                    <div className="col-span-3">
                        <img src={logoImage} alt="NDCC Logo" className="h-16 mb-4" />
                        <p className="text-[#1250B1] text-xs leading-normal">
                            Linh Trung Ward, Thu Duc City,<br />
                            Ho Chi Minh City
                        </p>
                        <p className="text-[#1250B1] text-xs mt-4">
                            Copyright 2025 © NDCC Company
                        </p>
                    </div>

                    {/* About Us Section */}
                    <div className="col-span-3">
                        <h3 className="font-normal text-[#1250B1] mb-4 uppercase text-xs">About Us</h3>
                        <ul className="space-y-2">
                            <li><Link to="/doctor" className="text-[#1250B1] hover:opacity-80 text-xs">Doctor</Link></li>
                            <li><Link to="/staff" className="text-[#1250B1] hover:opacity-80 text-xs">Staff</Link></li>
                        </ul>
                    </div>

                    {/* Contact Section */}
                    <div className="col-span-3">
                        <h3 className="font-normal text-[#1250B1] mb-4 uppercase text-xs">Contact</h3>
                        <p className="text-[#1250B1] text-xs">Hotline: (+84) 123 123 123</p>
                        <p className="text-[#1250B1] text-xs">Email: ndccclinic@info.com</p>
                    </div>

                    {/* Social Media Tags */}
                    <div className="col-span-3">
                        <div className="space-y-2">
                            <p className="text-[#1250B1] text-xs">#tantamchamsoc</p>
                            <p className="text-[#1250B1] text-xs">#khachhanglathuongde</p>
                            <p className="text-[#1250B1] text-xs">#suckhoelahangdau</p>
                        </div>
                        <div className="mt-4">
                            <p className="text-[#1250B1] text-xs mb-2">Follow us on social media:</p>
                            <div className="flex space-x-4">
                                <a href="#" className="text-[#1250B1] hover:opacity-80">
                                    <i className="fab fa-facebook"></i>
                                </a>
                                <a href="#" className="text-[#1250B1] hover:opacity-80">
                                    <i className="fab fa-twitter"></i>
                                </a>
                                <a href="#" className="text-[#1250B1] hover:opacity-80">
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