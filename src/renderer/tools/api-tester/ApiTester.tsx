import React, { useState } from 'react';
import Card from '@/renderer/components/common/Card';
import type { Step, TestConfig, CurlData, ConnectionData } from '@/types/api-tester';

// Temporary placeholder for unimplemented components
const PlaceholderComponent: React.FC<{ name: string }> = ({ name }) => (
  <div className="p-4 border rounded">
    <h3 className="text-lg font-medium">{name} Component</h3>
    <p className="text-gray-600">This component is being migrated to TypeScript...</p>
  </div>
);

const CurlInput = () => <PlaceholderComponent name="CurlInput" />;
const DatabaseConnection = () => <PlaceholderComponent name="DatabaseConnection" />;
const FieldMapping = () => <PlaceholderComponent name="FieldMapping" />;
const TestExecution = () => <PlaceholderComponent name="TestExecution" />;

const ApiTester: React.FC = () => {
  const [step, setStep] = useState<Step>('curl');
  const [testConfig, setTestConfig] = useState<TestConfig>({
    curl: {} as CurlData,
    connection: {} as ConnectionData,
    fieldMappings: {
      fieldMappings: {},
      typeCastings: {}
    }
  });

  const handleCurlSubmit = (curlData: CurlData) => {
    setTestConfig((prev) => ({ ...prev, curl: curlData }));
    setStep('database');
  };

  const handleDatabaseConnect = (connectionData: ConnectionData) => {
    setTestConfig((prev) => ({ ...prev, connection: connectionData }));
    setStep('mapping');
  };

  const handleMappingComplete = (mappings: TestConfig['fieldMappings']) => {
    setTestConfig((prev) => ({ ...prev, fieldMappings: mappings }));
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
          {(['curl', 'database', 'mapping', 'execution'] as Step[]).map((stepName, index) => (
            <div
              key={stepName}
              className={`flex items-center ${
                step === stepName ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${step === stepName ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}
              >
                {index + 1}
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