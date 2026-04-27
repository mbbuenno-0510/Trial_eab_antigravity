# Guia de Deploy no Hostinger EasyPanel (Via Upload de Pasta/Zip)

Este projeto foi configurado para ser publicado no EasyPanel da Hostinger. Embora o uso do GitHub seja o método recomendado para automação, você pode realizar o deploy via upload direto de uma pasta compactada (Zip).

## 1. O que incluir no arquivo ZIP?

Para que o deploy funcione corretamente e o arquivo não fique excessivamente pesado, você deve selecionar **apenas** os arquivos e pastas abaixo para criar o seu `.zip`:

### ✅ O QUE INCLUIR:
- `components/` (Incluindo o novo `PWAInstallHint.tsx`), `hooks/`, `public/`, `services/` (Pastas de código)
- `App.tsx`, `Auth.tsx`, `index.tsx`, `types.ts` (Arquivos fonte)
- `index.html`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts` (Configurações Vite/Node)
- `firebase.json`, `firestore.rules`, `storage.rules`, `firebase-applet-config.json` (Configurações Firebase)
- `Dockerfile`, `nginx.conf` (Obrigatórios para o Deploy)

### ❌ O QUE NÃO INCLUIR (IGNORE):
- `node_modules/` (Isso será instalado pelo servidor)
- `dist/` (Isso será gerado pelo servidor)
- `.git/`
- `.env` (As variáveis de ambiente devem ser configuradas no painel do EasyPanel)

---

## 2. Configurando no EasyPanel

1. Acesse o painel do seu projeto no **EasyPanel**.
2. Clique em **"Add New Project"** e depois em **"Add New Service"**.
3. Selecione a opção **"App"**.
4. Na aba **"Source"**, selecione a opção **"Upload"**.
5. Clique para selecionar ou arraste o seu arquivo `.zip` criado no passo anterior.
6. Clique em **"Upload"**.

## 3. Configurando o Build e Variáveis

1. Na seção **"Build"**, selecione **"Dockerfile"**.
2. Vá até a aba **"Environment"** e adicione as variáveis necessárias:
   ```env
   GEMINI_API_KEY=sua_chave_aqui
   VITE_FIREBASE_API_KEY=sua_chave_aqui
   VITE_FIREBASE_AUTH_DOMAIN=seu_dominio.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=seu_project_id
   VITE_FIREBASE_STORAGE_BUCKET=seu_bucket.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=seu_sender_id
   VITE_FIREBASE_APP_ID=seu_app_id
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=seu_database_id
   ```
3. Na aba **"Domains"**, verifique se a porta configurada é a **80**.
4. Clique em **"Deploy"**.

## Por que usar o Dockerfile no Upload?
O `Dockerfile` que preparei garante que o EasyPanel instale as dependências corretas e configure o servidor Nginx automaticamente, sem que você precise configurar o ambiente manualmente no servidor da Hostinger.
