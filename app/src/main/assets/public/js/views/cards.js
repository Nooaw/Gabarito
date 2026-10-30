import { Servico } from '../models/Servico.js';
import { Cliente } from '../models/Cliente.js';
import { formatCurrency, formatDate, highlightMatch } from '../utils/helpers.js';

export function renderServicoCard(servico, options = {}) {
  const { showActions = true, compact = false } = options;
  const statusInfo = servico.getStatusInfo();
  const prazoClass = servico.getPrazoClass();
  const valorFinal = servico.valor_final !== null ? servico.getValorFinalFormatado() : servico.getValorOrcadoFormatado();

  let badges = `<span class="badge ${statusInfo.class}">${statusInfo.label}</span>`;
  if (prazoClass) {
    badges += `<span class="badge badge-${prazoClass}">${getPrazoLabel(prazoClass)}</span>`;
  }

  const actionsHtml = showActions ? `
    <div class="list-item-actions">
      <button class="icon-btn btn-ver" data-id="${servico.id}" aria-label="Ver detalhes" data-tooltip="Ver detalhes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="icon-btn btn-editar" data-id="${servico.id}" aria-label="Editar" data-tooltip="Editar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn btn-excluir" data-id="${servico.id}" aria-label="Excluir" data-tooltip="Excluir">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  ` : '';

  const metaItems = [];
  if (servico.cliente_id) {
    metaItems.push(`<span class="list-item-meta">${highlightMatch(servico.getClienteNome(), options.searchTerm || '')}</span>`);
  }
  metaItems.push(`<span class="list-item-meta">${servico.getPrazoFormatado()}</span>`);
  metaItems.push(`<span class="list-item-meta value-display">${valorFinal}</span>`);

  return `
    <article class="list-item service-card ${prazoClass ? prazoClass : ''}" data-id="${servico.id}" ${compact ? 'style="padding: var(--spacing-sm);"' : ''}>
      <div class="list-item-content">
        <div class="service-header">
          <div class="service-title-area">
            <h3 class="service-title">${highlightMatch(servico.nome, options.searchTerm || '')}</h3>
            ${servico.tipo ? `<span class="service-client">${servico.getTipoMovelLabel()}</span>` : ''}
          </div>
          <div class="service-badges">${badges}</div>
        </div>
        ${servico.descricao ? `<p class="service-desc" style="font-size: var(--font-size-sm); color: var(--color-text-secondary); margin: var(--spacing-xs) 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${highlightMatch(servico.descricao, options.searchTerm || '')}</p>` : ''}
        <div class="service-meta">${metaItems.join('')}</div>
        ${showActions ? `
          <div class="service-status-row">
            <div class="status-actions">
              <select class="status-select" data-id="${servico.id}" aria-label="Alterar status">
                <option value="orcamento" ${servico.status === 'orcamento' ? 'selected' : ''}>Orçamento</option>
                <option value="aguardando" ${servico.status === 'aguardando' ? 'selected' : ''}>Aguardando Aprovação</option>
                <option value="aprovado" ${servico.status === 'aprovado' ? 'selected' : ''}>Aprovado</option>
                <option value="producao" ${servico.status === 'producao' ? 'selected' : ''}>Em Produção</option>
                <option value="finalizado" ${servico.status === 'finalizado' ? 'selected' : ''}>Finalizado</option>
                <option value="entregue" ${servico.status === 'entregue' ? 'selected' : ''}>Entregue</option>
                <option value="cancelado" ${servico.status === 'cancelado' ? 'selected' : ''}>Cancelado</option>
              </select>
            </div>
          </div>
        ` : ''}
      </div>
      ${actionsHtml}
    </article>
  `;
}

function getPrazoLabel(prazoClass) {
  const labels = {
    atrasado: 'Atrasado',
    hoje: 'Hoje',
    proximo: 'Próximo',
    futuro: 'Futuro'
  };
  return labels[prazoClass] || prazoClass;
}

export function renderClienteCard(cliente, options = {}) {
  const { showActions = true, showServicosCount = true, searchTerm = '' } = options;
  const servicosCount = cliente.servicos_count || 0;

  const actionsHtml = showActions ? `
    <div class="list-item-actions">
      <button class="icon-btn btn-ver" data-id="${cliente.id}" aria-label="Ver detalhes" data-tooltip="Ver detalhes">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button class="icon-btn btn-editar" data-id="${cliente.id}" aria-label="Editar" data-tooltip="Editar">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
      </button>
      <button class="icon-btn btn-excluir" data-id="${cliente.id}" aria-label="Excluir" data-tooltip="Excluir">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
      </button>
    </div>
  ` : '';

  const metaItems = [];
  if (cliente.telefone) {
    metaItems.push(`<span class="list-item-meta">${cliente.getTelefoneFormatado()}</span>`);
  }
  if (showServicosCount) {
    metaItems.push(`<span class="client-services-count">${servicosCount} serviço${servicosCount !== 1 ? 's' : ''}</span>`);
  }

  return `
    <article class="list-item client-card" data-id="${cliente.id}">
      <div class="list-item-content">
        <div class="client-header">
          <h3 class="client-name">${highlightMatch(cliente.nome, searchTerm)}</h3>
          ${showServicosCount && servicosCount > 0 ? `<span class="client-services-count">${servicosCount} serviço${servicosCount !== 1 ? 's' : ''}</span>` : ''}
        </div>
        ${cliente.endereco ? `<p class="client-address">${highlightMatch(cliente.endereco, searchTerm)}</p>` : ''}
        <div class="client-meta">${metaItems.join('')}</div>
      </div>
      ${actionsHtml}
    </article>
  `;
}

export function renderPrazoItem(servico, options = {}) {
  const statusInfo = servico.getStatusInfo();
  const prazoClass = servico.getPrazoClass();
  const valorFinal = servico.valor_final !== null ? servico.getValorFinalFormatado() : servico.getValorOrcadoFormatado();

  return `
    <article class="list-item prazo-item ${prazoClass}" data-id="${servico.id}">
      <div class="list-item-content">
        <div class="prazo-item-header">
          <h3 class="prazo-item-title">${servico.nome}</h3>
          <div style="display: flex; align-items: center; gap: var(--spacing-sm);">
            <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
            <span class="prazo-item-date">${servico.getPrazoFormatado()}</span>
          </div>
        </div>
        <div class="prazo-item-meta">
          <span class="prazo-item-client">${servico.getClienteNome()}</span>
          <span class="prazo-item-value">${valorFinal}</span>
        </div>
        ${servico.tipo ? `<div class="prazo-item-meta"><span>${servico.getTipoMovelLabel()}</span></div>` : ''}
      </div>
    </article>
  `;
}

export function renderServicoDetalhes(servico) {
  const statusInfo = servico.getStatusInfo();
  const prazoClass = servico.getPrazoClass();
  const valorOrcado = servico.getValorOrcadoFormatado();
  const valorFinal = servico.getValorFinalFormatado();

  return `
    <div class="modal-detalhes-header">
      <div class="modal-detalhes-title-area">
        <h3 class="modal-detalhes-title">${servico.nome}</h3>
        <div class="modal-detalhes-client">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <span>${servico.getClienteNome()}</span>
        </div>
      </div>
      <div class="modal-detalhes-badges">
        <span class="badge ${statusInfo.class}">${statusInfo.label}</span>
        ${prazoClass ? `<span class="badge badge-${prazoClass}">${getPrazoLabel(prazoClass)}</span>` : ''}
        ${servico.tipo ? `<span class="badge" style="background:var(--color-bg-alt);color:var(--color-text-secondary)">${servico.getTipoMovelLabel()}</span>` : ''}
      </div>
    </div>

    <div class="modal-detalhes-grid">
      <div class="detalhe-item">
        <span class="detalhe-label">Valor Orçado</span>
        <span class="detalhe-value valor">${valorOrcado}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Valor Final</span>
        <span class="detalhe-value valor">${valorFinal}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Prazo de Entrega</span>
        <span class="detalhe-value ${prazoClass ? `badge-${prazoClass}` : ''}" style="${prazoClass ? 'padding:var(--spacing-xs) var(--spacing-sm);border-radius:var(--radius-full);display:inline-block' : ''}">${servico.getPrazoFormatado()}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Data de Criação</span>
        <span class="detalhe-value">${formatDate(servico.data_criacao)}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Última Atualização</span>
        <span class="detalhe-value">${formatDate(servico.updated_at)}</span>
      </div>
      ${servico.medidas ? `
        <div class="detalhe-item">
          <span class="detalhe-label">Medidas</span>
          <span class="detalhe-value">${servico.medidas}</span>
        </div>
      ` : ''}
      ${servico.materiais ? `
        <div class="detalhe-item">
          <span class="detalhe-label">Materiais</span>
          <span class="detalhe-value">${servico.materiais}</span>
        </div>
      ` : ''}
    </div>

    ${servico.descricao ? `
      <div class="modal-detalhes-descricao">
        <h4>Descrição</h4>
        <p>${servico.descricao}</p>
      </div>
    ` : ''}

    ${servico.observacoes ? `
      <div class="modal-detalhes-descricao">
        <h4>Observações</h4>
        <p>${servico.observacoes}</p>
      </div>
    ` : ''}
  `;
}

export function renderClienteDetalhes(cliente, servicos = []) {
  const servicosHtml = servicos.length > 0 ? servicos.map(s => `
    <article class="cliente-servico-item">
      <div class="cliente-servico-info">
        <span class="cliente-servico-nome">${s.nome}</span>
        <div class="cliente-servico-meta">
          <span class="badge ${s.getStatusInfo().class}">${s.getStatusInfo().label}</span>
          <span>${s.getPrazoFormatado()}</span>
        </div>
      </div>
      <span class="cliente-servico-valor">${s.getValorFinalFormatado() !== '—' ? s.getValorFinalFormatado() : s.getValorOrcadoFormatado()}</span>
    </article>
  `).join('') : '<p style="color:var(--color-text-muted);text-align:center;padding:var(--spacing-lg)">Nenhum serviço associado</p>';

  return `
    <div class="cliente-detalhes-grid">
      <div class="detalhe-item">
        <span class="detalhe-label">Nome</span>
        <span class="detalhe-value">${cliente.nome}</span>
      </div>
      ${cliente.telefone ? `
        <div class="detalhe-item">
          <span class="detalhe-label">Telefone</span>
          <span class="detalhe-value">${cliente.getTelefoneFormatado()}</span>
        </div>
      ` : ''}
      ${cliente.endereco ? `
        <div class="detalhe-item detalhe-full">
          <span class="detalhe-label">Endereço</span>
          <span class="detalhe-value">${cliente.endereco}</span>
        </div>
      ` : ''}
      <div class="detalhe-item">
        <span class="detalhe-label">Cadastro</span>
        <span class="detalhe-value">${formatDate(cliente.created_at)}</span>
      </div>
      <div class="detalhe-item">
        <span class="detalhe-label">Última Atualização</span>
        <span class="detalhe-value">${formatDate(cliente.updated_at)}</span>
      </div>
      ${cliente.observacoes ? `
        <div class="detalhe-item detalhe-full">
          <span class="detalhe-label">Observações</span>
          <span class="detalhe-value">${cliente.observacoes}</span>
        </div>
      ` : ''}
    </div>

    <div class="cliente-servicos">
      <h4>Serviços (${servicos.length})</h4>
      <div class="cliente-servicos-list">${servicosHtml}</div>
    </div>
  `;
}

export function renderEmptyState(message, subMessage, actionLabel, actionId, iconSvg) {
  return `
    <div class="empty-state">
      ${iconSvg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><circle cx="12" cy="12" r="10"/></svg>'}
      <h3>${message}</h3>
      <p>${subMessage}</p>
      ${actionLabel ? `<button class="btn btn-primary" id="${actionId}">${actionLabel}</button>` : ''}
    </div>
  `;
}

export function renderLoadingSkeleton(type = 'card', count = 3) {
  const skeleton = type === 'stat'
    ? '<div class="loading-skeleton skeleton-stat"></div>'
    : '<div class="loading-skeleton skeleton-card"></div>';
  return Array(count).fill(skeleton).join('');
}