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

const CSV_HEADER_SIGNATURE = '恋咖手记_CSV_V1';
const CSV_COLUMNS = [
  '格式标识',
  '记录ID',
  '咖啡名称',
  '品牌店铺',
  '价格(元)',
  '饮用时间',
  '饮用类型',
  '咖啡品类',
  '来源',
  '个人评分',
  '回购意向',
  '风味标签',
  '备注',
];

function escapeCsvCell(val: string): string {
  if (val.includes('"') || val.includes(',') || val.includes('\n') || val.includes('\r')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

function formatDateTimeIsoLocal(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function buildCoffeeCsvContent(
  records: CoffeeRecord[],
  categories: CoffeeCategory[],
  tags: FlavorTag[]
): string {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));
  const tagMap = new Map(tags.map((t) => [t.id, t.name]));

  const rows = [CSV_COLUMNS.map(escapeCsvCell).join(',')];

  for (const r of records) {
    const tagNames = r.tagIds.map((id) => tagMap.get(id)).filter(Boolean).join('|');
    const row = [
      CSV_HEADER_SIGNATURE,
      String(r.id),
      r.coffeeName,
      r.brandShop,
      r.price !== null ? r.price.toFixed(2) : '',
      formatDateTimeIsoLocal(r.drinkTime),
      DRINK_TYPE_LABELS[r.drinkType],
      catMap.get(r.categoryId) ?? '美式',
      SOURCE_TYPE_LABELS[r.sourceType],
      r.starScore !== null ? String(r.starScore) : '',
      REPURCHASE_LABELS[r.repurchaseStatus],
      tagNames,
      r.remark,
    ];
    rows.push(row.map(escapeCsvCell).join(','));
  }

  return '\uFEFF' + rows.join('\r\n');
}

export async function exportCsvViaSaf(csvContent: string, suggestedName: string): Promise<'saved' | 'cancelled'> {
  const win = window as Window & {
    AndroidSafBridge?: {
      exportCsv: (filename: string, content: string) => void;
    };
    showSaveFilePicker?: (options?: {
      suggestedName?: string;
      types?: Array<{ description: string; accept: Record<string, string[]> }>;
    }) => Promise<{
      createWritable: () => Promise<{ write: (data: string) => Promise<void>; close: () => Promise<void> }>;
    }>;
  };

  if (win.AndroidSafBridge && typeof win.AndroidSafBridge.exportCsv === 'function') {
    win.AndroidSafBridge.exportCsv(suggestedName, csvContent);
    return 'saved';
  }

  if (typeof win.showSaveFilePicker === 'function') {
    try {
      const handle = await win.showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'CSV 表格文件',
            accept: { 'text/csv': ['.csv'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(csvContent);
      await writable.close();
      return 'saved';
    } catch (err) {
      if ((err as DOMException)?.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall back to standard download if picker is blocked in iframe
    }
  }

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'saved';
}

function parseCsvRows(text: string): string[][] {
  const clean = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const next = clean[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell);
        cell = '';
      } else if (ch === '\r' && next === '\n') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((c) => c.trim() !== ''));
}

export interface ParsedImportRecord {
  coffeeName: string;
  brandShop: string;
  price: number | null;
  drinkTime: number;
  drinkType: DrinkType;
  categoryName: string;
  sourceType: SourceType;
  starScore: number | null;
  repurchaseStatus: RepurchaseStatus;
  tagNames: string[];
  remark: string;
}

const REVERSE_DRINK_TYPE: Record<string, DrinkType> = {
  热饮: 'HOT',
  冰饮: 'ICE',
  常温: 'NORMAL',
  HOT: 'HOT',
  ICE: 'ICE',
  NORMAL: 'NORMAL',
};

const REVERSE_SOURCE_TYPE: Record<string, SourceType> = {
  门店购买: 'SHOP',
  外卖: 'TAKEOUT',
  自制: 'HOMEMADE',
  速溶胶囊: 'INSTANT',
  SHOP: 'SHOP',
  TAKEOUT: 'TAKEOUT',
  HOMEMADE: 'HOMEMADE',
  INSTANT: 'INSTANT',
};

const REVERSE_REPURCHASE: Record<string, RepurchaseStatus> = {
  会回购: 'YES',
  待定: 'MAYBE',
  不回购: 'NO',
  YES: 'YES',
  MAYBE: 'MAYBE',
  NO: 'NO',
};

export function parseCoffeeCsv(text: string): { records: ParsedImportRecord[]; error?: string } {
  const rows = parseCsvRows(text);
  if (rows.length < 2) {
    return { records: [], error: '文件内容为空或仅包含表头，无法识别有效咖啡记录。' };
  }

  const header = rows[0].map((c) => c.trim());
  if (header[0] !== '格式标识' || header[2] !== '咖啡名称' || header.length < 13) {
    return {
      records: [],
      error: '文件格式不匹配：仅支持导入《恋咖手记》导出的标准 CSV 文件。',
    };
  }

  const parsed: ParsedImportRecord[] = [];
  for (let i = 1; i < rows.length; i++) {
    const cols = rows[i];
    if (cols.length < 13 || cols[0].trim() !== CSV_HEADER_SIGNATURE) {
      return {
        records: [],
        error: `第 ${i + 1} 行格式异常，请确认未修改「格式标识」或列结构。`,
      };
    }

    const priceRaw = cols[4].trim();
    const priceNum = priceRaw === '' ? null : Number(priceRaw);
    if (priceRaw !== '' && (Number.isNaN(priceNum) || (priceNum ?? 0) < 0)) {
      return { records: [], error: `第 ${i + 1} 行价格格式无效：「${priceRaw}」` };
    }

    const timeStr = cols[5].trim().replace(' ', 'T');
    const timeVal = Date.parse(timeStr);
    const drinkTime = Number.isNaN(timeVal) ? Date.now() : timeVal;

    const scoreRaw = cols[9].trim();
    const scoreNum = scoreRaw === '' ? null : Math.min(5, Math.max(1, Math.round(Number(scoreRaw))));

    parsed.push({
      coffeeName: cols[2].trim(),
      brandShop: cols[3].trim(),
      price: priceNum,
      drinkTime,
      drinkType: REVERSE_DRINK_TYPE[cols[6].trim()] ?? 'HOT',
      categoryName: cols[7].trim() || '美式',
      sourceType: REVERSE_SOURCE_TYPE[cols[8].trim()] ?? 'SHOP',
      starScore: scoreNum && !Number.isNaN(scoreNum) ? scoreNum : null,
      repurchaseStatus: REVERSE_REPURCHASE[cols[10].trim()] ?? 'MAYBE',
      tagNames: cols[11]
        .split('|')
        .map((s) => s.trim())
        .filter(Boolean),
      remark: cols[12] ?? '',
    });
  }

  return { records: parsed };
}
