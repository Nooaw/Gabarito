import { database } from '../services/database.js';
import { generateId, getTodayISO, formatDate, formatCurrency, parseCurrency, getStatusInfo, getTipoMovelInfo, getFutureDate } from '../utils/helpers.js';

const SERVICO_FIELDS = [
  'id', 'cliente_id', 'nome', 'tipo', 'descricao', 'medidas', 'materiais',
  'valor_orcado', 'valor_final', 'data_criacao', 'prazo_entrega',
  'status', 'observacoes', 'updated_at'
];

const STATUS_ORDER = {
  orcamento: 1,
  aguardando: 2,
  aprovado: 3,
  producao: 4,
  finalizado: 5,
  entregue: 6,
  cancelado: 7
};

export class Servico {
  constructor(data = {}) {
    this.id = data.id || generateId();
    this.cliente_id = data.cliente_id || '';
    this.nome = data.nome || '';
    this.tipo = data.tipo || '';
    this.descricao = data.descricao || '';
    this.medidas = data.medidas || '';
    this.materiais = data.materiais || '';
    this.valor_orcado = typeof data.valor_orcado === 'number' ? data.valor_orcado : parseCurrency(data.valor_orcado);
    this.valor_final = data.valor_final !== null && data.valor_final !== undefined ?
      (typeof data.valor_final === 'number' ? data.valor_final : parseCurrency(data.valor_final)) : null;
    this.data_criacao = data.data_criacao || getTodayISO();
    this.prazo_entrega = data.prazo_entrega || getTodayISO();
    this.status = data.status || 'orcamento';
    this.observacoes = data.observacoes || '';
    this.updated_at = data.updated_at || getTodayISO();
    this._cliente = data.cliente || null;
  }

  static fromRow(row, cliente = null) {
    return new Servico({ ...row, cliente });
  }

  toRow() {
    return {
      id: this.id,
      cliente_id: this.cliente_id,
      nome: this.nome,
      tipo: this.tipo,
      descricao: this.descricao,
      medidas: this.medidas,
      materiais: this.materiais,
      valor_orcado: this.valor_orcado,
      valor_final: this.valor_final,
      data_criacao: this.data_criacao,
      prazo_entrega: this.prazo_entrega,
      status: this.status,
      observacoes: this.observacoes,
      updated_at: this.updated_at
    };
  }

  validate() {
    const errors = [];
    if (!this.cliente_id) errors.push('Cliente é obrigatório');
    if (!this.nome || this.nome.trim() === '') errors.push('Nome do móvel é obrigatório');
    if (this.nome.length > 100) errors.push('Nome do móvel deve ter no máximo 100 caracteres');
    if (this.valor_orcado < 0) errors.push('Valor orçado não pode ser negativo');
    if (this.valor_final !== null && this.valor_final < 0) errors.push('Valor final não pode ser negativo');
    if (!this.prazo_entrega) errors.push('Prazo de entrega é obrigatório');
    if (!STATUS_ORDER[this.status]) errors.push('Status inválido');
    if (this.descricao.length > 1000) errors.push('Descrição deve ter no máximo 1000 caracteres');
    if (this.medidas.length > 50) errors.push('Medidas deve ter no máximo 50 caracteres');
    if (this.materiais.length > 200) errors.push('Materiais deve ter no máximo 200 caracteres');
    if (this.observacoes.length > 500) errors.push('Observações deve ter no máximo 500 caracteres');
    return errors;
  }

  async save() {
    this.updated_at = getTodayISO();
    const errors = this.validate();
    if (errors.length > 0) throw new Error(errors.join(', '));

    const row = this.toRow();
    const placeholders = SERVICO_FIELDS.map(() => '?').join(', ');
    const updates = SERVICO_FIELDS.filter(f => f !== 'id' && f !== 'data_criacao')
      .map(f => `${f} = ?`).join(', ');

    await database.run(
      `INSERT INTO servicos (${SERVICO_FIELDS.join(', ')}) VALUES (${placeholders})
       ON CONFLICT(id) DO UPDATE SET ${updates}`,
      [...SERVICO_FIELDS.map(f => row[f]), ...SERVICO_FIELDS.filter(f => f !== 'id' && f !== 'data_criacao').map(f => row[f])]
    );
    return this;
  }

