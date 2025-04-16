import React from 'react';
import { ListTodo, CheckSquare, Settings, Menu, X, CalendarIcon } from 'lucide-react';

interface SidebarProps {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  isLargeScreen: boolean;
  isMobile: boolean;
  activeTasks: number;
  completedTasks: number;
  showCompleted: boolean;
  setShowCompleted: (show: boolean) => void;
  isDarkMode: boolean;
  toggleTheme: () => void;
  t: any;
  showCalendar?: boolean;
  setShowCalendar: (show: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setSidebarOpen,
  activeTasks,
  completedTasks,
  showCompleted,
  setShowCompleted,
  t,
  showCalendar = false,
  setShowCalendar,
  isMobile,
}) => {
  // 菜单项点击处理
  const handleMenuItemClick = (callback: () => void) => {
    callback();
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <>
      {/* 遮罩层仅在移动端显示 */}
      {isMobile && (
        <div
          className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-20 transition-all duration-300
            ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏主体 */}
      <aside
        className={`sidebar${isSidebarOpen ? ' open' : ''} fixed top-0 left-0 h-full z-30 transition-all duration-300 ease-in-out`}
      >
        {/* 侧边栏头部 */}
        <div className="sidebar-header flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {/* 菜单按钮：始终可见 */}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="sidebar-toggle-btn p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
              transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle sidebar"
            style={{ zIndex: 50 }}
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          {/* 只在展开时显示标题 */}
          {isSidebarOpen && (
            <h1 className="ml-4 text-base font-medium text-gray-900 dark:text-white whitespace-nowrap overflow-hidden transition-opacity duration-200">
              Better Reminder
            </h1>
          )}
        </div>

        {/* 侧边栏内容 */}
        <div className="flex flex-col h-[calc(100%-4rem)]">
          {/* 主菜单内容 */}
          <div className="sidebar-content p-3 space-y-6 flex-1 flex flex-col">
            <nav className="space-y-1">
              {/* 活动任务 */}
              <div
                className={`sidebar-item group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200
                  ${!showCompleted && !showCalendar ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                onClick={() => handleMenuItemClick(() => {
                  setShowCompleted(false);
                  setShowCalendar(false);
                })}
              >
                <div className={`flex items-center justify-center ${!showCompleted && !showCalendar ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <ListTodo className="w-5 h-5" />
                </div>
                {isSidebarOpen && (
                  <span className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap flex-grow
                    ${!showCompleted && !showCalendar ? 'text-blue-600 dark:text-blue-300' : 'text-gray-700 dark:text-gray-200'}`}>
                    {t.activeTasks} {activeTasks > 0 && `(${activeTasks})`}
                  </span>
                )}
              </div>
              {/* 已完成任务 */}
              <div
                className={`sidebar-item group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200
                  ${showCompleted ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                onClick={() => handleMenuItemClick(() => setShowCompleted(true))}
              >
                <div className={`flex items-center justify-center ${showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <CheckSquare className="w-5 h-5" />
                </div>
                {isSidebarOpen && (
                  <span className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap flex-grow
                    ${showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t.completedTasks} {completedTasks > 0 && `(${completedTasks})`}
                  </span>
                )}
              </div>
              {/* 日历视图 */}
              <div
                className={`sidebar-item group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                  hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200
                  ${showCalendar ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
                onClick={() => handleMenuItemClick(() => {
                  setShowCalendar(true);
                  setShowCompleted(false);
                })}
              >
                <div className={`flex items-center justify-center ${showCalendar ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                  <CalendarIcon className="w-5 h-5" />
                </div>
                {isSidebarOpen && (
                  <span className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap flex-grow
                    ${showCalendar ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                    {t.calendarView || '日历视图'}
                  </span>
                )}
              </div>
            </nav>
          </div>
          {/* 底部控制项 */}
          <div className="sidebar-footer flex flex-col pb-4">
            {/* 设置项 */}
            <div
              className={`sidebar-item group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 w-full justify-center ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
              onClick={() => handleMenuItemClick(() => {})}
              aria-label={t.settings || '设置'}
              tabIndex={0}
              role="button"
            >
              <span>
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </span>
              {isSidebarOpen && (
                <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {t.settings || '设置'}
                </span>
              )}
            </div>
            {/* 版本信息 */}
            {isSidebarOpen && (
              <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-500">
                Better Reminder v1.0
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;