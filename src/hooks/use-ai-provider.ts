"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AI_PROVIDER_STORAGE_KEY,
  DEFAULT_AI_PROVIDER,
  isAiProvider,
  type AiProvider,
} from "@/lib/ai/providers";
import { requestReembed } from "@/lib/embeddings/request-reembed";

export function useAiProvider() {
  const [provider, setProviderState] = useState<AiProvider>(DEFAULT_AI_PROVIDER);
  const [ready, setReady] = useState(false);
  const providerRef = useRef(provider);

  useEffect(() => {
    const stored = localStorage.getItem(AI_PROVIDER_STORAGE_KEY);
    if (stored && isAiProvider(stored)) {
      setProviderState(stored);
      providerRef.current = stored;
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    void requestReembed(providerRef.current).catch(() => undefined);
  }, [ready]);

  const setProvider = useCallback((next: AiProvider) => {
    const previous = providerRef.current;
    if (previous === next) return;

    providerRef.current = next;
    setProviderState(next);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEY, next);

    void requestReembed(next).catch((error) => {
      console.warn("[reembed] request failed:", error);
    });
  }, []);

  return { provider, setProvider, ready };
}
