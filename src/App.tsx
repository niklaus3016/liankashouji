import React, { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  CalendarDays,
  Coffee,
  Home,
  Plus,
  Settings,
} from 'lucide-react';
import {
  addBrandDb,
  addCategoryDb,
  addTagDb,
  clearAllCoffeeDataDb,
  deleteBrandDb,
  deleteCategoryDb,
  deleteRecordDb,
  deleteTagDb,
  initializeAndLoadAll,
  saveRecordDb,
  saveSettingsDb,
} from './db/coffeeDb';
import {
  AppSettings,
  CoffeeBrand,
  CoffeeCategory,
  CoffeeRecord,
  FlavorTag,
} from './types/coffee';
import { buildCoffeeCsvContent, exportCsvViaSaf, parseCoffeeCsv } from './utils/csvSaf';
import { HistorySubTab, HistoryView } from './components/HistoryView';
import { LegalGate, hasAcceptedLegalConsent } from './components/LegalAgreement';
import { RecordDetailModal } from './components/RecordDetailModal';
import { RecordFormModal } from './components/RecordFormModal';
import { SettingsView } from './components/SettingsView';
import { StatsView } from './components/StatsView';
import { TodayHomeView } from './components/TodayHomeView';

type MainTab = 'home' | 'history' | 'stats' | 'settings';

