import Link from "next/link";

import { signUp } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Create your account
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Start building a clear record of your language practice.
        </p>
      </header>
      <AuthForm
        action={signUp}
        submitLabel="Create account"
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
            autoComplete: "new-password",
            placeholder: "At least 8 characters",
          },
        ]}
      />
      <p className="mt-5 text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link
          className="font-medium text-blue-700 hover:underline"
          href="/sign-in"
        >
          Sign in
        </Link>
      </p>
    </>
  );
}
