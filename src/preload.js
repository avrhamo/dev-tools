const { contextBridge } = require('electron');
const crypto = require('crypto');
const yaml = require('js-yaml');
const http = require('http');
const https = require('https');
const { MongoClient } = require('mongodb');

let mongoClient = null;

contextBridge.exposeInMainWorld('converterApi', {
  jsonToYaml: (jsonStr) => {
    try {
      const jsonObj = JSON.parse(jsonStr);
      return yaml.dump(jsonObj, {
        indent: 2,
        quotingType: '"',
        forceQuotes: true
      });
    } catch (err) {
      throw new Error(`JSON to YAML conversion failed: ${err.message}`);
    }
  },

  yamlToJson: (yamlStr) => {
    try {
      const obj = yaml.load(yamlStr);
      return JSON.stringify(obj, null, 2);
    } catch (err) {
      throw new Error(`YAML to JSON conversion failed: ${err.message}`);
    }
  }
});

contextBridge.exposeInMainWorld('cryptoApi', {
  generateKeyPair: () => {
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

  encrypt: (data, publicKey) => {
    try {
      const encrypted = crypto.publicEncrypt(
        publicKey,
        Buffer.from(data)
      );
      return encrypted.toString('base64');
    } catch (err) {
      throw new Error(`Encryption failed: ${err.message}`);
    }
  },

  decrypt: (data, privateKey) => {
    try {
      const decrypted = crypto.privateDecrypt(
        privateKey,
        Buffer.from(data, 'base64')
      );
      return decrypted.toString();
    } catch (err) {
      throw new Error(`Decryption failed: ${err.message}`);
    }
  }
});

contextBridge.exposeInMainWorld('apiTester', {
  sendRequest: async (config) => {
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
          // Explicitly ignore the response body
          res.resume(); // Drain the stream

          const endTime = Date.now();

          // Only return essential information, no buffers or complex objects
          resolve({
            success: res.statusCode >= 200 && res.statusCode < 300,
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
        reject(new Error(err.message));
      }
    });
  }
});


contextBridge.exposeInMainWorld('mongoService', {
  connect: async (connectionString) => {
    try {
      mongoClient = new MongoClient(connectionString);
      await mongoClient.connect();
      return { success: true };
    } catch (err) {
      throw new Error(`MongoDB Connection failed: ${err.message}`);
    }
  },

  listDatabases: async () => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const admin = mongoClient.db().admin();
      const result = await admin.listDatabases();
      return result.databases.map(db => db.name);
    } catch (err) {
      throw new Error(`Failed to list databases: ${err.message}`);
    }
  },

  listCollections: async (dbName) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collections = await db.listCollections().toArray();
      return collections.map(col => col.name);
    } catch (err) {
      throw new Error(`Failed to list collections: ${err.message}`);
    }
  },
  getDocuments: async (dbName, collectionName, limit = 10) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collection = db.collection(collectionName);
      return await collection.find().limit(limit).toArray();
    } catch (err) {
      throw new Error(`Failed to fetch documents: ${err.message}`);
    }
  },

  getSampleDocument: async (dbName, collectionName) => {
    try {
      if (!mongoClient) throw new Error('Not connected to MongoDB');
      const db = mongoClient.db(dbName);
      const collection = db.collection(collectionName);
      return await collection.findOne();
    } catch (err) {
      throw new Error(`Failed to get sample document: ${err.message}`);
    }
  },

  disconnect: async () => {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
    }
  }
});


const tryParseBase64Json = (str) => {
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

contextBridge.exposeInMainWorld('curlParser', {
  parse: (curlCommand) => {
    try {
      let cmd = curlCommand
        .replace(/\\\n/g, ' ')
        .replace(/\n/g, ' ')
        .trim();

      if (cmd.startsWith('curl ')) {
        cmd = cmd.slice(5);
      }

      const result = {
        method: 'GET',
        headers: {},
        data: null,
        pathParams: [],
        encodedHeaders: {}  // Initialize the encodedHeaders object
      };

      // Split by spaces but preserve quoted strings and curly braces content
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

              // Check if this header contains base64 encoded JSON
              const parseResult = tryParseBase64Json(headerValue);
              if (parseResult.isValid) {
                result.encodedHeaders[headerKey] = {
                  original: headerValue,
                  decoded: parseResult.parsed
                };
              }
              break;

            case '-d':
            case '--data':
            case '--data-raw':
              let data = parts[++i];
              data = data.replace(/^['"]|['"]$/g, '');
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

      console.log('Parsed curl result:', result); // Debug log
      return result;
    } catch (err) {
      throw new Error(`Failed to parse curl command: ${err.message}`);
    }
  }
});