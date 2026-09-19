"use client";

// Single shared SignalR connection for the admin<->seller support chat hub.
import * as signalR from "@microsoft/signalr";
import { getSession } from "@/lib/api/session";
import type { NotificationPushDto, SupportConversationDto, SupportMessageDto } from "@/lib/api/types";

const HUB_URL = `${(process.env.NEXT_PUBLIC_API_URL ?? "https://localhost:55980").replace(/\/+$/, "")}/hubs/support`;

export type ConnectionState = "connected" | "reconnecting" | "disconnected";

let connection: signalR.HubConnection | null = null;
let startPromise: Promise<signalR.HubConnection> | null = null;

// Group membership doesn't survive a dropped connection, so everything a screen subscribed to is
// remembered here and re-established after each reconnect.
const joinedConversations = new Set<string>();
const watchedSellers = new Set<string>();
let watchingAgents = false;

// connection.onreconnected has no "off", so external listeners fan out through our own sets.
const reconnectListeners = new Set<() => void>();
const stateListeners = new Set<(state: ConnectionState) => void>();
const sellerPresenceListeners = new Set<(userId: string, online: boolean) => void>();
const agentsPresenceListeners = new Set<(online: boolean) => void>();

function currentState(): ConnectionState {
  switch (connection?.state) {
    case signalR.HubConnectionState.Connected:
      return "connected";
    case signalR.HubConnectionState.Reconnecting:
    case signalR.HubConnectionState.Connecting:
      return "reconnecting";
    default:
      return "disconnected";
  }
}

function emitState() {
  const state = currentState();
  stateListeners.forEach((listener) => listener(state));
}

async function restoreSubscriptions(conn: signalR.HubConnection) {
  await Promise.all([
    ...Array.from(joinedConversations).map((id) => conn.invoke("JoinConversation", id).catch(() => {})),
    ...Array.from(watchedSellers).map((id) =>
      conn
        .invoke<boolean>("WatchSeller", id)
        .then((online) => sellerPresenceListeners.forEach((l) => l(id, online)))
        .catch(() => {}),
    ),
    watchingAgents
      ? conn
          .invoke<boolean>("WatchSupportAgents")
          .then((online) => agentsPresenceListeners.forEach((l) => l(online)))
          .catch(() => {})
      : Promise.resolve(),
  ]);
}

function createConnection() {
  const conn = new signalR.HubConnectionBuilder()
    .withUrl(HUB_URL, { accessTokenFactory: () => getSession()?.accessToken ?? "" })
    // Back off up to 30s so a backend outage doesn't turn every open tab into a reconnect storm.
    .withAutomaticReconnect([0, 2000, 5000, 10000, 30000])
    .configureLogging(signalR.LogLevel.Warning)
    .build();

  conn.onreconnecting(emitState);
  conn.onreconnected(async () => {
    emitState();
    await restoreSubscriptions(conn);
    reconnectListeners.forEach((listener) => listener());
  });
  conn.onclose(() => {
    // Automatic reconnect gave up (or the token was rejected) — allow a fresh start() next time.
    startPromise = null;
    emitState();
  });

  conn.on("SellerPresenceChanged", (payload: { userId: string; online: boolean }) => {
    sellerPresenceListeners.forEach((listener) => listener(payload.userId, payload.online));
  });
  conn.on("AgentsPresenceChanged", (payload: { online: boolean }) => {
    agentsPresenceListeners.forEach((listener) => listener(payload.online));
  });

  return conn;
}

/** Lazily starts (or reuses) the single shared hub connection. Safe to call repeatedly. */
export function getSupportConnection(): Promise<signalR.HubConnection> {
  if (!connection) {
    connection = createConnection();
  }
  if (!startPromise) {
    const conn = connection;
    startPromise = conn
      .start()
      .then(() => {
        emitState();
        return conn;
      })
      .catch((err) => {
        startPromise = null;
        emitState();
        throw err;
      });
  }
  return startPromise;
}

/**
 * Keeps the hub connected for as long as a user is signed in (this is what makes them "online" to the
 * other side). Retries the initial connect with capped backoff; SignalR handles drops after that.
 * Returns a cleanup function.
 */
