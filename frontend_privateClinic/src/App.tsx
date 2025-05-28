import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Navigate } from 'react-router-dom';

import Home from './pages/Home';
import MedicalExamination from './pages/MedicalExamination';
import { useAuth, AuthProvider } from './contexts/AuthContext';

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
            <Route path="/medical-examination" element={<ProtectedRoute><MedicalExamination /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </AuthProvider >
  );
}


export default App;
