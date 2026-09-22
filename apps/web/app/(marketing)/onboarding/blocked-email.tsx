import { ShieldAlert } from "lucide-react";
import { DecorativeAccents } from "@/components/decorative-accents";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function BlockedEmail({ email }: { email: string }) {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden p-8">
      <DecorativeAccents />
      <AlertDialog open>
        <AlertDialogContent className="relative rounded-[14px] border-2 border-border shadow-[var(--shadow-lg)]">
          <AlertDialogHeader>
            <span className="mx-auto flex size-12 items-center justify-center rounded-full border-2 border-border bg-[var(--color-yellow)] text-foreground">
              <ShieldAlert className="size-6" aria-hidden />
            </span>
            <AlertDialogTitle className="text-center font-heading text-xl font-bold">
              Only @gbox.ncf.edu.ph accounts allowed
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center">
              Signed in as {email}. Sign out and sign in again with your school Google account.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
