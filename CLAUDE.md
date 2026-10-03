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
Zod + React Hook Form · Vercel (no ar desde 2026-09-26, plano Hobby, publica sozinho a cada push
na `main`). Na Vercel: as 3 variáveis do `.env.example` + `APP_URL` = domínio fixo `*.vercel.app`
(nunca o endereço de publicação com código no meio). No Supabase → Authentication → URL
Configuration: Site URL = domínio fixo; Redirect URLs com `/auth/confirm` do domínio fixo e do
localhost. Mudou o domínio? Atualize os dois lugares. Não convidar alunos reais antes dos
Termos/Política definitivos.

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
                  (service_role, "server-only", só para o convite de alunos e o envio de push)
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
- **Vídeo de exercício**: um por exercício (`exercise_media.position = 0`). Na execução aparece
  SEM botão, logo abaixo do nome, pronto mas SEM tocar sozinho (decisão do usuário: economizar
  internet do aluno). `components/exercise-video.tsx`: YouTube via `youtube-nocookie.com`, Vimeo
  com `dnt=1`, arquivo .mp4/.webm/.mov no player do navegador; outros hosts = link em nova aba.
  Abaixo do vídeo, a ficha do exercício (séries, repetições, carga e descanso quando existirem).
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
  **Lembrete de treino e aviso de faltas (2026-10-03, migração 20261003000003, `pg_cron` de hora em
  hora)**: `private.send_training_reminders()` — em dia combinado, na hora que o ALUNO escolhe no
  Perfil (`profiles.training_reminder_enabled/_hour`, padrão 17h; `aluno/perfil/training-reminder-form.tsx`),
  quem não tem nenhuma sessão hoje recebe "Hoje é dia de treino" (1 por dia). `private.send_absence_alerts()`
  — todo dia às 9h, `private.absence_streak()` conta para trás os dias combinados sem NENHUMA sessão
  (mesma regra do "faltou" da Frequência, respeitando `start_date`, até 60 dias); se chegar a
  `personal_profiles.absence_alert_days` (padrão 2; Configurações → `absence-alert-form.tsx`), o
  Personal recebe "Aluno faltando aos treinos" → `/personal/alunos/[id]/frequencia`, 1 por sequência
  (chave `data.since` = primeiro dia faltado). Ambos usam o tipo `lembrete` com `data.kind`
  (`treino`/`faltas`) e o título gravado pelo banco. Testar na hora: `select private.send_training_reminders(true);`
  / `select private.send_absence_alerts(true);` (o `true` ignora a hora).
