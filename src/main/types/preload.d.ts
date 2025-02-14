export interface ConverterApi {
    jsonToYaml: (jsonStr: string) => string;
    yamlToJson: (yamlStr: string) => string;
  }
  
  export interface CryptoApi {
    generateKeyPair: () => Promise<{ publicKey: string; privateKey: string }>;
    encrypt: (data: string, publicKey: string) => string;
    decrypt: (data: string, privateKey: string) => string;
  }
  
  export interface ApiTesterConfig {
    url: string;
    method: string;
    headers?: Record<string, string>;
    body?: string | Record<string, any>;
  }
  
  export interface ApiTesterResponse {
    success: boolean;
    status: number;
    statusText: string;
    duration: number;
    headers: Record<string, string>;
  }
  
  export interface ApiTesterApi {
    sendRequest: (config: ApiTesterConfig) => Promise<ApiTesterResponse>;
  }
  
  export interface MongoService {
    connect: (connectionString: string) => Promise<{ success: boolean }>;
    listDatabases: () => Promise<string[]>;
    listCollections: (dbName: string) => Promise<string[]>;
    getDocuments: (dbName: string, collectionName: string, limit?: number) => Promise<any[]>;
    getSampleDocument: (dbName: string, collectionName: string) => Promise<any>;
    disconnect: () => Promise<void>;
  }
  
  export interface Base64JsonParseResult {
    isValid: boolean;
    decoded: string | null;
    parsed: any | null;
  }
  
  export interface CurlParserResult {
    url?: string;
    method: string;
    headers: Record<string, string>;
    data: any;
    pathParams: Array<{ name: string; value: string }>;
    encodedHeaders: Record<string, {
      original: string;
      decoded: any;
    }>;
  }
  
  export interface CurlParserApi {
    parse: (curlCommand: string) => CurlParserResult;
  }
  
  declare global {
    interface Window {
      converterApi: ConverterApi;
      cryptoApi: CryptoApi;
      apiTester: ApiTesterApi;
      mongoService: MongoService;
      curlParser: CurlParserApi;
    }
  }