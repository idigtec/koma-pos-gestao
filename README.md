# POS OMNICHANNEL MANAGEMENT SYSTEM

Sistema Profissional de Gestão Comercial, Restauração, Fast-Food, Takeaway, Cafetaria, Estoque, Financeiro, Cozinha (KDS) e PWA.

---

## 1. Princípio "One Source of Truth" (Arquitetura Centralizada)

```text
                 ┌──────────────┐
                 │  Database    │ (PostgreSQL / Firestore)
                 └──────┬───────┘
                        │
             ┌──────────┴──────────┐
             │                     │
         Backend API           WebSocket
             │                     │
       ┌─────┴─────────┐           │
       │               │           │
      POS              KDS      Dashboard
       │
 ┌─────┼─────────┬─────────┐
 │     │         │         │
Kiosk Mobile   Online   Delivery
```

Todos os canais de venda compartilham a mesma fonte de dados única:
- **Catálogo & Produtos**: Itens de varejo, pratos preparados, combos e bebidas.
- **Preços & Disponibilidade**: Status em tempo real (Disponível, Esgotado, Fora de Estoque).
- **Ingredientes & Receitas**: Fichas técnicas com dedução automática no estoque.
- **Modificadores**: Modificadores padrão (sem cebola, sem tomate, extra queijo, etc.).
- **Clientes & Caixa**: Sessões ativas de caixa e histórico de clientes.

---

## 2. Modos de Negócio Suportados

Configurado via variável `BUSINESS_TYPE`:
- `RETAIL` (Varejo / Pequeno Comércio)
- `RESTAURANT` (Restaurante com Mesas)
- `FAST_FOOD` (Atendimento rápido e balcão)
- `TAKEAWAY` (Retirada e embalagem rápida)
- `CAFE` (Cafetaria e padaria)
- `HYBRID` (Combinação de produtos de prateleira + produtos preparados)

---

## 3. Stack Tecnológica

### Frontend
- **React 19 + TypeScript Strict**
- **Vite 8 + `@tailwindcss/vite`**
- **Tailwind CSS 4** com tokens de design (`@theme`)
- **PWA (Progressive Web App)**: Manifest webmanifest, Service Worker com offline shell cache, ícones 192px/512px e hook de instalação nativa
- **Lucide React & Canvas Confetti & jsPDF**

### Backend & API
- **Node.js 22 + TypeScript (tsx)**
- **Express.js** rodando na porta `3000`
- **Endpoints de Saúde & Observabilidade**:
  - `GET /api/health` — Status de saúde, uptime e persistência
  - `GET /api/ready` — Status dos canais omnichannel
  - `GET /api/info` — Versão do sistema e arquitetura

### Persistência
- **Google Cloud Firestore Database** (`ai-studio-b0af4ac3-249f-4fb7-81e7-e2f78a56a60e`)
- **PostgreSQL Ready**: Schemas relacionais e suporte a container Docker (`docker-compose.yml`)

---

## 4. Design System & Modos de Visualização

- **Tokens de Tema**: `--color-primary`, `--color-success`, `--color-warning`, `--color-danger`, `--color-surface`, `--color-background`, `--color-text`, `--radius-card`, `--spacing-touch`.
- **Modo Touch (`touch-mode`)**: Otimizado para telas sensíveis ao toque, botões com altura mínima de 48px, cards ampliados e toque rápido.
- **Modo Compacto (`compact-mode`)**: Otimizado para desktop, mouse e teclado para máxima densidade de dados na tela.

---

## 5. Como Executar

### Desenvolvimento Local:
```bash
npm install
npm run dev
```
Acesse `http://localhost:3000`.

