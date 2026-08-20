import { serverT } from "@/lib/i18n/server";
import { BackArrowIcon } from "@/components/ui/icons";

export default async function CguPage() {
  const [back, title, placeholder] = await Promise.all([
    serverT("common.back"),
    serverT("cgu.title"),
    serverT("cgu.placeholder"),
  ]);
  return (
    <div className="page">
      <div className="subpage-back-row">
        <a href="/programme" className="subpage-back">
          <BackArrowIcon /> {back}
        </a>
      </div>
      <h1 className="page-title">{title}</h1>
      <div className="section-card">
        <p className="info-box-text info-box-placeholder">{placeholder}</p>
      </div>
    </div>
  );
}
