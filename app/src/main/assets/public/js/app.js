import { database, initDatabase, closeDatabase } from './services/database.js';
import { Cliente } from './models/Cliente.js';
import { Servico } from './models/Servico.js';
import { formatCurrency, formatDate, getTodayISO, generateId, debounce } from './utils/helpers.js';
import {
  renderServicoCard,
  renderClienteCard,
  renderPrazoItem,
  renderServicoDetalhes,
  renderClienteDetalhes,
  renderEmptyState,
  renderLoadingSkeleton
} from './views/cards.js';

class App {
  constructor() {
    this.currentScreen = 'dashboard';
    this.servicos = [];
    this.clientes = [];
    this.searchTerms = { servicos: '', clientes: '' };
    this.filters = { status: '', prazo: '' };
    this.modalCallbacks = { confirm: null, servico: null, cliente: null };
    this.editingServicoId = null;
    this.editingClienteId = null;
    this.viewingServicoId = null;
    this.viewingClienteId = null;
  }

  async init() {
    try {
      this.showLoading(true);
      await initDatabase();
      await this.loadData();
      this.bindEvents();
      this.renderAll();
      this.updateDashboardStats();
      this.showLoading(false);
      this.showToast('Bem-vindo à Marcenaria Organizada!', 'success');
    } catch (error) {
      console.error('Erro ao inicializar app:', error);
      this.showLoading(false);
      this.showToast('Erro ao inicializar o aplicativo: ' + error.message, 'error');
    }
  }

  async loadData() {
    this.clientes = await Cliente.findAll();
    this.servicos = await Servico.findAll({ orderBy: 's.prazo_entrega ASC, s.status ASC' });
  }

  bindEvents() {
    this.bindNavigation();
    this.bindModals();
    this.bindForms();
    this.bindSearchAndFilters();
    this.bindListActions();
    this.bindBackup();
    this.bindSettings();
  }

  bindNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => this.switchScreen(btn.dataset.screen));
    });

    document.querySelectorAll('.action-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchScreen(btn.dataset.action));
    });

    document.querySelectorAll('.screen-header button[data-screen]').forEach(btn => {
      btn.addEventListener('click', () => this.switchScreen(btn.dataset.screen));
    });

    document.getElementById('btn-novo-servico-dashboard')?.addEventListener('click', () => this.openServicoModal());
    document.getElementById('btn-primeiro-servico')?.addEventListener('click', () => this.openServicoModal());
    document.getElementById('btn-novo-servico-empty')?.addEventListener('click', () => this.openServicoModal());
    document.getElementById('btn-novo-cliente-empty')?.addEventListener('click', () => this.openClienteModal());
  }

  bindModals() {
    document.querySelectorAll('.modal-close, .modal-overlay').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el) this.closeAllModals();
      });
    });

    document.getElementById('btn-cancelar-servico')?.addEventListener('click', () => this.closeModal('servico'));
    document.getElementById('btn-cancelar-cliente')?.addEventListener('click', () => this.closeModal('cliente'));
    document.getElementById('btn-fechar-detalhes')?.addEventListener('click', () => this.closeModal('detalhes-servico'));
    document.getElementById('btn-fechar-detalhes-cliente')?.addEventListener('click', () => this.closeModal('detalhes-cliente'));
    document.getElementById('btn-confirm-cancel')?.addEventListener('click', () => this.closeModal('confirmacao'));

    document.getElementById('btn-editar-detalhes')?.addEventListener('click', () => {
      this.closeModal('detalhes-servico');
      this.openServicoModal(this.viewingServicoId);
    });

    document.getElementById('btn-editar-detalhes-cliente')?.addEventListener('click', () => {
      this.closeModal('detalhes-cliente');
      this.openClienteModal(this.viewingClienteId);
    });
  }

  bindForms() {
    const formServico = document.getElementById('form-servico');
    formServico?.addEventListener('submit', (e) => this.handleServicoSubmit(e));

    const formCliente = document.getElementById('form-cliente');
    formCliente?.addEventListener('submit', (e) => this.handleClienteSubmit(e));

    document.getElementById('servico-valor-orcado')?.addEventListener('input', (e) => this.formatCurrencyInput(e));
    document.getElementById('servico-valor-final')?.addEventListener('input', (e) => this.formatCurrencyInput(e));
    document.getElementById('cliente-telefone')?.addEventListener('input', (e) => this.formatPhoneInput(e));

    document.getElementById('servico-prazo')?.setAttribute('min', getTodayISO());
  }

  bindSearchAndFilters() {
    const searchServicos = document.getElementById('search-servicos');
    const searchClientes = document.getElementById('search-clientes');
    const filterStatus = document.getElementById('filter-status');
    const filterPrazo = document.getElementById('filter-prazo');

    searchServicos?.addEventListener('input', debounce((e) => {
      this.searchTerms.servicos = e.target.value;
      this.renderServicosList();
    }, 300));

    searchClientes?.addEventListener('input', debounce((e) => {
      this.searchTerms.clientes = e.target.value;
      this.renderClientesList();
    }, 300));

    filterStatus?.addEventListener('change', (e) => {
      this.filters.status = e.target.value;
      this.renderServicosList();
    });

    filterPrazo?.addEventListener('change', (e) => {
      this.filters.prazo = e.target.value;
      this.renderServicosList();
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchPrazoTab(btn.dataset.tab));
    });
  }

  bindListActions() {
    document.getElementById('servicos-list')?.addEventListener('click', (e) => {
      const card = e.target.closest('.service-card');
      if (!card) return;

      const id = card.dataset.id;
      if (e.target.closest('.btn-ver')) this.openServicoDetalhes(id);
      else if (e.target.closest('.btn-editar')) this.openServicoModal(id);
      else if (e.target.closest('.btn-excluir')) this.confirmDeleteServico(id);
      else if (e.target.closest('.status-select')) {
        const select = e.target.closest('.status-select');
        this.updateServicoStatus(id, select.value);
      }
    });

    document.getElementById('clientes-list')?.addEventListener('click', (e) => {
      const card = e.target.closest('.client-card');
      if (!card) return;

      const id = card.dataset.id;
      if (e.target.closest('.btn-ver')) this.openClienteDetalhes(id);
      else if (e.target.closest('.btn-editar')) this.openClienteModal(id);
      else if (e.target.closest('.btn-excluir')) this.confirmDeleteCliente(id);
    });

    document.querySelectorAll('#prazos-hoje-list, #prazos-proximos-list, #prazos-atrasados-list, #prazos-sem-prazo-list, #prazos-aguardando-list').forEach(list => {
      list.addEventListener('click', (e) => {
        const item = e.target.closest('.prazo-item');
        if (item) this.openServicoDetalhes(item.dataset.id);
      });
    });
  }

  bindBackup() {
    document.getElementById('btn-exportar-backup')?.addEventListener('click', () => this.exportBackup());
    document.getElementById('btn-exportar-csv')?.addEventListener('click', () => this.exportCSV());
    document.getElementById('btn-importar-backup')?.addEventListener('click', () => {
      document.getElementById('input-backup').click();
    });
    document.getElementById('input-backup')?.addEventListener('change', (e) => this.importBackup(e));
  }

  bindSettings() {
    document.getElementById('btn-limpar-dados')?.addEventListener('click', () => this.confirmClearAllData());
  }

  switchScreen(screenName) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    const screen = document.getElementById(`screen-${screenName}`);
    const navItem = document.querySelector(`.nav-item[data-screen="${screenName}"]`);

    if (screen) screen.classList.add('active');
    if (navItem) navItem.classList.add('active');

    this.currentScreen = screenName;

    if (screenName === 'dashboard') this.updateDashboardStats();
    if (screenName === 'prazos') this.renderPrazosTabs();
  }

  switchPrazoTab(tabName) {
    document.querySelectorAll('.tab-btn').forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
      p.hidden = true;
    });

    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    const panel = document.getElementById(`panel-${tabName}`);

    if (btn) {
      btn.classList.add('active');
      btn.setAttribute('aria-selected', 'true');
    }
    if (panel) {
      panel.classList.add('active');
      panel.hidden = false;
    }

    this.renderPrazoTab(tabName);
  }

  async renderAll() {
    this.renderServicosList();
    this.renderClientesList();
    this.renderPrazosTabs();
    this.updateClienteSelect();
    this.updateAppInfo();
  }

  async updateDashboardStats() {
    const stats = await Servico.getDashboardStats();
    const valorTotal = await Servico.getValorTotalAtivos();

    this.updateStat('total', stats.total);
    this.updateStat('em-producao', stats.emProducao);
    this.updateStat('aguardando', stats.aguardando);
    this.updateStat('finalizados', stats.finalizados);
    this.updateStat('proximas', stats.proximas);
    this.updateStat('atrasados', stats.atrasados);

    const emptyDashboard = document.getElementById('empty-dashboard');
    const statsGrid = document.querySelector('.stats-grid');
    const quickActions = document.querySelector('.quick-actions');

    if (stats.total === 0) {
      emptyDashboard?.removeAttribute('hidden');
      statsGrid?.setAttribute('hidden', '');
      quickActions?.setAttribute('hidden', '');
    } else {
      emptyDashboard?.setAttribute('hidden', '');
      statsGrid?.removeAttribute('hidden');
      quickActions?.removeAttribute('hidden');
    }
  }

  updateStat(statName, value) {
    const el = document.getElementById(`stat-${statName}`);
    if (el) el.textContent = value;
  }

  async updateClienteSelect() {
    const select = document.getElementById('servico-cliente');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Selecione um cliente</option>';

    this.clientes.forEach(cliente => {
      const option = document.createElement('option');
      option.value = cliente.id;
      option.textContent = cliente.nome;
      select.appendChild(option);
    });

    if (currentValue) select.value = currentValue;
  }

  updateAppInfo() {
    document.getElementById('app-version')?.textContent = '1.0.0';
    document.getElementById('db-info')?.textContent = 'SQLite Local';
  }

  getFilteredServicos() {
    let result = [...this.servicos];

    if (this.searchTerms.servicos) {
      const term = this.searchTerms.servicos.toLowerCase();
      result = result.filter(s =>
        s.nome.toLowerCase().includes(term) ||
        s.descricao.toLowerCase().includes(term) ||
        s.getClienteNome().toLowerCase().includes(term)
      );
    }

    if (this.filters.status) {
      result = result.filter(s => s.status === this.filters.status);
    }

    if (this.filters.prazo) {
      const today = getTodayISO();
      switch (this.filters.prazo) {
        case 'hoje':
          result = result.filter(s => s.prazo_entrega === today);
          break;
        case '7dias':
          const future = new Date();
          future.setDate(future.getDate() + 7);
          const futureStr = future.toISOString().split('T')[0];
          result = result.filter(s => s.prazo_entrega >= today && s.prazo_entrega <= futureStr);
          break;
        case 'atrasados':
          result = result.filter(s => s.prazo_entrega < today && !['entregue', 'cancelado'].includes(s.status));
          break;
        case 'sem-prazo':
          result = result.filter(s => !s.prazo_entrega);
          break;
      }
    }

    return result;
  }

  renderServicosList() {
    const container = document.getElementById('servicos-list');
    const emptyState = document.getElementById('empty-servicos');
    if (!container) return;

    const filtered = this.getFilteredServicos();

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState?.removeAttribute('hidden');
      return;
    }

    emptyState?.setAttribute('hidden', '');
    container.innerHTML = filtered.map(s => renderServicoCard(s, { searchTerm: this.searchTerms.servicos })).join('');
  }

  renderClientesList() {
    const container = document.getElementById('clientes-list');
    const emptyState = document.getElementById('empty-clientes');
    if (!container) return;

    let filtered = [...this.clientes];

    if (this.searchTerms.clientes) {
      const term = this.searchTerms.clientes.toLowerCase();
      filtered = filtered.filter(c =>
        c.nome.toLowerCase().includes(term) ||
        (c.telefone && c.telefone.includes(term)) ||
        (c.endereco && c.endereco.toLowerCase().includes(term))
      );
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState?.removeAttribute('hidden');
      return;
    }

    emptyState?.setAttribute('hidden', '');
    const clientesComContagem = filtered.map(c => {
      const count = this.servicos.filter(s => s.cliente_id === c.id).length;
      return { ...c, servicos_count: count };
    });
    container.innerHTML = clientesComContagem.map(c => renderClienteCard(new Cliente(c), { searchTerm: this.searchTerms.clientes })).join('');
  }

  renderPrazosTabs() {
    this.renderPrazoTab('hoje');
    this.renderPrazoTab('proximos');
    this.renderPrazoTab('atrasados');
    this.renderPrazoTab('sem-prazo');
    this.renderPrazoTab('aguardando');
  }

  renderPrazoTab(tabName) {
    const containerId = `prazos-${tabName}-list`;
    const container = document.getElementById(containerId);
    const emptyState = container?.parentElement?.querySelector('.empty-state');
    if (!container) return;

    let filtered = [];
    const today = getTodayISO();

    switch (tabName) {
      case 'hoje':
        filtered = this.servicos.filter(s => s.prazo_entrega === today);
        break;
      case 'proximos':
        const future = new Date();
        future.setDate(future.getDate() + 7);
        const futureStr = future.toISOString().split('T')[0];
        filtered = this.servicos.filter(s =>
          s.prazo_entrega > today && s.prazo_entrega <= futureStr && !['entregue', 'cancelado'].includes(s.status)
        );
        break;
      case 'atrasados':
        filtered = this.servicos.filter(s =>
          s.prazo_entrega < today && !['entregue', 'cancelado'].includes(s.status)
        );
        break;
      case 'sem-prazo':
        filtered = this.servicos.filter(s => !s.prazo_entrega);
        break;
      case 'aguardando':
        filtered = this.servicos.filter(s => s.status === 'finalizado');
        break;
    }

    if (filtered.length === 0) {
      container.innerHTML = '';
      emptyState?.removeAttribute('hidden');
      return;
    }

    emptyState?.setAttribute('hidden', '');
    container.innerHTML = filtered.map(s => renderPrazoItem(s)).join('');
  }

  openServicoModal(id = null) {
    this.editingServicoId = id;
    const form = document.getElementById('form-servico');
    const title = document.getElementById('modal-servico-title');

    form?.reset();
    document.getElementById('servico-id').value = '';
    document.getElementById('servico-status').value = 'orcamento';
    document.getElementById('servico-prazo').value = getTodayISO();

    if (id) {
      const servico = this.servicos.find(s => s.id === id);
      if (servico) {
        title.textContent = 'Editar Serviço';
        this.populateServicoForm(servico);
      }
    } else {
      title.textContent = 'Novo Serviço';
    }

    this.openModal('servico');
  }

  populateServicoForm(servico) {
    document.getElementById('servico-id').value = servico.id;
    document.getElementById('servico-cliente').value = servico.cliente_id;
    document.getElementById('servico-nome').value = servico.nome;
    document.getElementById('servico-tipo').value = servico.tipo || '';
    document.getElementById('servico-descricao').value = servico.descricao || '';
    document.getElementById('servico-medidas').value = servico.medidas || '';
    document.getElementById('servico-materiais').value = servico.materiais || '';
    document.getElementById('servico-valor-orcado').value = servico.valor_orcado.toFixed(2).replace('.', ',');
    document.getElementById('servico-valor-final').value = servico.valor_final !== null ? servico.valor_final.toFixed(2).replace('.', ',') : '';
    document.getElementById('servico-prazo').value = servico.prazo_entrega;
    document.getElementById('servico-status').value = servico.status;
    document.getElementById('servico-observacoes').value = servico.observacoes || '';
  }

  openClienteModal(id = null) {
    this.editingClienteId = id;
    const form = document.getElementById('form-cliente');
    const title = document.getElementById('modal-cliente-title');

    form?.reset();
    document.getElementById('cliente-id').value = '';

    if (id) {
      const cliente = this.clientes.find(c => c.id === id);
      if (cliente) {
        title.textContent = 'Editar Cliente';
        this.populateClienteForm(cliente);
      }
    } else {
      title.textContent = 'Novo Cliente';
    }

    this.openModal('cliente');
  }

  populateClienteForm(cliente) {
    document.getElementById('cliente-id').value = cliente.id;
    document.getElementById('cliente-nome').value = cliente.nome;
    document.getElementById('cliente-telefone').value = cliente.telefone || '';
    document.getElementById('cliente-endereco').value = cliente.endereco || '';
    document.getElementById('cliente-observacoes').value = cliente.observacoes || '';
  }

  async handleServicoSubmit(e) {
    e.preventDefault();
    const form = e.target;

    const id = document.getElementById('servico-id').value;
    const data = {
      cliente_id: document.getElementById('servico-cliente').value,
      nome: document.getElementById('servico-nome').value.trim(),
      tipo: document.getElementById('servico-tipo').value,
      descricao: document.getElementById('servico-descricao').value.trim(),
      medidas: document.getElementById('servico-medidas').value.trim(),
      materiais: document.getElementById('servico-materiais').value.trim(),
      valor_orcado: parseFloat(document.getElementById('servico-valor-orcado').value.replace(',', '.')),
      valor_final: document.getElementById('servico-valor-final').value ? parseFloat(document.getElementById('servico-valor-final').value.replace(',', '.')) : null,
      prazo_entrega: document.getElementById('servico-prazo').value,
      status: document.getElementById('servico-status').value,
      observacoes: document.getElementById('servico-observacoes').value.trim()
    };

    if (id) data.id = id;

    try {
      if (id) {
        const servico = this.servicos.find(s => s.id === id);
        if (servico) {
          Object.assign(servico, data);
          await servico.save();
        }
      } else {
        const servico = new Servico(data);
        await servico.save();
        this.servicos.unshift(servico);
      }

      await this.loadData();
      this.renderAll();
      this.updateDashboardStats();
      this.closeModal('servico');
      this.showToast(id ? 'Serviço atualizado com sucesso!' : 'Serviço cadastrado com sucesso!', 'success');
    } catch (error) {
      this.showToast('Erro ao salvar serviço: ' + error.message, 'error');
    }
  }

  async handleClienteSubmit(e) {
    e.preventDefault();

    const id = document.getElementById('cliente-id').value;
    const data = {
      nome: document.getElementById('cliente-nome').value.trim(),
      telefone: document.getElementById('cliente-telefone').value.trim(),
      endereco: document.getElementById('cliente-endereco').value.trim(),
      observacoes: document.getElementById('cliente-observacoes').value.trim()
    };

    if (id) data.id = id;

    try {
      if (id) {
        const cliente = this.clientes.find(c => c.id === id);
        if (cliente) {
          Object.assign(cliente, data);
          await cliente.save();
        }
      } else {
        const cliente = new Cliente(data);
        await cliente.save();
        this.clientes.unshift(cliente);
      }

      await this.loadData();
      this.renderAll();
      this.updateClienteSelect();
      this.closeModal('cliente');
      this.showToast(id ? 'Cliente atualizado com sucesso!' : 'Cliente cadastrado com sucesso!', 'success');
    } catch (error) {
      this.showToast('Erro ao salvar cliente: ' + error.message, 'error');
    }
  }

  async updateServicoStatus(id, newStatus) {
    const servico = this.servicos.find(s => s.id === id);
    if (!servico) return;

    try {
      await servico.updateStatus(newStatus);
      await this.loadData();
      this.renderAll();
      this.updateDashboardStats();
      this.showToast('Status atualizado!', 'success');
    } catch (error) {
      this.renderServicosList();
      this.showToast('Erro ao atualizar status: ' + error.message, 'error');
    }
  }

  async confirmDeleteServico(id) {
    const servico = this.servicos.find(s => s.id === id);
    if (!servico) return;

    this.modalCallbacks.confirm = async () => {
      try {
        await servico.delete();
        this.servicos = this.servicos.filter(s => s.id !== id);
        await this.loadData();
        this.renderAll();
        this.updateDashboardStats();
        this.showToast('Serviço excluído!', 'success');
      } catch (error) {
        this.showToast('Erro ao excluir: ' + error.message, 'error');
      }
    };

    this.openConfirmModal(
      'Excluir Serviço',
      `Tem certeza que deseja excluir o serviço "<strong>${servico.nome}</strong>"? Esta ação não pode ser desfeita.`
    );
  }

  async confirmDeleteCliente(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    const servicosCount = this.servicos.filter(s => s.cliente_id === id).length;

    if (servicosCount > 0) {
      this.showToast(`Não é possível excluir: o cliente possui ${servicosCount} serviço(s) associado(s).`, 'error');
      return;
    }

    this.modalCallbacks.confirm = async () => {
      try {
        await cliente.delete();
        this.clientes = this.clientes.filter(c => c.id !== id);
        await this.loadData();
        this.renderAll();
        this.updateClienteSelect();
        this.showToast('Cliente excluído!', 'success');
      } catch (error) {
        this.showToast('Erro ao excluir: ' + error.message, 'error');
      }
    };

    this.openConfirmModal(
      'Excluir Cliente',
      `Tem certeza que deseja excluir o cliente "<strong>${cliente.nome}</strong>"?`
    );
  }

  openServicoDetalhes(id) {
    const servico = this.servicos.find(s => s.id === id);
    if (!servico) return;

    this.viewingServicoId = id;
    const body = document.getElementById('modal-detalhes-body');
    body.innerHTML = renderServicoDetalhes(servico);
    this.openModal('detalhes-servico');
  }

  openClienteDetalhes(id) {
    const cliente = this.clientes.find(c => c.id === id);
    if (!cliente) return;

    this.viewingClienteId = id;
    const servicosDoCliente = this.servicos.filter(s => s.cliente_id === id);
    const body = document.getElementById('modal-detalhes-cliente-body');
    body.innerHTML = renderClienteDetalhes(cliente, servicosDoCliente);
    this.openModal('detalhes-cliente');
  }

  openConfirmModal(title, message) {
    document.getElementById('modal-confirm-title').textContent = title;
    document.getElementById('modal-confirm-body').innerHTML = message;
    this.openModal('confirmacao');
  }

  openModal(modalId) {
    document.getElementById('modal-overlay').hidden = false;
    document.getElementById(`modal-${modalId}`).hidden = false;
    document.body.style.overflow = 'hidden';

    const focusable = document.querySelector(`#modal-${modalId} input, #modal-${modalId} select, #modal-${modalId} textarea, #modal-${modalId} button`);
    focusable?.focus();
  }

  closeModal(modalId) {
    document.getElementById('modal-overlay').hidden = true;
    document.getElementById(`modal-${modalId}`).hidden = true;
    document.body.style.overflow = '';
    this.editingServicoId = null;
    this.editingClienteId = null;
    this.viewingServicoId = null;
    this.viewingClienteId = null;
  }

  closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.hidden = true);
    document.getElementById('modal-overlay').hidden = true;
    document.body.style.overflow = '';
  }

  formatCurrencyInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value) {
      value = (parseInt(value) / 100).toFixed(2).replace('.', ',');
    }
    e.target.value = value;
  }

  formatPhoneInput(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.slice(0, 11);
    if (value.length > 6) {
      value = `(${value.slice(0,2)}) ${value.slice(2,7)}-${value.slice(7)}`;
    } else if (value.length > 2) {
      value = `(${value.slice(0,2)}) ${value.slice(2)}`;
    } else if (value.length > 0) {
      value = `(${value}`;
    }
    e.target.value = value;
  }

  async exportBackup() {
    try {
      const backup = {
        version: 1,
        exportDate: new Date().toISOString(),
        clientes: this.clientes.map(c => c.toRow()),
        servicos: this.servicos.map(s => s.toRow())
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const filename = `marcenaria-backup-${formatDate(getTodayISO()).replace(/\//g, '-')}.json`;

      if (navigator.share && navigator.canShare({ files: [new File([blob], filename)] })) {
        await navigator.share({ files: [new File([blob], filename)], title: 'Backup Marcenaria Organizada' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
      }

      this.showToast('Backup exportado com sucesso!', 'success');
    } catch (error) {
      this.showToast('Erro ao exportar backup: ' + error.message, 'error');
    }
  }

  async exportCSV() {
    try {
      let csv = 'Clientes\n';
      csv += 'ID,Nome,Telefone,Endereco,Observacoes,Data Cadastro\n';
      this.clientes.forEach(c => {
        csv += `"${c.id}","${c.nome}","${c.telefone || ''}","${c.endereco || ''}","${c.observacoes || ''}","${c.created_at}"\n`;
      });

      csv += '\nServicos\n';
      csv += 'ID,Cliente ID,Nome,Tipo,Descricao,Medidas,Materiais,Valor Orcado,Valor Final,Data Criacao,Prazo Entrega,Status,Observacoes,Ultima Atualizacao\n';
      this.servicos.forEach(s => {
        csv += `"${s.id}","${s.cliente_id}","${s.nome}","${s.tipo || ''}","${s.descricao || ''}","${s.medidas || ''}","${s.materiais || ''}",${s.valor_orcado},${s.valor_final || ''},"${s.data_criacao}","${s.prazo_entrega}","${s.status}","${s.observacoes || ''}","${s.updated_at}"\n`;
      });

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const filename = `marcenaria-backup-${formatDate(getTodayISO()).replace(/\//g, '-')}.csv`;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      this.showToast('CSV exportado com sucesso!', 'success');
    } catch (error) {
      this.showToast('Erro ao exportar CSV: ' + error.message, 'error');
    }
  }

  async importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const backup = JSON.parse(text);

      if (!backup.version || !backup.clientes || !backup.servicos) {
        throw new Error('Arquivo de backup inválido ou corrompido');
      }

      this.modalCallbacks.confirm = async () => {
        try {
          await database.run('DELETE FROM servicos');
          await database.run('DELETE FROM clientes');

          for (const c of backup.clientes) {
            await database.run(
              `INSERT INTO clientes (id, nome, telefone, endereco, observacoes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
              [c.id, c.nome, c.telefone || '', c.endereco || '', c.observacoes || '', c.created_at, c.updated_at]
            );
          }

          for (const s of backup.servicos) {
            await database.run(
              `INSERT INTO servicos (id, cliente_id, nome, tipo, descricao, medidas, materiais, valor_orcado, valor_final, data_criacao, prazo_entrega, status, observacoes, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [s.id, s.cliente_id, s.nome, s.tipo || '', s.descricao || '', s.medidas || '', s.materiais || '', s.valor_orcado, s.valor_final, s.data_criacao, s.prazo_entrega, s.status, s.observacoes || '', s.updated_at]
            );
          }

          await this.loadData();
          this.renderAll();
          this.updateDashboardStats();
          this.updateClienteSelect();
          this.showToast('Backup restaurado com sucesso!', 'success');
        } catch (error) {
          this.showToast('Erro ao restaurar: ' + error.message, 'error');
        }
      };

      this.openConfirmModal(
        'Restaurar Backup',
        `Isso substituirá <strong>todos</strong> os dados atuais por ${backup.clientes.length} cliente(s) e ${backup.servicos.length} serviço(s) do backup de ${formatDate(backup.exportDate.split('T')[0])}. Deseja continuar?`
      );
    } catch (error) {
      this.showToast('Erro ao ler arquivo: ' + error.message, 'error');
    }

    e.target.value = '';
  }

  confirmClearAllData() {
    this.modalCallbacks.confirm = async () => {
      try {
        await database.run('DELETE FROM servicos');
        await database.run('DELETE FROM clientes');
        await this.loadData();
        this.renderAll();
        this.updateDashboardStats();
        this.updateClienteSelect();
        this.showToast('Todos os dados foram removidos!', 'success');
      } catch (error) {
        this.showToast('Erro ao limpar dados: ' + error.message, 'error');
      }
    };

    this.openConfirmModal(
      'Limpar Todos os Dados',
      '<strong>ATENÇÃO:</strong> Isso apagará permanentemente todos os clientes, serviços e histórico. Esta ação não pode ser desfeita. Tem certeza?'
    );
  }

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Fechar">&times;</button>
    `;

    toast.querySelector('.toast-close').addEventListener('click', () => toast.remove());
    container.appendChild(toast);

    setTimeout(() => toast.remove(), 5000);
  }

  showLoading(show) {
    const overlay = document.getElementById('modal-overlay');
    if (show) {
      overlay.hidden = false;
      overlay.style.background = 'rgba(255,255,255,0.9)';
      overlay.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:var(--spacing-md);"><div class="loading-skeleton" style="width:40px;height:40px;border-radius:50%;border:3px solid var(--color-border);border-top-color:var(--color-primary);animation:spin 1s linear infinite"></div><span>Carregando...</span></div>';
    }
  }
}

const style = document.createElement('style');
style.textContent = `
@keyframes spin {
  to { transform: rotate(360deg); }
}
`;
document.head.appendChild(style);

const app = new App();
document.addEventListener('DOMContentLoaded', () => app.init());

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}

export { app };