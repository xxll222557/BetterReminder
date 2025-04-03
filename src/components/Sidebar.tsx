import React from 'react';
import { ListTodo, CheckSquare, Settings, MoonIcon, SunIcon, Menu, X } from 'lucide-react';
import { AnimatedText } from './AnimatedText';

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
  t: any; // 翻译对象
}

const Sidebar: React.FC<SidebarProps> = ({
  isSidebarOpen,
  setSidebarOpen,
  isLargeScreen,
  isMobile,
  activeTasks,
  completedTasks,
  showCompleted,
  setShowCompleted,
  isDarkMode,
  toggleTheme,
  t
}) => {
  // 添加这个处理函数来封装菜单项点击逻辑
  const handleMenuItemClick = (callback: () => void) => {
    // 执行传入的回调函数
    callback();
    
    // 如果是移动设备，点击后自动关闭侧边栏
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      {/* 遮罩层 - 所有设备上都显示，添加高斯模糊效果 */}
      <div 
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-20 transition-all duration-300
                    ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* 侧边栏主体 - 修改为覆盖式而非推开式 */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-white dark:bg-gray-800 shadow-lg dark:shadow-gray-900/30
                  transition-all duration-300 ease-in-out z-30
                  ${isSidebarOpen ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}
      >
        {/* 侧边栏头部 - 包含菜单按钮 */}
        <div className="flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
          {/* 菜单按钮 - 放在左上角 */}
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
                     transition-colors duration-200 flex-shrink-0"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? (
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>
          
          {/* 应用标志 */}
          <div className="flex items-center ml-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-blue-100 dark:bg-blue-900 flex-shrink-0">
              <ListTodo className="w-5 h-5 text-blue-600 dark:text-blue-300" />
            </div>
            <h1 className="ml-3 text-base font-medium text-gray-900 dark:text-white whitespace-nowrap overflow-hidden transition-opacity duration-200">
              Task Analyzer
            </h1>
          </div>
        </div>

        {/* 侧边栏内容 */}
        <div className="p-3 space-y-6 h-[calc(100%-4rem)] flex flex-col">
          {/* 导航菜单 */}
          <nav className="space-y-1">
            {/* 活动任务 - 修改点击处理逻辑 */}
            <div 
              className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-200
                        ${!showCompleted ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              onClick={() => handleMenuItemClick(() => setShowCompleted(false))}
            >
              <div className={`flex items-center justify-center ${!showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                <ListTodo className="w-5 h-5" />
              </div>
              
              {/* 文本标签 - 包含任务数量 */}
              <span className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap flex-grow
                          ${!showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {t.activeTasks} {activeTasks > 0 && `(${activeTasks})`}
              </span>
            </div>
            
            {/* 已完成任务 - 修改点击处理逻辑 */}
            <div 
              className={`group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-200
                        ${showCompleted ? 'bg-blue-50 dark:bg-blue-900/30' : ''}`}
              onClick={() => handleMenuItemClick(() => setShowCompleted(true))}
            >
              <div className={`flex items-center justify-center ${showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`}>
                <CheckSquare className="w-5 h-5" />
              </div>
              
              {/* 文本标签 - 包含任务数量 */}
              <span className={`ml-3 text-sm font-medium transition-opacity duration-200 whitespace-nowrap flex-grow
                          ${showCompleted ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                {t.completedTasks} {completedTasks > 0 && `(${completedTasks})`}
              </span>
            </div>
          </nav>
          
          {/* 底部控制项 */}
          <div className="mt-auto space-y-1">
            {/* 主题切换 - 修改点击处理逻辑 */}
            <div 
              className="group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-200"
              onClick={() => handleMenuItemClick(toggleTheme)}
            >
              <div className="flex items-center justify-center">
                {isDarkMode ? (
                  <SunIcon className="w-5 h-5 text-yellow-500" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                )}
              </div>
              
              {/* 文本标签 */}
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t.toggleTheme}
              </span>
            </div>
            
            {/* 设置项 - 修改点击处理逻辑 */}
            <div 
              className="group flex items-center px-3 py-2.5 rounded-lg cursor-pointer
                        hover:bg-gray-100 dark:hover:bg-gray-700
                        transition-colors duration-200"
              onClick={() => handleMenuItemClick(() => {})} // 空函数，仅关闭侧边栏
            >
              <div className="flex items-center justify-center">
                <Settings className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              
              {/* 文本标签 */}
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                {t.settings || '设置'}
              </span>
            </div>
          </div>
          
          {/* 版本信息 */}
          <div className="text-center py-2 text-xs text-gray-500 dark:text-gray-500">
            Task Analyzer v1.0
          </div>
        </div>
      </aside>

      {/* 固定位置菜单按钮 - 当侧边栏关闭时显示 */}
      {!isSidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-40 p-2 rounded-lg bg-white dark:bg-gray-800 
                   shadow-md dark:shadow-gray-900/30
                   hover:bg-gray-100 dark:hover:bg-gray-700
                   transition-all duration-200"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      )}
    </>
  );
};

export default Sidebar;