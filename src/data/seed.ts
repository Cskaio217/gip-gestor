import type { AppData, User, Project, Column, Card } from '../types';
import { StorageService } from '../services/storage';
import { DEFAULT_PRODUCT_TYPES, DEFAULT_COLUMN_TITLES, DEFAULT_PROFILE_PERMISSIONS } from '../constants';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';

// ─── Seed Users ────────────────────────────────────────────────────────────────

const SEED_USERS: User[] = [
  {
    id: '1',
    nome: 'Admin GIP',
    login: 'admin',
    senha: 'gdr2025',
    email: 'admin@gip.com.br',
    cargo: 'Administrador',
    perfil: 'admin',
    especialidade: 'Administração',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.admin,
  },
  {
    id: '2',
    nome: 'Angelo',
    login: 'angelo',
    senha: 'gdr2025',
    email: 'angelo@gip.com.br',
    cargo: 'Consultor',
    perfil: 'consultor',
    especialidade: 'Finanças',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.consultor,
  },
  {
    id: '3',
    nome: 'Daniel',
    login: 'daniel',
    senha: 'gdr2025',
    email: 'daniel@gip.com.br',
    cargo: 'Consultor',
    perfil: 'consultor',
    especialidade: 'Gestão',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.consultor,
  },
  {
    id: '4',
    nome: 'Joice',
    login: 'joice',
    senha: 'gdr2025',
    email: 'joice@gip.com.br',
    cargo: 'Consultora',
    perfil: 'consultor',
    especialidade: 'Pessoas e Liderança',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.consultor,
  },
  {
    id: '5',
    nome: 'Kaio',
    login: 'kaio',
    senha: 'gdr2025',
    email: 'kaio@gip.com.br',
    cargo: 'Consultor',
    perfil: 'consultor',
    especialidade: 'Marketing e Vendas',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.consultor,
  },
  {
    id: '6',
    nome: 'Cristiane',
    login: 'cristiane',
    senha: 'gdr2025',
    email: 'cristiane@gip.com.br',
    cargo: 'Consultora',
    perfil: 'consultor',
    especialidade: 'Processos',
    ativo: true,
    projectsLinked: [],
    permissions: DEFAULT_PROFILE_PERMISSIONS.consultor,
  },
];

// ─── Helper: build default columns with some sample cards ────────────────────

function buildColumns(sampleCards?: Partial<Card>[]): Column[] {
  return DEFAULT_COLUMN_TITLES.map((title, idx) => ({
    id: generateId(),
    title,
    order: idx,
    cards:
      idx === 0 && sampleCards
        ? sampleCards.map((c, ci) => ({
            id: generateId(),
            title: c.title ?? 'Tarefa',
            description: c.description ?? '',
            responsavelId: '',
            dataEntrega: '',
            label: '' as const,
            labelId: '',
            cardColor: '',
            coverImage: '',
            checklist: [],
            links: [],
            comments: [],
            archived: false,
            archivedAt: '',
            order: ci,
            createdAt: nowISO(),
          }))
        : [],
  }));
}

// ─── Seed Projects ─────────────────────────────────────────────────────────────

function buildSeedProjects(): Project[] {
  const p1: Project = {
    id: 'proj-1',
    nome: 'Restaurante Sabor & Arte',
    cliente: 'Sabor & Arte Ltda.',
    produto: 'Do Caos ao Lucro',
    status: 'Em Andamento',
    dataInicio: '2025-03-01',
    dataFim: '2025-09-30',
    responsavelId: '3',
    descricao: 'Reestruturação financeira e de processos de restaurante familiar.',
    labels: [
      { id: generateId(), name: 'Urgente', color: '#EF4444' },
      { id: generateId(), name: 'Financeiro', color: '#3B82F6' },
      { id: generateId(), name: 'Aguardando Cliente', color: '#EAB308' },
    ],
    clientLogo: '',
    createdAt: nowISO(),
    columns: buildColumns([
      { title: 'Diagnóstico financeiro inicial' },
      { title: 'Mapeamento de processos da cozinha' },
      { title: 'Levantamento de fornecedores' },
    ]),
  };

  const p2: Project = {
    id: 'proj-2',
    nome: 'Academia FitLife',
    cliente: 'FitLife Academias S/A',
    produto: 'Jornada do Empreendedor',
    status: 'Aguardando Cliente',
    dataInicio: '2025-01-15',
    dataFim: '2025-12-31',
    responsavelId: '5',
    descricao: 'Expansão de franquias e estratégia de marketing digital.',
    labels: [
      { id: generateId(), name: 'Marketing', color: '#A855F7' },
      { id: generateId(), name: 'Expansão', color: '#22C55E' },
    ],
    clientLogo: '',
    createdAt: nowISO(),
    columns: (() => {
      const cols = buildColumns([{ title: 'Pesquisa de mercado regional' }]);
      const card: Card = {
        id: generateId(),
        title: 'Plano de expansão — etapa 1',
        description: 'Definição das cidades-alvo para abertura das novas unidades.',
        responsavelId: '5',
        dataEntrega: '2025-06-30',
        label: 'blue',
        labelId: '',
        cardColor: '',
        coverImage: '',
        checklist: [
          { id: generateId(), text: 'Análise demográfica', done: true },
          { id: generateId(), text: 'Visita às cidades', done: false },
          { id: generateId(), text: 'Relatório final', done: false },
        ],
        links: [],
        comments: [],
        archived: false,
        archivedAt: '',
        order: 0,
        createdAt: nowISO(),
      };
      cols[1].cards.push(card);
      return cols;
    })(),
  };

  return [p1, p2];
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Writes seed data to localStorage only if the key is empty.
 * Safe to call on every app start — it never overwrites existing data.
 */
export function initializeData(): void {
  const existing = StorageService.getData();
  if (existing.users.length > 0) return;

  const seedData: AppData = {
    users: SEED_USERS,
    projects: buildSeedProjects(),
    settings: {
      companyName: 'GIP — Gestão Interna de Projetos',
      logo: '',
      productTypes: [...DEFAULT_PRODUCT_TYPES],
    },
  };

  StorageService.setData(seedData);
}
