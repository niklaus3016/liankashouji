import React, { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

export type DictionaryMode = 'brands' | 'categories' | 'tags';

interface DictionaryItem {
  id: number;
  name: string;
  isDefault: boolean;
}

interface TagCategoryManagerProps {
  mode: DictionaryMode;
  items: DictionaryItem[];
  onAdd: (name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  onBack: () => void;
}

const MODE_META: Record<
  DictionaryMode,
  { title: string; placeholder: string; duplicateMsg: string }
> = {
  brands: {
    title: '咖啡品牌管理',
    placeholder: '输入新咖啡品牌或店铺名称',
    duplicateMsg: '该咖啡品牌已存在',
  },
  categories: {
    title: '咖啡品类管理',
    placeholder: '输入新咖啡品类名称',
    duplicateMsg: '该咖啡品类已存在',
  },
  tags: {
    title: '咖啡风味管理',
    placeholder: '输入新风味标签名称',
    duplicateMsg: '该风味标签已存在',
  },
};

export const TagCategoryManager: React.FC<TagCategoryManagerProps> = ({
  mode,
  items,
  onAdd,
  onDelete,
  onBack,
}) => {
  const [newName, setNewName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const meta = MODE_META[mode];

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    setErrorMsg(null);

    if (items.some((item) => item.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg(meta.duplicateMsg);
      return;
    }

    await onAdd(trimmed);
    setNewName('');
  };

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-[#E6DDD1] dark:border-[#382E26]">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            aria-label="返回设置"
            className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#EFE7DC] dark:hover:bg-[#29211B]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h3 className="text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
            {meta.title}
          </h3>
        </div>
        <span className="font-mono-num text-xs text-[#7A6859] dark:text-[#9E8C7C]">
          共 {items.length} 项
        </span>
      </div>

      <div className="p-4 space-y-4">
        <form onSubmit={handleAdd} className="flex items-center gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder={meta.placeholder}
            className="flex-1 h-11 px-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4]"
          />
          <button
            type="submit"
            className="min-h-[44px] px-4 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-xs font-medium inline-flex items-center gap-1 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            新增
          </button>
        </form>
        {errorMsg && (
          <p className="text-xs text-[#B93829] dark:text-[#E57368]">{errorMsg}</p>
        )}

        <div className="rounded-2xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
          {items.map((item) => (
            <div key={item.id} className="flex items-center justify-between px-4 py-3">
              <span className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                {item.name}
              </span>
              {item.isDefault ? (
                <span className="text-xs text-[#8C7A6B] dark:text-[#9E8C7C]">系统预设</span>
              ) : (
                <button
                  type="button"
                  onClick={() => onDelete(item.id)}
                  aria-label={`删除 ${item.name}`}
                  className="min-h-[36px] px-2.5 rounded-lg text-xs text-[#B93829] hover:bg-[#B93829]/10 inline-flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  删除
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
