import { useState, useRef, useEffect, useCallback } from 'react';
import { useTheme, useConfig, useTranslations } from '@openclaw-hub/api';

const i18n = {
  en: { addTask: '+ Add task', add: 'Add', placeholder: 'Task name...', defaultCols: 'Todo,In Progress,Done' },
  sv: { addTask: '+ Lägg till', add: 'Lägg till', placeholder: 'Uppgiftsnamn...', defaultCols: 'Att göra,Pågående,Klart' },
  de: { addTask: '+ Hinzufügen', add: 'Hinzufügen', placeholder: 'Aufgabenname...', defaultCols: 'Zu erledigen,In Bearbeitung,Fertig' },
  fr: { addTask: '+ Ajouter', add: 'Ajouter', placeholder: 'Nom de la tâche...', defaultCols: 'À faire,En cours,Terminé' },
  es: { addTask: '+ Añadir', add: 'Añadir', placeholder: 'Nombre de tarea...', defaultCols: 'Por hacer,En progreso,Hecho' },
  pt: { addTask: '+ Adicionar', add: 'Adicionar', placeholder: 'Nome da tarefa...', defaultCols: 'A fazer,Em progresso,Concluído' },
  ja: { addTask: '+ 追加', add: '追加', placeholder: 'タスク名...', defaultCols: 'やること,進行中,完了' },
  zh: { addTask: '+ 添加', add: '添加', placeholder: '任务名称...', defaultCols: '待办,进行中,已完成' },
};

const STORAGE_KEY = 'kanban-board-data';

function loadBoard(columns) {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {}
  // Default: empty columns
  return columns.reduce((acc, col) => ({ ...acc, [col]: [] }), {});
}

function saveBoard(board) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(board));
  } catch {}
}

let idCounter = Date.now();
function uid() { return `task-${idCounter++}`; }

