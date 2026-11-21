import { useEffect, useState, type ReactNode } from 'react';
import { Coffee, FileText, Lock, ShieldCheck, X } from 'lucide-react';

const CONSENT_STORAGE_KEY = 'lianka.legal.consent.v1';
// 协议内容或版本更新时，同步提升版本号，以便重新征得用户同意。
const CONSENT_VERSION = '1.0';
const LEGAL_DATE = '2026年11月21日';
const COMPANY_NAME = '深圳丰佰瑞网络科技有限公司';
const CONTACT_EMAIL = 'Jp182025@163.com';

export type LegalDocumentKind = 'agreement' | 'privacy';

export function hasAcceptedLegalConsent(): boolean {
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === CONSENT_VERSION;
  } catch {
    return false;
  }
}

function persistLegalConsent() {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, CONSENT_VERSION);
  } catch {
    // localStorage 不可用时，本次会话仍可继续，但下次启动会再次提示。
  }
}

const Strong = ({ children }: { children: ReactNode }) => (
  <strong className="font-semibold text-[#2C211A] dark:text-[#F4EDE4]">{children}</strong>
);

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="space-y-2">
    <h2 className="border-b border-[#EFE7DC] pb-1.5 text-[15px] font-semibold text-[#2C211A] dark:border-[#2F261F] dark:text-[#F4EDE4]">
      {title}
    </h2>
    {children}
  </section>
);

