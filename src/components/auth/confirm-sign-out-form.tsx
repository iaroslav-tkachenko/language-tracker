"use client";

import type { ReactNode } from "react";

import { signOut } from "@/app/(auth)/actions";

export function ConfirmSignOutForm({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <form
      action={signOut}
      className={className}
      onSubmit={(event) => {
        if (!window.confirm("Sign out of your account?")) {
          event.preventDefault();
        }
      }}
    >
      {children}
    </form>
  );
}
