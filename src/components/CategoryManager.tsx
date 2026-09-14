import { useState, type FC } from 'react';
import {
  Tags,
  Plus,
  Trash2,
  Palette,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Category, Note, AppUser } from '../types';
import {
  CATEGORY_COLOR_OPTIONS,
  getCategoryStyle
} from '../utils/categoryStyles';
import {
  createCategory,
  deleteCategory
} from '../services/categoriesService';

interface CategoryManagerProps {
  categories: Category[];
  notes: Note[];
  currentUser: AppUser | null;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const CategoryManager: FC<CategoryManagerProps> = ({
  categories,
  notes,
  currentUser,
  onShowToast
}) => {
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string>('sky');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const actor = currentUser
    ? { uid: currentUser.uid, name: currentUser.displayName || undefined, email: currentUser.email || undefined }
    : undefined;

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      onShowToast('Informe o nome da categoria.', 'error');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())) {
      onShowToast('Já existe uma categoria com esse nome.', 'error');
      return;
    }
    setIsSubmitting(true);
    try {
      await createCategory(trimmed, newColor, actor);
      onShowToast(`Categoria "${trimmed}" criada com sucesso!`);
      setNewName('');
    } catch {
      onShowToast('Erro ao criar categoria no Firebase.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (cat: Category) => {
    if (cat.id.startsWith('cat-default-')) {
      onShowToast('Categorias padrão não podem ser excluídas.', 'error');
      return;
    }
    const count = notes.filter((n) => n.category === cat.name).length;
    const warning = count > 0
      ? `\n\n⚠️ ${count} evento(s) utilizam esta categoria. Ao excluir, esses eventos ficarão sem categoria.`
      : '';
    const confirmed = window.confirm(
      `Tem certeza que deseja excluir a categoria "${cat.name}"?${warning}`
    );
    if (!confirmed) return;

    deleteCategory(cat.id, cat.name, actor)
      .then(() => onShowToast(`Categoria "${cat.name}" excluída.`))
      .catch(() => onShowToast('Erro ao excluir categoria.', 'error'));
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
            <Tags className="h-4 w-4 text-amber-400" />
            Cadastro de Categorias
          </h2>
          <p className="text-[11px] text-zinc-400 mt-0.5">
            Categorias disponíveis nos formulários e relatórios.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          {categories.length} categoria(s)
        </span>
      </div>

      {/* Create form */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck className="h-3.5 w-3.5 text-amber-400" />
          <span className="text-xs font-semibold text-zinc-300">Nova Categoria</span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome da categoria..."
            className="flex-1 rounded-xl border border-zinc-700 bg-[#1a1a1e] px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-amber-500 focus:outline-none transition-colors"
          />
          <button
            onClick={handleCreate}
            disabled={isSubmitting || !newName.trim()}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-amber-900/30 transition active:scale-95 disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            {isSubmitting ? 'Criando...' : 'Criar'}
          </button>
        </div>
        {/* Color picker */}
        <div className="mt-3 flex items-center gap-2">
          <Palette className="h-3.5 w-3.5 text-zinc-400" />
          <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider mr-1">Cor</span>
          <div className="flex gap-1.5">
            {CATEGORY_COLOR_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setNewColor(opt.key)}
                title={opt.label}
                className={`h-6 w-6 rounded-full border-2 transition-all active:scale-90 ${
                  getCatStyleClass(opt.key)
                } ${newColor === opt.key ? 'border-white ring-2 ring-white/40 scale-110' : 'border-transparent hover:scale-110'}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Category list */}
      <div className="flex flex-col gap-2">
        {categories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/40 p-8 text-center text-zinc-400">
            <Tags className="mx-auto h-8 w-8 text-zinc-600 mb-2" />
            <p className="text-sm font-medium text-zinc-300">Nenhuma categoria cadastrada</p>
          </div>
        ) : (
          categories.map((cat) => {
            const count = notes.filter((n) => n.category === cat.name).length;
            const style = getCategoryStyle(cat.name);
            return (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-zinc-800 bg-[#161619]/90 px-3 py-2.5 transition-all hover:border-zinc-700"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className={`h-3 w-3 rounded-full shrink-0 ${style.dot}`} />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-zinc-100 truncate">{cat.name}</span>
                    <div className="flex items-center gap-2 text-[10px] text-zinc-500">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {count} evento(s)
                      </span>
                      {cat.createdBy && (
                        <span>por {cat.createdBy}</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(cat)}
                  title="Excluir categoria"
                  className="rounded-lg p-2 text-zinc-400 transition hover:bg-rose-950/50 hover:text-rose-400 active:scale-95"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

function getCatStyleClass(color: string): string {
  const MAP: Record<string, string> = {
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    violet: 'bg-violet-500',
    rose: 'bg-rose-500',
    amber: 'bg-amber-500',
    teal: 'bg-teal-500',
    cyan: 'bg-cyan-500',
    fuchsia: 'bg-fuchsia-500'
  };
  return MAP[color] || 'bg-sky-500';
}
