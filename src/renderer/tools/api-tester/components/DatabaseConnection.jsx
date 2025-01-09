import React, { useState } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import CodeEditor from '../../../components/common/CodeEditor';

const DatabaseConnection = ({ onConnect }) => {
  const [connectionString, setConnectionString] = useState('');
  const [selectedDb, setSelectedDb] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [databases, setDatabases] = useState([]);
  const [collections, setCollections] = useState([]);
  const [sampleDocument, setSampleDocument] = useState(null);
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError('');
    try {
      await window.mongoService.connect(connectionString);
      const dbs = await window.mongoService.listDatabases();
      setDatabases(dbs);
      setSelectedDb('');
      setSelectedCollection('');
      setSampleDocument(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDatabaseSelect = async (dbName) => {
    try {
      setSelectedDb(dbName);
      setSelectedCollection('');
      setSampleDocument(null);
      const cols = await window.mongoService.listCollections(dbName);
      setCollections(cols);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCollectionSelect = async (collectionName) => {
    try {
      setSelectedCollection(collectionName);
      const sample = await window.mongoService.getSampleDocument(selectedDb, collectionName);
      setSampleDocument(sample);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleContinue = () => {
    onConnect({
      connectionString,
      database: selectedDb,
      collection: selectedCollection,
      sampleDocument
    });
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-xl font-semibold">MongoDB Connection</h2>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            placeholder="MongoDB Connection String"
            className="flex-1 px-3 py-2 border rounded"
          />
          <Button
            onClick={handleConnect}
            disabled={isConnecting || !connectionString}
          >
            {isConnecting ? 'Connecting...' : 'Connect'}
          </Button>
        </div>

        {error && (
          <div className="text-red-500 bg-red-50 p-2 rounded">
            {error}
          </div>
        )}
      </div>

      {databases.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Select Database</h3>
            <div className="border rounded divide-y max-h-60 overflow-auto">
              {databases.map(db => (
                <div
                  key={db}
                  className={`p-2 cursor-pointer hover:bg-gray-50 ${
                    selectedDb === db ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => handleDatabaseSelect(db)}
                >
                  {db}
                </div>
              ))}
            </div>
          </div>

          {collections.length > 0 && (
            <div>
              <h3 className="font-medium mb-2">Select Collection</h3>
              <div className="border rounded divide-y max-h-60 overflow-auto">
                {collections.map(collection => (
                  <div
                    key={collection}
                    className={`p-2 cursor-pointer hover:bg-gray-50 ${
                      selectedCollection === collection ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleCollectionSelect(collection)}
                  >
                    {collection}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sampleDocument && (
        <div>
          <h3 className="font-medium mb-2">Sample Document</h3>
          <CodeEditor
            value={JSON.stringify(sampleDocument, null, 2)}
            language="json"
            height="200px"
            readOnly={true}
          />
        </div>
      )}

      <div className="flex justify-end">
        <Button
          variant="primary"
          disabled={!selectedDb || !selectedCollection || !sampleDocument}
          onClick={handleContinue}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default DatabaseConnection;