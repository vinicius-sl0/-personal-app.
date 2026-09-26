# CLAUDE.md — Plataforma Personal Trainer

Este arquivo é a memória do projeto para o Claude Code. Leia-o inteiro antes de mexer em
qualquer parte do código ou do banco. Ele resume decisões tomadas em conversas anteriores
que não estão em nenhum outro lugar.

## O que é o projeto

Plataforma web para **um único Personal Trainer** (não é multi-tenant: existe um só Personal,
criado manualmente, sem cadastro público). Dois papéis: `personal` e `aluno`. O Personal
cadastra alunos, monta fichas de treino personalizadas, cadastra exercícios com vídeo, e
(próximo passo) registra avaliações físicas. O aluno ativa a conta por convite, executa os
treinos pelo celular e (em breve) acompanha sua evolução.

Ambiente: Windows, PowerShell/CMD, VS Code. A pessoa que desenvolve não é programadora de
formação — está aprendendo no processo. **Explique comandos antes de propor rodá-los, evite
jargão sem explicação, e prefira poucos passos por vez.**

## Stack

Next.js (App Router) + TypeScript + Tailwind · Supabase (Postgres, Auth, Storage, Realtime) ·
Zod + React Hook Form · Vercel (ainda não configurado — só ambiente local até agora).

## Onde as coisas estão

```
supabase/
  migrations/   → 01 a 05 (schema, funções/triggers, RLS, storage, seed) já aplicados no
                  Supabase de desenvolvimento. NÃO rode de novo — dão erro de "já existe".
                  Migrações posteriores (numeradas por data) também já aplicadas, uma por vez.
  scripts/      → 06 (cria o Personal), 07 (painel de verificação, só leitura),
                  08 (bateria de testes de RLS/permissões — cria e desfaz dados de teste),
                  09 (importou a biblioteca de exercícios validada pelo Personal; NÃO reexecutar)
src/
  lib/supabase/ → client.ts (browser), server.ts (Server Components/Actions), admin.ts
                  (service_role, "server-only", só para o convite de alunos)
  lib/auth.ts   → getSession(), requireRole() — guarda de papel usada nos layouts
  lib/ui.ts     → classes Tailwind reaproveitadas (inputCls, btnPrimaryCls, btnSecondaryCls, errorCls)
  lib/workout-labels.ts → rótulos e a técnica de exercício (normal/dropset/biset/restpause)
  app/(login, personal/*, aluno/*, convite/[token])
```

Não existe `supabase db push`/CLI de migrations neste projeto ainda — cada `.sql` é colado
manualmente no SQL Editor do Supabase, em uma query nova, um arquivo por vez. Se você (Claude
Code) gerar uma migração nova, **entregue o arquivo e peça para rodar assim**, não assuma que
rodar comandos locais aplica no banco.

## Decisões importantes (não óbvias, não reabra sem avisar)

- **Single-tenant de propósito.** `students.personal_id` existe e a RLS filtra por ele, mas
  isso é só para robustez — não construa fluxos de "cadastro de novo Personal".
- **Aluno nunca se cadastra sozinho.** Personal cria o registro em `students` (status
  `convidado`), o servidor gera um convite de uso único (hash do token no banco, token cru só
  no link) e o aluno ativa via `/convite/[token]`: cria senha + aceita consentimentos LGPD
  obrigatórios (`termos_uso`, `politica_privacidade`, `dados_saude`, e `responsavel_legal` se
  menor de 18). Só então o banco marca `status = ativo` (trigger `consents_activate_student`).
  **O Personal não pode ativar manualmente** — isso é proposital e testado (script 08).
- **O papel (`role`) nunca vem do cliente.** É gravado via `app_metadata` do Supabase Auth,
  só pelo servidor (`createAdminClient`, chave secret), e um trigger em `auth.users` cria o
  perfil. Um usuário autenticado sem perfil não acessa nada (por design).
- **Exercícios são todos do Personal** (`owner_id` preenchido), não globais — decisão tomada
  porque o sistema é para um Personal só e ele precisa poder editar/adicionar vídeo em
  qualquer exercício pelo app. Os 160 exercícios da planilha validada por ele já foram
  importados assim (script 09).
