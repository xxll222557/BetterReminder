import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  header?: ReactNode;
  footer?: ReactNode;
  onClick?: () => void;
  hoverable?: boolean;
  bordered?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className = '',
  header,
  footer,
  onClick,
  hoverable = false,
  bordered = true,
}) => {
  const baseStyles = "bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-sm transition-all duration-200";
  const hoverStyles = hoverable ? "hover:shadow-md dark:hover:shadow-gray-900/30 transform hover:-translate-y-0.5" : "";
  const borderStyles = bordered ? "border border-gray-200 dark:border-gray-700" : "";
  const clickableStyles = onClick ? "cursor-pointer" : "";

  return (
    <div
      className={`${baseStyles} ${hoverStyles} ${borderStyles} ${clickableStyles} ${className}`}
      onClick={onClick}
    >
      {header && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
          {header}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
      {footer && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-200 dark:border-gray-700">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;