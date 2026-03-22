import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import api from '../api';

export default function Project() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Editor & Title states
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [isRenaming, setIsRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const response = await api.get(`/projects/${id}`);
        setProject(response.data);
        setContent(response.data.content || '');
        setNewTitle(response.data.title || '');
      } catch (error) {
        console.error('Error fetching project:', error);
        navigate('/projects'); 
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjectDetails();
  }, [id, navigate]);

  // Handle saving BOTH content and title changes
  const handleSave = async (updatedFields) => {
    setIsSaving(true);
    try {
      const response = await api.put(`/projects/${id}`, updatedFields);
      // Update local state dynamically
      setProject(response.data);
      setIsEditing(false);
      setIsRenaming(false);
    } catch (error) {
      console.error('Error saving project:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Smart Paste Functionality (Text selection + URL = Markdown Link)
  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    // Check if what they pasted is a URL
    const isUrl = /^https?:\/\//.test(pastedText); 
    
    if (isUrl) {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      // If text is highlighted
      if (start !== end) {
        e.preventDefault(); // Stop normal paste
        const selectedText = content.substring(start, end);
        // Format it: [selected text](url)
        const newText = `${content.substring(0, start)}[${selectedText}](${pastedText})${content.substring(end)}`;
        setContent(newText);
      }
    }
  };

  // Generate Table of Contents from Markdown Headers
  const tableOfContents = useMemo(() => {
    if (!project?.content) return [];
    
    // Regex to find # Header 1, ## Header 2, ### Header 3
    const headerRegex = /^(#{1,3})\s+(.+)$/gm;
    const toc = [];
    let match;
    
    while ((match = headerRegex.exec(project.content)) !== null) {
      toc.push({
        level: match[1].length, // Number of # symbols
        text: match[2],
        // Create an ID-friendly string (lowercase & replace spaces with hyphens)
        id: match[2].toLowerCase().replace(/\s+/g, '-')
      });
    }
    return toc;
  }, [project?.content]);

  if (isLoading) {
    return <div className="p-8 text-gray-400 animate-pulse text-xl">Loading workspace...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white overflow-y-auto">
      
      {/* Header Area */}
      <div className="flex-none p-6 border-b border-gray-800 bg-[#1a1a1a]">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            {/* Title Renaming Logic */}
            {isRenaming ? (
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-[#2a2a2a] text-3xl font-bold border border-blue-500 rounded px-2 py-1 focus:outline-none"
                  autoFocus
                />
                <button 
                  onClick={() => handleSave({ title: newTitle })}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded font-bold text-sm"
                >
                  Save
                </button>
                <button 
                  onClick={() => { setIsRenaming(false); setNewTitle(project.title); }}
                  className="text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 group">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <button 
                  onClick={() => setIsRenaming(true)}
                  className="opacity-0 group-hover:opacity-100 text-gray-500 hover:text-blue-400 transition-opacity"
                  title="Rename Project"
                >
                  ✏️
                </button>
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-1">
              Workspace · Last updated: {new Date(project.updated_at).toLocaleString()}
            </p>
          </div>
          
          {/* Big Kanban Button */}
          <button 
            onClick={() => navigate(`/kanban/${project.id}`)}
            className="bg-[#1e1e1e] border border-green-500/50 hover:border-green-500 hover:bg-green-500/10 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-3"
          >
            <span className="text-xl">📋</span>
            Go to Kanban Board
          </button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-8 p-6">
        
        {/* LEFT PANEL: Markdown Editor */}
        <div className="flex-1 flex flex-col bg-[#161616] rounded-lg border border-gray-800 shadow-xl overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1e1e]">
            <h2 className="font-semibold flex items-center gap-2">
              <span>📝</span> Project Notes
            </h2>
            <button
              onClick={() => isEditing ? handleSave({ content }) : setIsEditing(true)}
              disabled={isSaving}
              className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${
                isEditing 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-[#2a2a2a] hover:bg-gray-700 text-gray-300'
              }`}
            >
              {isSaving ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </button>
          </div>
          
          <div className="flex-1 p-6 min-h-[600px]">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                className="w-full h-full min-h-[500px] bg-[#1a1a1a] text-gray-200 border border-gray-700 rounded p-4 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Write your markdown here... (Try highlighting text and pasting a link!)"
              />
            ) : (
              <div className="prose prose-invert max-w-none prose-a:text-blue-400 prose-headings:text-white prose-code:bg-[#2a2a2a] prose-code:px-1 prose-code:rounded prose-pre:bg-[#1a1a1a] prose-pre:border prose-pre:border-gray-800">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {project.content || '*No notes added yet. Click Edit to start typing!*'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: Sticky Table of Contents */}
        <div className="w-64 flex-none hidden lg:block">
          <div className="sticky top-6 bg-[#161616] rounded-lg border border-gray-800 p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Table of Contents</h3>
            
            {tableOfContents.length > 0 ? (
              <ul className="space-y-2 text-sm text-gray-400">
                {tableOfContents.map((item, index) => (
                  <li 
                    key={index} 
                    style={{ marginLeft: `${(item.level - 1) * 12}px` }}
                    className="hover:text-blue-400 cursor-pointer transition-colors"
                  >
                    {item.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm italic">
                Add # Headings to your notes to generate a table of contents.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}