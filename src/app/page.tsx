import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-3xl font-bold">Personal Trainer</h1>
      <p className="text-zinc-500">
        Acompanhe seus treinos, avaliações e evolução em um só lugar.
      </p>
      <Link
        href="/login"
        className="flex h-12 w-full items-center justify-center rounded-lg bg-zinc-900 font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Entrar
      </Link>
    </main>
  );
}
