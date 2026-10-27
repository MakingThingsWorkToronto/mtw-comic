// Keep Vite's native module client, but freeze only change notifications during a bound review.
export async function freezeDevNotifications(context, origin) {
  const host = new URL(origin).host;
  await context.routeWebSocket(url => url.host === host, socket => {
    const server = socket.connectToServer();
    server.onMessage(message => {
      let type;
      try { type = JSON.parse(String(message)).type; } catch {}
      if (!['update', 'full-reload'].includes(type)) socket.send(message);
    });
    socket.onMessage(message => server.send(message));
  });
}
