import React from 'react';
import Editor from '@monaco-editor/react';

const CodeEditor = ({
  value,
  onChange,
  language = 'plaintext',
  readOnly = false,
  height = "400px",
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
        ...props.options
      }}
      {...props}
    />
  );
};

export default CodeEditor;