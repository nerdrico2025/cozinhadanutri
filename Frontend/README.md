# 🍽️ Cozinha da Nutri — Frontend

Sistema web completo para nutricionistas e pequenas empresas de alimentação. Permite criar receitas com cálculo nutricional automático, gerenciar perfis empresariais e controle de acesso com autenticação forte.

---

## 🚀 Tecnologias

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React | 18.3.1 |
| Build tool | Vite | 5.4.10 |
| HTTP Client | Axios (com Interceptors) | 1.15.x |
| Estilização | Tailwind CSS | 3.4 |
| Formulários | React Hook Form | 7.x |
| Validação | Zod | 4.x |
| Ícones | Lucide React | 1.x |
| Segurança | React Google ReCAPTCHA | 3.x |

---

## ⚙️ Instalação e Execução

### 1. Clonar e Instalar

```bash
git clone <url-do-repositorio>
cd cozinhadanutri/Frontend
npm install
```

### 2. Variáveis de Ambiente (`.env`)

Crie um arquivo `.env` na raiz do diretório Frontend com:

```env
VITE_RECAPTCHA_SITE_KEY=sua_chave_publica_do_recaptcha
VITE_API_URL=http://localhost:8000
```
> **Nota:** Obtenha a chave ReCAPTCHA v2 (Caixa de seleção) no [Painel do Google](https://www.google.com/recaptcha).

### 3. Rodar a aplicação

```bash
npm run dev
# Acesse em http://localhost:5174
```

---

## 🔐 Autenticação (Sincronizada com Backend)

O sistema conta com um serviço centralizado em `src/services/auth.ts`, consumindo a API Django.

1. **HttpOnly Cookies**: O sistema utiliza o Axios parametrizado com `withCredentials: true`. Assim que o usuário loga (`POST /api/login/`), o navegador intercepta os cookies com o token JWT. Não salvamos tokens no `localStorage` por motivos de segurança (Anti-XSS).
2. **Renovação de Sessão**: O app possui interceptors globais no Axios que tratam erros `401 Unauthorized`.
3. **Formulário de Perfil Resiliente**: A página de Configuração de Perfil (`config_profile.tsx`) consome os dados assíncronos do backend e repopula os formulários perfeitamente via `useEffect` caso ocorra um Reload (F5) na página. Foi adaptada para usar verbos `PATCH`, facilitando updates parciais de dados imutáveis como CNPJ.

---

## ✉️ Fluxo de Recuperação de Senha (EmailJS)

A tela de `ForgotMyPassword.tsx` fornece uma jornada de três etapas:
1. **Request de Email**: O usuário digita o e-mail, e o frontend comunica o endpoint `/api/password-reset/request/`. **O disparo real do e-mail é feito pelo Backend**, para garantir que hackers não capturem a resposta HTTP no console contendo o código de validação.
2. **Validação do Código OTP**: Um formulário protegido verifica se o código bate com o cache temporário do servidor.
3. **Reset**: Aplicação do novo hash de senha.

---

## 🛡️ Segurança no Frontend

Todos os formulários implementam múltiplas camadas de proteção:

- **Sanitização de Entrada**: Expressões regulares purgam caracteres de controle (`\x00–\x1F`), bloqueando by-passes nos schemas Zod.
- **Prevenção de XSS**: Tags HTML são raspadas (`<[^>]*>`) em campos de texto genéricos.
- **Brute Force Alert**: No Login, após sucessivas tentativas falhas, implementamos um lock visual (30 segundos), somado ao alerta fixo de "E-mail ou Senha Inválidos".
- **ReCAPTCHA Dinâmico**: A `key` do componente ReCAPTCHA é reciclada a cada `onSubmit`, para evitar chaves de submissão presas (stale tokens).

---

## 📈 Pontos de Melhoria Futuros (Para Próximos Devs)

1. **Design System & Componentização**: O sistema atual possui muitos botões e formulários injetados inline nos componentes de Páginas (ex: `Login.tsx` e `ForgotMyPassword.tsx`). É recomendável componentizar campos como `<InputText />` e `<Button />` globais.
2. **Context API / Zustand**: A sessão atual é consultada via `auth.ts` em chamadas sob-demanda no `App.tsx`. Migrar o usuário logado para um Context Provider global facilitaria bastante a leitura de dados em componentes super-aninhados.
3. **Sistema Global de Toasts (Alertas)**: Substituir mensagens vermelhas espalhadas pelas telas por um gerenciador de Notificações, como `react-hot-toast` ou `react-toastify`, padronizando o feedback visual das APIs em todas as telas.
4. **Deploy e Variáveis de Produção**: Para build de produção, a flag do serviço Axios deverá apontar para os domínios TLS/SSL com suporte de CORS perfeitamente ajustado no backend Django.
