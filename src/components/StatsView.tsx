import React, { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { CoffeeCategory, CoffeeRecord } from '../types/coffee';
import { isSameMonth, isWithinCurrentWeek } from '../utils/formatters';

type StatsRange = 'WEEK' | 'MONTH' | 'ALL';

interface StatsViewProps {
  records: CoffeeRecord[];
  categories: CoffeeCategory[];
  onExportCsv: () => void;
}

export const StatsView: React.FC<StatsViewProps> = ({
  records,
  categories,
  onExportCsv,
}) => {
  const [range, setRange] = useState<StatsRange>('MONTH');

  const scopedRecords = useMemo(() => {
    const now = Date.now();
    if (range === 'ALL') return records;
    if (range === 'WEEK') return records.filter((r) => isWithinCurrentWeek(r.drinkTime, now));
    return records.filter((r) => isSameMonth(r.drinkTime, now));
  }, [records, range]);

  const stats = useMemo(() => {
    const totalCups = scopedRecords.length;
    const priced = scopedRecords.filter((r) => r.price !== null && r.price >= 0);
    const totalSpend = priced.reduce((acc, r) => acc + (r.price ?? 0), 0);
    const avgPrice = priced.length > 0 ? totalSpend / priced.length : 0;

    // Category distribution
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const catCount = new Map<string, number>();
    for (const r of scopedRecords) {
      const name = catMap.get(r.categoryId) ?? '其他';
      catCount.set(name, (catCount.get(name) ?? 0) + 1);
    }
    const categoryRanking = Array.from(catCount.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Top 3 brands
    const brandAgg = new Map<string, { count: number; spend: number }>();
    for (const r of scopedRecords) {
      const b = r.brandShop.trim();
      if (!b) continue;
      const cur = brandAgg.get(b) ?? { count: 0, spend: 0 };
      cur.count += 1;
      cur.spend += r.price ?? 0;
      brandAgg.set(b, cur);
    }
    const topBrands = Array.from(brandAgg.entries())
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count || b.spend - a.spend)
      .slice(0, 3);

    // DrinkType ratio
    let hot = 0;
    let ice = 0;
    let normal = 0;
    for (const r of scopedRecords) {
      if (r.drinkType === 'HOT') hot++;
      else if (r.drinkType === 'ICE') ice++;
      else normal++;
    }

    return {
      totalCups,
      totalSpend,
      avgPrice,
      pricedCount: priced.length,
      categoryRanking,
      topBrands,
      hot,
      ice,
      normal,
    };
  }, [scopedRecords, categories]);

  const rangeLabel = range === 'WEEK' ? '本周' : range === 'MONTH' ? '本月' : '全部时间';
  const formatMoney = (n: number) => (n % 1 === 0 ? n.toFixed(0) : n.toFixed(2));

  // SVG Donut math
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const totalForPie = Math.max(1, stats.hot + stats.ice + stats.normal);
  const hotLen = (stats.hot / totalForPie) * circumference;
  const iceLen = (stats.ice / totalForPie) * circumference;
  const normalLen = (stats.normal / totalForPie) * circumference;

  const maxCatCount = stats.categoryRanking[0]?.count ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#2C211A] dark:text-[#F4EDE4]">
            咖账统计
          </h2>
          <p className="mt-1 text-sm text-[#6E5C4E] dark:text-[#B8A898]">
            {rangeLabel}喝了{' '}
            <span className="font-mono-num font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
              {stats.totalCups}
            </span>{' '}
            杯咖啡，合计花费{' '}
            <span className="font-mono-num font-semibold text-[#7C4D2B] dark:text-[#C89463]">
              {formatMoney(stats.totalSpend)}
            </span>{' '}
            元
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
            {(['WEEK', 'MONTH', 'ALL'] as StatsRange[]).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRange(r)}
                className={`min-h-[38px] px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  range === r
                    ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                    : 'text-[#6E5C4E] dark:text-[#B8A898]'
                }`}
              >
                {r === 'WEEK' ? '本周' : r === 'MONTH' ? '本月' : '全部时间'}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={onExportCsv}
            className="min-h-[42px] px-4 py-2 rounded-xl border border-[#E6DDD1] dark:border-[#382E26] bg-[#FFFFFF] dark:bg-[#211B16] text-xs font-medium text-[#2C211A] dark:text-[#F4EDE4] hover:bg-[#F3EDE4] dark:hover:bg-[#29211B] inline-flex items-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Download className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
            导出 CSV
          </button>
        </div>
      </div>

      {/* 3 KPI Metrics */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-3.5">
          <p className="text-[11px] text-[#7A6859] dark:text-[#9E8C7C]">{rangeLabel}总杯数</p>
          <p className="mt-1.5 font-mono-num text-xl font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
            {stats.totalCups}
            <span className="ml-1 text-xs font-normal text-[#7A6859] dark:text-[#9E8C7C]">杯</span>
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-3.5">
          <p className="text-[11px] text-[#7A6859] dark:text-[#9E8C7C]">{rangeLabel}总消费</p>
          <p className="mt-1.5 font-mono-num text-xl font-semibold text-[#7C4D2B] dark:text-[#C89463] truncate">
            ¥{formatMoney(stats.totalSpend)}
          </p>
        </div>

        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-3.5">
          <p className="text-[11px] text-[#7A6859] dark:text-[#9E8C7C]">平均单杯</p>
          <p className="mt-1.5 font-mono-num text-xl font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
            {stats.pricedCount > 0 ? `¥${stats.avgPrice.toFixed(1)}` : '—'}
          </p>
        </div>
      </div>

      {stats.totalCups === 0 ? (
        <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-10 text-center">
          <p className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
            {rangeLabel}暂无咖啡记录
          </p>
          <p className="mt-1 text-xs text-[#7A6859] dark:text-[#9E8C7C]">
            记下一杯咖啡后，这里会自动为你生成本地消费与口味分布。
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {/* 高频品类分布 */}
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-5">
            <h3 className="text-sm font-semibold text-[#2C211A] dark:text-[#F4EDE4] mb-4">
              高频品类分布
            </h3>
            <div className="space-y-3">
              {stats.categoryRanking.slice(0, 6).map((item) => {
                const widthPct = Math.round((item.count / maxCatCount) * 100);
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                        {item.name}
                      </span>
                      <span className="font-mono-num text-[#7A6859] dark:text-[#9E8C7C]">
                        {item.count} 杯
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#EFE7DC] dark:bg-[#2E251E] overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#7C4D2B] dark:bg-[#C89463]"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 常消费品牌 TOP3 */}
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-5">
            <h3 className="text-sm font-semibold text-[#2C211A] dark:text-[#F4EDE4] mb-4">
              常消费品牌 TOP 3
            </h3>
            {stats.topBrands.length === 0 ? (
              <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C] py-6 text-center">
                暂未填写品牌或店铺信息
              </p>
            ) : (
              <div className="divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
                {stats.topBrands.map((b, idx) => (
                  <div
                    key={b.name}
                    className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono-num w-6 h-6 rounded-lg bg-[#F3EDE4] dark:bg-[#2E251E] text-xs font-semibold text-[#7C4D2B] dark:text-[#C89463] flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4] truncate">
                        {b.name}
                      </span>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono-num text-xs font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
                        {b.count} 杯
                      </p>
                      <p className="font-mono-num text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                        ¥{formatMoney(b.spend)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 热饮/冰饮/常温占比饼图 */}
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] p-5">
            <h3 className="text-sm font-semibold text-[#2C211A] dark:text-[#F4EDE4] mb-4">
              冷热饮用占比
            </h3>
            <div className="flex items-center gap-5">
              <div className="relative w-32 h-32 shrink-0">
                <svg viewBox="0 0 132 132" className="w-full h-full -rotate-90">
                  <circle
                    cx="66"
                    cy="66"
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="16"
                    className="text-[#EFE7DC] dark:text-[#2E251E]"
                  />
                  {stats.hot > 0 && (
                    <circle
                      cx="66"
                      cy="66"
                      r={radius}
                      fill="none"
                      stroke="#7C4D2B"
                      strokeWidth="16"
                      strokeDasharray={`${hotLen} ${circumference}`}
                      strokeDashoffset={0}
                    />
                  )}
                  {stats.ice > 0 && (
                    <circle
                      cx="66"
                      cy="66"
                      r={radius}
                      fill="none"
                      stroke="#608A9F"
                      strokeWidth="16"
                      strokeDasharray={`${iceLen} ${circumference}`}
                      strokeDashoffset={-hotLen}
                    />
                  )}
                  {stats.normal > 0 && (
                    <circle
                      cx="66"
                      cy="66"
                      r={radius}
                      fill="none"
                      stroke="#C89463"
                      strokeWidth="16"
                      strokeDasharray={`${normalLen} ${circumference}`}
                      strokeDashoffset={-(hotLen + iceLen)}
                    />
                  )}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-mono-num text-lg font-semibold text-[#2C211A] dark:text-[#F4EDE4]">
                    {stats.totalCups}
                  </span>
                  <span className="text-[11px] text-[#7A6859] dark:text-[#9E8C7C]">总杯数</span>
                </div>
              </div>

              <div className="flex-1 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[#2C211A] dark:text-[#F4EDE4]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#7C4D2B]" />
                    热饮
                  </span>
                  <span className="font-mono-num text-[#6E5C4E] dark:text-[#B8A898]">
                    {stats.hot} ({Math.round((stats.hot / totalForPie) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[#2C211A] dark:text-[#F4EDE4]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#608A9F]" />
                    冰饮
                  </span>
                  <span className="font-mono-num text-[#6E5C4E] dark:text-[#B8A898]">
                    {stats.ice} ({Math.round((stats.ice / totalForPie) * 100)}%)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-[#2C211A] dark:text-[#F4EDE4]">
                    <span className="w-2.5 h-2.5 rounded-xs bg-[#C89463]" />
                    常温
                  </span>
                  <span className="font-mono-num text-[#6E5C4E] dark:text-[#B8A898]">
                    {stats.normal} ({Math.round((stats.normal / totalForPie) * 100)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
