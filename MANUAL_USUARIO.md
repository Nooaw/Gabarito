# Manual do Usuário - Marcenaria Organizada

**Versão 1.0** | **Aplicativo Android para Gestão de Marcenaria**

---

## Sumário

1. [Instalação](#1-instalação)
2. [Primeiros Passos](#2-primeiros-passos)
3. [Tela Inicial - Dashboard](#3-tela-inicial---dashboard)
4. [Gerenciamento de Clientes](#4-gerenciamento-de-clientes)
5. [Gerenciamento de Serviços](#5-gerenciamento-de-serviços)
6. [Acompanhamento de Prazos](#6-acompanhamento-de-prazos)
7. [Backup e Restauração](#7-backup-e-restauração)
8. [Configurações](#8-configurações)
9. [Dicas e Boas Práticas](#9-dicas-e-boas-práticas)
10. [Solução de Problemas](#10-solução-de-problemas)

---

## 1. Instalação

### 1.1 Requisitos
- Android 7.0 (Nougat) ou superior
- ~50 MB de espaço livre
- Permissão de armazenamento (para backup/exportação)

### 1.2 Instalando o APK
1. Transfira o arquivo `marcenaria-organizada.apk` para seu celular (via USB, Bluetooth, e-mail ou nuvem)
2. No gerenciador de arquivos, toque no APK
3. Se aparecer "Instalar apps desconhecidos", vá em **Configurações → Apps → Acesso especial → Instalar apps desconhecidos** e permita para o gerenciador de arquivos
4. Toque em **Instalar** e aguarde
5. Toque em **Abrir** ou procure "Marcenaria Organizada" na gaveta de apps

> **Nota**: O app não está na Google Play Store. É um APK de instalação direta, seguro e sem custos.

---

## 2. Primeiros Passos

### 2.1 Ao Abrir Pela Primeira Vez
- O banco de dados é criado automaticamente
- O dashboard mostra todos os indicadores zerados
- Toque em **"Novo Serviço"** ou **"Novo Cliente"** para começar

### 2.2 Navegação Principal
A barra inferior tem 5 abas:
| Ícone | Tela | Função |
|-------|------|--------|
| 🏠 | **Início** | Dashboard com resumo geral |
| 📋 | **Serviços** | Lista, cadastro e edição de serviços |
| 📅 | **Prazos** | Entregas por urgência (hoje, semana, atrasados) |
| 👥 | **Clientes** | Cadastro e consulta de clientes |
| 💾 | **Backup** | Exportar/importar dados |

---

## 3. Tela Inicial - Dashboard

### 3.1 Indicadores Principais
O dashboard exibe 6 cards com contadores atualizados em tempo real:

| Indicador | O que mostra |
|-----------|--------------|
| **Total de Serviços** | Quantidade total cadastrada |
| **Em Produção** | Serviços com status: Aprovado, Em Produção ou Finalizado |
| **Aguardando Aprovação** | Serviços no status "Aguardando Aprovação" |
| **Finalizados (não entregues)** | Serviços finalizados mas ainda não marcados como entregues |
| **Entregas Próximas (7 dias)** | Serviços com prazo entre hoje e 7 dias |
| **Atrasados** | Serviços com prazo vencido e não entregues/cancelados |

### 3.2 Ações Rápidas
Quatro botões grandes para acesso direto:
- **Serviços** → Aba de serviços
- **Prazos** → Aba de prazos
- **Clientes** → Aba de clientes
- **Backup** → Aba de backup

### 3.3 Estado Vazio
Se não houver dados, aparece uma tela orientando a cadastrar o primeiro serviço.

---

## 4. Gerenciamento de Clientes

### 4.1 Cadastrar Cliente
1. Vá na aba **Clientes** (ícone 👥)
2. Toque no botão **+** (canto superior direito)
3. Preencha:
   - **Nome** (obrigatório) - Ex: "João Silva"
   - **Telefone/WhatsApp** (opcional) - Formato: (11) 99999-9999
   - **Endereço** (opcional) - Rua, número, bairro, cidade
   - **Observações** (opcional) - Preferências, referências, etc.
4. Toque em **Salvar**

### 4.2 Consultar e Editar
- **Busca**: Digite no campo de pesquisa para filtrar por nome
- **Toque no card** do cliente → Abre detalhes com serviços associados
- **Botão editar** (lápis) → Altera dados do cliente
- **Botão excluir** (lixeira) → Remove cliente (só permite se não houver serviços vinculados)

### 4.3 Detalhes do Cliente
Mostra:
- Nome, telefone formatado, endereço
- Data de cadastro e última atualização
- **Lista de serviços** vinculados com status, prazo e valor

---

## 5. Gerenciamento de Serviços

### 5.1 Cadastrar Serviço
1. Vá na aba **Serviços** (ícone 📋) ou toque em "Novo Serviço" no dashboard
2. Toque no botão **+**
3. Preencha os campos:

#### Campos Obrigatórios
| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| **Cliente** | Selecione da lista | "João Silva" |
| **Nome do Móvel** | Descrição curta | "Guarda-roupa 3 portas" |
| **Valor Orçado (R$)** | Valor inicial do orçamento | 2.500,00 |
| **Prazo de Entrega** | Data prevista | 15/12/2024 |
| **Status** | Etapa atual | "Orçamento" |

#### Campos Opcionais
| Campo | Descrição |
|-------|-----------|
| **Tipo de Móvel** | Guarda-roupa, Armário de Cozinha, Mesa, Estante, Painel, Porta, Balcão, Planejado, Outro |
| **Descrição Detalhada** | Acabamentos, ferragens, observações técnicas |
| **Medidas (L x A x P)** | Em centímetros - Ex: 200x240x60 |
| **Materiais Principais** | Ex: MDF 18mm, Ferragens Blum, Vidro |
| **Valor Final (R$)** | Valor acordado após negociação |
| **Observações Internas** | Notas para a equipe, alterações combinadas |

4. Toque em **Salvar**

### 5.2 Lista de Serviços
- **Busca**: Por cliente, nome do móvel ou descrição
- **Filtros**:
  - **Status**: Orçamento, Aguardando, Aprovado, Produção, Finalizado, Entregue, Cancelado
  - **Prazo**: Hoje, 7 dias, Atrasados, Sem prazo
- **Cards mostram**: Nome, cliente, tipo, badges de status/prazo, valor, data de entrega

### 5.3 Ações na Lista
| Ação | Como fazer |
|------|------------|
| **Ver detalhes** | Toque no ícone 👁 (olho) |
| **Editar** | Toque no ícone ✏️ (lápis) |
| **Alterar status** | Use o dropdown "Status" no card |
| **Excluir** | Toque no ícone 🗑 (lixeira) + confirmação |

### 5.4 Detalhes do Serviço
Mostra todas as informações + **Histórico de Status** com datas e observações.

### 5.5 Fluxo de Status Recomendado
```
Orçamento → Aguardando Aprovação → Aprovado → Em Produção → Finalizado → Entregue
```
- Use "Cancelado" para serviços que não prosseguirão
- Não é possível voltar de "Entregue" ou "Cancelado"

---

## 6. Acompanhamento de Prazos

### 6.1 Abas de Visualização
A tela de **Prazos** (ícone 📅) tem 5 abas:

| Aba | Critério | Cor do Badge |
|-----|----------|--------------|
| **Hoje** | Prazo = hoje | Azul |
| **Próximos 7 dias** | Prazo entre amanhã e 7 dias | Amarelo |
| **Atrasados** | Prazo vencido, não entregue/cancelado | Vermelho |
| **Sem prazo** | Serviços sem data de entrega | Cinza |
| **Aguardando Entrega** | Status "Finalizado" mas não "Entregue" | Verde |

### 6.2 Cards de Prazo
Cada card mostra:
- Nome do móvel + badge de status
- Cliente
- Data de entrega formatada (DD/MM/AAAA)
- Valor (final se houver, senão orçado)
- Tipo de móvel
- **Cores de fundo** indicam urgência

### 6.3 Toque no Card
Abre os detalhes completos do serviço.

---

## 7. Backup e Restauração

> ⚠️ **IMPORTANTE**: O backup contém dados sensíveis (nomes, telefones, endereços, valores). Guarde com segurança!

### 7.1 Exportar Backup (JSON) - Recomendado
1. Vá na aba **Backup** (ícone 💾)
2. Toque em **"Exportar Backup (JSON)"**
3. Escolha onde salvar:
   - Google Drive / OneDrive / Dropbox (nuvem)
   - "Salvar em arquivos" → armazenamento interno
   - Enviar por e-mail / WhatsApp para si mesmo
4. O arquivo terá nome: `marcenaria-backup-YYYY-MM-DD.json`

**Faça backup semanalmente ou após dias de muito movimento!**

### 7.2 Exportar CSV (Para Planilhas)
1. Na aba Backup, toque em **"Exportar CSV (Planilha)"**
2. Salve onde preferir
3. Abra no Excel, Google Sheets ou LibreOffice Calc
4. Duas abas: "Clientes" e "Serviços"

> ⚠️ **CSV não permite restauração** - apenas visualização/análise

### 7.3 Restaurar Backup (JSON)
1. Na aba Backup, toque em **"Importar Backup (JSON)"**
2. Selecione o arquivo `.json` de backup
3. **Confirmação obrigatória**: O app avisará que **todos os dados atuais serão substituídos**
4. Confirme apenas se tiver certeza
5. Aguarde "Backup restaurado com sucesso!"

### 7.4 Boas Práticas de Backup
- ✅ Backup semanal (segunda-feira de manhã)
- ✅ Backup antes de grandes alterações
- ✅ Guarde em **dois locais** (nuvem + pen drive)
- ✅ Teste a restauração a cada 2-3 meses
- ✅ Não compartilhe arquivos de backup com terceiros

---

## 8. Configurações

Acesse pelo ícone ⚙️ no canto superior direito do dashboard.

### 8.1 Informações do App
- Versão atual
- Finalidade (Atividade de Extensão - ADS II)
- ODS relacionado (ODS 8)

### 8.2 Dados e Armazenamento
- Tipo: SQLite Local
- Tamanho estimado do banco

### 8.3 Limpar Todos os Dados
> ⚠️ **PERIGOSO**: Apaga **tudo** (clientes, serviços, histórico). Irreversível!
- Requer confirmação dupla
- Use apenas se quiser zerar completamente o app

---

## 9. Dicas e Boas Práticas

### 9.1 Organização Diária
- ✅ Abra o app pela manhã - veja "Hoje" e "Atrasados" em Prazos
- ✅ Atualize status conforme avança a produção
- ✅ Cadastre observações internas durante o dia (não confie na memória)

### 9.2 Gestão de Clientes
- ✅ Cadastre telefone com WhatsApp para contato rápido
- ✅ Use observações para preferências: "Prefere contato à tarde", "Tem alergia a cheiro forte"
- ✅ Evite duplicatas: busque antes de cadastrar

### 9.3 Controle Financeiro
- ✅ Preencha sempre o **Valor Orçado**
- ✅ Atualize **Valor Final** quando fechar negócio
- ✅ No Dashboard, veja o total de serviços ativos (indicador "Em Produção")

### 9.4 Prazos
- ✅ Coloque prazos realistas (com margem)
- ✅ Serviços "Finalizados" vão para aba "Aguardando Entrega" - não esqueça de marcar "Entregue"
- ✅ Revise "Atrasados" toda segunda-feira

---

## 10. Solução de Problemas

| Problema | Causa Provável | Solução |
|----------|----------------|---------|
| App não abre | Falha na instalação | Reinstale o APK |
| Dados sumiram | Backup restaurado incorretamente | Restaure backup anterior |
| Não consigo excluir cliente | Tem serviços vinculados | Exclua/transfira os serviços primeiro |
| Backup não importa | Arquivo corrompido ou versão incompatível | Use backup mais recente válido |
| Valores não salvam | Campo valor vazio ou formato errado | Use apenas números e vírgula (ex: 2500,00) |
| Tela branca | Erro de JavaScript | Feche e abra o app; se persistir, reinstale |

### 10.1 Reset Completo (Último Recurso)
1. Configurações → "Limpar Todos os Dados" → Confirmar duas vezes
2. Ou: Desinstale o app → Reinstale o APK
3. Restaure seu backup mais recente

### 10.2 Contato para Suporte
Este app foi desenvolvido como atividade acadêmica de extensão. Para dúvidas:
- Consulte este manual
- Verifique se está na versão mais recente
- Reinstale o APK se necessário

---

## Anexos

### A. Atalhos de Teclado (se usar teclado físico)
| Tecla | Ação |
|-------|------|
| `Tab` | Navegar entre campos |
| `Enter` | Salvar formulário |
| `Esc` | Fechar modal/cancelar |

### B. Formatos Aceitos
| Campo | Formato |
|-------|---------|
| Data | DD/MM/AAAA (exibição) / YYYY-MM-DD (interno) |
| Moeda | R$ 0,00 (exibição) / 0.00 (interno) |
| Telefone | (XX) XXXXX-XXXX ou (XX) XXXX-XXXX |
| Medidas | Livre (ex: 200x240x60) |

### C. Permissões do App
| Permissão | Uso |
|-----------|-----|
| Armazenamento | Ler/escrever arquivos de backup (JSON, CSV) |
| Internet | **Não usada** - app 100% offline |

---

**Desenvolvido para Atividade de Extensão - ADS II**
**ODS 8 - Trabalho Decente e Crescimento Econômico**
**Versão 1.0 - Outubro 2026**