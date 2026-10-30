import { test } from 'node:test';
import assert from 'node:assert';
import * as helpers from '../src/js/utils/helpers.js';

// --- Shim de localStorage para rodar a camada web do SQLite no Node ---
class LocalStorageShim {
  constructor() { this.store = new Map(); }
  getItem(k) { return this.store.has(k) ? this.store.get(k) : null; }
  setItem(k, v) { this.store.set(k, String(v)); }
  removeItem(k) { this.store.delete(k); }
  clear() { this.store.clear(); }
  get length() { return this.store.size; }
  key(i) { return [...this.store.keys()][i]; }
}
if (!globalThis.localStorage) globalThis.localStorage = new LocalStorageShim();

// Shim mínimo de DOM para sanitizeHtml (usado por highlightMatch)
if (!globalThis.document) {
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  globalThis.document = {
    createElement: () => {
      let texto = '';
      let html = '';
      return {
        set textContent(v) { texto = String(v); html = esc(texto); },
        get textContent() { return texto; },
        set innerHTML(v) { html = v; },
        get innerHTML() { return html; }
      };
    }
  };
}

const { Cliente } = await import('../src/js/models/Cliente.js');
const { Servico } = await import('../src/js/models/Servico.js');

await test('helpers.formatCurrency formata em real brasileiro', () => {
  const zero = helpers.formatCurrency(0);
  assert.ok(/R\$\s*0,00/.test(zero), `esperado R$ 0,00, obtido ${zero}`);
  assert.ok(/R\$\s*1\.500,50/.test(helpers.formatCurrency(1500.5)));
  assert.ok(/R\$\s*1\.234\.567,89/.test(helpers.formatCurrency(1234567.89)));
  assert.ok(/R\$\s*0,00/.test(helpers.formatCurrency(null)));
  assert.ok(/R\$\s*0,00/.test(helpers.formatCurrency(undefined)));
  assert.ok(/R\$\s*0,00/.test(helpers.formatCurrency(NaN)));
});

await test('helpers.parseCurrency lê moeda brasileira (inclui milhar com ponto)', () => {
  assert.strictEqual(helpers.parseCurrency('1.500,00'), 1500);
  assert.strictEqual(helpers.parseCurrency('R$ 150,00'), 150);
  assert.strictEqual(helpers.parseCurrency('0'), 0);
  assert.strictEqual(helpers.parseCurrency(null), 0);
  assert.strictEqual(helpers.parseCurrency('abc'), 0);
  assert.strictEqual(helpers.parseCurrency(''), 0);
});

await test('helpers.formatDate converte ISO para pt-BR', () => {
  assert.strictEqual(helpers.formatDate('2026-11-17'), '17/11/2026');
  assert.strictEqual(helpers.formatDate(''), '');
  assert.strictEqual(helpers.formatDate(null), '');
  assert.strictEqual(helpers.formatDate('not-a-date'), 'not-a-date');
});

await test('helpers.getTodayISO retorna AAAA-MM-DD', () => {
  const today = helpers.getTodayISO();
  assert.match(today, /^\d{4}-\d{2}-\d{2}$/);
});

await test('helpers.getStatusInfo retorna label e classe', () => {
  assert.strictEqual(helpers.getStatusInfo('entregue').label, 'Entregue');
  assert.strictEqual(helpers.getStatusInfo('producao').label, 'Em Produção');
  assert.strictEqual(helpers.getStatusInfo('desconhecido').label, 'desconhecido');
});

await test('helpers.getTipoMovelInfo traduz tipos', () => {
  assert.strictEqual(helpers.getTipoMovelInfo('guarda-roupa'), 'Guarda-roupa');
  assert.strictEqual(helpers.getTipoMovelInfo('outro'), 'Outro');
  assert.strictEqual(helpers.getTipoMovelInfo(''), 'Não informado');
  assert.strictEqual(helpers.getTipoMovelInfo(null), 'Não informado');
});

await test('helpers.validateCurrency aceita válidos e rejeita negativos', () => {
  assert.strictEqual(helpers.validateCurrency('1.500,00'), true);
  assert.strictEqual(helpers.validateCurrency('0'), true);
  assert.strictEqual(helpers.validateCurrency('-10'), false);
  // strings inválidas viram 0 (padrão do app), portanto são aceitas como ≥ 0
  assert.strictEqual(helpers.validateCurrency('abc'), true);
  assert.strictEqual(helpers.validateCurrency(''), true);
});

