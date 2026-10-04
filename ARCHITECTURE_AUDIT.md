# RELATÓRIO DE AUDITORIA ARQUITETURAL: MULTI-TENANT & SAAS EMPRESARIAL
**Documento Técnico: `ARCHITECTURE_AUDIT.md`**  
**Data:** 30 de Setembro de 2026  
**Sistema:** KOMA POS & Fast Food Omnichannel Platform (SaaS Ready)  
**Versão Atual:** 1.0.0-phase1-auth-multicompany  

---

## 1. INTRODUÇÃO & ESCOPO DA AUDITORIA
Esta auditoria avalia minuciosamente o estado atual do módulo de empresas, autenticação, controle de acesso e isolamento de dados do sistema, visando sua evolução controlada e sem regressões para uma arquitetura **SaaS Multi-Tenant Empresarial** completa (Organização ➔ Empresa ➔ Marca ➔ Filial ➔ Armazém ➔ Caixa ➔ Terminal).

---

## 2. O QUE EXISTE ATUALMENTE

### 2.1. Modelos de Dados (`src/types/index.ts`)
- **`Company`**: Interface com campos básicos: `id`, `name` (Razão Social), `tradeName` (Nome Fantasia), `nuit` (9 dígitos), `email`, `phone`, `secondaryPhone`, `address`, `city`, `province`, `status` (`'active' | 'suspended' | 'trial'`), `subscriptionPlan` (`'starter' | 'professional' | 'enterprise'`), `maxUsers`, `maxBranches`, `branchesCount`, `currency`, `createdAt`, `validUntil`, `notes`.
- **`User`**: Contém `id`, `name`, `username`, `email`, `role`, `status`, `permissions`, `companyId?`, `companyName?`.
- **`Store` / Filial**: Inicialmente modelado em `Header.tsx` e `server.ts` como lista fixa (`store-matola`, `store-maputo`, `store-polana`).

### 2.2. Camada de Persistência & Serviços (`src/services/db.ts`)
- `INITIAL_COMPANIES`: Três empresas iniciais de demonstração moçambicanas cadastradas:
  1. `company-koma` (*KOMA Fast Food Takeaway Lda* - Matriz Matola Rio, NUIT: 400192837, Enterprise);
  2. `company-piri` (*Piri Piri Frangos & Grelhados Lda*, NUIT: 400876543, Professional);
  3. `company-zamani` (*Zamani Cafetaria & Pastelaria Lda*, NUIT: 400345678, Trial).
- Métodos CRUD na classe `DatabaseService`:
  - `DatabaseService.getCompanies(): Promise<Company[]>`
  - `DatabaseService.saveCompany(company: Company): Promise<void>`
  - `DatabaseService.updateCompanyStatus(companyId: string, status: CompanyStatus): Promise<void>`
  - `DatabaseService.deleteCompany(companyId: string): Promise<void>`

### 2.3. Endpoints REST no Backend (`server.ts`)
- `GET /api/companies`: Retorna a lista de empresas.
- `POST /api/companies`: Cadastra nova empresa com validação de NUIT e razão social.
- `PATCH /api/companies/:id/status`: Altera status operacional (*active, trial, suspended*).
- `GET /api/stores`: Retorna lojas/filiais operacionais.

### 2.4. Interface com o Usuário (Frontend)
- **`Companies.tsx`**: Tela com KPIs (Total Empresas, Ativas, Trial, Suspensas), barra de pesquisa e filtros por status, tabela com badge de NUIT, plano e status, botão **"Usar Empresa" / "EM USO"**, e modal de cadastro/edição com validação de NUIT moçambicano (9 dígitos).
- **`Sidebar.tsx`**: Item de navegação `Empresas (SaaS)` com ícone `Building2`, visível para administradores e gerentes.
- **`Header.tsx`**:
  - Seletor de Tenant (Empresa Ativa) com ícone `Building2` gravando no `localStorage` (`koma_active_company_id`).
  - Seletor de Loja/Filial com ícone `Store` gravando no `localStorage` (`koma_active_store`).
- **`App.tsx`**: Rota e autorização via guarda de permissão (`PermissionDenied`).

---

## 3. O QUE ESTÁ CORRETO
1. **Preservação de Dados & Compatibilidade**: As estruturas existentes de `Company` e `API_COMPANIES` são válidas, usam identificadores imutáveis e já incorporam particularidades de Moçambique (NUIT de 9 dígitos e moeda MZN).
2. **Separação Visual**: Existe distinção na interface entre a empresa jurídica (`Company`) e as filiais de atendimento (`Store`).
3. **Persistência Híbrida**: O `DatabaseService` opera tanto com Firestore quanto com fallback seguro local/in-memory para contingência offline.
4. **Trilha de Auditoria**: O cadastro e alteração de status de empresas já dispara registros em `DatabaseService.logAudit()`.

---

## 4. O QUE ESTÁ INCOMPLETO OU REQUER EVOLUÇÃO (GAPS)

