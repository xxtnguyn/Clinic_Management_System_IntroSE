import { Link, useLocation, useNavigate } from "react-router-dom";
import logo from "../assets/logo_without_text.png";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";

interface Props {
  currentUser: {
    email: string;
    fullName: string;
    id: number;
    is_active: boolean;
    last_login: string;
    permissions: Array<string>;
    phone: string;
    role: {
      id: number;
      name: string;
    };
    username: string;
    avatar: string;
  };
}

export default function HeaderDashboard({ currentUser: initialUser }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Always get the latest user from localStorage if available
  const [currentUser, setCurrentUser] = useState(initialUser);
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setCurrentUser(JSON.parse(storedUser));
    }
  }, []);

  // Also update if localStorage changes (e.g. after avatar update)
  useEffect(() => {
    const handleStorage = () => {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setCurrentUser(JSON.parse(storedUser));
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const isDashboard = location.pathname === "/dashboard";
  const role = currentUser.role?.name;

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

  const handleLogoutClick = () => {
    setIsDropdownOpen(false);
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = () => {
    setIsLogoutModalOpen(false);
    logout();
    navigate("/");
  };

  const role_navigations = {
    admin: ["Report", "Regulations", "Patient Records"],
    doctor: ["Medical Examination Form", "Patient Records"],
    staff: ["Appointment List", "Invoice"],
    receptionist: ["Appointment List", "Invoice", "Patient Records"],
  };

  const pages = {
    Report: "/report",
    Regulations: "/regulations",
    "Patient Record": "/patient-record",
    "Medical Examination Form": "/medical-examination-form",
    "Patient Records": "/patient-records",
    "Appointment List": "/appointment-list",
    Invoice: "/invoice",
    "About Us": "/about-us",
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
          {role &&
            role_navigations[role as keyof typeof role_navigations]?.map(
              (navigation: string, index: number) => (
                <Link
                  to={pages[navigation as keyof typeof pages]}
                  className={`text-black text-lg hover:text-[#1250B1] transition-colors relative ${
                    location.pathname ===
                    pages[navigation as keyof typeof pages]
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
                src={
                  currentUser.avatar
                    ? currentUser.avatar.startsWith("http")
                      ? currentUser.avatar
                      : `http://localhost:3000${currentUser.avatar}`
                    : `http://localhost:3000/uploads/avatars/${currentUser.role.name.toLowerCase()}-avatar.png`
                }
                alt="Avatar"
                className="w-6 h-6 rounded-full object-cover"
                onError={(e) => {
                  // Fallback to default avatar if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.src = `http://localhost:3000/uploads/avatars/${currentUser.role.name.toLowerCase()}-avatar.png`;
                }}
              />
              <span>{currentUser.fullName}</span>
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
                    {currentUser.fullName}
                  </p>
                  <p className="text-sm text-gray-500">{currentUser.email}</p>
                </div>
                <button
                  onClick={() => {
                    navigate("/profile", { state: { user: currentUser } });
                    setIsDropdownOpen(false); // đóng dropdown nếu muốn
                  }}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Your Profile
                </button>
                <button
                  onClick={handleLogoutClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>

      <Transition appear show={isLogoutModalOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-50"
          onClose={() => setIsLogoutModalOpen(false)}
        >
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 backdrop-blur-sm bg-white/30" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white/90 backdrop-blur-md p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Sign out confirmation
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to sign out? You will need to sign
                      in again to access your account.
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white/80 backdrop-blur-sm px-4 py-2 text-sm font-medium text-gray-700 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={() => setIsLogoutModalOpen(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-[#1250B1]/90 backdrop-blur-sm px-4 py-2 text-sm font-medium text-white hover:bg-[#1250B1] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                      onClick={handleLogoutConfirm}
                    >
                      Sign out
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
