// ─── Storage ──────────────────────────────────────────────────────────────────

export const STORAGE_KEY = 'gip_data' as const;
export const THEME_KEY = 'gip_theme' as const;
export const AUTH_KEY = 'gip_auth' as const;

// ─── Project Status ────────────────────────────────────────────────────────────

export const PROJECT_STATUS = {
  EM_ANDAMENTO: 'Em Andamento',
  AGUARDANDO_CLIENTE: 'Aguardando Cliente',
  CONCLUIDO: 'Concluído',
  PAUSADO: 'Pausado',
} as const;

export const PROJECT_STATUS_LIST = [
  'Em Andamento',
  'Aguardando Cliente',
  'Concluído',
  'Pausado',
] as const;

// ─── Product Types ─────────────────────────────────────────────────────────────

export const DEFAULT_PRODUCT_TYPES = [
  'Jornada do Empreendedor',
  'Do Caos ao Lucro',
  'Desperte seu Poder em Vendas',
  'Consultoria Avulsa',
] as const;

// ─── User Profiles ─────────────────────────────────────────────────────────────

export const USER_PROFILES = {
  ADMIN: 'admin',
  CONSULTOR: 'consultor',
  CLIENTE: 'cliente',
} as const;

// ─── Kanban Defaults ──────────────────────────────────────────────────────────

export const DEFAULT_COLUMN_TITLES = [
  'A Fazer',
  'Em Andamento',
  'Em Revisão',
  'Concluído',
] as const;

// ─── Status Visual Config ─────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  'Em Andamento': {
    label: 'Em Andamento',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border border-green-400/30',
  },
  'Aguardando Cliente': {
    label: 'Aguardando Cliente',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border border-yellow-400/30',
  },
  Concluído: {
    label: 'Concluído',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border border-blue-400/30',
  },
  Pausado: {
    label: 'Pausado',
    color: 'text-gray-400',
    bg: 'bg-gray-400/10 border border-gray-400/30',
  },
};

// ─── Card Labels ──────────────────────────────────────────────────────────────

import type { CardLabel } from '../types';

export const CARD_LABEL_COLORS: Record<CardLabel, string> = {
  red: '#EF4444',
  orange: '#F97316',
  yellow: '#EAB308',
  green: '#22C55E',
  blue: '#3B82F6',
  purple: '#A855F7',
  pink: '#EC4899',
};

export const CARD_LABEL_OPTIONS: CardLabel[] = Object.keys(CARD_LABEL_COLORS) as CardLabel[];

// ─── Permission Keys ──────────────────────────────────────────────────────────

export const PERM = {
  PROJECTS_VIEW:        'projects.view',
  PROJECTS_CREATE:      'projects.create',
  PROJECTS_EDIT:        'projects.edit',
  PROJECTS_DELETE:      'projects.delete',
  KANBAN_EDIT:          'kanban.edit',
  KANBAN_COLUMNS:       'kanban.manage_columns',
  USERS_VIEW:           'users.view',
  USERS_MANAGE:         'users.manage',
  ADMIN_SETTINGS:       'admin.settings',
  ADMIN_TRASH:          'admin.trash',
} as const;

export type PermKey = (typeof PERM)[keyof typeof PERM];

export const ALL_PERMS = Object.values(PERM) as PermKey[];

export const DEFAULT_PROFILE_PERMISSIONS: Record<string, Record<string, boolean>> = {
  admin: Object.fromEntries(ALL_PERMS.map((k) => [k, true])),
  consultor: {
    [PERM.PROJECTS_VIEW]:   true,
    [PERM.PROJECTS_CREATE]: true,
    [PERM.PROJECTS_EDIT]:   true,
    [PERM.PROJECTS_DELETE]: false,
    [PERM.KANBAN_EDIT]:     true,
    [PERM.KANBAN_COLUMNS]:  true,
    [PERM.USERS_VIEW]:      false,
    [PERM.USERS_MANAGE]:    false,
    [PERM.ADMIN_SETTINGS]:  false,
    [PERM.ADMIN_TRASH]:     false,
  },
  cliente: {
    [PERM.PROJECTS_VIEW]:   true,
    [PERM.PROJECTS_CREATE]: false,
    [PERM.PROJECTS_EDIT]:   false,
    [PERM.PROJECTS_DELETE]: false,
    [PERM.KANBAN_EDIT]:     false,
    [PERM.KANBAN_COLUMNS]:  false,
    [PERM.USERS_VIEW]:      false,
    [PERM.USERS_MANAGE]:    false,
    [PERM.ADMIN_SETTINGS]:  false,
    [PERM.ADMIN_TRASH]:     false,
  },
};
