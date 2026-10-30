export function formatCurrency(value) {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(value);
}

export function parseCurrency(str) {
  if (!str) return 0;
  const cleaned = String(str).replace(/[^\d,-]/g, '').replace(',', '.');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDate(dateStr, options = {}) {
  if (!dateStr) return '';
  const defaultOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options
  };
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (!year || !month || !day) return dateStr;
    const date = new Date(year, month - 1, day);
    return date.toLocaleDateString('pt-BR', defaultOptions);
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr) {
  return formatDate(dateStr, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function getTodayISO() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

export function getDaysDiff(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [year, month, day] = dateStr.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  target.setHours(0, 0, 0, 0);
  const diffMs = target - today;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

export function getStatusInfo(status) {
  const statusMap = {
    orcamento: { label: 'Orçamento', class: 'badge-orcamento', color: '#1565C0' },
    aguardando: { label: 'Aguardando Aprovação', class: 'badge-aguardando', color: '#F57F17' },
    aprovado: { label: 'Aprovado', class: 'badge-aprovado', color: '#2E7D32' },
    producao: { label: 'Em Produção', class: 'badge-producao', color: '#6A1B9A' },
    finalizado: { label: 'Finalizado', class: 'badge-finalizado', color: '#00695C' },
    entregue: { label: 'Entregue', class: 'badge-entregue', color: '#1B4D2E' },
    cancelado: { label: 'Cancelado', class: 'badge-cancelado', color: '#C62828' }
  };
  return statusMap[status] || { label: status, class: '', color: '' };
}

export function getTipoMovelInfo(tipo) {
  const tipos = {
    'guarda-roupa': 'Guarda-roupa',
    'armario-cozinha': 'Armário de Cozinha',
    'mesa': 'Mesa',
    'estante': 'Estante',
    'painel': 'Painel',
    'porta': 'Porta',
    'balcao': 'Balcão',
    'planejado': 'Móvel Planejado',
    'outro': 'Outro'
  };
  return tipos[tipo] || tipo || 'Não informado';
}

export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

export function throttle(fn, limit) {
  let inThrottle;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function sanitizeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightMatch(text, query) {
  if (!query || !text) return sanitizeHtml(text);
  const escaped = sanitizeHtml(text);
  const regex = new RegExp(`(${escapeRegExp(query)})`, 'gi');
  return escaped.replace(regex, '<mark>$1</mark>');
}

export function validateRequired(value) {
  return value !== null && value !== undefined && String(value).trim() !== '';
}

export function validateCurrency(value) {
  const parsed = parseCurrency(value);
  return !isNaN(parsed) && parsed >= 0;
}

export function validateDate(value) {
  if (!value) return false;
  const regex = /^\d{4}-\d{2}-\d{2}$/;
  if (!regex.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const groupKey = item[key];
    if (!result[groupKey]) result[groupKey] = [];
    result[groupKey].push(item);
    return result;
  }, {});
}

export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = a[key];
    const bVal = b[key];
    if (aVal < bVal) return order === 'asc' ? -1 : 1;
    if (aVal > bVal) return order === 'asc' ? 1 : -1;
    return 0;
  });
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function getAppVersion() {
  return '1.0.0';
}

export function getBuildDate() {
  return new Date().toISOString().split('T')[0];
}