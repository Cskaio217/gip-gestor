import { useState, useRef, useEffect, type FormEvent, type ChangeEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { Modal } from '../shared/Modal';
import { Button } from '../shared/Button';
import { Input, Textarea } from '../shared/Input';
import { Select } from '../shared/Select';
import type { CreateProjectInput, Project, ProjectStatus } from '../../types';
import type { User } from '../../types';
import { PROJECT_STATUS_LIST } from '../../constants';
import { todayISO } from '../../utils/date';

interface ProjectModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CreateProjectInput) => void;
  productTypes: string[];
  consultores: User[];
  initial?: Project;
}

export function ProjectModal({
  open,
  onClose,
  onSave,
  productTypes,
  consultores,
  initial,
}: ProjectModalProps) {
  const blank: CreateProjectInput = {
    nome: initial?.nome ?? '',
    cliente: initial?.cliente ?? '',
    produto: initial?.produto ?? productTypes[0] ?? '',
    status: initial?.status ?? 'Em Andamento',
    dataInicio: initial?.dataInicio ?? todayISO(),
    dataFim: initial?.dataFim ?? '',
    responsavelId: initial?.responsavelId ?? '',
    descricao: initial?.descricao ?? '',
    clientLogo: initial?.clientLogo ?? '',
  };

  const [form, setForm] = useState<CreateProjectInput>(blank);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm({
      nome: initial?.nome ?? '',
      cliente: initial?.cliente ?? '',
      produto: initial?.produto ?? productTypes[0] ?? '',
      status: initial?.status ?? 'Em Andamento',
      dataInicio: initial?.dataInicio ?? todayISO(),
      dataFim: initial?.dataFim ?? '',
      responsavelId: initial?.responsavelId ?? '',
      descricao: initial?.descricao ?? '',
      clientLogo: initial?.clientLogo ?? '',
    });
  }, [initial, open]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (key: keyof CreateProjectInput, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set('clientLogo', (ev.target?.result as string) ?? '');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? 'Editar Projeto' : 'Novo Projeto'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Logo upload */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-2">Logo do cliente</p>
          <div className="flex items-center gap-4">
            {form.clientLogo ? (
              <div className="relative">
                <img
                  src={form.clientLogo}
                  alt="Logo"
                  className="w-16 h-16 rounded-xl object-contain border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1"
                />
                <button
                  type="button"
                  onClick={() => set('clientLogo', '')}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white"
                >
                  <X size={10} />
                </button>
              </div>
            ) : (
              <div className="w-16 h-16 rounded-xl border-2 border-dashed border-slate-200 dark:border-white/20 flex items-center justify-center text-slate-300 dark:text-white/20">
                <Upload size={20} />
              </div>
            )}
            <div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => fileRef.current?.click()}
              >
                <Upload size={13} />
                {form.clientLogo ? 'Trocar logo' : 'Upload de logo'}
              </Button>
              <p className="text-xs text-slate-400 dark:text-white/30 mt-1">JPG, PNG ou SVG até 2MB</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/svg+xml,image/webp"
              className="hidden"
              onChange={handleLogoUpload}
            />
          </div>
        </div>

        <div className="h-px bg-slate-100 dark:bg-white/5" />

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Nome do cliente *"
              value={form.cliente}
              onChange={(e) => set('cliente', e.target.value)}
              placeholder="Ex: Empresa ABC Ltda."
              required
            />
          </div>
          <div className="col-span-2">
            <Input
              label="Nome do projeto"
              value={form.nome}
              onChange={(e) => set('nome', e.target.value)}
              placeholder="Identificador interno do projeto"
            />
          </div>

          <Select
            label="Tipo de produto *"
            value={form.produto}
            onChange={(e) => set('produto', e.target.value)}
            options={productTypes.map((p) => ({ value: p, label: p }))}
            required
          />

          <Select
            label="Status inicial"
            value={form.status}
            onChange={(e) => set('status', e.target.value as ProjectStatus)}
            options={PROJECT_STATUS_LIST.map((s) => ({ value: s, label: s }))}
          />

          <Input
            label="Data de início *"
            type="date"
            value={form.dataInicio}
            onChange={(e) => set('dataInicio', e.target.value)}
            required
          />

          <Input
            label="Data de término prevista"
            type="date"
            value={form.dataFim}
            onChange={(e) => set('dataFim', e.target.value)}
          />

          <div className="col-span-2">
            <Select
              label="Responsável principal"
              value={form.responsavelId}
              onChange={(e) => set('responsavelId', e.target.value)}
              placeholder="Selecione o responsável"
              options={consultores.map((u) => ({ value: u.id, label: `${u.nome} — ${u.especialidade}` }))}
            />
          </div>

          <div className="col-span-2">
            <Textarea
              label="Descrição / observações"
              value={form.descricao}
              onChange={(e) => set('descricao', e.target.value)}
              placeholder="Contexto geral do projeto, objetivos, observações..."
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit">
            {initial ? 'Salvar alterações' : 'Criar projeto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
