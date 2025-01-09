import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import Base64Tool from './tools/base64/Base64Tool';
import RsaTool from './tools/rsa/RsaTool';
import JsonYamlTool from './tools/json-yaml/JsonYamlTool';
import ApiTester from './tools/api-tester/ApiTester';

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto p-6">
          <Routes>
            <Route path="/tools/base64" element={<Base64Tool />} />
            <Route path="/tools/rsa" element={<RsaTool />} />
            <Route path="/tools/json-yaml" element={<JsonYamlTool />} />
            <Route path="/tools/api-tester" element={<ApiTester />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;