import React, { useEffect, useState } from 'react';
import { Coffee, Star } from 'lucide-react';
import {
  CoffeeCategory,
  CoffeeRecord,
  DRINK_TYPE_LABELS,
  FlavorTag,
  SOURCE_TYPE_LABELS,
} from '../types/coffee';
import { formatDateMD, formatPrice, formatTimeHM } from '../utils/formatters';

interface CoffeeRecordCardProps {
  record: CoffeeRecord;
  category?: CoffeeCategory;
  tags: FlavorTag[];
  showDate?: boolean;
  onClick: () => void;
}

export const CoffeeRecordCard: React.FC<CoffeeRecordCardProps> = ({
  record,
  category,
  tags,
  showDate = false,
  onClick,
}) => {
  const [imgError, setImgError] = useState(false);
  const firstImage = record.imgUriList[0];

  // 编辑记录更换图片后，重置上一张图片的加载失败状态
  useEffect(() => {
    setImgError(false);
  }, [firstImage]);
  const displayName = record.coffeeName.trim() || category?.name || '随记咖啡';
  const recordTags = record.tagIds
    .map((id) => tags.find((t) => t.id === id)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left group rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4 hover:border-[#C8B8A6] dark:hover:border-[#534438] active:scale-[0.995] transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[#7C4D2B]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4] truncate">
              {displayName}
            </h3>
            {record.price !== null && (
              <span className="font-mono-num text-base font-semibold text-[#7C4D2B] dark:text-[#C89463] shrink-0">
                {formatPrice(record.price)}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[#6E5C4E] dark:text-[#B8A898]">
            {record.brandShop.trim() && (
              <>
                <span className="font-medium text-[#4D3D31] dark:text-[#DECFC0]">
                  {record.brandShop}
                </span>
                <span aria-hidden="true">·</span>
              </>
            )}
            <span className="font-mono-num">
              {showDate ? `${formatDateMD(record.drinkTime)} ${formatTimeHM(record.drinkTime)}` : formatTimeHM(record.drinkTime)}
            </span>
            <span aria-hidden="true">·</span>
            <span>{DRINK_TYPE_LABELS[record.drinkType]}</span>
            {category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{category.name}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span>{SOURCE_TYPE_LABELS[record.sourceType]}</span>
          </div>

          {(record.starScore !== null || recordTags.length > 0) && (
            <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[#8C7A6B] dark:text-[#A39181]">
              {record.starScore !== null && (
                <span className="inline-flex items-center gap-1 font-mono-num text-[#7C4D2B] dark:text-[#C89463]">
                  <Star className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                  {record.starScore}.0
                </span>
              )}
              {record.starScore !== null && recordTags.length > 0 && (
                <span aria-hidden="true">·</span>
              )}
              {recordTags.length > 0 && (
                <span className="truncate max-w-full">
                  {recordTags.join(' · ')}
                </span>
              )}
            </div>
          )}

          {record.remark.trim() && (
            <p className="mt-2 text-xs leading-relaxed text-[#7A6859] dark:text-[#9E8C7C] line-clamp-2">
              {record.remark}
            </p>
          )}
        </div>

        {firstImage && (
          <div className="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-[#F3EDE4] dark:bg-[#29211B] border border-[#E6DDD1] dark:border-[#382E26]">
            {!imgError ? (
              <img
                src={firstImage}
                alt={displayName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#9E8C7A]">
                <Coffee className="w-6 h-6" aria-hidden="true" />
              </div>
            )}
          </div>
        )}
      </div>
    </button>
  );
};
