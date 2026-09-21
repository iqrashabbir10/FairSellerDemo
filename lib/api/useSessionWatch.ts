"use client";

import { useEffect } from "react";
import { apiFetch } from "./client";
import { getSession } from "./session";

/**
 * Keeps an idle, signed-in screen honest: every few seconds (and when the tab comes back into view) it asks the server
 * whether the session is still allowed. If the account was blocked or sign-in was switched off, the server answers 401
 * and apiFetch signs the person out and sends them to the login page - no click needed.
 */
export function useSessionWatch(intervalMs = 15000) {
  useEffect(() => {
    const check = () => {
      if (!getSession() || document.visibilityState !== "visible") return;
      apiFetch("/api/auth/session").catch(() => {
        // Network hiccups are ignored; a 401 is handled inside apiFetch.
      });
    };
    const timer = window.setInterval(check, intervalMs);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [intervalMs]);
}
