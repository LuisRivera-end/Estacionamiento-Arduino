"use client";

import { useEffect, useState } from "react";

export function GlobalColorModeToggle() {
  const [isDark, setIsDark] = useState(true);

  function applyTheme(dark: boolean) {
    const theme = dark ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    // Chakra v3 usa esta clase en <html>
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(theme);
    // Fuerza el fondo del body directamente por si CSS vars tardan
    document.body.style.background = dark ? "#070b19" : "#eef4ff";
    document.body.style.color = dark ? "#f8fafc" : "#0f2057";
  }

  useEffect(() => {
    const stored = localStorage.getItem("chakra-color-mode");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const dark = stored ? stored !== "light" : prefersDark;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsDark(dark);
    applyTheme(dark);
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem("chakra-color-mode", next ? "dark" : "light");
    applyTheme(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      style={{
        position: "fixed",
        bottom: "16px",
        left: "16px",
        zIndex: 9999,
        width: "38px",
        height: "38px",
        borderRadius: "50%",
        border: `1px solid ${isDark ? "#1e293b" : "#c7d9f5"}`,
        background: isDark ? "#0f172a" : "#ffffff",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.2s, border-color 0.2s",
        boxShadow: isDark
          ? "0 2px 8px rgba(0,0,0,0.5)"
          : "0 2px 8px rgba(14,42,115,0.12)",
      }}
    >
      {isDark ? (
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none"
          stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#1d4ed8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}