export function PrivacyPolicyContent() {
  return (
    <div className="space-y-4 text-[13px] leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
      <p className="text-center text-xs text-[#8C7A6B] dark:text-[#9E8C7C]">
        生效日期：{LEGAL_DATE}
      </p>

      <div className="rounded-2xl border-l-4 border-[#7C4D2B] bg-[#F5EFE6] p-4 dark:border-[#C89463] dark:bg-[#2A211A]">
        <p>
          欢迎使用「恋咖手记」（以下简称“本应用”）。本应用由<Strong>{COMPANY_NAME}</Strong>
          （以下简称“我们”）开发并运营。我们深知个人信息对您的重要性，将严格遵守《中华人民共和国个人信息保护法》《中华人民共和国网络安全法》等法律法规，保护您的个人信息安全。
        </p>
      </div>

      <p>
        本应用是一款纯本地的咖啡记录工具，不设账号体系，不提供云端服务。本政策说明我们如何处理您在使用过程中产生和保存的信息，以及您对这些信息享有的权利。请您在使用本应用前仔细阅读并充分理解本政策的全部内容，尤其是加粗的条款。如您对本政策有任何疑问，可通过本政策末尾的联系方式与我们联系。
      </p>

      <Section title="一、我们收集的信息">
        <p>
          <Strong>1. 咖啡记录数据：</Strong>
          您主动录入的咖啡名称、品牌或店铺、价格、饮用时间、冷热类型、品类、来源、评分、是否复购、备注、口味标签，以及您主动选择的配图。上述信息仅保存在您的设备本地（浏览器 / 应用 WebView 的 IndexedDB 与应用私有存储），我们不会上传、同步或读取。
        </p>
        <p>
          <Strong>2. 我们不收集：</Strong>
          设备型号、操作系统版本、设备标识符（如 IMEI、Android ID、OAID、MAC 地址）、IP 地址、位置信息、通讯录、短信、通话记录、麦克风、相机画面、剪贴板、应用列表、行为日志或用户画像。
        </p>
        <p>
          <Strong>3. 无第三方 SDK：</Strong>
          本应用未集成任何第三方统计、推送、支付、地图等服务或 SDK，不包含向外部服务器发送数据的网络请求逻辑。
        </p>
      </Section>

      <Section title="二、权限与系统能力">
        <p>
          <Strong>1. 图片选择：</Strong>
          仅通过系统照片选择器读取您当次主动选择的图片（最多 3 张），在本地压缩后保存到应用私有空间。本应用不会读取相册中的其他图片，也不会将图片写入系统相册。
        </p>
        <p>
          <Strong>2. 文件导入与导出：</Strong>
          CSV 备份与恢复通过系统文件选择器（SAF）由您手动指定文件位置，应用仅处理您当次选中的单个文件。
        </p>
        <p>
          <Strong>3. 不申请的权限：</Strong>
          本应用不申请网络、定位、相机、麦克风、通讯录、短信、通话记录、通知等敏感权限，也不在后台收集任何信息。
        </p>
      </Section>

      <Section title="三、我们如何使用信息">
        <p>我们仅将上述信息用于实现以下本地功能：</p>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>在「今日咖记」「全部手记」「日历」中展示您的咖啡记录；</li>
          <li>在「咖账」中生成消费金额、杯数、品类与评分等统计图表；</li>
          <li>在您主动导出时，于本地生成 CSV 备份文件。</li>
        </ol>
        <p>
          我们不会将您的信息用于用户画像、数据分析、模型训练或其他目的，也不会向任何第三方共享、转让或公开披露，法律法规另有强制性规定的除外。
        </p>
      </Section>

      <Section title="四、存储地点与期限">
        <p>
          <Strong>1. 存储地点：</Strong>
          所有数据仅存储于您当前设备的应用私有空间，不存储于我们的服务器（本应用没有云端服务器）。
        </p>
        <p>
          <Strong>2. 存储期限：</Strong>
          数据保留至您主动删除单条记录、在设置中清空全部数据、清除应用数据或卸载应用为止。
        </p>
        <p>
          <Strong>3. 数据丢失风险：</Strong>
          卸载应用、清除应用数据、更换设备或系统故障都可能导致数据不可恢复。CSV 备份不包含配图，建议您定期导出备份。
        </p>
      </Section>

      <Section title="五、我们如何保护信息">
        <p>
          您的数据受操作系统应用沙箱保护。安卓版本不申请网络权限，并拦截应用内的外部网络请求；网页版本同样不包含上传逻辑。请您妥善保管设备与锁屏密码，避免在共享设备上留存敏感记录。
        </p>
        <p>
          由于数据完全保存在本地，我们无法访问、备份或恢复您的数据。因设备丢失、系统故障、误删、卸载等原因造成的数据丢失，我们无法承担责任。
        </p>
      </Section>

      <Section title="六、您的权利">
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>
            <Strong>访问与更正：</Strong>您可以在应用内随时查看、编辑您的咖啡记录。
          </li>
          <li>
            <Strong>删除：</Strong>您可以删除单条记录，或在「设置」中一键清空全部本地数据。
          </li>
          <li>
            <Strong>导出与备份：</Strong>您可以在「设置」或「咖账」中主动导出 CSV 文件。
          </li>
          <li>
            <Strong>撤回同意：</Strong>您可以停止使用并卸载本应用，卸载即停止对本地数据的处理。撤回同意不影响撤回前基于您的同意已进行的本地处理。
          </li>
          <li>
            <Strong>说明：</Strong>由于本应用不收集可识别您身份的信息，也没有账号体系，相关访问、更正和删除操作均在您的设备上完成，我们无法在远端代为操作。
          </li>
        </ol>
      </Section>

      <Section title="七、未成年人保护">
        <p>
          我们非常重视对未成年人个人信息的保护。如您是未满 14 周岁的未成年人，应在监护人的指导下阅读本政策，并在取得监护人同意后使用本应用。本应用不主动收集未成年人信息；如监护人发现相关情况，可通过本政策末尾的邮箱联系我们，我们会在核实后协助处理。由于数据仅保存在本地，删除操作需在设备上完成。
        </p>
      </Section>

      <Section title="八、第三方服务与数据共享">
        <p>
          本应用未集成第三方 SDK，不进行数据共享、转让或公开披露。当您主动导出 CSV 时，文件将由您选择保存位置；文件离开本应用后的安全由您及目标位置的服务提供方负责。
        </p>
      </Section>

      <Section title="九、本政策的更新">
        <p>
          我们可能会根据法律法规、产品功能或技术的变化适时修订本政策。修订后的政策将在应用内公示并更新生效日期；如变更涉及您的权利或数据处理方式，我们会通过弹窗等显著方式重新征得您的同意。
        </p>
      </Section>

      <Section title="十、联系我们">
        <p>如您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们：</p>
        <div className="rounded-xl border border-[#E6DDD1] bg-[#FFFFFF] p-3 dark:border-[#382E26] dark:bg-[#211B16]">
          <p>
            <Strong>电子邮箱：</Strong>
            <span className="break-all">{CONTACT_EMAIL}</span>
          </p>
          <p className="mt-1 text-xs text-[#8C7A6B] dark:text-[#9E8C7C]">
            我们将在收到邮件后 15 个工作日内回复。
          </p>
        </div>
      </Section>

      <div className="border-t border-[#EFE7DC] pt-4 text-center text-xs text-[#8C7A6B] dark:border-[#2F261F] dark:text-[#9E8C7C]">
        <p>感谢您使用恋咖手记。</p>
        <p className="mt-1">© 2026 {COMPANY_NAME} 版权所有</p>
      </div>
    </div>
  );
}

