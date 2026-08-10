import Link from "next/link";

import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

type SignInPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  callback:
    "The authentication link could not sign you in automatically. Your email may already be confirmed, so try signing in with the password you chose.",
  confirmation:
    "This confirmation link is invalid or expired. Request a new link and try again.",
};

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const { error } = await searchParams;
  const errorMessage = error ? errorMessages[error] : undefined;

  return (
    <>
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Welcome back
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Sign in to continue tracking your language learning.
        </p>
      </header>
      {errorMessage && (
        <p
          role="alert"
          className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800"
        >
          {errorMessage}
        </p>
      )}
      <AuthForm
        action={signIn}
        submitLabel="Sign in"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
          {
            name: "password",
            label: "Password",
            type: "password",
            autoComplete: "current-password",
            placeholder: "Enter your password",
          },
        ]}
      />
      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <Link
          className="font-medium text-blue-700 hover:underline"
          href="/sign-up"
        >
          Create account
        </Link>
        <Link
          className="text-slate-600 hover:text-blue-700 hover:underline"
          href="/forgot-password"
        >
          Forgot password?
        </Link>
      </div>
    </>
  );
}
