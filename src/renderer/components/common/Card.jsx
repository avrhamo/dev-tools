import React from 'react';

const Card = ({ 
  children, 
  className = '', 
  title,
  ...props 
}) => {
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-6 ${className}`} 
      {...props}
    >
      {title && (
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
      )}
      {children}
    </div>
  );
};

export default Card;