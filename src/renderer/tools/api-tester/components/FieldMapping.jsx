import React, { useState, useEffect } from 'react';
import Button from '../../../components/common/Button';
import CodeEditor from '../../../components/common/CodeEditor';

const FieldMapping = ({ curlData, connection, onMappingComplete }) => {
    const [curlFields, setCurlFields] = useState([]);
    const [mongoFields, setMongoFields] = useState([]);
    const [mappings, setMappings] = useState({});
    const [error, setError] = useState('');
    const [preview, setPreview] = useState('');
    const [expandedHeaders, setExpandedHeaders] = useState({});

    useEffect(() => {
        const extractFields = (obj, parentKey = '') => {
            let fields = [];
            Object.entries(obj).forEach(([key, value]) => {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                if (typeof value === 'object' && value !== null) {
                    fields = [...fields, ...extractFields(value, fullKey)];
                } else {
                    fields.push(fullKey);
                }
            });
            return fields;
        };
    
        try {
            const fields = new Set(); // Use Set to prevent duplicates
    
            // Extract path parameters
            if (curlData.pathParams && curlData.pathParams.length > 0) {
                curlData.pathParams.forEach(param => {
                    fields.add(`path.${param.name}`);
                });
            }
    
            // Extract URL query parameters
            if (curlData.url) {
                try {
                    const url = new URL(curlData.url);
                    url.searchParams.forEach((_, key) => {
                        fields.add(`url.${key}`);
                    });
                } catch (err) {
                    console.error('URL parsing error:', err);
                }
            }
            
            // Process headers
            if (curlData.headers) {
                Object.entries(curlData.headers).forEach(([headerKey, headerValue]) => {
                    if (curlData.encodedHeaders && curlData.encodedHeaders[headerKey]) {
                        // Handle encoded headers - extract JSON structure
                        const headerFields = extractFields(curlData.encodedHeaders[headerKey].decoded);
                        headerFields.forEach(field => {
                            fields.add(`header.${headerKey}.${field}`);
                        });
                    } else {
                        // Regular headers
                        fields.add(`header.${headerKey}`);
                    }
                });
            }
    
            // Extract from body
            if (curlData.data) {
                const bodyFields = extractFields(
                    typeof curlData.data === 'string'
                        ? JSON.parse(curlData.data)
                        : curlData.data
                );
                bodyFields.forEach(field => fields.add(`body.${field}`));
            }
    
            setCurlFields(Array.from(fields));
        } catch (err) {
            setError('Failed to parse curl fields: ' + err.message);
        }
    }, [curlData]);

    // Extract fields from MongoDB sample document
    useEffect(() => {
        const extractFields = (obj, parentKey = '') => {
            let fields = [];
            Object.entries(obj).forEach(([key, value]) => {
                const fullKey = parentKey ? `${parentKey}.${key}` : key;
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    fields = [...fields, ...extractFields(value, fullKey)];
                } else {
                    fields.push(fullKey);
                }
            });
            return fields;
        };

        if (connection?.sampleDocument) {
            try {
                const fields = extractFields(connection.sampleDocument);
                setMongoFields(fields);
            } catch (err) {
                setError('Failed to parse MongoDB fields: ' + err.message);
            }
        }
    }, [connection]);

    useEffect(() => {
        try {
            if (Object.keys(mappings).length === 0) {
                setPreview('');
                return;
            }

            let urlString = curlData.url;
            const previewData = {
                url: urlString,
                method: curlData.method,
                headers: { ...curlData.headers },
                body: curlData.data ? JSON.parse(JSON.stringify(curlData.data)) : undefined
            };

            // Add mapping indicators
            Object.entries(mappings).forEach(([curlField, mongoField]) => {
                const [section, ...parts] = curlField.split('.');
                const fieldPath = parts.join('.');

                if (section === 'path') {
                    // Handle path parameter mapping
                    const paramPattern = new RegExp(`[:\{\[]${fieldPath}[\}\]]?`);
                    urlString = urlString.replace(paramPattern, `{${mongoField}}`);
                    previewData.url = urlString;
                } else if (section === 'url') {
                    // Handle URL parameter mapping
                    const url = new URL(previewData.url);
                    url.searchParams.set(fieldPath, `{${mongoField}}`);
                    previewData.url = url.toString();
                } else if (section === 'headers') {
                    // Handle header mapping
                    previewData.headers[fieldPath] = `{${mongoField}}`;
                } else if (section === 'body') {
                    // Handle body mapping
                    let current = previewData.body;
                    const pathParts = fieldPath.split('.');
                    pathParts.forEach((part, index) => {
                        if (index === pathParts.length - 1) {
                            current[part] = `{${mongoField}}`;
                        } else {
                            current = current[part];
                        }
                    });
                }
            });

            setPreview(JSON.stringify(previewData, null, 2));
        } catch (err) {
            setError('Failed to generate preview: ' + err.message);
        }
    }, [mappings, curlData]);

    const handleMapping = (curlField, mongoField) => {
        setMappings(prev => ({
            ...prev,
            [curlField]: mongoField
        }));
    };

    const handleContinue = () => {
        onMappingComplete(mappings);
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-semibold">Map Fields</h2>

            {error && (
                <div className="text-red-500 bg-red-50 p-2 rounded">
                    {error}
                </div>
            )}

            <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="border rounded-lg p-4 space-y-4">
                        {curlFields.map(curlField => (
                            <div key={curlField} className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    {curlField}
                                </label>
                                <select
                                    value={mappings[curlField] || ''}
                                    onChange={(e) => handleMapping(curlField, e.target.value)}
                                    className="w-full px-3 py-2 border rounded"
                                >
                                    <option value="">Select MongoDB field</option>
                                    {mongoFields.map(field => (
                                        <option key={field} value={field}>
                                            {field}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <h3 className="font-medium">Request Preview</h3>
                    <CodeEditor
                        value={preview}
                        language="json"
                        height="400px"
                        readOnly={true}
                    />
                </div>
            </div>

            {Object.keys(curlData.encodedHeaders || {}).length > 0 && (
                <div className="mt-4">
                    <h3 className="text-lg font-medium">Encoded Headers</h3>
                    {Object.entries(curlData.encodedHeaders).map(([headerKey, headerData]) => (
                        <div key={headerKey} className="mt-2 p-4 border rounded">
                            <div className="flex items-center justify-between">
                                <span className="font-medium">{headerKey}</span>
                                <Button
                                    onClick={() => setExpandedHeaders(prev => ({
                                        ...prev,
                                        [headerKey]: !prev[headerKey]
                                    }))}
                                >
                                    {expandedHeaders[headerKey] ? 'Hide' : 'Show'} Decoded JSON
                                </Button>
                            </div>

                            {expandedHeaders[headerKey] && (
                                <CodeEditor
                                    value={JSON.stringify(headerData.decoded, null, 2)}
                                    language="json"
                                    height="150px"
                                    readOnly={true}
                                />
                            )}
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <Button
                    variant="primary"
                    onClick={handleContinue}
                    disabled={Object.keys(mappings).length === 0}
                >
                    Continue
                </Button>
            </div>
        </div>
    );
};

export default FieldMapping;