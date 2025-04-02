import React from 'react';
import { Loader2 } from 'lucide-react';
import { AnimatedText } from './AnimatedText';

interface TaskFormProps {
  newTask: string;
  setNewTask: (task: string) => void;
  isLoading: boolean;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  t: any;
  isLangMenuOpen: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({
  newTask,
  setNewTask,
  isLoading,
  handleSubmit,
  t,
  isLangMenuOpen
}) => {
  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setNewTask(textarea.value);
    
    textarea.style.height = 'auto';
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e as any);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-8 animate-fade-in">
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <textarea
            value={newTask}
            onChange={handleTextareaInput}
            onKeyDown={handleKeyDown}
            placeholder={t.inputPlaceholder}
            className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-800 
              dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-theme duration-theme ease-theme 
              hover:border-blue-400 min-h-[48px] max-h-[300px] resize-none overflow-hidden
              text-gray-700 dark:text-gray-200 leading-relaxed ${isLangMenuOpen ? 'placeholder-fade-out' : 'placeholder-fade-in'}`}
            disabled={isLoading}
            rows={1}
            style={{height: 'auto', minHeight: '48px'}}
          />
          <div className="absolute right-2 bottom-2 text-xs text-gray-400 dark:text-gray-500">
            {t.newLine}
          </div>
        </div>
        <button
          type="submit"
          disabled={isLoading || !newTask.trim()}
          className="px-6 py-2 bg-blue-600 dark:bg-blue-500 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 
            disabled:opacity-50 disabled:cursor-not-allowed transition-theme duration-theme ease-theme
            transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {isLoading ? (
            <div className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              <AnimatedText text={t.analyzing} duration={600} />
            </div>
          ) : (
            <AnimatedText text={t.generate} duration={600} />
          )}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;