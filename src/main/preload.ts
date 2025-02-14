// src/main/preload.ts
import { contextBridge } from 'electron';
import crypto from 'crypto';
import yaml from 'js-yaml';
import http from 'http';
import https from 'https';
import { MongoClient } from 'mongodb';

interface CurlParseResult {
  url?: string;
  method: string;
  headers: Record<string, string>;
  data: null | Record<string, unknown> | string;
  pathParams: Array<{ name: string; value: string }>;
  encodedHeaders: Record<string, { original: string; decoded: unknown }>;
}

interface RequestConfig {
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: string | Record<string, unknown>;
}

interface EncodedHeaderResult {
  isValid: boolean;
  decoded: string | null;
  parsed: unknown | null;
}

let mongoClient: MongoClient | null = null;

contextBridge.exposeInMainWorld('converterApi', {
  jsonToYaml: (jsonStr: string): string => {
    try {
      const jsonObj = JSON.parse(jsonStr);
      return yaml.dump(jsonObj, {
        indent: 2,
        quotingType: '"',
        forceQuotes: true
      });
    } catch (err) {
      throw new Error(`JSON to YAML conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  yamlToJson: (yamlStr: string): string => {
    try {
      const obj = yaml.load(yamlStr);
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      throw new Error(`YAML to JSON conversion failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});

contextBridge.exposeInMainWorld('cryptoApi', {
  generateKeyPair: (): Promise<{ publicKey: string; privateKey: string }> => {
    return new Promise((resolve, reject) => {
      crypto.generateKeyPair('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      }, (err, publicKey, privateKey) => {
        if (err) reject(err);
        resolve({ publicKey, privateKey });
      });
    });
  },

  encrypt: (data: string, publicKey: string): string => {
    try {
      const encrypted = crypto.publicEncrypt(
        publicKey,
        Buffer.from(data)
      );
      return encrypted.toString('base64');
    } catch (err) {
      throw new Error(`Encryption failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  decrypt: (data: string, privateKey: string): string => {
    try {
      const decrypted = crypto.privateDecrypt(
        privateKey,
        Buffer.from(data, 'base64')
      );
      return decrypted.toString();
    } catch (err) {
      throw new Error(`Decryption failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});

contextBridge.exposeInMainWorld('apiTester', {
  sendRequest: async (config: RequestConfig) => {
    return new Promise((resolve, reject) => {
      try {
        const url = new URL(config.url);
        const options = {
          hostname: url.hostname,
          port: url.port || (url.protocol === 'https:' ? 443 : 80),
          path: `${url.pathname}${url.search}`,
          method: config.method,
          headers: config.headers || {}
        };

        const requester = url.protocol === 'https:' ? https : http;
        const startTime = Date.now();

        const req = requester.request(options, (res) => {
          res.resume(); // Drain the stream

          const endTime = Date.now();

          resolve({
            success: res.statusCode ? res.statusCode >= 200 && res.statusCode < 300 : false,
            status: res.statusCode,
            statusText: res.statusMessage || '',
            duration: endTime - startTime,
            headers: Object.fromEntries(
              Object.entries(res.headers)
                .map(([k, v]) => [k, String(v)])
            )
          });
        });

        req.on('error', (error) => {
          reject(new Error(error.message));
        });

        if (config.body) {
          const bodyString = typeof config.body === 'string'
            ? config.body
            : JSON.stringify(config.body);
          req.write(bodyString);
        }

        req.end();
      } catch (err) {
        reject(new Error(err instanceof Error ? err.message : String(err)));
      }
    });
  }
});

contextBridge.exposeInMainWorld('mongoService', {
  connect: async (connectionString: string) => {
    try {
      mongoClient = new MongoClient(connectionString);
      await mongoClient.connect();
      return { success: true };
    } catch (err) {
      throw new Error(`MongoDB Connection failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  listDatabases: async () => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const admin = mongoClient.db().admin();
      const result = await admin.listDatabases();
      return result.databases.map(db => db.name);
    } catch (err) {
      throw new Error(`Failed to list databases: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  listCollections: async (dbName: string) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collections = await db.listCollections().toArray();
      return collections.map(col => col.name);
    } catch (err) {
      throw new Error(`Failed to list collections: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  getDocuments: async (dbName: string, collectionName: string, limit = 10) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collection = db.collection(collectionName);
      return await collection.find().limit(limit).toArray();
    } catch (err) {
      throw new Error(`Failed to fetch documents: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  getSampleDocument: async (dbName: string, collectionName: string) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collection = db.collection(collectionName);
      return await collection.findOne();
    } catch (err) {
      throw new Error(`Failed to get sample document: ${err instanceof Error ? err.message : String(err)}`);
    }
  },

  disconnect: async () => {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
    }
  }
});

const tryParseBase64Json = (str: string): EncodedHeaderResult => {
  try {
    const decoded = atob(str);
    const parsed = JSON.parse(decoded);
    return {
      isValid: true,
      decoded,
      parsed
    };
  } catch {
    return {
      isValid: false,
      decoded: null,
      parsed: null
    };
  }
};

// Add this interface near your other interfaces at the top of preload.ts
interface CurlParseResult {
  url?: string;
  method: string;
  headers: Record<string, string>;
  data: null | Record<string, unknown> | string;
  pathParams: Array<{ name: string; value: string }>;
  encodedHeaders: Record<string, { original: string; decoded: unknown }>;
}

// Then update the parse function to use this type:
contextBridge.exposeInMainWorld('curlParser', {
  parse: (curlCommand: string): CurlParseResult => {
    try {
      let cmd = curlCommand
        .replace(/\\\n/g, ' ')
        .replace(/\n/g, ' ')
        .trim();

      if (cmd.startsWith('curl ')) {
        cmd = cmd.slice(5);
      }

      const result: CurlParseResult = {
        method: 'GET',
        headers: {},
        data: null,
        pathParams: [],
        encodedHeaders: {}
      };

      const parts = cmd.match(/(?:[^\s"']+|"[^"]*"|'[^']*'|{[^}]*})+/g) || [];

      // Find URL first
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].replace(/^['"]|['"]$/g, '');
        if (part.startsWith('http://') || part.startsWith('https://')) {
          result.url = part;
          break;
        }
      }

      // Process all parts
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i].replace(/^['"]|['"]$/g, '');

        if (part.startsWith('-')) {
          switch (part) {
            case '-X':
            case '--request':
              result.method = parts[++i].replace(/['"]/g, '');
              break;

            case '-H':
            case '--header':
              const header = parts[++i].replace(/['"]/g, '');
              const [key, ...valueParts] = header.split(':');
              const headerKey = key.trim();
              const headerValue = valueParts.join(':').trim();

              result.headers[headerKey] = headerValue;

              const parseResult = tryParseBase64Json(headerValue);
              if (parseResult.isValid && parseResult.parsed) {
                result.encodedHeaders[headerKey] = {
                  original: headerValue,
                  decoded: parseResult.parsed
                };
              }
              break;

            case '-d':
            case '--data':
            case '--data-raw':
              let data = parts[++i].replace(/^['"]|['"]$/g, '');
              try {
                if (data.startsWith('{')) {
                  result.data = JSON.parse(data);
                } else {
                  result.data = data;
                }
              } catch (err) {
                console.error('Data parsing error:', err);
                result.data = data;
              }
              break;
          }
        }
      }

      return result;
    } catch (err) {
      throw new Error(`Failed to parse curl command: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
});