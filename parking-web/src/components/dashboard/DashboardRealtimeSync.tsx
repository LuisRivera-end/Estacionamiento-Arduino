"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

import { getBrowserAccessToken } from "@/lib/auth/client";

function getRealtimeWsUrl(accessToken: string): string | null {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!apiBaseUrl || apiBaseUrl === "fixture") return null;

  const baseUrl = new URL(apiBaseUrl);
  const wsProtocol = baseUrl.protocol === "https:" ? "wss:" : "ws:";
  return `${wsProtocol}//${baseUrl.host}/api/v1/admin/reports/ws?access_token=${encodeURIComponent(accessToken)}`;
}

export function DashboardRealtimeSync() {
  const router = useRouter();
  const pathname = usePathname();
  const reconnectTimeoutRef = useRef<number | null>(null);
  const refreshTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;

    async function connect() {
      const accessToken = await getBrowserAccessToken();
      if (!accessToken || disposed) return;

      const wsUrl = getRealtimeWsUrl(accessToken);
      if (!wsUrl) return;

      socket = new WebSocket(wsUrl);

      socket.onmessage = () => {
        if (refreshTimeoutRef.current !== null) {
          window.clearTimeout(refreshTimeoutRef.current);
        }

        // Debounce refresh bursts when multiple events arrive together.
        refreshTimeoutRef.current = window.setTimeout(() => {
          router.refresh();
        }, 120);
      };

      socket.onclose = () => {
        if (disposed) return;
        reconnectTimeoutRef.current = window.setTimeout(() => {
          void connect();
        }, 1000);
      };
    }

    void connect();

    return () => {
      disposed = true;
      if (socket) socket.close();
      if (reconnectTimeoutRef.current !== null) {
        window.clearTimeout(reconnectTimeoutRef.current);
      }
      if (refreshTimeoutRef.current !== null) {
        window.clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [router, pathname]);

  return null;
}
