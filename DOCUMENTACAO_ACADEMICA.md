# Documentação Acadêmica - Projeto Marcenaria Organizada

## 1. Identificação do Projeto

| Item | Descrição |
|------|-----------|
| **Título do Projeto** | Marcenaria Organizada - Aplicativo Android para Gestão de Serviços de Marcenaria |
| **Disciplina** | Atividades de Extensão: Integração de Competências em Análise e Desenvolvimento de Sistemas II |
| **Eixo Temático** | Economia Sustentável |
| **ODS Principal** | ODS 8 - Trabalho Decente e Crescimento Econômico |
| **Público Beneficiado** | Pequeno marceneiro (microempresário individual) |
| **Prazo Acadêmico** | 17/11/2026 |
| **Equipe** | Desenvolvedor Android Sênior / Estudante ADS |

---

## 2. Contextualização do Problema

O marceneiro beneficiado pela ação de extensão enfrenta dificuldades significativas na organização de seus serviços:

- **Registros dispersos**: Anotações em cadernos, papéis avulsos, conversas de WhatsApp
- **Falta de centralização**: Não há um local único para consultar clientes, prazos e status
- **Risco de perdas**: Informações financeiras e de prazos podem ser perdidas ou esquecidas
- **Dificuldade de priorização**: Não consegue visualizar rapidamente quais serviços estão atrasados ou próximos do prazo
- **Ausência de backup**: Não há cópia de segurança dos dados comerciais
- **Processo manual propenso a erros**: Cálculos de valores, controle de status e acompanhamento de prazos feitos manualmente

Essa desorganização impacta diretamente a **qualidade do trabalho**, a **satisfação do cliente** e a **sustentabilidade econômica** do pequeno negócio, alinhando-se ao ODS 8 (Trabalho Decente e Crescimento Econômico).

---

## 3. Objetivos

### 3.1 Objetivo Geral

Desenvolver uma ferramenta digital móvel (Android) para centralizar e organizar os registros de serviços, clientes, prazos e status de produção de uma marcenaria, proporcionando ao marceneiro uma gestão eficiente, segura e acessível pelo celular.

### 3.2 Objetivos Específicos

1. **Cadastrar e gerenciar clientes** com nome, telefone, endereço e observações
2. **Registrar serviços/encomendas** com descrição, tipo de móvel, medidas, materiais, valores (orçado/final), prazo e status
3. **Acompanhar fluxo de produção** através de status definidos (Orçamento → Aguardando Aprovação → Aprovado → Em Produção → Finalizado → Entregue)
4. **Visualizar prazos e prioridades** com indicadores visuais para hoje, próximos 7 dias, atrasados e sem prazo
5. **Implementar busca e filtros** por cliente, móvel, status e período
6. **Garantir persistência local** com SQLite, funcionando offline
7. **Implementar backup/restauração** em JSON e exportação CSV
8. **Criar interface intuitiva** com identidade visual profissional (verde-escuro, bege, tons de madeira)
9. **Gerar APK instalável** para uso imediato no celular do marceneiro
10. **Documentar todo o processo** para avaliação acadêmica e replicabilidade

---

## 4. Justificativa

A solução atende a uma **necessidade real e específica** de um microempresário do setor moveleiro. Diferente de sistemas genéricos de ERP ou CRMs complexos, o aplicativo foi desenhado para:

- **Simplicidade**: Foco nas operações essenciais do dia a dia
- **Autonomia**: Funciona offline, sem depender de internet ou servidores
- **Baixo custo**: Gratuito, sem mensalidades ou assinaturas
- **Privacidade**: Dados ficam no dispositivo do usuário
- **Acessibilidade**: Interface otimizada para uso em celular, com áreas de toque adequadas

A ação de extensão promove a **inclusão digital** de um trabalhador autônomo, contribuindo para a **formalização e profissionalização** de seu negócio, diretamente relacionada ao ODS 8.

---

## 5. Relação com o ODS 8

