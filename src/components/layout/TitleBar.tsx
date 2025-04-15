import { useEffect } from 'react';
import { Minimize2, Maximize2, X, Calendar, Check } from 'lucide-react';
import { Window } from '@tauri-apps/api/window';

const TitleBar = () => {
  useEffect(() => {
    const setupWindowControls = async () => {
      try {
        const appWindow = new Window('main');

        // 获取按钮元素并添加事件监听器
        document
          .getElementById('titlebar-minimize')
          ?.addEventListener('click', () => appWindow.minimize());
        document
          .getElementById('titlebar-maximize')
          ?.addEventListener('click', () => appWindow.toggleMaximize());
        document
          .getElementById('titlebar-close')
          ?.addEventListener('click', () => appWindow.close());
      } catch (error) {
        console.error('无法加载Tauri窗口API', error);
      }
    };

    setupWindowControls();
  }, []);

  return (
    <div data-tauri-drag-region className="titlebar">
      <div className="titlebar-app-title">
        <div className="app-icon-container">
          <Check className="check-icon" size={10} strokeWidth={3} />
          <Calendar className="calendar-icon" size={14} />
        </div>
        <span className="app-title">Better Reminder</span>
      </div>
      
      <div className="titlebar-buttons">
        <button className="titlebar-button" id="titlebar-minimize" title="最小化">
          <Minimize2 size={14} />
        </button>
        <button className="titlebar-button" id="titlebar-maximize" title="最大化">
          <Maximize2 size={14} />
        </button>
        <button className="titlebar-button titlebar-close" id="titlebar-close" title="关闭">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default TitleBar;