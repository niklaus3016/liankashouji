import React, { useMemo, useRef, useState } from 'react';
import { ImagePlus, Plus, Star, Trash2, X } from 'lucide-react';
import {
  CoffeeCategory,
  CoffeeRecord,
  DRINK_TYPE_LABELS,
  DrinkType,
  FlavorTag,
  REPURCHASE_LABELS,
  RepurchaseStatus,
  SOURCE_TYPE_LABELS,
  SourceType,
} from '../types/coffee';
import { compressImageFile } from '../utils/imageCompress';
import { toDatetimeLocalValue } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

interface RecordFormModalProps {
  open: boolean;
  editingRecord?: CoffeeRecord | null;
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  existingBrands: string[];
  onAddCategory: (name: string) => Promise<CoffeeCategory>;
  onAddTag: (name: string) => Promise<FlavorTag>;
  onSave: (payload: Omit<CoffeeRecord, 'id'> | CoffeeRecord) => Promise<void>;
  onClose: () => void;
}

interface FormState {
  coffeeName: string;
  brandShop: string;
  priceStr: string;
  drinkTimeStr: string;
  drinkType: DrinkType;
  categoryId: number;
  sourceType: SourceType;
  starScore: number | null;
  repurchaseStatus: RepurchaseStatus;
  remark: string;
  imgUriList: string[];
  tagIds: number[];
}

