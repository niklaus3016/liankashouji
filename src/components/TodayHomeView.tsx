import React, { useMemo, useState } from 'react';
import { Coffee, Plus } from 'lucide-react';
import { CoffeeCategory, CoffeeRecord, FlavorTag } from '../types/coffee';
import { isSameDay, isSameMonth } from '../utils/formatters';
import { CoffeeRecordCard } from './CoffeeRecordCard';

type QuickFilter = 'ALL' | 'HOT' | 'ICE' | 'HOMEMADE' | 'SHOP';

interface TodayHomeViewProps {
  records: CoffeeRecord[];
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  showHomeStats: boolean;
  onSelectRecord: (record: CoffeeRecord) => void;
  onQuickAdd: () => void;
}

const FILTER_OPTIONS: Array<{ key: QuickFilter; label: string }> = [
  { key: 'ALL', label: '全部' },
  { key: 'HOT', label: '热饮' },
  { key: 'ICE', label: '冰饮' },
  { key: 'HOMEMADE', label: '自制' },
  { key: 'SHOP', label: '门店购买' },
];

export const TodayHomeView: React.FC<TodayHomeViewProps> = ({
  records,
  categories,
  tags,
  showHomeStats,
  onSelectRecord,
  onQuickAdd,
}) => {
  const [filter, setFilter] = useState<QuickFilter>('ALL');
  const nowTs = Date.now();
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const { todayRecords, todayCount, todaySpend, monthCount, monthSpend } = useMemo(() => {
    const now = Date.now();
    const tRecords = records
      .filter((r) => isSameDay(r.drinkTime, now))
      .sort((a, b) => b.drinkTime - a.drinkTime);
    const mRecords = records.filter((r) => isSameMonth(r.drinkTime, now));

    const sumPrice = (arr: CoffeeRecord[]) =>
      arr.reduce((acc, item) => acc + (item.price ?? 0), 0);

    return {
      todayRecords: tRecords,
      todayCount: tRecords.length,
      todaySpend: sumPrice(tRecords),
      monthCount: mRecords.length,
      monthSpend: sumPrice(mRecords),
    };
  }, [records]);

  const filteredTodayRecords = useMemo(() => {
    return todayRecords.filter((r) => {
      if (filter === 'ALL') return true;
      if (filter === 'HOT') return r.drinkType === 'HOT';
      if (filter === 'ICE') return r.drinkType === 'ICE';
      if (filter === 'HOMEMADE') return r.sourceType === 'HOMEMADE';
      if (filter === 'SHOP') return r.sourceType === 'SHOP';
      return true;
    });
  }, [todayRecords, filter]);

  const todayDateLabel = new Date(nowTs).toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">{todayDateLabel}</p>
          <h2 className="font-display text-2xl font-bold text-[#2C211A] dark:text-[#F4EDE4] mt-0.5 text-balance">
            今日咖记
          </h2>
        </div>
      </div>

      {showHomeStats && (
        <section
          aria-label="今日与本月消费概览"
          className="grid grid-cols-2 gap-3"
        >
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
            <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">今日杯数</p>
            <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
              {todayCount}
              <span className="ml-1 text-xs font-normal text-[#7A6859] dark:text-[#9E8C7C]">杯</span>
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
            <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">今日花费</p>
            <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#7C4D2B] dark:text-[#C89463]">
              ¥{todaySpend % 1 === 0 ? todaySpend.toFixed(0) : todaySpend.toFixed(2)}
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
            <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">本月累计</p>
            <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
              {monthCount}
              <span className="ml-1 text-xs font-normal text-[#7A6859] dark:text-[#9E8C7C]">杯</span>
            </p>
          </div>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
            <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">本月花费</p>
            <p className="mt-1.5 font-mono-num text-2xl font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
              ¥{monthSpend % 1 === 0 ? monthSpend.toFixed(0) : monthSpend.toFixed(2)}
            </p>
          </div>
        </section>
      )}

      {/* 快捷筛选标签 */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {FILTER_OPTIONS.map((opt) => {
          const active = filter === opt.key;
          return (
            <button
              key={opt.key}
              type="button"
              onClick={() => setFilter(opt.key)}
              className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? 'bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F]'
                  : 'bg-[#EFE7DC] dark:bg-[#29211B] text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#E5DACB] dark:hover:bg-[#352A22]'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* 当日记录列表 */}
      {filteredTodayRecords.length === 0 ? (
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-10 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-[#F3EDE4] dark:bg-[#29211B] flex items-center justify-center text-[#7C4D2B] dark:text-[#C89463]">
            <Coffee className="w-6 h-6" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
            {todayRecords.length === 0 ? '今天还没有喝咖啡记录' : '当前筛选下暂无今日记录'}
          </h3>
          <p className="mt-1.5 text-sm text-[#7A6859] dark:text-[#9E8C7C]">
            {todayRecords.length === 0
              ? '端起杯子的时候，顺手记下今天的香气与温度吧。'
              : '切换筛选条件或记录一杯新的咖啡。'}
          </p>
          <button
            type="button"
            onClick={onQuickAdd}
            className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] text-sm font-medium hover:opacity-95 transition-opacity inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            记录一杯咖啡
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredTodayRecords.map((rec) => (
            <CoffeeRecordCard
              key={rec.id}
              record={rec}
              category={categoryMap.get(rec.categoryId)}
              tags={tags}
              onClick={() => onSelectRecord(rec)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
