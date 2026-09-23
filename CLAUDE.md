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
  descanso, histórico, finalizar sessão.
- Avaliação física: Personal registra/edita/exclui avaliações por protocolo; IMC, RCQ, massa
  gorda/magra calculados no servidor; gráficos de evolução por medida; aluno vê só leitura.
  Usa o catálogo de métricas do seed (ficha real do Personal ainda não recebida).
- Fotos de evolução (`/aluno/fotos`, `/personal/alunos/[id]/fotos`): aluno autoriza/retira o
  consentimento `fotos_evolucao` pelo app; envio por data com até 4 ângulos, foto reduzida e
  regravada no navegador (remove EXIF/GPS) e enviada direto ao bucket privado; registro no
  banco via Server Action; URLs assinadas de 1h; comparação antes/depois. **Só o aluno exclui
  fotos** (regra da RLS/Storage). Se o envio do Personal falhar depois do upload, o arquivo
  fica órfão no bucket (o Personal não tem permissão de apagar) — aceito por ora.
- Banco de dados completo (32 tabelas), RLS em 100% das tabelas, 08_testes_permissoes.sql com
  122 testes passando (isolamento entre alunos, entre Personal e aluno, consentimento
  controlando acesso a fotos, etc.). **Rode o 08 de novo sempre que alterar RLS ou triggers.**

## Pendentes do escopo original

Chat Personal↔aluno (tabelas já existem, Realtime habilitado), feedback semanal (check-in),
central de notificações (tabela existe, sem tela), landing page final, PWA/offline, textos
legais definitivos (Termos e Privacidade hoje são placeholders — e agora o app guarda fotos
do corpo dos alunos, então a Política precisa cobrir isso; avisar sempre que for relevante).
Também pendente: regenerar `src/types/database.types.ts` (está sem `technique_detail`, gera
44 erros de tipo que não quebram o app).

## Convenções ao gerar código

- Interface em português do Brasil, tom simples, sem jargão técnico exposto ao usuário final.
- Mobile-first; reutilize `inputCls`/`btnPrimaryCls`/`btnSecondaryCls`/`errorCls` de `lib/ui.ts`.
- Toda escrita ao banco passa por Zod no servidor, mesmo já existindo RLS (defesa em camadas).
- Ao adicionar coluna/tabela nova, gere uma migração numerada (`YYYYMMDDNNNNNN_nome.sql`) em
  vez de pedir para editar tabelas direto pelo painel do Supabase.
- Depois de qualquer mudança de schema, lembre a pessoa de rodar
  `pnpm exec supabase gen types typescript --project-id <id> --schema public > src/types/database.types.ts`.
- Nunca coloque a chave `service_role`/`secret` em variável com prefixo `NEXT_PUBLIC_`, nem em
  código que rode no navegador. Ela só é usada via `lib/supabase/admin.ts` ("server-only").
- `.env.local` nunca vai para o Git — confirme com `git status` antes de qualquer commit.
