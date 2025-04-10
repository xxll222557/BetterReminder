import { useRef, useState, useEffect } from 'react';
import { TaskList } from './components/TaskList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import Footer from './components/Footer';
import CalendarView from './components/CalendarView';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useTasks } from './hooks/useTasks';
import { useResponsive } from './hooks/useResponsive';
import { Confetti } from './components/Confetti';

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, t, isLangMenuOpen, switchLanguage, toggleLangMenu, closeLangMenu } = useLanguage();
  const { isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile } = useResponsive();
  const mainContentRef = useRef<HTMLDivElement>(null);
  
  // 添加状态来管理视图切换
  const [showCalendar, setShowCalendar] = useState(false);
  
  const {
    newTask,
    setNewTask,
    isLoading,
    showCompleted,
    setShowCompleted,
    activeTasks,
    completedTasks,
    handleSubmit,
    toggleTask,
    deleteTask
  } = useTasks(t);
  
  // 添加状态来管理庆祝动画
  const [showCelebration, setShowCelebration] = useState(false);
  
  // 监测所有活动任务是否清空
  useEffect(() => {
    // 检查是否有活动任务，且数量从有到无
    if (activeTasks.length === 0 && completedTasks.length > 0) {
      setShowCelebration(true);
      
      // 3秒后关闭庆祝效果
      const timer = setTimeout(() => {
        setShowCelebration(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [activeTasks.length, completedTasks.length]);

  // 创建新任务处理函数 - 用于日历视图中的快速添加
  const handleCreateNewTask = () => {
    setShowCalendar(false);
    setShowCompleted(false);
    // 可选：聚焦到任务输入框
    setTimeout(() => {
      const taskInput = document.getElementById('task-input');
      if (taskInput) taskInput.focus();
    }, 100);
  };

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-all duration-500 flex flex-col">
      <Sidebar 
        isSidebarOpen={isSidebarOpen}
        setSidebarOpen={setSidebarOpen}
        isLargeScreen={isLargeScreen}
        isMobile={isMobile}
        activeTasks={activeTasks.length}
        completedTasks={completedTasks.length}
        showCompleted={showCompleted}
        setShowCompleted={setShowCompleted}
        showCalendar={showCalendar}
        setShowCalendar={setShowCalendar}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        t={t}
      />
      <main ref={mainContentRef} className="transition-all duration-300 ease-in-out flex-grow">
        <div className="mx-auto p-6 pb-16 transition-all duration-300 max-w-4xl">
          <Header 
            isDarkMode={isDarkMode}
            toggleTheme={toggleTheme}
            language={language}
            isLangMenuOpen={isLangMenuOpen}
            toggleLangMenu={toggleLangMenu}
            closeLangMenu={closeLangMenu}
            switchLanguage={switchLanguage}
            isSidebarOpen={isSidebarOpen}
            t={t}
          />

          <TaskForm 
            newTask={newTask}
            setNewTask={setNewTask}
            isLoading={isLoading}
            handleSubmit={handleSubmit}
            t={t}
            isLangMenuOpen={isLangMenuOpen}
          />
          
          <div className="transition-theme duration-theme ease-theme space-y-8">
            {showCalendar ? (
              <CalendarView
                tasks={[...activeTasks, ...completedTasks]}
                language={language}
                t={t}
                onToggleTask={toggleTask}
                onCreateNew={handleCreateNewTask}
              />
            ) : (
              <TaskList
                tasks={showCompleted ? completedTasks : activeTasks}
                type={showCompleted ? 'completed' : 'active'}
                showCompleted={showCompleted}
                onToggleShowCompleted={() => setShowCompleted(false)}
                onToggleTask={toggleTask}
                onTaskDelete={deleteTask}
                language={language}
                t={t}
              />
            )}
          </div>
        </div>
      </main>

      <Footer t={t} language={language} />
      
      {/* 添加庆祝组件在最外层 */}
      <Confetti active={showCelebration} />

    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;