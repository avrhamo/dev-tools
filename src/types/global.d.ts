
declare global {
  interface Window {
    converterApi: {
      jsonToYaml: (jsonStr: string) => string;
      yamlToJson: (yamlStr: string) => string;
    };
    cryptoApi: {
      generateKeyPair: () => Promise<{ publicKey: string; privateKey: string }>;
      encrypt: (data: string, publicKey: string) => string;
      decrypt: (data: string, privateKey: string) => string;
    };
    apiTester: {
      sendRequest: (config: any) => Promise<any>;
    };
    mongoService: {
      connect: (connectionString: string) => Promise<{ success: boolean }>;
      listDatabases: () => Promise<string[]>;
      listCollections: (dbName: string) => Promise<string[]>;
      getDocuments: (dbName: string, collectionName: string, limit?: number) => Promise<any[]>;
      getSampleDocument: (dbName: string, collectionName: string) => Promise<any>;
      disconnect: () => Promise<void>;
    };
    curlParser: {
      parse: (curlCommand: string) => any;
    };
  }
}

export {};