| Área | Situação Atual | Necessidade Arquitetural (SaaS Master) |
|---|---|---|
| **Autoridade de Tenant** | O frontend define a empresa via `localStorage.getItem('koma_active_company_id')`. | O **backend** deve ser a autoridade inegociável através do contexto de autenticação/sessão (`GET /api/me/context`). |
| **Membership & Vínculos** | Usuários têm campo opcional `companyId`, sem tabela de relacionamento N:N. | Implementar `company_users` / `user_company_memberships` permitindo que um usuário pertença a múltiplas empresas com papéis distintos. |
| **Multi-Filial (Locations)** | Filiais estão em lista fixa no front e no server. | Criar entidade dinâmica `locations` vinculada a `company_id` com configurações específicas de horários, caixas e armazéns. |
| **Organização & Marcas** | Não há nível acima de Empresa nem conceito de Marca (`brands`). | Criar `organizations` (nível 2) e `brands` (nível 4) para comportar grupos empresariais e redes franqueadas. |
| **Planos & Quotas** | Planos são strings estáticas (`starter`, `professional`, `enterprise`). | Criar catálogo real de `plans`, `features`, `entitlements` e validação de limites (*soft* e *hard limits*). |
| **Isolamento de Queries** | Nem todas as queries de produtos/vendas no backend filtram por `company_id`. | Implementar middleware `tenantContext` e garantir filtro rigoroso por `company_id` em todos os repositórios/endpoints. |
| **Área SuperAdmin vs Tenant** | A tela `Companies.tsx` atua tanto como cadastro da plataforma quanto seleção de uso. | Separar o **SaaS Command Center** (visão do proprietário da plataforma) da área **Minha Empresa** (visão do cliente/administrador local). |

---

## 5. RISCOS IDENTIFICADOS & MITIGAÇÃO

1. **Risco de Tenant Breakout (Vazamento de Dados entre Empresas)**:
   - *Causa Potencial:* Endpoints aceitarem `company_id` vindo diretamente do corpo ou query string do request sem validar se o token JWT do usuário pertence àquela empresa.
   - *Mitigação:* Middleware `resolveTenant` no backend que extrai a identidade do token verificado e bloqueia qualquer requisição a recursos fora da lista de empresas autorizadas do usuário (retornando `HTTP 403 Forbidden`).

2. **Risco de Quebra em Clientes Conectados**:
   - *Causa Potencial:* Alterar bruscamente a assinatura dos endpoints existentes (`/api/companies`, etc.) que o front consome.
   - *Mitigação:* Manter total compatibilidade retroativa (backward compatibility), adicionando novos endpoints complementares (`/api/me/context`, `/api/companies/:id/locations`, `/api/plans`, etc.).

3. **Risco de Perda de Estado no PWA / Modo Offline**:
   - *Causa Potencial:* Reset do `localStorage` sem sincronização prévia de filas pendentes.
   - *Mitigação:* O `localStorage` será tratado estritamente como preferência de UI em cache local; ao reestabelecer conexão, o contexto é revalidado com o servidor via handshake.

---

## 6. PLANO DE MIGRAÇÕES & DEPENDÊNCIAS

### Dependências Estruturais a Adicionar (sem remover as existentes):
1. **Entidades Hierárquicas:**
   - `organizations` ➔ `companies` ➔ `brands` ➔ `locations` ➔ `warehouses` / `registers`
2. **Relacionamentos de Acesso (RBAC Tenant-Aware):**
   - `user_company_memberships`: `{ userId, companyId, role, isDefault, status }`
   - `user_location_memberships`: `{ userId, locationId, role }`
3. **Regras Comerciais & Planos:**
   - `plans`: Definição de recursos, preços e limites
   - `company_entitlements`: Recursos liberados por empresa (plano + add-ons)
   - `company_usage`: Medição de filiais, usuários, produtos e pedidos emitidos

### Arquivos Afetados no Projeto:
- `src/types/index.ts`: Adição das interfaces de Organização, Marca, Localização, Planos, Quotas e Contexto.
- `server.ts`: Middleware `tenantContext`, endpoints `/api/me/context`, `/api/me/companies`, `/api/companies/:id/locations`, `/api/plans`, `/api/usage`.
- `src/services/db.ts`: Métodos de suporte a organizações, marcas, filiais dinâmicas e planos.
- `src/contexts/AuthContext.tsx`: Incorporação do contexto ativo (`activeCompany`, `activeLocation`, `allowedCompanies`).
- `src/components/layout/Header.tsx`: Context Header com hierarquia `Empresa ▾ Filial ▾ Caixa`.
- `src/pages/Companies.tsx`: Evolução para o SaaS Command Center com gestão de planos, assinaturas, filiais e auditoria.

---

## 7. CONCLUSÃO DO DIAGNÓSTICO
O sistema possui uma fundação sólida, estável e em funcionamento. A evolução não exigirá descarte de código, mas sim uma **expansão modular progressiva** respeitando rigorosamente o roteiro em 18 fases ordenadas, garantindo zero quebra de funcionalidades em produção.
