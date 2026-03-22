import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Project from './pages/Project';
import Layout from './components/Layout';

// Bouncer
function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        
        {/* We wrap all protected routes inside the Layout component */}
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          {/* These will appear inside the <Outlet /> of the Layout */}
          <Route path="/home" element={<Home />} />
          <Route path="/projects" element={<Projects />} />
          
          {/* Dynamic route for individual projects */}
          <Route path="/project/:id" element={<Project />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;