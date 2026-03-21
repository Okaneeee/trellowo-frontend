import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  
  // Grab the user name
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Logging out
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/'); // Send them back to the root (Login)
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Welcome back, {user.username}! 👋</h1>
        <button 
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded font-bold transition-colors"
        >
          Logout
        </button>
      </div>
      
      <p className="text-gray-400">Lorem ipsum content</p>
    </div>
  );
}