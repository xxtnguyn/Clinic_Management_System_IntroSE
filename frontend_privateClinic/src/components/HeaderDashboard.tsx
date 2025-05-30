import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo_without_text.png";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

interface Props {
  currentUser: {
    email: string;
    full_name: string;
    id: number;
    is_active: boolean;
    last_login: string;
    permissions: Array<string>;
    phone: string;
    role_id: number;
    role_name: string;
    username: string;
  };
}

export default function HeaderDashboard({ currentUser }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isDashboard = location.pathname === "/dashboard";
  const role = currentUser.role_name;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

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

  console.log(currentUser);
  return (
    <>
      <nav
        className={`absolute top-0 left-0 right-0 z-50 flex justify-between items-center px-16 py-3 ${
          !isDashboard ? "bg-gray-100 shadow-md" : ""
        }`}
      >
        <Link
          to="/dashboard"
          className="!text-white text-3xl font-semibold tracking-wide"
          state={{
            currentUser: currentUser,
          }}
        >
          <img src={logo} alt="NDCC Logo" className="h-12 w-auto" />
        </Link>
        <div className="flex items-center space-x-6">
          {role_navigations[role as keyof typeof role_navigations].map(
            (navigation: string, index: number) => (
              <Link
                to={pages[navigation as keyof typeof pages]}
                className={`text-black text-lg hover:text-[#1250B1] transition-colors relative ${
                  location.pathname === pages[navigation as keyof typeof pages]
                    ? "font-bold text-[#1250B1] border-b-2 border-[#1250B1] pb-1"
                    : "font-normal"
                }`}
                key={index}
                state={{
                  user: currentUser,
                }}
              >
                {navigation}
              </Link>
            )
          )}

          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 text-lg text-black font-normal hover:text-[#1250B1] transition-colors focus:outline-none"
            >
              <img
                src="https://cdn-icons-png.flaticon.com/512/847/847969.png"
                alt="Avatar"
                className="w-6 h-6 rounded-full"
              />
              <span>{currentUser.full_name}</span>
              <svg
                className={`w-5 h-5 transition-transform ${
                  isDropdownOpen ? "transform rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                <div className="px-4 py-2 border-b">
                  <p className="text-sm font-medium text-gray-900">
                    {currentUser.full_name}
                  </p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Your Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}
