import React, { useEffect, useMemo, useState } from 'react';
import { Coffee, Edit3, Star, Trash2, X } from 'lucide-react';
import {
  CoffeeCategory,
  CoffeeRecord,
  DRINK_TYPE_LABELS,
  FlavorTag,
  REPURCHASE_LABELS,
  SOURCE_TYPE_LABELS,
} from '../types/coffee';
import { formatFullDateTime, formatPrice } from '../utils/formatters';
import { ConfirmDialog } from './ConfirmDialog';

interface RecordDetailModalProps {
  record: CoffeeRecord | null;
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  onClose: () => void;
  onEdit: (record: CoffeeRecord) => void;
  onDelete: (id: number) => void;
}

export const RecordDetailModal: React.FC<RecordDetailModalProps> = ({
  record,
  categories,
  tags,
  onClose,
  onEdit,
  onDelete,
}) => {
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [zoomedImg, setZoomedImg] = useState<string | null>(null);
  const [brokenImgs, setBrokenImgs] = useState<Record<number, boolean>>({});

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t.name])), [tags]);

  // 切换到另一条记录时，清空上一条记录留下的图片错误/缩放状态
  useEffect(() => {
    setConfirmDeleteOpen(false);
    setZoomedImg(null);
    setBrokenImgs({});
  }, [record?.id]);

  if (!record) return null;

  const category = categories.find((c) => c.id === record.categoryId);
  const displayName = record.coffeeName.trim() || category?.name || '随记咖啡';
  const recordTags = record.tagIds
    .map((id) => tagMap.get(id))
    .filter((n): n is string => Boolean(n));

  return (
    <>
      <div
        className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="record-detail-title"
      >
        <div className="w-full sm:max-w-lg max-h-[90vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF7F2] dark:bg-[#1B1612] border border-[#E6DDD1] dark:border-[#382E26] shadow-2xl overflow-hidden">
          <div className="sm:hidden flex justify-center pt-2.5 pb-1">
            <div className="w-10 h-1 rounded-full bg-[#D8CBB9] dark:bg-[#4B3D32]" />
          </div>

          <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E6DDD1] dark:border-[#382E26]">
            <h2
              id="record-detail-title"
              className="text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4] truncate"
            >
              咖啡手记详情
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="关闭详情"
              className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-[#6E5C4E] dark:text-[#B8A898] hover:bg-[#EFE7DC] dark:hover:bg-[#29211B] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div>
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="font-display text-2xl font-bold text-[#2C211A] dark:text-[#F4EDE4]">
                  {displayName}
                </h3>
                {record.price !== null && (
                  <span className="font-mono-num text-2xl font-semibold text-[#7C4D2B] dark:text-[#C89463] shrink-0">
                    {formatPrice(record.price)}
                  </span>
                )}
              </div>
              <p className="mt-1.5 text-sm text-[#6E5C4E] dark:text-[#B8A898]">
                {record.brandShop.trim() ? `${record.brandShop} · ` : ''}
                <span className="font-mono-num">{formatFullDateTime(record.drinkTime)}</span>
              </p>
            </div>

            {record.imgUriList.length > 0 && (
              <div className="grid grid-cols-3 gap-2.5">
                {record.imgUriList.map((uri, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => !brokenImgs[idx] && setZoomedImg(uri)}
                    className="aspect-square rounded-xl overflow-hidden bg-[#EFE7DC] dark:bg-[#29211B] border border-[#E6DDD1] dark:border-[#382E26] focus-visible:outline-2 focus-visible:outline-[#7C4D2B]"
                  >
                    {!brokenImgs[idx] ? (
                      <img
                        src={uri}
                        alt={`${displayName} 配图 ${idx + 1}`}
                        referrerPolicy="no-referrer"
                        onError={() => setBrokenImgs((prev) => ({ ...prev, [idx]: true }))}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#9E8C7A]">
                        <Coffee className="w-6 h-6" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}

            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[#7A6859] dark:text-[#9E8C7C]">品类与温度</span>
                <span className="font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                  {category?.name ?? '未分类'} · {DRINK_TYPE_LABELS[record.drinkType]}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[#7A6859] dark:text-[#9E8C7C]">获取来源</span>
                <span className="font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                  {SOURCE_TYPE_LABELS[record.sourceType]}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-sm">
                <span className="text-[#7A6859] dark:text-[#9E8C7C]">回购意向</span>
                <span className="font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                  {REPURCHASE_LABELS[record.repurchaseStatus]}
                </span>
              </div>
              {record.starScore !== null && (
                <div className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="text-[#7A6859] dark:text-[#9E8C7C]">个人评分</span>
                  <span className="inline-flex items-center gap-1 font-mono-num font-medium text-[#7C4D2B] dark:text-[#C89463]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < (record.starScore ?? 0)
                            ? 'fill-current text-[#7C4D2B] dark:text-[#C89463]'
                            : 'text-[#D8CBB9] dark:text-[#4B3D32]'
                        }`}
                      />
                    ))}
                    <span className="ml-1">{record.starScore}/5</span>
                  </span>
                </div>
              )}
              {recordTags.length > 0 && (
                <div className="flex items-start justify-between gap-4 px-4 py-3 text-sm">
                  <span className="text-[#7A6859] dark:text-[#9E8C7C] shrink-0">风味感受</span>
                  <span className="text-right font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                    {recordTags.join(' · ')}
                  </span>
                </div>
              )}
            </div>

            {record.remark.trim() && (
              <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
                <p className="text-xs font-medium text-[#7A6859] dark:text-[#9E8C7C] mb-1.5">
                  手记随笔
                </p>
                <p className="text-sm leading-relaxed text-[#2C211A] dark:text-[#F4EDE4] whitespace-pre-wrap">
                  {record.remark}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 px-5 py-4 border-t border-[#E6DDD1] dark:border-[#382E26] bg-[#FFFFFF] dark:bg-[#211B16]">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E6DDD1] dark:border-[#382E26] text-sm font-medium text-[#B93829] hover:bg-[#B93829]/10 transition-colors inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Trash2 className="w-4 h-4" />
              删除
            </button>
            <button
              type="button"
              onClick={() => onEdit(record)}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-sm font-medium hover:opacity-95 transition-opacity inline-flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <Edit3 className="w-4 h-4" />
              编辑这条手记
            </button>
          </div>
        </div>
      </div>

      {zoomedImg && (
        <div
          onClick={() => setZoomedImg(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
        >
          <img
            src={zoomedImg}
            alt={displayName}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[85vh] rounded-2xl object-contain"
          />
        </div>
      )}

      <ConfirmDialog
        open={confirmDeleteOpen}
        title="删除这条咖啡记录？"
        message="删除后将同步移除该记录的本地压缩配图且无法恢复。"
        confirmLabel="确认删除"
        cancelLabel="暂不删除"
        danger
        onConfirm={() => {
          setConfirmDeleteOpen(false);
          onDelete(record.id);
        }}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </>
  );
};
