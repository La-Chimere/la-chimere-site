import { serverT } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui/BackButton";

export default async function FaqPage() {
  const [title, q1, a1, q2, a2, q3, a3, q4, a4] = await Promise.all([
    serverT("faq.title"),
    serverT("faq.q1"),
    serverT("faq.a1"),
    serverT("faq.q2"),
    serverT("faq.a2"),
    serverT("faq.q3"),
    serverT("faq.a3"),
    serverT("faq.q4"),
    serverT("faq.a4"),
  ]);
  const entries = [
    { q: q1, a: a1 },
    { q: q2, a: a2 },
    { q: q3, a: a3 },
    { q: q4, a: a4 },
  ];
  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>
      <h1 className="page-title">{title}</h1>
      {entries.map((entry) => (
        <div className="info-box" key={entry.q}>
          <p className="info-box-title">{entry.q}</p>
          <p className="info-box-text">{entry.a}</p>
        </div>
      ))}
    </div>
  );
}
