import { AuthActions } from "@/components/auth-actions";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Image from "next/image";

export default async function Home() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const isLoggedIn = Boolean(session?.user);
  const userLabel = session?.user?.email ?? session?.user?.name ?? "usuario";
  const userAvatar = session?.user?.image;
  const userInitial = userLabel.trim().charAt(0).toUpperCase();

  return (
    <main className="min-h-screen px-6 py-10">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-3xl border border-zinc-200 bg-white/85 p-8 shadow-xl backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
          Demo Next.js + Better Auth
        </p>

        <h1 className="text-4xl font-bold tracking-tight text-zinc-900">
          Hello World
        </h1>

        {isLoggedIn ? (
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
            {userAvatar ? (
              <Image
                src={userAvatar}
                alt={`Avatar de ${userLabel}`}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full border border-zinc-200 object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 text-base font-bold text-white">
                {userInitial}
              </div>
            )}

            <div className="flex flex-col">
              <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                Usuario
              </span>
              <span className="text-sm font-semibold text-zinc-900">
                {userLabel}
              </span>
            </div>
          </div>
        ) : null}

        <p className="text-base text-zinc-700">
          {isLoggedIn ? `Logado como ${userLabel}` : "Voce nao esta logado"}
        </p>

        <div className="pt-2">
          <AuthActions isLoggedIn={isLoggedIn} />
        </div>
      </section>
    </main>
  );
}
