-- =====================================================================
-- 09_importar_exercicios.sql  |  Plataforma Personal Trainer
-- Importa a biblioteca de exercícios validada pelo Personal, EM NOME DELE.
--
--  * Cria os grupos musculares e equipamentos novos.
--  * Passa para o Personal os 20 exercícios iniciais do seed (mantém o mesmo id,
--    então qualquer treino que já os use continua funcionando).
--  * Cadastra os demais exercícios e os grupos musculares secundários.
--
-- RODE UMA ÚNICA VEZ, no projeto onde o Personal já foi criado (06_criar_personal.sql).
-- Depois disso a fonte da verdade é o sistema: edições futuras são feitas pela tela
-- da biblioteca (não reimporte a planilha, para não sobrescrever ajustes dele).
-- Se algo falhar, nada é gravado (transação única).
-- =====================================================================

-- Dono dos exercícios: precisa existir EXATAMENTE 1 Personal
create temp table _imp_owner as
  select id from public.profiles where role = 'personal';

do $$
begin
  if (select count(*) from _imp_owner) <> 1 then
    raise exception 'Esperava exatamente 1 Personal cadastrado; encontrei %. Rode antes o 06_criar_personal.sql.',
      (select count(*) from _imp_owner);
  end if;
end;
$$;

-- ---------------------------------------------------------------------
-- 1) Grupos musculares e equipamentos novos
-- ---------------------------------------------------------------------
insert into public.muscle_groups (slug, name, sort_order) values
  ('adutores', 'Adutores', 160),
  ('abdutores', 'Abdutores', 170)
on conflict (slug) do nothing;

insert into public.equipment (slug, name, sort_order) values
  ('barra_w', 'Barra W (EZ)', 120),
  ('smith', 'Smith (barra guiada)', 130),
  ('bola_suica', 'Bola suíça', 140),
  ('corda_naval', 'Corda naval', 150),
  ('anilha', 'Anilha', 160),
  ('caixa_step', 'Caixa / Step', 170),
  ('roda_abdominal', 'Roda abdominal', 180),
  ('suspensao_trx', 'Suspensão (TRX)', 190),
  ('eliptico', 'Elíptico', 200),
  ('remo_ergometro', 'Remo (ergômetro)', 210),
  ('corda_pular', 'Corda de pular', 220)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------
-- 2) Dados da planilha (160 exercícios)
--    colunas: nome, grupo principal, grupos secundários, equipamento, dificuldade, como executar
-- ---------------------------------------------------------------------
create temp table _imp_ex (
  name  text primary key,
  mg    text not null,
  sec   text not null,
  eq    text not null,
  dif   text not null,
  descr text not null
);

