// API Tester Types
export interface CurlData {
    url: string;
    method: string;
    headers: Record<string, string>;
    data?: any;
    pathParams?: Array<{ name: string; value: string }>;
    encodedHeaders?: Record<string, {
      original: string;
      decoded: any;
    }>;
  }
  
  export interface ConnectionData {
    connectionString: string;
    database: string;
    collection: string;
    sampleDocument: any;
  }
  
  export interface FieldMapping {
    curlField: string;
    mongoField: string;
  }
  
  export interface TypeCasting {
    type: string;
    format?: string;
  }
  
  export interface TestConfig {
    curl: CurlData;
    connection: ConnectionData;
    fieldMappings: {
      fieldMappings: Record<string, string>;
      typeCastings: Record<string, TypeCasting>;
    };
  }
  
  export type Step = 'curl' | 'database' | 'mapping' | 'execution';
  
  export interface TestResult {
    documentId: string;
    success: boolean;
    status?: number;
    statusText?: string;
    duration: number;
    error?: string;
  }
  
  export interface TestMetrics {
    totalRequests: number;
    successCount: number;
    failureCount: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
  }
  
  export interface TestSettings {
    batchSize: number;
    delayBetweenRequests: number;
    stopOnError: boolean;
  }