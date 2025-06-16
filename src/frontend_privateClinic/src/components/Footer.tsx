import { Link } from "react-router-dom";
import logoImage from "../assets/logo.png";

export default function Footer() {
  return (
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
                to="/about-us"
                className="text-[#1250B1] hover:opacity-80 text-sl"
              >
                Founder
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
  );
}
