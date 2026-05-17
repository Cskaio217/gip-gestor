// DataContext adaptado para Supabase.
// Interface idêntica ao original — componentes não precisam mudar.
// Atualizações locais são otimistas (UI imediata), Supabase sincroniza em background.

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react'
import type {
  AppData, Project, User, Column, Card, AppSettings,
  CreateProjectInput, CreateCardInput, CreateUserInput,
  Comment, ChecklistItem, CardLink, Label,
} from '../types'
import * as Api from '../services/api'
import { generateId } from '../utils/id'
import { nowISO } from '../utils/date'
import { DEFAULT_COLUMN_TITLES, DEFAULT_PROFILE_PERMISSIONS } from '../constants'

interface DataContextValue {
  projects: Project[]
  users: User[]
  settings: AppSettings
  dataLoading: boolean
  // Projects
  createProject: (data: CreateProjectInput) => Project
  updateProject: (id: string, data: Partial<Project>) => void
  deleteProject: (id: string) => void
  trashProject: (id: string, deletedById: string) => void
  restoreProject: (id: string) => void
  // Columns
  addColumn: (projectId: string, title: string) => void
  updateColumnTitle: (projectId: string, columnId: string, title: string) => void
  deleteColumn: (projectId: string, columnId: string) => void
  reorderColumns: (projectId: string, columns: Column[]) => void
  // Cards
  addCard: (projectId: string, columnId: string, data: CreateCardInput) => void
  updateCard: (projectId: string, columnId: string, cardId: string, data: Partial<Card>) => void
  moveCard: (projectId: string, cardId: string, fromColumnId: string, toColumnId: string, insertAtOrder: number) => void
  deleteCard: (projectId: string, columnId: string, cardId: string) => void
  // Comments
  addComment: (projectId: string, columnId: string, cardId: string, text: string, authorId: string, authorName: string) => void
  // Checklist
  addChecklistItem: (projectId: string, columnId: string, cardId: string, text: string) => void
  toggleChecklistItem: (projectId: string, columnId: string, cardId: string, itemId: string) => void
  deleteChecklistItem: (projectId: string, columnId: string, cardId: string, itemId: string) => void
  // Links
  addLink: (projectId: string, columnId: string, cardId: string, title: string, url: string) => void
  deleteLink: (projectId: string, columnId: string, cardId: string, linkId: string) => void
  // Labels
  addLabel: (projectId: string, name: string, color: string) => Label
  updateLabel: (projectId: string, labelId: string, name: string, color: string) => void
  deleteLabel: (projectId: string, labelId: string) => void
  // Users
  createUser: (data: CreateUserInput) => User
  updateUser: (id: string, data: Partial<User>) => void
  // Settings
  updateSettings: (data: Partial<AppSettings>) => void
  // Refresh manual
  refresh: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

const EMPTY: AppData = {
  users: [],
  projects: [],
  settings: { companyName: 'GIP — Gestão Interna de Projetos', logo: '', productTypes: [] },
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(EMPTY)
  const [dataLoading, setDataLoading] = useState(true)

  const load = useCallback(() => {
    setDataLoading(true)
    Api.fetchAllData()
      .then(setData)
      .catch(console.error)
      .finally(() => setDataLoading(false))
  }, [])

  useEffect(() => { load() }, [load])

  const refresh = useCallback(() => { load() }, [load])

  // ── Helpers ────────────────────────────────────────────────────────────────

  const updateProjects = useCallback((fn: (ps: Project[]) => Project[]) => {
    setData((d) => ({ ...d, projects: fn(d.projects) }))
  }, [])

  const updateUsers = useCallback((fn: (us: User[]) => User[]) => {
    setData((d) => ({ ...d, users: fn(d.users) }))
  }, [])

  // ── Projects ───────────────────────────────────────────────────────────────

  const createProject = useCallback((input: CreateProjectInput): Project => {
    const project: Project = {
      id: generateId(),
      ...input,
      columns: DEFAULT_COLUMN_TITLES.map((t, i) => ({
        id: generateId(), title: t, order: i, cards: [],
      })),
      labels: [],
      createdAt: nowISO(),
    }
    updateProjects((ps) => [...ps, project])
    Api.insertProject(project).catch(console.error)
    return project
  }, [updateProjects])

  const updateProject = useCallback((id: string, patch: Partial<Project>) => {
    updateProjects((ps) => ps.map((p) => p.id === id ? { ...p, ...patch } : p))
    Api.updateProject(id, patch).catch(console.error)
  }, [updateProjects])

  const deleteProject = useCallback((id: string) => {
    updateProjects((ps) => ps.filter((p) => p.id !== id))
    Api.updateProject(id, { deletedAt: nowISO() }).catch(console.error)
  }, [updateProjects])

  const trashProject = useCallback((id: string, deletedById: string) => {
    updateProjects((ps) => ps.map((p) =>
      p.id === id ? { ...p, deletedAt: nowISO(), deletedBy: deletedById } : p
    ))
    Api.updateProject(id, { deletedAt: nowISO(), deletedBy: deletedById }).catch(console.error)
  }, [updateProjects])

  const restoreProject = useCallback((id: string) => {
    updateProjects((ps) => ps.map((p) =>
      p.id === id ? { ...p, deletedAt: undefined, deletedBy: undefined, status: 'Pausado' as const } : p
    ))
    Api.updateProject(id, { deletedAt: undefined, deletedBy: undefined, status: 'Pausado' }).catch(console.error)
  }, [updateProjects])

  // ── Columns ────────────────────────────────────────────────────────────────

  const addColumn = useCallback((projectId: string, title: string) => {
    const col: Column = { id: generateId(), title, order: 0, cards: [] }
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      const newCol = { ...col, order: p.columns.length }
      return { ...p, columns: [...p.columns, newCol] }
    }))
    // Get current order from state for Supabase
    setData((d) => {
      const project = d.projects.find((p) => p.id === projectId)
      if (project) {
        const newCol: Column = { ...col, order: project.columns.length }
        Api.insertColumn(projectId, newCol).catch(console.error)
      }
      return d
    })
  }, [updateProjects])

  const updateColumnTitle = useCallback((projectId: string, columnId: string, title: string) => {
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return { ...p, columns: p.columns.map((c) => c.id === columnId ? { ...c, title } : c) }
    }))
    Api.updateColumn(columnId, { title }).catch(console.error)
  }, [updateProjects])

  const deleteColumn = useCallback((projectId: string, columnId: string) => {
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return { ...p, columns: p.columns.filter((c) => c.id !== columnId) }
    }))
    Api.softDeleteColumn(columnId).catch(console.error)
  }, [updateProjects])

  const reorderColumns = useCallback((projectId: string, columns: Column[]) => {
    updateProjects((ps) => ps.map((p) => p.id !== projectId ? p : { ...p, columns }))
    Api.reorderColumns(columns).catch(console.error)
  }, [updateProjects])

  // ── Cards ──────────────────────────────────────────────────────────────────

  const addCard = useCallback((projectId: string, columnId: string, input: CreateCardInput) => {
    let newCard!: Card
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        columns: p.columns.map((c) => {
          if (c.id !== columnId) return c
          newCard = {
            id: generateId(), ...input,
            labelId: input.labelId ?? '', cardColor: input.cardColor ?? '',
            coverImage: input.coverImage ?? '',
            checklist: [], links: [], comments: [],
            archived: false, archivedAt: '',
            order: c.cards.length, createdAt: nowISO(),
          }
          return { ...c, cards: [...c.cards, newCard] }
        }),
      }
    }))
    if (newCard) Api.insertCard(projectId, columnId, newCard).catch(console.error)
  }, [updateProjects])

  const updateCard = useCallback(
    (projectId: string, columnId: string, cardId: string, patch: Partial<Card>) => {
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return { ...c, cards: c.cards.map((k) => k.id === cardId ? { ...k, ...patch } : k) }
          }),
        }
      }))
      Api.updateCard(cardId, patch).catch(console.error)
    },
    [updateProjects],
  )

  const moveCard = useCallback(
    (projectId: string, cardId: string, fromColumnId: string, toColumnId: string, insertAtOrder: number) => {
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        let moving: Card | undefined
        const cols = p.columns.map((c) => {
          if (c.id === fromColumnId) {
            moving = c.cards.find((k) => k.id === cardId)
            return { ...c, cards: c.cards.filter((k) => k.id !== cardId) }
          }
          return c
        })
        if (!moving) return p
        const card = moving
        return {
          ...p,
          columns: cols.map((c) => {
            if (c.id !== toColumnId) return c
            const arr = [...c.cards]
            arr.splice(insertAtOrder, 0, { ...card, order: insertAtOrder })
            return { ...c, cards: arr.map((k, i) => ({ ...k, order: i })) }
          }),
        }
      }))
      Api.moveCardDb(cardId, toColumnId, insertAtOrder).catch(console.error)
    },
    [updateProjects],
  )

  const deleteCard = useCallback((projectId: string, columnId: string, cardId: string) => {
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        columns: p.columns.map((c) => {
          if (c.id !== columnId) return c
          return { ...c, cards: c.cards.filter((k) => k.id !== cardId) }
        }),
      }
    }))
    Api.softDeleteCard(cardId).catch(console.error)
  }, [updateProjects])

  // ── Comments ───────────────────────────────────────────────────────────────

  const addComment = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string, authorId: string, authorName: string) => {
      const comment: Comment = { id: generateId(), authorId, authorName, text, createdAt: nowISO() }
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, comments: [...k.comments, comment] } : k
              ),
            }
          }),
        }
      }))
      Api.insertComment(cardId, comment).catch(console.error)
    },
    [updateProjects],
  )

  // ── Checklist ──────────────────────────────────────────────────────────────

  const addChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, text: string) => {
      const item: ChecklistItem = { id: generateId(), text, done: false }
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, checklist: [...k.checklist, item] } : k
              ),
            }
          }),
        }
      }))
      Api.insertChecklistItem(cardId, item).catch(console.error)
    },
    [updateProjects],
  )

  const toggleChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      let newDone = false
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) => {
                if (k.id !== cardId) return k
                return {
                  ...k,
                  checklist: k.checklist.map((i) => {
                    if (i.id !== itemId) return i
                    newDone = !i.done
                    return { ...i, done: newDone }
                  }),
                }
              }),
            }
          }),
        }
      }))
      Api.updateChecklistItem(itemId, newDone).catch(console.error)
    },
    [updateProjects],
  )

  const deleteChecklistItem = useCallback(
    (projectId: string, columnId: string, cardId: string, itemId: string) => {
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, checklist: k.checklist.filter((i) => i.id !== itemId) } : k
              ),
            }
          }),
        }
      }))
      Api.softDeleteChecklistItem(itemId).catch(console.error)
    },
    [updateProjects],
  )

  // ── Links ──────────────────────────────────────────────────────────────────

  const addLink = useCallback(
    (projectId: string, columnId: string, cardId: string, title: string, url: string) => {
      const link: CardLink = { id: generateId(), title, url }
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, links: [...k.links, link] } : k
              ),
            }
          }),
        }
      }))
      Api.insertLink(cardId, link).catch(console.error)
    },
    [updateProjects],
  )

  const deleteLink = useCallback(
    (projectId: string, columnId: string, cardId: string, linkId: string) => {
      updateProjects((ps) => ps.map((p) => {
        if (p.id !== projectId) return p
        return {
          ...p,
          columns: p.columns.map((c) => {
            if (c.id !== columnId) return c
            return {
              ...c,
              cards: c.cards.map((k) =>
                k.id === cardId ? { ...k, links: k.links.filter((l) => l.id !== linkId) } : k
              ),
            }
          }),
        }
      }))
      Api.softDeleteLink(linkId).catch(console.error)
    },
    [updateProjects],
  )

  // ── Labels ─────────────────────────────────────────────────────────────────

  const addLabel = useCallback((projectId: string, name: string, color: string): Label => {
    const label: Label = { id: generateId(), name, color }
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return { ...p, labels: [...(p.labels ?? []), label] }
    }))
    Api.insertLabel(projectId, label).catch(console.error)
    return label
  }, [updateProjects])

  const updateLabel = useCallback((projectId: string, labelId: string, name: string, color: string) => {
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        labels: (p.labels ?? []).map((l) => l.id === labelId ? { ...l, name, color } : l),
      }
    }))
    Api.updateLabel(labelId, name, color).catch(console.error)
  }, [updateProjects])

  const deleteLabel = useCallback((projectId: string, labelId: string) => {
    updateProjects((ps) => ps.map((p) => {
      if (p.id !== projectId) return p
      return {
        ...p,
        labels: (p.labels ?? []).filter((l) => l.id !== labelId),
        columns: p.columns.map((c) => ({
          ...c,
          cards: c.cards.map((k) => k.labelId === labelId ? { ...k, labelId: '' } : k),
        })),
      }
    }))
    Api.softDeleteLabel(labelId).catch(console.error)
  }, [updateProjects])

  // ── Users ──────────────────────────────────────────────────────────────────

  const createUser = useCallback((input: CreateUserInput): User => {
    const user: User = {
      id: generateId(), ativo: true,
      permissions: DEFAULT_PROFILE_PERMISSIONS[input.perfil] ?? {},
      ...input,
    }
    updateUsers((us) => [...us, user])
    // Nota: para criar usuário no Supabase Auth, use a Edge Function send-invite
    // ou o Dashboard de Authentication. Aqui apenas registramos localmente.
    console.warn('createUser: usuário criado localmente. Use a Edge Function send-invite para persistir no Supabase Auth.')
    return user
  }, [updateUsers])

  const updateUser = useCallback((id: string, patch: Partial<User>) => {
    updateUsers((us) => us.map((u) => u.id === id ? { ...u, ...patch } : u))
    Api.updateProfileDb(id, patch).catch(console.error)
  }, [updateUsers])

  // ── Settings ───────────────────────────────────────────────────────────────

  const updateSettings = useCallback((patch: Partial<AppSettings>) => {
    setData((d) => ({ ...d, settings: { ...d.settings, ...patch } }))
    Api.updateSettingsDb(patch).catch(console.error)
  }, [])

  return (
    <DataContext.Provider
      value={{
        projects: data.projects,
        users: data.users,
        settings: data.settings,
        dataLoading,
        createProject, updateProject, deleteProject, trashProject, restoreProject,
        addColumn, updateColumnTitle, deleteColumn, reorderColumns,
        addCard, updateCard, moveCard, deleteCard,
        addComment,
        addChecklistItem, toggleChecklistItem, deleteChecklistItem,
        addLink, deleteLink,
        addLabel, updateLabel, deleteLabel,
        createUser, updateUser,
        updateSettings,
        refresh,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
