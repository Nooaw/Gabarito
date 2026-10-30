import { database } from '../services/database.js';
import { generateId, getTodayISO, formatDate, parseCurrency } from '../utils/helpers.js';

const CLIENTE_FIELDS = ['id', 'nome', 'telefone', 'endereco', 'observacoes', 'created_at', 'updated_at'];

export class Cliente {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.nome = data.nome || '';
    this.telefone = data.telefone || '';
    this.endereco = data.endereco || '';
    this.observacoes = data.observacoes || '';
    this.created_at = data.created_at || getTodayISO();
    this.updated_at = data.updated_at || getTodayISO();
  }

  static fromRow(row) {
    return new Cliente(row);
  }

  toRow() {
    return {
      id: this.id,
      nome: this.nome,
      telefone: this.telefone,
      endereco: this.endereco,
      observacoes: this.observacoes,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  validate() {
    const errors = [];
    if (!this.nome || this.nome.trim() === '') {
      errors.push('Nome é obrigatório');
    }
    if (this.nome.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }
    if (this.telefone && this.telefone.length > 20) {
      errors.push('Telefone deve ter no máximo 20 caracteres');
    }
    if (this.endereco && this.endereco.length > 200) {
      errors.push('Endereço deve ter no máximo 200 caracteres');
    }
    if (this.observacoes && this.observacoes.length > 500) {
      errors.push('Observações devem ter no máximo 500 caracteres');
    }
    return errors;
  }

  async save() {
    this.updated_at = getTodayISO();
    const errors = this.validate();
    if (errors.length > 0) throw new Error(errors.join(', '));

    const row = this.toRow();
    const placeholders = CLIENTE_FIELDS.map(() => '?').join(', ');
    const updates = CLIENTE_FIELDS.filter(f => f !== 'id' && f !== 'created_at')
      .map(f => `${f} = ?`).join(', ');

    await database.run(
      `INSERT INTO clientes (${CLIENTE_FIELDS.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}`,
      [...CLIENTE_FIELDS.map(f => row[f]), ...CLIENTE_FIELDS.filter(f => f !== 'id' && f !== 'created_at').map(f => row[f])]
    );
    return this;
  }

  static async findById(id) {
    const rows = await database.query('SELECT * FROM clientes WHERE id = ?', [id]);
    return rows.length > 0 ? Cliente.fromRow(rows[0]) : null;
  }

  static async findAll(options = {}) {
    let query = 'SELECT * FROM clientes';
    const params = [];

    if (options.search) {
      query += ' WHERE nome LIKE ?';
      params.push(`%${options.search}%`);
    }

    query += ' ORDER BY nome ASC';

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = await database.query(query, params);
    return rows.map(Cliente.fromRow);
  }

  static async search(term) {
    return Cliente.findAll({ search: term });
  }

  static async count() {
    const rows = await database.query('SELECT COUNT(*) as count FROM clientes');
    return rows[0]?.count || 0;
  }

  static async countWithServicos() {
    const rows = await database.query(`
      SELECT c.*, COUNT(s.id) as servicos_count
      FROM clientes c
      LEFT JOIN servicos s ON c.id = s.cliente_id
      GROUP BY c.id
      ORDER BY c.nome ASC
    `);
    return rows.map(row => ({
      ...Cliente.fromRow(row),
      servicos_count: row.servicos_count
    }));
  }

  static async delete(id) {
    const servicos = await database.query('SELECT COUNT(*) as count FROM servicos WHERE cliente_id = ?', [id]);
    if (servicos[0]?.count > 0) {
      throw new Error('Não é possível excluir cliente com serviços associados');
    }
    await database.run('DELETE FROM clientes WHERE id = ?', [id]);
    return true;
  }

  async delete() {
    return Cliente.delete(this.id);
  }

  getDisplayName() {
    return this.nome;
  }

  getTelefoneFormatado() {
    if (!this.telefone) return '';
    const cleaned = this.telefone.replace(/\D/g, '');
    if (cleaned.length === 11) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,7)}-${cleaned.slice(7)}`;
    }
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0,2)}) ${cleaned.slice(2,6)}-${cleaned.slice(6)}`;
    }
    return this.telefone;
  }
}

export async function createCliente(data) {
  const cliente = new Cliente(data);
  await cliente.save();
  return cliente;
}