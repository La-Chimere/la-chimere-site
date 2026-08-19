import { serverT } from "@/lib/i18n/server";

export default async function CguPage() {
  const [back, placeholder] = await Promise.all([
    serverT("common.back"),
    serverT("cgu.placeholder"),
  ]);
  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          ‹ {back}
        </a>
      </div>
      <p className="empty-hint info-box-placeholder">{placeholder}</p>
    </div>
  );
}
