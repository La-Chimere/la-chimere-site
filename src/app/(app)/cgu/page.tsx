import { serverT } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui/BackButton";

export default async function CguPage() {
  const [title, placeholder] = await Promise.all([
    serverT("cgu.title"),
    serverT("cgu.placeholder"),
  ]);
  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>
      <h1 className="page-title">{title}</h1>
      <div className="section-card">
        <p className="info-box-text info-box-placeholder">{placeholder}</p>
      </div>
    </div>
  );
}
