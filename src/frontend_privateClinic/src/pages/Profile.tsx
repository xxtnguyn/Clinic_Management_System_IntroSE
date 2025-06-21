import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import HeaderDashboard from "../components/HeaderDashboard";
import defaultAvatar from "../assets/medical-bg.png";
import profileIcon from "../assets/profile_icon.png";
import passwordIcon from "../assets/password_icon.png";
import staffService from "../api/staff.service";
import { authService } from "../api/auth.service";
import type { Staff } from "../api/staff.service";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

interface Role {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  gender: string;
  birthDate: string;
  avatar: string | null;
  isActive: boolean;
  role: Role;
}

interface ProfileFormData {
  fullName: string;
  phoneNumber: string;
  address: string;
  gender: string;
  birthDate: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
  email: string;
}

// Thêm interface cho error messages
interface PasswordErrors {
  currentPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
  general?: string;
}

// Thêm interface cho profile message
interface ProfileMessage {
  type: "success" | "error";
  text: string;
}

const Profile = () => {
  const location = useLocation();
  const { user } = location.state || {};
  const [currentUser, setCurrentUser] = useState<User | null>(user || null);

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [profileImage, setProfileImage] = useState<string>(defaultAvatar);
  const [activeTab, setActiveTab] = useState<"personal" | "credentials">(
    "personal"
  );
  const [isBlue, setIsBlue] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [profileMessage, setProfileMessage] = useState<ProfileMessage | null>(
    null
  );

  const [formData, setFormData] = useState<ProfileFormData>({
    fullName: "",
    phoneNumber: "",
    address: "",
    gender: "male",
    birthDate: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
    email: "",
  });

  // Thêm state cho error messages
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({});

  // Hàm chuyển đổi giới tính từ tiếng Việt sang tiếng Anh
  const mapGenderToEnglish = (gender: string): string => {
    switch (gender.toLowerCase()) {
      case "nam":
        return "male";
      case "nữ":
        return "female";
      default:
        return "other";
    }
  };

  // Hàm chuyển đổi giới tính từ tiếng Anh sang tiếng Việt
  const mapGenderToVietnamese = (gender: string): string => {
    switch (gender.toLowerCase()) {
      case "male":
        return "Nam";
      case "female":
        return "Nữ";
      default:
        return "Khác";
    }
  };

  // Hàm format ngày tháng từ ISO string sang YYYY-MM-DD
  const formatDate = (dateString: string): string => {
    if (!dateString) return "";
    const date = new Date(dateString);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() trả về 0-11
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsBlue(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // First try to get user from localStorage
    const storedUser = localStorage.getItem("user");
    const initialUser = storedUser ? JSON.parse(storedUser) : user || null;

    if (initialUser) {
      console.log("Initial user data:", initialUser);

      // Handle avatar - check if it's already a full URL or needs the backend URL prefix
      if (initialUser.avatar) {
        const avatarUrl = initialUser.avatar.startsWith("http")
          ? initialUser.avatar
          : `${import.meta.env.VITE_BACKEND_URL}${initialUser.avatar}`;
        setProfileImage(avatarUrl);
      } else {
        setProfileImage(defaultAvatar);
      }

      // Initialize form data
      setFormData({
        fullName: initialUser.fullName || "",
        phoneNumber: initialUser.phone || "",
        address: initialUser.address || "",
        gender: mapGenderToEnglish(initialUser.gender || ""),
        birthDate: formatDate(initialUser.birthDate || ""),
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
        email: initialUser.email || "",
      });

      // Update current user state
      setCurrentUser(initialUser);
    }
  }, [user]); // Re-run if user prop changes

  // Handle avatar upload
  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file || !currentUser) return;

    try {
      setIsLoading(true);
      const response = await staffService.uploadAvatar(currentUser.id, file);

      // Update the profile image in the UI
      setProfileImage(response.data.data.avatarUrl);

      // Update the user data in localStorage
      const updatedUser = { ...currentUser, avatar: response.data.data.avatar };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setProfileMessage({
        type: "success",
        text: "Cập nhật ảnh đại diện thành công",
      });
    } catch (error) {
      const errorObj = error as { response?: { data?: { message?: string } } };
      const errorMessage =
        errorObj?.response?.data?.message ||
        "Có lỗi xảy ra khi tải lên ảnh đại diện";

      setProfileMessage({
        type: "error",
        text: errorMessage,
      });
    } finally {
      setIsLoading(false);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProfileMessage(null);

    try {
      const updateData: Partial<Staff> = {
        full_name: formData.fullName,
        phone: formData.phoneNumber,
        address: formData.address,
        gender: mapGenderToVietnamese(formData.gender),
        birth_date: formData.birthDate,
        email: formData.email,
        avatar: profileImage.startsWith("http")
          ? profileImage
          : `${import.meta.env.VITE_BACKEND_URL}${profileImage}`,
      };

      console.log("Dữ liệu gửi lên:", updateData);

      const response = await staffService.update(user.id, updateData);
      const updatedStaff = response.data.data;

      // ✅ Gộp role.name từ user cũ nếu backend không trả về
      const fullUpdatedUser = {
        ...user, // giữ lại tất cả thông tin cũ (gồm role.name)
        ...updatedStaff, // ghi đè field mới
        role: {
          id: updatedStaff.role_id ?? user.role.id,
          name: user.role.name, // giữ nguyên name cũ
        },
      };

      // ✅ Cập nhật localStorage
      localStorage.setItem("user", JSON.stringify(fullUpdatedUser));

      // ✅ Nếu dùng location.state thì cập nhật luôn
      if (location.state) {
        location.state.user = fullUpdatedUser;
      }

      setProfileMessage({
        type: "success",
        text: response.data.message || "Cập nhật thông tin thành công",
      });
      setIsEditing(false);
    } catch (error) {
      setProfileMessage({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Cập nhật thông tin thất bại",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Image form submitted:", profileImage);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setPasswordErrors({});

    // Kiểm tra mật khẩu mới và xác nhận có khớp nhau không
    if (formData.newPassword !== formData.confirmPassword) {
      setPasswordErrors({
        confirmPassword: "Mật khẩu mới và xác nhận mật khẩu không khớp",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Gọi API đổi mật khẩu
      await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      );

      // Thành công
      setPasswordErrors({
        general: "Đổi mật khẩu thành công",
      });

      // Reset form
      setFormData({
        ...formData,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      const backendMsg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        "Đổi mật khẩu thất bại";

      setPasswordErrors({
        general: backendMsg,
      });
    } finally {
      setIsLoading(false); // luôn được gọi
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-600">
        No user data provided.
      </div>
    );
  }

  // console.log("Current user used in HeaderDashboard:", user);
  // console.log("New password:", formData.newPassword);
  // console.log("Confirm password:", formData.confirmPassword);
  return (
    <div
      className={`min-h-screen w-full flex items-center justify-center transition-colors duration-1000 ${
        isBlue
          ? "bg-gradient-to-tr from-green-200 via-blue-200 to-indigo-500"
          : "bg-white"
      }`}
    >
      <HeaderDashboard currentUser={user} />
      <main className="flex-grow container mx-auto px-4 py-8 mt-0">
        <div className="flex flex-col md:flex-row gap-8">
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
            <div className="relative group" style={{ marginTop: "-8rem" }}>
              <div className="w-48 h-48 rounded-full p-1 bg-gradient-to-tr from-green-200 via-blue-300 to-indigo-500 shadow-xl">
                <img
                  src={profileImage}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                />
              </div>
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <label className="cursor-pointer bg-black bg-opacity-50 text-white px-4 py-2 rounded">
                  Đổi ảnh
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 text-center w-full">
              <h2 className="text-xl font-semibold text-gray-800">
                {user.fullName}
              </h2>
              <p className="text-blue-600 font-medium mt-1">{user.role.name}</p>
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
                Change Password
              </button>
            </div>
          </form>

          {/* Main content panel */}
          {activeTab === "personal" ? (
            <form
              className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-10 m-4 mt-12 overflow-auto"
              style={{
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                maxHeight: "38rem",
              }}
              onSubmit={handleSubmit}
            >
              <h2 className="mt-0 text-3xl font-semibold mb-3 w-full">
                Personal Details
              </h2>
              <div className="w-full h-0.5 bg-gray-300 rounded mb-6"></div>

              {profileMessage && (
                <div
                  className={`mb-4 p-3 rounded-md ${
                    profileMessage.type === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {profileMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-gray-800">
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onFocus={() => setProfileMessage(null)}
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onFocus={() => setProfileMessage(null)}
                    className="w-full bg-gray-100 rounded-full px-4 py-2 text-base cursor-not-allowed"
                  />
                </div>

                <div className="md:col-span-2 grid grid-cols-12 gap-6">
                  <div className="col-span-6">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      onFocus={() => setProfileMessage(null)}
                      className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                    />
                  </div>

                  <div className="col-span-3">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Birth Date
                    </label>
                    <input
                      type="date"
                      name="birthDate"
                      value={formData.birthDate}
                      onChange={handleInputChange}
                      onFocus={() => setProfileMessage(null)}
                      className="w-full bg-gray-100 rounded-full px-4 py-2 text-base"
                    />
                  </div>

                  <div className="col-span-3 relative">
                    <label className="block text-sm font-semibold text-gray-600 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleInputChange}
                      onFocus={() => setProfileMessage(null)}
                      className="w-full bg-white border border-gray-300 text-gray-700 rounded-full px-4 py-2 text-base shadow-sm appearance-none"
                    >
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>

                    {/* Icon mũi tên chỉ xuống */}
                    <div className="pointer-events-none absolute inset-y-13 right-4 flex items-center text-gray-500">
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
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    onFocus={() => setProfileMessage(null)}
                    className="w-full bg-gray-100 rounded-lg px-4 py-2 text-base"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Save"}
                </button>
              </div>
            </form>
          ) : (
            <form
              className="w-full md:w-2/3 bg-white rounded-lg shadow-lg p-10 m-4 mt-28 overflow-auto"
              style={{
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                maxHeight: "36rem",
              }}
              onSubmit={handleChangePassword}
            >
              <h2 className="mt-0 text-3xl font-semibold mb-3 w-full">
                Change Password
              </h2>
              <div className="w-full h-0.5 bg-gray-300 rounded mb-6"></div>

              {passwordErrors.general && (
                <div
                  className={`mb-4 p-3 rounded-md ${
                    passwordErrors.general.includes("thành công")
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {passwordErrors.general}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 text-gray-800">
                {/* Current password */}
                <div className="flex flex-col relative">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Current password
                  </label>
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    value={formData.currentPassword}
                    placeholder="Enter current password"
                    onChange={handleInputChange}
                    className={`w-80 bg-gray-100 rounded-full px-4 py-2 text-base pr-10 placeholder-gray-400${
                      passwordErrors.currentPassword
                        ? "border-2 border-red-500"
                        : ""
                    }`}
                  />
                  <div
                    className="absolute right-113 top-9 cursor-pointer"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                  >
                    {showCurrentPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  {passwordErrors.currentPassword && (
                    <span className="text-red-500 text-sm mt-1">
                      {passwordErrors.currentPassword}
                    </span>
                  )}
                </div>

                {/* New password */}
                <div className="flex flex-col relative">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    New password
                  </label>
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={formData.newPassword}
                    placeholder="Enter new password"
                    onChange={handleInputChange}
                    className={`w-80 bg-gray-100 rounded-full px-4 py-2 text-base pr-10 placeholder-gray-400 ${
                      passwordErrors.newPassword
                        ? "border-2 border-red-500"
                        : ""
                    }`}
                  />
                  <div
                    className="absolute right-113 top-9 cursor-pointer"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                  >
                    {showNewPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  {passwordErrors.newPassword && (
                    <span className="text-red-500 text-sm mt-1">
                      {passwordErrors.newPassword}
                    </span>
                  )}
                </div>

                {/* Confirm new password */}
                <div className="flex flex-col relative">
                  <label className="block text-sm font-semibold text-gray-600 mb-1">
                    Confirm new password
                  </label>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    placeholder="Confirm new password"
                    className={`w-80 bg-gray-100 rounded-full px-4 py-2 text-base pr-10 placeholder-gray-400${
                      passwordErrors.confirmPassword
                        ? "border-2 border-red-500"
                        : ""
                    }`}
                  />
                  <div
                    className="absolute right-113 top-9 cursor-pointer"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-600" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  {passwordErrors.confirmPassword && (
                    <span className="text-red-500 text-sm mt-1">
                      {passwordErrors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : "Change Password"}
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
