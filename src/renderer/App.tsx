import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Sidebar, TopBar } from '@/components/layout';

// Placeholder component for tools that aren't migrated yet
const PlaceholderTool: React.FC = () => (
  <div className="p-4">
    <h2 className="text-xl font-semibold">Coming Soon</h2>
    <p className="text-gray-600">This tool is being migrated to TypeScript...</p>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6">
            <Suspense fallback={<div>Loading...</div>}>
              <Routes>
                <Route path="/tools/base64" element={<PlaceholderTool />} />
                <Route path="/tools/rsa" element={<PlaceholderTool />} />
                <Route path="/tools/json-yaml" element={<PlaceholderTool />} />
                <Route path="/tools/api-tester" element={<PlaceholderTool />} />
              </Routes>
            </Suspense>
          </main>
        </div>
      </div>
    </Router>
  );
};

export default App;