- Feedback semanal (`/aluno/feedback`, `/personal/feedback`, `/personal/alunos/[id]/feedback`;
  `lib/feedback.ts`): escalas 1–5 (sentiu nos treinos, disposição, alimentação, progresso) +
  dificuldades, dor, observações. Aluno edita até o Personal responder (regra no banco).
  Colunas antigas (sono, estresse, treinos feitos) não são mais perguntadas, mas aparecem no
  histórico se tiverem valor. Endereços antigos `/…/checkin(s)` redirecionam (`next.config.ts`).
  **Lembrete automático (2026-10-03, migração 20261003000002)**: `pg_cron` roda
  `private.send_feedback_reminders()` todo início de hora; no dia/hora do Personal
  (`personal_profiles.feedback_reminder_enabled/_dow/_hour`, padrão sexta 18h, fuso de Brasília;
  editável em Configurações → `configuracoes/feedback-reminder-form.tsx`) cria `checkin_pendente`
  (com `data.week_start`) para aluno ATIVO sem Feedback na semana — no máximo 1 por semana; o push
  vai junto pelo trigger de push. Mandar o Feedback marca o lembrete da semana como lido (trigger
  `weekly_checkins_clear_reminder`). Para testar na hora: `select private.send_feedback_reminders(true);`
  no SQL Editor (o `true` ignora dia/hora — manda para TODOS os alunos ativos sem Feedback).
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
- Chat Personal↔aluno, texto, foto e áudio (`/aluno/mensagens`, `/personal/mensagens`,
  `/personal/alunos/[id]/mensagens`, componente `chat-room.tsx`): tempo real via Realtime
  (`postgres_changes` em `messages`), ressincroniza ao reconectar/voltar ao app. Id da
  mensagem gerado no navegador → "Tentar de novo" não duplica (23505 = já gravada).
  "Enviando..." até o banco confirmar. Apagar = soft delete do banco. Leitura em
  `conversation_reads` gravada com `conversations.last_message_at` (relógio do banco, não do
  servidor); abrir a conversa também marca como lido o aviso `nova_mensagem`. Horários com
  fuso fixo `America/Sao_Paulo`. A bolinha de "Mensagens" no menu vem da central de
  notificações (avisos `nova_mensagem` não lidos) e atualiza em tempo real.
  **Foto e áudio no chat (2026-10-03, migração 20261003000001)**: arquivo sobe DIRETO do navegador
  para o bucket privado `chat-attachments` em `{conversa}/{id da mensagem}.ext` (`lib/chat-media.ts`;
  usar o id da mensagem deixa o "Tentar de novo" seguro) e depois `sendMessage` grava a mensagem
  (`type` imagem/audio + `attachment_path`). O trigger `messages_before_insert` (agora security
  definer) confere: arquivo na pasta da PRÓPRIA conversa, extensão do tipo certo e já existente no
  Storage. Foto: `compressImage` 1600px (remove GPS), legenda opcional no `body`; tocar abre em
  tela cheia. Áudio: `components/chat/use-audio-recorder.ts` (MediaRecorder; WebM/Opus no
  Chrome/Android, MP4/AAC no iPhone), até 3 min, duração medida pelo app em
  `messages.media_duration_s` (o WebM do navegador não informa a duração); player próprio em
  `components/chat/chat-media.tsx`. Sem texto/foto, o botão de enviar vira microfone. Apagar
  mensagem apaga também o arquivo (`deleteMessage` lê o caminho antes; regra de Storage
  `app_chat_delete`: só quem enviou apaga). Listas mostram "Foto"/"Áudio (0:42)"
  (`messagePreview` em `lib/chat.ts`). Limitação: iPhone antigo pode não tocar áudio WebM gravado
  no Android — o player mostra "Abrir o arquivo".
- Central de notificações (`/aluno/notificacoes`, `/personal/notificacoes`): sino no topo com
  contador em tempo real (`components/notification-badges.tsx`, um canal Realtime em
  `notifications` por página). Os avisos são criados SÓ por triggers do banco
  (`private.notify`); a tela usa títulos próprios por tipo (`lib/notifications.ts`), porque os
  gravados no banco são antigos/sem acento. Abrir um aviso passa pela rota
  `/…/notificacoes/abrir/[id]` (marca como lido e redireciona) — use `<a>`, nunca `<Link>`,
  para o pré-carregamento não marcar como lido sozinho. Lembrete agendado de feedback
  (agora existe: ver Feedback semanal). Avisos com o app fechado: ver "Avisos no celular" abaixo.
- Banco de dados completo (33 tabelas), RLS em 100% das tabelas, 08_testes_permissoes.sql com
  190 testes (inclui os das migrações 20260923000001, 20260925000001, 20260925000002, 20260926000001, 20260930000001, 20261002000001, 20261003000001, 20261003000002 e 20261003000003; se a trava de exclusão do Storage não puder ser liberada, são 188) (isolamento entre alunos, entre Personal e aluno, consentimento
  controlando acesso a fotos, etc.). **Rode o 08 de novo sempre que alterar RLS ou triggers.**

## Pendentes do escopo original