  static async findById(id) {
    const rows = await database.query(`
      SELECT s.*, c.nome as cliente_nome, c.telefone as cliente_telefone
      FROM servicos s
      LEFT JOIN clientes c ON s.cliente_id = c.id
      WHERE s.id = ?
    `, [id]);
    if (rows.length === 0) return null;
    const row = rows[0];
    const cliente = row.cliente_nome ? { nome: row.cliente_nome, telefone: row.cliente_telefone } : null;
    return Servico.fromRow(row, cliente);
  }

  static async findAll(options = {}) {
    let query = `
      SELECT s.*, c.nome as cliente_nome, c.telefone as cliente_telefone
      FROM servicos s
      LEFT JOIN clientes c ON s.cliente_id = c.id
    `;
    const params = [];
    const conditions = [];

    if (options.cliente_id) {
      conditions.push('s.cliente_id = ?');
      params.push(options.cliente_id);
    }

    if (options.status) {
      conditions.push('s.status = ?');
      params.push(options.status);
    }

    if (options.statusNotIn) {
      const placeholders = options.statusNotIn.map(() => '?').join(',');
      conditions.push(`s.status NOT IN (${placeholders})`);
      params.push(...options.statusNotIn);
    }

    if (options.search) {
      conditions.push('(s.nome LIKE ? OR c.nome LIKE ? OR s.descricao LIKE ?)');
      const searchTerm = `%${options.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (options.prazoFilter) {
      const today = getTodayISO();
      switch (options.prazoFilter) {
        case 'hoje':
          conditions.push('s.prazo_entrega = ?');
          params.push(today);
          break;
        case '7dias':
          conditions.push('s.prazo_entrega BETWEEN ? AND ?');
          params.push(today, getFutureDate(7));
          break;
        case 'atrasados':
          conditions.push('s.prazo_entrega < ? AND s.status NOT IN (?, ?)');
          params.push(today, 'entregue', 'cancelado');
          break;
        case 'sem-prazo':
          conditions.push('s.prazo_entrega IS NULL OR s.prazo_entrega = ""');
          break;
        case 'aguardando':
          conditions.push('s.status = ?');
          params.push('finalizado');
          break;
      }
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const orderBy = options.orderBy || 's.prazo_entrega ASC, s.status ASC';
    query += ` ORDER BY ${orderBy}`;

    if (options.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const rows = await database.query(query, params);
    return rows.map(row => {
      const cliente = row.cliente_nome ? { nome: row.cliente_nome, telefone: row.cliente_telefone } : null;
      return Servico.fromRow(row, cliente);
    });
  }

  static async findByCliente(clienteId) {
    return Servico.findAll({ cliente_id: clienteId, orderBy: 's.prazo_entrega ASC' });
  }

  static async count() {
    const rows = await database.query('SELECT COUNT(*) as count FROM servicos');
    return rows[0]?.count || 0;
  }

  static async countByStatus() {
    const rows = await database.query(`
      SELECT status, COUNT(*) as count
      FROM servicos
      GROUP BY status
    `);
    const result = {};
    rows.forEach(row => {
      result[row.status] = row.count;
    });
    return result;
  }

  static async getDashboardStats() {
    const today = getTodayISO();
    const futureDate = getFutureDate(7);

    const [
      total,
      emProducao,
      aguardando,
      finalizados,
      proximas,
      atrasados
    ] = await Promise.all([
      database.query('SELECT COUNT(*) as count FROM servicos'),
      database.query('SELECT COUNT(*) as count FROM servicos WHERE status IN (?, ?, ?)', ['aprovado', 'producao', 'finalizado']),
      database.query('SELECT COUNT(*) as count FROM servicos WHERE status = ?', ['aguardando']),
      database.query('SELECT COUNT(*) as count FROM servicos WHERE status = ? AND status != ?', ['finalizado', 'entregue']),
      database.query('SELECT COUNT(*) as count FROM servicos WHERE prazo_entrega BETWEEN ? AND ? AND status NOT IN (?, ?)', [today, futureDate, 'entregue', 'cancelado']),
      database.query('SELECT COUNT(*) as count FROM servicos WHERE prazo_entrega < ? AND status NOT IN (?, ?)', [today, 'entregue', 'cancelado'])
    ]);

    return {
      total: total[0]?.count || 0,
      emProducao: emProducao[0]?.count || 0,
      aguardando: aguardando[0]?.count || 0,
      finalizados: finalizados[0]?.count || 0,
      proximas: proximas[0]?.count || 0,
      atrasados: atrasados[0]?.count || 0
    };
  }

  static async getValorTotalAtivos() {
    const rows = await database.query(`
      SELECT
        SUM(valor_orcado) as total_orcado,
        SUM(valor_final) as total_final
      FROM servicos
      WHERE status NOT IN (?, ?)
    `, ['entregue', 'cancelado']);
    return {
      orcado: rows[0]?.total_orcado || 0,
      final: rows[0]?.total_final || 0
    };
  }

  static async delete(id) {
    await database.run('DELETE FROM servicos WHERE id = ?', [id]);
    return true;
  }

  async delete() {
    return Servico.delete(this.id);
  }

  getStatusInfo() {
    return getStatusInfo(this.status);
  }

  getTipoMovelLabel() {
    return getTipoMovelInfo(this.tipo);
  }

  getValorOrcadoFormatado() {
    return formatCurrency(this.valor_orcado);
  }

  getValorFinalFormatado() {
    return this.valor_final !== null ? formatCurrency(this.valor_final) : '—';
  }

  getPrazoFormatado() {
    return formatDate(this.prazo_entrega);
  }

  getDiasAtePrazo() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [year, month, day] = this.prazo_entrega.split('-').map(Number);
    const prazo = new Date(year, month - 1, day);
    prazo.setHours(0, 0, 0, 0);
    const diffMs = prazo - today;
    return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  }

  isAtrasado() {
    if (['entregue', 'cancelado'].includes(this.status)) return false;
    return this.getDiasAtePrazo() < 0;
  }

  isHoje() {
    return this.getDiasAtePrazo() === 0;
  }

  isProximo() {
    const dias = this.getDiasAtePrazo();
    return dias > 0 && dias <= 7;
  }

  getPrazoClass() {
    if (['entregue', 'cancelado'].includes(this.status)) return '';
    if (this.isAtrasado()) return 'atrasado';
    if (this.isHoje()) return 'hoje';
    if (this.isProximo()) return 'proximo';
    return 'futuro';
  }

  getClienteNome() {
    return this._cliente?.nome || 'Cliente não encontrado';
  }

  canTransitionTo(newStatus) {
    const currentOrder = STATUS_ORDER[this.status];
    const newOrder = STATUS_ORDER[newStatus];
    if (!currentOrder || !newOrder) return false;

    if (this.status === 'cancelado' || this.status === 'entregue') {
      return false;
    }

    if (newStatus === 'cancelado') return true;
    if (newStatus === 'entregue') return this.status === 'finalizado';

    return newOrder >= currentOrder - 1 && newOrder <= currentOrder + 2;
  }

  async updateStatus(newStatus) {
    if (!this.canTransitionTo(newStatus)) {
      throw new Error(`Transição de ${this.status} para ${newStatus} não permitida`);
    }
    this.status = newStatus;
    await this.save();
    return this;
  }
}

export async function createServico(data) {
  const servico = new Servico(data);
  await servico.save();
  return servico;
}