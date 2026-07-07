import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import AppShell from "@/components/app-shell";
import DevToolsActions from "./actions";
import { Alert } from "@/components/ui/alert";

export default async function DevToolsPage() {
  if (process.env.NODE_ENV === "production") redirect("/dashboard");

  const user = await requireUser();

  return (
    <AppShell activePage="/settings/dev-tools" email={user.email || ""}>
      <h1 className="text-2xl font-bold mb-1">Dev Tools</h1>
      <p className="text-sm text-zinc-500 mb-6">Sample data generator for personal testing. Only available in development mode.</p>

      <Alert variant="warning" className="mb-6">
        Dev tools are hidden in production. Use with caution — sample data is real data in your database.
      </Alert>

      <DevToolsActions userId={user.id} />
    </AppShell>
  );
}
