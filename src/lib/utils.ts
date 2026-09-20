// Menor de 18 anos? (mesma regra usada pelo banco em required_consents_met)
export function isMinor(birthDate: string | null | undefined) {
  if (!birthDate) return false;
  const birth = new Date(`${birthDate}T00:00:00`);
  const limit = new Date();
  limit.setFullYear(limit.getFullYear() - 18);
  return birth > limit;
}
