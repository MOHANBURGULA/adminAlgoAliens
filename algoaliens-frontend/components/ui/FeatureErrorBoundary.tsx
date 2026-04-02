"use client"

import type { ReactNode } from "react"
import { Component } from "react"

type Props = {
  children: ReactNode
  fallbackMessage?: string
}

type State = {
  hasError: boolean
}

export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: unknown) {
    console.error("Feature render failure", error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-5 text-sm text-red-100">
          {this.props.fallbackMessage || "This section hit an unexpected error. Refresh and try again."}
        </div>
      )
    }

    return this.props.children
  }
}
