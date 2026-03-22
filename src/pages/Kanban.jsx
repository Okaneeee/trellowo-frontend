import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api';

export default function Kanban() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [tasks, setTasks] = useState({}); 
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchBoardData();
  }, [projectId]);

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

      // FIX: Safely separate state mutation for same-column vs different-column dragging!
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
              // FIX: Removed 'gap-6' and 'items-start'. Let the columns stretch full height natively!
              <div ref={provided.innerRef} {...provided.droppableProps} className="flex h-full items-stretch">
                
                {board.columns.map((column, index) => (
                  <Draggable key={`col-${column.id}`} draggableId={`col-${column.id}`} index={index}>
                    {(provided, snapshot) => (
                      <div 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        // FIX: Added 'h-full' and 'mr-6' (margin-right replaces gap)
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
                              // FIX: flex-1 makes this background stretch all the way to the Add Card button!
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
                        
                        {/* Quick Add Task Button */}
                        <div className="p-3 border-t border-gray-800 bg-[#1e1e1e] rounded-b-lg flex-none">
                          <button className="w-full text-left text-gray-400 hover:text-white hover:bg-[#2a2a2a] p-2 rounded transition-colors text-sm font-semibold flex items-center gap-2">
                            <span>+</span> Add a card
                          </button>
                        </div>

                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
                
                {/* Add Column Button */}
                <div className="w-80 flex-none h-12 bg-[#1e1e1e]/50 border border-gray-800 border-dashed rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:border-gray-500 cursor-pointer transition-colors">
                  + Add another list
                </div>

              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </div>
  );
}