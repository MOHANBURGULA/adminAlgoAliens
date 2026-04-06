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
          background: "#111827",
          border: "1px solid #1f2937",
          borderRadius: "18px",
          boxShadow: "0 18px 45px rgba(0, 0, 0, 0.35)",
          color: "#f8fafc",
          padding: "14px 16px",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#f8fafc",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#f8fafc",
          },
        },
      }}
    />
  )
}
