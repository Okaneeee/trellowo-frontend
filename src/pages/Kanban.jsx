import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api';

export default function Kanban() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  // New states for adding items
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState('');
  
  const [addingTaskToCol, setAddingTaskToCol] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // Refs to auto-focus inputs when they appear
  const newColumnInputRef = useRef(null);
  const newTaskInputRef = useRef(null);

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

  // Auto-focus logic
  useEffect(() => {
    if (isAddingColumn && newColumnInputRef.current) newColumnInputRef.current.focus();
    if (addingTaskToCol && newTaskInputRef.current) newTaskInputRef.current.focus();
  }, [isAddingColumn, addingTaskToCol]);

  const fetchBoardData = async () => {
    try {
      const boardRes = await api.get(`/kanbans/project/${projectId}`);
      const boardData = boardRes.data;
      setBoard(boardData);

      const tasksMap = {};
      await Promise.all(
        boardData.columns.map(async (col) => {
          const tasksRes = await api.get(`/tasks/column/${col.id}`);
          tasksMap[col.id] = tasksRes.data;
        })
      );
      setTasks(tasksMap);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setBoard(null);
      } else {
        console.error('Error fetching Kanban:', error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const createBoard = async () => {
    try {
      await api.post('/kanbans', { project_id: projectId });
      fetchBoardData(); 
    } catch (error) {
      console.error('Error creating board:', error);
    }
  };

  // --- ADD COLUMN ---
  const handleAddColumn = async (e) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;

    try {
      const res = await api.post('/columns', { 
        name: newColumnName, 
        kanban_id: board.id 
      });
      // Update UI instantly
      setBoard({ ...board, columns: [...board.columns, res.data] });
      setTasks({ ...tasks, [res.data.id]: [] }); // Initialize empty task array
      setNewColumnName('');
      setIsAddingColumn(false);
    } catch (err) {
      console.error('Error adding column:', err);
    }
  };

  // --- ADD TASK ---
  const handleAddTask = async (e, columnId) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    try {
      const res = await api.post('/tasks', { 
        title: newTaskTitle, 
        column_id: columnId 
      });
      
      // Update UI instantly
      const currentTasks = tasks[columnId] || [];
      setTasks({ ...tasks, [columnId]: [...currentTasks, res.data] });
      
      setNewTaskTitle('');
      setAddingTaskToCol(null);
    } catch (err) {
      console.error('Error adding task:', err);
    }
  };

  const onDragEnd = async (result) => {
    const { destination, source, draggableId, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    // --- HANDLE COLUMN DRAGGING ---
    if (type === 'COLUMN') {
      const realColId = draggableId.replace('col-', '');
      const newColumns = Array.from(board.columns);
      const [movedColumn] = newColumns.splice(source.index, 1);
      newColumns.splice(destination.index, 0, movedColumn);

      setBoard({ ...board, columns: newColumns });

      try {
        await api.put(`/columns/${realColId}/move`, { new_position: destination.index + 1 });
      } catch (err) {
        console.error('Error moving column:', err);
        fetchBoardData();
      }
      return;
    }

    // --- HANDLE TASK DRAGGING ---
    if (type === 'TASK') {
      const realTaskId = draggableId.replace('task-', '');
      const sourceColId = parseInt(source.droppableId.replace('col-', ''));
      const destColId = parseInt(destination.droppableId.replace('col-', ''));

      if (sourceColId === destColId) {
        const newColTasks = Array.from(tasks[sourceColId]);
        const [movedTask] = newColTasks.splice(source.index, 1);
        newColTasks.splice(destination.index, 0, movedTask);
        
        setTasks({ ...tasks, [sourceColId]: newColTasks });
      } else {
        const sourceTasks = Array.from(tasks[sourceColId]);
        const destTasks = Array.from(tasks[destColId] || []);
        
        const [movedTask] = sourceTasks.splice(source.index, 1);
        destTasks.splice(destination.index, 0, movedTask);
        
        setTasks({ ...tasks, [sourceColId]: sourceTasks, [destColId]: destTasks });
      }

      try {
        await api.put(`/tasks/${realTaskId}/move`, {
          new_column_id: destColId,
          new_position: destination.index + 1,
        });
      } catch (err) {
        console.error('Error moving task:', err);
        fetchBoardData(); 
      }
    }
  };

  if (isLoading) return <div className="p-8 text-gray-400 animate-pulse text-xl">Loading your board...</div>;

  if (!board) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-[#121212] text-white">
        <h2 className="text-2xl font-bold mb-4">No Kanban Board Found</h2>
        <p className="text-gray-400 mb-8">This project doesn't have a Kanban board initialized yet.</p>
        <button onClick={createBoard} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all">
          Initialize Board
        </button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#121212] text-white overflow-hidden">
      
      {/* Header */}
      <div className="flex-none p-6 border-b border-gray-800 bg-[#1a1a1a]">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/project/${projectId}`)} className="text-gray-400 hover:text-white transition-colors">
            ← Back to Notes
          </button>
          <h1 className="text-2xl font-bold">Project Board</h1>
        </div>
      </div>

      {/* The Board Workspace */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-6">
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="board" type="COLUMN" direction="horizontal">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex h-full items-stretch">
                
                {board.columns.map((column, index) => (
                  <Draggable key={`col-${column.id}`} draggableId={`col-${column.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`w-80 flex-none flex flex-col bg-[#161616] rounded-lg border ${snapshot.isDragging ? 'border-green-500 shadow-xl' : 'border-gray-800'} h-full mr-6`}
                      >
                        
                        {/* Drag Handle (Header) */}
                        <div 
                          {...provided.dragHandleProps}
                          className="p-4 border-b border-gray-800 font-bold flex justify-between items-center bg-[#1e1e1e] rounded-t-lg"
                        >
                          {column.name}
                          <span className="text-xs text-gray-500 bg-[#2a2a2a] px-2 py-1 rounded-full">
                            {tasks[column.id]?.length || 0}
                          </span>
                        </div>

                        {/* Drop Zone for Tasks */}
                        <Droppable droppableId={`col-${column.id}`} type="TASK">
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`flex-1 p-3 overflow-y-auto ${snapshot.isDraggingOver ? 'bg-[#1a1a1a]' : ''}`}
                            >
                              {tasks[column.id]?.map((task, taskIndex) => (
                                <Draggable key={`task-${task.id}`} draggableId={`task-${task.id}`} index={taskIndex}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      className={`bg-[#2a2a2a] p-4 rounded-lg mb-3 border ${snapshot.isDragging ? 'border-blue-500 shadow-lg scale-105' : 'border-gray-700 hover:border-gray-500'} transition-colors cursor-pointer`}
                                    >
                                      <p className="font-semibold">{task.title}</p>
                                      {task.description && (
                                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{task.description}</p>
                                      )}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                        
                        {/* Dynamic Add Task Section */}
                        <div className="p-3 border-t border-gray-800 bg-[#1e1e1e] rounded-b-lg flex-none">
                          {addingTaskToCol === column.id ? (
                            <form onSubmit={(e) => handleAddTask(e, column.id)} className="flex flex-col gap-2">
                              <textarea 
                                ref={newTaskInputRef}
                                value={newTaskTitle}
                                onChange={(e) => setNewTaskTitle(e.target.value)}
                                placeholder="Enter a title for this card..."
                                className="w-full bg-[#2a2a2a] text-white border border-blue-500 rounded p-2 focus:outline-none resize-none text-sm"
                                rows={2}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleAddTask(e, column.id);
                                  }
                                }}
                              />
                              <div className="flex gap-2 items-center">
                                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">
                                  Add card
                                </button>
                                <button 
                                  type="button" 
                                  onClick={() => { setAddingTaskToCol(null); setNewTaskTitle(''); }}
                                  className="text-gray-400 hover:text-white text-xl font-bold px-2"
                                >
                                  ×
                                </button>
                              </div>
                            </form>
                          ) : (
                            <button 
                              onClick={() => setAddingTaskToCol(column.id)}
                              className="w-full text-left text-gray-400 hover:text-white hover:bg-[#2a2a2a] p-2 rounded transition-colors text-sm font-semibold flex items-center gap-2"
                            >
                              <span>+</span> Add a card
                            </button>
                          )}
                        </div>

                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Dynamic Add Column Section */}
                {isAddingColumn ? (
                  <form 
                    onSubmit={handleAddColumn} 
                    className="w-80 flex-none bg-[#161616] p-3 rounded-lg border border-blue-500 flex flex-col gap-2 h-fit"
                  >
                    <input 
                      ref={newColumnInputRef}
                      type="text" 
                      value={newColumnName}
                      onChange={(e) => setNewColumnName(e.target.value)}
                      placeholder="Enter list title..."
                      className="w-full bg-[#2a2a2a] text-white border border-gray-700 rounded p-2 focus:outline-none text-sm font-semibold"
                    />
                    <div className="flex gap-2 items-center">
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm font-bold transition-colors">
                        Add list
                      </button>
                      <button 
                        type="button" 
                        onClick={() => { setIsAddingColumn(false); setNewColumnName(''); }}
                        className="text-gray-400 hover:text-white text-xl font-bold px-2"
                      >
                        ×
                      </button>
                    </div>
                  </form>
                ) : (
                  <div 
                    onClick={() => setIsAddingColumn(true)}
                    className="w-80 flex-none h-12 bg-[#1e1e1e]/50 border border-gray-800 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 hover:bg-[#1e1e1e] cursor-pointer transition-colors font-semibold"
                  >
                    + Add another list
                  </div>
                )}

              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}