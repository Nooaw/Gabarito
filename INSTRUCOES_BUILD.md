# Instruções de Build - Marcenaria Organizada

**Versão 1.0** | **Geração de APK Android**

---

## 1. Pré-requisitos do Ambiente

### 1.1 Software Necessário
| Ferramenta | Versão Mínima | Download |
|------------|---------------|----------|
| **Node.js** | 18+ (recomendado 20+) | https://nodejs.org |
| **npm** | 9+ (vem com Node.js) | - |
| **Java JDK** | 17+ (recomendado 21) | https://adoptium.net |
| **Android Studio** | 2023.1+ (Koala+) | https://developer.android.com/studio |
| **Android SDK** | API 34 (Android 14) | Via Android Studio |
| **Git** | 2.30+ | https://git-scm.com |

### 1.2 Verificação Rápida
```bash
node --version    # v20.x.x
npm --version     # 10.x.x
java --version    # 21.x.x
adb --version     # Android Debug Bridge
```

---

## 2. Configuração do Projeto

### 2.1 Clonar/Extrair o Projeto
```bash
# Se tiver repositório Git
git clone <url-do-repo> marcenaria-organizada
cd marcenaria-organizada

# Ou extraia o ZIP em uma pasta
cd marcenaria-organizada
```

### 2.2 Instalar Dependências
```bash
npm install --legacy-peer-deps
```
> **Nota**: `--legacy-peer-deps` é necessário devido à compatibilidade entre Capacitor 6 e @capacitor-community/sqlite 5.

### 2.3 Verificar capacitor.config.json
O arquivo já está configurado com:
- `appId`: `com.marcenaria.organizada`
- `appName`: `Marcenaria Organizada`
- `webDir`: `src`
- Plugins: Filesystem, Share, Preferences, SQLite

---

## 3. Configuração do Android

### 3.1 Android Studio
1. Abra o Android Studio
2. **More Actions → SDK Manager**
3. Aba **SDK Platforms**: Marque **Android 14 (API 34)** e **Android 13 (API 33)**
4. Aba **SDK Tools**: Marque:
   - Android SDK Build-Tools 34
   - Android SDK Command-line Tools
   - Android SDK Platform-Tools
   - Android Emulator (opcional)
   - Google Play Services (opcional)
5. **Apply → OK** e aguarde download

### 3.2 Variáveis de Ambiente (Windows PowerShell)
```powershell
# Adicione ao perfil do PowerShell ($PROFILE)
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"
$env:PATH += ";$env:ANDROID_HOME\cmdline-tools\latest\bin"
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-21.x.x-hotspot"  # Ajuste conforme instalação
```

### 3.3 Verificar SDK
```bash
adb devices
sdkmanager --version
```

---

## 4. Build do APK

### 4.1 Sincronizar Assets Web com Android
```bash
npx cap sync android
```
Isso copia os arquivos de `src/` para `android/app/src/main/assets/public/` e atualiza plugins nativos.

### 4.2 Build Debug (Para Testes)
```bash
cd android
./gradlew assembleDebug
```
- **Tempo**: 2-5 minutos (primeira vez mais lento)
- **Saída**: `android/app/build/outputs/apk/debug/app-debug.apk`

### 4.3 Build Release (Para Distribuição)
```bash
cd android
./gradlew assembleRelease
```
> **Requer**: Keystore configurado no `build.gradle` ou `local.properties`

#### Configurar Keystore (Release)
1. Gere keystore:
```bash
keytool -genkey -v -keystore release.keystore -alias marcenaria -keyalg RSA -keysize 2048 -validity 10000
```
2. Crie `android/keystore.properties` (NÃO COMITE!):
```properties
storeFile=../release.keystore
storePassword=sua_senha
keyAlias=marcenaria
keyPassword=sua_senha
```
3. Em `android/app/build.gradle`, adicione antes de `android {`:
```gradle
def keystorePropsFile = rootProject.file("keystore.properties")
if (keystorePropsFile.exists()) {
    def keystoreProps = new Properties()
    keystoreProps.load(new FileInputStream(keystorePropsFile))

    android {
        signingConfigs {
            release {
                keyAlias keystoreProps['keyAlias']
                keyPassword keystoreProps['keyPassword']
                storeFile file(keystoreProps['storeFile'])
                storePassword keystoreProps['storePassword']
            }
        }
        buildTypes {
            release {
                signingConfig signingConfigs.release
                minifyEnabled false
                proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
            }
        }
    }
}
```

---

## 5. Instalação e Testes

