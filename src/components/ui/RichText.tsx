import { Fragment } from "react";

// Rendu texte + <strong> sans jamais passer par dangerouslySetInnerHTML : le
// texte (statique aujourd'hui, mais venant du dictionnaire i18n) est rendu
// tel quel par JSX (donc échappé), seuls les segments entre <strong></strong>
// deviennent un vrai élément <strong> — aucun autre balisage n'est interprété.
export function StrongText({ text }: { text: string }) {
  const parts = text.split(/(<strong>.*?<\/strong>)/g);
  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/^<strong>([\s\S]*)<\/strong>$/);
        return <Fragment key={i}>{match ? <strong>{match[1]}</strong> : part}</Fragment>;
      })}
    </>
  );
}