export function UserAgreementContent() {
  return (
    <div className="space-y-4 text-[13px] leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
      <p className="text-center text-xs text-[#8C7A6B] dark:text-[#9E8C7C]">
        更新日期：{LEGAL_DATE}
      </p>

      <div className="rounded-2xl border-l-4 border-[#7C4D2B] bg-[#F5EFE6] p-4 dark:border-[#C89463] dark:bg-[#2A211A]">
        <p>
          欢迎使用「恋咖手记」。本协议是您与<Strong>{COMPANY_NAME}</Strong>
          （以下简称“我们”）之间关于使用本应用的法律协议。请您在下载、安装或使用前仔细阅读。
        </p>
      </div>

      <Section title="1. 协议的接受">
        <p>
          通过下载、安装、启动或使用本应用，即表示您已阅读并同意接受本协议及《隐私政策》的全部条款。如您不同意本协议或《隐私政策》的任何内容，请停止使用并卸载本应用。
        </p>
      </Section>

      <Section title="2. 服务内容">
        <p>本应用为您提供以下本地功能：</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>记录和管理每日咖啡手记，包括文字、评分、标签与配图；</li>
          <li>按日历、列表查看历史记录；</li>
          <li>查看消费金额、杯数、品类等统计信息；</li>
          <li>通过 CSV 文件在本地导入或导出记录。</li>
        </ul>
        <p>
          本应用为免费工具，不提供账号注册、云端同步、在线支付或社交服务。我们可能根据产品迭代调整、新增或下线部分功能。
        </p>
      </Section>

      <Section title="3. 用户义务">
        <p>作为本应用的用户，您同意：</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>遵守本协议及适用法律法规，不利用本应用从事任何违法活动；</li>
          <li>不干扰、破坏本应用的正常运行，不进行恶意逆向、破解或篡改（法律允许的除外）；</li>
          <li>妥善保管您的设备与锁屏密码，防止他人未经授权查看您的本地记录；</li>
          <li>对您录入内容的合法性与真实性负责，并自行做好数据备份；</li>
          <li>如您为未成年人，应在监护人同意和指导下使用本应用。</li>
        </ul>
      </Section>

      <Section title="4. 数据与备份">
        <p>
          本应用的所有数据仅保存在您的设备本地。卸载应用、清除应用数据、更换设备或系统故障可能导致数据永久丢失。CSV 备份不包含配图，请您根据重要程度自行定期导出备份。我们不提供云端恢复服务。
        </p>
      </Section>

      <Section title="5. 知识产权">
        <p>
          本应用的界面、文字、图标、程序等内容受知识产权法律保护。未经我们的书面许可，您不得复制、修改、分发、出租或商业使用本应用的任何内容。您自行录入的咖啡记录内容归您所有。
        </p>
      </Section>

      <Section title="6. 免责声明">
        <p>
          本应用按“原样”提供，我们不对其作出任何明示或暗示的保证。在法律允许的范围内，我们不保证本应用完全无错误、不中断或满足您的特定需求；因设备故障、系统升级、误操作、不可抗力等导致的数据丢失或使用中断，我们不承担责任。
        </p>
        <p>
          本应用仅用于个人咖啡记录与消费统计，不构成医疗、健康、营养或消费建议。咖啡因摄入量及个人健康状况请自行判断，必要时请咨询专业人士。
        </p>
      </Section>

      <Section title="7. 服务变更、中止与终止">
        <p>
          我们有权根据运营需要变更、中止或终止本应用的全部或部分功能。您可以随时停止使用并卸载本应用。协议终止后，与本应用本地数据相关的删除操作仍由您在设备上完成。
        </p>
      </Section>

      <Section title="8. 适用法律与争议解决">
        <p>
          本协议的订立、执行和解释均适用中华人民共和国法律。因本协议产生的争议，双方应首先友好协商解决；协商不成的，任何一方可向深圳市有管辖权的人民法院提起诉讼。
        </p>
      </Section>

      <Section title="9. 联系我们">
        <div className="rounded-xl border border-[#E6DDD1] bg-[#FFFFFF] p-3 dark:border-[#382E26] dark:bg-[#211B16]">
          <p>
            <Strong>电子邮箱：</Strong>
            <span className="break-all">{CONTACT_EMAIL}</span>
          </p>
        </div>
      </Section>

      <div className="border-t border-[#EFE7DC] pt-4 text-center text-xs text-[#8C7A6B] dark:border-[#2F261F] dark:text-[#9E8C7C]">
        <p>© 2026 {COMPANY_NAME} 版权所有</p>
      </div>
    </div>
  );
}

