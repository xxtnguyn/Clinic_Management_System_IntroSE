import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Navigate } from "react-router-dom";

import Home from "./pages/Home";
import PatientRecord from "./pages/PatientRecords";
import MedicalExamination from "./pages/MedicalExamination";
import AppointmentList from "./pages/AppointmentList";
import Invoice from "./pages/Invoice";
import { useAuth, AuthProvider } from "./contexts/AuthContext";
import Dashboard from "./pages/Dashboard";
import Regulations from "./pages/Regulations";
import Report from "./pages/Report";
import AboutUs from "./pages/AboutUs";
import Profile from "./pages/Profile";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="flex h-screen w-screen">
          <Routes>
            <Route path="/login" element={<Home />} />
            <Route path="/" element={<Home />} />
            <Route
              path="/medical-examination-form"
              element={
                <ProtectedRoute>
                  <MedicalExamination />
                </ProtectedRoute>
              }
            />
            <Route
              path="/patient-records"
              element={
                <ProtectedRoute>
                  <PatientRecord />
                </ProtectedRoute>
              }
            />
            <Route
              path="/appointment-list"
              element={
                <ProtectedRoute>
                  <AppointmentList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/invoice"
              element={
                <ProtectedRoute>
                  <Invoice />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regulations"
              element={
                <ProtectedRoute>
                  <Regulations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report"
              element={
                <ProtectedRoute>
                  <Report />
                </ProtectedRoute>
              }
            />
            <Route path="/about-us" element={<AboutUs />} />
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
