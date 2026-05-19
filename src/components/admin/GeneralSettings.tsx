import { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { Input } from '../shared/Input';
import { Button } from '../shared/Button';
import { useData } from '../../contexts/DataContext';

export function GeneralSettings() {
  const { settings, updateSettings } = useData();
  const [companyName, setCompanyName] = useState(settings.companyName);
  const [productTypes, setProductTypes] = useState<string[]>(settings.productTypes);
  const [newType, setNewType] = useState('');
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    updateSettings({ companyName, productTypes });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const addType = () => {
    if (!newType.trim() || productTypes.includes(newType.trim())) return;
    setProductTypes((prev) => [...prev, newType.trim()]);
    setNewType('');
  };

  const removeType = (t: string) => setProductTypes((prev) => prev.filter((p) => p !== t));

  return (
    <div className="space-y-6 max-w-lg">
      <h3 className="text-sm font-semibold text-slate-400 dark:text-white/60 uppercase tracking-wider">
        Configurações gerais
      </h3>

      <div className="bg-white dark:bg-[#2D2D2D] border border-slate-200 dark:border-white/8 rounded-2xl p-4 sm:p-6 space-y-5 shadow-sm dark:shadow-none">
        <Input
          label="Nome da empresa"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
        />

        {/* Product Types */}
        <div>
          <p className="text-xs font-medium text-slate-500 dark:text-white/60 mb-3">Tipos de produto</p>
          <ul className="space-y-2 mb-3">
            {productTypes.map((t) => (
              <li key={t} className="flex items-center justify-between bg-slate-50 dark:bg-white/5 rounded-lg px-3 py-2">
                <span className="text-sm text-slate-700 dark:text-white/80">{t}</span>
                <button
                  onClick={() => removeType(t)}
                  className="text-slate-300 dark:text-white/25 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                >
                  <Trash2 size={13} />
                </button>
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <input
              type="text"
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addType()}
              placeholder="Novo tipo de produto…"
              className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 py-1.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:border-[#CC0000]/50 transition-colors"
            />
            <button
              onClick={addType}
              className="p-1.5 bg-slate-100 dark:bg-white/5 hover:bg-[#CC0000]/10 dark:hover:bg-[#CC0000]/20 text-slate-400 dark:text-white/40 hover:text-[#CC0000] rounded-lg transition-colors"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={handleSave}>
            <Save size={14} />
            {saved ? 'Salvo!' : 'Salvar configurações'}
          </Button>
        </div>
      </div>
    </div>
  );
}

