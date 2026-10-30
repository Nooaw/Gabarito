# Marcenaria Organizada

Aplicativo Android para gestão de serviços de marcenaria, desenvolvido como atividade de extensão acadêmica (ADS II) com foco no ODS 8 - Trabalho Decente e Crescimento Econômico.

## 🎯 Objetivo

Ferramenta digital offline para pequeno marceneiro organizar:
- **Clientes** (nome, telefone, endereço, observações)
- **Serviços/Encomendas** (móvel, tipo, medidas, materiais, valores, prazos, status)
- **Acompanhamento de produção** (fluxo: Orçamento → Aguardando → Aprovado → Produção → Finalizado → Entregue)
- **Prazos e prioridades** (hoje, 7 dias, atrasados, sem prazo, aguardando entrega)
- **Backup/Restore** (JSON completo + CSV para planilhas)

## 🛠️ Tecnologias

| Camada | Tecnologia |
|--------|------------|
| Frontend | HTML5, CSS3 (Design System), JavaScript ES6+ (Módulos) |
| Persistência | SQLite via `@capacitor-community/sqlite` |
| Native Bridge | Capacitor 6 (Filesystem, Share, Preferences, SQLite) |
| Build | Gradle (via Capacitor/Android Studio) |
| Runtime | Android 7+ (API 24+) |

## 📱 Funcionalidades

### Dashboard
- 6 indicadores em tempo real (Total, Em Produção, Aguardando, Finalizados, Próximos, Atrasados)
- Ações rápidas para navegação

### Clientes
- CRUD completo com validação
- Busca por nome/telefone/endereço
- Visualização de serviços vinculados
- Exclusão segura (bloqueia se houver serviços)

### Serviços
- Cadastro completo (15 campos, 5 obrigatórios)
- 8 tipos de móveis pré-definidos + "Outro"
- Fluxo de status controlado (7 estados)
- Filtros combinados (status + prazo + busca)
- Histórico de alterações de status

### Prazos
- 5 abas: Hoje, Próximos 7 dias, Atrasados, Sem prazo, Aguardando entrega
- Cores visuais por urgência
- Toque abre detalhes completos

### Backup
- **Exportar JSON** - Backup completo restaurável (via Share API)
- **Exportar CSV** - Duas abas (Clientes, Serviços) para Excel/Sheets
- **Importar JSON** - Restauração com validação e confirmação
- Proteção contra perda acidental de dados

## 🚀 Build e Instalação

### Pré-requisitos
- Node.js 20+ / npm 10+
- Java JDK 21
- Android Studio (SDK 34)
- Android SDK configurado (`ANDROID_HOME`)

### Comandos
```bash
# Instalar dependências
npm install --legacy-peer-deps

# Sincronizar com Android
npx cap sync android

# Build Debug (testes)
cd android && ./gradlew assembleDebug
# APK em: android/app/build/outputs/apk/debug/app-debug.apk

# Build Release (distribuição)
cd android && ./gradlew assembleRelease
# Requer keystore configurado
```

### Instalação no Celular
1. Transfira `app-debug.apk` para o celular
2. Permita "Instalar apps desconhecidos" para seu gerenciador de arquivos
3. Toque no APK → Instalar → Abrir

## 📁 Estrutura do Projeto

```
marcenaria-organizada/
├── src/                    # App Web (HTML/CSS/JS)
│   ├── index.html
│   ├── css/               # Design System (5 arquivos)
│   ├── js/
│   │   ├── app.js         # Controlador principal
│   │   ├── models/        # Cliente, Servico
│   │   ├── services/      # Database (SQLite)
│   │   ├── utils/         # Helpers (moeda, data, validação)
│   │   └── views/         # Renderização de cards
│   └── assets/icons/
├── android/               # Projeto Capacitor/Android
├── capacitor.config.json
├── package.json
├── DOCUMENTACAO_ACADEMICA.md
├── MANUAL_USUARIO.md
└── INSTRUCOES_BUILD.md
```

## ✅ Checklist de Testes

- [ ] App abre sem crash
- [ ] CRUD Clientes e Serviços funcional
- [ ] Persistência após fechar/reabrir/reiniciar
- [ ] Filtros e busca funcionam
- [ ] Backup JSON exporta/importa corretamente
- [ ] CSV abre no Excel/Google Sheets
- [ ] Funciona 100% offline
- [ ] APK instala e roda em dispositivo físico

## 📚 Documentação

| Arquivo | Descrição |
|---------|-----------|
| `DOCUMENTACAO_ACADEMICA.md` | Relatório técnico-acadêmico completo |
| `MANUAL_USUARIO.md` | Manual do usuário final (marceneiro) |
| `INSTRUCOES_BUILD.md` | Guia completo de build e troubleshooting |

## 🎓 Contexto Acadêmico

- **Disciplina**: Atividades de Extensão: Integração de Competências em ADS II
- **Eixo**: Economia Sustentável
- **ODS**: 8 - Trabalho Decente e Crescimento Econômico
- **Público**: Microempresário (marceneiro)
- **Prazo**: 17/11/2026

## ⚠️ Limitações Conhecidas (v1.0)

- Sem sincronização multi-dispositivo
- Sem notificações push
- Sem gestão financeira completa (pagamentos, fluxo de caixa)
- Sem gestão de estoque
- Backup manual (não agendado)
- Sem autenticação/biometria

## 🔮 Roadmap

- [ ] Sincronização na nuvem (Google Drive/OneDrive)
- [ ] Notificações locais de prazos
- [ ] Módulo financeiro (contas a receber, relatórios)
- [ ] Gestão de estoque de materiais
- [ ] Relatórios em PDF
- [ ] Publicação na Google Play Store

## 📄 Licença

Desenvolvido para fins acadêmicos e uso do beneficiado da extensão. Uso livre para fins educacionais e não-comerciais.

---

**Desenvolvido com ❤️ para a extensão universitária e o fortalecimento do trabalho decente.**