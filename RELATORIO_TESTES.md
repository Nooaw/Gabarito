# RELATÓRIO DE TESTES E CORREÇÕES — Marcenaria Organizada v1.0.0

Data: 24/10/2026 · App: Marcenaria Organizada (Capacitor + SQLite, Android)
Status: **23/23 testes automatizados passando**

---

## 1. Panorama do App

Aplicativo móvel offline para gestão de uma marcenaria. Stack: HTML5/CSS3/JS (módulos ES6), Capacitor 6, SQLite via `@capacitor-community/sqlite`.

**Telas/funcionalidades:**
- Dashboard — 6 indicadores (total, em produção, aguardando, finalizados, próximas, atrasados) + ações rápidas
- Serviços — CRUD completo, busca, filtros (status + prazo), seleção de status inline
- Clientes — CRUD com validação, busca, bloqueio de exclusão se houver serviços
- Prazos — 5 abas (hoje, próximos 7 dias, atrasados, sem prazo, aguardando entrega) com cores por urgência
- Backup/Restauração — exportar JSON (restaurável), exportar CSV, importar JSON com confirmação
- Configurações — versão, banco, limpar dados

**Fluxo de status:** Orçamento → Aguardando Aprovação → Aprovado → Em Produção → Finalizado → Entregue (Cancelado é terminal).

---

## 2. Bugs Corrigidos

| # | Arquivo | Bug | Impacto | Correção |
|---|---------|-----|---------|----------|
| 1 | `src/js/models/Servico.js` | `formatCurrency` **não estava importado**; `getValorFinalFormatado()` quebrava com `ReferenceError` | Qualquer serviço com valor final exibido trazia erro | Adicionado `formatCurrency` à importação de helpers |
| 2 | `src/js/app.js` | Moeda ≥ 1.000 quebrava no salvamento: `parseFloat("1.500.00")` → `1,5` (ponto de milhar tratado como decimal) | Valores grandes eram salvos errados | Usar `parseCurrency()` (remove pontos antes de converter) |
| 3 | `src/js/app.js` | Animação do modal mobile não funcionava: classe `.active` nunca era adicionada/removida | Modal aparecia sem slide-up no Android | `openModal`/`closeModal` agora adicionam/removem `.active` com `requestAnimationFrame` + CSS de `opacity`/`transform` |
| 4 | `src/js/app.js` | Clicar para abrir o dropdown de status da lista disparava `updateServicoStatus` (salvava desnecessariamente) | UX ruim na lista de serviços | Mudou de evento `click` para `change` no `.status-select` |
| 5 | `src/js/services/database.js` | Web/browser não persistia nada (stub retornava vazio) e `FOREIGN KEY` não ativado | Dados sumiam ao recarregar; integridade referencial não respeitada | Camada web agora persiste em `localStorage` (shim testável); `PRAGMA foreign_keys = ON` ativado |
| 6 | `src/css/components.css` + `app.css` | Modal sem transição suave (opacidade/transform) e conflito de transform entre mobile/desktop | Modal "pula" na tela | Adicionado `opacity`/`transition` e alinhamento das regras mobile/desktop |
| 7 | `src/css/app.css` | Botões primários escondiam o rótulo texto em mobile (`span { display: none }`) | Botões ficavam sem sentido em telas pequenas | Removido o `display: none`; rótulo mantido |
| 8 | `src/css/screens.css` | Select de status sem estilo/foco adequado | Difícil de usar no touch | Adicionado `border`, `cursor: pointer`, foco com `--color-border-focus` |

---

## 3. Melhorias de Aparência (UX/UI)

- Animação de entrada/saída do modal (fade + slide-up mobile, scale desktop)
- Cards de serviço com borda-acento por urgência do prazo (atrasado/hoje/próximo/futuro)
- Badges de status com cores por tipo
- Hover/touch feedback em cards, botões e abas de prazos
- Layout responsivo: stats-grid (1 col mobile → 3 col → 6 col desktop), quick-actions (2 → 4 col)
- Suporte a contraste alto, movimento reduzido, safe areas (notch) e impressão
- Toasts com cor por tipo (sucesso/erro/aviso/info) e auto-dismiss em 5s

---

## 4. Suíte de Testes Automatizados (`npm test`)

Arquivo: `test/app.test.mjs` — 23 testes, 0 falhas. Roda em Node (sem instalar Jest), com shim de `localStorage` e `document` para testar a camada web do SQLite e o DOM leve.

