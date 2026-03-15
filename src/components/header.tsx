import { ConnectionStatus } from "./connection-status";

export function Header() {
  return (
    <header className="flex items-center justify-between border-b border-border px-6 py-3">
      <h1 className="text-lg font-bold tracking-tight">MyOllama</h1>
      <ConnectionStatus />
    </header>
  );
}
