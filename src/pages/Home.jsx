import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Home() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [recentProjects, setRecentProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const response = await api.get('/projects');
        // 3 most recently updated projects
        setRecentProjects(response.data.slice(0, 3)); 
      } catch (error) {
        console.error('Error fetching recent projects:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchRecent();
  }, []);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {/* Top Section */}
      <div className="text-center mb-16 mt-8">
        <h1 className="text-4xl font-bold mb-4">
          Welcome to Trell<span className="text-blue-500">OwO</span>, {user.username}!
        </h1>
        <p className="text-gray-400 text-lg">
          Your personal workspace for markdown notes and Kanban boards. <br/>
          Check out your recent projects and boards below!
        </p>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-500 animate-pulse">Loading recent activity...</div>
      ) : (
        <div className="space-y-12">
          
          {/* Recent Projects Row */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Projects</h2>
              <button 
                onClick={() => navigate('/projects')}
                className="group flex items-center gap-2 px-5 py-2 rounded-full bg-[#1e1e1e] border border-gray-800 text-sm font-semibold text-gray-400 hover:text-white transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              >
                <span>See all</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map(project => (
                <div 
                  key={`proj-${project.id}`}
                  onClick={() => navigate(`/project/${project.id}`)}  // Points to the projects page
                  className="bg-[#1e1e1e] border border-gray-800 rounded-lg h-40 p-6 cursor-pointer hover:border-blue-500 hover:-translate-y-1 transition-all group flex flex-col justify-between"
                >
                  <h3 className="text-xl font-bold group-hover:text-blue-400 transition-colors">{project.title}</h3>
                  <p className="text-sm text-gray-500">Updated: {new Date(project.updated_at).toLocaleDateString()}</p>
                </div>
              ))}
              {recentProjects.length === 0 && <p className="text-gray-500 col-span-3">No projects yet. Create one to get started!</p>}
            </div>
          </section>

          {/* Recent Kanbans Row (Using the same data for now since Kanbans are inside Projects) */}
          <section>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Recent Kanbans</h2>
              <button 
                onClick={() => navigate('/kanbans')}
                className="group flex items-center gap-2 px-5 py-2 rounded-full bg-[#1e1e1e] border border-gray-800 text-sm font-semibold text-gray-400 hover:text-white transition-all duration-300 hover:border-blue-500 hover:shadow-[0_0_15px_rgba(59,130,246,0.15)]"
              >
                <span>See all</span>
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className="w-4 h-4 transform transition-transform duration-300 group-hover:translate-x-1" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentProjects.map(project => (
                <div 
                  key={`kanban-${project.id}`}
                  onClick={() => navigate(`/kanban/${project.id}`)} // Points to the Kanbans page
                  className="bg-[#1e1e1e] border border-gray-800 rounded-lg h-40 p-6 cursor-pointer hover:border-green-500 hover:-translate-y-1 transition-all group flex flex-col justify-between"
                >
                  <h3 className="text-xl font-bold group-hover:text-green-400 transition-colors">{project.title} Board</h3>
                  <p className="text-sm text-gray-500">Quick Access</p>
                </div>
              ))}
              {recentProjects.length === 0 && <p className="text-gray-500 col-span-3">No boards yet.</p>}
            </div>
          </section>

        </div>
      )}
    </div>
  );
}