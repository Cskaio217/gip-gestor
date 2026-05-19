// api.ts — Substitui storage.ts com persistência no Supabase.
// Mantém a mesma interface de dados (AppData, User, Project, etc.)
// mapeando entre o modelo nested da app e as tabelas normalizadas do Supabase.

import { supabase } from './supabase'
import type {
  AppData,
  User,
  Project,
  Column,
  Card,
  AppSettings,
  ChecklistItem,
  CardLink,
  Comment,
  Label,
} from '../types'
import { DEFAULT_PRODUCT_TYPES } from '../constants'

// ── Tipos internos de linha do banco ─────────────────────────────────────────

interface DbProfile {
  id: string; nome: string; login: string; email: string
  cargo: string; perfil: string; especialidade: string
  ativo: boolean; permissions: Record<string, boolean>; deleted_at: string | null
}
interface DbProject {
  id: string; nome: string; cliente: string; produto: string; status: string
  data_inicio: string | null; data_fim: string | null; responsavel_id: string | null
  descricao: string; client_logo: string; created_at: string
  deleted_at: string | null; deleted_by: string | null
}
interface DbColumn {
  id: string; project_id: string; title: string; order_index: number; deleted_at: string | null
}
interface DbCard {
  id: string; column_id: string; project_id: string; title: string; description: string
  responsavel_id: string | null; data_entrega: string | null; label: string
  label_id: string | null; card_color: string; cover_image: string
  archived: boolean; archived_at: string | null; order_index: number
  created_at: string; deleted_at: string | null
}
interface DbChecklistItem {
  id: string; card_id: string; text: string; done: boolean; deleted_at: string | null
}
interface DbCardLink {
  id: string; card_id: string; title: string; url: string; deleted_at: string | null
}
interface DbComment {
  id: string; card_id: string; author_id: string; author_name: string
  text: string; created_at: string; deleted_at: string | null
}
interface DbLabel {
  id: string; project_id: string; name: string; color: string; deleted_at: string | null
}
interface DbSettings {
  company_name: string; logo: string; product_types: string[]
}
interface DbMember { project_id: string; user_id: string }

// ── Mapeamentos DB → App ──────────────────────────────────────────────────────

function mapUser(p: DbProfile, projectsLinked: string[]): User {
  return {
    id: p.id, nome: p.nome, login: p.login,
    senha: '',  // Senha nunca retornada — gerenciada pelo Supabase Auth
    email: p.email, cargo: p.cargo,
    perfil: p.perfil as User['perfil'],
    especialidade: p.especialidade, ativo: p.ativo,
    projectsLinked,
    permissions: p.permissions,
  }
}

function mapCard(c: DbCard, checklist: ChecklistItem[], links: CardLink[], comments: Comment[]): Card {
  return {
    id: c.id, title: c.title, description: c.description,
    responsavelId: c.responsavel_id ?? '',
    dataEntrega: c.data_entrega ?? '',
    label: (c.label as Card['label']) ?? '',
    labelId: c.label_id ?? '',
    cardColor: c.card_color, coverImage: c.cover_image,
    archived: c.archived, archivedAt: c.archived_at ?? '',
    order: c.order_index, createdAt: c.created_at,
    checklist, links, comments,
  }
}

// ── Leitura completa ──────────────────────────────────────────────────────────

