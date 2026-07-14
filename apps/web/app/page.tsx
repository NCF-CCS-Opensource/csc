import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-2">
      <h1 className="text-xl font-medium">Attendance</h1>
      <p className="text-sm text-zinc-500">
        {user ? `Signed in as ${user.email}` : "Not signed in"}
      </p>
    </main>
  );
}