| Meta do ODS 8 | Como o Projeto Contribui |
|---------------|--------------------------|
| **8.2** - Maior produtividade econômica | Organização eficiente reduz retrabalho e atrasos |
| **8.3** - Políticas de apoio a microempresas | Ferramenta gratuita e acessível para microempresário |
| **8.5** - Trabalho decente para todos | Melhora condições de trabalho do marceneiro |
| **8.10** - Acesso a serviços financeiros | Controle de orçamentos e valores facilita gestão financeira |

---

## 6. Tecnologias Utilizadas

### Frontend (Web App)
- **HTML5** - Estrutura semântica e acessível
- **CSS3** - Estilização moderna, responsiva, com variáveis CSS e design system
- **JavaScript (ES6+)** - Lógica de negócio modular, async/await, módulos ES

### Backend Local / Persistência
- **SQLite** - Banco de dados relacional local via `@capacitor-community/sqlite`
- **Capacitor** - Ponte nativa para APIs do Android (Filesystem, Share, SQLite, Preferences)

### Build & Deploy
- **Capacitor CLI** - Sincronização de assets e configuração do projeto Android
- **Gradle** (via Capacitor) - Compilação do APK Android
- **Android SDK** - Ferramentas de build e assinatura

### Desenvolvimento
- **Node.js 24+ / npm 11+** - Gerenciamento de dependências
- **OpenJDK 21** - Runtime Java para Gradle
- **Git** - Controle de versão

---

## 7. Arquitetura e Modelo de Dados

### 7.1 Arquitetura Geral

```
┌─────────────────────────────────────┐
│           Interface (UI)            │
│  Dashboard | Serviços | Clientes    │
│  Prazos | Backup | Configurações    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         Camada de Serviços          │
│  DatabaseService | ClienteModel     │
│  ServicoModel | Helpers/Utils       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│      Persistência (SQLite)          │
│  Tabelas: clientes, servicos        │
│  Índices para performance           │
└─────────────────────────────────────┘
```

### 7.2 Modelo de Dados

#### Tabela `clientes`
| Campo | Tipo | Restrições |
|-------|------|------------|
| id | TEXT | PRIMARY KEY |
| nome | TEXT | NOT NULL |
| telefone | TEXT | - |
| endereco | TEXT | - |
| observacoes | TEXT | - |
| created_at | TEXT | NOT NULL (ISO 8601) |
| updated_at | TEXT | NOT NULL (ISO 8601) |

#### Tabela `servicos`
| Campo | Tipo | Restrições |
|-------|------|------------|
| id | TEXT | PRIMARY KEY |
| cliente_id | TEXT | NOT NULL, FK → clientes(id) |
| nome | TEXT | NOT NULL |
| tipo | TEXT | - |
| descricao | TEXT | - |
| medidas | TEXT | - |
| materiais | TEXT | - |
| valor_orcado | REAL | NOT NULL DEFAULT 0 |
| valor_final | REAL | - |
| data_criacao | TEXT | NOT NULL (ISO 8601) |
| prazo_entrega | TEXT | NOT NULL (ISO 8601) |
| status | TEXT | NOT NULL DEFAULT 'orcamento' |
| observacoes | TEXT | - |
| updated_at | TEXT | NOT NULL (ISO 8601) |

#### Índices
- `idx_servicos_cliente` ON servicos(cliente_id)
- `idx_servicos_status` ON servicos(status)
- `idx_servicos_prazo` ON servicos(prazo_entrega)
- `idx_clientes_nome` ON clientes(nome)

### 7.3 Status de Serviço (Fluxo)

```
Orçamento → Aguardando Aprovação → Aprovado → Em Produção → Finalizado → Entregue
                ↓                                                                    ↓
            Cancelado ─────────────────────────────────────────────────────────────┘
```

**Regras de transição:**
- Não é possível voltar de "Entregue" ou "Cancelado"
- "Entregue" só permitido a partir de "Finalizado"
- "Cancelado" permitido de qualquer status ativo

---

## 8. Metodologia

### 8.1 Processo de Desenvolvimento