export async function fetchAllData(): Promise<AppData> {
  const [
    { data: profilesRaw },
    { data: projectsRaw },
    { data: columnsRaw },
    { data: cardsRaw },
    { data: checklistRaw },
    { data: linksRaw },
    { data: commentsRaw },
    { data: labelsRaw },
    { data: membersRaw },
    { data: settingsRaw },
  ] = await Promise.all([
    supabase.from('profiles').select('*').is('deleted_at', null),
    supabase.from('projects').select('*').order('created_at'),
    supabase.from('columns').select('*').is('deleted_at', null).order('order_index'),
    supabase.from('cards').select('*').is('deleted_at', null).order('order_index'),
    supabase.from('checklist_items').select('*').is('deleted_at', null),
    supabase.from('card_links').select('*').is('deleted_at', null),
    supabase.from('comments').select('*').is('deleted_at', null).order('created_at'),
    supabase.from('labels').select('*').is('deleted_at', null),
    supabase.from('project_members').select('project_id, user_id').is('deleted_at', null),
    supabase.from('app_settings').select('*').single(),
  ])

  const profiles   = (profilesRaw  ?? []) as DbProfile[]
  const projects   = (projectsRaw  ?? []) as DbProject[]
  const columns    = (columnsRaw   ?? []) as DbColumn[]
  const cards      = (cardsRaw     ?? []) as DbCard[]
  const checklist  = (checklistRaw ?? []) as DbChecklistItem[]
  const links      = (linksRaw     ?? []) as DbCardLink[]
  const comments   = (commentsRaw  ?? []) as DbComment[]
  const labels     = (labelsRaw    ?? []) as DbLabel[]
  const members    = (membersRaw   ?? []) as DbMember[]
  const settings   = settingsRaw as DbSettings | null

  // Índices por FK
  const membersByUser = members.reduce<Record<string, string[]>>((acc, m) => {
    ;(acc[m.user_id] ??= []).push(m.project_id); return acc
  }, {})

  const checklistByCard = checklist.reduce<Record<string, ChecklistItem[]>>((acc, i) => {
    ;(acc[i.card_id] ??= []).push({ id: i.id, text: i.text, done: i.done }); return acc
  }, {})

  const linksByCard = links.reduce<Record<string, CardLink[]>>((acc, l) => {
    ;(acc[l.card_id] ??= []).push({ id: l.id, title: l.title, url: l.url }); return acc
  }, {})

  const commentsByCard = comments.reduce<Record<string, Comment[]>>((acc, c) => {
    ;(acc[c.card_id] ??= []).push({
      id: c.id, authorId: c.author_id, authorName: c.author_name,
      text: c.text, createdAt: c.created_at,
    }); return acc
  }, {})

  const cardsByColumn = cards.reduce<Record<string, Card[]>>((acc, c) => {
    ;(acc[c.column_id] ??= []).push(
      mapCard(c, checklistByCard[c.id] ?? [], linksByCard[c.id] ?? [], commentsByCard[c.id] ?? [])
    ); return acc
  }, {})

  const labelsByProject = labels.reduce<Record<string, Label[]>>((acc, l) => {
    ;(acc[l.project_id] ??= []).push({ id: l.id, name: l.name, color: l.color }); return acc
  }, {})

  const columnsByProject = columns.reduce<Record<string, Column[]>>((acc, col) => {
    ;(acc[col.project_id] ??= []).push({
      id: col.id, title: col.title, order: col.order_index,
      cards: (cardsByColumn[col.id] ?? []).sort((a, b) => a.order - b.order),
    }); return acc
  }, {})

  const mappedProjects: Project[] = projects.map((p) => ({
    id: p.id, nome: p.nome, cliente: p.cliente, produto: p.produto,
    status: p.status as Project['status'],
    dataInicio: p.data_inicio ?? '', dataFim: p.data_fim ?? '',
    responsavelId: p.responsavel_id ?? '', descricao: p.descricao,
    clientLogo: p.client_logo, createdAt: p.created_at,
    deletedAt: p.deleted_at ?? undefined,
    deletedBy: p.deleted_by ?? undefined,
    columns: (columnsByProject[p.id] ?? []).sort((a, b) => a.order - b.order),
    labels: labelsByProject[p.id] ?? [],
  }))

  return {
    users: profiles.map((p) => mapUser(p, membersByUser[p.id] ?? [])),
    projects: mappedProjects,
    settings: settings
      ? { companyName: settings.company_name, logo: settings.logo, productTypes: settings.product_types }
      : { companyName: 'GIP — Gestão Interna de Projetos', logo: '', productTypes: [...DEFAULT_PRODUCT_TYPES] },
  }
}

// ── Autenticação ──────────────────────────────────────────────────────────────

export async function signIn(email: string, senha: string): Promise<User | null> {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password: senha,
  })
  if (error || !data.user) return null

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', data.user.id).single()
  if (!profile || !profile.ativo) { await supabase.auth.signOut(); return null }

  const { data: members } = await supabase
    .from('project_members').select('project_id').eq('user_id', data.user.id).is('deleted_at', null)
  const projectsLinked = (members ?? []).map((m: { project_id: string }) => m.project_id)

  return mapUser(profile as DbProfile, projectsLinked)
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut()
}

export async function getSessionUser(): Promise<User | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.user) return null

  const { data: profile } = await supabase
    .from('profiles').select('*').eq('id', session.user.id).single()
  if (!profile || !profile.ativo) return null

  const { data: members } = await supabase
    .from('project_members').select('project_id').eq('user_id', session.user.id).is('deleted_at', null)
  const projectsLinked = (members ?? []).map((m: { project_id: string }) => m.project_id)

  return mapUser(profile as DbProfile, projectsLinked)
}

