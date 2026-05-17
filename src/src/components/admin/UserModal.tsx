import { useState, type FormEvent } from 'react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input } from '../shared/Input';
import { Select } from '../shared/Select';
import type { User, UserProfile, CreateUserInput } from '../../types';
import type { Project } from '../../types';

interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateUserInput) => void;
  projects: Project[];
  initial?: User;
}

export function UserModal({ open, onClose, onSave, projects, initial }: UserModalProps) {
  const blank: CreateUserInput = {
    nome: initial?.nome ?? '',
    login: initial?.login ?? '',
    senha: initial?.senha ?? '',
    email: initial?.email ?? '',
    cargo: initial?.cargo ?? '',
    perfil: initial?.perfil ?? 'consultor',
    especialidade: initial?.especialidade ?? '',
    projectsLinked: initial?.projectsLinked ?? [],
  };
  const [form, setForm] = useState<CreateUserInput>(blank);

  const set = <K extends keyof CreateUserInput>(key: K, value: CreateUserInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  const toggleProject = (id: string) => {
    set(
      'projectsLinked',
      form.projectsLinked.includes(id)
        ? form.projectsLinked.filter((p) => p !== id)
        : [...form.projectsLinked, id],
    );
  };

  return (
    <Modal open={open} onClose={onClose} title={initial ? 'Editar Usuário' : 'Novo Usuário'} size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nome completo *"
          value={form.nome}
          onChange={(e) => set('nome', e.target.value)}
          placeholder="Nome do usuário"
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Login *"
            value={form.login}
            onChange={(e) => set('login', e.target.value)}
            placeholder="usuario"
            required
          />
          <Input
            label="Senha inicial *"
            type="password"
            value={form.senha}
            onChange={(e) => set('senha', e.target.value)}
            placeholder="••••••"
            required={!initial}
          />
        </div>
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => set('email', e.target.value)}
          placeholder="email@empresa.com"
        />
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Cargo"
            value={form.cargo}
            onChange={(e) => set('cargo', e.target.value)}
            placeholder="Ex: Consultor"
          />
          <Input
            label="Especialidade"
            value={form.especialidade}
            onChange={(e) => set('especialidade', e.target.value)}
            placeholder="Ex: Finanças"
          />
        </div>

        <Select
          label="Perfil de permissão *"
          value={form.perfil}
          onChange={(e) => set('perfil', e.target.value as UserProfile)}
          options={[
            { value: 'admin', label: 'Admin' },
            { value: 'consultor', label: 'Consultor' },
            { value: 'cliente', label: 'Cliente (somente leitura)' },
          ]}
        />

        {form.perfil === 'cliente' && (
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-2">Projetos vinculados</p>
            <div className="max-h-36 overflow-y-auto space-y-1.5 bg-slate-50 dark:bg-white/5 rounded-lg p-3 border border-slate-100 dark:border-transparent">
              {projects.map((p) => (
                <label key={p.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={form.projectsLinked.includes(p.id)}
                    onChange={() => toggleProject(p.id)}
                    className="accent-[#CC0000]"
                  />
                  <span className="text-sm text-slate-600 dark:text-white/70 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {p.cliente}
                  </span>
                </label>
              ))}
              {projects.length === 0 && (
                <p className="text-xs text-slate-400 dark:text-white/30 italic">Nenhum projeto cadastrado.</p>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit">{initial ? 'Salvar' : 'Criar usuário'}</Button>
        </div>
      </form>
    </Modal>
  );
}

