import React from 'react';
import { useLocation } from 'react-router-dom';

const TopBar: React.FC = () => {
  const location = useLocation();
  const title = location.pathname.split('/').pop()?.replace('-', ' ');

  return (
    <div className="bg-white h-16 shadow-sm flex items-center px-6">
      <h2 className="text-xl font-semibold capitalize">{title}</h2>
    </div>
  );
};

export default TopBar;