insert into _imp_ex (name, mg, sec, eq, dif, descr) values
  ('Supino reto com barra', 'peito', 'triceps,ombros', 'barra', 'intermediario', 'Deitado no banco, desça a barra até a linha do peito e empurre até estender os cotovelos, com as escápulas firmes no banco.'),
  ('Supino reto com halteres', 'peito', 'triceps,ombros', 'halteres', 'iniciante', 'Deitado no banco, empurre os halteres acima do peito e desça com controle até a linha do peito.'),
  ('Supino inclinado com barra', 'peito', 'ombros,triceps', 'barra', 'intermediario', 'Em banco inclinado, desça a barra até a parte alta do peito e empurre até estender os cotovelos.'),
  ('Supino inclinado com halteres', 'peito', 'ombros,triceps', 'halteres', 'intermediario', 'Em banco inclinado, empurre os halteres acima do peito e desça com amplitude controlada.'),
  ('Supino declinado com barra', 'peito', 'triceps', 'barra', 'intermediario', 'Em banco declinado, desça a barra até a parte baixa do peito e empurre de volta com controle.'),
  ('Supino reto na máquina', 'peito', 'triceps,ombros', 'maquina', 'iniciante', 'Sentado, empurre as alças à frente até estender os cotovelos e retorne devagar.'),
  ('Supino inclinado na máquina', 'peito', 'ombros,triceps', 'maquina', 'iniciante', 'Sentado com as costas apoiadas, empurre as alças para cima e à frente e retorne com controle.'),
  ('Supino no Smith', 'peito', 'triceps,ombros', 'smith', 'iniciante', 'Deitado sob a barra guiada, desça até o peito e empurre até estender os cotovelos.'),
  ('Crucifixo reto com halteres', 'peito', 'ombros', 'halteres', 'intermediario', 'Deitado, com os cotovelos levemente flexionados, abra os braços até sentir o alongamento e feche em arco.'),
  ('Crucifixo inclinado com halteres', 'peito', 'ombros', 'halteres', 'intermediario', 'Em banco inclinado, abra os braços em arco com cotovelos levemente flexionados e feche acima do peito.'),
  ('Crucifixo na máquina', 'peito', 'ombros', 'maquina', 'iniciante', 'Sentado, junte as alças à frente do peito mantendo os cotovelos levemente flexionados.'),
  ('Crossover na polia alta', 'peito', 'ombros', 'cabos_polia', 'intermediario', 'Em pé entre as polias altas, puxe as alças para baixo e à frente até se encontrarem diante do corpo.'),
  ('Crossover na polia baixa', 'peito', 'ombros', 'cabos_polia', 'intermediario', 'Em pé entre as polias baixas, eleve as alças em arco até a altura do peito, enfatizando a parte alta.'),
  ('Flexão de braço', 'peito', 'triceps,ombros', 'peso_corporal', 'iniciante', 'Com o corpo alinhado, desça o peito em direção ao chão e empurre de volta sem arquear a lombar.'),
  ('Flexão de braço inclinada', 'peito', 'triceps,ombros', 'peso_corporal', 'iniciante', 'Com as mãos apoiadas em banco ou barra elevada, faça a flexão mantendo o corpo em linha reta (versão mais leve).'),
  ('Flexão com pés elevados', 'peito', 'ombros,triceps', 'peso_corporal', 'intermediario', 'Com os pés apoiados em um banco, faça a flexão mantendo o abdômen contraído; enfatiza a parte alta do peito.'),
  ('Paralelas (foco no peito)', 'peito', 'triceps,ombros', 'peso_corporal', 'avancado', 'Nas barras paralelas, incline o tronco à frente, desça controlando e empurre até estender os cotovelos.'),
  ('Pullover com halter', 'peito', 'costas,triceps', 'halteres', 'intermediario', 'Deitado no banco, leve o halter atrás da cabeça com os braços quase estendidos e traga de volta acima do peito.'),
  ('Puxada frontal', 'costas', 'biceps', 'cabos_polia', 'iniciante', 'Sentado, puxe a barra até a altura do peito levando os cotovelos para baixo e volte devagar.'),
  ('Puxada frontal com pegada supinada', 'costas', 'biceps', 'cabos_polia', 'iniciante', 'Com as palmas voltadas para você, puxe a barra até o peito mantendo o tronco estável.'),
  ('Puxada com triângulo', 'costas', 'biceps', 'cabos_polia', 'iniciante', 'Com o triângulo, puxe até o peito levando os cotovelos junto ao corpo.'),
  ('Pulldown com braços estendidos', 'costas', 'triceps', 'cabos_polia', 'intermediario', 'Em pé, com os braços quase estendidos, puxe a barra até as coxas contraindo as costas.'),
  ('Barra fixa', 'costas', 'biceps', 'barra_fixa', 'avancado', 'Pendurado na barra, puxe o corpo até o queixo ultrapassar a barra e desça com controle.'),
  ('Barra fixa com pegada supinada', 'costas', 'biceps', 'barra_fixa', 'avancado', 'Com as palmas voltadas para você, puxe o corpo até o queixo passar da barra e desça controlando.'),
  ('Barra fixa assistida', 'costas', 'biceps', 'maquina', 'intermediario', 'Na máquina assistida, apoie os joelhos e puxe o corpo até o queixo passar da barra.'),
  ('Remada curvada com barra', 'costas', 'biceps,ombros', 'barra', 'intermediario', 'Com o tronco inclinado e a coluna neutra, puxe a barra em direção ao abdômen.'),
  ('Remada curvada com halteres', 'costas', 'biceps,ombros', 'halteres', 'intermediario', 'Com o tronco inclinado e a coluna neutra, puxe os halteres em direção à cintura.'),
  ('Remada unilateral com halter', 'costas', 'biceps', 'halteres', 'iniciante', 'Apoiado no banco com uma mão, puxe o halter em direção ao quadril mantendo o tronco estável.'),
  ('Remada baixa no cabo', 'costas', 'biceps', 'cabos_polia', 'iniciante', 'Sentado, puxe o triângulo em direção ao abdômen mantendo a coluna neutra.'),
  ('Remada na máquina', 'costas', 'biceps', 'maquina', 'iniciante', 'Sentado com o peito apoiado, puxe as alças levando os cotovelos para trás.'),
  ('Remada cavalinho', 'costas', 'biceps,trapezio', 'barra', 'intermediario', 'Com o tronco inclinado e a barra presa em uma das pontas, puxe em direção ao peito.'),
  ('Remada apoiada no banco inclinado', 'costas', 'biceps,ombros', 'halteres', 'intermediario', 'Deitado de bruços em banco inclinado, puxe os halteres em direção ao tronco.'),
  ('Remada invertida na suspensão', 'costas', 'biceps', 'suspensao_trx', 'iniciante', 'Com o corpo inclinado sob as alças, puxe o peito até as mãos mantendo o corpo alinhado.'),
  ('Puxada articulada na máquina', 'costas', 'biceps', 'maquina', 'iniciante', 'Sentado, puxe as alças para baixo e para trás com o peito apoiado.'),
  ('Desenvolvimento com halteres', 'ombros', 'triceps', 'halteres', 'intermediario', 'Empurre os halteres acima da cabeça a partir da altura dos ombros e desça com controle.'),
  ('Desenvolvimento com barra em pé', 'ombros', 'triceps', 'barra', 'intermediario', 'Em pé, empurre a barra da altura dos ombros até acima da cabeça, com o abdômen firme.'),
  ('Desenvolvimento na máquina', 'ombros', 'triceps', 'maquina', 'iniciante', 'Sentado com as costas apoiadas, empurre as alças para cima até estender os cotovelos.'),
  ('Desenvolvimento Arnold', 'ombros', 'triceps', 'halteres', 'intermediario', 'Comece com as palmas voltadas para você e gire as mãos enquanto empurra os halteres para cima.'),
  ('Desenvolvimento no Smith', 'ombros', 'triceps', 'smith', 'intermediario', 'Sentado, empurre a barra guiada da altura do queixo até acima da cabeça.'),
  ('Elevação lateral', 'ombros', 'trapezio', 'halteres', 'iniciante', 'Eleve os halteres lateralmente até a altura dos ombros, com os cotovelos levemente flexionados.'),
  ('Elevação lateral no cabo', 'ombros', 'trapezio', 'cabos_polia', 'intermediario', 'De lado para a polia baixa, eleve o braço lateralmente até a altura do ombro.'),
  ('Elevação lateral na máquina', 'ombros', '', 'maquina', 'iniciante', 'Sentado, eleve os braços lateralmente contra o apoio até a altura dos ombros.'),
  ('Elevação frontal com halteres', 'ombros', 'peito', 'halteres', 'iniciante', 'Eleve os halteres à frente do corpo até a altura dos ombros e desça devagar.'),
  ('Elevação frontal na polia', 'ombros', 'peito', 'cabos_polia', 'intermediario', 'De costas para a polia baixa, eleve a barra ou a corda à frente até a altura dos ombros.'),
  ('Crucifixo inverso com halteres', 'ombros', 'costas,trapezio', 'halteres', 'intermediario', 'Inclinado à frente, abra os braços lateralmente levando os halteres para cima.'),
  ('Crucifixo inverso na máquina', 'ombros', 'costas,trapezio', 'maquina', 'iniciante', 'Sentado de frente para o apoio, abra os braços para trás contraindo a parte posterior dos ombros.'),
  ('Face pull na polia', 'ombros', 'costas,trapezio', 'cabos_polia', 'intermediario', 'Puxe a corda em direção ao rosto, abrindo os cotovelos para os lados.'),
  ('Remada alta com barra', 'ombros', 'trapezio,biceps', 'barra', 'intermediario', 'Puxe a barra rente ao corpo até a altura do peito, com os cotovelos acima das mãos.'),
  ('Rotação externa de ombro com elástico', 'ombros', '', 'elastico', 'iniciante', 'Com o cotovelo junto ao corpo, gire o antebraço para fora contra a resistência do elástico.'),
  ('Flexão em pike', 'ombros', 'triceps', 'peso_corporal', 'intermediario', 'Com o quadril elevado em V invertido, flexione os cotovelos levando a cabeça em direção ao chão.'),
  ('Rosca direta com barra', 'biceps', 'antebraco', 'barra', 'iniciante', 'Em pé, flexione os cotovelos levando a barra em direção aos ombros sem balançar o tronco.'),
  ('Rosca direta com barra W', 'biceps', 'antebraco', 'barra_w', 'iniciante', 'Em pé, flexione os cotovelos com a barra W, mantendo os cotovelos junto ao corpo.'),
  ('Rosca alternada com halteres', 'biceps', 'antebraco', 'halteres', 'iniciante', 'Flexione um braço de cada vez, girando o punho para cima durante a subida.'),
  ('Rosca martelo', 'biceps', 'antebraco', 'halteres', 'iniciante', 'Com as palmas voltadas uma para a outra, flexione os cotovelos sem girar os punhos.'),
  ('Rosca concentrada', 'biceps', '', 'halteres', 'iniciante', 'Sentado, com o cotovelo apoiado na coxa, flexione o braço levando o halter ao ombro.'),
  ('Rosca Scott com barra W', 'biceps', '', 'barra_w', 'intermediario', 'Com os braços apoiados no banco Scott, flexione os cotovelos e desça sem soltar a tensão.'),
  ('Rosca Scott na máquina', 'biceps', '', 'maquina', 'iniciante', 'Com os braços apoiados, flexione os cotovelos levando as alças em direção aos ombros.'),
  ('Rosca na polia baixa', 'biceps', 'antebraco', 'cabos_polia', 'iniciante', 'De frente para a polia baixa, flexione os cotovelos mantendo-os junto ao corpo.'),
  ('Rosca martelo na corda', 'biceps', 'antebraco', 'cabos_polia', 'iniciante', 'Com a corda na polia baixa, flexione os cotovelos mantendo as palmas voltadas uma para a outra.'),
  ('Rosca inclinada com halteres', 'biceps', '', 'halteres', 'intermediario', 'Sentado em banco inclinado, com os braços para trás do corpo, flexione os cotovelos.'),
  ('Tríceps na polia', 'triceps', '', 'cabos_polia', 'iniciante', 'Estenda os cotovelos empurrando a barra para baixo, mantendo os cotovelos junto ao corpo.'),
  ('Tríceps na corda', 'triceps', '', 'cabos_polia', 'iniciante', 'Estenda os cotovelos empurrando a corda para baixo e abra as pontas ao final do movimento.'),
  ('Tríceps testa com barra W', 'triceps', '', 'barra_w', 'intermediario', 'Deitado, flexione os cotovelos levando a barra em direção à testa e estenda de volta.'),
  ('Tríceps testa com halteres', 'triceps', '', 'halteres', 'intermediario', 'Deitado, flexione os cotovelos levando os halteres ao lado da cabeça e estenda.'),
  ('Tríceps francês com halter', 'triceps', '', 'halteres', 'intermediario', 'Sentado ou em pé, com o halter atrás da cabeça, estenda os cotovelos para cima.'),
  ('Tríceps francês na polia', 'triceps', '', 'cabos_polia', 'intermediario', 'De costas para a polia, com a corda atrás da cabeça, estenda os cotovelos à frente.'),
  ('Tríceps coice', 'triceps', '', 'halteres', 'iniciante', 'Com o tronco inclinado e o cotovelo junto ao corpo, estenda o braço para trás.'),
  ('Tríceps no banco', 'triceps', 'peito,ombros', 'banco', 'iniciante', 'Com as mãos apoiadas no banco atrás do corpo, flexione e estenda os cotovelos.'),
  ('Paralelas (foco no tríceps)', 'triceps', 'peito,ombros', 'peso_corporal', 'avancado', 'Nas barras paralelas, com o tronco ereto, desça flexionando os cotovelos e empurre para cima.'),
  ('Supino fechado com barra', 'triceps', 'peito,ombros', 'barra', 'intermediario', 'Com as mãos na largura dos ombros, desça a barra até o peito e empurre estendendo os cotovelos.'),
  ('Tríceps na máquina', 'triceps', '', 'maquina', 'iniciante', 'Sentado, estenda os cotovelos empurrando as alças ou a barra da máquina.'),
  ('Flexão diamante', 'triceps', 'peito', 'peso_corporal', 'intermediario', 'Com as mãos próximas sob o peito, faça a flexão mantendo os cotovelos junto ao corpo.'),
  ('Rosca de punho com barra', 'antebraco', '', 'barra', 'iniciante', 'Com os antebraços apoiados e as palmas para cima, flexione e estenda os punhos.'),
  ('Rosca de punho inversa', 'antebraco', '', 'barra', 'iniciante', 'Com os antebraços apoiados e as palmas para baixo, flexione e estenda os punhos.'),
  ('Rosca inversa com barra W', 'antebraco', 'biceps', 'barra_w', 'intermediario', 'Com as palmas para baixo, flexione os cotovelos mantendo os punhos firmes.'),
  ('Caminhada do fazendeiro', 'antebraco', 'trapezio,abdomen', 'halteres', 'iniciante', 'Caminhe segurando um halter em cada mão, com postura ereta e abdômen firme.'),
  ('Prancha abdominal', 'abdomen', '', 'peso_corporal', 'iniciante', 'Apoiado nos antebraços e nas pontas dos pés, mantenha o corpo alinhado da cabeça aos calcanhares.'),
  ('Prancha lateral', 'abdomen', 'ombros', 'peso_corporal', 'intermediario', 'De lado, apoiado em um antebraço, mantenha o corpo em linha reta.'),
  ('Abdominal supra', 'abdomen', '', 'peso_corporal', 'iniciante', 'Deitado com os joelhos flexionados, eleve os ombros do chão contraindo o abdômen.'),
  ('Elevação de pernas deitado', 'abdomen', '', 'peso_corporal', 'intermediario', 'Deitado, eleve as pernas até a vertical e desça sem deixar a lombar sair do chão.'),
  ('Abdominal bicicleta', 'abdomen', '', 'peso_corporal', 'iniciante', 'Deitado, leve cotovelo e joelho opostos um em direção ao outro, alternando os lados.'),
  ('Abdominal na máquina', 'abdomen', '', 'maquina', 'iniciante', 'Sentado, flexione o tronco contra a resistência da máquina contraindo o abdômen.'),
  ('Abdominal na polia', 'abdomen', '', 'cabos_polia', 'intermediario', 'Ajoelhado de frente para a polia alta, flexione o tronco levando a corda em direção ao chão.'),
  ('Elevação de pernas na barra fixa', 'abdomen', 'antebraco', 'barra_fixa', 'avancado', 'Pendurado, eleve as pernas à frente do corpo controlando a descida.'),
  ('Abdominal com roda', 'abdomen', 'ombros,lombar', 'roda_abdominal', 'avancado', 'Ajoelhado, role a roda à frente mantendo o abdômen contraído e volte sem arquear a lombar.'),
  ('Prancha com toque no ombro', 'abdomen', 'ombros', 'peso_corporal', 'intermediario', 'Em prancha alta, toque um ombro com a mão oposta, alternando sem girar o quadril.'),
  ('Escalador', 'abdomen', 'ombros', 'peso_corporal', 'intermediario', 'Em prancha alta, leve os joelhos alternadamente em direção ao peito em ritmo controlado.'),
  ('Giro russo', 'abdomen', '', 'anilha', 'intermediario', 'Sentado com o tronco inclinado, gire o tronco de um lado ao outro segurando a anilha.'),
  ('Abdominal na bola suíça', 'abdomen', '', 'bola_suica', 'intermediario', 'Apoiado na bola, flexione o tronco contraindo o abdômen sem puxar o pescoço.'),
  ('Pallof press', 'abdomen', 'ombros', 'cabos_polia', 'intermediario', 'De lado para a polia, estenda os braços à frente resistindo à rotação do tronco.'),
  ('Dead bug', 'abdomen', '', 'peso_corporal', 'iniciante', 'Deitado, estenda braço e perna opostos alternadamente mantendo a lombar no chão.'),
  ('Extensão lombar no banco', 'lombar', 'gluteos,posteriores_coxa', 'banco', 'iniciante', 'No banco de hiperextensão, desça o tronco com a coluna neutra e suba até alinhar o corpo.'),
  ('Extensão lombar na máquina', 'lombar', 'gluteos', 'maquina', 'iniciante', 'Sentado, estenda o tronco contra a resistência da máquina com movimento controlado.'),
  ('Bom dia com barra', 'lombar', 'posteriores_coxa,gluteos', 'barra', 'avancado', 'Com a barra nas costas, incline o tronco à frente com os joelhos levemente flexionados e volte.'),
  ('Superman', 'lombar', 'gluteos', 'peso_corporal', 'iniciante', 'Deitado de bruços, eleve braços e pernas do chão ao mesmo tempo e sustente por instantes.'),
  ('Bird dog', 'lombar', 'abdomen,gluteos', 'peso_corporal', 'iniciante', 'Em quatro apoios, estenda braço e perna opostos mantendo o tronco estável.'),
  ('Elevação pélvica', 'gluteos', 'posteriores_coxa', 'barra', 'intermediario', 'Com as costas apoiadas no banco e a barra no quadril, eleve o quadril contraindo os glúteos.'),
  ('Ponte de glúteos', 'gluteos', 'posteriores_coxa', 'peso_corporal', 'iniciante', 'Deitado com os joelhos flexionados, eleve o quadril contraindo os glúteos e desça devagar.'),
  ('Elevação pélvica unilateral', 'gluteos', 'posteriores_coxa', 'peso_corporal', 'intermediario', 'Com uma perna estendida, eleve o quadril apoiando-se na outra perna.'),
  ('Elevação pélvica na máquina', 'gluteos', 'posteriores_coxa', 'maquina', 'iniciante', 'Na máquina de elevação pélvica, eleve o quadril contraindo os glúteos ao final.'),
  ('Agachamento sumô', 'gluteos', 'adutores,quadriceps', 'halteres', 'iniciante', 'Com os pés afastados e as pontas para fora, agache segurando o halter entre as pernas.'),
  ('Coice na polia', 'gluteos', 'posteriores_coxa', 'cabos_polia', 'iniciante', 'Com a tornozeleira na polia baixa, leve a perna para trás contraindo o glúteo.'),
  ('Coice na máquina', 'gluteos', 'posteriores_coxa', 'maquina', 'iniciante', 'Na máquina de coice, empurre a plataforma para trás contraindo o glúteo.'),
  ('Subida no banco', 'gluteos', 'quadriceps', 'caixa_step', 'iniciante', 'Suba no banco ou step com uma perna, estendendo quadril e joelho, e desça controlando.'),
  ('Agachamento livre', 'quadriceps', 'gluteos', 'barra', 'intermediario', 'Agache mantendo a coluna neutra e os joelhos alinhados aos pés.'),
  ('Agachamento frontal', 'quadriceps', 'gluteos,abdomen', 'barra', 'avancado', 'Com a barra apoiada na frente dos ombros, agache mantendo o tronco ereto.'),
  ('Agachamento no Smith', 'quadriceps', 'gluteos', 'smith', 'iniciante', 'Sob a barra guiada, agache com os pés ligeiramente à frente e suba estendendo os joelhos.'),
  ('Agachamento goblet', 'quadriceps', 'gluteos', 'kettlebell', 'iniciante', 'Segurando o kettlebell junto ao peito, agache mantendo o tronco ereto.'),
  ('Agachamento com peso corporal', 'quadriceps', 'gluteos', 'peso_corporal', 'iniciante', 'Agache sem carga, com os braços à frente, mantendo o peso nos calcanhares.'),
  ('Agachamento hack', 'quadriceps', 'gluteos', 'maquina', 'intermediario', 'Com as costas apoiadas na máquina, agache e suba estendendo os joelhos.'),
  ('Leg press 45°', 'quadriceps', 'gluteos', 'maquina', 'iniciante', 'Empurre a plataforma estendendo os joelhos sem travá-los e volte com controle.'),
  ('Leg press horizontal', 'quadriceps', 'gluteos', 'maquina', 'iniciante', 'Sentado, empurre a plataforma à frente estendendo os joelhos sem travá-los.'),
  ('Cadeira extensora', 'quadriceps', '', 'maquina', 'iniciante', 'Estenda os joelhos elevando a alavanca e desça com controle.'),
  ('Afundo com halteres', 'quadriceps', 'gluteos', 'halteres', 'intermediario', 'Dê um passo à frente, desça flexionando os joelhos e volte à posição inicial.'),
  ('Passada caminhando', 'quadriceps', 'gluteos', 'halteres', 'intermediario', 'Caminhe dando passos longos, descendo o joelho de trás em direção ao chão.'),
  ('Passada búlgara', 'quadriceps', 'gluteos', 'halteres', 'avancado', 'Com o pé de trás apoiado no banco, agache descendo o joelho da frente.'),
  ('Agachamento com salto', 'quadriceps', 'gluteos,panturrilhas', 'peso_corporal', 'intermediario', 'Agache e salte, amortecendo a aterrissagem com os joelhos flexionados.'),
  ('Mesa flexora', 'posteriores_coxa', '', 'maquina', 'iniciante', 'Deitado, flexione os joelhos levando o rolo em direção aos glúteos.'),
  ('Cadeira flexora', 'posteriores_coxa', '', 'maquina', 'iniciante', 'Sentado, flexione os joelhos puxando o rolo para baixo e para trás.'),
  ('Flexora em pé', 'posteriores_coxa', '', 'maquina', 'iniciante', 'Em pé na máquina, flexione um joelho de cada vez levando o calcanhar em direção ao glúteo.'),
  ('Stiff com barra', 'posteriores_coxa', 'gluteos,lombar', 'barra', 'intermediario', 'Incline o tronco à frente com os joelhos levemente flexionados e a coluna neutra.'),
  ('Stiff com halteres', 'posteriores_coxa', 'gluteos,lombar', 'halteres', 'iniciante', 'Incline o tronco à frente deslizando os halteres junto às pernas, com a coluna neutra.'),
  ('Stiff unilateral', 'posteriores_coxa', 'gluteos', 'halteres', 'intermediario', 'Apoiado em uma perna, incline o tronco à frente levando a outra perna para trás.'),
  ('Levantamento terra convencional', 'posteriores_coxa', 'gluteos,lombar,costas', 'barra', 'avancado', 'Com a barra rente às pernas, levante estendendo quadril e joelhos com a coluna neutra.'),
  ('Levantamento terra romeno', 'posteriores_coxa', 'gluteos,lombar', 'barra', 'intermediario', 'Com os joelhos levemente flexionados, deslize a barra pelas coxas descendo até a altura dos joelhos.'),
  ('Levantamento terra sumô', 'gluteos', 'adutores,posteriores_coxa,quadriceps', 'barra', 'avancado', 'Com os pés afastados e as mãos por dentro das pernas, levante a barra estendendo quadril e joelhos.'),
  ('Flexão nórdica', 'posteriores_coxa', 'gluteos', 'peso_corporal', 'avancado', 'Ajoelhado com os pés fixos, desça o tronco à frente controlando com a parte de trás das coxas.'),
  ('Flexão de pernas na bola suíça', 'posteriores_coxa', 'gluteos', 'bola_suica', 'intermediario', 'Deitado com os calcanhares na bola, eleve o quadril e traga a bola em direção aos glúteos.'),
  ('Panturrilha em pé', 'panturrilhas', '', 'maquina', 'iniciante', 'Eleve os calcanhares o máximo possível e desça com controle.'),
  ('Panturrilha sentado', 'panturrilhas', '', 'maquina', 'iniciante', 'Sentado, eleve os calcanhares contra a resistência com amplitude completa.'),
  ('Panturrilha no leg press', 'panturrilhas', '', 'maquina', 'iniciante', 'No leg press, empurre a plataforma com a ponta dos pés estendendo os tornozelos.'),
  ('Panturrilha no degrau', 'panturrilhas', '', 'caixa_step', 'iniciante', 'Com a ponta dos pés no degrau, eleve e desça os calcanhares com amplitude.'),
  ('Panturrilha no Smith', 'panturrilhas', '', 'smith', 'iniciante', 'Com a barra guiada nos ombros e a ponta dos pés elevada, eleve os calcanhares.'),
  ('Encolhimento com halteres', 'trapezio', 'antebraco', 'halteres', 'iniciante', 'Com um halter em cada mão, eleve os ombros em direção às orelhas e desça devagar.'),
  ('Encolhimento com barra', 'trapezio', 'antebraco', 'barra', 'iniciante', 'Segurando a barra à frente do corpo, eleve os ombros em direção às orelhas.'),
  ('Encolhimento no Smith', 'trapezio', 'antebraco', 'smith', 'iniciante', 'Segurando a barra guiada à frente do corpo, eleve os ombros em direção às orelhas.'),
  ('Encolhimento na máquina', 'trapezio', '', 'maquina', 'iniciante', 'Na máquina, eleve os ombros contra a resistência e desça com controle.'),
  ('Cadeira adutora', 'adutores', '', 'maquina', 'iniciante', 'Sentado, junte as pernas contra a resistência da máquina e volte com controle.'),
  ('Cadeira abdutora', 'abdutores', 'gluteos', 'maquina', 'iniciante', 'Sentado, abra as pernas contra a resistência da máquina e volte com controle.'),
  ('Adução na polia', 'adutores', '', 'cabos_polia', 'intermediario', 'Com a tornozeleira na polia baixa, leve a perna à frente e para dentro, cruzando o corpo.'),
  ('Abdução na polia', 'abdutores', 'gluteos', 'cabos_polia', 'intermediario', 'Com a tornozeleira na polia baixa, leve a perna para o lado, afastando-a do corpo.'),
  ('Elevação lateral de perna', 'abdutores', 'gluteos', 'peso_corporal', 'iniciante', 'Deitado de lado, eleve a perna de cima sem girar o quadril e desça devagar.'),
  ('Caminhada lateral com elástico', 'abdutores', 'gluteos', 'elastico', 'iniciante', 'Com o elástico acima dos joelhos, dê passos laterais mantendo os joelhos alinhados aos pés.'),
  ('Burpee', 'corpo_inteiro', 'peito,quadriceps', 'peso_corporal', 'avancado', 'Agache, apoie as mãos, estenda as pernas, faça uma flexão, volte e salte.'),
  ('Swing com kettlebell', 'corpo_inteiro', 'gluteos,posteriores_coxa', 'kettlebell', 'intermediario', 'Com a impulsão do quadril, leve o kettlebell até a altura dos ombros com os braços estendidos.'),
  ('Thruster com halteres', 'corpo_inteiro', 'ombros,quadriceps', 'halteres', 'avancado', 'Agache com os halteres nos ombros e, ao subir, empurre-os acima da cabeça.'),
  ('Levantamento turco', 'corpo_inteiro', 'ombros,abdomen', 'kettlebell', 'avancado', 'Do chão até ficar em pé, mantendo o kettlebell estendido acima da cabeça, em etapas controladas.'),
  ('Ondas com corda naval', 'corpo_inteiro', 'ombros,abdomen', 'corda_naval', 'intermediario', 'Segurando as pontas da corda, faça ondas alternadas ou simultâneas mantendo o tronco estável.'),
  ('Arranque com halter', 'corpo_inteiro', 'ombros,gluteos', 'halteres', 'avancado', 'Em um só movimento, leve o halter do chão até acima da cabeça usando a impulsão das pernas.'),
  ('Polichinelo', 'corpo_inteiro', '', 'peso_corporal', 'iniciante', 'Salte abrindo pernas e braços e volte à posição inicial em ritmo constante.'),
  ('Remada renegado', 'corpo_inteiro', 'costas,abdomen', 'halteres', 'avancado', 'Em prancha alta apoiado nos halteres, reme um halter de cada vez sem girar o quadril.'),
  ('Caminhada na esteira', 'cardio', '', 'esteira', 'iniciante', 'Caminhe em ritmo constante, ajustando velocidade e inclinação conforme a orientação do Personal.'),
  ('Corrida na esteira', 'cardio', '', 'esteira', 'intermediario', 'Corra em ritmo constante, ajustando velocidade e inclinação conforme a orientação do Personal.'),
  ('Intervalado na esteira', 'cardio', '', 'esteira', 'intermediario', 'Alterne períodos de esforço mais alto com períodos de recuperação, conforme o protocolo do Personal.'),
  ('Caminhada inclinada na esteira', 'cardio', 'gluteos', 'esteira', 'iniciante', 'Caminhe com a esteira inclinada, mantendo a postura ereta e sem se apoiar nas barras.'),
  ('Bicicleta ergométrica', 'cardio', '', 'bicicleta', 'iniciante', 'Pedale em ritmo constante com o selim na altura adequada.'),
  ('Intervalado na bicicleta', 'cardio', '', 'bicicleta', 'intermediario', 'Alterne períodos de pedalada intensa com períodos de recuperação.'),
  ('Elíptico', 'cardio', '', 'eliptico', 'iniciante', 'Mantenha a postura ereta e o movimento contínuo de braços e pernas.'),
  ('Remo ergômetro', 'cardio', 'costas', 'remo_ergometro', 'intermediario', 'Empurre com as pernas, incline o tronco e puxe a alça até o abdômen, em sequência fluida.'),
  ('Corda de pular', 'cardio', 'panturrilhas', 'corda_pular', 'intermediario', 'Salte com pequenos pulos, girando a corda pelos punhos.');

