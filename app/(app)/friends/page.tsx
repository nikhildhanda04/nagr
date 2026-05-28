import { requireUser } from "@/lib/dal";
import { listFriends, listIncoming, listOutgoing } from "@/lib/friends";
import { FriendsPanel } from "@/components/app/friends-panel";
import { Mono } from "@/components/ui/card";

export default async function FriendsPage() {
  const user = await requireUser();
  const [friends, incoming, outgoing] = await Promise.all([
    listFriends(user.id),
    listIncoming(user.id),
    listOutgoing(user.id),
  ]);

  return (
    <div>
      <Mono>Accountability</Mono>
      <h1 className="mt-2 mb-6 font-[family-name:var(--font-display)] text-3xl text-ink">
        Friends
      </h1>
      <p className="mb-6 max-w-prose text-ink-muted">
        Friends can be shamed when you miss a public task — and you&apos;ll see
        their misses too. Add by the email they signed up with.
      </p>
      <FriendsPanel friends={friends} incoming={incoming} outgoing={outgoing} />
    </div>
  );
}
