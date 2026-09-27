import Link from "next/link";
import { Fill, LegalPage, type LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Termos de Uso" };

const ul = "list-disc space-y-1.5 pl-5 marker:text-muted";
const b = "font-semibold text-ink";

const sections: LegalSection[] = [
  {
    id: "servico",
    title: "O que é a plataforma",
    body: (
      <>
        <p>
          Esta plataforma é a ferramenta de acompanhamento do Personal Trainer{" "}
          <Fill value={LEGAL.controllerName} hint="nome completo ou razão social" /> (
          <Fill value={LEGAL.cref} hint="número do CREF" />
          ). Por ela você recebe suas fichas de treino, vê os vídeos e as imagens dos exercícios, registra
          o que executou, faz check-in e check-out, responde ao feedback semanal, acompanha suas
          avaliações e sua evolução e conversa com o seu Personal.
        </p>
        <p>
          O acesso é somente por convite do Personal. Ao ativar sua conta, você concorda com estes Termos
          e com a <Link href="/privacidade" className="text-brand-ink underline">Política de Privacidade</Link>.
        </p>
      </>
    ),
  },
  {
    id: "conta",
    title: "Sua conta",
    body: (
      <ul className={ul}>
        <li>A conta é pessoal e intransferível. Não compartilhe sua senha com ninguém.</li>
        <li>
          Se suspeitar que alguém usou sua conta, troque a senha (“Esqueci minha senha”) e avise o
          Personal.
        </li>
        <li>
          Menores de 18 anos só usam a plataforma com autorização do responsável legal, que responde pelo
          uso da conta.
        </li>
        <li>Mantenha seus dados de cadastro e de saúde corretos e atualizados.</li>
      </ul>
    ),
  },
  {
    id: "saude",
    title: "Saúde e segurança nos treinos",
    body: (
      <>
        <p>
          Os treinos são prescritos pelo seu Personal, profissional de Educação Física registrado no CREF
          e responsável pela orientação técnica. Para que isso seja feito com segurança, você se
          compromete a:
        </p>
        <ul className={ul}>
          <li>
            informar com sinceridade seu histórico de saúde, lesões, medicamentos e qualquer mudança no
            seu estado de saúde;
          </li>
          <li>
            procurar avaliação médica quando o Personal recomendar ou quando o questionário de prontidão
            (PAR-Q) indicar;
          </li>
          <li>
            <span className={b}>parar o exercício imediatamente</span> se sentir dor no peito, falta de ar
            fora do normal, tontura, dor forte ou qualquer mal-estar, e avisar o Personal;
          </li>
          <li>seguir as cargas, repetições e orientações da ficha e tirar dúvidas antes de executar.</li>
        </ul>
        <p>
          A plataforma <span className={b}>não substitui atendimento médico</span> e não serve para
          emergências. Em caso de emergência, ligue 192 (SAMU).
        </p>
        <p>
          Calorias estimadas, volume de treino e outros cálculos exibidos no app são{" "}
          <span className={b}>aproximações</span> para acompanhamento, não medições nem diagnósticos.
        </p>
      </>
    ),
  },
  {
    id: "uso",
    title: "Uso adequado",
    body: (
      <>
        <p>Ao usar a plataforma, você concorda em não:</p>
        <ul className={ul}>
          <li>enviar pelo chat conteúdo ofensivo, ilegal, discriminatório ou que não seja seu;</li>
          <li>enviar como “foto de evolução” imagem de outra pessoa;</li>
          <li>tentar acessar dados de outros alunos ou burlar as proteções do sistema;</li>
          <li>
            copiar, vender ou divulgar as fichas, os vídeos e os materiais do Personal. Eles são para seu
            uso pessoal.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "fotos",
    title: "Fotos de evolução",
    body: (
      <p>
        O envio de fotos é opcional e depende da sua autorização, que pode ser retirada a qualquer
        momento no app. Só você e o seu Personal veem suas fotos, e só você pode apagá-las. Elas nunca
        são usadas em divulgação sem uma autorização específica e separada.
      </p>
    ),
  },
  {
    id: "contratacao",
    title: "Contratação e pagamento",
    body: (
      <p>
        A plataforma é uma ferramenta do acompanhamento. Valores, forma de pagamento, duração e
        cancelamento do serviço do Personal são combinados diretamente entre você e ele, fora do app.
        Se houver contrato de prestação de serviço, ele prevalece sobre estes Termos no que tratar de
        pagamento e prazos.
      </p>
    ),
  },
  {
    id: "disponibilidade",
    title: "Disponibilidade",
    body: (
      <p>
        Nos esforçamos para manter a plataforma funcionando, mas ela pode ficar fora do ar por
        manutenção, falhas de internet ou de provedores. Se algo não for gravado (por exemplo, uma série
        do treino), o app mostra uma mensagem de erro na tela; nesse caso, tente de novo ou avise o
        Personal.
      </p>
    ),
  },
  {
    id: "encerramento",
    title: "Encerramento do acesso",
    body: (
      <>
        <p>
          Você pode pedir o encerramento da sua conta a qualquer momento, pelo chat ou pelo e-mail{" "}
          <Fill value={LEGAL.privacyEmail} hint="e-mail de contato" />. O Personal pode pausar ou encerrar
          o acesso ao fim do acompanhamento ou em caso de descumprimento destes Termos.
        </p>
        <p>
          O que acontece com seus dados depois disso está explicado na{" "}
          <Link href="/privacidade#tempo" className="text-brand-ink underline">
            Política de Privacidade
          </Link>
          .
        </p>
      </>
    ),
  },
  {
    id: "mudancas",
    title: "Mudanças nestes Termos",
    body: (
      <p>
        Estes Termos podem ser atualizados. A data no topo mostra a versão atual. Mudanças importantes
        serão avisadas pelo app e, quando necessário, pediremos um novo aceite.
      </p>
    ),
  },
  {
    id: "lei",
    title: "Lei aplicável e contato",
    body: (
      <>
        <p>
          Estes Termos seguem as leis brasileiras, incluindo o Código de Defesa do Consumidor e a LGPD.
          Eventuais disputas serão resolvidas no foro do seu domicílio.
        </p>
        <p>
          Dúvidas: fale pelo chat do app ou pelo e-mail{" "}
          <Fill value={LEGAL.privacyEmail} hint="e-mail de contato" />. Responsável:{" "}
          <Fill value={LEGAL.controllerName} hint="nome completo ou razão social" />,{" "}
          <Fill value={LEGAL.controllerDocument} hint="CPF ou CNPJ" />.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Termos de Uso"
      intro={
        <p>
          Estas são as regras de uso da plataforma de acompanhamento de treino. Leia com atenção. Elas
          explicam o que a plataforma faz, o que esperamos de você e como cuidamos da sua segurança.
        </p>
      }
      sections={sections}
    />
  );
}
