import Link from "next/link";

import { signIn } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignInPage() {
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