Landing page final (conteúdo real). **Termos e Política** (`/termos`,
`/privacidade`, estrutura em `components/legal-page.tsx`) já têm texto completo escrito a partir
do que o app faz; os dados do Personal (nome, CPF/CNPJ, CREF, e-mail, região do Supabase, prazo de
guarda) ficam em `src/lib/legal.ts` e aparecem como "a preencher" até serem informados; a faixa
de rascunho só some com `reviewedByLawyer: true` (revisão por advogado). Se o app passar a guardar
outro tipo de dado (ex.: imagem/áudio no chat, push), ATUALIZE a Política e suba `CONSENT_VERSION`
em `lib/consents.ts` (hoje `2026-10-v5`). Não há exclusão de conta pelo app: pedidos são pelo
chat/e-mail (resposta em até 15 dias, prometido na Política).
`src/types/database.types.ts` é o arquivo OFICIAL gerado pelo Supabase (regenerado em 2026-10-03,
depois da migração 20261003000003). Única diferença em relação ao que se escrevia à mão:
`leads.Insert.personal_id` é obrigatório no tipo, mas o formulário público NÃO o envia (o trigger
preenche; o visitante nem tem permissão na coluna) — por isso a conversão de tipo em `lead-actions.ts`.


## Convenções ao gerar código

- Interface em português do Brasil, tom simples, sem jargão técnico exposto ao usuário final.
- Mobile-first; reutilize `inputCls`/`btnPrimaryCls`/`btnSecondaryCls`/`errorCls` de `lib/ui.ts`.
- **Cores só por token de tema** (definidos em `src/app/globals.css`, com versão clara e escura):
  `bg-brand`/`text-brand-contrast`/`hover:bg-brand-hover` (cor principal), `text-strong`/
  `text-soft`/`text-muted` (textos secundários), `border-line`/`border-line-strong`,
  `bg-subtle`/`bg-subtle-strong`. Não escreva `zinc-900`, `border-zinc-200 dark:...` etc. em
  código novo. Cores de STATUS (verde/âmbar/vermelho) e cinzas neutros decorativos podem ficar
  fixos. Tokens também para `bg-card`, `border-field` (campos), `text-brand-ink`, `bg-brand-soft`.
- **Sistema visual (redesign em fases; Fases 1 a 7 feitas)**: identidade PRETO + LARANJA, pensada
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
- **Evolução visual (em etapas, 2026-09-27)** — plano aprovado: 1 base visual · 2 execução com vídeo
  automático · 3 volume · 4 landing nova · 5 "Quero ser aluno" (onboarding + tabela `leads` +
  WhatsApp) · 6 verificação. Etapas 1 a 6 feitas (6: varredura no código + capturas das telas públicas;
  telas logadas conferidas pelo usuário no celular). `PageHeader eyebrow` agora é texto normal (sem
  maiúsculas/laranja) e só para contexto real (data, semana, "Ficha de Ana") — nunca repetir o menu.
  Setas de período anterior/próximo: ícones com `navBtnCls` (`lib/ui.ts`), nunca "← Anterior". Etapa 3: placar de totais `components/ui/scoreboard.tsx`
  (números lado a lado num painel só, também nas calorias) e seletor segmentado `segGroupCls`/`segBtnCls`
  em `lib/ui.ts` (Planejado|Realizado, período, medida do gráfico). Etapa 1: fontes **Saira** (títulos h1–h3 via `@layer base`,
  botões e números: `font-display`, eixo de largura `wdth` disponível) + **Barlow** (texto,
  `font-sans`); tokens novos `chrome` (prata do anel do logo) e `steel` (aço); laranja #f97316
  mantido (pedido do usuário: não remover as cores atuais). Cantos: controles 10px, cartões 16px.
  `displayNumberCls` em `lib/ui.ts` para números grandes. Evitar: brilhos/manchas desfocadas,
  rótulos em MAIÚSCULAS acima de títulos, setas → em botões. Build local: o PC tem 3,4 GB de RAM
  e o `next build` pode estourar memória na fase paralela — rode com `experimental: { cpus: 1 }`
  temporário no next.config (não commitar; a Vercel não precisa).
