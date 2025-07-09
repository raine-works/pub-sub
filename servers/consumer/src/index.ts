import { EventEmitter } from 'node:events';
import { hostname } from 'node:os';
import { closeSocket, openSocket } from '@/lib/socket';

declare global {
	var ee: EventEmitter | undefined;
}

global.ee ??= new EventEmitter();

const startServer = async (port: number) => {
	const socket = await openSocket(hostname());
	const server = Bun.serve({
		port,
		routes: {
			'/test/:id': {
				GET: (req) => {
					const { id } = req.params;
					socket?.send(`Hello from consumer server! ID: ${id}`);
					return Response.json({ status: 'Message sent to WebSocket server' });
				}
			}
		}
	});
	console.log(`Consumer server is running on port ${port}...`);
	return server;
};

const stopServer = async (server: Bun.Server) => {
	closeSocket();
	await server.stop();
	console.log('Server stopped...');
	process.exit(0);
};

const server = await startServer(8001);

ee?.on('broadcast-event', (data) => {
	console.log(data);
});

process.on('SIGTERM', async () => {
	await stopServer(server);
});