// ── Projetos ──────────────────────────────────────────────────────────────────

export async function insertProject(project: Project): Promise<void> {
  const { columns, labels, ...rest } = project
  await supabase.from('projects').insert({
    id: rest.id, nome: rest.nome, cliente: rest.cliente, produto: rest.produto,
    status: rest.status, data_inicio: rest.dataInicio || null, data_fim: rest.dataFim || null,
    responsavel_id: rest.responsavelId || null, descricao: rest.descricao,
    client_logo: rest.clientLogo,
  })

  // Colunas padrão
  if (columns.length > 0) {
    await supabase.from('columns').insert(
      columns.map((c) => ({ id: c.id, project_id: project.id, title: c.title, order_index: c.order }))
    )
  }
}

export async function updateProject(id: string, patch: Partial<Project>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.nome       !== undefined) dbPatch.nome           = patch.nome
  if (patch.cliente    !== undefined) dbPatch.cliente         = patch.cliente
  if (patch.produto    !== undefined) dbPatch.produto         = patch.produto
  if (patch.status     !== undefined) dbPatch.status          = patch.status
  if (patch.dataInicio !== undefined) dbPatch.data_inicio     = patch.dataInicio || null
  if (patch.dataFim    !== undefined) dbPatch.data_fim        = patch.dataFim || null
  if (patch.responsavelId !== undefined) dbPatch.responsavel_id = patch.responsavelId || null
  if (patch.descricao  !== undefined) dbPatch.descricao       = patch.descricao
  if (patch.clientLogo !== undefined) dbPatch.client_logo     = patch.clientLogo
  if (patch.deletedAt  !== undefined) dbPatch.deleted_at      = patch.deletedAt ?? null
  if (patch.deletedBy  !== undefined) dbPatch.deleted_by      = patch.deletedBy ?? null
  await supabase.from('projects').update(dbPatch).eq('id', id)
}

// ── Colunas ───────────────────────────────────────────────────────────────────

export async function insertColumn(projectId: string, col: Column): Promise<void> {
  await supabase.from('columns').insert({
    id: col.id, project_id: projectId, title: col.title, order_index: col.order,
  })
}

export async function updateColumn(colId: string, patch: { title?: string; order_index?: number }): Promise<void> {
  await supabase.from('columns').update(patch).eq('id', colId)
}

export async function softDeleteColumn(colId: string): Promise<void> {
  await supabase.from('columns').update({ deleted_at: new Date().toISOString() }).eq('id', colId)
}

export async function reorderColumns(columns: Column[]): Promise<void> {
  await Promise.all(columns.map((c) =>
    supabase.from('columns').update({ order_index: c.order }).eq('id', c.id)
  ))
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export async function insertCard(projectId: string, columnId: string, card: Card): Promise<void> {
  await supabase.from('cards').insert({
    id: card.id, column_id: columnId, project_id: projectId,
    title: card.title, description: card.description,
    responsavel_id: card.responsavelId || null,
    data_entrega: card.dataEntrega || null,
    label: card.label, label_id: card.labelId || null,
    card_color: card.cardColor, cover_image: card.coverImage,
    archived: card.archived, order_index: card.order,
  })
}

export async function updateCard(cardId: string, patch: Partial<Card>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.title        !== undefined) dbPatch.title          = patch.title
  if (patch.description  !== undefined) dbPatch.description    = patch.description
  if (patch.responsavelId !== undefined) dbPatch.responsavel_id = patch.responsavelId || null
  if (patch.dataEntrega  !== undefined) dbPatch.data_entrega   = patch.dataEntrega || null
  if (patch.label        !== undefined) dbPatch.label          = patch.label
  if (patch.labelId      !== undefined) dbPatch.label_id       = patch.labelId || null
  if (patch.cardColor    !== undefined) dbPatch.card_color     = patch.cardColor
  if (patch.coverImage   !== undefined) dbPatch.cover_image    = patch.coverImage
  if (patch.archived     !== undefined) dbPatch.archived       = patch.archived
  if (patch.archivedAt   !== undefined) dbPatch.archived_at    = patch.archivedAt || null
  if (patch.order        !== undefined) dbPatch.order_index    = patch.order
  await supabase.from('cards').update(dbPatch).eq('id', cardId)
}

export async function moveCardDb(cardId: string, toColumnId: string, order: number): Promise<void> {
  await supabase.from('cards').update({ column_id: toColumnId, order_index: order }).eq('id', cardId)
}

export async function softDeleteCard(cardId: string): Promise<void> {
  await supabase.from('cards').update({ deleted_at: new Date().toISOString() }).eq('id', cardId)
}

