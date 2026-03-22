import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'; // VS Code dark theme
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks'; // Fixes carriage returns
import rehypeRaw from 'rehype-raw'; // Allows HTML like <u>
import rehypeSlug from 'rehype-slug'; // Adds IDs to headers for the ToC
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

  const handleCancelEdit = () => {
    setContent(project.content); // Revert to last saved
    setIsEditing(false);
  };

  const handlePaste = (e) => {
    const pastedText = e.clipboardData.getData('text');
    const isUrl = /^https?:\/\//.test(pastedText); 
    
    if (isUrl) {
      const textarea = e.target;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        e.preventDefault();
        const selectedText = content.substring(start, end);
        const markdownLink = `[${selectedText}](${pastedText})`;
        
        // Deprecated but still the only way to manipulate textarea selections while keeping Ctrl+Z stack intact
        document.execCommand('insertText', false, markdownLink);
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
        level: match[1].length,
        text: match[2],
        id: match[2].toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-')
      });
    }
    return toc;
  }, [project?.content]);

  // Mini component to handle the copy button state for each code block
  const CodeBlock = ({ node, className, children, ...props }) => {
    const [copied, setCopied] = useState(false);
    const match = /language-(\w+)/.exec(className || '');
    const codeString = String(children).replace(/\n$/, '');
    const isInline = !match && !codeString.includes('\n');

    if (isInline) {
      return <code className="bg-[#2a2a2a] text-[#ce9178] px-1.5 py-0.5 rounded text-sm font-mono" {...props}>{children}</code>;
    }

    const handleCopy = () => {
      navigator.clipboard.writeText(codeString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds!
    };

    return (
      <div className="relative group mt-4 mb-4">
        <button
          onClick={handleCopy}
          className="absolute right-2 top-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 w-16 text-center"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={match ? match[1] : 'text'}
          PreTag="div"
          className="rounded-lg border border-gray-800 !m-0 !bg-[#1a1a1a]"
        >
          {codeString}
        </SyntaxHighlighter>
      </div>
    );
  };

  // Custom renderer for code blocks to add the "Copy" button
  const MarkdownComponents = {
    code: CodeBlock
  };

  if (isLoading) return <div className="p-8 text-gray-400 animate-pulse text-xl">Loading workspace...</div>;

  return (
    <div className="min-h-full flex flex-col bg-[#121212] text-white">
      
      {/* STICKY HEADER */}
      <div className="sticky top-0 z-20 flex-none p-6 border-b border-gray-800 bg-[#1a1a1a]/95 backdrop-blur-sm shadow-md">
        <div className="max-w-7xl mx-auto flex justify-between items-start">
          <div>
            {isRenaming ? (
              <div className="flex items-center gap-3">
                <input 
                  type="text" 
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="bg-[#2a2a2a] text-3xl font-bold border border-blue-500 rounded px-2 py-1 focus:outline-none"
                  autoFocus
                />
                <button onClick={() => handleSave({ title: newTitle })} className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded font-bold text-sm">Save</button>
                <button onClick={() => { setIsRenaming(false); setNewTitle(project.title); }} className="text-gray-400 hover:text-white">Cancel</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-bold">{project.title}</h1>
                <button 
                  onClick={() => setIsRenaming(true)}
                  className="bg-[#2a2a2a] hover:bg-gray-700 text-xs px-3 py-1.5 rounded text-gray-300 font-semibold transition-colors flex items-center gap-2"
                >
                  Rename
                </button>
              </div>
            )}
            
            <p className="text-gray-500 text-sm mt-2">
              Workspace · Last updated: {new Date(project.updated_at).toLocaleString()}
            </p>
          </div>
          
          <button 
            onClick={() => navigate(`/kanban/${project.id}`)}
            className="bg-[#1e1e1e] border border-green-500/50 hover:border-green-500 hover:bg-green-500/10 text-white font-bold py-3 px-6 rounded-lg shadow-lg hover:shadow-green-500/20 transition-all flex items-center gap-3"
          >
            <span className="text-xl">📋</span> Go to Kanban Board
          </button>
        </div>
      </div>

      {/* WORKSPACE AREA */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex gap-8 p-6 relative">
        
        {/* LEFT PANEL */}
        <div className="flex-1 flex flex-col bg-[#161616] rounded-lg border border-gray-800 shadow-xl overflow-hidden mb-12">
          <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1e1e]">
            <h2 className="font-semibold flex items-center gap-2"><span>📝</span> Project Notes</h2>
            <div className="flex gap-2">
              {isEditing && (
                <button onClick={handleCancelEdit} className="px-4 py-1.5 rounded text-sm font-bold bg-[#2a2a2a] hover:bg-gray-700 text-gray-300 transition-colors">
                  Cancel
                </button>
              )}
              <button
                onClick={() => isEditing ? handleSave({ content }) : setIsEditing(true)}
                disabled={isSaving}
                className={`px-4 py-1.5 rounded text-sm font-bold transition-colors ${isEditing ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {isSaving ? 'Saving...' : isEditing ? 'Save Content' : 'Edit Content'}
              </button>
            </div>
          </div>
          
          <div className="flex-1 p-6 min-h-[600px]">
            {isEditing ? (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                className="w-full h-full min-h-[600px] bg-[#1a1a1a] text-gray-200 border border-gray-700 rounded p-4 focus:outline-none focus:border-blue-500 resize-none font-mono text-sm leading-relaxed"
                placeholder="Write your markdown here..."
              />
            ) : (
              <div className="prose prose-invert max-w-none 
                prose-p:my-3 prose-p:leading-relaxed 
                prose-headings:mt-4 prose-headings:mb-2 prose-headings:scroll-mt-32
                prose-a:text-blue-400 
                prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:before:content-none prose-code:after:content-none
                prose-ol:my-2 prose-ul:my-2 prose-li:my-0
                prose-blockquote:my-3 prose-pre:my-0"
              >
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm, remarkBreaks]} 
                  rehypePlugins={[rehypeRaw, rehypeSlug]}
                  components={MarkdownComponents}
                >
                  {(project.content || '*No notes added yet. Click Edit Content to start typing!*')
                    .replace(/\r\n/g, '\n') /* Normalize classic line endings */
                    .replace(/\n{3,}/g, match => '\n\n' + '&nbsp;\n\n'.repeat(match.length - 2)) /* Safely preserve large gaps */
                  }
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL: STICKY TOC */}
        <div className="w-64 flex-none hidden lg:block">
          <div className="sticky top-32 bg-[#161616] rounded-lg border border-gray-800 p-6 shadow-xl max-h-[calc(100vh-160px)] overflow-y-auto">
            <h3 className="text-xl font-bold mb-4 border-b border-gray-800 pb-2">Table of Contents</h3>
            
            {tableOfContents.length > 0 ? (
              <ul className="space-y-3 text-sm text-gray-400">
                {tableOfContents.map((item, index) => (
                  <li key={index} style={{ marginLeft: `${(item.level - 1) * 12}px` }}>
                    <a 
                      href={`#${item.id}`} 
                      className="hover:text-blue-400 transition-colors block"
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                    >
                      {item.text}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-600 text-sm italic">Add # Headings to generate a ToC.</p>
            )}

          </div>
        </div>

      </div>
    </div>
  );
}