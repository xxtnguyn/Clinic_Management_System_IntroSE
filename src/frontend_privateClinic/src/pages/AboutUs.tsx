import React from "react";
import { Link, useNavigate } from "react-router-dom";
import member1 from "../assets/Nguyen.png";
import member2 from "../assets/Vuong.png";
import member3 from "../assets/thi.jpeg";
import member4 from "../assets/Quoc.png";
import member5 from "../assets/Duc.png";
import logo_ndcc from "../assets/logo_without_text.png";

const introSection = {
  gradient: "from-blue-50 via-white to-green-50",
  title: "Chào mừng đến với NDCC Clinic",
  content: `NDCC Clinic là hệ thống quản lý phòng khám được phát triển bởi NDCC Group – một nhóm gồm năm thành viên, thân mật gọi nhau là Ngũ Đại Công Chúa. Tên gọi NDCC chính là viết tắt đầy ý nghĩa từ tinh thần gắn kết, trách nhiệm và sự sáng tạo không ngừng nghỉ của cả nhóm. 

NDCC Clinic ra đời với sứ mệnh đơn giản hóa và số hóa toàn bộ quy trình quản lý phòng khám, từ khâu tiếp nhận đến thanh toán. Hệ thống hỗ trợ các chức năng thiết yếu như: tra cứu bệnh nhân, lập phiếu khám bệnh, tạo danh sách khám hàng ngày, phát hành hóa đơn, báo cáo doanh thu theo tháng, và đặc biệt là khả năng tùy biến quy định theo từng vai trò người dùng.

Với giao diện thân thiện, logic xử lý mạch lạc và khả năng mở rộng cao, NDCC Clinic không chỉ là một sản phẩm học thuật mà còn là một nền tảng vững chắc cho tương lai ngành y tế thông minh. NDCC Group tự hào mang đến một giải pháp hiệu quả, gọn gàng và đầy tâm huyết.
`,
};

const teamMembers = [
  {
    name: "Đào Ngọc Thảo Nguyên",
    studentId: "22120234",
    role: "Business Analyst",
    image: member1,
    description:
      "Chịu trách nhiệm phân tích yêu cầu nghiệp vụ, xây dựng biểu đồ use-case, và truyền đạt thông tin giữa khách hàng và nhóm kỹ thuật.",
    gradient: "from-pink-100 via-red-100 to-orange-100",
    nameColor: "text-pink-800",
    roleColor: "text-red-700",
  },
  {
    name: "Lê Quốc Vương",
    studentId: "22120445",
    role: "Tester",
    image: member2,
    description:
      "Phụ trách viết test case, thực hiện kiểm thử chức năng và phi chức năng, đảm bảo hệ thống hoạt động đúng yêu cầu.",
    gradient: "from-purple-100 via-indigo-100 to-blue-100",
    nameColor: "text-indigo-900",
    roleColor: "text-purple-700",
  },
  {
    name: "Nguyễn Thị Anh Thi",
    studentId: "22120339",
    role: "Frontend Developer",
    image: member3,
    description:
      "Xây dựng giao diện người dùng bằng React, đảm bảo trải nghiệm mượt mà và responsive trên các thiết bị.",
    gradient: "from-yellow-100 via-pink-100 to-red-100",
    nameColor: "text-rose-800",
    roleColor: "text-yellow-700",
  },
  {
    name: "Nguyễn Tiến Quốc",
    studentId: "22120300",
    role: "Project Manager",
    image: member4,
    description:
      "Quản lý tiến độ dự án, phân công công việc và liên hệ khách hàng, đảm bảo dự án hoàn thành đúng hạn.",
    gradient: "from-green-100 via-teal-100 to-blue-100",
    nameColor: "text-green-900",
    roleColor: "text-teal-700",
  },
  {
    name: "Nguyễn Thành Đức",
    studentId: "20120070",
    role: "Backend Developer",
    image: member5,
    description:
      "Thiết kế và xây dựng API, xử lý logic phía server, kết nối cơ sở dữ liệu và đảm bảo bảo mật hệ thống.",
    // 🎨 Gradient rực rỡ hơn với tím hồng neon
    gradient: "from-fuchsia-100 via-purple-200 to-pink-200",
    nameColor: "text-fuchsia-800",
    roleColor: "text-purple-700",
  },
];

const AboutUs: React.FC = () => {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem("token") !== null;

  return (
    <div className="h-screen w-screen overflow-y-scroll snap-y snap-mandatory scroll-smooth">
      {/* Giới thiệu NDCC Clinic - Trang đầu tiên */}
      <section
        className={`snap-start h-screen flex flex-col items-center justify-center px-8 text-center bg-gradient-to-b ${introSection.gradient}`}
      >
        <img
          src={logo_ndcc}
          alt="NDCC Logo"
          className="w-40 h-40 mb-6 drop-shadow-lg"
        />

        <h1 className="text-4xl font-bold text-blue-900 mb-6">
          {introSection.title}
        </h1>
        <div className="max-w-4xl text-gray-700 text-justify overflow-y-auto p-4 bg-white bg-opacity-70 rounded-xl shadow-inner h-[42vh] leading-relaxed space-y-4">
          {introSection.content.split("\n").map((para, idx) => (
            <p key={idx}>{para.trim()}</p>
          ))}
        </div>
      </section>

      {/* Logo góc trên trái (dán cố định) */}
      <div className="fixed top-4 left-4 z-10">
        <img src={logo_ndcc} alt="NDCC Logo" className="h-12" />
      </div>

      {/* Link về Home */}
      <div className="fixed bottom-2 left-4 z-10">
        <button
          onClick={() => {
            if (isAuthenticated) {
              // Lấy currentUser từ localStorage nếu có
              const storedUser = localStorage.getItem("user");
              let currentUser = undefined;
              if (storedUser) {
                currentUser = JSON.parse(storedUser);
              }
              if (currentUser) {
                navigate("/dashboard", { state: { currentUser } });
              } else {
                navigate("/dashboard"); // fallback nếu không có user
              }
            } else {
              navigate("/");
            }
          }}
          className="text-blue-700 text-sm hover:underline bg-transparent border-none cursor-pointer"
        >
          &larr; Back to Home
        </button>
      </div>

      {/* Mỗi thành viên là một section full screen */}
      {teamMembers.map((member, index) => (
        <section
          key={index}
          className={`snap-start h-screen w-full flex flex-col items-center justify-center px-4 text-center bg-gradient-to-br ${member.gradient}`}
        >
          <img
            src={member.image}
            alt={member.name}
            className="w-40 h-40 rounded-full object-cover mb-6 border-4 border-white shadow-md"
          />
          <h2 className={`text-3xl font-bold ${member.nameColor}`}>
            {member.name}
          </h2>
          <p className="text-gray-700 mt-1">MSSV: {member.studentId}</p>
          <p className={`mt-2 text-lg font-medium ${member.roleColor}`}>
            {member.role}
          </p>
          <p className="mt-4 max-w-2xl text-gray-600">{member.description}</p>
        </section>
      ))}
    </div>
  );
};

export default AboutUs;