- **Técnica do exercício (drop set, bi-set, rest-pause) vive na FICHA, não no cadastro do
  exercício** — o mesmo exercício pode ser normal para um aluno e drop set para outro.
  Coluna `workout_exercises.technique` (enum) + `technique_detail` (texto livre explicando,
  ex.: "20kg, 15kg, 10kg"). Constraint no banco: detalhe obrigatório se técnica ≠ normal.
  Função `techniqueExplanation()` em `workout-labels.ts` gera a frase que o aluno vê.
- **Segurança em camadas**: GRANT mínimo por tabela/coluna → RLS (regra por linha) → triggers
  (campos imutáveis, transições de status). Nunca remova uma camada assumindo que outra basta.
- **Erros de Server Action sempre visíveis na tela**, nunca silenciosos. Já tivemos um bug
  real por isso: a tela de execução do treino marcava a série como "concluída" no estado do
  React *antes* de confirmar que o `INSERT` no banco funcionou; quando a gravação falhava,
  a pessoa via "Feita ✓" mas nada era salvo. Padrão correto: `await` a ação, checar
  `res.error`, só atualizar o estado local em caso de sucesso, e mostrar a mensagem de erro
  literal na tela quando houver falha.
- **Cronômetro de descanso** é só client-side (`RestTimer`, `setTimeout` de 1s), sem
  persistência — reabrir a página perde a contagem, e isso é aceitável.
- **Vídeo de exercício**: um por exercício (`exercise_media.position = 0`), embutido só se for
  YouTube (via `youtube-nocookie.com`, para privacidade); outros hosts abrem em nova aba.
- **Idempotência da sessão de treino**: `workout_sessions.client_uuid` (gerado e guardado no
  `localStorage` do navegador) evita duplicar sessão se a página recarregar no meio do treino.
  A chave é apagada no check-out, e `startSession`/`resumeSession` nunca reaproveitam sessão
  já finalizada (bug antigo corrigido: antes o mesmo treino reusava a sessão da semana anterior).
- **Nomenclatura (definida pelo Personal)**: TREINO = fichas + exercícios + vídeos +
  **check-in/check-out diário** (cada `workout_sessions` é um ponto: `started_at` = check-in,
  `finished_at` = check-out). AVALIAÇÃO = antropométrica + composição corporal. **FEEDBACK
  SEMANAL** = questionário semanal (tabela `weekly_checkins` — o nome da tabela ficou antigo,
  na interface é sempre "Feedback"). Não chame o feedback de "check-in" na interface.
- **Dias de treino combinados** (`students.training_days`, ISO 1=seg…7=dom) são definidos só
  pelo Personal (trigger `students_guard` bloqueia o aluno). Dia combinado sem sessão
  concluída = "Não foi"; treino em dia não combinado = "extra".

## O que já está pronto e testado manualmente

- Login/logout, proteção de rotas por papel (`proxy.ts` — no Next 16 o antigo middleware
  virou `proxy.ts`), redirecionamento por papel.
- Cadastro de aluno pelo Personal + convite por link (copiar / WhatsApp) + ativação com
  consentimentos LGPD.
- Biblioteca de exercícios: busca, filtros por grupo/equipamento, CRUD, arquivar, duplicar,
  link de vídeo. 160 exercícios reais já importados.
- Editor de ficha por aluno: múltiplos treinos, exercícios com séries/reps(min-max ou
  texto)/carga/descanso/técnica, salvar rascunho ou publicar (publicar encerra a ficha ativa
  anterior automaticamente — regra no banco, trigger `plans_before_write`).
- Execução do treino pelo aluno: um exercício por vez, vídeo, instruções, explicação da
  técnica, registro de série (reps/carga) com confirmação real no banco, cronômetro de
  descanso, histórico. Tela de **check-in** antes do treino e botão **Finalizar treino /
  Check-out** (pede confirmação se faltam séries); ao recarregar, retoma a sessão em andamento
  com as séries já gravadas.
