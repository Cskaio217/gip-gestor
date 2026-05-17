import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type {
  AppData,
  Project,
  User,
  Column,
  Card,
  AppSettings,
  CreateProjectInput,
  CreateCardInput,
  CreateUserInput,
  Comment,
  ChecklistItem,
  CardLink,
  Label,
} from '../types';
import { StorageService } from '../services/storage';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';
import { DEFAULT_COLUMN_TITLES } from '../constants';

interface DataContextValue {
  projects: Project[];
  users: User[];
  settings: AppSettings;
  // Projects
  createProject: (data: CreateProjectInput) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  trashProject: (id: string, deletedById: string) => void;
  restoreProject: (id: string) => void;
  // Columns
  addColumn: (projectId: string, title: string) => void;
  updateColumnTitle: (projectId: string, columnId: string, title: string) => void;
  deleteColumn: (projectId: string, columnId: string) => void;
  reorderColumns: (projectId: string, columns: Column[]) => void;
  // Cards
  addCard: (projectId: string, columnId: string, data: CreateCardInput) => void;
  updateCard: (projectId: string, columnId: string, cardId: string, data: Partial<Card>) => void;
  moveCard: (projectId: string, cardId: string, fromColumnId: string, toColumnId: string, insertAtOrder: number) => void;
  deleteCard: (projectId: string, columnId: string, cardId: string) => void;
  // Comments
  addComment: (projectId: string, columnId: string, cardId: string, text: string, authorId: string, authorName: string) => void;
  // Checklist
  addChecklistItem: (projectId: string, columnId: string, cardId: string, text: string) => void;
  toggleChecklistItem: (projectId: string, columnId: string, cardId: string, itemId: string) => void;
  deleteChecklistItem: (projectId: string, columnId: string, cardId: string, itemId: string) => void;
  // Links
  addLink: (projectId: string, columnId: string, cardId: string, title: string, url: string) => void;
  deleteLink: (projectId: string, columnId: string, cardId: string, linkId: string) => void;
  // Labels
  addLabel: (projectId: string, name: string, color: string) => Label;
  updateLabel: (projectId: string, labelId: string, name: string, color: string) => void;
  deleteLabel: (projectId: string, labelId: string) => void;
  // Users
  createUser: (data: CreateUserInput) => User;
  updateUser: (id: string, data: Partial<User>) => void;
  // Settings
  updateSettings: (data: Partial<AppSettings>) => void;
  // Refresh
  refresh: () => void;
}

const DataContext = createContext<DataContextValue | null>(null);

