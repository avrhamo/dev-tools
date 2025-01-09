import React, { useState } from 'react';
import CodeEditor from '../../../components/common/CodeEditor';
import Button from '../../../components/common/Button';

const CurlInput = ({ onSubmit }) => {
  const [curlCommand, setCurlCommand] = useState('');
  const [error, setError] = useState('');

  const handleParse = async () => {
    try {
      setError('');
      const parsed = await window.curlParser.parse(curlCommand);
      onSubmit(parsed);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Enter Curl Command</h2>
      
      <CodeEditor
        value={curlCommand}
        onChange={(value) => setCurlCommand(value || '')}
        language="shell"
        height="200px"
      />

      {error && (
        <div className="text-red-500 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          onClick={handleParse}
          disabled={!curlCommand.trim()}
          variant="primary"
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default CurlInput;