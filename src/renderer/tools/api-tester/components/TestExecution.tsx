// src/renderer/tools/api-tester/ApiTester.tsx
import React, { useState } from 'react';
import type { Step, TestConfig, CurlData, ConnectionData } from '@/types/api-tester';
import Card from '../../components/common/Card';
import CurlInput from './components/CurlInput';
import DatabaseConnection from './components/DatabaseConnection';
import FieldMapping from './components/FieldMapping';
import TestExecution from './components/TestExecution';

const ApiTester: React.FC = () => {
  const [step, setStep] = useState<Step>('curl');
  const [testConfig, setTestConfig] = useState<TestConfig>({
    curl: null,
    connection: null,
    fieldMappings: null
  });

  const handleCurlSubmit = (curlData: CurlData): void => {
    setTestConfig((prev: TestConfig) => ({ ...prev, curl: curlData }));
    setStep('database');
  };

  const handleDatabaseConnect = (connectionData: ConnectionData): void => {
    setTestConfig((prev: TestConfig) => ({ ...prev, connection: connectionData }));
    setStep('mapping');
  };

  const handleMappingComplete = (mappings: TestConfig['fieldMappings']): void => {
    setTestConfig((prev: TestConfig) => ({ ...prev, fieldMappings: mappings }));
    setStep('execution');
  };

  const steps: Step[] = ['curl', 'database', 'mapping', 'execution'];

  const renderStep = () => {
    switch(step) {
      case 'curl':
        return <CurlInput onSubmit={handleCurlSubmit} />;
      case 'database':
        return <DatabaseConnection onConnect={handleDatabaseConnect} />;
      case 'mapping':
        return (
          <FieldMapping 
            curlData={testConfig.curl!}
            connection={testConfig.connection!}
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
        <div className="flex justify-between mb-8">
          {steps.map((stepName) => (
            <div
              key={stepName}
              className={`flex items-center ${
                step === stepName ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${step === stepName ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                {steps.indexOf(stepName) + 1}
              </div>
              <span className="ml-2 capitalize">{stepName}</span>
            </div>
          ))}
        </div>

        {renderStep()}
      </div>
    </Card>
  );
};

export default ApiTester;