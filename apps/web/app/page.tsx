import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center p-8">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-xl">Attendance</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <p className="text-muted-foreground text-sm">
            {user ? `Signed in as ${user.email}` : "Not signed in"}
          </p>
          {!user && (
            <Button asChild>
              <Link href="/register">Register</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
