import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Code, Key, FileJson, Globe } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();
  
  const tools = [
    { path: '/tools/base64', name: 'Base64', icon: Code },
    { path: '/tools/rsa', name: 'RSA', icon: Key },
    { path: '/tools/json-yaml', name: 'JSON/YAML', icon: FileJson },
    { path: '/tools/api-tester', name: 'API Tester', icon: Globe },
  ];

  return (
    <div className="w-64 bg-gray-800 text-white h-screen">
      <div className="p-4">
        <h1 className="text-xl font-bold">Dev Tools</h1>
      </div>
      <nav className="mt-4">
        {tools.map(({ path, name, icon: Icon }) => (
          <Link
            key={path}
            to={path}
            className={`flex items-center px-4 py-2 ${
              location.pathname === path ? 'bg-blue-600' : 'hover:bg-gray-700'
            }`}
          >
            <Icon className="w-5 h-5 mr-2" />
            {name}
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;