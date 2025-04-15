import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AppProvider } from './contexts/index.tsx';
import App from './App.tsx';
import './styles/index.css';

// 确保标题栏下方的内容正确显示
document.addEventListener('DOMContentLoaded', () => {
  document.body.style.paddingTop = '32px';
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>
);
