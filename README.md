# 🍽️ Cozinha da Nutri - API

API desenvolvida em Django + Django REST Framework para gerenciamento de alimentos, autenticação de usuários e funcionalidades relacionadas à nutrição.

---

# 🚀 Tecnologias

- Python 3.x  
- Django 6  
- Django REST Framework  
- JWT (SimpleJWT)  
- SQLite (ambiente de desenvolvimento)  

---

# 🔐 Autenticação

A API utiliza autenticação via **JWT (JSON Web Token)**.

## 🔑 Headers obrigatórios para rotas protegidas

#### Authorization: Bearer SEU_ACCESS_TOKEN


---

# 👤 USUÁRIOS

## 📌 Cadastro de usuário (Pessoa Jurídica)

### Endpoint

```POST /api/register/```


### Body
```json
{
  "razao_social": "Empresa Teste LTDA",
  "nome_fantasia": "Cozinha Teste",
  "cnpj": "12.345.678/0001-99",
  "inscricao_estadual": "12345678901234",
  "telefone": "(17) 99999-9999",
  "email": "teste@empresa.com",
  "senha": "SenhaForte123!",
  "confirmar_senha": "SenhaForte123!",
  "aceitou_termos": true,
  "recaptcha_token": "TOKEN"
}
```
### 🔐 Login
```POST /api/login/```

```
{
  "email": "teste@empresa.com",
  "senha": "SenhaForte123!",
}
```

# 👤 Usuário Logado

### Endpoint

```GET /api/Profile/```

```Delete /api/Delete/```

```Delete /api/Delete/{id}```

### Headers 

```Authorization: Bearer TOKEN_ACCESS```

## 🥗 ALIMENTOS

### 📌 Listar alimentos
```http
GET /api/alimentos/
```
```http
GET /api/alimentos/?descricao=arroz
```
### 📌 Detalhar alimento
```http
GET /api/alimentos/{id}/
```
### 📌 Criar alimento
```http
POST /api/alimentos/
```

### Body
```json
{
 "numero": 1,
  "descricao": "Arroz branco",
  "umidade": 68.0,
  "energia_kcal": 128,
  "proteina": 2.5,
  "lipideos": 1.0,
  "carboidrato": 28.0,
  "fibra_alimentar": 0.5,
  "sodio": 5,
  "Saturados": 10,
  "AG18 1t": 15,
  "AG18 2t": 13,

}
```
### 📌 Atualizar alimento
```http
PUT /api/alimentos/{id}/
```

### 📌 Deletar alimento
```http
DELETE /api/alimentos/{id}/
```
