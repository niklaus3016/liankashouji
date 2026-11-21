import React, { useRef, useState } from 'react';
import {
  ChevronRight,
  Coffee,
  Download,
  FileSpreadsheet,
  FileText,
  Info,
  ShieldCheck,
  Store,
  Tags,
  Trash2,
  Upload,
} from 'lucide-react';
import {
  AppSettings,
  CoffeeBrand,
  CoffeeCategory,
  DefaultHomeView,
  FlavorTag,
  ThemeMode,
} from '../types/coffee';
import { ConfirmDialog } from './ConfirmDialog';
import {
  LegalDocumentKind,
  LegalDocumentModal,
} from './LegalAgreement';
import { DictionaryMode, TagCategoryManager } from './TagCategoryManager';

interface SettingsViewProps {
  settings: AppSettings;
  brands: CoffeeBrand[];
  categories: CoffeeCategory[];
  tags: FlavorTag[];
  onUpdateSettings: (next: AppSettings) => Promise<void>;
  onAddBrand: (name: string) => Promise<void>;
  onDeleteBrand: (id: number) => Promise<void>;
  onAddCategory: (name: string) => Promise<void>;
  onDeleteCategory: (id: number) => Promise<void>;
  onAddTag: (name: string) => Promise<void>;
  onDeleteTag: (id: number) => Promise<void>;
  onExportCsv: () => Promise<void>;
  onImportCsvFile: (file: File) => Promise<{ ok: boolean; message: string }>;
  onClearAllData: () => Promise<void>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  brands,
  categories,
  tags,
  onUpdateSettings,
  onAddBrand,
  onDeleteBrand,
  onAddCategory,
  onDeleteCategory,
  onAddTag,
  onDeleteTag,
  onExportCsv,
  onImportCsvFile,
  onClearAllData,
}) => {
  const [subView, setSubView] = useState<'main' | DictionaryMode>('main');
  const [legalDoc, setLegalDoc] = useState<LegalDocumentKind | null>(null);
  const [importFeedback, setImportFeedback] = useState<{ ok: boolean; message: string } | null>(null);
  const [clearStep, setClearStep] = useState<0 | 1 | 2>(0);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = async () => {
    setImportFeedback(null);
    const win = window as Window & {
      showOpenFilePicker?: (options?: {
        multiple?: boolean;
        types?: Array<{ description: string; accept: Record<string, string[]> }>;
      }) => Promise<Array<{ getFile: () => Promise<File> }>>;
    };

    if (typeof win.showOpenFilePicker === 'function') {
      try {
        const handles = await win.showOpenFilePicker({
          multiple: false,
          types: [{ description: 'CSV 文件', accept: { 'text/csv': ['.csv'] } }],
        });
        const file = await handles[0]?.getFile();
        if (file) {
          const res = await onImportCsvFile(file);
          setImportFeedback(res);
        }
        return;
      } catch (err) {
        if ((err as DOMException)?.name === 'AbortError') return;
      }
    }
    importInputRef.current?.click();
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const res = await onImportCsvFile(file);
    setImportFeedback(res);
  };

  if (subView !== 'main') {
    const managerConfig =
      subView === 'brands'
        ? { items: brands, onAdd: onAddBrand, onDelete: onDeleteBrand }
        : subView === 'categories'
        ? { items: categories, onAdd: onAddCategory, onDelete: onDeleteCategory }
        : { items: tags, onAdd: onAddTag, onDelete: onDeleteTag };

    return (
      <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] overflow-hidden">
        <TagCategoryManager
          mode={subView}
          items={managerConfig.items}
          onAdd={managerConfig.onAdd}
          onDelete={managerConfig.onDelete}
          onBack={() => setSubView('main')}
        />
      </div>
    );
  }

  return (
    <>
      <div className="space-y-5">
        <div>
          <h2 className="font-display text-2xl font-bold text-[#2C211A] dark:text-[#F4EDE4]">
            设置
          </h2>
          <p className="mt-0.5 text-xs text-[#7A6859] dark:text-[#9E8C7C]">
            偏好外观、标签管理与本地备份
          </p>
        </div>

        {/* 偏好设置 */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#7A6859] dark:text-[#9E8C7C] px-1">
            偏好设置
          </h3>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
            <div className="p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                主题模式
              </span>
              <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
                {(['system', 'light', 'dark'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, themeMode: mode })}
                    className={`min-h-[34px] px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      settings.themeMode === mode
                        ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                        : 'text-[#6E5C4E] dark:text-[#B8A898]'
                    }`}
                  >
                    {mode === 'system' ? '系统' : mode === 'light' ? '浅色' : '深色'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                默认视图
              </span>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFE7DC] dark:bg-[#29211B]">
                {(['today', 'calendar'] as DefaultHomeView[]).map((view) => (
                  <button
                    key={view}
                    type="button"
                    onClick={() => onUpdateSettings({ ...settings, defaultHomeView: view })}
                    className={`min-h-[34px] px-3 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                      settings.defaultHomeView === view
                        ? 'bg-[#FFFFFF] dark:bg-[#3A2F26] text-[#7C4D2B] dark:text-[#C89463] shadow-xs'
                        : 'text-[#6E5C4E] dark:text-[#B8A898]'
                    }`}
                  >
                    {view === 'today' ? '今日记录' : '日历视图'}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                  首页统计卡片
                </p>
                <p className="text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                  展示今日与本月累计杯数及花费
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={settings.showHomeStats}
                onClick={() =>
                  onUpdateSettings({
                    ...settings,
                    showHomeStats: !settings.showHomeStats,
                  })
                }
                className={`w-12 h-7 rounded-full p-1 transition-colors shrink-0 ${
                  settings.showHomeStats
                    ? 'bg-[#7C4D2B] dark:bg-[#C89463]'
                    : 'bg-[#D8CBB9] dark:bg-[#3B3027]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                    settings.showHomeStats ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>
        </section>

        {/* 标签与词典管理 */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#7A6859] dark:text-[#9E8C7C] px-1">
            词典与标签管理
          </h3>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
            <button
              type="button"
              onClick={() => setSubView('brands')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                <Store className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                咖啡品牌管理
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-[#8C7A6B]">
                <span className="font-mono-num">{brands.length}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('categories')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                <Coffee className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                咖啡品类管理
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-[#8C7A6B]">
                <span className="font-mono-num">{categories.length}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>

            <button
              type="button"
              onClick={() => setSubView('tags')}
              className="w-full p-4 flex items-center justify-between hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                <Tags className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                咖啡风味管理
              </span>
              <span className="inline-flex items-center gap-2 text-xs text-[#8C7A6B]">
                <span className="font-mono-num">{tags.length}</span>
                <ChevronRight className="w-4 h-4" />
              </span>
            </button>
          </div>
        </section>

        {/* 数据管理 */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#7A6859] dark:text-[#9E8C7C] px-1">
            本地数据管理（SAF 文件选择）
          </h3>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
            <button
              type="button"
              onClick={onExportCsv}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3">
                <Download className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                <span>
                  <span className="block text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                    导出全部记录 CSV
                  </span>
                  <span className="block text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                    手动选择保存位置，仅导出本地手记
                  </span>
                </span>
              </span>
              <FileSpreadsheet className="w-4 h-4 text-[#8C7A6B]" />
            </button>

            <button
              type="button"
              onClick={handleImportClick}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3">
                <Upload className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                <span>
                  <span className="block text-sm font-medium text-[#2C211A] dark:text-[#F4EDE4]">
                    从 CSV 导入记录
                  </span>
                  <span className="block text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                    仅识别《恋咖手记》标准导出格式
                  </span>
                </span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
            </button>

            <button
              type="button"
              onClick={() => setClearStep(1)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#B93829]/5 transition-colors"
            >
              <span className="inline-flex items-center gap-3">
                <Trash2 className="w-4 h-4 text-[#B93829]" />
                <span>
                  <span className="block text-sm font-medium text-[#B93829]">
                    一键清空全部咖啡数据
                  </span>
                  <span className="block text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                    清除全部手记、配图与自定义标签
                  </span>
                </span>
              </span>
            </button>
          </div>

          {importFeedback && (
            <div
              className={`rounded-xl p-3 text-xs ${
                importFeedback.ok
                  ? 'bg-[#4F7953]/12 text-[#355A38] dark:text-[#86B88A]'
                  : 'bg-[#B93829]/12 text-[#B93829] dark:text-[#E57368]'
              }`}
            >
              {importFeedback.message}
            </div>
          )}
        </section>

        {/* 关于恋咖手记 */}
        <section className="space-y-2">
          <h3 className="text-xs font-semibold text-[#7A6859] dark:text-[#9E8C7C] px-1">
            关于恋咖手记
          </h3>
          <div className="rounded-2xl bg-[#FFFFFF] dark:bg-[#211B16] border border-[#E6DDD1] dark:border-[#382E26] divide-y divide-[#EFE7DC] dark:divide-[#2F261F]">
            <div className="p-4 flex items-center justify-between">
              <span className="inline-flex items-center gap-3 text-sm text-[#2C211A] dark:text-[#F4EDE4]">
                <Info className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                版本信息
              </span>
              <span className="font-mono-num text-xs text-[#7A6859] dark:text-[#9E8C7C]">
                v1.0
              </span>
            </div>
            <button
              type="button"
              onClick={() => setLegalDoc('agreement')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-sm text-[#2C211A] dark:text-[#F4EDE4]">
                <FileText className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                用户服务协议
              </span>
              <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
            </button>
            <button
              type="button"
              onClick={() => setLegalDoc('privacy')}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-[#F5EFE6] dark:hover:bg-[#29211B] transition-colors"
            >
              <span className="inline-flex items-center gap-3 text-sm text-[#2C211A] dark:text-[#F4EDE4]">
                <ShieldCheck className="w-4 h-4 text-[#7C4D2B] dark:text-[#C89463]" />
                隐私政策
              </span>
              <ChevronRight className="w-4 h-4 text-[#8C7A6B]" />
            </button>
          </div>
        </section>
      </div>

      {legalDoc && (
        <LegalDocumentModal doc={legalDoc} onClose={() => setLegalDoc(null)} />
      )}

      {/* 双重确认清空弹窗 */}
      <ConfirmDialog
        open={clearStep === 1}
        title="清空全部咖啡数据？（第 1/2 步）"
        message="此操作将删除所有咖啡记录、压缩配图以及自定义品类和标签，系统预设将保留。"
        confirmLabel="继续确认"
        cancelLabel="取消"
        danger
        onConfirm={() => setClearStep(2)}
        onCancel={() => setClearStep(0)}
      />

      <ConfirmDialog
        open={clearStep === 2}
        title="最终确认：不可撤销（第 2/2 步）"
        message="本应用数据仅保存在本机，清空后无法找回。建议先导出 CSV 备份。"
        confirmLabel="确认永久清空"
        cancelLabel="我再想想"
        danger
        onConfirm={async () => {
          setClearStep(0);
          await onClearAllData();
        }}
        onCancel={() => setClearStep(0)}
      />
    </>
  );
};
