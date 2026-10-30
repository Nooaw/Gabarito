import { Capacitor } from '@capacitor/core';

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
    this.webTables = null;
    this.webStoragePrefix = 'marcenaria_web_db_';
    this._useNative = false;
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
        try {
          const { SQLite } = await import('@capacitor-community/sqlite');
          this.db = await SQLite.createConnection({
            database: DB_NAME,
            encrypted: false,
            mode: 'no-encryption',
            version: DB_VERSION,
            readonly: false
          });
          await this.db.open();
          this._useNative = true;
        } catch (sqliteError) {
          console.warn('SQLite native failed, falling back to web storage:', sqliteError);
          this.db = await this._initWebDatabase();
          this._useNative = false;
        }
      } else {
        this.db = await this._initWebDatabase();
        this._useNative = false;
      }

      await this._runMigrations();

      // Ativa integridade referencial (FOREIGN KEY / ON DELETE RESTRICT)
      if (this._useNative) {
      try {
        if (this._useNative && this.db && typeof this.db.run === 'function') {
          await this.db.run('PRAGMA foreign_keys = ON');
        }
      } catch (_) {
        // pragma pode não estar disponível em todos os ambientes
      }
      }

      this.initialized = true;
      console.log('Database initialized successfully (native:', this._useNative, ')');
    } catch (error) {
      console.error('Database initialization failed:', error);
      // Último recurso: web storage
      try {
        this.db = await this._initWebDatabase();
        this._useNative = false;
        this.initialized = true;
        console.log('Database initialized via emergency web fallback');
      } catch (e2) {
        console.error('Emergency fallback also failed:', e2);
        throw e2;
      }
    }
  }

  async _initWebDatabase() {
    const STORAGE_PREFIX = 'marcenaria_web_db_';
    const tables = {};
    const self = this;

    const loadTable = (name) => {
      try {
        const raw = localStorage.getItem(STORAGE_PREFIX + name);
        return raw ? JSON.parse(raw) : [];
      } catch {
        return [];
      }
    };
    const saveTable = (name, rows) => {
      try {
        localStorage.setItem(STORAGE_PREFIX + name, JSON.stringify(rows));
      } catch (_) {
        // storage indisponível (modo privado etc.) - continua sem persistência
      }
    };

    // Inicializa tabelas se ainda não existirem
    if (!localStorage.getItem(STORAGE_PREFIX + 'clientes')) {
      saveTable('clientes', []);
    }
    if (!localStorage.getItem(STORAGE_PREFIX + 'servicos')) {
      saveTable('servicos', []);
    }

    this.webTables = tables;
    this.webStoragePrefix = STORAGE_PREFIX;

    const parseParams = (params) => params;

    return {
      async execute({ statements }) {
        const stmts = String(statements)
          .split(';')
          .map((s) => s.trim())
          .filter(Boolean);
        let lastChanges = 0;
        for (const stmt of stmts) {
          const upper = stmt.toUpperCase().trim();
          if (upper.startsWith('CREATE TABLE IF NOT EXISTS')) {
            const m = stmt.match(/CREATE TABLE IF NOT EXISTS\s+(\w+)/i);
            if (m) {
              const name = m[1];
              if (!tables[name]) tables[name] = loadTable(name);
            }
          }
          lastChanges = 0;
        }
        return { changes: { lastId: 0, changes: lastChanges } };
      },
      async run(query, params = []) {
        await self._ensureWebTables(self.webTables);
        const q = String(query).trim();
        const upper = q.toUpperCase();

        if (upper.startsWith('INSERT INTO')) {
          const m = q.match(/INSERT INTO\s+(\w+)\s*\(([^)]*)\)/i);
          const table = m ? m[1] : null;
          const cols = m ? m[2].split(',').map((c) => c.trim()) : [];
          const row = {};
          cols.forEach((c, i) => { row[c] = params[i]; });
          if (!row.id) row.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
          const rows = tables[table] || [];
          rows.push(row);
          saveTable(table, rows);
          tables[table] = rows;
          return { changes: { lastId: row.id, changes: 1 } };
        }

        if (upper.startsWith('UPDATE')) {
          const m = q.match(/UPDATE\s+(\w+)\s+SET\s+(.+?)\s+WHERE/i);
          const table = m ? m[1] : null;
          const setClause = m ? m[2] : '';
          const where = q.match(/WHERE\s+(.+)$/i);
          const rows = tables[table] || [];
          let changed = 0;

          const setParts = setClause.split(',').map(s => s.trim());
          const setAssignments = [];
          for (const part of setParts) {
            const assign = part.match(/^(\w+)\s*=\s*\?$/i);
            if (assign) {
              setAssignments.push({ column: assign[1], paramIndex: setAssignments.length });
            }
          }

          for (const row of rows) {
            if (self._matchWhere(row, where ? where[1] : '', params)) {
              for (const assign of setAssignments) {
                row[assign.column] = params[assign.paramIndex];
              }
              changed++;
            }
          }
          saveTable(table, rows);
          tables[table] = rows;
          return { changes: { lastId: 0, changes: changed } };
        }

        if (upper.startsWith('DELETE FROM')) {
          const m = q.match(/DELETE FROM\s+(\w+)/i);
          const table = m ? m[1] : null;
          const where = q.match(/WHERE\s+(.+)$/i);
          const rows = tables[table] || [];
          const before = rows.length;
          const kept = rows.filter((row) => !self._matchWhere(row, where ? where[1] : '', params));
          saveTable(table, kept);
          tables[table] = kept;
          return { changes: { lastId: 0, changes: before - kept.length } };
        }

        return { changes: { lastId: 0, changes: 0 } };
      },
      async query(query, params = []) {
        await self._ensureWebTables(self.webTables);
        const q = String(query).trim();
        const upper = q.toUpperCase();

        if (upper.startsWith('SELECT COUNT(*)')) {
          const m = q.match(/FROM\s+(\w+)/i);
          const table = m ? m[1] : null;
          const rows = tables[table] || [];
          const where = q.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
          let filtered = rows;
          if (where) {
            filtered = rows.filter((row) => self._matchWhere(row, where[1], params));
          }
          // count com NOT IN / BETWEEN simplificado
          return { values: [{ count: filtered.length }] };
        }

        if (upper.startsWith('SELECT')) {
          const m = q.match(/FROM\s+(\w+)/i);
          const table = m ? m[1] : null;
          let rows = tables[table] || [];
          const where = q.match(/WHERE\s+(.+?)(?:ORDER|GROUP|LIMIT|$)/i);
          if (where) {
            rows = rows.filter((row) => self._matchWhere(row, where[1], params));
          }
          const order = q.match(/ORDER BY\s+(.+?)(?:LIMIT|$)/i);
          if (order) {
            const parts = order[1].split(',').map((p) => p.trim());
            rows = [...rows].sort((a, b) => {
              for (const part of parts) {
                const [field, dir] = part.split(/\s+/).map((s) => s.trim());
                const desc = dir && dir.toUpperCase() === 'DESC';
                const av = a[field];
                const bv = b[field];
                if (av < bv) return desc ? 1 : -1;
                if (av > bv) return desc ? -1 : 1;
              }
              return 0;
            });
          }
          const limit = q.match(/LIMIT\s+(\d+)/i);
          if (limit) rows = rows.slice(0, parseInt(limit[1], 10));
          return { values: rows };
        }

        return { values: [] };
      },
      async close() {}
    };
  }

  async _ensureWebTables(tables) {
    if (tables.clientes && tables.servicos) return;
    if (!tables.clientes) tables.clientes = JSON.parse(localStorage.getItem('marcenaria_web_db_clientes') || '[]');
    if (!tables.servicos) tables.servicos = JSON.parse(localStorage.getItem('marcenaria_web_db_servicos') || '[]');
  }

  _matchWhere(row, whereClause, params) {
    if (!whereClause) return true;
    let paramIndex = 0;
    const getParam = () => params[paramIndex++];
    const andParts = String(whereClause).split(/\s+AND\s+/i);
    return andParts.every((part) => {
      const p = part.trim();
      // coluna = ?
      let m = p.match(/^(\w+)\s*=\s*\?$/i);
      if (m) return String(row[m[1]] ?? '') === String(getParam());
      // coluna IS NULL
      m = p.match(/^(\w+)\s+IS\s+NULL$/i);
      if (m) return row[m[1]] == null || row[m[1]] === '';
      // coluna = ''
      m = p.match(/^(\w+)\s*=\s*''$/i);
      if (m) return row[m[1]] == null || row[m[1]] === '';
      // coluna IN (?,?)
      m = p.match(/^(\w+)\s+IN\s*\(([\s\?,]*)\)$/i);
      if (m) {
        const vals = m[2].split(',').map((v) => v.trim()).filter(Boolean);
        return vals.includes(String(row[m[1]]));
      }
      // coluna NOT IN (?,?)
      m = p.match(/^(\w+)\s+NOT\s+IN\s*\(([\s\?,]*)\)$/i);
      if (m) {
        const vals = m[2].split(',').map((v) => v.trim()).filter(Boolean);
        return !vals.includes(String(row[m[1]]));
      }
      // coluna BETWEEN ? AND ?
      m = p.match(/^(\w+)\s+BETWEEN\s+\?\s+AND\s+\?$/i);
      if (m) return String(row[m[1]]) >= getParam() && String(row[m[1]]) <= getParam();
      // coluna < ?
      m = p.match(/^(\w+)\s*<\s*\?$/i);
      if (m) return String(row[m[1]]) < getParam();
      // coluna > ?
      m = p.match(/^(\w+)\s*>\s*\?$/i);
      if (m) return String(row[m[1]]) > getParam();
      // coluna LIKE ?
      m = p.match(/^(\w+)\s+LIKE\s+\?$/i);
      if (m) {
        const pat = String(getParam()).replace(/%/g, '').replace(/_/g, '');
        return String(row[m[1]] ?? '').toLowerCase().includes(pat.toLowerCase());
      }
      return true;
    });
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