import React, { useMemo, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, List, Search, SlidersHorizontal, X } from 'lucide-react';
import {
  CoffeeCategory,
  CoffeeRecord,
  FlavorTag,
  SOURCE_TYPE_LABELS,
  SourceType,
} from '../types/coffee';
import { getDateKey, isSameMonth } from '../utils/formatters';
import { CoffeeRecordCard } from './CoffeeRecordCard';

export type HistorySubTab = 'list' | 'calendar';

interface HistoryViewProps {
  records: CoffeeRecord[];
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  activeSubTab: HistorySubTab;
  onSubTabChange: (tab: HistorySubTab) => void;
  onSelectRecord: (record: CoffeeRecord) => void;
}

type TimeRangeFilter = 'ALL' | 'WEEK' | 'MONTH' | 'CUSTOM';

export const HistoryView: React.FC<HistoryViewProps> = ({
  records,
  categories,
  tags,
  activeSubTab,
  onSubTabChange,
  onSelectRecord,
}) => {
  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPanelOpen, setFilterPanelOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('ALL');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | 'ALL'>('ALL');
  const [selectedSource, setSelectedSource] = useState<SourceType | 'ALL'>('ALL');
  const [selectedTagId, setSelectedTagId] = useState<number | 'ALL'>('ALL');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Calendar state
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(null);

  const tagMap = useMemo(() => new Map(tags.map((t) => [t.id, t.name])), [tags]);
  const categoryMap = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (timeRange !== 'ALL') count++;
    if (selectedCategoryId !== 'ALL') count++;
    if (selectedSource !== 'ALL') count++;
    if (selectedTagId !== 'ALL') count++;
    if (minPrice.trim() !== '' || maxPrice.trim() !== '') count++;
    return count;
  }, [timeRange, selectedCategoryId, selectedSource, selectedTagId, minPrice, maxPrice]);

  const clearFilters = () => {
    setTimeRange('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
    setSelectedCategoryId('ALL');
    setSelectedSource('ALL');
    setSelectedTagId('ALL');
    setMinPrice('');
    setMaxPrice('');
  };

  const filteredListRecords = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const minP = minPrice.trim() === '' ? null : Number(minPrice);
    const maxP = maxPrice.trim() === '' ? null : Number(maxPrice);

    return records
      .filter((r) => {
        if (q) {
          const tagText = r.tagIds
            .map((id) => tagMap.get(id) ?? '')
            .join(' ')
            .toLowerCase();
          const match =
            r.coffeeName.toLowerCase().includes(q) ||
            r.brandShop.toLowerCase().includes(q) ||
            r.remark.toLowerCase().includes(q) ||
            tagText.includes(q);
          if (!match) return false;
        }

        if (timeRange === 'WEEK') {
          if (now - r.drinkTime > 7 * 86400000) return false;
        } else if (timeRange === 'MONTH') {
          if (!isSameMonth(r.drinkTime, now)) return false;
        } else if (timeRange === 'CUSTOM') {
          if (customStartDate) {
            const startMs = new Date(`${customStartDate}T00:00:00`).getTime();
            if (r.drinkTime < startMs) return false;
          }
          if (customEndDate) {
            const endMs = new Date(`${customEndDate}T23:59:59`).getTime();
            if (r.drinkTime > endMs) return false;
          }
        }

        if (selectedCategoryId !== 'ALL' && r.categoryId !== selectedCategoryId) return false;
        if (selectedSource !== 'ALL' && r.sourceType !== selectedSource) return false;
        if (selectedTagId !== 'ALL' && !r.tagIds.includes(selectedTagId)) return false;

        if (minP !== null && !Number.isNaN(minP)) {
          if (r.price === null || r.price < minP) return false;
        }
        if (maxP !== null && !Number.isNaN(maxP)) {
          if (r.price === null || r.price > maxP) return false;
        }

        return true;
      })
      .sort((a, b) => b.drinkTime - a.drinkTime);
  }, [
    records,
    searchQuery,
    tagMap,
    timeRange,
    customStartDate,
    customEndDate,
    selectedCategoryId,
    selectedSource,
    selectedTagId,
    minPrice,
    maxPrice,
  ]);

  // Calendar mapping
  const recordsByDateKey = useMemo(() => {
    const map = new Map<string, CoffeeRecord[]>();
    for (const r of records) {
      const key = getDateKey(new Date(r.drinkTime));
      const existing = map.get(key) ?? [];
      existing.push(r);
      map.set(key, existing);
    }
    for (const [, list] of map) {
      list.sort((a, b) => b.drinkTime - a.drinkTime);
    }
    return map;
  }, [records]);

  const calendarCells = useMemo(() => {
    const firstDayOfMonth = new Date(calYear, calMonth, 1);
    const startWeekday = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const cells: Array<{ day: number | null; dateKey: string | null }> = [];

    for (let i = 0; i < startWeekday; i++) {
      cells.push({ day: null, dateKey: null });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const key = getDateKey(new Date(calYear, calMonth, d));
      cells.push({ day: d, dateKey: key });
    }
    while (cells.length % 7 !== 0) {
      cells.push({ day: null, dateKey: null });
    }
    return cells;
  }, [calYear, calMonth]);

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalYear((y) => y - 1);
      setCalMonth(11);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalYear((y) => y + 1);
      setCalMonth(0);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const selectedDayRecords = selectedDateKey ? recordsByDateKey.get(selectedDateKey) ?? [] : [];
  const todayKey = getDateKey(today);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C211A] dark:text-[#F4EDE4]">
            全部手记
          </h2>
          <p className="mt-0.5 text-xs text-[#7A6859] dark:text-[#9E8C7C]">
            共记录 {records.length} 杯咖啡足迹
          </p>
        </div>

        <div className="inline-flex p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
          <button
            type="button"
            onClick={() => onSubTabChange('list')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'list'
                ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                : 'text-[#6E5C4E] dark:text-[#B8A898]'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            列表视图
          </button>
          <button
            type="button"
            onClick={() => onSubTabChange('calendar')}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap ${
              activeSubTab === 'calendar'
                ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                : 'text-[#6E5C4E] dark:text-[#B8A898]'
            }`}
          >
            <CalendarIcon className="w-3.5 h-3.5" />
            日历视图
          </button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="检索咖啡名称、品牌、备注或风味标签"
                className="w-full h-11 pl-10 pr-9 rounded-xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] text-sm text-[#2C211A] dark:text-[#F4EDE4] placeholder:text-[#A39181] focus:outline-none focus:border-[#7C4D2B] dark:focus:border-[#C89463]"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="清除搜索"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#8C7A6B] hover:text-[#2C211A] dark:hover:text-[#F4EDE4]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => setFilterPanelOpen((o) => !o)}
              className={`min-h-[44px] px-4 rounded-xl border text-xs font-medium inline-flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0 ${
                filterPanelOpen || activeFilterCount > 0
                  ? 'bg-[#7C4D2B] border-[#7C4D2B] text-white dark:bg-[#C89463] dark:border-[#C89463] dark:text-[#16120F]'
                  : 'bg-[#FFFFFF] dark:bg-[#211B16] border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#CBBBA9]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              筛选{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
          </div>

          {filterPanelOpen && (
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
                  多维筛选条件
                </span>
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="text-xs font-medium text-[#7C4D2B] dark:text-[#C89463] hover:underline"
                  >
                    重置筛选
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                <div>
                  <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                    时间段
                  </label>
                  <select
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as TimeRangeFilter)}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                  >
                    <option value="ALL">全部时间</option>
                    <option value="WEEK">最近 7 天</option>
                    <option value="MONTH">本月</option>
                    <option value="CUSTOM">自定义起止日期</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                    咖啡品类
                  </label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) =>
                      setSelectedCategoryId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                  >
                    <option value="ALL">全部品类</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                    获取来源
                  </label>
                  <select
                    value={selectedSource}
                    onChange={(e) => setSelectedSource(e.target.value as SourceType | 'ALL')}
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                  >
                    <option value="ALL">全部来源</option>
                    {(['SHOP', 'TAKEOUT', 'HOMEMADE', 'INSTANT'] as SourceType[]).map((st) => (
                      <option key={st} value={st}>
                        {SOURCE_TYPE_LABELS[st]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                    风味标签
                  </label>
                  <select
                    value={selectedTagId}
                    onChange={(e) =>
                      setSelectedTagId(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))
                    }
                    className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                  >
                    <option value="ALL">全部标签</option>
                    {tags.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {timeRange === 'CUSTOM' && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                        开始日期
                      </label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                        结束日期
                      </label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs text-[#7A6859] dark:text-[#9E8C7C] mb-1">
                    价格区间 (元)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      placeholder="最低价"
                      className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                    />
                    <span className="text-xs text-[#7A6859]">—</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      placeholder="最高价"
                      className="w-full h-10 px-3 rounded-xl bg-[#FAF7F2] dark:bg-[#16120F] border border-[#E6DDD1] dark:border-[#382E26] font-mono-num text-xs text-[#2C211A] dark:text-[#F4EDE4]"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {filteredListRecords.length === 0 ? (
            <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-10 text-center">
              <p className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                没有找到符合条件的咖啡手记
              </p>
              <p className="mt-1 text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                尝试调整搜索关键词或重置筛选条件
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredListRecords.map((rec) => (
                <CoffeeRecordCard
                  key={rec.id}
                  record={rec}
                  category={categoryMap.get(rec.categoryId)}
                  tags={tags}
                  showDate
                  onClick={() => onSelectRecord(rec)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-mono-num text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
                {calYear}年 {calMonth + 1}月
              </h3>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCalYear(today.getFullYear());
                    setCalMonth(today.getMonth());
                    setSelectedDateKey(todayKey);
                  }}
                  className="min-h-[36px] px-3 rounded-lg text-xs font-medium bg-[#F3EDE4] dark:bg-[#29211B] text-[#7C4D2B] dark:text-[#C89463] hover:opacity-90"
                >
                  今天
                </button>
                <button
                  type="button"
                  aria-label="上个月"
                  onClick={handlePrevMonth}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label="下个月"
                  onClick={handleNextMonth}
                  className="min-h-[36px] min-w-[36px] flex items-center justify-center rounded-lg border border-[#E6DDD1] dark:border-[#382E26] text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center text-xs text-[#7A6859] dark:text-[#9E8C7C] pb-2">
              {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                <div key={w} className="py-1 font-medium">
                  {w}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5">
              {calendarCells.map((cell, idx) => {
                if (!cell.day || !cell.dateKey) {
                  return <div key={idx} className="h-12" />;
                }
                const dayRecs = recordsByDateKey.get(cell.dateKey) ?? [];
                const hasRecords = dayRecs.length > 0;
                const isSelected = selectedDateKey === cell.dateKey;
                const isToday = cell.dateKey === todayKey;

                return (
                  <button
                    key={cell.dateKey}
                    type="button"
                    onClick={() => setSelectedDateKey(cell.dateKey)}
                    className={`h-12 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors relative ${
                      isSelected
                        ? 'bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F]'
                        : isToday
                        ? 'bg-[#F3EDE4] dark:bg-[#2E251E] text-[#7C4D2B] dark:text-[#C89463] font-semibold'
                        : 'hover:bg-[#FAF7F2] dark:hover:bg-[#29211B] text-[#2C211A] dark:text-[#F4EDE4]'
                    }`}
                  >
                    <span className="font-mono-num text-sm leading-none">{cell.day}</span>
                    {hasRecords ? (
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected
                            ? 'bg-white dark:bg-[#16120F]'
                            : 'bg-[#7C4D2B] dark:bg-[#C89463]'
                        }`}
                        aria-label={`${dayRecs.length} 条记录`}
                      />
                    ) : (
                      <span className="w-1.5 h-1.5" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <p className="text-center text-xs text-[#7A6859] dark:text-[#9E8C7C]">
            点击带圆点标记的日期，弹窗查看当日咖啡手记
          </p>

          {selectedDateKey && (
            <div
              className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs sm:p-4"
              role="dialog"
              aria-modal="true"
            >
              <div className="w-full max-w-md max-h-[80vh] flex flex-col rounded-t-3xl sm:rounded-2xl bg-[#FAF7F2] dark:bg-[#1B1612] border border-[#E6DDD1] dark:border-[#382E26] shadow-2xl overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-[#E6DDD1] dark:border-[#382E26]">
                  <div>
                    <h4 className="font-mono-num text-sm font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
                      {selectedDateKey}
                    </h4>
                    <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                      当日共有 {selectedDayRecords.length} 条手记
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedDateKey(null)}
                    aria-label="关闭当日记录"
                    className="min-h-[38px] min-w-[38px] flex items-center justify-center rounded-xl text-[#7A6859] hover:bg-[#EFE7DC] dark:hover:bg-[#29211B]"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 overflow-y-auto space-y-2.5">
                  {selectedDayRecords.length === 0 ? (
                    <p className="py-8 text-center text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                      这一天还没有留下咖啡脚印。
                    </p>
                  ) : (
                    selectedDayRecords.map((rec) => (
                      <CoffeeRecordCard
                        key={rec.id}
                        record={rec}
                        category={categoryMap.get(rec.categoryId)}
                        tags={tags}
                        onClick={() => {
                          setSelectedDateKey(null);
                          onSelectRecord(rec);
                        }}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
