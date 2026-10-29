import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";
import { account, db, schedule, setPublisher } from "./database";
import type { ResourceEvent } from "../domain/types";
const clients = new Set<{
  userId?: string;
  send: (name: string, event: ResourceEvent) => void;
}>();
setPublisher((name, event) =>
  clients.forEach((client) => {
    if (!event.userId || client.userId === event.userId)
      client.send(name, event);
  }),
);
const socket = ws.link(/wss:\/\/realtime\.kurio\.test\/.*/);
export const realtimeHandlers = [
  socket.addEventListener("connection", (connection) => {
    const bound = toSocketIo(connection);
    const client = {
      userId: account()?.user.id,
      send: (name: string, event: ResourceEvent) =>
        bound.client.emit(name, event),
    };
    clients.add(client);
    const heartbeat = setInterval(() => connection.client.send("2"), 20000);
    connection.client.addEventListener("close", () => {
      clearInterval(heartbeat);
      clients.delete(client);
    });
    db.orders.filter((o) => o.status === "pending").forEach(schedule);
  }),
];