**Cobertura:**
- `helpers`: `formatCurrency`, `parseCurrency` (inclui milhar com ponto), `formatDate`, `getTodayISO`, `getStatusInfo`, `getTipoMovelInfo`, `validateCurrency`, `validateDate` (datas impossíveis como 2026-02-30), `highlightMatch` (escapamento de regex), `debounce`
- `Servico`: padrões de instância, `validate` (cliente/nome/valores/prazo/status), `canTransitionTo` (fluxo completo + terminais entregue/cancelado), `getPrazoClass`, `isAtrasado/isHoje/isProximo`, `getValorFinalFormatado`, `getClienteNome`
- `Cliente`: `validate`, `getTelefoneFormatado` (10 e 11 dígitos)
- Persistência web (localStorage shim): salvar, listar, `findById`, bloqueio de exclusão de cliente com serviços associados

**Comando:** `npm test`

---

## 5. Relatório por Funcionalidade

| Funcionalidade | Status | Evidência / Testes | Observações |
|---|---|---|---|
| Dashboard & indicadores | ✅ OK | `Servico.getDashboardStats` coberto indiretamente; validação de fluxo | Contagem de "finalizados (não entregues)" funciona |
| Cadastro/edição de serviço | ✅ OK | `Servico.validate`, moeda ≥1000 corrigida, `formatCurrency` importado | Valor orçado obrigatório; prazo mínimo = hoje |
| Cadastro/edição de cliente | ✅ OK | `Cliente.validate`, telefone formatado | Nome obrigatório (≤100 chars) |
| Busca e filtros (serviços) | ✅ OK | `highlightMatch`, `validateDate`, filtros de status/prazo | Busca por nome do móvel, descrição e cliente |
| Seleção de status na lista | ✅ OK | Evento `change` no `.status-select` | Respeita transições permitidas (`canTransitionTo`) |
| Prazos (5 abas) | ✅ OK | `getPrazoClass`, `isAtrasado/isHoje/isProximo` | Cores por urgência; atrasados exclui entregue/cancelado |
| Backup JSON (export/import) | ✅ OK | Lógica de exportação/importação revisada | Restauração substitui todos os dados com confirmação |
| Export CSV | ✅ OK | Cabeçalhos clientes + serviços | CSV é apenas visualização (não restaura) |
| Limpar todos os dados | ✅ OK | Confirmação modal + `DELETE` nas duas tabelas | Irreversível; aviso exibido |
| Modal/UX | ✅ OK | Animação `.active`, foco, overflow do body | Slide-up mobile, fade desktop |
| Integridade referencial | ✅ OK | `PRAGMA foreign_keys = ON` + bloqueio app-level | Cliente com serviços não pode ser excluído |

---

## 6. Plano de Teste Manual (checklist)

Executar no emulador Android ou no navegador (`npm dev`):

```
[ ] App abre sem erro no console
[ ] Cadastro de cliente preenche e aparece na lista
[ ] Cadastro de serviço (com cliente, móvel, valor, prazo, status) salva
[ ] Edição de serviço altera dados na lista
[ ] Mudança de status via select da lista é refletida
[ ] Exclusão de serviço funciona
[ ] Exclusão de cliente com serviços é BLOQUEADA
[ ] Exclusão de cliente sem serviços funciona
[ ] Filtro por status e prazo refina a lista
[ ] Busca por texto filtra serviços/clientes
[ ] Prazos: hoje / próximos 7 dias / atrasados / sem prazo / aguardando mostram itens corretos
[ ] Detalhes do serviço exibem todos os campos
[ ] Backup JSON exporta e reimporta corretamente (após apagar dados)
[ ] CSV exporta e abre em planilha
[ ] Limpar dados remove tudo
[ ] App funciona offline (sem rede)
[ ] Toasts aparecem em ações de sucesso/erro
```

---

## 7. Limitações Conhecidas (não corrigidas neste escopo)

- Não há sincronização multi-dispositivo nem nuvem
- Não há notificações de prazo (push/local)
- Financeiro completo (pagamentos/fluxo de caixa) não existe
- Backup é manual (não agendado)
- Sem autenticação/biometria

---

## 8. Como rodar

```bash
# Dependências (já instaladas)
npm install --legacy-peer-deps

# Testes automatizados
npm test          # 23/23 passando

# Servidor local para testar no navegador
npm dev           # http://localhost:3000

# Build Android
cd android && ./gradlew assembleDebug   # APK em android/app/build/outputs/apk/debug/
```