export function LegalDocumentModal({
  doc,
  onClose,
}: {
  doc: LegalDocumentKind;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const title = doc === 'privacy' ? '隐私政策' : '用户服务协议';

  return (
    <div
      className="legal-overlay-in fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-document-title"
    >
      <div className="legal-card-in flex max-h-[86vh] w-full max-w-lg flex-col overflow-hidden rounded-[24px] border border-[#E6DDD1] bg-[#FFFFFF] shadow-2xl dark:border-[#382E26] dark:bg-[#211B16]">
        <div className="flex shrink-0 items-center justify-between border-b border-[#EFE7DC] px-5 py-4 dark:border-[#2F261F]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#F5EFE6] text-[#7C4D2B] dark:bg-[#2A211A] dark:text-[#C89463]">
              {doc === 'privacy' ? (
                <ShieldCheck className="h-5 w-5" />
              ) : (
                <FileText className="h-5 w-5" />
              )}
            </div>
            <h2
              id="legal-document-title"
              className="truncate text-base font-semibold text-[#2C211A] dark:text-[#F4EDE4]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={`关闭${title}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3EDE4] text-[#6E5C4E] transition-transform active:scale-90 hover:bg-[#EAE1D5] dark:bg-[#2A211A] dark:text-[#B8A898] dark:hover:bg-[#332820]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#FAF7F2] p-5 dark:bg-[#16120F]">
          {doc === 'privacy' ? <PrivacyPolicyContent /> : <UserAgreementContent />}
        </div>

        <div className="shrink-0 border-t border-[#EFE7DC] px-5 py-3.5 dark:border-[#2F261F]">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] w-full rounded-xl bg-[#7C4D2B] text-sm font-medium text-white transition-opacity hover:opacity-95 dark:bg-[#C89463] dark:text-[#16120F]"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  );
}

function DeclineDialog({
  onCancel,
  onConfirm,
}: {
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onCancel]);

  return (
    <div
      className="legal-overlay-in fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="decline-title"
    >
      <div className="legal-card-in w-full max-w-xs overflow-hidden rounded-[24px] border border-[#E6DDD1] bg-[#FFFFFF] shadow-2xl dark:border-[#382E26] dark:bg-[#211B16]">
        <div className="p-5">
          <h2
            id="decline-title"
            className="mb-2 text-lg font-bold text-[#2C211A] dark:text-[#F4EDE4]"
          >
            确认拒绝
          </h2>
          <p className="text-sm leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
            您确定要拒绝《用户服务协议》与《隐私政策》吗？拒绝后将无法使用恋咖手记，也不会再向您的设备写入新的咖啡记录。
          </p>
        </div>
        <div className="flex border-t border-[#EFE7DC] dark:border-[#2F261F]">
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[48px] flex-1 text-sm font-medium text-[#6E5C4E] transition-colors hover:bg-[#F5EFE6] dark:text-[#CBBBA9] dark:hover:bg-[#29211B]"
          >
            取消
          </button>
          <div className="w-px bg-[#EFE7DC] dark:bg-[#2F261F]" />
          <button
            type="button"
            onClick={onConfirm}
            className="min-h-[48px] flex-1 text-sm font-medium text-[#7C4D2B] transition-colors hover:bg-[#F5EFE6] dark:text-[#C89463] dark:hover:bg-[#29211B]"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

export function LegalGate({ onAccept }: { onAccept: () => void }) {
  const [doc, setDoc] = useState<LegalDocumentKind | null>(null);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F2ECE3] px-6 text-[#2C211A] dark:bg-[#0F0C0A] dark:text-[#F4EDE4]">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EFE7DC] text-[#7C4D2B] dark:bg-[#2A211A] dark:text-[#C89463]">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold">未同意协议</h1>
        <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-[#6E5C4E] dark:text-[#B8A898]">
          您已拒绝《用户服务协议》与《隐私政策》。未同意前，恋咖手记无法继续使用，也不会再写入新的咖啡记录。
        </p>
        <button
          type="button"
          onClick={() => setDeclined(false)}
          className="mt-6 min-h-[44px] rounded-xl bg-[#7C4D2B] px-6 text-sm font-medium text-white transition-opacity hover:opacity-95 dark:bg-[#C89463] dark:text-[#16120F]"
        >
          重新阅读协议
        </button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-y-auto bg-[#F2ECE3] px-4 py-8 dark:bg-[#0F0C0A]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 overflow-hidden"
      >
        <div className="absolute -left-20 top-10 h-56 w-56 rounded-full bg-[#E8DDCE]/70 blur-3xl dark:bg-[#2A211A]/60" />
        <div className="absolute -right-24 bottom-0 h-64 w-64 rounded-full bg-[#DCCBB6]/50 blur-3xl dark:bg-[#342820]/50" />
      </div>

      <div className="legal-card-in relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-sm flex-col justify-center">
        <div className="mb-5 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C4D2B] text-white shadow-lg shadow-[#7C4D2B]/25 dark:bg-[#C89463] dark:text-[#16120F]">
            <Coffee className="h-7 w-7" />
          </div>
          <h1 className="font-display mt-3 text-2xl font-bold tracking-tight text-[#2C211A] dark:text-[#F4EDE4]">
            恋咖手记
          </h1>
          <p className="mt-1 text-xs text-[#7A6859] dark:text-[#9E8C7C]">
            记录每一杯咖啡的风味与心情
          </p>
        </div>

        <div className="flex max-h-[82vh] flex-col overflow-hidden rounded-[28px] border border-[#E6DDD1] bg-[#FFFFFF] shadow-2xl dark:border-[#382E26] dark:bg-[#211B16]">
          <div className="flex-1 overflow-y-auto p-6">
            <h2 className="text-center text-lg font-bold text-[#2C211A] dark:text-[#F4EDE4]">
              用户协议与隐私政策
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
              请您在使用前仔细阅读并同意以下内容：
            </p>

            <ul className="mt-3 space-y-3">
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-[11px] font-semibold text-[#7C4D2B] dark:bg-[#2A211A] dark:text-[#C89463]">
                  1
                </span>
                <p className="text-sm leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
                  《隐私政策》中关于本地咖啡记录、消费金额、评分、备注及配图的存储与使用说明。
                </p>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#F5EFE6] text-[11px] font-semibold text-[#7C4D2B] dark:bg-[#2A211A] dark:text-[#C89463]">
                  2
                </span>
                <p className="text-sm leading-relaxed text-[#5C4B3E] dark:text-[#CBBBA9]">
                  《隐私政策》中关于第三方 SDK 与数据共享的说明：本应用未集成任何第三方 SDK，不会向任何第三方共享您的数据。
                </p>
              </li>
            </ul>

            <p className="mt-4 text-xs leading-relaxed text-[#7A6859] dark:text-[#9E8C7C]">
              阅读完整的
              <button
                type="button"
                onClick={() => setDoc('agreement')}
                className="mx-0.5 font-medium text-[#7C4D2B] underline-offset-2 hover:underline dark:text-[#C89463]"
              >
                《用户服务协议》
              </button>
              和
              <button
                type="button"
                onClick={() => setDoc('privacy')}
                className="mx-0.5 font-medium text-[#7C4D2B] underline-offset-2 hover:underline dark:text-[#C89463]"
              >
                《隐私政策》
              </button>
              了解详细内容。
            </p>

            <div className="mt-5 flex items-start gap-2 rounded-xl bg-[#F5EFE6] p-3 dark:bg-[#2A211A]">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#7C4D2B] dark:text-[#C89463]" />
              <p className="text-xs leading-relaxed text-[#6E5C4E] dark:text-[#B8A898]">
                我们仅在本机保存您的数据，不上传服务器，也不向任何第三方共享。
              </p>
            </div>
          </div>

          <div className="flex shrink-0 border-t border-[#EFE7DC] dark:border-[#2F261F]">
            <button
              type="button"
              onClick={() => setDeclineOpen(true)}
              className="min-h-[52px] flex-1 text-sm font-medium text-[#6E5C4E] transition-colors hover:bg-[#F5EFE6] dark:text-[#CBBBA9] dark:hover:bg-[#29211B]"
            >
              不同意
            </button>
            <div className="w-px bg-[#EFE7DC] dark:bg-[#2F261F]" />
            <button
              type="button"
              onClick={() => {
                persistLegalConsent();
                onAccept();
              }}
              className="min-h-[52px] flex-1 text-sm font-semibold text-white transition-colors bg-[#7C4D2B] hover:bg-[#6B4124] dark:bg-[#C89463] dark:text-[#16120F] dark:hover:bg-[#D6A578]"
            >
              同意并继续
            </button>
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-[#8C7A6B] dark:text-[#9E8C7C]">
          同意后，您仍可随时在「设置」中查看协议与隐私政策
        </p>
      </div>

      {doc && <LegalDocumentModal doc={doc} onClose={() => setDoc(null)} />}
      {declineOpen && (
        <DeclineDialog
          onCancel={() => setDeclineOpen(false)}
          onConfirm={() => {
            setDeclineOpen(false);
            setDeclined(true);
          }}
        />
      )}
    </div>
  );
}
