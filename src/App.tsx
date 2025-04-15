import { useRef } from 'react';
import { 
  TaskList, 
  TaskForm 
} from './components/task';
import { 
  Sidebar, 
  Header, 
  Footer, 
  TitleBar 
} from './components/layout';
import { CalendarView } from './components/calendar';
import { Confetti, ToastContainer } from './components/feedback';
import { 
  useTheme,
  useLanguage,
  useTasks,
  useResponsive,
  useAppState,
  useToast
} from './contexts';

function AppContent() {
  const { isDarkMode, toggleTheme } = useTheme();
  const { language, t, isLangMenuOpen, switchLanguage, toggleLangMenu, closeLangMenu } = useLanguage();
  const { isSidebarOpen, setSidebarOpen, isLargeScreen, isMobile } = useResponsive();
  const { showCalendar, setShowCalendar, handleCreateNewTask } = useAppState();
  const { toasts, removeToast } = useToast();
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
    deleteTask,
    showCelebration
  } = useTasks();

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
      <main ref={mainContentRef} className="transition-all duration-300 ease-in-out flex-grow bg-white dark:bg-gray-900 mt-8">
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
      
      {/* 添加庆祝组件和Toast容器 */}
      <Confetti active={showCelebration} />
      
      {/* 添加Toast容器 - 如果ToastProvider已经在上下文中渲染了容器，则可以删除此行 */}
      {toasts && <ToastContainer toasts={toasts} removeToast={removeToast} />}
    </div>
  );
}

function App() {
  return (
    <>
      <TitleBar />
      <AppContent />
    </>
  );
}

export default App;