- **App instalável (PWA, parte 1 — 2026-10-02)**: `src/app/manifest.ts` (abre em `/login`, que leva
  quem já entrou ao painel), ícones em `public/icons/` gerados pelo `pnpm fotos` (o "maskable" tem
  margem de 20% para o recorte do Android), `appleWebApp` + `viewport.themeColor` no `layout.tsx`.
  `public/sw.js` (registrado por `components/pwa/pwa-register.tsx`, SÓ em produção) faz uma coisa:
  sem internet, abrir página mostra `public/offline.html` (HTML com estilo embutido). **Decisão: o
  service worker NÃO guarda páginas nem dados de alunos no aparelho** (celular compartilhado
  exporia dados de saúde). Mudou o `sw.js`? suba a versão em `CACHE`. Botão "Instalar o app"
  (`components/pwa/install-app.tsx` + `lib/pwa-install.ts`): no menu (ambos os papéis) e cartão
  dispensável no início do aluno; Android/Chrome/Edge abre a janela do navegador, iPhone mostra
  instruções (Compartilhar → Adicionar à Tela de Início).
- **Avisos no celular (PWA parte 2, push — 2026-10-02)**: migração 20261002000001 (liga `pg_net`;
  `public.claim_push_subscription()` grava a inscrição do aparelho e TIRA de outra conta se o mesmo
  aparelho estava inscrito nela — celular compartilhado; trigger `notifications_push` em
  `notifications` chama `/api/push` via `net.http_post` com só o id do aviso; erro nunca impede o
  aviso no app). URL e senha da rota ficam no **Vault** do Supabase (`push_webhook_url`,
  `push_webhook_secret`), gravados por `supabase/.local/10_configurar_push.sql` (pasta fora do Git).
  `/api/push` (`app/api/push/route.ts`, senha `PUSH_WEBHOOK_SECRET`) → `lib/push.ts` com o cliente
  ADMIN (**decisão: `admin.ts` agora também é usado no envio de push**, porque não há ninguém logado)
  → `web-push` com chaves VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`; "subject" =
  `APP_URL`, que precisa ser https — a Apple recusa localhost). A notificação leva só o título do
  tipo + o texto curto do banco (nome), NUNCA conteúdo de mensagem/saúde; ao tocar, abre
  `/…/notificacoes/abrir/[id]`. Inscrições recusadas (404/410) são apagadas. Tela: cartão "Avisos no
  celular" em `/…/notificacoes` (`components/pwa/push-settings.tsx`: ativar, testar, desativar;
  iPhone só com o app instalado). "Enviar aviso de teste" usa a sessão da pessoa (sem admin).
  **Sair da conta desinscreve o aparelho antes** (`components/sign-out-button.tsx`, usado no menu,
  Perfil e Configurações). Ícone da barra do Android: `public/icons/badge-96.png` (branco/transparente,
  gerado pelo `pnpm fotos`). `CONSENT_VERSION` → `2026-10-v4` (Política fala dos avisos).
- **Landing nova (etapa 4)**: nome em Saira larga (`[font-stretch:125%]`) sobre a foto; topo da foto em
  preto e branco/escurecido (letreiro vermelho da academia brigava com o laranja); "Como eu trabalho"
  numerado (é sequência de verdade); recursos do app em lista, não cartões. Com `draft: false`,
  resultados/depoimentos `example: true` SOMEM da página (nunca publicar exemplo por engano).
- **"Quero me tornar aluno" (etapa 5)**: botão na landing → `/quero-ser-aluno` (público, uma pergunta
  por tela: objetivo, experiência, dias/semana, presencial/online, nome+WhatsApp+aceite da Política) →
  grava em `leads` (migração 20260930000001; visitante anônimo só INSERE colunas das respostas; trigger
  escolhe o Personal, força status `novo`, barra mesmo número em 10 min e >30 envios/hora, impede
  alterar respostas; aviso `novo_interessado` no sino) → abre `wa.me` do Personal com as respostas no
  texto (`lib/leads.ts`). Sem número em `landing-content.ts` → tela final diz que o Personal vai chamar.
  Personal: `/personal/interessados` (situação, observação, chamar no WhatsApp, excluir; alerta de
  12 meses — prazo prometido na Política). Sem perguntas de saúde de propósito (dado sensível).
  `CONSENT_VERSION` subiu para `2026-09-v3` por causa disso.
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
- **Fase 6**: fotos com comparador "Antes x Depois" deslizante (`before-after-slider.tsx`,
  por baixo é um `<input type="range">` — teclado/leitor de tela) + modo lado a lado; chat com
  status ✓ Enviada / ✓✓ Lida (migração 20260926000001: participantes veem a
  `conversation_reads` um do outro + Realtime nessa tabela; `loadOtherLastRead`), separadores
  de dia, Enter envia no computador, lista de conversas com prévia; Feedback do Personal com
  indicadores (médias 1–5 das últimas 4 semanas, "Pedem atenção": dor ou nota ≤2). **Imagem
  do exercício**: sem migração — `exercise_media` kind `imagem`, source `upload`, position 1
  (vídeo é a 0), bucket privado `exercise-media` em `{owner_id}/{exercise_id}/arquivo`
  (`lib/exercise-media.ts`); upload na edição do exercício (compressão em
  `lib/image-compress.ts`, compartilhada com as fotos); aluno vê na execução e no detalhe do
  treino via `loadExerciseImages` (links de 1 h).
- **Fase 7 (verificação)**: sem cores fixas antigas (zinc/pastel) — caixas de status usam o padrão translúcido `bg-<cor>-500/10 border-<cor>-500/30`; todas as páginas usam `PageHeader` (exceto o topo do chat, que tem avatar); `error.tsx` em `personal/` e `aluno/` (`components/route-error.tsx`, mostra a mensagem + "Tentar de novo") e `app/not-found.tsx`; tabelas sempre dentro de `overflow-x-auto`. Captura de tela de celular com Edge headless: use iframe de 390px (a janela headless não fica menor que ~500px e parece cortar a página).
- **Login**: estados de campo inválido/carregando/erro/sucesso; "Esqueci minha senha" em
  `/recuperar-senha` → e-mail do Supabase → `/auth/confirm` (troca o código por sessão) →
  `/redefinir-senha`. Exige a URL `…/auth/confirm` liberada em Supabase → Authentication →
  URL Configuration → Redirect URLs.
- **Identidade do Personal** (decisão: fixa no código, não configurável pelo app): nome, frase e
  logo em `src/lib/brand.ts` (título da aba, menu, login e landing);
  cores nos tokens de `globals.css`; ícones em `src/app` (`icon.png`, `apple-icon.png`; o
  `favicon.ico` padrão do Next foi removido). Nome: Marília Ferreira. Logo recebido (fundo
  branco, com partes pretas → sempre sobre quadrado/cartão branco: `components/brand-mark.tsx`
  no menu/login/topo; logo completo `BRAND.logoFull` no rodapé da landing).
- **Fotos/logo do site**: originais na pasta `material/` (fora do Git — podem ter GPS);
  `pnpm fotos` (`scripts/preparar-fotos.mjs`, usa `sharp`) remove metadados, reduz e grava em
  `public/` (que é PÚBLICO) e gera os ícones a partir de `material/logo-icone.png`. Arquivos
  recebidos do Personal ficam em `material/originais/`; as cópias editadas (criança ao fundo da
  foto desfocada; rosto cortado no "depois") ficam em `material/` com os nomes esperados. Nunca
  colocar foto direto em `public/`.
- Toda escrita ao banco passa por Zod no servidor, mesmo já existindo RLS (defesa em camadas).
- Ao adicionar coluna/tabela nova, gere uma migração numerada (`YYYYMMDDNNNNNN_nome.sql`) em
  vez de pedir para editar tabelas direto pelo painel do Supabase.
- Depois de qualquer mudança de schema, lembre a pessoa de rodar
  `pnpm exec supabase gen types typescript --project-id higslvtcdxvbcdjvbqdf --schema public > src/types/database.types.ts`
  (o id é a parte inicial do NEXT_PUBLIC_SUPABASE_URL; não é segredo). Gere primeiro num arquivo
  temporário e compare com `diff` antes de substituir.
- Nunca coloque a chave `service_role`/`secret` em variável com prefixo `NEXT_PUBLIC_`, nem em
  código que rode no navegador. Ela só é usada via `lib/supabase/admin.ts` ("server-only").
- `.env.local` nunca vai para o Git — confirme com `git status` antes de qualquer commit.
