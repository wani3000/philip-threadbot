"use client";

import { useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "../lib/supabase/browser";

export function GoogleSignInButton({
  disabled,
  disabledMessage
}: {
  disabled?: boolean;
  disabledMessage?: string;
}) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="form-grid">
      <button
        className="button-primary"
        disabled={isPending || disabled}
        onClick={() => {
          if (disabled) {
            setError(disabledMessage ?? "Google 로그인을 사용할 수 없습니다.");
            return;
          }

          startTransition(async () => {
            setError(null);

            try {
              const supabase = createBrowserSupabaseClient();
              const redirectTo = `${window.location.origin}/auth/callback`;
              const { error: signInError } =
                await supabase.auth.signInWithOAuth({
                  provider: "google",
                  options: {
                    redirectTo,
                    queryParams: {
                      access_type: "offline",
                      prompt: "select_account"
                    }
                  }
                });

              if (signInError) {
                setError(signInError.message);
              }
            } catch (caughtError) {
              setError(
                caughtError instanceof Error
                  ? caughtError.message
                  : "Google 로그인을 시작하지 못했습니다."
              );
            }
          });
        }}
        type="button"
      >
        {isPending ? "Google 로그인 준비 중..." : "Google로 로그인"}
      </button>
      {error ? <div className="alert">{error}</div> : null}
      {!error && disabledMessage ? (
        <div className="alert">{disabledMessage}</div>
      ) : null}
    </div>
  );
}
