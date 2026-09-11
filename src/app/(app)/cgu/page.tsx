import { serverT } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui/BackButton";

export default async function CguPage() {
  const [title, p1, p2, p3, p4] = await Promise.all([
    serverT("cgu.title"),
    serverT("cgu.p1"),
    serverT("cgu.p2"),
    serverT("cgu.p3"),
    serverT("cgu.p4"),
  ]);
  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>
      <h1 className="page-title">{title}</h1>
      <div className="section-card">
        <p className="info-box-text">{p1}</p>
        <p className="info-box-text">{p2}</p>
        <p className="info-box-text">{p3}</p>
        <p className="info-box-text">{p4}</p>
      </div>
    </div>
  );
}
