import React from "react";
import { Link } from "react-router-dom";
import member1 from "../assets/logo.jpg";
import logo_ndcc from "../assets/logo_without_text.png"; // thêm logo góc trên trái

const teamMembers = [
  {
    name: "Đào Ngọc Thảo Nguyên",
    studentId: "22120234",
    role: "Business Analyst",
    image: member1,
  },
  {
    name: "Lê Quốc Vương",
    studentId: "22120445",
    role: "Tester",
    image: member1,
  },
  {
    name: "Nguyễn Thị Anh Thi",
    studentId: "22120339",
    role: "Frontend Developer",
    image: member1,
  },
  {
    name: "Nguyễn Tiến Quốc",
    studentId: "22120300",
    role: "Project Manager",
    image: member1,
  },
  {
    name: "Nguyễn Thành Đức",
    studentId: "20120005",
    role: "Backend Developer",
    image: member1,
  },
];

const AboutUs: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 w-full relative px-8">
      {/* Logo ở góc trên trái */}
      <div className="absolute top-4 left-4">
        <img src={logo_ndcc} alt="NDCC Logo" className="h-12" />
      </div>

      {/* Link Back to Home ở góc dưới trái */}
      <div className="absolute bottom-4 left-4">
        <Link to="/dashboard" className="text-blue-700 text-sm hover:underline">
          &larr; Back to Home
        </Link>
      </div>

      {/* Nội dung chính */}
      <main className="container mx-auto px-8 py-12 mt-16">
        <h1 className="text-3xl font-bold text-center text-blue-800 mb-8">
          Founders of NDCC
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {teamMembers.map((member, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl shadow-md p-6 w-full max-w-sm text-center"
            >
              <img
                src={member.image}
                alt={member.name}
                className="w-32 h-32 object-cover mx-auto rounded-full mb-4"
              />
              <h2 className="text-xl font-semibold text-blue-900">
                {member.name}
              </h2>
              <p className="text-gray-700">MSSV: {member.studentId}</p>
              <p className="text-blue-600 font-medium mt-2">{member.role}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