await test('helpers.validateDate rejeita datas impossíveis', () => {
  assert.strictEqual(helpers.validateDate('2026-11-17'), true);
  assert.strictEqual(helpers.validateDate('2026-02-30'), false);
  assert.strictEqual(helpers.validateDate(''), false);
  assert.strictEqual(helpers.validateDate(null), false);
});

await test('helpers.highlightMatch escapa regex e marca ocorrência', () => {
  assert.strictEqual(helpers.highlightMatch('guarda-roupa', ''), 'guarda-roupa');
  assert.strictEqual(helpers.highlightMatch(null, 'x'), '');
  const h = helpers.highlightMatch('a.b+c', 'a.b');
  assert.ok(h.includes('<mark>a.b</mark>'));
});

await test('helpers.debounce atrasa a execução', async () => {
  let calls = 0;
  const fn = helpers.debounce(() => { calls++; }, 30);
  fn(); fn(); fn();
  assert.strictEqual(calls, 0);
  await new Promise((r) => setTimeout(r, 100));
  assert.strictEqual(calls, 1);
});

await test('Servico: instância com valores padrão', () => {
  const s = new Servico({ cliente_id: 'c1', nome: 'Mesa' });
  assert.ok(s.id);
  assert.strictEqual(s.cliente_id, 'c1');
  assert.strictEqual(s.nome, 'Mesa');
  assert.strictEqual(s.status, 'orcamento');
  assert.strictEqual(s.valor_orcado, 0);
  assert.strictEqual(s.valor_final, null);
  assert.match(s.prazo_entrega, /^\d{4}-\d{2}-\d{2}$/);
});

await test('Servico: validate rejeita cliente ausente', () => {
  const s = new Servico({ cliente_id: '', nome: 'Mesa' });
  assert.ok(s.validate().length > 0);
});

await test('Servico: validate rejeita nome ausente e muito longo', () => {
  const s = new Servico({ cliente_id: 'c1', nome: '' });
  assert.ok(s.validate().some((e) => e.includes('Nome do móvel')));
  const s2 = new Servico({ cliente_id: 'c1', nome: 'x'.repeat(101) });
  assert.ok(s2.validate().some((e) => e.includes('100 caracteres')));
});

await test('Servico: validate rejeita valores negativos e prazo vazio', () => {
  const s = new Servico({ cliente_id: 'c1', nome: 'Mesa', valor_orcado: -50 });
  assert.ok(s.validate().some((e) => e.includes('Valor orçado')));
  const s2 = new Servico({ cliente_id: 'c1', nome: 'Mesa' });
  s2.prazo_entrega = ''; // construtor preenche hoje; força vazio para testar validate
  assert.ok(s2.validate().some((e) => e.includes('Prazo de entrega')));
});

await test('Servico: validate rejeita status inválido', () => {
  const s = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: 'inexistente' });
  assert.ok(s.validate().some((e) => e.includes('Status inválido')));
});

await test('Servico: canTransitionTo respeita o fluxo de status', () => {
  const ordem = ['orcamento', 'aguardando', 'aprovado', 'producao', 'finalizado', 'entregue'];
  for (let i = 0; i < ordem.length - 1; i++) {
    const s = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: ordem[i] });
    assert.strictEqual(s.canTransitionTo(ordem[i + 1]), true, `${ordem[i]} -> ${ordem[i + 1]}`);
  }
  const entregue = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: 'entregue' });
  assert.strictEqual(entregue.canTransitionTo('orcamento'), false);
  const cancelado = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: 'cancelado' });
  assert.strictEqual(cancelado.canTransitionTo('aprovado'), false);
  const aprovado = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: 'aprovado' });
  assert.strictEqual(aprovado.canTransitionTo('entregue'), false);
  const finalizado = new Servico({ cliente_id: 'c1', nome: 'Mesa', status: 'finalizado' });
  assert.strictEqual(finalizado.canTransitionTo('entregue'), true);
});