function sameStringArray(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

function sameNumberArray(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((item, index) => item === b[index]);
}

export const RecordFormModal: React.FC<RecordFormModalProps> = ({
  open,
  editingRecord,
  categories,
  tags,
  existingBrands,
  onAddCategory,
  onAddTag,
  onSave,
  onClose,
}) => {
  const defaultCategoryId = categories[0]?.id ?? 1;

  const initialState: FormState = useMemo(() => {
    if (editingRecord) {
      return {
        coffeeName: editingRecord.coffeeName,
        brandShop: editingRecord.brandShop,
        priceStr: editingRecord.price !== null ? String(editingRecord.price) : '',
        drinkTimeStr: toDatetimeLocalValue(editingRecord.drinkTime),
        drinkType: editingRecord.drinkType,
        categoryId: editingRecord.categoryId,
        sourceType: editingRecord.sourceType,
        starScore: editingRecord.starScore,
        repurchaseStatus: editingRecord.repurchaseStatus,
        remark: editingRecord.remark,
        imgUriList: [...editingRecord.imgUriList],
        tagIds: [...editingRecord.tagIds],
      };
    }
    return {
      coffeeName: '',
      brandShop: '',
      priceStr: '',
      drinkTimeStr: toDatetimeLocalValue(Date.now()),
      drinkType: 'HOT',
      categoryId: defaultCategoryId,
      sourceType: 'SHOP',
      starScore: null,
      repurchaseStatus: 'MAYBE',
      remark: '',
      imgUriList: [],
      tagIds: [],
    };
  }, [editingRecord, defaultCategoryId]);

  const [form, setForm] = useState<FormState>(initialState);
  const [brandDropdownOpen, setBrandDropdownOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [showNewTagInput, setShowNewTagInput] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [confirmUnsavedOpen, setConfirmUnsavedOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  // 逐字段比较，避免每次输入都对包含 base64 图片的表单做 JSON.stringify
  const isDirty =
    form.coffeeName !== initialState.coffeeName ||
    form.brandShop !== initialState.brandShop ||
    form.priceStr !== initialState.priceStr ||
    form.drinkTimeStr !== initialState.drinkTimeStr ||
    form.drinkType !== initialState.drinkType ||
    form.categoryId !== initialState.categoryId ||
    form.sourceType !== initialState.sourceType ||
    form.starScore !== initialState.starScore ||
    form.repurchaseStatus !== initialState.repurchaseStatus ||
    form.remark !== initialState.remark ||
    !sameStringArray(form.imgUriList, initialState.imgUriList) ||
    !sameNumberArray(form.tagIds, initialState.tagIds);

  const filteredBrands = existingBrands.filter(
    (b) =>
      b.trim() !== '' &&
      b.toLowerCase().includes(form.brandShop.trim().toLowerCase()) &&
      b !== form.brandShop
  );

  const handleCloseAttempt = () => {
    if (isDirty) {
      setConfirmUnsavedOpen(true);
    } else {
      onClose();
    }
  };

  const handlePhotoPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (files.length === 0) return;

    setPhotoError(null);
    const remainingSlots = 3 - form.imgUriList.length;
    if (remainingSlots <= 0) {
      setPhotoError('每条手记最多添加 3 张压缩配图。');
      return;
    }

    const toProcess = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setPhotoError(`已自动选取前 ${remainingSlots} 张图片（单条最多 3 张）。`);
    }

    setCompressing(true);
    const compressed: string[] = [];
    let failedCount = 0;
    try {
      for (const file of toProcess) {
        try {
          compressed.push(await compressImageFile(file));
        } catch {
          failedCount += 1;
        }
      }
      if (compressed.length > 0) {
        setForm((prev) => ({
          ...prev,
          imgUriList: [...prev.imgUriList, ...compressed].slice(0, 3),
        }));
      }
      if (failedCount > 0) {
        setPhotoError(`${failedCount} 张图片处理失败，请重试或换一张图片。`);
      }
    } finally {
      setCompressing(false);
    }
  };

  const handleCreateCategory = async () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setForm((prev) => ({ ...prev, categoryId: existing.id }));
      setNewCategoryName('');
      setShowNewCategoryInput(false);
      return;
    }
    const created = await onAddCategory(trimmed);
    setForm((prev) => ({ ...prev, categoryId: created.id }));
    setNewCategoryName('');
    setShowNewCategoryInput(false);
  };

  const handleCreateTag = async () => {
    const trimmed = newTagName.trim();
    if (!trimmed) return;
    const existing = tags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) {
      setForm((prev) => ({
        ...prev,
        tagIds: prev.tagIds.includes(existing.id) ? prev.tagIds : [...prev.tagIds, existing.id],
      }));
      setNewTagName('');
      setShowNewTagInput(false);
      return;
    }
    const created = await onAddTag(trimmed);
    setForm((prev) => ({ ...prev, tagIds: [...prev.tagIds, created.id] }));
    setNewTagName('');
    setShowNewTagInput(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (saving) return;
    setSaving(true);
    setSaveError(null);
    try {
      const parsedPrice = form.priceStr.trim() === '' ? null : Number(form.priceStr.trim());
      const validPrice =
        parsedPrice !== null && !Number.isNaN(parsedPrice) && parsedPrice >= 0
          ? Math.round(parsedPrice * 100) / 100
          : null;
      const parsedTime = Date.parse(form.drinkTimeStr);
      const drinkTime = Number.isNaN(parsedTime) ? Date.now() : parsedTime;
      const now = Date.now();

      if (editingRecord) {
        await onSave({
          ...editingRecord,
          coffeeName: form.coffeeName.trim(),
          brandShop: form.brandShop.trim(),
          price: validPrice,
          drinkTime,
          drinkType: form.drinkType,
          categoryId: form.categoryId,
          sourceType: form.sourceType,
          starScore: form.starScore,
          repurchaseStatus: form.repurchaseStatus,
          remark: form.remark.trim(),
          imgUriList: form.imgUriList,
          tagIds: form.tagIds,
          updateTs: now,
        });
      } else {
        await onSave({
          coffeeName: form.coffeeName.trim(),
          brandShop: form.brandShop.trim(),
          price: validPrice,
          drinkTime,
          drinkType: form.drinkType,
          categoryId: form.categoryId,
          sourceType: form.sourceType,
          starScore: form.starScore,
          repurchaseStatus: form.repurchaseStatus,
          remark: form.remark.trim(),
          imgUriList: form.imgUriList,
          tagIds: form.tagIds,
          createTs: now,
          updateTs: now,
        });
      }
      onClose();
    } catch {
      setSaveError('保存失败，请检查浏览器存储空间后重试。');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-form-title"
      >
        <form
          onSubmit={handleSubmit}
          className="w-full sm:max-w-xl max-h-[92vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF7F2] dark:bg-[#1B1612] border border-[#E6DDD1] dark:border-[#382E26] shadow-2xl overflow-hidden"
        >
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#D8CBB9] dark:bg-[#4B3D32]" />
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6DDD1] dark:border-[#382E26]">
            <div>
              <h2
                id="record-form-title"
                className="text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]"
              >
                {editingRecord ? '编辑咖啡手记' : '记录一杯咖啡'}
              </h2>
              <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                所有字段均可留空，怎么轻松怎么记
              </p>
            </div>
            <button
              type="button"
              onClick={handleCloseAttempt}
              aria-label="关闭表单"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#6E5C4E] dark:text-[#B8A898] hover:bg-[#EFE7DC] dark:hover:bg-[#29211B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* 1. 咖啡名称 & 3. 价格 */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  咖啡名称
                </label>
                <input
                  type="text"
                  value={form.coffeeName}
                  onChange={(e) => setForm((p) => ({ ...p, coffeeName: e.target.value }))}
                  placeholder="例：耶加雪菲美式、生椰拿铁"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4] placeholder:text-[#A39181] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463]"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  价格 (元)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={form.priceStr}
                  onChange={(e) => setForm((p) => ({ ...p, priceStr: e.target.value }))}
                  placeholder="可空"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-sm text-[#2C211A] dark:text-[#F4EDE4] placeholder:text-[#A39181] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463]"
                />
              </div>
            </div>

            {/* 2. 品牌/店铺 (本地历史联想) & 4. 饮用时间 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="relative">
                <label className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  品牌 / 店铺
                </label>
                <input
                  type="text"
                  value={form.brandShop}
                  onFocus={() => setBrandDropdownOpen(true)}
                  onBlur={() => setTimeout(() => setBrandDropdownOpen(false), 150)}
                  onChange={(e) => {
                    setForm((p) => ({ ...p, brandShop: e.target.value }));
                    setBrandDropdownOpen(true);
                  }}
                  placeholder="例：Manner、自家吧台"
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4] placeholder:text-[#A39181] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463]"
                />
                {brandDropdownOpen && filteredBrands.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-20 max-h-40 overflow-y-auto rounded-xl bg-[#FFFFFF] dark:bg-[#261F19] border border-[#E6DDD1] dark:border-[#382E26] shadow-lg py-1">
                    {filteredBrands.slice(0, 8).map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onMouseDown={() => {
                          setForm((p) => ({ ...p, brandShop: brand }));
                          setBrandDropdownOpen(false);
                        }}
                        className="w-full text-left px-3.5 py-2 text-sm text-[#2C211A] dark:text-[#F4EDE4] hover:bg-[#F3EDE4] dark:hover:bg-[#322921]"
                      >
                        {brand}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  饮用时间
                </label>
                <input
                  type="datetime-local"
                  value={form.drinkTimeStr}
                  onChange={(e) => setForm((p) => ({ ...p, drinkTimeStr: e.target.value }))}
                  className="w-full h-11 px-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-sm text-[#2C211A] dark:text-[#F4EDE4] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463]"
                />
              </div>
            </div>

            {/* 5. 饮用类型 & 7. 来源 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  饮用类型
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
                  {(['HOT', 'ICE', 'NORMAL'] as DrinkType[]).map((dt) => (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, drinkType: dt }))}
                      className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        form.drinkType === dt
                          ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                          : 'text-[#6E5C4E] dark:text-[#B8A898] hover:text-[#2C211A] dark:hover:text-[#F4EDE4]'
                      }`}
                    >
                      {DRINK_TYPE_LABELS[dt]}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  来源
                </span>
                <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
                  {(['SHOP', 'TAKEOUT', 'HOMEMADE', 'INSTANT'] as SourceType[]).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, sourceType: st }))}
                      className={`min-h-[38px] px-1 rounded-lg text-xs font-medium transition-colors whitespace-nowrap truncate ${
                        form.sourceType === st
                          ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                          : 'text-[#6E5C4E] dark:text-[#B8A898] hover:text-[#2C211A] dark:hover:text-[#F4EDE4]'
                      }`}
                    >
                      {st === 'INSTANT' ? '速溶' : SOURCE_TYPE_LABELS[st]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 6. 咖啡品类 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9]">
                  咖啡品类
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewCategoryInput((v) => !v)}
                  className="text-xs font-medium text-[#7C4D2B] dark:text-[#C89463] hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  新增品类
                </button>
              </div>
              {showNewCategoryInput && (
                <div className="flex items-center gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="输入自定义品类名称"
                    className="flex-1 h-10 px-3 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateCategory}
                    className="h-10 px-3.5 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-xs font-medium whitespace-nowrap"
                  >
                    添加
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => {
                  const active = form.categoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, categoryId: cat.id }))}
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                        active
                          ? 'bg-[#7C4D2B] border-[#7C4D2B] text-white dark:bg-[#C89463] dark:border-[#C89463] dark:text-[#16120F]'
                          : 'bg-[#FFFFFF] dark:bg-[#211B16] border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B]'
                      }`}
                    >
                      {cat.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 8. 风味标签 */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9]">
                  风味标签（可多选）
                </span>
                <button
                  type="button"
                  onClick={() => setShowNewTagInput((v) => !v)}
                  className="text-xs font-medium text-[#7C4D2B] dark:text-[#C89463] hover:underline inline-flex items-center gap-0.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  自建标签
                </button>
              </div>
              {showNewTagInput && (
                <div className="flex items-center gap-2 mb-2.5">
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="输入自定义风味标签"
                    className="flex-1 h-10 px-3 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4]"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTag}
                    className="h-10 px-3.5 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-xs font-medium whitespace-nowrap"
                  >
                    添加
                  </button>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = form.tagIds.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          tagIds: selected
                            ? p.tagIds.filter((id) => id !== tag.id)
                            : [...p.tagIds, tag.id],
                        }))
                      }
                      className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors whitespace-nowrap ${
                        selected
                          ? 'bg-[#EFE2D2] dark:bg-[#3A2D22] border-[#7C4D2B] dark:border-[#C89463] text-[#7C4D2B] dark:text-[#C89463]'
                          : 'bg-[#FFFFFF] dark:bg-[#211B16] border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B]'
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 9. 个人星级评分 & 10. 回购意向 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  个人评分（可选，再点取消）
                </span>
                <div className="flex items-center gap-1 h-11 px-3 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26]">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const active = (form.starScore ?? 0) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        aria-label={`${star} 星`}
                        onClick={() =>
                          setForm((p) => ({
                            ...p,
                            starScore: p.starScore === star ? null : star,
                          }))
                        }
                        className="p-1.5 rounded-lg hover:bg-[#F3EDE4] dark:hover:bg-[#29211B] transition-colors"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            active
                              ? 'fill-current text-[#7C4D2B] dark:text-[#C89463]'
                              : 'text-[#D8CBB9] dark:text-[#4B3D32]'
                          }`}
                        />
                      </button>
                    );
                  })}
                  <span className="ml-auto font-mono-num text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                    {form.starScore !== null ? `${form.starScore} 星` : '未评分'}
                  </span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                  回购意向
                </span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
                  {(['YES', 'MAYBE', 'NO'] as RepurchaseStatus[]).map((rs) => (
                    <button
                      key={rs}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, repurchaseStatus: rs }))}
                      className={`min-h-[38px] rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                        form.repurchaseStatus === rs
                          ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                          : 'text-[#6E5C4E] dark:text-[#B8A898] hover:text-[#2C211A] dark:hover:text-[#F4EDE4]'
                      }`}
                    >
                      {REPURCHASE_LABELS[rs]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 11. 备注 */}
            <div>
              <label className="block text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9] mb-1.5">
                手记备注
              </label>
              <textarea
                rows={3}
                value={form.remark}
                onChange={(e) => setForm((p) => ({ ...p, remark: e.target.value }))}
                placeholder="记录豆子产区、烘焙度、口感风味或此刻的心情..."
                className="w-full p-3.5 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4] placeholder:text-[#A39181] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463] resize-none"
              />
            </div>

            {/* 12. 添加配图 (系统PhotoPicker，无拍照入口，自动压缩，最多3张) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#5C4B3E] dark:text-[#CBBBA9]">
                  添加配图（最多 3 张 · 仅本地压缩存储）
                </span>
                <span className="font-mono-num text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                  {form.imgUriList.length}/3
                </span>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoPick}
                className="hidden"
              />

              <div className="grid grid-cols-3 gap-2.5">
                {form.imgUriList.map((uri, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-[#EFE7DC] dark:bg-[#29211B] border border-[#E6DDD1] dark:border-[#382E26]"
                  >
                    <img
                      src={uri}
                      alt={`已选配图 ${idx + 1}`}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`移除配图 ${idx + 1}`}
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          imgUriList: p.imgUriList.filter((_, i) => i !== idx),
                        }))
                      }
                      className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg bg-black/65 text-white flex items-center justify-center hover:bg-black/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                {form.imgUriList.length < 3 && (
                  <button
                    type="button"
                    disabled={compressing}
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border border-dashed border-[#CBBBA9] dark:border-[#4B3D32] bg-[#FFFFFF] dark:bg-[#211B16] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B] flex flex-col items-center justify-center gap-1.5 text-[#6E5C4E] dark:text-[#B8A898] transition-colors"
                  >
                    <ImagePlus className="w-5 h-5" />
                    <span className="text-xs">{compressing ? '压缩中...' : '从相册选取'}</span>
                  </button>
                )}
              </div>
              {photoError && (
                <p className="mt-1.5 text-xs text-[#B93829] dark:text-[#E57368]">{photoError}</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-t border-[#E6DDD1] dark:border-[#382E26] bg-[#FFFFFF] dark:bg-[#211B16]">
            {saveError && (
              <p className="w-full text-xs text-[#B93829] dark:text-[#E57368]">{saveError}</p>
            )}
            <button
              type="button"
              onClick={handleCloseAttempt}
              className="min-h-[44px] px-5 py-2.5 rounded-xl border border-[#E6DDD1] dark:border-[#382E26] text-sm font-medium text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B] transition-colors whitespace-nowrap"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={saving || compressing}
              className="flex-1 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-sm font-medium hover:opacity-95 disabled:opacity-50 transition-opacity whitespace-nowrap"
            >
              {saving ? '保存中...' : '保存手记'}
            </button>
          </div>
        </form>
      </div>

      <ConfirmDialog
        open={confirmUnsavedOpen}
        title="放弃未保存的手记内容？"
        message="当前编辑内容尚未保存，直接退出将丢失本次填写。"
        confirmLabel="放弃并退出"
        secondaryActionLabel="保存并退出"
        cancelLabel="继续编辑"
        danger
        onConfirm={() => {
          setConfirmUnsavedOpen(false);
          onClose();
        }}
        onSecondaryAction={() => {
          setConfirmUnsavedOpen(false);
          void handleSubmit();
        }}
        onCancel={() => setConfirmUnsavedOpen(false)}
      />
    </>
  );
};
