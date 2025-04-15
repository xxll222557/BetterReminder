import React, { ReactNode } from 'react';
import { ThemeProvider } from './ThemeContext';
import { LanguageProvider } from './LanguageContext';
import { TaskProvider } from './TaskContext';
import { ToastProvider } from './ToastContext';
import { ResponsiveProvider } from './ResponsiveProvider';
import { AppStateProvider } from './AppStateContext';

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  return (
    <AppStateProvider>
      <ThemeProvider>
        <LanguageProvider>
          <ResponsiveProvider>
            <ToastProvider>
              <TaskProvider>
                {children}
              </TaskProvider>
            </ToastProvider>
          </ResponsiveProvider>
        </LanguageProvider>
      </ThemeProvider>
    </AppStateProvider>
  );
};

export * from './ThemeContext';
export * from './LanguageContext';
export * from './TaskContext';
export * from './ToastContext';
export * from './ResponsiveProvider';
export * from './AppStateContext';