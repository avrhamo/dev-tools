// src/renderer/components/common/CodeEditor.tsx
import React from 'react';
import Editor from '@monaco-editor/react';
import type { CodeEditorProps } from '@/types/components';

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  height = "400px",
  options,
  ...props
}) => {
  return (
    <Editor
      height={height}
      language={language}
      value={value}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        wordWrap: 'on',
        readOnly,
        formatOnPaste: true,
        formatOnType: true,
        ...options
      }}
      {...props}
    />
  );
};

export default CodeEditor;