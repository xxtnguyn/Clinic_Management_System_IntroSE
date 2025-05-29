import { Link } from "react-router-dom";
import themeImage from "../assets/theme.png";

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

  console.log(currentUser);
  return (
    <>
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
                state={{
                  user: currentUser,
                }}
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
      <img
        src={themeImage}
        alt="Theme Overlay"
        className="absolute w-full h-[8vh] object-cover z-10"
      />
    </>
  );
}
