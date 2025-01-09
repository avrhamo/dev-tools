import React, { useState, useCallback, useEffect } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import CodeEditor from '../../components/common/CodeEditor';

const RSATool = () => {
  const [mode, setMode] = useState('encrypt');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [error, setError] = useState('');

  const generateKeys = async () => {
    try {
      const { publicKey, privateKey } = await window.cryptoApi.generateKeyPair();
      setPublicKey(publicKey);
      setPrivateKey(privateKey);
      setError('');
    } catch (err) {
      setError('Failed to generate keys: ' + err.message);
    }
  };

  const handleProcess = useCallback(() => {
    if (!input) {
      setOutput('');
      return;
    }

    try {
      let result;
      if (mode === 'encrypt') {
        if (!publicKey) {
          throw new Error('Please generate or provide public key');
        }
        result = window.cryptoApi.encrypt(input, publicKey);
      } else {
        if (!privateKey) {
          throw new Error('Please provide private key');
        }
        result = window.cryptoApi.decrypt(input, privateKey);
      }
      setOutput(result);
      setError('');
    } catch (err) {
      setError(err.message);
      setOutput('');
    }
  }, [input, mode, publicKey, privateKey]);

  useEffect(() => {
    handleProcess();
  }, [input, mode, publicKey, privateKey, handleProcess]);

  return (
    <Card className="max-w-6xl mx-auto">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="space-x-2">
            <Button 
              variant={mode === 'encrypt' ? 'primary' : 'secondary'}
              onClick={() => setMode('encrypt')}
            >
              Encrypt
            </Button>
            <Button 
              variant={mode === 'decrypt' ? 'primary' : 'secondary'}
              onClick={() => setMode('decrypt')}
            >
              Decrypt
            </Button>
            <Button onClick={generateKeys}>
              Generate Key Pair
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
            <h3 className="font-medium">Input</h3>
            <CodeEditor
              value={input}
              onChange={(value) => setInput(value || '')}
              height="200px"
            />
            
            <h3 className="font-medium mt-4">
              {mode === 'encrypt' ? 'Public Key' : 'Private Key'}
            </h3>
            <CodeEditor
              value={mode === 'encrypt' ? publicKey : privateKey}
              onChange={(value) => 
                mode === 'encrypt' 
                  ? setPublicKey(value || '') 
                  : setPrivateKey(value || '')
              }
              height="200px"
              language="plaintext"
            />
          </div>
          
          <div className="space-y-2">
            <h3 className="font-medium">Output</h3>
            <CodeEditor
              value={output}
              readOnly={true}
              height="420px"
            />
          </div>
        </div>
      </div>
    </Card>
  );
};

export default RSATool;