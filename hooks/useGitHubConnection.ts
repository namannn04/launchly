"use client";

import { useEffect, useState } from "react";

type GitHubConnectionState = {
  githubConnected: boolean;
  githubUsername: string | null;
  githubAvatar: string | null;
  isLoading: boolean;
};

const initialState: GitHubConnectionState = {
  githubConnected: false,
  githubUsername: null,
  githubAvatar: null,
  isLoading: false,
};

export function useGitHubConnection(enabled: boolean): GitHubConnectionState {
  const [state, setState] = useState<GitHubConnectionState>({
    ...initialState,
    isLoading: enabled,
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const controller = new AbortController();

    async function loadStatus() {
      setState((current) => ({ ...current, isLoading: true }));

      try {
        const response = await fetch("/api/github/status", {
          method: "GET",
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Failed to fetch GitHub connection status");
        }

        const data = (await response.json()) as {
          githubConnected: boolean;
          githubUsername: string | null;
          githubAvatar: string | null;
        };

        setState({
          githubConnected: Boolean(data.githubConnected),
          githubUsername: data.githubUsername ?? null,
          githubAvatar: data.githubAvatar ?? null,
          isLoading: false,
        });
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setState({
          ...initialState,
          isLoading: false,
        });
      }
    }

    void loadStatus();

    return () => {
      controller.abort();
    };
  }, [enabled]);

  if (!enabled) {
    return initialState;
  }

  return state;
}
