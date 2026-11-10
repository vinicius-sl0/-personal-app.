import s from "@/components/landing/landing.module.css";

function Track({ words }: { words: string[] }) {
  return (
    <div className={s.track}>
      {[0, 1].map((k) => (
        <div key={k} className={s.set}>
          {words.map((w, i) => (
            <span key={i} className={s.word}>
              {w}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

// Duas faixas inclinadas que passam devagar em sentidos opostos, cruzando a passagem da primeira
// tela para os benefícios. Decorativas: o mesmo conteúdo está nos benefícios, por isso ficam
// escondidas do leitor de tela. Paradas com "reduzir movimento".
export default function Ribbons({ words }: { words: string[] }) {
  // Conjunto repetido para preencher telas largas; a animação desloca exatamente metade da trilha.
  const set = [...words, ...words, ...words];
  return (
    <div aria-hidden className={s.ribbons}>
      <div className={`${s.ribbon} ${s.ribbonB}`}>
        <Track words={set} />
      </div>
      <div className={`${s.ribbon} ${s.ribbonA}`}>
        <Track words={set} />
      </div>
    </div>
  );
}
