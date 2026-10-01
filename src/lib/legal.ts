// DADOS DOS TERMOS DE USO E DA POLÍTICA DE PRIVACIDADE — o único lugar para preencher.
// Enquanto algum campo estiver null (ou reviewedByLawyer = false), as páginas /termos e
// /privacidade mostram uma faixa de "rascunho" e o campo aparece destacado como "a preencher".
//
// Ao mudar o TEXTO das páginas de forma relevante, atualize `updatedAt` e também
// CONSENT_VERSION em src/lib/consents.ts (os próximos aceites ficam registrados com a nova versão).

export const LEGAL = {
  // Quem é o responsável pelos dados (o Personal, pessoa física ou empresa).
  controllerName: null as string | null, // ex.: "João da Silva" ou "JS Treinamento LTDA"
  controllerDocument: null as string | null, // ex.: "CPF 000.000.000-00" ou "CNPJ 00.000.000/0001-00"
  cref: null as string | null, // ex.: "CREF 000000-G/SP"
  // Canal para pedidos sobre dados pessoais (acesso, correção, exclusão...).
  privacyEmail: null as string | null, // ex.: "contato@seudominio.com.br"
  // Onde o banco de dados está hospedado (Supabase → Project Settings → General → Region).
  dataRegion: null as string | null, // ex.: "São Paulo (Brasil)" ou "Estados Unidos"
  // Por quanto tempo os dados ficam guardados depois do fim do acompanhamento.
  retentionAfterEnd: null as string | null, // ex.: "6 meses"
  // Data da versão atual dos textos (AAAA-MM-DD).
  updatedAt: "2026-09-30",
  // Mude para true só depois que um advogado revisar os textos.
  reviewedByLawyer: false,
};

export function legalIsComplete() {
  const { reviewedByLawyer, updatedAt: _u, ...fields } = LEGAL;
  return reviewedByLawyer && Object.values(fields).every((v) => v !== null && v !== "");
}
