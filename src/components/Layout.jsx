import { useState } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation(); // Know which tab is active

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // Helper to highlight the active menu item
  const isActive = (path) => location.pathname === path ? 'bg-blue-600/20 text-blue-500 border-r-4 border-blue-500' : 'text-gray-400 hover:bg-[#2a2a2a] hover:text-white';

  return (
    <div className="flex min-h-screen bg-[#121212] text-white">
      
      {/* SIDEBAR */}
      <div 
        className={`${isSidebarOpen ? 'w-64' : 'w-20'} bg-[#1e1e1e] border-r border-gray-800 transition-all duration-300 flex flex-col relative`}
      >
        {/* Toggle Button */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-1/2 transform -translate-y-1/2 flex items-center justify-center w-8 h-8 bg-[#1e1e1e] border border-gray-700 rounded-full shadow-lg hover:bg-[#2a2a2a] hover:border-blue-500 hover:text-blue-500 text-gray-400 z-20 transition-all duration-300 focus:outline-none group"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            className={`w-4 h-4 transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        {/* Logo */}
        <div className="h-20 flex items-center justify-center border-b border-gray-800">
          <h1 className={`font-bold transition-all ${isSidebarOpen ? 'text-3xl' : 'text-xl'} overflow-hidden whitespace-nowrap`}>
            {isSidebarOpen ? <>Trell<span className="text-blue-500">OwO</span></> : <span className="text-blue-500">OwO</span>}
          </h1>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-6 flex flex-col gap-2">
          <button onClick={() => navigate('/home')} className={`p-4 text-left font-semibold transition-colors flex items-center gap-4 ${isActive('/home')}`}>
            <span className="text-xl">🏠</span> 
            {isSidebarOpen && <span>Home</span>}
          </button>
          <button onClick={() => navigate('/projects')} className={`p-4 text-left font-semibold transition-colors flex items-center gap-4 ${isActive('/projects')}`}>
            <span className="text-xl">📁</span> 
            {isSidebarOpen && <span>Projects</span>}
          </button>
          <button onClick={() => navigate('/kanbans')} className={`p-4 text-left font-semibold transition-colors flex items-center gap-4 ${isActive('/kanbans')}`}>
            <span className="text-xl">📋</span> 
            {isSidebarOpen && <span>Kanbans</span>}
          </button>
        </nav>

        {/* Logout Button*/}
        <div className="p-4 border-t border-gray-800">
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center ${isSidebarOpen ? 'justify-start px-4' : 'justify-center'} gap-3 py-3 text-red-500 hover:bg-red-500/10 rounded font-bold transition-colors`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 overflow-y-auto">
        {/* Placeholder for routed components */}
        <Outlet /> 
      </div>
    </div>
  );
}