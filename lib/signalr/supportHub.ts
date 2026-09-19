"use client";

// Single shared SignalR connection for the admin<->seller support chat hub.
import * as signalR from "@microsoft/signalr";
import { getSession } from "@/lib/api/session";
import type { SupportConversationDto, SupportMessageDto } from "@/lib/api/types";

const HUB_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:55980").replace(/\/+$/, "")}/hubs/support`;

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<signalR.HubConnection> | null = null;
// Re-joined on reconnect since group membership doesn't survive a dropped connection.
const joinedConversations = new Set<string>();
// External reconnect listeners (e.g. "re-fetch the conversation list"); connection.onreconnected
// itself has no "off", so we fan out through our own set instead.
const reconnectListeners = new Set<() => void>();

function createConnection() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => getSession()?.accessToken ?? "" })
    .withAutomaticReconnect()
    .build();

  conn.onreconnected(() => {
    joinedConversations.forEach((id) => {
      conn.invoke("JoinConversation", id).catch(() => {});
    });
    reconnectListeners.forEach((listener) => listener());
  });

  return conn;
}

/** Lazily starts (or reuses) the single shared hub connection. Safe to call repeatedly. */
export function getSupportConnection(): Promise<signalR.HubConnection> {
  if (!connection) {
    connection = createConnection();
  }
  if (!startPromise) {
    startPromise = connection
      .start()
      .then(() => connection as signalR.HubConnection)
      .catch((err) => {
        startPromise = null;
        throw err;
      });
  }
  return startPromise;
}

export async function joinConversation(conversationId: string) {
  const conn = await getSupportConnection();
  joinedConversations.add(conversationId);
  await conn.invoke("JoinConversation", conversationId);
}

export async function leaveConversation(conversationId: string) {
  joinedConversations.delete(conversationId);
  if (!connection || connection.state !== signalR.HubConnectionState.Connected) return;
  try {
    await connection.invoke("LeaveConversation", conversationId);
  } catch {
    // Connection may already be tearing down — nothing to clean up.
  }
}

// Each subscribe helper returns an unsubscribe function for effect cleanup.
export function onReceiveMessage(handler: (message: SupportMessageDto) => void) {
  let disposed = false;
  getSupportConnection().then((conn) => {
    if (!disposed) conn.on("ReceiveMessage", handler);
  });
  return () => {
    disposed = true;
    connection?.off("ReceiveMessage", handler);
  };
}

export function onNewMessage(handler: (message: SupportMessageDto) => void) {
  let disposed = false;
  getSupportConnection().then((conn) => {
    if (!disposed) conn.on("NewMessage", handler);
  });
  return () => {
    disposed = true;
    connection?.off("NewMessage", handler);
  };
}

export function onConversationStarted(handler: (conversation: SupportConversationDto) => void) {
  let disposed = false;
  getSupportConnection().then((conn) => {
    if (!disposed) conn.on("ConversationStarted", handler);
  });
  return () => {
    disposed = true;
    connection?.off("ConversationStarted", handler);
  };
}

// Speculative event — not in the original hub spec. Fires (if/when the backend adds it) whenever
// the other party marks a conversation's messages as read; simply never fires otherwise.
export function onMessagesRead(handler: (payload: { conversationId: string; readAtUtc: string }) => void) {
  let disposed = false;
  getSupportConnection().then((conn) => {
    if (!disposed) conn.on("MessagesRead", handler);
  });
  return () => {
    disposed = true;
    connection?.off("MessagesRead", handler);
  };
}

/** Fires after the connection recovers from a drop — group membership isn't preserved, so
 *  callers should re-fetch REST state (e.g. the conversation list) here. */
export function onReconnected(handler: () => void) {
  reconnectListeners.add(handler);
  return () => {
    reconnectListeners.delete(handler);
  };
}