### Healthcheck & Auth API:
```bash
# Health & Status
curl http://localhost:3000/api/health
curl http://localhost:3000/api/ready

# Login com JWT
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Listar papéis e permissões
curl http://localhost:3000/api/roles

# Catálogo e Produtos (Fase 2)
curl http://localhost:3000/api/categories
curl http://localhost:3000/api/products
curl -X PATCH http://localhost:3000/api/products/prod-burger-classico/toggle-86 \
  -H "Content-Type: application/json" \
  -d '{"is86":true,"reason":"Falta de pão brioche"}'

# Insumos, Fichas Técnicas & Modificadores (Fase 3)
curl http://localhost:3000/api/ingredients
curl -X PATCH http://localhost:3000/api/ingredients/ing-bacon/toggle-86 \
  -H "Content-Type: application/json" \
  -d '{"isAvailable":false}'
curl http://localhost:3000/api/products/prod-burger-classico/recipe
curl http://localhost:3000/api/products/prod-burger-classico/modifiers

# Armazéns, Kardex & Inventário (Fase 4)
curl http://localhost:3000/api/warehouses
curl http://localhost:3000/api/stock/valuation
curl http://localhost:3000/api/stock/movements
curl -X POST http://localhost:3000/api/stock/movements \
  -H "Content-Type: application/json" \
  -d '{"itemType":"ingredient","id":"ing-carne","type":"entry","quantity":50,"costPerUnit":70,"documentRef":"FAT-2026/991","reason":"Recebimento semanal carnes","warehouseId":"wh-central"}'
curl http://localhost:3000/api/stock/audits

# KDS, Cozinha & Expedição (Fase 7)
curl http://localhost:3000/api/kitchen/orders
curl -X PATCH http://localhost:3000/api/kitchen/orders/kds-01/status \
  -H "Content-Type: application/json" \
  -d '{"status":"pronto"}'

# Compras & Fornecedores (Fase 8)
curl http://localhost:3000/api/purchases/suppliers
curl http://localhost:3000/api/purchases/orders

# Delivery & Entregas (Fase 11)
curl http://localhost:3000/api/delivery/zones
curl http://localhost:3000/api/delivery/orders

# Clientes, Fidelidade & Promoções (Fase 10)
curl http://localhost:3000/api/customers
curl http://localhost:3000/api/loyalty/promotions

# Multi-Loja / Filiais (Fase 13)
curl http://localhost:3000/api/stores
```

### Perfis Padrão para Testes (RBAC & Acesso):
1. **Administrador**: `admin` / `admin123` *(Carlos Alberto Macamo — Acesso Total)*
2. **Gerente**: `gerente` / `gerente123` *(Ana Paula Mondlane — Supervisão & Estoque)*
3. **Operador de Caixa**: `caixa` / `caixa123` *(João Baptista Sitoe — Frente de Caixa / PDV)*
4. **Cozinha**: `cozinha` / `cozinha123` *(Mateus Nhantumbo — Painel KDS & Preparo)*
5. **Estoque**: `estoque` / `estoque123` *(Fátima Tembe — Almoxarifado & Insumos)*
6. **Financeiro**: `financeiro` / `financeiro123` *(Delfina Langa — Fluxo de Caixa & DRE)*

---

### Docker:
```bash
docker-compose up --build
```

---

## 6. Roteiro de Metodologia por Fases

- [x] **FASE 0 — Auditoria e Arquitetura** *(Concluída)*
- [x] **FASE 1 — Autenticação + Usuários (RBAC & JWT)** *(Concluída)*
- [x] **FASE 2 — Catálogo + Produtos Visuais** *(Concluída)*
- [x] **FASE 3 — Ingredientes + Receitas + Modificadores** *(Concluída)*
- [x] **FASE 4 — Estoque Profissional (Movimentos, Armazéns, Fichas)** *(Concluída)*
- [x] **FASE 5 — POS Touch + Pedidos (Mesas, Opções de Consumo, Descontos)** *(Concluída)*
- [x] **FASE 6 — Pagamento + Caixa (Sessões, Sangria, Suprimento, Fechamento Cego)** *(Concluída)*
- [x] **FASE 7 — KDS + Cozinha (Estações de Preparação, Timers e Áudio)** *(Concluída)*
- [x] **FASE 8 — Compras + Fornecedores (Ordens de Compra, Recebimento)** *(Concluída)*
- [x] **FASE 9 — Financeiro + Relatórios Analíticos (DRE Gerencial, Fluxo, PDFs)** *(Concluída)*
- [x] **FASE 10 — Clientes + Loyalty + Promoções (Ranking VIP, Cashback, Campanhas)** *(Concluída)*
- [x] **FASE 11 — Omnichannel + Kiosk + Delivery (Totem Touch, Zonas, Estafetas)** *(Concluída)*
- [x] **FASE 12 — PWA + Offline + Sync Queue (Service Worker, Cache Local)** *(Concluída)*
- [x] **FASE 13 — Multi-Loja + Controlo Avançado (Alternância de Filiais)** *(Concluída)*
- [x] **FASE 14 — Performance + Segurança + Produção (RBAC, Rate Limits, Auditoria)** *(Concluída)*