// ── Comentários ───────────────────────────────────────────────────────────────

export async function insertComment(cardId: string, comment: Comment): Promise<void> {
  await supabase.from('comments').insert({
    id: comment.id, card_id: cardId,
    author_id: comment.authorId, author_name: comment.authorName, text: comment.text,
  })
}

// ── Checklist ─────────────────────────────────────────────────────────────────

export async function insertChecklistItem(cardId: string, item: ChecklistItem): Promise<void> {
  await supabase.from('checklist_items').insert({ id: item.id, card_id: cardId, text: item.text, done: item.done })
}

export async function updateChecklistItem(itemId: string, done: boolean): Promise<void> {
  await supabase.from('checklist_items').update({ done }).eq('id', itemId)
}

export async function softDeleteChecklistItem(itemId: string): Promise<void> {
  await supabase.from('checklist_items').update({ deleted_at: new Date().toISOString() }).eq('id', itemId)
}

// ── Links ─────────────────────────────────────────────────────────────────────

export async function insertLink(cardId: string, link: CardLink): Promise<void> {
  await supabase.from('card_links').insert({ id: link.id, card_id: cardId, title: link.title, url: link.url })
}

export async function softDeleteLink(linkId: string): Promise<void> {
  await supabase.from('card_links').update({ deleted_at: new Date().toISOString() }).eq('id', linkId)
}

// ── Labels ────────────────────────────────────────────────────────────────────

export async function insertLabel(projectId: string, label: Label): Promise<void> {
  await supabase.from('labels').insert({ id: label.id, project_id: projectId, name: label.name, color: label.color })
}

export async function updateLabel(labelId: string, name: string, color: string): Promise<void> {
  await supabase.from('labels').update({ name, color }).eq('id', labelId)
}

export async function softDeleteLabel(labelId: string): Promise<void> {
  await supabase.from('labels').update({ deleted_at: new Date().toISOString() }).eq('id', labelId)
  // Desassociar cards
  await supabase.from('cards').update({ label_id: null }).eq('label_id', labelId)
}

// ── Usuários ──────────────────────────────────────────────────────────────────

export async function updateProfileDb(id: string, patch: Partial<User>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.nome         !== undefined) dbPatch.nome          = patch.nome
  if (patch.cargo        !== undefined) dbPatch.cargo         = patch.cargo
  if (patch.perfil       !== undefined) dbPatch.perfil        = patch.perfil
  if (patch.especialidade !== undefined) dbPatch.especialidade = patch.especialidade
  if (patch.ativo        !== undefined) dbPatch.ativo         = patch.ativo
  if (patch.permissions  !== undefined) dbPatch.permissions   = patch.permissions

  await supabase.from('profiles').update(dbPatch).eq('id', id)

  // Sincronizar project_members se projectsLinked mudou
  if (patch.projectsLinked !== undefined) {
    await supabase.from('project_members')
      .update({ deleted_at: new Date().toISOString() })
      .eq('user_id', id)
    if (patch.projectsLinked.length > 0) {
      await supabase.from('project_members').insert(
        patch.projectsLinked.map((pid) => ({ project_id: pid, user_id: id }))
      )
    }
  }
}

// ── Configurações ──────────────────────────────────────────────────────────────

export async function updateSettingsDb(patch: Partial<AppSettings>): Promise<void> {
  const dbPatch: Record<string, unknown> = {}
  if (patch.companyName  !== undefined) dbPatch.company_name  = patch.companyName
  if (patch.logo         !== undefined) dbPatch.logo          = patch.logo
  if (patch.productTypes !== undefined) dbPatch.product_types = patch.productTypes
  const { data: row } = await supabase.from('app_settings').select('id').single()
  if (row?.id !== undefined) {
    await supabase.from('app_settings').update(dbPatch).eq('id', row.id)
  }
}

// ── Compatibilidade com StorageService (não usada diretamente) ────────────────

export const ApiService = {
  fetchAllData,
  signIn,
  signOut,
  getSessionUser,
  insertProject,
  updateProject,
  insertColumn,
  updateColumn,
  softDeleteColumn,
  reorderColumns,
  insertCard,
  updateCard,
  moveCardDb,
  softDeleteCard,
  insertComment,
  insertChecklistItem,
  updateChecklistItem,
  softDeleteChecklistItem,
  insertLink,
  softDeleteLink,
  insertLabel,
  updateLabel,
  softDeleteLabel,
  updateProfileDb,
  updateSettingsDb,
}
