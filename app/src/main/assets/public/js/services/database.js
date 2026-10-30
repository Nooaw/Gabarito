import { Capacitor } from '@capacitor/core';
import { SQLite } from '@capacitor-community/sqlite';

const DB_NAME = 'marcenaria.db';
const DB_VERSION = 1;

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS clientes (
    id TEXT PRIMARY KEY,
    nome TEXT NOT NULL,
    telefone TEXT,
    endereco TEXT,
    observacoes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS servicos (
    id TEXT PRIMARY KEY,
    cliente_id TEXT NOT NULL,
    nome TEXT NOT NULL,
    tipo TEXT,
    descricao TEXT,
    medidas TEXT,
    materiais TEXT,
    valor_orcado REAL NOT NULL DEFAULT 0,
    valor_final REAL,
    data_criacao TEXT NOT NULL,
    prazo_entrega TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'orcamento',
    observacoes TEXT,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT
  );

  CREATE INDEX IF NOT EXISTS idx_servicos_cliente ON servicos(cliente_id);
  CREATE INDEX IF NOT EXISTS idx_servicos_status ON servicos(status);
  CREATE INDEX IF NOT EXISTS idx_servicos_prazo ON servicos(prazo_entrega);
  CREATE INDEX IF NOT EXISTS idx_clientes_nome ON clientes(nome);
`;

const MIGRATIONS = [];

class DatabaseService {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initialized) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = this._initialize();
    return this.initPromise;
  }

  async _initialize() {
    try {
      if (Capacitor.isNativePlatform()) {
        this.db = await SQLite.createConnection({
          database: DB_NAME,
          encrypted: false,
          mode: 'no-encryption',
          version: DB_VERSION,
          readonly: false
        });
        await this.db.open();
      } else {
        this.db = await this._initWebDatabase();
      }

      await this._runMigrations();
      this.initialized = true;
      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization failed:', error);
      throw error;
    }
  }

  async _initWebDatabase() {
    return {
      async execute(statements) {
        return { changes: { lastId: 0, changes: 0 } };
      },
      async run(query, params = []) {
        return { changes: { lastId: 0, changes: 0 } };
      },
      async query(query, params = []) {
        return { values: [] };
      },
      async close() {}
    };
  }

  async _runMigrations() {
    await this.db.execute({ statements: SCHEMA });

    for (const migration of MIGRATIONS) {
      await this.db.execute({ statements: migration.sql });
    }
  }

  async _ensureInitialized() {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  async run(query, params = []) {
    await this._ensureInitialized();
    try {
      const result = await this.db.run(query, params);
      return result.changes;
    } catch (error) {
      console.error('Database run error:', error, { query, params });
      throw error;
    }
  }

  async query(query, params = []) {
    await this._ensureInitialized();
    try {
      const result = await this.db.query(query, params);
      return result.values || [];
    } catch (error) {
      console.error('Database query error:', error, { query, params });
      throw error;
    }
  }

  async execute(statements) {
    await this._ensureInitialized();
    try {
      return await this.db.execute({ statements });
    } catch (error) {
      console.error('Database execute error:', error);
      throw error;
    }
  }

  async transaction(operations) {
    await this._ensureInitialized();
    try {
      await this.db.run('BEGIN TRANSACTION');
      const results = [];
      for (const op of operations) {
        const result = await this.run(op.query, op.params);
        results.push(result);
      }
      await this.db.run('COMMIT');
      return results;
    } catch (error) {
      await this.db.run('ROLLBACK');
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  async close() {
    if (this.db) {
      await this.db.close();
      this.db = null;
      this.initialized = false;
    }
  }
}

export const database = new DatabaseService();

export async function initDatabase() {
  return database.initialize();
}

export async function closeDatabase() {
  return database.close();
}