export default function KanbanBoard() {
  const theme = useTheme();
  const [config] = useConfig('kanban');
  const t = useTranslations(i18n);
  
  const columnNames = (config.columns || t('defaultCols'))
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const [board, setBoard] = useState(() => loadBoard(columnNames));
  const [dragging, setDragging] = useState(null); // { id, fromCol }
  const [dragOver, setDragOver] = useState(null); // column name
  const [newTask, setNewTask] = useState('');
  const [addingTo, setAddingTo] = useState(null); // column name
  const inputRef = useRef(null);

  // Ensure all columns exist
  useEffect(() => {
    setBoard(prev => {
      const next = { ...prev };
      let changed = false;
      for (const col of columnNames) {
        if (!next[col]) { next[col] = []; changed = true; }
      }
      return changed ? next : prev;
    });
  }, [columnNames.join(',')]);

  // Save on change
  useEffect(() => { saveBoard(board); }, [board]);

  // Focus input when adding
  useEffect(() => {
    if (addingTo && inputRef.current) inputRef.current.focus();
  }, [addingTo]);

  const addTask = useCallback((col) => {
    if (!newTask.trim()) return;
    setBoard(prev => ({
      ...prev,
      [col]: [...(prev[col] || []), { id: uid(), text: newTask.trim(), created: Date.now() }],
    }));
    setNewTask('');
    setAddingTo(null);
  }, [newTask]);

  const deleteTask = useCallback((col, taskId) => {
    setBoard(prev => ({
      ...prev,
      [col]: (prev[col] || []).filter(t => t.id !== taskId),
    }));
  }, []);

  const handleDragStart = (e, taskId, fromCol) => {
    setDragging({ id: taskId, fromCol });
    e.dataTransfer.effectAllowed = 'move';
    // For Firefox
    e.dataTransfer.setData('text/plain', taskId);
  };

  const handleDragOver = (e, col) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(col);
  };

  const handleDragLeave = () => { setDragOver(null); };

  const handleDrop = (e, toCol) => {
    e.preventDefault();
    setDragOver(null);
    if (!dragging) return;
    const { id, fromCol } = dragging;
    if (fromCol === toCol) { setDragging(null); return; }

    setBoard(prev => {
      const task = (prev[fromCol] || []).find(t => t.id === id);
      if (!task) return prev;
      return {
        ...prev,
        [fromCol]: (prev[fromCol] || []).filter(t => t.id !== id),
        [toCol]: [...(prev[toCol] || []), task],
      };
    });
    setDragging(null);
  };

  const handleDragEnd = () => { setDragging(null); setDragOver(null); };

  const colColors = [
    { bg: 'rgba(99,102,241,0.08)', dot: '#6366f1', border: 'rgba(99,102,241,0.2)' },
    { bg: 'rgba(245,158,11,0.08)', dot: '#f59e0b', border: 'rgba(245,158,11,0.2)' },
    { bg: 'rgba(34,197,94,0.08)',  dot: '#22c55e', border: 'rgba(34,197,94,0.2)' },
    { bg: 'rgba(168,85,247,0.08)', dot: '#a855f7', border: 'rgba(168,85,247,0.2)' },
    { bg: 'rgba(236,72,153,0.08)', dot: '#ec4899', border: 'rgba(236,72,153,0.2)' },
  ];

  return (
    <div style={{ display: 'flex', gap: '0.75rem', minHeight: 200, overflowX: 'auto' }}>
      {columnNames.map((col, ci) => {
        const tasks = board[col] || [];
        const colors = colColors[ci % colColors.length];
        const isOver = dragOver === col;

        return (
          <div
            key={col}
            onDragOver={(e) => handleDragOver(e, col)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col)}
            style={{
              flex: 1,
              minWidth: 180,
              background: isOver ? colors.bg : (theme.isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'),
              border: `1px solid ${isOver ? colors.border : 'transparent'}`,
              borderRadius: '0.75rem',
              padding: '0.75rem',
              transition: 'all 0.15s ease',
            }}
          >
            {/* Column header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: colors.dot, flexShrink: 0,
              }} />
              <span style={{
                fontSize: '0.8rem', fontWeight: 600,
                color: theme.text, flex: 1,
              }}>
                {col}
              </span>
              <span style={{
                fontSize: '0.65rem', fontWeight: 500,
                color: theme.muted,
                background: theme.isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                padding: '0.1rem 0.4rem', borderRadius: '0.5rem',
              }}>
                {tasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', minHeight: 40 }}>
              {tasks.map(task => (
                <div
                  key={task.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, task.id, col)}
                  onDragEnd={handleDragEnd}
                  style={{
                    background: theme.isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
                    borderRadius: '0.5rem',
                    padding: '0.5rem 0.6rem',
                    fontSize: '0.75rem',
                    color: theme.text,
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.4rem',
                    opacity: dragging?.id === task.id ? 0.4 : 1,
                    transition: 'opacity 0.15s',
                  }}
                >
                  <span style={{ flex: 1, lineHeight: 1.4 }}>{task.text}</span>
                  <button
                    onClick={() => deleteTask(col, task.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: theme.muted, fontSize: '0.85rem', lineHeight: 1,
                      padding: '0 2px', flexShrink: 0, opacity: 0.5,
                    }}
                    onMouseEnter={(e) => { e.target.style.opacity = '1'; e.target.style.color = '#ef4444'; }}
                    onMouseLeave={(e) => { e.target.style.opacity = '0.5'; e.target.style.color = theme.muted; }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add task */}
            {addingTo === col ? (
              <div style={{ marginTop: '0.4rem' }}>
                <input
                  ref={inputRef}
                  value={newTask}
                  onChange={(e) => setNewTask(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addTask(col);
                    if (e.key === 'Escape') { setAddingTo(null); setNewTask(''); }
                  }}
                  placeholder={t('placeholder')}
                  style={{
                    width: '100%',
                    background: theme.isDark ? 'rgba(255,255,255,0.05)' : '#fff',
                    border: `1px solid ${theme.accent}`,
                    borderRadius: '0.4rem',
                    padding: '0.4rem 0.5rem',
                    fontSize: '0.75rem',
                    color: theme.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <div style={{ display: 'flex', gap: '0.3rem', marginTop: '0.3rem' }}>
                  <button
                    onClick={() => addTask(col)}
                    style={{
                      flex: 1, padding: '0.3rem',
                      background: theme.accent, color: '#000',
                      border: 'none', borderRadius: '0.3rem',
                      fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                    }}
                  >
                    {t('add')}
                  </button>
                  <button
                    onClick={() => { setAddingTo(null); setNewTask(''); }}
                    style={{
                      padding: '0.3rem 0.6rem',
                      background: 'transparent', color: theme.muted,
                      border: `1px solid ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                      borderRadius: '0.3rem',
                      fontSize: '0.7rem', cursor: 'pointer',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setAddingTo(col); setNewTask(''); }}
                style={{
                  width: '100%', marginTop: '0.4rem',
                  padding: '0.35rem',
                  background: 'transparent',
                  border: `1px dashed ${theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  borderRadius: '0.4rem',
                  fontSize: '0.7rem',
                  color: theme.muted,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = theme.accent;
                  e.target.style.color = theme.accent;
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
                  e.target.style.color = theme.muted;
                }}
              >
                {t('addTask')}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