-- ---------------------------------------------------------------------
-- 3) Passa para o Personal os exercícios iniciais do seed (owner nulo -> Personal)
-- ---------------------------------------------------------------------
update public.exercises ex
   set owner_id = (select id from _imp_owner)
 where ex.owner_id is null
   and lower(ex.name) in (select lower(name) from _imp_ex)
   and not exists (
     select 1 from public.exercises p
      where p.owner_id = (select id from _imp_owner)
        and lower(p.name) = lower(ex.name)
        and not p.is_archived
   );

-- ---------------------------------------------------------------------
-- 4) Atualiza os que já são do Personal com os dados validados
--    ("Como executar" fica em instructions)
-- ---------------------------------------------------------------------
update public.exercises ex
   set instructions            = i.descr,
       description             = null,
       primary_muscle_group_id = mg.id,
       equipment_id            = eq.id,
       difficulty              = i.dif::public.difficulty_level
  from _imp_ex i
  join public.muscle_groups mg on mg.slug = i.mg
  join public.equipment     eq on eq.slug = i.eq
 where ex.owner_id = (select id from _imp_owner)
   and lower(ex.name) = lower(i.name)
   and not ex.is_archived;

-- ---------------------------------------------------------------------
-- 5) Cadastra os exercícios novos
-- ---------------------------------------------------------------------
insert into public.exercises (owner_id, name, instructions, primary_muscle_group_id, equipment_id, difficulty)
select (select id from _imp_owner), i.name, i.descr, mg.id, eq.id, i.dif::public.difficulty_level
  from _imp_ex i
  join public.muscle_groups mg on mg.slug = i.mg
  join public.equipment     eq on eq.slug = i.eq
 where not exists (
   select 1 from public.exercises x
    where x.owner_id = (select id from _imp_owner)
      and lower(x.name) = lower(i.name)
      and not x.is_archived
 );

