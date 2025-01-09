import React, { useState, useEffect } from 'react';
import Card from '../../../components/common/Card';
import Button from '../../../components/common/Button';
import CodeEditor from '../../../components/common/CodeEditor';

const TestExecution = ({ config }) => {
  const [documents, setDocuments] = useState([]);
  const [results, setResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    totalRequests: 0,
    successCount: 0,
    failureCount: 0,
    avgDuration: 0,
    minDuration: Infinity,
    maxDuration: 0
  });

  const [settings, setSettings] = useState({
    batchSize: 10,
    delayBetweenRequests: 1000,
    stopOnError: false
  });


  // Fetch documents when component mounts
  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const docs = await window.mongoService.getDocuments(
          config.connection.database,
          config.connection.collection,
          settings.batchSize
        );
        setDocuments(docs);
      } catch (err) {
        setError('Failed to fetch documents: ' + err.message);
      }
    };

    fetchDocuments();
  }, [config.connection, settings.batchSize]);

  const updateMetrics = (newResult) => {
    setMetrics(prev => {
      const duration = newResult.duration || 0;
      return {
        totalRequests: prev.totalRequests + 1,
        successCount: prev.successCount + (newResult.success ? 1 : 0),
        failureCount: prev.failureCount + (newResult.success ? 0 : 1),
        avgDuration: (prev.avgDuration * prev.totalRequests + duration) / (prev.totalRequests + 1),
        minDuration: Math.min(prev.minDuration, duration),
        maxDuration: Math.max(prev.maxDuration, duration)
      };
    });
  };
  
  const buildRequest = (document) => {
    try {
        console.log('Starting buildRequest with document:', document);
        console.log('Config:', {
            curl: config.curl,
            fieldMappings: config.fieldMappings
        });

        // Start with base URL and create URL object
        let urlObject = new URL(config.curl.url);

        const request = {
            url: urlObject.toString(),
            method: config.curl.method,
            headers: {},
            body: config.curl.data ? JSON.parse(JSON.stringify(config.curl.data)) : undefined
        };

        // Add non-encoded headers first
        Object.entries(config.curl.headers).forEach(([key, value]) => {
            if (!config.curl.encodedHeaders?.[key]) {
                request.headers[key] = value;
            }
        });

        // Initialize encoded headers state with empty objects
        const encodedHeadersState = {};
        Object.keys(config.curl.encodedHeaders || {}).forEach(headerKey => {
            encodedHeadersState[headerKey] = {};
        });

        // Helper function to get nested MongoDB field value
        const getValue = (obj, path) => {
            const value = path.split('.').reduce((curr, key) => curr?.[key], obj);
            console.log(`Getting value for path ${path}:`, value);
            return value;
        };

        // Apply mappings
        Object.entries(config.fieldMappings).forEach(([curlField, mongoField]) => {
            console.log(`Processing mapping: ${curlField} -> ${mongoField}`);
            
            const [section, headerKey, ...jsonPath] = curlField.split('.');
            const value = getValue(document, mongoField);

            switch (section) {
                case 'path':
                    const paramPattern = new RegExp(`[:\{\[]${jsonPath.join('.')}[\}\]]?`);
                    urlObject = new URL(urlObject.toString().replace(paramPattern, value));
                    break;

                case 'url':
                    urlObject.searchParams.set(headerKey, value);
                    break;

                case 'header':
                    if (config.curl.encodedHeaders?.[headerKey]) {
                        // Set value in encoded header structure
                        if (!encodedHeadersState[headerKey]) {
                            encodedHeadersState[headerKey] = {};
                        }
                        
                        let current = encodedHeadersState[headerKey];
                        // Handle nested paths in encoded JSON
                        for (let i = 0; i < jsonPath.length - 1; i++) {
                            if (!current[jsonPath[i]]) {
                                current[jsonPath[i]] = {};
                            }
                            current = current[jsonPath[i]];
                        }
                        current[jsonPath[jsonPath.length - 1]] = value;
                        
                        console.log(`Updated encoded header ${headerKey}:`, encodedHeadersState[headerKey]);
                    } else {
                        // Regular header
                        request.headers[headerKey] = value;
                    }
                    break;

                case 'body':
                    if (request.body) {
                        let current = request.body;
                        const pathParts = jsonPath.join('.').split('.');
                        pathParts.forEach((part, index) => {
                            if (index === pathParts.length - 1) {
                                current[part] = value;
                            } else {
                                if (!current[part]) current[part] = {};
                                current = current[part];
                            }
                        });
                    }
                    break;
            }
        });

        // Encode and set headers
        Object.entries(encodedHeadersState).forEach(([headerKey, headerData]) => {
            console.log(`Encoding header ${headerKey}:`, headerData);
            if (Object.keys(headerData).length > 0) {
                console.log(request.headers);
                request.headers[headerKey] = btoa(JSON.stringify(headerData));
                console.log(request.headers);
            } else {
                // If no mappings were applied, use original structure but with empty values
                const originalStructure = config.curl.encodedHeaders[headerKey].decoded;
                request.headers[headerKey] = btoa(JSON.stringify(originalStructure));
            }
        });

        // Set final URL
        request.url = urlObject.toString();

        console.log('Final request:', request);
        return request;
    } catch (err) {
        console.error('Error in buildRequest:', err);
        throw new Error(`Failed to build request: ${err.message}`);
    }
};

  const executeRequest = async (request) => {
    console.log('Executing request:', request);
    return await window.apiTester.sendRequest(request);
  };

  const handleExecute = async () => {
    console.log('Execute button clicked');
    setIsRunning(true);
    setResults([]);
    setError('');
    setProgress(0);
    setMetrics({
      totalRequests: 0,
      successCount: 0,
      failureCount: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0
    });

    try {
      for (let i = 0; i < documents.length; i++) {
        const document = documents[i];

        try {
          const request = buildRequest(document);
          const result = await executeRequest(request);

          // Ensure we only store simple data types
          const resultSummary = {
            documentId: String(document._id || ''),
            success: Boolean(result.success),
            status: Number(result.status),
            statusText: String(result.statusText || ''),
            duration: Number(result.duration || 0)
          };

          setResults(prev => [...prev, resultSummary]);
          updateMetrics(resultSummary);

          if (!result.success && settings.stopOnError) {
            throw new Error(`Request failed with status ${result.status}`);
          }
        } catch (err) {
          const failedResult = {
            documentId: String(document._id || ''),
            success: false,
            error: String(err.message),
            duration: 0
          };
          setResults(prev => [...prev, failedResult]);
          updateMetrics(failedResult);

          if (settings.stopOnError) break;
        }

        setProgress(((i + 1) / documents.length) * 100);
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, settings.delayBetweenRequests));
        }
      }
    } catch (err) {
      setError(String(err.message));
    } finally {
      setIsRunning(false);
    }
  };
  return (
    <div className="space-y-6">
      {/* Controls section */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Test Execution</h2>
        <div className="space-x-4">
          <input
            type="number"
            value={settings.batchSize}
            onChange={(e) => setSettings(prev => ({ ...prev, batchSize: parseInt(e.target.value) || 10 }))}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Batch"
          />
          <input
            type="number"
            value={settings.delayBetweenRequests}
            onChange={(e) => setSettings(prev => ({ ...prev, delayBetweenRequests: parseInt(e.target.value) || 1000 }))}
            className="w-20 px-2 py-1 border rounded"
            placeholder="Delay (ms)"
          />
          <Button
            variant="primary"
            onClick={handleExecute}
            disabled={isRunning || documents.length === 0}
          >
            {isRunning ? 'Running...' : 'Execute Tests'}
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      {isRunning && (
        <div className="space-y-2">
          <div className="h-2 bg-gray-200 rounded">
            <div
              className="h-full bg-blue-600 rounded transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-gray-600 text-right">
            {Math.round(progress)}% Complete
          </div>
        </div>
      )}

      {/* Metrics Display */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium">Success Rate</h3>
            <div className="text-3xl font-bold text-green-600">
              {((metrics.successCount / metrics.totalRequests) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-500">
              {metrics.successCount}/{metrics.totalRequests} requests successful
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-medium">Response Times</h3>
            <div className="text-3xl font-bold">
              {Math.round(metrics.avgDuration)}ms
            </div>
            <div className="text-sm text-gray-500">
              Min: {metrics.minDuration}ms / Max: {metrics.maxDuration}ms
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="text-lg font-medium">Failed Requests</h3>
            <div className="text-3xl font-bold text-red-600">
              {metrics.failureCount}
            </div>
            <div className="text-sm text-gray-500">
              {metrics.failureCount} errors encountered
            </div>
          </Card>
        </div>
      )}

      {/* Results List - Just show status codes */}
      {results.length > 0 && (
        <div className="space-y-2">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-2 rounded flex justify-between items-center ${result.success ? 'bg-green-50' : 'bg-red-50'
                }`}
            >
              <span>Document ID: {result.documentId}</span>
              <div className="flex items-center space-x-4">
                <span>{result.duration}ms</span>
                <span className={result.success ? 'text-green-600' : 'text-red-600'}>
                  {result.success ? `${result.status} ${result.statusText}` : result.error}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TestExecution;