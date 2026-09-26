import Link from "next/link";

// Checkboxes de consentimento (LGPD). Os obrigatórios são validados no servidor e no banco.
export default function ConsentFields({ minor }: { minor: boolean }) {
  const box = "mt-1 h-5 w-5 shrink-0 accent-brand";

  return (
    <fieldset className="space-y-3">
      <legend className="mb-1 text-sm font-semibold">Consentimentos</legend>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="termos_uso" className={box} />
        <span>
          Li e aceito os{" "}
          <Link href="/termos" target="_blank" className="underline">
            Termos de Uso
          </Link>
          . <span className="text-muted">(obrigatório)</span>
        </span>
      </label>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="politica_privacidade" className={box} />
        <span>
          Li e aceito a{" "}
          <Link href="/privacidade" target="_blank" className="underline">
            Política de Privacidade
          </Link>
          . <span className="text-muted">(obrigatório)</span>
        </span>
      </label>

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="dados_saude" className={box} />
        <span>
          Autorizo o tratamento dos meus <strong>dados de saúde</strong> (anamnese, medidas e
          avaliações físicas) pelo meu Personal Trainer para acompanhar meu treino.{" "}
          <span className="text-muted">(obrigatório)</span>
        </span>
      </label>

      {minor && (
        <label className="flex gap-3 text-sm">
          <input type="checkbox" name="responsavel_legal" className={box} />
          <span>
            Sou o <strong>responsável legal</strong> por este aluno menor de 18 anos e autorizo o
            uso da plataforma. <span className="text-muted">(obrigatório)</span>
          </span>
        </label>
      )}

      <label className="flex gap-3 text-sm">
        <input type="checkbox" name="fotos_evolucao" className={box} />
        <span>
          Autorizo o envio e a visualização das minhas <strong>fotos de evolução</strong> pelo meu
          Personal. <span className="text-muted">(opcional; posso revogar a qualquer momento)</span>
        </span>
      </label>
    </fieldset>
  );
}
