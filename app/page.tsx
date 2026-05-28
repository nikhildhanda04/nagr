import { LandingPage } from "@/components/landing/LandingPage";
import { getSession } from "@/lib/dal";

export default async function Home() {
  const session = await getSession();
  return <LandingPage authed={!!session?.user} />;
}
