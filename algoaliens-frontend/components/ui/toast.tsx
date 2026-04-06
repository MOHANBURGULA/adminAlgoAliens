"use client"

import { Toaster } from "react-hot-toast"

export default function ToastViewport() {
  return (
    <Toaster
      position="top-right"
      gutter={12}
      toastOptions={{
        duration: 4000,
        style: {
          backdropFilter: "var(--glass-filter)",
          background: "var(--bg-surface)",
          border: "var(--card-border)",
          borderRadius: "calc(var(--card-radius) + 0.6rem)",
          boxShadow: "var(--card-shadow-strong)",
          color: "var(--text-main)",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "var(--success-color)",
            secondary: "var(--text-main)",
          },
        },
        error: {
          iconTheme: {
            primary: "var(--danger-color)",
            secondary: "var(--text-main)",
          },
        },
      }}
    />
  )
}