export function keepSupportConnectionAlive() {
  let stopped = false;
  let timer: number | undefined;
  let attempt = 0;

  const tryConnect = () => {
    if (stopped || !getSession()) return;
    getSupportConnection()
      .then(() => {
        attempt = 0;
      })
      .catch(() => {
        attempt += 1;
        timer = window.setTimeout(tryConnect, Math.min(30000, 2000 * 2 ** Math.min(attempt, 4)));
      });
  };
  tryConnect();

  return () => {
    stopped = true;
    if (timer) window.clearTimeout(timer);
  };
}

/** Tears the connection down on sign-out so the user immediately shows as offline. */
export async function stopSupportConnection() {
  const conn = connection;
  connection = null;
  startPromise = null;
  joinedConversations.clear();
  watchedSellers.clear();
  watchingAgents = false;
  if (conn && conn.state !== signalR.HubConnectionState.Disconnected) {
    try {
      await conn.stop();
    } catch {
      // already closing
    }
  }
  emitState();
}

export function onConnectionState(handler: (state: ConnectionState) => void) {
  stateListeners.add(handler);
  handler(currentState());
  return () => {
    stateListeners.delete(handler);
  };
}

export async function joinConversation(conversationId: string) {
  joinedConversations.add(conversationId);
  const conn = await getSupportConnection();
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
function subscribe<T>(event: string, handler: (payload: T) => void) {
  let disposed = false;
  getSupportConnection()
    .then((conn) => {
      if (!disposed) conn.on(event, handler);
    })
    .catch(() => {});
  return () => {
    disposed = true;
    connection?.off(event, handler);
  };
}

export const onReceiveMessage = (handler: (message: SupportMessageDto) => void) => subscribe("ReceiveMessage", handler);
export const onNewMessage = (handler: (message: SupportMessageDto) => void) => subscribe("NewMessage", handler);
export const onConversationStarted = (handler: (conversation: SupportConversationDto) => void) => subscribe("ConversationStarted", handler);
export const onMessagesRead = (handler: (payload: { conversationId: string; readAtUtc: string }) => void) => subscribe("MessagesRead", handler);
export const onNotificationReceived = (handler: (payload: NotificationPushDto) => void) => subscribe("NotificationReceived", handler);
export const onMessagesDelivered = (handler: (payload: { conversationId: string; deliveredAtUtc: string }) => void) =>
  subscribe("MessagesDelivered", handler);

/** Fires after the connection recovers from a drop — callers should re-fetch REST state here. */
export function onReconnected(handler: () => void) {
  reconnectListeners.add(handler);
  return () => {
    reconnectListeners.delete(handler);
  };
}

// ---- Presence ----

/** Admin: track whether one seller (by user id) is online. Reports the current state immediately. */
export function watchSellerPresence(sellerUserId: string, handler: (online: boolean) => void) {
  const listener = (userId: string, online: boolean) => {
    if (userId === sellerUserId) handler(online);
  };
  sellerPresenceListeners.add(listener);
  watchedSellers.add(sellerUserId);
  getSupportConnection()
    .then((conn) => conn.invoke<boolean>("WatchSeller", sellerUserId))
    .then((online) => {
      if (watchedSellers.has(sellerUserId)) handler(online);
    })
    .catch(() => handler(false));
  return () => {
    sellerPresenceListeners.delete(listener);
    watchedSellers.delete(sellerUserId);
    if (connection?.state === signalR.HubConnectionState.Connected) {
      connection.invoke("UnwatchSeller", sellerUserId).catch(() => {});
    }
  };
}

/** Seller: track whether the support team (any admin) is online. */
export function watchSupportAgentsPresence(handler: (online: boolean) => void) {
  agentsPresenceListeners.add(handler);
  watchingAgents = true;
  getSupportConnection()
    .then((conn) => conn.invoke<boolean>("WatchSupportAgents"))
    .then(handler)
    .catch(() => handler(false));
  return () => {
    agentsPresenceListeners.delete(handler);
    if (agentsPresenceListeners.size === 0) watchingAgents = false;
  };
}