await test('Servico: getPrazoClass identifica atrasado/hoje/proximo/futuro', () => {
  const hoje = helpers.getTodayISO();
  const atrasado = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: '2020-01-01', status: 'aprovado' });
  assert.strictEqual(atrasado.getPrazoClass(), 'atrasado');
  const hojeS = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: hoje, status: 'aprovado' });
  assert.strictEqual(hojeS.getPrazoClass(), 'hoje');
  const futuro = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: '2099-12-31', status: 'aprovado' });
  assert.strictEqual(futuro.getPrazoClass(), 'futuro');
  const entregue = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: '2020-01-01', status: 'entregue' });
  assert.strictEqual(entregue.getPrazoClass(), '');
});

await test('Servico: isAtrasado/isHoje/isProximo', () => {
  const hoje = helpers.getTodayISO();
  const atrasado = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: '2020-01-01', status: 'aprovado' });
  assert.strictEqual(atrasado.isAtrasado(), true);
  assert.strictEqual(atrasado.isHoje(), false);
  const hojeS = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: hoje, status: 'aprovado' });
  assert.strictEqual(hojeS.isHoje(), true);
  const entregue = new Servico({ cliente_id: 'c1', nome: 'Mesa', prazo_entrega: '2020-01-01', status: 'entregue' });
  assert.strictEqual(entregue.isAtrasado(), false);
});

await test('Servico: getValorFinalFormatado retorna traço quando nulo', () => {
  const s = new Servico({ cliente_id: 'c1', nome: 'Mesa', valor_final: null });
  assert.strictEqual(s.getValorFinalFormatado(), '—');
  const s2 = new Servico({ cliente_id: 'c1', nome: 'Mesa', valor_final: 250 });
  assert.ok(/R\$\s*250,00/.test(s2.getValorFinalFormatado()));
});

await test('Servico: getClienteNome retorna nome ou fallback', () => {
  const s = new Servico({ cliente_id: 'c1', nome: 'Mesa', cliente: { nome: 'João' } });
  assert.strictEqual(s.getClienteNome(), 'João');
  const s2 = new Servico({ cliente_id: 'c2', nome: 'Mesa' });
  assert.strictEqual(s2.getClienteNome(), 'Cliente não encontrado');
});

await test('Cliente: validate rejeita nome obrigatório e limites', () => {
  const c = new Cliente({ nome: '' });
  assert.ok(c.validate().some((e) => e.includes('Nome é obrigatório')));
  const c2 = new Cliente({ nome: 'x'.repeat(101) });
  assert.ok(c2.validate().some((e) => e.includes('100 caracteres')));
  const c3 = new Cliente({ nome: 'Ana', telefone: 'x'.repeat(21) });
  assert.ok(c3.validate().some((e) => e.includes('Telefone')));
});

await test('Cliente: getTelefoneFormatado formata 10 e 11 dígitos', () => {
  const c11 = new Cliente({ telefone: '11999999999' });
  assert.strictEqual(c11.getTelefoneFormatado(), '(11) 99999-9999');
  const c10 = new Cliente({ telefone: '1199999999' });
  assert.strictEqual(c10.getTelefoneFormatado(), '(11) 9999-9999');
  const cVazio = new Cliente({ telefone: '' });
  assert.strictEqual(cVazio.getTelefoneFormatado(), '');
});

await test('Persistência: salva, lista, busca por id e bloqueia exclusão de cliente com serviços', async () => {
  // isolamento: reinicia o storage web
  globalThis.localStorage.clear();
  // forza recarregar as tabelas no módulo database (singleton mantém db; tabelas re-lidas por query)

  const c = new Cliente({ nome: 'Cliente Teste', telefone: '11999999999' });
  await c.save();
  const todos = await Cliente.findAll();
  assert.ok(todos.some((x) => x.nome === 'Cliente Teste'));

  const s = new Servico({
    cliente_id: c.id,
    nome: 'Guarda-roupa Teste',
    valor_orcado: 1500,
    prazo_entrega: helpers.getTodayISO(),
    status: 'orcamento',
  });
  await s.save();
  const servicos = await Servico.findAll();
  assert.ok(servicos.some((x) => x.nome === 'Guarda-roupa Teste'));

  const encontrado = await Servico.findById(s.id);
  assert.ok(encontrado);
  assert.strictEqual(encontrado.nome, 'Guarda-roupa Teste');
  assert.strictEqual(encontrado.cliente_id, c.id);

  // resolução do nome do cliente é testada isoladamente em 'getClienteNome'

  let erro = null;
  try {
    await c.delete();
  } catch (e) {
    erro = e;
  }
  assert.ok(erro, 'deveria bloquear exclusão de cliente com serviços associados');
});
