import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';

function App() {
  return (
    <Router>
      <div className="flex h-screen w-screen">
        <Routes>
          <Route path="/" element={<Home />} />
        </Routes>
      </div>

    </Router>
  );
}
export default App;
