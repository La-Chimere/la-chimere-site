import { serverT } from "@/lib/i18n/server";
import { BackButton } from "@/components/ui/BackButton";

export default async function FaqPage() {
  const [title, placeholder, q1, q2, q3, q4] = await Promise.all([
    serverT("faq.title"),
    serverT("faq.placeholder"),
    serverT("faq.q1"),
    serverT("faq.q2"),
    serverT("faq.q3"),
    serverT("faq.q4"),
  ]);
  const questions = [q1, q2, q3, q4];
  return (
    <div className="page">
      <div className="subpage-back-row">
        <BackButton />
      </div>
      <h1 className="page-title">{title}</h1>
      {questions.map((q) => (
        <div className="info-box" key={q}>
          <p className="info-box-title">{q}</p>
          <p className="info-box-text info-box-placeholder">{placeholder}</p>
        </div>
      ))}
    </div>
  );
}
