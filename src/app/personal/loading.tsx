import { PageSkeleton } from "@/components/ui/states";

// Mostrado enquanto a página do Personal carrega do servidor.
export default function Loading() {
  return <PageSkeleton />;
}