### 5.1 Instalar no Dispositivo/Emulador
```bash
# Via ADB (debug)
cd android
./gradlew installDebug

# Ou instale o APK manualmente
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### 5.2 Testes Obrigatórios Checklist

#### Interface
- [ ] App abre sem crash
- [ ] Navegação entre 5 abas funciona
- [ ] Dashboard carrega indicadores
- [ ] Formulários abrem e salvam
- [ ] Teclado virtual não cobre campos
- [ ] Responsivo em diferentes tamanhos

#### Clientes
- [ ] Cadastrar cliente com todos os campos
- [ ] Editar cliente existente
- [ ] Buscar por nome
- [ ] Ver detalhes + serviços vinculados
- [ ] Excluir cliente sem serviços
- [ ] Bloquear exclusão com serviços vinculados

#### Serviços
- [ ] Cadastrar serviço completo
- [ ] Editar serviço
- [ ] Alterar status via dropdown
- [ ] Filtrar por status
- [ ] Filtrar por prazo (hoje, 7 dias, atrasados)
- [ ] Buscar por cliente/móvel/descrição
- [ ] Validar campos obrigatórios
- [ ] Valores monetários salvos corretamente

#### Persistência
- [ ] Fechar app → Abrir → Dados mantidos
- [ ] Reiniciar celular → Dados mantidos
- [ ] Atualizar app (reinstalar APK) → Dados mantidos

#### Backup
- [ ] Exportar JSON → Arquivo válido
- [ ] Exportar CSV → Abre no Excel/Sheets
- [ ] Importar JSON → Dados restaurados
- [ ] Importar JSON inválido → Erro amigável
- [ ] Importar versão incompatível → Erro amigável
- [ ] Dados não perdidos em falha de importação

#### Android
- [ ] APK instala sem erro
- [ ] Permissão de armazenamento solicitada
- [ ] Funciona 100% offline
- [ ] Logcat sem erros críticos

---

## 6. Estrutura de Arquivos Gerados

```
marcenaria-organizada/
├── src/                          # Código web (HTML/CSS/JS)
│   ├── index.html
│   ├── css/
│   │   ├── variables.css
│   │   ├── reset.css
│   │   ├── components.css
│   │   ├── screens.css
│   │   └── app.css
│   ├── js/
│   │   ├── app.js
│   │   ├── models/
│   │   │   ├── Cliente.js
│   │   │   └── Servico.js
│   │   ├── services/
│   │   │   └── database.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   └── views/
│   │       └── cards.js
│   └── assets/
│       └── icons/
├── android/                      # Projeto Android (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/public/   # Cópia dos assets web
│   │   │   ├── java/.../MainActivity.java
│   │   │   ├── res/
│   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   ├── settings.gradle
│   └── gradle.properties
├── capacitor.config.json
├── package.json
├── package-lock.json
├── DOCUMENTACAO_ACADEMICA.md
├── MANUAL_USUARIO.md
└── INSTRUCOES_BUILD.md (este arquivo)
```

---

## 7. Solução de Problemas Comuns

### 7.1 Erro: "SDK location not found"
```bash
# Configure ANDROID_HOME ou crie local.properties em android/
echo "sdk.dir=$HOME/Library/Android/sdk" > android/local.properties  # Mac/Linux
echo "sdk.dir=%LOCALAPPDATA%\\Android\\Sdk" > android/local.properties  # Windows
```

### 7.2 Erro: "Could not find com.android.tools.build:gradle:8.x.x"
- Atualize Android Studio
- No `android/build.gradle`, use versão compatível:
```gradle
dependencies {
    classpath 'com.android.tools.build:gradle:8.1.4'
}
```

### 7.3 Erro: "Capacitor plugin not found" / SQLite não funciona
```bash
# Reinstale plugins e sincronize
npm install @capacitor-community/sqlite@5 --legacy-peer-deps
npx cap sync android
```

### 7.4 Erro: "Duplicate class" / "Manifest merger failed"
- Verifique `android/app/src/main/AndroidManifest.xml` para duplicatas
- Remova permissões duplicadas

### 7.5 Build lento / Falha de memória
```bash
# Em android/gradle.properties
org.gradle.jvmargs=-Xmx4096m -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.daemon=true
```

### 7.6 App crash ao abrir (SQLite)
- Verifique se `@capacitor-community/sqlite` está em `package.json`
- Rode `npx cap sync android` após qualquer mudança de plugin
- No Android 14+, pode precisar de `android:allowBackup="false"` no Manifest se houver conflito

---

## 8. Comandos Úteis

```bash
# Desenvolvimento
npm run dev                    # Servidor local em http://localhost:3000
npx cap open android          # Abre projeto no Android Studio

# Build
npx cap sync android          # Sincroniza web → android
cd android && ./gradlew clean assembleDebug  # Build limpo
cd android && ./gradlew installDebug        # Build + install

# Debug
adb logcat | grep -i "marcenaria\|capacitor\|sqlite"  # Logs filtrados
adb shell pm list packages | grep marcenaria          # Verifica instalação

# Limpeza
cd android && ./gradlew clean
rm -rf android/app/build
rm -rf node_modules && npm install --legacy-peer-deps
```

---

## 9. Versionamento e Release

### 9.1 Atualizar Versão
1. Edite `package.json`: `"version": "1.0.1"`
2. Edite `capacitor.config.json` se necessário
3. No `android/app/build.gradle`:
```gradle
defaultConfig {
    versionCode 2  # Incrementar a cada release
    versionName "1.0.1"
}
```

### 9.2 Checklist de Release
- [ ] Testes completos passam
- [ ] VersionCode incrementado
- [ ] Build release assinado gerado
- [ ] APK testado em dispositivo físico
- [ ] Manual do usuário atualizado se necessário
- [ ] CHANGELOG.md atualizado

---

## 10. Suporte e Contato

Para dúvidas sobre o build:
- Verifique logs: `adb logcat *:E` (apenas erros)
- Consulte `android/app/build/reports/` para relatórios de build
- Documentação Capacitor: https://capacitorjs.com/docs/android
- Documentação SQLite Plugin: https://github.com/capacitor-community/sqlite

---

**Última atualização**: 23/10/2026
**Versão do documento**: 1.0
**Compatível com**: Capacitor 6.x, Android SDK 34, Node.js 20+