import { Server as SocketIOServer } from 'socket.io';
import type { ViteDevServer, Plugin } from 'vite';
import type { FileChangeEvent, RepoSyncEvent } from '$lib/types/beads';

// Socket.io server instance (singleton)
let io: SocketIOServer | null = null;

// Event types for socket communication
export interface ServerToClientEvents {
	'issue:changed': (event: FileChangeEvent) => void;
	'issue:created': (event: FileChangeEvent) => void;
	'issue:deleted': (event: FileChangeEvent) => void;
	'repo:sync': (event: RepoSyncEvent) => void;
	'repo:subscribed': (data: { repoId: string; clientCount: number }) => void;
	'repo:unsubscribed': (data: { repoId: string }) => void;
	error: (data: { message: string; code?: string }) => void;
}

export interface ClientToServerEvents {
	'repo:subscribe': (repoId: string) => void;
	'repo:unsubscribe': (repoId: string) => void;
}

export interface InterServerEvents {
	ping: () => void;
}

export interface SocketData {
	subscribedRepos: Set<string>;
}

export type TypedSocketIOServer = SocketIOServer<
	ClientToServerEvents,
	ServerToClientEvents,
	InterServerEvents,
	SocketData
>;

/**
 * Initialize socket.io server
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function initSocketServer(httpServer: any): TypedSocketIOServer {
	if (io) {
		return io as TypedSocketIOServer;
	}

	io = new SocketIOServer<
		ClientToServerEvents,
		ServerToClientEvents,
		InterServerEvents,
		SocketData
	>(httpServer, {
		path: '/socket.io',
		cors: {
			origin: '*',
			methods: ['GET', 'POST']
		},
		transports: ['websocket', 'polling']
	});

	io.on('connection', (socket) => {
		console.log(`[Socket.io] Client connected: ${socket.id}`);

		// Initialize socket data
		socket.data.subscribedRepos = new Set();

		// Handle repo subscription
		socket.on('repo:subscribe', (repoId: string) => {
			const room = `repo:${repoId}`;
			socket.join(room);
			socket.data.subscribedRepos.add(repoId);

			// Get client count in room
			const clientCount = io?.sockets.adapter.rooms.get(room)?.size || 0;

			socket.emit('repo:subscribed', { repoId, clientCount });
			console.log(`[Socket.io] Client ${socket.id} subscribed to ${room} (${clientCount} clients)`);
		});

		// Handle repo unsubscription
		socket.on('repo:unsubscribe', (repoId: string) => {
			const room = `repo:${repoId}`;
			socket.leave(room);
			socket.data.subscribedRepos.delete(repoId);

			socket.emit('repo:unsubscribed', { repoId });
			console.log(`[Socket.io] Client ${socket.id} unsubscribed from ${room}`);
		});

		socket.on('disconnect', (reason) => {
			console.log(`[Socket.io] Client disconnected: ${socket.id} (${reason})`);
		});

		socket.on('error', (error) => {
			console.error(`[Socket.io] Socket error for ${socket.id}:`, error);
		});
	});

	console.log('[Socket.io] Server initialized');
	return io as TypedSocketIOServer;
}

/**
 * Get the socket.io server instance
 */
export function getSocketServer(): TypedSocketIOServer | null {
	return io as TypedSocketIOServer | null;
}

/**
 * Emit an event to all clients subscribed to a specific repo
 */
export function emitToRepo<T extends keyof ServerToClientEvents>(
	repoId: string,
	event: T,
	data: Parameters<ServerToClientEvents[T]>[0]
): void {
	if (!io) {
		console.warn('[Socket.io] Server not initialized, cannot emit event');
		return;
	}

	const room = `repo:${repoId}`;
	io.to(room).emit(event, data as never);
	console.log(`[Socket.io] Emitted ${event} to ${room}`);
}

/**
 * Vite plugin to attach socket.io to the dev server
 */
export function socketIOPlugin(): Plugin {
	return {
		name: 'vite-plugin-socket-io',
		configureServer(server: ViteDevServer) {
			if (!server.httpServer) {
				console.warn('[Socket.io] No HTTP server available in Vite dev server');
				return;
			}

			// Initialize socket.io server
			initSocketServer(server.httpServer);

			// Import and start file watcher after socket server is ready
			import('./services/file-watcher')
				.then(({ startFileWatcher }) => {
					startFileWatcher();
				})
				.catch((err) => {
					console.error('[Socket.io] Failed to start file watcher:', err);
				});
		}
	};
}

/**
 * Cleanup socket.io server
 */
export async function closeSocketServer(): Promise<void> {
	if (io) {
		await new Promise<void>((resolve) => {
			io!.close(() => {
				console.log('[Socket.io] Server closed');
				io = null;
				resolve();
			});
		});
	}
}
