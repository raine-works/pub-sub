const startServer = async (port: number) => {
	const server = Bun.serve<{ clientHostname: string }, undefined>({
		port,
		fetch(req, server) {
			const url = new URL(req.url);
			if (url.pathname.startsWith('/broadcast/')) {
				const clientHostname = url.pathname.split('/').pop();
				return server.upgrade(req, { data: { clientHostname } })
					? undefined
					: new Response('Failed to upgrade connection', { status: 400 });
			}
			return new Response('Hello World!');
		},
		websocket: {
			open(ws) {
				ws.subscribe('broadcast');
				console.log(`${ws.data.clientHostname} - WebSocket connection opened`);
			},
			message(_ws, message) {
				server.publish('broadcast', `Received message: ${message}`);
			},
			close(ws) {
				ws.unsubscribe('broadcast');
				console.log(`${ws.data.clientHostname} - WebSocket connection closed`);
			}
		}
	});
	console.log(`Listening on ${server.hostname}:${server.port}`);
	return server;
};

const stopServer = async (server: Bun.Server) => {
	await server.stop();
	console.log('Server stopped...');
	process.exit(0);
};

const server = await startServer(8000);

process.on('SIGTERM', async () => {
	await stopServer(server);
});
