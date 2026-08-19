import { NextResponse } from "next/server";

// Réinitialisation de mot de passe par un admin (CDC 6.1/12.9) — implémenté
// avec la page Admin (à venir). Ce stub garde la route réservée et refuse
// tout appel pour l'instant.
export async function POST() {
  return NextResponse.json({ error: "Pas encore implémenté." }, { status: 501 });
}
