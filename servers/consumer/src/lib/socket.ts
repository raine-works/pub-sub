const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1000; // 1 second

let socket: WebSocket | undefined;

const getBackoffDelay = (attempt: number): number => {
	const base = BASE_DELAY_MS * 2 ** attempt;
	const jitter = Math.random() * 0.5 * base;
	return base + jitter;
};

const openSocket = async (hostname: string, retryCount = 0): Promise<WebSocket | undefined> => {
	try {
		socket = new WebSocket(`ws://localhost:8000/broadcast/${hostname}`);

		socket.onopen = () => {
			console.log('Connected to WebSocket server...');
			// Reset retry count on success if needed
		};

		socket.onmessage = (event) => {
			ee?.emit('broadcast-event', event.data);
		};

		socket.onerror = (error) => {
			console.error('WebSocket error:', error);
			socket?.close(); // Ensure the socket is closed before retry
		};

		socket.onclose = async (event) => {
			console.warn(`WebSocket closed: ${event.reason || 'No reason provided...'}`);
			if (retryCount < MAX_RETRIES) {
				const delay = getBackoffDelay(retryCount);
				console.log(`Retrying in ${delay}ms... (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
				await Bun.sleep(delay);
				await openSocket(hostname, retryCount + 1);
			} else {
				console.error('Max retries reached. Giving up.');
			}
		};

		return socket;
	} catch (err) {
		console.error('Failed to connect to WebSocket:', err);
	}
};

const closeSocket = () => {
	if (socket) {
		socket.onclose = null;
		socket.close();
		socket = undefined;
	}
};

export { openSocket, closeSocket };