-- ---------------------------------------------------------------------
-- 6) Grupos musculares secundários
-- ---------------------------------------------------------------------
insert into public.exercise_muscle_groups (exercise_id, muscle_group_id)
select e.id, mg.id
  from _imp_ex i
 cross join lateral unnest(string_to_array(nullif(i.sec, ''), ',')) as s(slug)
  join public.exercises e
    on e.owner_id = (select id from _imp_owner)
   and lower(e.name) = lower(i.name)
   and not e.is_archived
  join public.muscle_groups mg on mg.slug = trim(s.slug)
on conflict do nothing;

-- ---------------------------------------------------------------------
-- 7) Limpeza e conferência
-- ---------------------------------------------------------------------
drop table _imp_ex;
drop table _imp_owner;

select verificacao, resultado, esperado,
       case when esperado = '-' then 'info' when resultado = esperado then 'OK' else 'VERIFICAR' end as status
from (
  select 1 as n, 'Exercícios do Personal' as verificacao,
         (select count(*) from public.exercises
           where owner_id = (select id from public.profiles where role = 'personal' limit 1)
             and not is_archived)::text as resultado,
         '160' as esperado
  union all
  select 2, 'Exercícios globais restantes (devem ser 0)',
         (select count(*) from public.exercises where owner_id is null)::text, '0'
  union all
  select 3, 'Exercícios sem grupo principal (devem ser 0)',
         (select count(*) from public.exercises where primary_muscle_group_id is null)::text, '0'
  union all
  select 4, 'Grupos musculares no sistema',
         (select count(*) from public.muscle_groups)::text, '17'
  union all
  select 5, 'Equipamentos no sistema',
         (select count(*) from public.equipment)::text, '22'
  union all
  select 6, 'Vínculos de grupos secundários',
         (select count(*) from public.exercise_muscle_groups)::text, '161'
) q
order by n;
