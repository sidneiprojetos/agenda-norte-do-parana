# Agenda Norte do Paraná — Insanos Moto Clube Brasil

Aplicativo oficial de gerenciamento e compartilhamento de datas, eventos, reuniões e passeios da divisão **Norte do Paraná** do **Insanos MC**.

## 🛠 Tecnologias
- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS**
- **Firebase Firestore** (Banco de dados em tempo real)
- **Firebase Authentication** (Login exclusivo com Google/Gmail e controle de aprovações)
- **Lucide Icons** & **Motion**

---

## 🔒 Segurança e Dados no Firebase
- **100% dos dados são persistidos no Firebase Firestore**:
  - Coleção `notes`: Armazena todos os eventos, reuniões, datas, horários e locais compartilhados.
  - Coleção `users`: Armazena os perfis cadastrados, controle de aprovação (`pending`, `approved`, `rejected`) e papéis (`admin`, `member`).
- **Autenticação Obrigatória**: Acesso bloqueado até a autenticação com Google.
- **Aprovação de Membros**: O Administrador Master (`imc.sidnei@gmail.com`) gerencia quem pode acessar o sistema através do Painel de Gestão de Usuários.

---

## 🚀 Como Publicar no GitHub e Vercel

### Passo 1: Enviar para o GitHub
No terminal, na raiz do projeto:
1. `git init` (apenas na primeira vez) e adicione os arquivos: `git add -A`
2. Crie o commit: `git commit -m "Sua mensagem"`
3. Vincule o repositório remoto: `git remote add origin https://github.com/seu-usuario/agenda-norte-do-parana.git` (apenas na primeira vez)
4. Envie o código: `git push -u origin main`

### Passo 2: Publicar na Vercel
1. Acesse o painel da [Vercel](https://vercel.com/) com sua conta.
2. Clique em **"Add New..." -> "Project"**.
3. Selecione o repositório `agenda-norte-do-parana` que você acabou de enviar pelo git.
4. As configurações de compilação já estão prontas no arquivo `vercel.json`:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Clique em **"Deploy"**.

### Passo 3: Autorizar o Domínio da Vercel no Firebase
Para que o login com o Google funcione no seu endereço da Vercel:
1. Acesse o [Console do Firebase](https://console.firebase.google.com/).
2. Abra o seu projeto Firebase.
3. Vá em **Authentication** -> aba **Settings** (Configurações) -> **Authorized domains** (Domínios autorizados).
4. Clique em **Add domain** e adicione o domínio gerado pela Vercel (ex: `agenda-norte-do-parana.vercel.app` ou `vercel.app`).
