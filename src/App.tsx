import { useRef } from 'react';
import { TaskList } from './components/TaskList';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import TaskForm from './components/TaskForm';
import Footer from './components/Footer';
import { useTheme } from './hooks/useTheme';
import { useLanguage } from './hooks/useLanguage';
import { useTasks } from './hooks/useTasks';
import { useResponsive } from './hooks/useResponsive';
import { useScrollFooter } from './hooks/useScrollFooter';

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, t, isLangMenuOpen, switchLanguage, toggleLangMenu, closeLangMenu } = useLanguage();
  const { isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile } = useResponsive();
  const { showFooter } = useScrollFooter();
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

  return (
    <div className="relative min-h-screen bg-white dark:bg-gray-900 transition-all duration-500">
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
      <main ref={mainContentRef} className="transition-all duration-300 ease-in-out">
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
            />
          </div>
        </div>
      </main>

      <Footer showFooter={showFooter} t={t} />
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;