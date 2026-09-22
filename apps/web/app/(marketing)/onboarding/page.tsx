import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { alreadyStudent } from "@/lib/student-identity";
import { claimRosterByEmail } from "@/lib/enrollment-roster";
import { isSchoolEmail, ONBOARDING_TEST_EMAILS, verifiedPrimaryEmail } from "@/lib/onboarding";
import { OnboardingForm } from "./onboarding-form";
import { BlockedEmail } from "./blocked-email";

// The Program list is Governor-editable — never statically cache this page.
export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");
  // A Student never sees this form twice; a Pending Student sees it until the
  // record exists, however many times they abandon it.
  if (await alreadyStudent()) redirect("/dashboard");

  // The same address the domain assertion reads, so the form never shows an
  // identity the action would then refuse.
  const email = verifiedPrimaryEmail(user) ?? "";
  if (email) {
    if (!isSchoolEmail(email, ONBOARDING_TEST_EMAILS)) return <BlockedEmail email={email} />;

    const claimed = await claimRosterByEmail();
    if (claimed) redirect("/my-attendance");
  }

  return <OnboardingForm name={user.fullName ?? ""} email={email} />;
}
