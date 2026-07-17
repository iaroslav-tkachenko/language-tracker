import { describe, expect, it } from "vitest";

import {
  credentialsSchema,
  emailSchema,
  resetPasswordSchema,
} from "@/lib/auth/validation";

describe("authentication validation", () => {
  it("normalizes a valid email address", () => {
    const result = emailSchema.parse({ email: "  learner@example.com  " });

    expect(result.email).toBe("learner@example.com");
  });

  it("rejects malformed email addresses", () => {
    expect(emailSchema.safeParse({ email: "not-an-email" }).success).toBe(
      false,
    );
  });

  it("enforces the password length boundaries", () => {
    expect(
      credentialsSchema.safeParse({
        email: "learner@example.com",
        password: "1234567",
      }).success,
    ).toBe(false);
    expect(
      credentialsSchema.safeParse({
        email: "learner@example.com",
        password: "12345678",
      }).success,
    ).toBe(true);
    expect(
      credentialsSchema.safeParse({
        email: "learner@example.com",
        password: "x".repeat(73),
      }).success,
    ).toBe(false);
  });

  it("requires matching passwords during recovery", () => {
    expect(
      resetPasswordSchema.safeParse({
        password: "correct-horse",
        confirmPassword: "different-horse",
      }).success,
    ).toBe(false);
    expect(
      resetPasswordSchema.safeParse({
        password: "correct-horse",
        confirmPassword: "correct-horse",
      }).success,
    ).toBe(true);
  });
});
