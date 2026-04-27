# Guia de Deploy no Hostinger EasyPanel (Via GitHub - Automático)

O projeto agora está conectado ao seu repositório GitHub, o que permite que cada vez que você fizer um `git push`, o EasyPanel atualize o site automaticamente.

## 1. Configurando no EasyPanel

1. Acesse o painel do seu projeto no **EasyPanel**.
2. Clique em **"Add New Project"** e depois em **"Add New Service"**.
3. Selecione a opção **"App"**.
4. Na aba **"Source"**, selecione a opção **"GitHub"**.
5. Conecte sua conta e selecione o repositório: `mbbuenno-0510/Trial_eab_antigravity`.
6. Defina a Branch como `main`.

## 2. Configurando o Build e Variáveis

1. Na seção **"Build"**, certifique-se de que a opção selecionada seja **"Dockerfile"**. (O EasyPanel lerá o arquivo `Dockerfile` que já enviamos para o GitHub).
2. Vá até a aba **"Environment"** e adicione as variáveis de ambiente necessárias (Copie os valores do seu arquivo `.env` local):
   ```env
   GEMINI_API_KEY=...
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   VITE_FIREBASE_FIRESTORE_DATABASE_ID=...
   ```
3. Na aba **"Domains"**, o EasyPanel deve detectar a porta **80** automaticamente.
4. Clique em **"Deploy"**.

## Benefícios desta configuração:
*   **Atualização Automática**: Qualquer melhoria que eu fizer no código e você enviar para o GitHub será refletida no site em poucos minutos.
*   **Segurança**: O arquivo `.env` está no seu `.gitignore`, então suas chaves nunca ficarão expostas no GitHub público, apenas no ambiente seguro do EasyPanel.
*   **PWA Integrado**: O suporte para instalação em Android e iPhone já está configurado e funcionará assim que o domínio tiver HTTPS ativo.
