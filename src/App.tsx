import { useRef, useState, useEffect } from 'react';
import { TaskList } from './components/TaskList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import Footer from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useTasks } from './hooks/useTasks';
import { useResponsive } from './hooks/useResponsive';
import { Confetti } from './components/Confetti';
import { tauriNotificationService } from './services/notificationService';
import NotificationPrompt from './components/NotificationPrompt';

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, t, isLangMenuOpen, switchLanguage, toggleLangMenu, closeLangMenu } = useLanguage();
  const { isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile } = useResponsive();
  const mainContentRef = useRef<HTMLDivElement>(null);
  
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

  // 设置通知系统
  useEffect(() => {
    const setupNotifications = async () => {
      try {
        // 初始化通知系统
        await tauriNotificationService.initialize();
        
        // 检查权限并设置监视器
        const hasPermission = await tauriNotificationService.checkPermissions();
        if (hasPermission && activeTasks.length > 0) {
          tauriNotificationService.startDeadlineCheck(activeTasks);
        }
      } catch (error) {
        console.error('设置通知系统失败:', error);
      }
    };
    
    setupNotifications();
    
    // 清理函数
    return () => {
      tauriNotificationService.stopDeadlineCheck();
    };
  }, [activeTasks]); // 任务列表变化时重新设置

  const handleNotificationPermissionChange = (granted: boolean) => {
    if (granted && activeTasks.length > 0) {
      tauriNotificationService.startDeadlineCheck(activeTasks);
    }
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
            <TaskList
              tasks={showCompleted ? completedTasks : activeTasks}
              type={showCompleted ? 'completed' : 'active'}
              showCompleted={showCompleted}
              onToggleShowCompleted={() => setShowCompleted(false)}
              onToggleTask={toggleTask}
              onTaskDelete={deleteTask}
              language={language}  // 添加语言
              t={t}
            />
          </div>
        </div>
      </main>

      <Footer t={t} language={language} />
      
      {/* 添加庆祝组件在最外层 */}
      <Confetti active={showCelebration} />

      {/* 通知权限提示 */}
      <NotificationPrompt onPermissionChange={handleNotificationPermissionChange} />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;