export function App() {
  const [legalAccepted, setLegalAccepted] = useState(() => hasAcceptedLegalConsent());
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<CoffeeRecord[]>([]);
  const [brands, setBrands] = useState<CoffeeBrand[]>([]);
  const [categories, setCategories] = useState<CoffeeCategory[]>([]);
  const [tags, setTags] = useState<FlavorTag[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    id: 'singleton',
    themeMode: 'system',
    defaultHomeView: 'today',
    showHomeStats: true,
  });

  const [activeTab, setActiveTab] = useState<MainTab>('home');
  const [historySubTab, setHistorySubTab] = useState<HistorySubTab>('list');
  const [selectedRecord, setSelectedRecord] = useState<CoffeeRecord | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<CoffeeRecord | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  useEffect(() => {
    if (!legalAccepted) return;
    let mounted = true;
    initializeAndLoadAll()
      .then((data) => {
        if (!mounted) return;
        setRecords(data.records);
        setBrands(data.brands);
        setCategories(data.categories);
        setTags(data.tags);
        setSettings(data.settings);
        if (data.settings.defaultHomeView === 'calendar') {
          setActiveTab('history');
          setHistorySubTab('calendar');
        }
      })
      .catch(() => {
        if (mounted) showToast('本地数据库初始化失败，请检查浏览器存储权限或空间');
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [legalAccepted]);

  // Theme application
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const applyTheme = () => {
      const isDark =
        settings.themeMode === 'dark' ||
        (settings.themeMode === 'system' && media.matches);
      document.documentElement.classList.toggle('dark', isDark);
    };
    applyTheme();
    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [settings.themeMode]);

  const existingBrands = useMemo(() => {
    const set = new Set<string>();
    for (const b of brands) {
      if (b.name.trim()) set.add(b.name.trim());
    }
    for (const r of records) {
      const b = r.brandShop.trim();
      if (b) set.add(b);
    }
    return Array.from(set);
  }, [brands, records]);

  const handleOpenNewRecord = () => {
    setEditingRecord(null);
    setFormOpen(true);
  };

  const handleSaveRecord = async (payload: Omit<CoffeeRecord, 'id'> | CoffeeRecord) => {
    const saved = await saveRecordDb(payload);
    setRecords((prev) => {
      const exists = prev.some((r) => r.id === saved.id);
      const next = exists
        ? prev.map((r) => (r.id === saved.id ? saved : r))
        : [saved, ...prev];
      return next.sort((a, b) => b.drinkTime - a.drinkTime);
    });

    showToast('id' in payload ? '手记已更新' : '已记下一杯咖啡');

    if (selectedRecord && selectedRecord.id === saved.id) {
      setSelectedRecord(saved);
    }
  };

  const handleDeleteRecord = async (id: number) => {
    await deleteRecordDb(id);
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setSelectedRecord(null);
    showToast('已删除该条咖啡记录');
  };

  const handleAddBrand = async (name: string): Promise<CoffeeBrand> => {
    const created = await addBrandDb(name);
    setBrands((prev) => [...prev, created]);
    return created;
  };

  const handleDeleteBrand = async (id: number) => {
    await deleteBrandDb(id);
    setBrands((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddCategory = async (name: string): Promise<CoffeeCategory> => {
    const created = await addCategoryDb(name);
    setCategories((prev) => [...prev, created]);
    return created;
  };

  const handleDeleteCategory = async (id: number) => {
    await deleteCategoryDb(id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleAddTag = async (name: string): Promise<FlavorTag> => {
    const created = await addTagDb(name);
    setTags((prev) => [...prev, created]);
    return created;
  };

  const handleDeleteTag = async (id: number) => {
    await deleteTagDb(id);
    setTags((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateSettings = async (next: AppSettings) => {
    setSettings(next);
    await saveSettingsDb(next);
  };

  const handleExportCsv = async () => {
    if (records.length === 0) {
      showToast('当前暂无手记记录可导出');
      return;
    }
    const csv = buildCoffeeCsvContent(records, categories, tags);
    const d = new Date();
    const filename = `恋咖手记_${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}.csv`;
    const status = await exportCsvViaSaf(csv, filename);
    if (status === 'saved') {
      showToast(`已导出 ${records.length} 条记录至 CSV`);
    }
  };

  const handleImportCsvFile = async (file: File): Promise<{ ok: boolean; message: string }> => {
    try {
      const text = await file.text();
      const { records: parsed, error } = parseCoffeeCsv(text);
      if (error) {
        return { ok: false, message: error };
      }
      if (parsed.length === 0) {
        return { ok: false, message: '未检测到可导入的咖啡记录。' };
      }

      const localCats = [...categories];
      const localTags = [...tags];
      const imported: CoffeeRecord[] = [];

      for (const item of parsed) {
        let cat = localCats.find((c) => c.name === item.categoryName);
        if (!cat) {
          cat = await addCategoryDb(item.categoryName);
          localCats.push(cat);
        }

        const resolvedTagIds: number[] = [];
        for (const tName of item.tagNames) {
          let tag = localTags.find((t) => t.name === tName);
          if (!tag) {
            tag = await addTagDb(tName);
            localTags.push(tag);
          }
          resolvedTagIds.push(tag.id);
        }

        const now = Date.now();
        const saved = await saveRecordDb({
          coffeeName: item.coffeeName,
          brandShop: item.brandShop,
          price: item.price,
          drinkTime: item.drinkTime,
          drinkType: item.drinkType,
          categoryId: cat.id,
          sourceType: item.sourceType,
          starScore: item.starScore,
          repurchaseStatus: item.repurchaseStatus,
          remark: item.remark,
          imgUriList: [],
          tagIds: resolvedTagIds,
          createTs: now,
          updateTs: now,
        });
        imported.push(saved);
      }

      setCategories(localCats);
      setTags(localTags);
      setRecords((prev) =>
        [...imported, ...prev].sort((a, b) => b.drinkTime - a.drinkTime)
      );

      return { ok: true, message: `成功导入 ${imported.length} 条咖啡记录。` };
    } catch {
      return { ok: false, message: '文件读取失败，请确认选择了有效的 UTF-8 CSV 文件。' };
    }
  };

  const handleClearAllData = async () => {
    const fresh = await clearAllCoffeeDataDb();
    setRecords(fresh.records);
    setBrands(fresh.brands);
    setCategories(fresh.categories);
    setTags(fresh.tags);
    setSettings(fresh.settings);
    setSelectedRecord(null);
    showToast('已清空全部本地咖啡数据');
  };

  const navItems: Array<{ key: MainTab; label: string; icon: React.ReactNode }> = [
    { key: 'home', label: '今日咖记', icon: <Home className="w-5 h-5" /> },
    { key: 'history', label: '全部手记', icon: <CalendarDays className="w-5 h-5" /> },
    { key: 'stats', label: '咖账', icon: <BarChart3 className="w-5 h-5" /> },
    { key: 'settings', label: '设置', icon: <Settings className="w-5 h-5" /> },
  ];

  if (!legalAccepted) {
    return <LegalGate onAccept={() => setLegalAccepted(true)} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF7F2] dark:bg-[#16120F]">
        <div className="flex flex-col items-center gap-3 text-[#7C4D2B] dark:text-[#C89463]">
          <Coffee className="w-8 h-8" />
          <p className="text-sm font-medium">正在打开恋咖手记...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F2ECE3] dark:bg-[#0F0C0A]">
      <div className="relative max-w-md mx-auto min-h-screen bg-[#FAF7F2] dark:bg-[#16120F] text-[#2C211A] dark:text-[#F4EDE4] sm:border-x sm:border-[#E6DDD1] dark:sm:border-[#2E251E] flex flex-col">
        {/* Mobile Top App Bar (48px) */}
        <header className="sticky top-0 z-30 h-12 px-4 flex items-center justify-between bg-[#FAF7F2]/95 dark:bg-[#16120F]/95 backdrop-blur-md border-b border-[#E6DDD1] dark:border-[#2E251E]">
          <h1 className="font-display text-lg font-bold tracking-tight text-[#2C211A] dark:text-[#F4EDE4] whitespace-nowrap">
            恋咖手记
          </h1>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            aria-label="进入设置"
            className={`min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl transition-colors ${
              activeTab === 'settings'
                ? 'text-[#7C4D2B] dark:text-[#C89463] bg-[#EFE7DC] dark:bg-[#29211B]'
                : 'text-[#5C4B3E] dark:text-[#CBBBA9] hover:bg-[#EFE7DC] dark:hover:bg-[#29211B]'
            }`}
          >
            <Settings className="w-5 h-5" />
          </button>
        </header>

        {/* Main Scrollable Content */}
        <main className="flex-1 px-4 py-5 pb-28">
          {activeTab === 'home' && (
            <TodayHomeView
              records={records}
              categories={categories}
              tags={tags}
              showHomeStats={settings.showHomeStats}
              onSelectRecord={setSelectedRecord}
              onQuickAdd={handleOpenNewRecord}
            />
          )}

          {activeTab === 'history' && (
            <HistoryView
              records={records}
              categories={categories}
              tags={tags}
              activeSubTab={historySubTab}
              onSubTabChange={setHistorySubTab}
              onSelectRecord={setSelectedRecord}
            />
          )}

          {activeTab === 'stats' && (
            <StatsView
              records={records}
              categories={categories}
              onExportCsv={handleExportCsv}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              brands={brands}
              categories={categories}
              tags={tags}
              onUpdateSettings={handleUpdateSettings}
              onAddBrand={async (name) => {
                await handleAddBrand(name);
              }}
              onDeleteBrand={handleDeleteBrand}
              onAddCategory={async (name) => {
                await handleAddCategory(name);
              }}
              onDeleteCategory={handleDeleteCategory}
              onAddTag={async (name) => {
                await handleAddTag(name);
              }}
              onDeleteTag={handleDeleteTag}
              onExportCsv={handleExportCsv}
              onImportCsvFile={handleImportCsvFile}
              onClearAllData={handleClearAllData}
            />
          )}
        </main>

        {/* Floating Action Button (shown outside Settings tab) */}
        {activeTab !== 'settings' && (
          <div className="fixed bottom-20 left-0 right-0 z-30 pointer-events-none">
            <div className="max-w-md mx-auto px-4 flex justify-end">
              <button
                type="button"
                onClick={handleOpenNewRecord}
                className="pointer-events-auto h-12 px-4 rounded-2xl bg-[#7C4D2B] text-white dark:bg-[#C89463] dark:text-[#16120F] shadow-lg shadow-[#7C4D2B]/25 text-xs font-medium inline-flex items-center gap-1.5 active:scale-95 transition-transform whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                记录一杯咖啡
              </button>
            </div>
          </div>
        )}

        {/* Fixed Bottom 4-Tab Bar (56px) */}
        <nav
          aria-label="底部导航"
          className="fixed bottom-0 left-0 right-0 z-30 pb-safe pointer-events-none"
        >
          <div className="max-w-md mx-auto pointer-events-auto bg-[#FFFFFF]/95 dark:bg-[#1B1612]/95 backdrop-blur-md border-t sm:border-x border-[#E6DDD1] dark:border-[#2E251E]">
            <div className="grid grid-cols-4 h-14 items-center">
              {navItems.map((item) => {
                const active = activeTab === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => setActiveTab(item.key)}
                    className={`h-full flex flex-col items-center justify-center gap-0.5 transition-colors ${
                      active
                        ? 'text-[#7C4D2B] dark:text-[#C89463]'
                        : 'text-[#8C7A6B] dark:text-[#9E8C7C]'
                    }`}
                  >
                    {item.icon}
                    <span className="text-[11px] font-medium tracking-tight">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#2C211A] text-[#FAF7F2] dark:bg-[#F4EDE4] dark:text-[#16120F] text-xs font-medium shadow-lg whitespace-nowrap">
          {toastMsg}
        </div>
      )}

      {/* Detail Modal */}
      <RecordDetailModal
        record={selectedRecord}
        categories={categories}
        tags={tags}
        onClose={() => setSelectedRecord(null)}
        onEdit={(rec) => {
          setSelectedRecord(null);
          setEditingRecord(rec);
          setFormOpen(true);
        }}
        onDelete={handleDeleteRecord}
      />

      {/* Add / Edit Record Form Modal */}
      {formOpen && (
        <RecordFormModal
          open={formOpen}
          editingRecord={editingRecord}
          categories={categories}
          tags={tags}
          existingBrands={existingBrands}
          onAddCategory={handleAddCategory}
          onAddTag={handleAddTag}
          onSave={handleSaveRecord}
          onClose={() => {
            setFormOpen(false);
            setEditingRecord(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
