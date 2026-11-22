"use client";

import React from "react";
import { SessionProvider } from "next-auth/react";

export function AuthProvider({ children }) {
  return (
    <SessionProvider
      basePath="/api/auth"
      refetchInterval={0}
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      {children}
    </SessionProvider>
  );
}
