import React, { useState } from 'react';
import Card from '../../components/common/Card';
import CurlInput from './components/CurlInput';
import DatabaseConnection from './components/DatabaseConnection';
import FieldMapping from './components/FieldMapping';
import TestExecution from './components/TestExecution';

const ApiTester = () => {
  const [step, setStep] = useState('curl'); // curl, database, mapping, execution
  const [testConfig, setTestConfig] = useState({
    curl: null,
    connection: null,
    collection: null,
    fieldMappings: null
  });

  const handleCurlSubmit = (curlData) => {
    setTestConfig(prev => ({ ...prev, curl: curlData }));
    setStep('database');
  };

  const handleDatabaseConnect = (connectionData) => {
    setTestConfig(prev => ({ ...prev, connection: connectionData }));
    setStep('mapping');
  };

  const handleMappingComplete = (mappings) => {
    setTestConfig(prev => ({ ...prev, fieldMappings: mappings }));
    setStep('execution');
  };

  const renderStep = () => {
    switch(step) {
      case 'curl':
        return <CurlInput onSubmit={handleCurlSubmit} />;
      case 'database':
        return <DatabaseConnection onConnect={handleDatabaseConnect} />;
      case 'mapping':
        return (
          <FieldMapping 
            curlData={testConfig.curl}
            connection={testConfig.connection}
            onMappingComplete={handleMappingComplete}
          />
        );
      case 'execution':
        return <TestExecution config={testConfig} />;
      default:
        return null;
    }
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-6">
        {/* Progress Steps */}
        <div className="flex justify-between mb-8">
          {['curl', 'database', 'mapping', 'execution'].map((stepName) => (
            <div
              key={stepName}
              className={`flex items-center ${
                step === stepName ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${step === stepName ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                {/* Add step number or icon */}
                {['curl', 'database', 'mapping', 'execution'].indexOf(stepName) + 1}
              </div>
              <span className="ml-2 capitalize">{stepName}</span>
            </div>
          ))}
        </div>

        {/* Current Step Content */}
        {renderStep()}
      </div>
    </Card>
  );
};

export default ApiTester;