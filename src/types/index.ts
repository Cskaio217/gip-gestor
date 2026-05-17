// ─── Domain Types ────────────────────────────────────────────────────────────

export type UserProfile = 'admin' | 'consultor' | 'cliente';

export type ProjectStatus =
  | 'Em Andamento'
  | 'Aguardando Cliente'
  | 'Concluído'
  | 'Pausado';

export type CardLabel =
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  nome: string;
  login: string;
  senha: string;
  email: string;
  cargo: string;
  perfil: UserProfile;
  especialidade: string;
  ativo: boolean;
  projectsLinked: string[];
  permissions?: Record<string, boolean>; // granular permission overrides
}

// ─── Label ─────────────────────────────────────────────────────────────────────

export interface Label {
  id: string;
  name: string;
  color: string; // hex, e.g. '#CC0000'
}

// ─── Kanban Entities ──────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CardLink {
  id: string;
  title: string;
  url: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface Card {
  id: string;
  title: string;
  description: string;
  responsavelId: string;
  dataEntrega: string;
  label: CardLabel | ''; // legacy field kept for backward compat
  labelId: string;       // project-scoped label id
  cardColor: string;     // hex banner color, '' = none
  coverImage: string;    // base64 cover image, '' = none
  checklist: ChecklistItem[];
  links: CardLink[];
  comments: Comment[];
  archived: boolean;
  archivedAt: string;    // ISO date when archived, '' = not archived
  order: number;
  createdAt: string;
}

export interface Column {
  id: string;
  title: string;
  order: number;
  cards: Card[];
}

export interface Project {
  id: string;
  nome: string;
  cliente: string;
  produto: string;
  status: ProjectStatus;
  dataInicio: string;
  dataFim: string;
  responsavelId: string;
  descricao: string;
  columns: Column[];
  labels: Label[];       // project-scoped custom labels
  clientLogo: string;    // base64 or '', client logo image
  createdAt: string;
  deletedAt?: string;    // ISO date when trashed, undefined = not trashed
  deletedBy?: string;    // user id who trashed
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export interface AppSettings {
  companyName: string;
  logo: string;
  productTypes: string[];
}

// ─── Root Data ─────────────────────────────────────────────────────────────────

export interface AppData {
  users: User[];
  projects: Project[];
  settings: AppSettings;
}

// ─── Input Types (for create/update operations) ───────────────────────────────

export interface CreateProjectInput {
  nome: string;
  cliente: string;
  produto: string;
  status: ProjectStatus;
  dataInicio: string;
  dataFim: string;
  responsavelId: string;
  descricao: string;
  clientLogo: string;
}

export interface CreateCardInput {
  title: string;
  description: string;
  responsavelId: string;
  dataEntrega: string;
  label: CardLabel | '';
  labelId?: string;
  cardColor?: string;
  coverImage?: string;
}

export interface CreateUserInput {
  nome: string;
  login: string;
  senha: string;
  email: string;
  cargo: string;
  perfil: UserProfile;
  especialidade: string;
  projectsLinked: string[];
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export type AppView = 'login' | 'dashboard' | 'project' | 'admin';

export interface NavState {
  view: AppView;
  projectId?: string;
}