- Frequência (`/personal/frequencia`, `/personal/alunos/[id]/frequencia`, lógica em
  `lib/attendance.ts`): folha de ponto semanal (Dia/Treino/Check-in/Check-out/Status), resumo
  "X de Y dias combinados", navegação por semana, editor de dias combinados (também no
  cadastro do aluno novo, opcional). Abas **Semana | Mês** (`components/attendance-view.tsx`,
  usado pelo aluno em `/aluno/treinos/historico` — menu "Frequência" — e pelo Personal): mês
  com calendário colorido, cartões (presença %, faltas, extras, treinos), lista do mês e
  tabela dos últimos 6 meses. Presença = combinados com treino ÷ combinados que já passaram.
  Dias antes de `students.start_date` não contam como falta. Limitação aceita: meses antigos
  usam os dias combinados ATUAIS (não há histórico de mudanças de `training_days`).
  Fuso fixo `America/Sao_Paulo` (-03:00).
- Feedback semanal (`/aluno/feedback`, `/personal/feedback`, `/personal/alunos/[id]/feedback`;
  `lib/feedback.ts`): escalas 1–5 (sentiu nos treinos, disposição, alimentação, progresso) +
  dificuldades, dor, observações. Aluno edita até o Personal responder (regra no banco).
  Colunas antigas (sono, estresse, treinos feitos) não são mais perguntadas, mas aparecem no
  histórico se tiverem valor. Endereços antigos `/…/checkin(s)` redirecionam (`next.config.ts`).
  Fotos da semana (opcionais) dentro do Feedback: seção `aluno/feedback/weekly-photos.tsx`
  reaproveita `PhotoUploadForm` (com `onDone`/`minDate`) e `photo-consent-toggle.tsx`. Não há
  ligação no banco entre foto e feedback: a semana vem de `progress_photo_sets.taken_at`
  (`groupSetsByWeek` em `components/week-photos.tsx`). A página Fotos continua existindo.
- Análise de volume de treino (Treinos → Análise de volume: `/personal/treinos/volume`; aluno em
  `/aluno/treinos/volume`, só os próprios dados; relatório compartilhado
  `components/volume-report.tsx`). Cálculo puro em `lib/volume.ts`: grupo principal =
  `exercises.primary_muscle_group_id`, secundários = `exercise_muscle_groups`; cada série vale 1
  para o principal e `personal_profiles.secondary_muscle_weight` (0 / 0,5 / 1, só o Personal
  altera) para cada secundário. Planejado = `workout_exercises` (faixa 8–12 vira faixa, nunca
  média; reps em texto/carga vazia ficam fora de reps/kg e são contadas à parte); Realizado =
  `set_logs` do período (paginado). Gráfico de barras Recharts (laranja principal / azul
  secundário, cores validadas com a skill dataviz). "Resumo do treino" no editor de ficha.
- Calorias estimadas (só na visão Realizado; `lib/calories.ts`): `exercises.kcal_per_min`
  (opcional, em branco nos 160 importados — o app não inventa valor). Tempo do exercício =
  duração check-in→check-out × (séries dele ÷ séries da sessão); kcal = tempo × kcal/min.
  Sessão sem check-out e exercício sem kcal/min ficam fora, com aviso. Sempre exibido com "≈" e
  "Aproximação, não é medição".
- Avaliação física: Personal registra/edita/exclui avaliações por protocolo; IMC, RCQ, massa
  gorda/magra calculados no servidor; gráficos de evolução por medida; aluno vê só leitura.
  Usa o catálogo de métricas do seed (ficha real do Personal ainda não recebida).
- Fotos de evolução (`/aluno/fotos`, `/personal/alunos/[id]/fotos`): aluno autoriza/retira o
  consentimento `fotos_evolucao` pelo app; envio por data com até 4 ângulos, foto reduzida e
  regravada no navegador (remove EXIF/GPS) e enviada direto ao bucket privado; registro no
  banco via Server Action; URLs assinadas de 1h; comparação antes/depois. **Só o aluno exclui
  fotos** (regra da RLS/Storage). Se o envio do Personal falhar depois do upload, o arquivo
  fica órfão no bucket (o Personal não tem permissão de apagar) — aceito por ora.
