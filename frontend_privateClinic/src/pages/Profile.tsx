import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import defaultAvatar from "../assets/medical-bg.png";
import profileIcon from "../assets/profile_icon.png";
import passwordIcon from "../assets/password_icon.png";

interface User {
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
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  address: string;
  gender: string;
}

const Profile = () => {
  const location = useLocation();
  const { user } = location.state || {};

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(defaultAvatar);
  const [activeTab, setActiveTab] = useState<"personal" | "credentials">(
    "personal"
  );
  const [isBlue, setIsBlue] = useState(false);

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: "",
    lastName: "",
    phoneNumber: "",
    address: "",
    gender: "male",
  });

  useEffect(() => {
    const timer = setTimeout(() => setIsBlue(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user) {
      const fullNameParts = user.full_name?.split(" ") || [];
      const lastName = fullNameParts.pop() || "";
      const firstName = fullNameParts.join(" ");

      setFormData({
        firstName,
        lastName,
        phoneNumber: user.phone || "",
        address: "",
        gender: "male",
      });
    }
  }, [user]);

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Profile form submitted:", formData);
    setIsEditing(false);
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Image form submitted:", profileImage);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        No user data provided.
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-colors duration-1000 ${
        isBlue ? "bg-gradient-to-tr from-green-200 via-blue-200 to-indigo-500" : "bg-white"
      }`}
    >
      <HeaderDashboard currentUser={user} />
      <main className="flex-grow container mx-auto px-4 py-8 mt-0">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar with image + tabs */}
          <form
            onSubmit={handleImageSubmit}
            className="relative bg-white rounded-lg shadow-lg p-6 flex flex-col items-center"
            style={{
              boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
              height: "28rem",
              width: "300px",
              marginTop: "7rem",
            }}
          >
            <img
              src={profileImage}
              alt="Profile"
              className="w-48 h-48 rounded-full p-1 bg-gradient-to-tr from-green-200 via-blue-300 to-indigo-500 shadow-xl"
              style={{ marginTop: "-8rem" }}
            />
            <div className="mt-6 text-center w-full">
              <h2 className="text-xl font-semibold text-gray-800">
                {user.full_name}
              </h2>
              <p className="text-blue-600 font-medium mt-1">{user.role_name}</p>
              <p className="text-gray-600 mt-1">{user.email}</p>
            </div>

            <div className="mt-16 w-full flex flex-col items-center gap-2 text-gray-700 font-medium">
              <h2 className="text-lg font-semibold mb-3 w-full">
                Profile Settings
              </h2>

              <button
                type="button"
                className={`cursor-pointer px-6 py-2 rounded-full w-full text-center shadow-md flex items-center justify-center ${
                  activeTab === "personal"
                    ? "bg-gray-400 text-white"
                    : "bg-gray-100"
                }`}
                style={{ boxShadow: "0 2px 5px rgba(0,0,0,0.3)" }}
                onClick={() => setActiveTab("personal")}
              >
                <img src={profileIcon} alt="icon" className="w-5 h-5 mr-3" />
                Personal Details
              </button>

              <button
                type="button"
                className={`cursor-pointer px-6 py-2 rounded-full w-full text-center shadow-md flex items-center justify-center ${
                  activeTab === "credentials"
                    ? "bg-gray-400 text-white"
                    : "bg-gray-100"
                }`}
                onClick={() => setActiveTab("credentials")}
              >
                <img src={passwordIcon} alt="icon" className="w-5 h-5 mr-3" />
                Email and Password
              </button>
            </div>
          </form>


          {/* Main content panel */}
          {activeTab === "personal" ? (
            <form
              className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-10 m-4 mt-12 overflow-auto"
              style={{
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                maxHeight: "32rem",
                // marginTop: "3rem",
              }}
              onSubmit={handleSubmit}
            >
              <h2 className="mt-0 text-3xl font-semibold mb-3 w-full">
                Personal Details
              </h2>
              <div className="w-full h-0.5 bg-gray-300 rounded mb-6"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                  />
                </div>

                <div className="relative w-60">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Gender
                  </label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="bg-white border border-gray-300 text-gray-700 rounded-full px-4 py-2 text-base shadow-sm appearance-none w-full"
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>

                  {/* Icon mũi tên chỉ xuống */}
                  <div className="pointer-events-none absolute inset-y-13 right-0 flex items-center text-gray-500">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path d="M7 7l3 3 3-3H7z" />
                    </svg>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 text-base"
                    rows={3}
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </form>
          ) : (
            <form
              className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-10 m-4 mt-28 overflow-auto"
              style={{
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                maxHeight: "24rem",
                // marginTop: "7rem",
              }}
              onSubmit={(e) => {
                e.preventDefault();
              }}
            >
              <h2 className="mt-0 text-3xl font-semibold mb-3 w-full">
                Email and Password
              </h2>
              <div className="w-full h-0.5 bg-gray-300 rounded mb-6"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                {/* Email */}
                <div className="w-full md:col-span-2 flex flex-col items-start">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={user.email}
                    readOnly
                    className="w-full max-w-xs bg-gray-100 rounded-full px-4 py-2 text-base cursor-not-allowed"
                  />
                </div>

                {/* Password */}
                <div className="w-full md:col-span-2 flex flex-col items-start">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value="******"
                    readOnly
                    className="w-full max-w-xs bg-gray-100 rounded-full px-4 py-2 text-base cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Edit
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default Profile;
