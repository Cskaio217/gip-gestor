import type { AppData, User, Project, AppSettings } from '../types';
import { STORAGE_KEY } from '../constants';
import { DEFAULT_PRODUCT_TYPES } from '../constants';

const DEFAULT_DATA: AppData = {
  users: [],
  projects: [],
  settings: {
    companyName: 'GIP — Gestão Interna de Projetos',
    logo: '',
    productTypes: [...DEFAULT_PRODUCT_TYPES],
  },
};

/**
 * Central abstraction over localStorage.
 * Swap the internals here to migrate to a REST API without touching any component.
 */
export const StorageService = {
  getData(): AppData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return structuredClone(DEFAULT_DATA);
      return JSON.parse(raw) as AppData;
    } catch {
      return structuredClone(DEFAULT_DATA);
    }
  },

  setData(data: AppData): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  // ── Users ──────────────────────────────────────────────────────────────────

  getUsers(): User[] {
    return this.getData().users;
  },

  saveUsers(users: User[]): void {
    const data = this.getData();
    this.setData({ ...data, users });
  },

  // ── Projects ───────────────────────────────────────────────────────────────

  getProjects(): Project[] {
    return this.getData().projects;
  },

  saveProjects(projects: Project[]): void {
    const data = this.getData();
    this.setData({ ...data, projects });
  },

  // ── Settings ───────────────────────────────────────────────────────────────

  getSettings(): AppSettings {
    return this.getData().settings;
  },

  saveSettings(settings: AppSettings): void {
    const data = this.getData();
    this.setData({ ...data, settings });
  },

  // ── Full reset ─────────────────────────────────────────────────────────────

  clear(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