- Chat Personal↔aluno, só texto (`/aluno/mensagens`, `/personal/mensagens`,
  `/personal/alunos/[id]/mensagens`, componente `chat-room.tsx`): tempo real via Realtime
  (`postgres_changes` em `messages`), ressincroniza ao reconectar/voltar ao app. Id da
  mensagem gerado no navegador → "Tentar de novo" não duplica (23505 = já gravada).
  "Enviando..." até o banco confirmar. Apagar = soft delete do banco. Leitura em
  `conversation_reads` gravada com `conversations.last_message_at` (relógio do banco, não do
  servidor); abrir a conversa também marca como lido o aviso `nova_mensagem`. Horários com
  fuso fixo `America/Sao_Paulo`. A bolinha de "Mensagens" no menu vem da central de
  notificações (avisos `nova_mensagem` não lidos) e atualiza em tempo real. Imagem/áudio
  ainda não (bucket `chat-attachments` já existe).
- Central de notificações (`/aluno/notificacoes`, `/personal/notificacoes`): sino no topo com
  contador em tempo real (`components/notification-badges.tsx`, um canal Realtime em
  `notifications` por página). Os avisos são criados SÓ por triggers do banco
  (`private.notify`); a tela usa títulos próprios por tipo (`lib/notifications.ts`), porque os
  gravados no banco são antigos/sem acento. Abrir um aviso passa pela rota
  `/…/notificacoes/abrir/[id]` (marca como lido e redireciona) — use `<a>`, nunca `<Link>`,
  para o pré-carregamento não marcar como lido sozinho. Sem lembrete agendado de feedback
  (precisaria de pg_cron) e sem push com o app fechado (etapa PWA).
- Banco de dados completo (32 tabelas), RLS em 100% das tabelas, 08_testes_permissoes.sql com
  134 testes (inclui os das migrações 20260923000001, 20260925000001 e 20260925000002) (isolamento entre alunos, entre Personal e aluno, consentimento
  controlando acesso a fotos, etc.). **Rode o 08 de novo sempre que alterar RLS ou triggers.**

## Pendentes do escopo original

Imagem/áudio no chat, landing page final, PWA/offline, textos
legais definitivos (Termos e Privacidade hoje são placeholders — e agora o app guarda fotos
do corpo dos alunos e mensagens, então a Política precisa cobrir isso; avisar sempre que for
relevante).
`src/types/database.types.ts` foi ajustado à mão para bater com a migração 20260923000001
(e com `technique_detail`); regenerar com o comando oficial deve dar o mesmo resultado.


## Convenções ao gerar código

- Interface em português do Brasil, tom simples, sem jargão técnico exposto ao usuário final.
- Mobile-first; reutilize `inputCls`/`btnPrimaryCls`/`btnSecondaryCls`/`errorCls` de `lib/ui.ts`.
- **Cores só por token de tema** (definidos em `src/app/globals.css`, com versão clara e escura):
  `bg-brand`/`text-brand-contrast`/`hover:bg-brand-hover` (cor principal), `text-strong`/
  `text-soft`/`text-muted` (textos secundários), `border-line`/`border-line-strong`,
  `bg-subtle`/`bg-subtle-strong`. Não escreva `zinc-900`, `border-zinc-200 dark:...` etc. em
  código novo. Cores de STATUS (verde/âmbar/vermelho) e cinzas neutros decorativos podem ficar
  fixos. Tokens também para `bg-card`, `border-field` (campos), `text-brand-ink`, `bg-brand-soft`.
- **Sistema visual (redesign em fases; Fases 1 a 5 feitas)**: identidade PRETO + LARANJA, pensada
  primeiro no escuro; o claro segue o sistema do aparelho (decisão do usuário). Botão laranja
  usa texto PRETO (branco não passa contraste); texto laranja usa `text-brand-ink`. Menu
  lateral e painéis de marca usam a classe `.theme-dark` (sempre escuros). Componentes em
  `src/components/ui/` (card, badge, states — EmptyState/ErrorState/Skeleton —, page-header,
  stat-card, avatar, tabs, field, toast via `useToast()`, modal). Estrutura de navegação em
  `components/app-shell.tsx` (sidebar no desktop, menu deslizante no celular); os itens de
  menu ficam nos layouts `personal/layout.tsx` e `aluno/layout.tsx`. Ícones: `lucide-react`.
  Gráficos: `recharts` (ver Fase 5). Fases
  seguintes: 2 dashboards · 3 landing · 4 alunos/treinos/execução · 5 gráficos · 6 fotos,
  chat, feedback, perfil · 7 verificação responsiva. Perguntas do Feedback NÃO mudam.
