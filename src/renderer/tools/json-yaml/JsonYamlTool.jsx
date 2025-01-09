import React, { useState, useCallback } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CodeEditor from '../../components/common/CodeEditor';

const JsonYamlTool = () => {
  const [leftContent, setLeftContent] = useState('');
  const [rightContent, setRightContent] = useState('');
  const [leftMode, setLeftMode] = useState('json');
  const [error, setError] = useState('');

  const handleConvert = useCallback(() => {
    if (!leftContent) {
      setRightContent('');
      setError('');
      return;
    }

    try {
      if (leftMode === 'json') {
        const yaml = window.converterApi.jsonToYaml(leftContent);
        setRightContent(yaml);
      } else {
        const json = window.converterApi.yamlToJson(leftContent);
        setRightContent(json);
      }
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [leftContent, leftMode]);

  const handleModeSwitch = () => {
    setLeftMode(leftMode === 'json' ? 'yaml' : 'json');
    // Swap content when switching modes
    setLeftContent(rightContent);
    setRightContent(leftContent);
    setError('');
  };

  const formatLeft = () => {
    try {
      if (leftMode === 'json') {
        const formatted = JSON.stringify(JSON.parse(leftContent), null, 2);
        setLeftContent(formatted);
      } else {
        const obj = window.converterApi.yamlToJson(leftContent);
        const yaml = window.converterApi.jsonToYaml(obj);
        setLeftContent(yaml);
      }
      setError('');
    } catch (err) {
      setError(`Format failed: ${err.message}`);
    }
  };

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button onClick={handleModeSwitch}>
              Swap {leftMode.toUpperCase()} ⟷ {leftMode === 'json' ? 'YAML' : 'JSON'}
            </Button>
            <Button onClick={formatLeft}>
              Format {leftMode.toUpperCase()}
            </Button>
            <Button onClick={handleConvert} variant="primary">
              Convert
            </Button>
          </div>
        </div>

        {error && (
          <div className="text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">
              {leftMode === 'json' ? 'JSON' : 'YAML'}
            </h3>
            <CodeEditor
              value={leftContent}
              onChange={(value) => {
                setLeftContent(value || '');
                // Optionally enable auto-convert here
                // handleConvert();
              }}
              language={leftMode === 'json' ? 'json' : 'yaml'}
              height="400px"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">
              {leftMode === 'json' ? 'YAML' : 'JSON'}
            </h3>
            <CodeEditor
              value={rightContent}
              readOnly={true}
              language={leftMode === 'json' ? 'yaml' : 'json'}
              height="400px"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default JsonYamlTool;