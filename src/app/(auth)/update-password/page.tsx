import { updatePassword } from "@/app/(auth)/actions";
import { AuthForm } from "@/components/auth/auth-form";

export default function UpdatePasswordPage() {
  return (
    <>
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950">
          Choose a new password
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Use at least 8 characters and keep it unique to this account.
        </p>
      </header>
      <AuthForm
        action={updatePassword}
        submitLabel="Update password"
        fields={[
          {
            name: "password",
            label: "New password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "At least 8 characters",
          },
          {
            name: "confirmPassword",
            label: "Confirm new password",
            type: "password",
            autoComplete: "new-password",
            placeholder: "Repeat your password",
          },
        ]}
      />
    </>
  );
}