- **Landing page** (`src/app/page.tsx`, Fase 3 feita): todo o conteúdo em
  `src/lib/landing-content.ts`. Itens com `example: true` aparecem com a etiqueta "Exemplo" e
  `draft: true` mostra faixa de "página em construção". NUNCA publicar resultados/depoimentos
  inventados; fotos de alunos só com consentimento `uso_imagem_marketing`. Contatos null = botão
  não aparece. Carrossel em `components/landing/results-carousel.tsx`.
- **Dashboards (Fase 2)**: `personal/page.tsx` (6 indicadores, gráfico de treinos concluídos
  por dia em 28 dias, "Precisa da sua atenção", situação da semana por aluno, treinos e
  avaliações recentes) e `aluno/page.tsx` (treino de hoje/próximo na sequência A→B→C com
  check-in, semana em 7 dias, última avaliação com variação e mini gráfico do peso, feedback,
  mensagens, ficha). Gráficos Recharts em `components/charts/` (dica ao tocar + "Ver em tabela").
- **Fase 4**: lista de alunos com busca/filtro/ordenação/cards ou tabela
  (`personal/alunos/students-browser.tsx`); perfil do aluno redesenhado; editor de ficha com
  abas por treino e arrastar para reordenar (`@dnd-kit`, também por toque e teclado; ↑↓ como
  alternativa; `uid` só no navegador, removido antes de salvar) em `treinos/exercise-card.tsx`;
  execução do treino com trilha de exercícios, "Concluir exercício" (marca e avança; pergunta
  se faltam séries — só visual, as séries continuam gravadas uma a uma) e observação do
  Personal visível ao aluno. `RestTimer` virou card flutuante (erro antigo de lint resolvido).
- **Fase 5 (gráficos)**: TODOS os gráficos são Recharts em `components/charts/` e usam os
  tokens `--chart-1` (laranja) e `--chart-2` (azul) — tons próprios de gráfico, validados com
  a skill dataviz (o laranja da marca `--brand` reprovou no escuro para gráficos). Avaliações:
  `TrendChart` com período (3m/6m/1a/tudo) no `evolution-panel.tsx` (gráfico SVG antigo
  removido). Volume: filtro por grupo muscular (`grupo` na URL), barras empilhadas com o grupo
  em destaque, tabela "Volume por exercício" (`computeByExercise`) e evolução semanal (26
  semanas) / mensal (6 meses) de séries, reps, kg, calorias ≈ e treinos (`computeTrend` +
  `lib/volume-trends-data.ts`, usado também pela página Evolução do aluno, que mostra
  composição corporal com período único, medidas e frequência/volume/calorias).
- **Login**: estados de campo inválido/carregando/erro/sucesso; "Esqueci minha senha" em
  `/recuperar-senha` → e-mail do Supabase → `/auth/confirm` (troca o código por sessão) →
  `/redefinir-senha`. Exige a URL `…/auth/confirm` liberada em Supabase → Authentication →
  URL Configuration → Redirect URLs.
- **Identidade do Personal** (decisão: fixa no código, não configurável pelo app): nome, frase e
  logo em `src/lib/brand.ts` (título da aba, menu, login e landing);
  cores nos tokens de `globals.css`; ícones em `src/app` (`favicon.ico`, `icon.png`,
  `apple-icon.png`). Material do Personal (logo, cores, estilo, textos) ainda não recebido.
- Toda escrita ao banco passa por Zod no servidor, mesmo já existindo RLS (defesa em camadas).
- Ao adicionar coluna/tabela nova, gere uma migração numerada (`YYYYMMDDNNNNNN_nome.sql`) em
  vez de pedir para editar tabelas direto pelo painel do Supabase.
- Depois de qualquer mudança de schema, lembre a pessoa de rodar
  `pnpm exec supabase gen types typescript --project-id <id> --schema public > src/types/database.types.ts`.
- Nunca coloque a chave `service_role`/`secret` em variável com prefixo `NEXT_PUBLIC_`, nem em
  código que rode no navegador. Ela só é usada via `lib/supabase/admin.ts` ("server-only").
- `.env.local` nunca vai para o Git — confirme com `git status` antes de qualquer commit.