function loadData(): AppData {
  return StorageService.getData();
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(loadData);

  const persist = useCallback((updated: AppData) => {
    StorageService.setData(updated);
    setData(updated);
  }, []);

  const refresh = useCallback(() => setData(loadData()), []);

  // ── Project operations ───────────────────────────────────────────────────

  const createProject = useCallback((input: CreateProjectInput): Project => {
    const project: Project = {
      id: generateId(),
      ...input,
      columns: DEFAULT_COLUMN_TITLES.map((t, i) => ({
        id: generateId(),
        title: t,
        order: i,
        cards: [],
      })),
      labels: [],
      createdAt: nowISO(),
    };
    const updated = { ...data, projects: [...data.projects, project] };
    persist(updated);
    return project;
  }, [data, persist]);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    const projects = data.projects.map((p) => (p.id === id ? { ...p, ...patch } : p));
    persist({ ...data, projects });
  }, [data, persist]);

  const deleteProject = useCallback((id: string) => {
    const projects = data.projects.filter((p) => p.id !== id);
    persist({ ...data, projects });
  }, [data, persist]);

  const trashProject = useCallback((id: string, deletedById: string) => {
    const projects = data.projects.map((p) =>
      p.id === id ? { ...p, deletedAt: nowISO(), deletedBy: deletedById } : p,
    );
    persist({ ...data, projects });
  }, [data, persist]);

  const restoreProject = useCallback((id: string) => {
    const projects = data.projects.map((p) =>
      p.id === id ? { ...p, deletedAt: undefined, deletedBy: undefined, status: 'Pausado' as const } : p,
    );
    persist({ ...data, projects });
  }, [data, persist]);

  // ── Column operations ────────────────────────────────────────────────────

  const addColumn = useCallback((projectId: string, title: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      const col: Column = { id: generateId(), title, order: p.columns.length, cards: [] };
      return { ...p, columns: [...p.columns, col] };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  const updateColumnTitle = useCallback((projectId: string, columnId: string, title: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        columns: p.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
      };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  const deleteColumn = useCallback((projectId: string, columnId: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, columns: p.columns.filter((c) => c.id !== columnId) };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  const reorderColumns = useCallback((projectId: string, columns: Column[]) => {
    const projects = data.projects.map((p) => (p.id !== projectId ? p : { ...p, columns }));
    persist({ ...data, projects });
  }, [data, persist]);

  // ── Card operations ──────────────────────────────────────────────────────

  const addCard = useCallback((projectId: string, columnId: string, input: CreateCardInput) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        columns: p.columns.map((c) => {
          if (c.id !== columnId) return c;
          const card: Card = {
            id: generateId(),
            ...input,
            labelId: input.labelId ?? '',
            cardColor: input.cardColor ?? '',
            coverImage: input.coverImage ?? '',
            checklist: [],
            links: [],
            comments: [],
            archived: false,
            archivedAt: '',
            order: c.cards.length,
            createdAt: nowISO(),
          };
          return { ...c, cards: [...c.cards, card] };
        }),
      };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  const updateCard = useCallback(
    (projectId: string, columnId: string, cardId: string, patch: Partial<Card>) => {
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) => (k.id === cardId ? { ...k, ...patch } : k)),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  const moveCard = useCallback(
    (projectId: string, cardId: string, fromColumnId: string, toColumnId: string, insertAtOrder: number) => {
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        let movingCard: Card | undefined;
        const columns = p.columns.map((c) => {
          if (c.id === fromColumnId) {
            const card = c.cards.find((k) => k.id === cardId);
            if (card) movingCard = card;
            return { ...c, cards: c.cards.filter((k) => k.id !== cardId) };
          }
          return c;
        });
        if (!movingCard) return p;
        const card = movingCard;
        const updatedColumns = columns.map((c) => {
          if (c.id !== toColumnId) return c;
          const newCards = [...c.cards];
          const updated = { ...card, order: insertAtOrder };
          newCards.splice(insertAtOrder, 0, updated);
          return { ...c, cards: newCards.map((k, i) => ({ ...k, order: i })) };
        });
        return { ...p, columns: updatedColumns };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  const deleteCard = useCallback((projectId: string, columnId: string, cardId: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        columns: p.columns.map((c) => {
          if (c.id !== columnId) return c;
          return { ...c, cards: c.cards.filter((k) => k.id !== cardId) };
        }),
      };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  // ── Comment operations ───────────────────────────────────────────────────

  const addComment = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string, authorId: string, authorName: string) => {
      const comment: Comment = {
        id: generateId(),
        authorId,
        authorName,
        text,
        createdAt: nowISO(),
      };
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, comments: [...k.comments, comment] } : k,
              ),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  // ── Checklist operations ─────────────────────────────────────────────────

  const addChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string) => {
      const item: ChecklistItem = { id: generateId(), text, done: false };
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, checklist: [...k.checklist, item] } : k,
              ),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  const toggleChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) => {
                if (k.id !== cardId) return k;
                return {
                  ...k,
                  checklist: k.checklist.map((i) =>
                    i.id === itemId ? { ...i, done: !i.done } : i,
                  ),
                };
              }),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  const deleteChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId
                  ? { ...k, checklist: k.checklist.filter((i) => i.id !== itemId) }
                  : k,
              ),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  // ── Link operations ──────────────────────────────────────────────────────

  const addLink = useCallback(
    (projectId: string, columnId: string, cardId: string, title: string, url: string) => {
      const link: CardLink = { id: generateId(), title, url };
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, links: [...k.links, link] } : k,
              ),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  const deleteLink = useCallback(
    (projectId: string, columnId: string, cardId: string, linkId: string) => {
      const projects = data.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, links: k.links.filter((l) => l.id !== linkId) } : k,
              ),
            };
          }),
        };
      });
      persist({ ...data, projects });
    },
    [data, persist],
  );

  // ── Label operations ─────────────────────────────────────────────────────

  const addLabel = useCallback((projectId: string, name: string, color: string): Label => {
    const label: Label = { id: generateId(), name, color };
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return { ...p, labels: [...(p.labels ?? []), label] };
    });
    persist({ ...data, projects });
    return label;
  }, [data, persist]);

  const updateLabel = useCallback((projectId: string, labelId: string, name: string, color: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      return {
        ...p,
        labels: (p.labels ?? []).map((l) => (l.id === labelId ? { ...l, name, color } : l)),
      };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  const deleteLabel = useCallback((projectId: string, labelId: string) => {
    const projects = data.projects.map((p) => {
      if (p.id !== projectId) return p;
      // Remove label from project and clear labelId from all cards
      return {
        ...p,
        labels: (p.labels ?? []).filter((l) => l.id !== labelId),
        columns: p.columns.map((c) => ({
          ...c,
          cards: c.cards.map((k) =>
            k.labelId === labelId ? { ...k, labelId: '' } : k,
          ),
        })),
      };
    });
    persist({ ...data, projects });
  }, [data, persist]);

  // ── User operations ──────────────────────────────────────────────────────

  const createUser = useCallback((input: CreateUserInput): User => {
    const user: User = { id: generateId(), ativo: true, ...input };
    const updated = { ...data, users: [...data.users, user] };
    persist(updated);
    return user;
  }, [data, persist]);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    const users = data.users.map((u) => (u.id === id ? { ...u, ...patch } : u));
    persist({ ...data, users });
  }, [data, persist]);

  // ── Settings operations ──────────────────────────────────────────────────

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    persist({ ...data, settings: { ...data.settings, ...patch } });
  }, [data, persist]);

  return (
    <DataContext.Provider
      value={{
        projects: data.projects,
        users: data.users,
        settings: data.settings,
        createProject,
        updateProject,
        deleteProject,
        trashProject,
        restoreProject,
        addColumn,
        updateColumnTitle,
        deleteColumn,
        reorderColumns,
        addCard,
        updateCard,
        moveCard,
        deleteCard,
        addComment,
        addChecklistItem,
        toggleChecklistItem,
        deleteChecklistItem,
        addLink,
        deleteLink,
        addLabel,
        updateLabel,
        deleteLabel,
        createUser,
        updateUser,
        updateSettings,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
}
