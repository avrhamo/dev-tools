import React, { useState, useCallback, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';

const Base64Tool = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [mode, setMode] = useState('encode');
  const [isJson, setIsJson] = useState(false);

  const processContent = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    try {
      let result;
      if (mode === 'encode') {
        // If JSON mode, validate JSON before encoding
        if (isJson) {
          JSON.parse(input); // This will throw if invalid JSON
        }
        result = btoa(input);
      } else {
        result = atob(input);
        if (isJson) {
          // Try to parse and prettify if in JSON mode
          result = JSON.stringify(JSON.parse(result), null, 2);
        }
      }
      setOutput(result);
    } catch (err) {
      setOutput(`Error: ${err.message}`);
    }
  }, [input, mode, isJson]);

  // Process content whenever input, mode, or isJson changes
  useEffect(() => {
    processContent();
  }, [input, mode, isJson, processContent]);

  const handlePrettify = () => {
    try {
      const prettyJson = JSON.stringify(JSON.parse(input), null, 2);
      setInput(prettyJson);
    } catch (err) {
      setOutput('Invalid JSON');
    }
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button 
              variant={mode === 'encode' ? 'primary' : 'secondary'}
              onClick={() => setMode('encode')}
            >
              Encode
            </Button>
            <Button 
              variant={mode === 'decode' ? 'primary' : 'secondary'}
              onClick={() => setMode('decode')}
            >
              Decode
            </Button>
            <Button
              variant={isJson ? 'primary' : 'secondary'}
              onClick={() => setIsJson(!isJson)}
            >
              JSON Mode
            </Button>
            {isJson && (
              <Button onClick={handlePrettify}>
                Prettify
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Editor
              height="400px"
              defaultLanguage={isJson ? 'json' : 'plaintext'}
              language={isJson ? 'json' : 'plaintext'}
              value={input}
              onChange={(value) => setInput(value || '')}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                formatOnPaste: isJson,
                formatOnType: isJson
              }}
            />
          </div>
          <div>
            <Editor
              height="400px"
              defaultLanguage={isJson ? 'json' : 'plaintext'}
              language={isJson ? 'json' : 'plaintext'}
              value={output}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on'
              }}
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default Base64Tool;