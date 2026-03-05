"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

type ThemesProviderProps = {
  children: ReactNode;
} & React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemesProviderProps) {
  return (
    <NextThemesProvider {...props}>
      {children}
    </NextThemesProvider>
  );
}