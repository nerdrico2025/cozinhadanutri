# Cozinha da Nutri — Frontend

Sistema web completo para nutricionistas e pequenas empresas de alimentação. Permite criar receitas com cálculo nutricional automático, gerar rótulos em conformidade com a ANVISA e gerenciar fichas técnicas de produtos.

---

## Tecnologias

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework UI | React | 18.3.1 |
| Build tool | Vite | 5.4.10 |
| Linguagem | TypeScript | 5.6.2 |
| Estilização | Tailwind CSS | 3.4 |
| Formulários | React Hook Form | 7.x |
| Validação | Zod | 4.x |
| Ícones | Lucide React | 1.x |
| CAPTCHA | React Google ReCAPTCHA | 3.x |
| PWA | vite-plugin-pwa + Workbox | 1.x / 7.x |

---

## Estrutura do Projeto

```
Frontend/
├── public/
│   ├── manifest.json        # Manifesto PWA
│   ├── favicon.png
│   ├── logo.svg
│   ├── logo_white.svg
│   ├── marmita.svg
│   ├── rotulo.svg
│   └── anvisa.svg
├── src/
│   ├── components/
│   │   ├── Header.tsx       # Navegação principal
│   │   ├── Footer.tsx       # Rodapé com links e informações LGPD
│   │   └── ForgotMyPassword.tsx  # Fluxo completo de recuperação de senha
│   ├── pages/
│   │   ├── Home.tsx         # Página inicial / landing
│   │   ├── Login.tsx        # Tela de login com carousel
│   │   └── Resgister.tsx    # Cadastro de empresa (Pessoa Jurídica)
│   ├── types/
│   │   └── index.ts         # Tipos compartilhados (UsuarioLogado, Receita, etc.)
│   ├── declarations.d.ts    # Declarações de módulos (ReCAPTCHA, virtual:pwa-register)
│   ├── App.tsx              # Roteamento hash-based e estado global de autenticação
│   ├── main.tsx             # Entry point + registro do Service Worker
│   └── index.css            # Tailwind + classes de carousel customizadas
├── vite.config.ts           # Configuração Vite + PWA plugin
├── tailwind.config.js       # Tema com cor da marca (#16a34a)
└── tsconfig.app.json
```

---

## Componentes e Páginas

### `Login.tsx`
- Carousel animado (auto-play 4s) com 3 slides: Marmita, Rótulo Nutricional, Conformidade ANVISA
- Formulário com validação de e-mail e senha via Zod
- Proteção contra brute force: bloqueio de 30 segundos após 5 tentativas
- Integração com Google ReCAPTCHA v2

### `Resgister.tsx`
- Cadastro exclusivo para Pessoa Jurídica (CNPJ)
- Campos: Razão Social, Nome Fantasia, CNPJ, Inscrição Estadual (até 14 dígitos), Telefone, E-mail, Senha
- Máscaras de entrada para CNPJ e Telefone
- Aceite de Termos de Uso + ReCAPTCHA obrigatórios
- Painel lateral com 7 cards de benefícios

### `ForgotMyPassword.tsx`
- Fluxo em 3 etapas: E-mail → Código de 6 dígitos → Nova senha → Sucesso
- Painel lateral com indicador de progresso por etapa
- Suporte a reenvio de código

### `Header.tsx`
- Navegação principal com rotas para todas as telas do sistema

### `Footer.tsx`
- Links de navegação, informações de contato e aviso LGPD

---

## Segurança

Todos os formulários implementam múltiplas camadas de proteção:

### Sanitização de entrada
- **Caracteres de controle** (`\x00–\x1F`, `\x7F`) removidos de todos os campos de texto
- **Tags HTML** removidas antes do processamento (prevenção de XSS)
- **Caracteres de injeção** (`'`, `"`, `;`, `\`, `<`, `>`, `{`, `}`, `` ` ``) bloqueados via Zod `.refine()`
- **Senhas**: apenas bytes nulos removidos — todos os demais caracteres são preservados
- Todos os campos têm limites `min` e `max` de caracteres definidos no schema

### Validação
- Toda validação passa por **Zod + React Hook Form** — não há acesso a dados brutos sem schema válido
- Os dados só chegam ao `onSubmit` após transformação e validação completa do schema
- Formulário usa `noValidate` (desativa validação nativa do browser, que pode ser bypassada)

### Proteção adicional
- **ReCAPTCHA v2** obrigatório em Login e Cadastro
- **Brute force client-side** no Login: 5 tentativas → bloqueio de 30 segundos
- **Campos de senha** com `spellCheck={false}` e `autoComplete` correto
- **Tokens CAPTCHA** resetados após cada tentativa (sucesso ou falha)

> ⚠️ A proteção client-side é complementar. A proteção real (rate limiting, validação do token ReCAPTCHA, sanitização) **deve ser implementada no backend**.

---

## PWA

O projeto é configurado como Progressive Web App:

- Pode ser instalado em dispositivos móveis e desktops
- Cache automático de assets via **Workbox** (gerado pelo `vite-plugin-pwa`)
- Manifest com nome, tema `#16a34a`, modo `standalone`
- Service Worker ativo apenas em **produção** (desativado em desenvolvimento)

---

## Requisitos

- **Node.js** v20.x (testado em v20.17.0)
- **npm** v10+

---

## Instalação e Execução

### 1. Clonar o repositório

```bash
git clone <url-do-repositorio>
cd cozinhadanutri/Frontend
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

Crie um arquivo `.env` na raiz de `Frontend/`:

```env
VITE_RECAPTCHA_SITE_KEY=sua_chave_publica_do_recaptcha
```

> Obtenha a chave em [google.com/recaptcha](https://www.google.com/recaptcha) — use **reCAPTCHA v2 (Caixa de seleção)**.

### 4. Executar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:5173`

### 5. Build de produção

```bash
npm run build
```

Os arquivos otimizados serão gerados em `dist/`. O Service Worker PWA é gerado automaticamente neste passo.

### 6. Pré-visualizar o build

```bash
npm run preview
```

### 7. Lint

```bash
npm run lint
```

---

## Variáveis de Ambiente

| Variável | Descrição | Obrigatória |
|---|---|---|
| `VITE_RECAPTCHA_SITE_KEY` | Chave pública do Google ReCAPTCHA v2 | Sim (para Login e Cadastro) |

---

## Pendências de Implementação

- [ ] `src/services/auth.ts` — integração real com API de autenticação
- [ ] Páginas: Dashboard, Receitas, Planos, FAQ, Suporte, Termos de Uso, Pagamento, Administrativo
- [ ] Backend: validação do token ReCAPTCHA, rate limiting, autenticação JWT

