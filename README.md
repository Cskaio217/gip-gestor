# GDR Kanban — Sistema de Gestão de Projetos

Sistema interno de gerenciamento de projetos no estilo Kanban para a consultoria **GDR — Geração de Riqueza**.

---

## Pré-requisitos

- **Node.js** 18 ou superior
- **npm** 9 ou superior (incluso no Node.js 18+)

Verifique com:
```bash
node -v   # deve ser >= 18
npm -v    # deve ser >= 9
```

---

## Instalação e execução

```bash
# 1. Instale as dependências
npm install

# 2. Inicie o servidor de desenvolvimento
npm run dev
```

Acesse: **http://localhost:5173**

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Inicia o servidor de desenvolvimento (HMR) |
| `npm run build` | Gera o build de produção em `/dist` |
| `npm run preview` | Visualiza o build de produção localmente |
| `npm run lint` | Executa o linter ESLint |

---

## Credenciais iniciais

| Usuário | Login | Senha | Perfil |
|---------|-------|-------|--------|
| Admin GDR | `admin` | `gdr2025` | Admin |
| Angelo | `angelo` | `gdr2025` | Consultor |
| Daniel | `daniel` | `gdr2025` | Consultor |
| Joice | `joice` | `gdr2025` | Consultora |
| Kaio | `kaio` | `gdr2025` | Consultor |
| Cristiane | `cristiane` | `gdr2025` | Consultora |

---

## Estrutura de pastas

```
src/
├── components/
│   ├── auth/          # LoginForm
│   ├── dashboard/     # ProjectList, ProjectCard, ProjectModal, Filters
│   ├── kanban/        # KanbanBoard, KanbanColumn, KanbanCard, CardModal...
│   ├── admin/         # UserTable, UserModal, GeneralSettings
│   └── shared/        # Button, Modal, Badge, ProgressBar, Avatar, Input, Select
├── contexts/
│   ├── AuthContext.tsx    # Autenticação global
│   ├── ThemeContext.tsx   # Dark/Light mode
│   └── DataContext.tsx    # Dados da aplicação
├── hooks/             # useAuth, useProjects, useKanban, useUsers
├── services/
│   └── storage.ts     # Abstração do localStorage
├── types/index.ts     # Todas as interfaces TypeScript
├── constants/index.ts
├── utils/             # date, progress, permissions, id
├── data/seed.ts       # Dados iniciais + initializeData()
├── App.tsx
└── main.tsx
```

---

## Como resetar os dados

Via Console do navegador (`F12` → Console):
```javascript
localStorage.removeItem('gdr_data');
location.reload();
```

Ou: **Application** → **Local Storage** → delete a chave `gdr_data` → recarregue.

---

## Tecnologias

- **React 19** + **Vite 6** + **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **@dnd-kit** — drag-and-drop
- **date-fns** — manipulação de datas
- **Lucide React** — ícones

---

## Perfis de usuário

| Perfil | Permissões |
|--------|-----------|
| **Admin** | Acesso total: projetos, kanban, usuários, configurações |
| **Consultor** | Criar/editar projetos, gerenciar kanban |
| **Cliente** | Visualização somente leitura do(s) projeto(s) vinculado(s) |
