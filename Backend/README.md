# 🍽️ Cozinha da Nutri - Backend API

API robusta desenvolvida em Django e Django REST Framework para gerenciamento de alimentos, autenticação segura (HttpOnly Cookies) e rotinas de segurança.

---

## 🚀 Tecnologias e Ferramentas

- **Python 3.x**
- **Django 6**
- **Django REST Framework (DRF)**
- **JWT (SimpleJWT)** com armazenamento em **HttpOnly Cookies**
- **SQLite** (ambiente de desenvolvimento)
- Integração nativa via **urllib** (sem dependências extras como `requests`) com **EmailJS** e **ReCAPTCHA**.

---

## ⚙️ Instalação e Execução

### 1. Clonar e Instalar
```bash
git clone <url-do-repositorio>
cd cozinhadanutri/Backend
python -m venv venv

# Ativar ambiente virtual (Windows)
.\venv\Scripts\activate
# Ativar ambiente virtual (Linux/Mac)
source venv/bin/activate

pip install -r requirements.txt
```

### 2. Configurar Variáveis de Ambiente (`.env`)
Na raiz do projeto `Backend/`, crie um arquivo `.env` com as seguintes chaves. O projeto possui um leitor nativo de `.env` configurado em `settings.py` que remove espaços e comentários inline automaticamente.

```env
# EmailJS - Necessário para recuperação de senhas
EMAILJS_SERVICE_ID=service_xxxxx
EMAILJS_TEMPLATE_ID=template_xxxxx
EMAILJS_PUBLIC_KEY=xxxxxx
EMAILJS_PRIVATE_KEY=xxxxxx  # Obrigatório para disparos via REST API do Backend

# Opcional: Secret Key do ReCAPTCHA para validação
RECAPTCHA_SECRET_KEY=xxxxxx
```

### 3. Migrações e Servidor
```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

---

## 🔐 Autenticação e Segurança

A API agora trabalha com um modelo mais seguro de tokens, mitigando ataques XSS.

- **Login via HttpOnly Cookies**: O endpoint `/api/login/` devolve os tokens `access_token` e `refresh_token` diretamente em cookies inacessíveis via JavaScript (HttpOnly).
- **Update Parcial de Perfil**: O endpoint de Perfil aceita requisições `PATCH`, ignorando campos imutáveis como o `CNPJ`.

---

## 📧 Integração com EmailJS (Esqueci minha Senha)

O fluxo de **Esqueci Minha Senha** foi arquitetado 100% no Backend para evitar roubo de códigos OTP interceptados pelo navegador. O código de 6 dígitos gerado fica armazenado no **Cache na memória do Django** por 15 minutos.

### ⚠️ Configuração Crítica do EmailJS para Desenvolvedores
O EmailJS, por padrão, bloqueia requisições disparadas por servidores. Para que o disparo funcione a partir do Django, **são exigidos dois passos**:

1. Acesse: [Security Settings no EmailJS](https://dashboard.emailjs.com/admin/account/security)
2. Marque a opção: **"Allow EmailJS API for non-browser applications"**.
3. *Nota Técnica:* O código backend já faz injeção de header `User-Agent: Mozilla/5.0` nas requisições HTTP (`urllib`) para dar bypass nos bloqueios de bot (Erro 1010) da Cloudflare do próprio EmailJS. O `EMAILJS_PRIVATE_KEY` é repassado no payload como `accessToken`.

### Endpoints do Fluxo:
- `POST /api/password-reset/request/` (Gera código de 6 dígitos no Cache e dispara EmailJS)
  - *Obs:* Este endpoint possui técnica de Anti-Enumeração. Retorna Status 200 independente do usuário existir ou não, mas só processa o envio internamente se for válido.
- `POST /api/password-reset/validate/` (Compara código enviado com o código no Cache)
- `POST /api/password-reset/confirm/` (Salva a nova senha)

---

## 📌 Principais Endpoints

### 👤 Usuários e Autenticação
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/register/` | Criação de Pessoa Jurídica |
| `POST` | `/api/login/` | Autenticação (Seta os HttpOnly Cookies) |
| `POST` | `/api/logout/` | Deleta os cookies de sessão |
| `GET`/`PATCH` | `/api/profile/` | Consulta e atualização parcial do perfil (Requer Cookie Auth) |

### 🥗 Alimentos
| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/alimentos/` | Lista alimentos (suporta query `?descricao=`) |
| `POST` | `/api/alimentos/` | Cria novo alimento |

---

## 📈 Pontos de Melhoria Futuros (Para Próximos Devs)

1. **Implementar Validação do ReCAPTCHA no Backend**: O Frontend já envia o `recaptcha_token` no login/cadastro. É preciso criar um validador no Django consumindo a API oficial do Google (`https://www.google.com/recaptcha/api/siteverify`).
2. **Troca do Cache**: O Cache em memória atual (`LocMemCache`) serve bem para testes. Para escalabilidade em produção com multi-instâncias (ex: Gunicorn com múltiplos workers), trocar para o backend Redis (`django-redis`).
3. **Rate Limiting (DRF Throttling)**: Colocar limite de requisições nos endpoints de `/api/password-reset/` e `/api/login/` para barrar ataques de força bruta.
4. **HTTPS Cookies**: Em ambiente de Produção, a flag `secure=False` configurada nos tokens no arquivo `usuarios/views.py` deve ser alterada para `secure=True`.
5. **Fila de Tarefas Assíncronas (Celery/RQ)**: O envio de e-mails usando EmailJS atualmente bloqueia a thread síncrona. Seria ideal despachar a requisição do `urllib` para uma fila assíncrona.
