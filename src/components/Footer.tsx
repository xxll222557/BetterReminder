import React from 'react';

interface FooterProps {
  showFooter: boolean;
  t: any;
}

const Footer: React.FC<FooterProps> = ({ showFooter, t }) => {
  return (
    <footer 
      className={`fixed bottom-0 w-full transform transition-all duration-500 ease-in-out
        ${showFooter ? 'translate-y-0' : 'translate-y-full'}
        bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-3 text-center text-sm text-gray-500 dark:text-gray-400
        border-t border-gray-200/50 dark:border-gray-800/50 transition-theme duration-theme ease-theme left-0`}
    >
      <div className="max-w-4xl mx-auto px-6">
        {t.footer.copyright.replace('{year}', new Date().getFullYear().toString())} · 
        <a href="https://liuu.org" target="_blank" rel="noopener noreferrer"
           className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {t.footer.about}
        </a> ·
        <a href="https://github.com/xxll222557/project/tree/liu-test" target="_blank" rel="noopener noreferrer"
           className="mx-2 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
          {t.footer.github}
        </a>
      </div>
    </footer>
  );
};

export default Footer;