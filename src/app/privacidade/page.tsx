import { Fill, LegalPage, type LegalSection } from "@/components/legal-page";
import { LEGAL } from "@/lib/legal";

export const metadata = { title: "Política de Privacidade" };

const ul = "list-disc space-y-1.5 pl-5 marker:text-muted";
const b = "font-semibold text-ink";

// Texto escrito a partir do que o app realmente faz (dados guardados, quem acessa, proteções).
// Se uma funcionalidade nova passar a guardar outro tipo de dado, atualize esta página.
const sections: LegalSection[] = [
  {
    id: "quem-somos",
    title: "Quem cuida dos seus dados",
    body: (
      <>
        <p>
          O responsável pelos seus dados pessoais (o “controlador”, na linguagem da LGPD) é o seu Personal
          Trainer: <Fill value={LEGAL.controllerName} hint="nome completo ou razão social" />,{" "}
          <Fill value={LEGAL.controllerDocument} hint="CPF ou CNPJ" />,{" "}
          <Fill value={LEGAL.cref} hint="número do CREF" />.
        </p>
        <p>
          Para qualquer assunto sobre seus dados, fale pelo chat do app ou pelo e-mail{" "}
          <Fill value={LEGAL.privacyEmail} hint="e-mail de contato" />. Esse é também o canal do
          encarregado de dados.
        </p>
      </>
    ),
  },
  {
    id: "dados",
    title: "Quais dados guardamos",
    body: (
      <>
        <p>Guardamos apenas o necessário para o acompanhamento do seu treino:</p>
        <ul className={ul}>
          <li>
            <span className={b}>Cadastro:</span> nome, e-mail, telefone, data de nascimento, sexo, objetivo,
            data de início, dias de treino combinados e contato de emergência. Se você tiver menos de 18
            anos, também nome e contato do responsável legal.
          </li>
          <li>
            <span className={b}>Conta:</span> e-mail e senha. A senha é guardada de forma criptografada;
            nem o Personal consegue vê-la.
          </li>
          <li>
            <span className={b}>Dados de saúde</span> (dados sensíveis): anamnese (lesões, medicamentos,
            condições de saúde, questionário de prontidão), avaliações físicas (peso, altura, medidas,
            dobras cutâneas, composição corporal) e as respostas do feedback semanal sobre dor,
            disposição e bem-estar.
          </li>
          <li>
            <span className={b}>Treino:</span> suas fichas, as séries, repetições e cargas que você
            registra, e o horário de check-in e check-out de cada treino.
          </li>
          <li>
            <span className={b}>Fotos de evolução</span> (opcional): só se você autorizar. Antes do envio,
            o próprio app reduz a foto e remove informações escondidas no arquivo, como a localização
            (GPS) e o modelo do celular.
          </li>
          <li>
            <span className={b}>Mensagens</span> trocadas com o Personal pelo chat, com data, hora e a
            indicação de lida.
          </li>
          <li>
            <span className={b}>Avisos</span> do app (ex.: “nova mensagem”, “novo treino”).
          </li>
          <li>
            <span className={b}>Registros técnicos:</span> data, hora, endereço IP e tipo de navegador
            no momento em que você aceita estes termos, para comprovar o aceite; e registros de acesso
            guardados pelos provedores de hospedagem.
          </li>
        </ul>
        <p>
          O Personal também pode fazer anotações internas sobre o seu acompanhamento, que só ele vê.
          Elas estão sujeitas às mesmas regras desta política, inclusive ao seu direito de acesso.
        </p>
      </>
    ),
  },
  {
    id: "para-que",
    title: "Para que usamos e com qual base legal",
    body: (
      <>
        <ul className={ul}>
          <li>
            <span className={b}>Prestar o acompanhamento</span> (montar e ajustar treinos, registrar
            execução e frequência, conversar pelo chat): execução do contrato entre você e o Personal
            (LGPD, art. 7º, V).
          </li>
          <li>
            <span className={b}>Dados de saúde:</span> seu consentimento específico e destacado, dado
            na ativação da conta (LGPD, art. 11, I). Eles servem para prescrever treinos seguros e
            acompanhar sua evolução.
          </li>
          <li>
            <span className={b}>Fotos de evolução:</span> consentimento separado e opcional, que você
            pode retirar quando quiser.
          </li>
          <li>
            <span className={b}>Menores de 18 anos:</span> consentimento do responsável legal (LGPD,
            art. 14).
          </li>
          <li>
            <span className={b}>Comprovar aceites e guardar registros de acesso:</span> cumprimento de
            obrigação legal (Marco Civil da Internet) e defesa de direitos (LGPD, art. 7º, II e VI).
          </li>
        </ul>
        <p>
          <span className={b}>Não usamos seus dados para publicidade, não vendemos e não
          alugamos.</span> O app não usa ferramentas de rastreamento ou de anúncios. Suas fotos nunca
          são usadas em divulgação sem uma autorização específica, separada e por escrito.
        </p>
        <p>
          Cálculos como calorias estimadas e volume de treino são aproximações para acompanhamento, não
          diagnósticos.
        </p>
      </>
    ),
  },
  {
    id: "quem-acessa",
    title: "Quem tem acesso",
    body: (
      <>
        <ul className={ul}>
          <li>
            <span className={b}>Você</span> vê os seus próprios dados.
          </li>
          <li>
            <span className={b}>O seu Personal</span> vê os dados dos alunos dele. As fotos de evolução
            só ficam visíveis enquanto a sua autorização estiver ativa.
          </li>
          <li>
            <span className={b}>Outros alunos nunca veem</span> nada seu. Essa separação é garantida por
            regras no próprio banco de dados, e não só pelas telas.
          </li>
          <li>
            <span className={b}>Provedores de tecnologia</span> que fazem o app funcionar e apenas
            processam os dados em nosso nome, sem poder usá-los para outros fins: Supabase (banco de
            dados, arquivos e login) e Vercel (hospedagem do site). Também o provedor de e-mail usado
            para enviar a recuperação de senha.
          </li>
          <li>
            <span className={b}>Autoridades</span>, somente quando houver obrigação legal ou ordem
            judicial.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "onde",
    title: "Onde os dados ficam",
    body: (
      <>
        <p>
          O banco de dados e as fotos ficam hospedados em servidores da Supabase na região{" "}
          <Fill value={LEGAL.dataRegion} hint="região do Supabase" />. O site é entregue pela Vercel, que
          usa servidores em vários países, inclusive fora do Brasil.
        </p>
        <p>
          Quando há transferência para fora do país, ela acontece com provedores que adotam cláusulas
          contratuais e padrões de segurança compatíveis com a LGPD (art. 33).
        </p>
      </>
    ),
  },
  {
    id: "seguranca",
    title: "Como protegemos",
    body: (
      <ul className={ul}>
        <li>Toda a comunicação com o app é criptografada (HTTPS).</li>
        <li>Senhas guardadas de forma criptografada.</li>
        <li>
          Regras de acesso dentro do banco de dados, testadas automaticamente, garantem que cada pessoa
          só enxergue o que pode.
        </li>
        <li>
          Fotos guardadas em área privada; para exibi-las, o app gera links temporários que expiram em 1
          hora.
        </li>
        <li>Localização (GPS) e outras informações ocultas são removidas das fotos antes do envio.</li>
        <li>O cadastro é feito só por convite do Personal, com link de uso único.</li>
      </ul>
    ),
  },
  {
    id: "tempo",
    title: "Por quanto tempo guardamos",
    body: (
      <>
        <p>
          Enquanto você for aluno, seus dados ficam guardados para mostrar sua evolução ao longo do
          tempo. Depois do fim do acompanhamento, ou quando você pedir a exclusão, os dados são
          apagados ou anonimizados em até{" "}
          <Fill value={LEGAL.retentionAfterEnd} hint="prazo, ex.: 6 meses" />.
        </p>
        <p>
          Algumas informações podem ser guardadas por mais tempo quando a lei exigir ou para defesa em
          processos: o registro dos seus aceites e os registros de acesso (mínimo de 6 meses, pelo Marco
          Civil da Internet).
        </p>
        <p>
          As fotos de evolução podem ser apagadas por você a qualquer momento, direto no app.
        </p>
      </>
    ),
  },
  {
    id: "direitos",
    title: "Seus direitos",
    body: (
      <>
        <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
        <ul className={ul}>
          <li>saber se tratamos seus dados e ter acesso a eles;</li>
          <li>corrigir dados incompletos, errados ou desatualizados;</li>
          <li>pedir a anonimização, o bloqueio ou a exclusão de dados desnecessários;</li>
          <li>pedir a portabilidade (uma cópia dos seus dados para levar a outro profissional);</li>
          <li>saber com quem seus dados são compartilhados;</li>
          <li>retirar um consentimento e saber o que acontece se não consentir;</li>
          <li>reclamar à ANPD (Autoridade Nacional de Proteção de Dados), em gov.br/anpd.</li>
        </ul>
        <p>
          <span className={b}>Como pedir:</span> pelo chat do app ou pelo e-mail{" "}
          <Fill value={LEGAL.privacyEmail} hint="e-mail de contato" />. Respondemos em até 15 dias.
        </p>
        <p>
          <span className={b}>Fotos:</span> a autorização pode ser retirada e as fotos apagadas por você
          mesmo, no app. <span className={b}>Dados de saúde:</span> também podem ter o consentimento
          retirado, mas, sem eles, não é possível prescrever treinos com segurança; nesse caso o
          acompanhamento pela plataforma é encerrado.
        </p>
      </>
    ),
  },
  {
    id: "menores",
    title: "Alunos menores de 18 anos",
    body: (
      <p>
        O acesso de menores de 18 anos só é liberado com o consentimento do responsável legal, dado na
        ativação da conta. O responsável pode exercer todos os direitos desta política em nome do aluno.
      </p>
    ),
  },
  {
    id: "armazenamento",
    title: "Cookies e armazenamento no aparelho",
    body: (
      <p>
        O app usa apenas o necessário para funcionar: um cookie que mantém você conectado e uma
        informação guardada no seu navegador para retomar um treino em andamento caso a página seja
        recarregada. Não usamos cookies de publicidade nem de análise de audiência.
      </p>
    ),
  },
  {
    id: "mudancas",
    title: "Mudanças nesta política",
    body: (
      <p>
        Se esta política mudar, a data no topo da página será atualizada. Mudanças importantes serão
        avisadas pelo app e, quando a lei exigir, pediremos um novo aceite.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Política de Privacidade"
      intro={
        <p>
          Esta política explica, de forma simples, quais dados o app de acompanhamento de treino guarda,
          para que servem, quem tem acesso e como você controla suas informações, de acordo com a Lei
          Geral de Proteção de Dados (LGPD — Lei 13.709/2018).
        </p>
      }
      sections={sections}
    />
  );
}
