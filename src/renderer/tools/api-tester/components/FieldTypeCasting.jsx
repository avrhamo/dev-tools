import React from 'react';

const FieldTypeCasting = ({ mappings, onUpdateCasting }) => {
  const typeOptions = [
    { value: 'string', label: 'String' },
    { value: 'number', label: 'Number' },
    { value: 'boolean', label: 'Boolean' },
    { value: 'date', label: 'Date' },
    { value: 'array', label: 'Array' },
    { value: 'object', label: 'Object' }
  ];

  const formatOptions = {
    date: [
      { value: 'iso', label: 'ISO String' },
      { value: 'timestamp', label: 'Timestamp' },
      { value: 'unix', label: 'Unix Timestamp' }
    ],
    number: [
      { value: 'integer', label: 'Integer' },
      { value: 'float', label: 'Float' },
      { value: 'string', label: 'String' }
    ]
  };

  const handleTypeChange = (curlField, type) => {
    onUpdateCasting(curlField, { type, format: null });
  };

  const handleFormatChange = (curlField, format) => {
    onUpdateCasting(curlField, { format });
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-lg">Field Type Casting</h3>
      
      <div className="border rounded-lg divide-y">
        {Object.entries(mappings).map(([curlField, mongoField]) => (
          <div key={curlField} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-medium">{curlField}</span>
                <span className="text-gray-500 ml-2">→</span>
                <span className="text-gray-600 ml-2">{mongoField}</span>
              </div>
              
              <div className="flex space-x-3">
                <select 
                  className="px-3 py-1 border rounded"
                  onChange={(e) => handleTypeChange(curlField, e.target.value)}
                >
                  <option value="">Select Type</option>
                  {typeOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {(mappings[curlField]?.type === 'date' || mappings[curlField]?.type === 'number') && (
                  <select
                    className="px-3 py-1 border rounded"
                    onChange={(e) => handleFormatChange(curlField, e.target.value)}
                    value={mappings[curlField]?.format || ''}
                  >
                    <option value="">Select Format</option>
                    {formatOptions[mappings[curlField]?.type]?.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FieldTypeCasting;