1. **Levantamento de Requisitos** - Entrevista com o marceneiro para entender fluxo de trabalho
2. **Modelagem de Dados** - Definição de entidades, relacionamentos e regras de negócio
3. **Prototipação de Interface** - Wireframes e definição de identidade visual
4. **Desenvolvimento Iterativo** - Módulos independentes (clientes, serviços, prazos, backup)
5. **Testes Contínuos** - Validação de cada funcionalidade implementada
6. **Integração e Build** - Configuração Capacitor, geração de APK
7. **Validação com Usuário** - Apresentação presencial e testes de usabilidade
8. **Documentação** - Manuais, relatórios técnicos e acadêmicos

### 8.2 Princípios de Design

- **Mobile First**: Interface nativa para Android, não "site no celular"
- **Acessibilidade**: Contraste adequado, labels semânticos, navegação por teclado
- **Performance**: Lazy loading, debounce em buscas, transições suaves
- **Segurança**: Dados locais, sem telemetria, backup criptografado opcional
- **Manutenibilidade**: Código modular, separação de responsabilidades, documentação inline

---

## 9. Cronograma

| Fase | Atividades | Período | Status |
|------|------------|---------|--------|
| **1. Inspeção e Planejamento** | Análise de ambiente, definição de arquitetura, modelo de dados | Semana 1 | ✅ Concluído |
| **2. Implementação Core** | Database service, Models (Cliente, Servico), Helpers | Semana 2 | ✅ Concluído |
| **3. Interface - Telas Principais** | Dashboard, Lista de Serviços, Cadastro/Edição de Serviços | Semana 3 | ✅ Concluído |
| **4. Interface - Clientes e Prazos** | CRUD Clientes, Tela de Prazos com abas, Filtros | Semana 4 | ✅ Concluído |
| **5. Backup e Funcionalidades Avançadas** | Export/Import JSON, Export CSV, Configurações | Semana 5 | ✅ Concluído |
| **6. Capacitor e Build Android** | Init, Sync, Configuração de plugins, Gradle | Semana 6 | ✅ Concluído |
| **7. Testes e Validação** | Testes funcionais, persistência, backup, usabilidade | Semana 7 | ⏳ Em andamento |
| **8. Documentação Final** | Manual do usuário, Relatório técnico, Doc. acadêmica | Semana 8 | ⏳ Em andamento |
| **9. Apresentação Presencial** | Demonstração ao marceneiro, treinamento, coleta de evidências | Semana 9 | ⏳ Planejado |

---

## 10. Plano de Apresentação Presencial

### 10.1 Preparação (Pré-evento)
- [ ] APK instalado no celular do marceneiro
- [ ] Dados de exemplo realistas cadastrados (3-5 clientes, 5-8 serviços)
- [ ] Backup de segurança dos dados de demonstração
- [ ] Checklist de funcionalidades a demonstrar
- [ ] Termo de autorização de imagem/voz assinado
- [ ] Formulário de feedback de usabilidade impresso

### 10.2 Roteiro da Apresentação (45-60 min)

| Tempo | Atividade |
|-------|-----------|
| 5 min | Apresentação do projeto e contextualização |
| 10 min | Demonstração guiada: Dashboard → Serviços → Clientes → Prazos |
| 10 min | Hands-on: Marceneiro cadastra um serviço real com orientação |
| 10 min | Demonstração de Backup (exportar/importar) e CSV |
| 5 min | Explicação de manutenção: como fazer backup periódico |
| 5 min | Coleta de feedback e assinatura de termo de recebimento |

### 10.3 Evidências a Coletar (Autorizadas)
- [ ] Fotos da tela do celular com o app aberto (sem dados sensíveis)
- [ ] Foto do termo de recebimento assinado
- [ ] Formulário de feedback preenchido
- [ ] Registro de data, horário e local (endereço da marcenaria)
- [ ] Print do APK instalado na gaveta de apps

### 10.4 Local da Atividade
**Endereço**: [A SER PREENCHIDO - Endereço da marcenaria do beneficiado]
**Data prevista**: [A SER AGENDADO - Entre 10/11 e 16/11/2026]

---

## 11. Critérios de Avaliação

