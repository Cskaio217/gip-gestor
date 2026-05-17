import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
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
import * as api from '../services/api';
import { supabase } from '../services/supabase';
import { generateId } from '../utils/id';
import { nowISO } from '../utils/date';
import { DEFAULT_COLUMN_TITLES, DEFAULT_PRODUCT_TYPES } from '../constants';

interface DataContextValue {
  projects: Project[];
  users: User[];
  settings: AppSettings;
  loading: boolean;
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

const EMPTY_DATA: AppData = {
  projects: [],
  users: [],
  settings: {
    companyName: 'GIP — Gestão Interna de Projetos',
    logo: '',
    productTypes: [...DEFAULT_PRODUCT_TYPES],
  },
};

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchAllData().then(setData).finally(() => setLoading(false));
  }, []);

  const refresh = useCallback(() => {
    api.fetchAllData().then(setData);
  }, []);

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
    setData((prev) => ({ ...prev, projects: [...prev.projects, project] }));
    api.insertProject(project);
    return project;
  }, []);

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }));
    api.updateProject(id, patch);
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((prev) => ({ ...prev, projects: prev.projects.filter((p) => p.id !== id) }));
    supabase.from('projects').delete().eq('id', id);
  }, []);

  const trashProject = useCallback((id: string, deletedById: string) => {
    const deletedAt = nowISO();
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id ? { ...p, deletedAt, deletedBy: deletedById } : p,
      ),
    }));
    api.updateProject(id, { deletedAt, deletedBy: deletedById });
  }, []);

  const restoreProject = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) =>
        p.id === id
          ? { ...p, deletedAt: undefined, deletedBy: undefined, status: 'Pausado' as const }
          : p,
      ),
    }));
    api.updateProject(id, { deletedAt: undefined, deletedBy: undefined, status: 'Pausado' });
  }, []);

  // ── Column operations ────────────────────────────────────────────────────

  const addColumn = useCallback((projectId: string, title: string) => {
    const colId = generateId();
    let newCol: Column | undefined;
    setData((prev) => {
      const projects = prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        const col: Column = { id: colId, title, order: p.columns.length, cards: [] };
        newCol = col;
        return { ...p, columns: [...p.columns, col] };
      });
      return { ...prev, projects };
    });
    if (newCol) api.insertColumn(projectId, newCol);
  }, []);

  const updateColumnTitle = useCallback((projectId: string, columnId: string, title: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, columns: p.columns.map((c) => (c.id === columnId ? { ...c, title } : c)) };
      }),
    }));
    api.updateColumn(columnId, { title });
  }, []);

  const deleteColumn = useCallback((projectId: string, columnId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, columns: p.columns.filter((c) => c.id !== columnId) };
      }),
    }));
    api.softDeleteColumn(columnId);
  }, []);

  const reorderColumns = useCallback((projectId: string, columns: Column[]) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => (p.id !== projectId ? p : { ...p, columns })),
    }));
    api.reorderColumns(columns);
  }, []);

  // ── Card operations ──────────────────────────────────────────────────────

  const addCard = useCallback((projectId: string, columnId: string, input: CreateCardInput) => {
    const cardId = generateId();
    let newCard: Card | undefined;
    setData((prev) => {
      const projects = prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            const card: Card = {
              id: cardId,
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
            newCard = card;
            return { ...c, cards: [...c.cards, card] };
          }),
        };
      });
      return { ...prev, projects };
    });
    if (newCard) api.insertCard(projectId, columnId, newCard);
  }, []);

  const updateCard = useCallback(
    (projectId: string, columnId: string, cardId: string, patch: Partial<Card>) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.updateCard(cardId, patch);
    },
    [],
  );

  const moveCard = useCallback(
    (projectId: string, cardId: string, fromColumnId: string, toColumnId: string, insertAtOrder: number) => {
      setData((prev) => {
        const projects = prev.projects.map((p) => {
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
            newCards.splice(insertAtOrder, 0, { ...card, order: insertAtOrder });
            return { ...c, cards: newCards.map((k, i) => ({ ...k, order: i })) };
          });
          return { ...p, columns: updatedColumns };
        });
        return { ...prev, projects };
      });
      api.moveCardDb(cardId, toColumnId, insertAtOrder);
    },
    [],
  );

  const deleteCard = useCallback((projectId: string, columnId: string, cardId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c;
            return { ...c, cards: c.cards.filter((k) => k.id !== cardId) };
          }),
        };
      }),
    }));
    api.softDeleteCard(cardId);
  }, []);

  // ── Comment operations ───────────────────────────────────────────────────

  const addComment = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string, authorId: string, authorName: string) => {
      const comment: Comment = { id: generateId(), authorId, authorName, text, createdAt: nowISO() };
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.insertComment(cardId, comment);
    },
    [],
  );

  // ── Checklist operations ─────────────────────────────────────────────────

  const addChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string) => {
      const item: ChecklistItem = { id: generateId(), text, done: false };
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.insertChecklistItem(cardId, item);
    },
    [],
  );

  const toggleChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      let newDone: boolean | undefined;
      setData((prev) => {
        const projects = prev.projects.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            columns: p.columns.map((c) => {
              if (c.id !== columnId) return c;
              return {
                ...c,
                cards: c.cards.map((k) => {
                  if (k.id !== cardId) return k;
                  const checklist = k.checklist.map((i) => {
                    if (i.id !== itemId) return i;
                    newDone = !i.done;
                    return { ...i, done: newDone };
                  });
                  return { ...k, checklist };
                }),
              };
            }),
          };
        });
        return { ...prev, projects };
      });
      if (newDone !== undefined) api.updateChecklistItem(itemId, newDone);
    },
    [],
  );

  const deleteChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.softDeleteChecklistItem(itemId);
    },
    [],
  );

  // ── Link operations ──────────────────────────────────────────────────────

  const addLink = useCallback(
    (projectId: string, columnId: string, cardId: string, title: string, url: string) => {
      const link: CardLink = { id: generateId(), title, url };
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.insertLink(cardId, link);
    },
    [],
  );

  const deleteLink = useCallback(
    (projectId: string, columnId: string, cardId: string, linkId: string) => {
      setData((prev) => ({
        ...prev,
        projects: prev.projects.map((p) => {
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
        }),
      }));
      api.softDeleteLink(linkId);
    },
    [],
  );

  // ── Label operations ─────────────────────────────────────────────────────

  const addLabel = useCallback((projectId: string, name: string, color: string): Label => {
    const label: Label = { id: generateId(), name, color };
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return { ...p, labels: [...(p.labels ?? []), label] };
      }),
    }));
    api.insertLabel(projectId, label);
    return label;
  }, []);

  const updateLabel = useCallback((projectId: string, labelId: string, name: string, color: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          labels: (p.labels ?? []).map((l) => (l.id === labelId ? { ...l, name, color } : l)),
        };
      }),
    }));
    api.updateLabel(labelId, name, color);
  }, []);

  const deleteLabel = useCallback((projectId: string, labelId: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== projectId) return p;
        return {
          ...p,
          labels: (p.labels ?? []).filter((l) => l.id !== labelId),
          columns: p.columns.map((c) => ({
            ...c,
            cards: c.cards.map((k) => (k.labelId === labelId ? { ...k, labelId: '' } : k)),
          })),
        };
      }),
    }));
    api.softDeleteLabel(labelId);
  }, []);

  // ── User operations ──────────────────────────────────────────────────────

  const createUser = useCallback((input: CreateUserInput): User => {
    const user: User = { id: generateId(), ativo: true, ...input };
    setData((prev) => ({ ...prev, users: [...prev.users, user] }));
    return user;
  }, []);

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    setData((prev) => ({
      ...prev,
      users: prev.users.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    }));
  }, []);

  // ── Settings operations ──────────────────────────────────────────────────

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
    api.updateSettingsDb(patch);
  }, []);

  return (
    <DataContext.Provider
      value={{
        projects: data.projects,
        users: data.users,
        settings: data.settings,
        loading,
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
