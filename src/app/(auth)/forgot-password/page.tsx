import Link from "next/link";

import { requestPasswordReset } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function ForgotPasswordPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Reset your password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          We will send a recovery link if an account exists for this email.
        </p>
      </header>
      <AuthForm
        action={requestPasswordReset}
        submitLabel="Send recovery link"
        fields={[
          {
            name: "email",
            label: "Email",
            type: "email",
            autoComplete: "email",
            placeholder: "you@example.com",
          },
        ]}
      />
      <p className="mt-5 text-center text-sm">
        <Link
          className="font-medium text-blue-700 hover:underline"
          href="/sign-in"
        >
          Back to sign in
        </Link>
      </p>
    </>
  );
}