### 11.1 Critérios Técnicos (Peso 40%)
- [ ] Aplicativo abre sem erros no Android
- [ ] CRUD completo de Clientes e Serviços funcional
- [ ] Persistência de dados verificada (fechar/abrir app, reiniciar celular)
- [ ] Backup/Restore testado com sucesso (JSON e CSV)
- [ ] Funcionamento offline confirmado
- [ ] Interface responsiva em diferentes tamanhos de tela
- [ ] APK gerado e instalável

### 11.2 Critérios de Usabilidade (Peso 30%)
- [ ] Marceneiro consegue cadastrar serviço sozinho após orientação
- [ ] Navegação intuitiva entre telas
- [ ] Feedback visual claro para ações (sucesso, erro, confirmação)
- [ ] Estados vazios orientam o usuário
- [ ] Formatação correta de moeda (R$) e data (DD/MM/AAAA)

### 11.3 Critérios Acadêmicos (Peso 30%)
- [ ] Documentação técnica completa
- [ ] Relatório de extensão com contextualização, objetivos, metodologia
- [ ] Evidências da ação presencial coletadas e autorizadas
- [ ] Relação clara com ODS 8 demonstrada
- [ ] Limitações e trabalhos futuros documentados honestamente

---

## 12. Limitações Conhecidas e Trabalhos Futuros

### Limitações da Versão 1.0
1. **Sem sincronização multi-dispositivo** - Dados ficam apenas no celular onde o app está instalado
2. **Sem notificações push** - Alertas de prazos dependem de abertura do app
3. **Sem gestão financeira completa** - Não há controle de pagamentos, recebimentos, fluxo de caixa
4. **Sem gestão de estoque** - Materiais são apenas texto livre
5. **Sem relatórios avançados** - Apenas indicadores básicos no dashboard
6. **Sem autenticação** - Qualquer pessoa com acesso ao celular vê os dados
7. **Backup manual** - Não há agendamento automático de backup

### Roadmap Futuro (v2.0+)
- [ ] Sincronização via backup na nuvem (Google Drive, OneDrive)
- [ ] Notificações locais para prazos próximos/vencidos
- [ ] Módulo financeiro: contas a receber, pagamentos, relatórios mensais
- [ ] Gestão de estoque de materiais com alertas de reposição
- [ ] Relatórios em PDF para apresentação a clientes
- [ ] Modo escuro e temas personalizáveis
- [ ] Autenticação biométrica/PIN para acesso ao app
- [ ] Publicação na Google Play Store

---

## 13. Resultados Esperados (Pós-Execução)

> **ESTA SEÇÃO DEVE SER PREENCHIDA APÓS A EXECUÇÃO DA AÇÃO DE EXTENSÃO**

| Indicador | Meta | Resultado Real |
|-----------|------|----------------|
| APK instalado e funcional | Sim | [ ] |
| Marceneiro cadastra serviço sozinho | Sim | [ ] |
| Feedback de usabilidade (1-5) | ≥ 4 | [ ] |
| Número de serviços cadastrados na demo | ≥ 1 | [ ] |
| Backup testado com sucesso | Sim | [ ] |
| Termo de recebimento assinado | Sim | [ ] |
| Evidências fotográficas coletadas | Sim | [ ] |

**Depoimento do beneficiado (se autorizado):**
> "[ESPAÇO PARA DEPOIMENTO REAL]"

**Observações do desenvolvedor:**
> "[ESPAÇO PARA OBSERVAÇÕES PÓS-EVENTO]"

---

## 14. Referências

1. Capacitor Documentation - https://capacitorjs.com/docs
2. @capacitor-community/sqlite - https://github.com/capacitor-community/sqlite
3. Material Design Guidelines - https://m3.material.io/
4. ODS 8 - ONU Brasil - https://brasil.un.org/pt-br/sdgs/8
5. Android Developers Guide - https://developer.android.com/guide
6. SQLite Documentation - https://www.sqlite.org/docs.html

---

*Documento gerado em: 23/10/2026*
*Versão: 1.0*
*Status: Em desenvolvimento - Documentação preliminar*