import { memo } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';
import { DeadlineDisplay } from './DeadlineDisplay';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
}

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'High':
      return 'text-red-600';
    case 'Medium':
      return 'text-yellow-600';
    default:
      return 'text-green-600';
  }
};

export const TaskCard = memo(({ task, onToggle }: TaskCardProps) => (
  <div
    className={`task-enter bg-white rounded-lg shadow p-6 transform transition-all duration-300 ease-in-out hover:shadow-lg ${
      task.completed ? 'task-complete opacity-75' : ''
    }`}
  >
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => onToggle(task.id)}
            className="text-gray-500 hover:text-gray-700 transition-colors duration-200"
          >
            {task.completed ? (
              <CheckCircle2 className="w-6 h-6 text-green-600 transform transition-transform duration-200 hover:scale-110" />
            ) : (
              <Circle className="w-6 h-6 transform transition-transform duration-200 hover:scale-110" />
            )}
          </button>
          <h3 className={`text-lg font-semibold transition-all duration-300 ${
            task.completed ? 'line-through text-gray-500' : 'text-gray-900'
          }`}>
            {task.description}
          </h3>
        </div>
        <p className="text-gray-600 ml-9">{task.creative_idea}</p>
      </div>
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-gray-600">{task.estimatedTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <AlertCircle className={`w-4 h-4 ${getPriorityColor(task.priority)}`} />
          <span className={getPriorityColor(task.priority)}>{task.priority}</span>
        </div>
        {task.deadline && <DeadlineDisplay deadline={task.deadline} />}
      </div>
    </div>
  </div>
), (prevProps, nextProps) => {
  return prevProps.task.completed === nextProps.task.completed &&
         prevProps.task.deadline === nextProps.task.deadline;
});

TaskCard.displayName = 'TaskCard';