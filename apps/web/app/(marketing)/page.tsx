import { auth } from "@clerk/nextjs/server";

import { MarketingLanding } from "./marketing-landing";

export default async function Home() {
  const { userId } = await auth();

  return <MarketingLanding signedIn={Boolean(userId)} />;
}