export class SQLiteConnection {
  constructor() {}
  async createConnection() { return this; }
  async open() {}
  async close() {}
  async initWebStore() { return Promise.resolve(); }
  async saveToStore() { return Promise.resolve(); }
  async execute() { return { changes: { changes: 0, lastId: 0 } }; }
  async query() { return { values: [] }; }
  async run() { return { changes: { changes: 0, lastId: 0 } }; }
}

export const CapacitorSQLite = {
  checkConnectionsConsistency: async () => ({ result: { inconsistentConnections: 0, connectionList: [] } }),
  isConnection: async () => ({ result: false }),
  isDatabase: async () => ({ result: false }),
  createConnection: async () => ({ result: true }),
  closeConnection: async () => ({ result: true }),
  retrieveConnection: async () => ({ result: true }),
  removeConnection: async () => ({ result: true }),
  echo: async () => ({ value: 'echo' })
};
