import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function Projects() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [projects, setProjects] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newProjectTitle, setNewProjectTitle] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectTitle.trim()) return;

    try {
      const response = await api.post('/projects', { 
        title: newProjectTitle,
        content: '# Welcome to your new project!\nStart typing here...' 
      });
      setProjects([response.data, ...projects]);
      setNewProjectTitle('');
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold ml-4">Your Projects</h1>
        </div>
      </div>
      
      {isLoading ? (
        <div className="text-center text-gray-400 mt-20 text-xl animate-pulse">Loading your workspace...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          <div className="bg-[#1e1e1e] border border-gray-700 border-dashed rounded-lg p-6 flex flex-col justify-center items-center hover:border-blue-500 transition-colors">
            <h2 className="text-xl font-semibold mb-4 text-gray-300">Create New Project</h2>
            <form onSubmit={handleCreateProject} className="w-full flex flex-col gap-3">
              <input 
                type="text" 
                placeholder="Project Title..."
                value={newProjectTitle}
                onChange={(e) => setNewProjectTitle(e.target.value)}
                className="w-full bg-[#2a2a2a] text-white border border-gray-600 rounded p-3 focus:outline-none focus:border-blue-500 transition-colors"
                maxLength={50}
                required
              />
              <button 
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
              >
                + Add Project
              </button>
            </form>
          </div>

          {projects.map((project) => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/project/${project.id}`)}
              className="bg-[#1e1e1e] border border-gray-800 rounded-lg p-6 cursor-pointer hover:border-gray-500 hover:shadow-lg hover:-translate-y-1 transition-all group flex flex-col justify-between min-h-[200px]"
            >
              <div>
                <h2 className="text-2xl font-bold mb-2 group-hover:text-blue-400 transition-colors">{project.title}</h2>
                <p className="text-gray-500 text-sm mb-4">
                  Last updated: {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex justify-end text-gray-600 group-hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </div>
            </div>
          ))}
          
        </div>
      )}
    </div>
  );
}