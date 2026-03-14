"use client";

import { authClient } from "@/lib/auth-client";

type AuthActionsProps = {
  isLoggedIn: boolean;
};

function GitHubIcon() {
  return (
    <svg
      aria-hidden="true"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path d="M12 0C5.37 0 0 5.38 0 12.01c0 5.31 3.44 9.8 8.2 11.38.6.11.82-.26.82-.58 0-.29-.01-1.04-.02-2.04-3.34.73-4.04-1.61-4.04-1.61-.55-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.24 1.84 1.24 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.31.76-1.61-2.67-.3-5.48-1.34-5.48-5.95 0-1.31.47-2.38 1.24-3.22-.12-.31-.54-1.53.12-3.2 0 0 1.01-.33 3.3 1.23.96-.27 1.98-.4 3-.41 1.02.01 2.04.14 3 .41 2.29-1.56 3.29-1.23 3.29-1.23.66 1.67.25 2.89.12 3.2.78.84 1.24 1.91 1.24 3.22 0 4.62-2.81 5.64-5.49 5.94.43.38.81 1.12.81 2.26 0 1.63-.01 2.94-.01 3.34 0 .32.22.7.83.58A12.02 12.02 0 0024 12C24 5.38 18.63 0 12 0Z" />
    </svg>
  );
}

export function AuthActions({ isLoggedIn }: AuthActionsProps) {
  const signInWithGitHub = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  const signOut = async () => {
    await authClient.signOut();
    window.location.href = "/";
  };

  if (isLoggedIn) {
    return (
      <button
        onClick={signOut}
        className="inline-flex items-center justify-center rounded-xl border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900 transition hover:border-zinc-900"
      >
        Sair
      </button>
    );
  }

  return (
    <button
      onClick={signInWithGitHub}
      className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-700"
    >
      <GitHubIcon />
      Entrar com GitHub
    </button>
  );
}
