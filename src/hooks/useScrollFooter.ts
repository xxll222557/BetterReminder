import { useState, useEffect } from 'react';

export const useScrollFooter = () => {
  const [showFooter, setShowFooter] = useState(false);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const scrollPosition = window.innerHeight + currentScrollY;
      const documentHeight = document.documentElement.scrollHeight;
      
      setShowFooter(currentScrollY > lastScrollY && documentHeight - scrollPosition < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return { showFooter };
};