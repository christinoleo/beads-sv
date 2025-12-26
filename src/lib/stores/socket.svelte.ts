import { io, type Socket } from 'socket.io-client';
import type { FileChangeEvent, RepoSyncEvent } from '$lib/types/beads';
import { browser } from '$app/environment';

// Socket event types matching server definitions
interface ServerToClientEvents {
	'issue:changed': (event: FileChangeEvent) => void;
	'issue:created': (event: FileChangeEvent) => void;
	'issue:deleted': (event: FileChangeEvent) => void;
	'repo:sync': (event: RepoSyncEvent) => void;
	'repo:subscribed': (data: { repoId: string; clientCount: number }) => void;
	'repo:unsubscribed': (data: { repoId: string }) => void;
	error: (data: { message: string; code?: string }) => void;
}

interface ClientToServerEvents {
	'repo:subscribe': (repoId: string) => void;
	'repo:unsubscribe': (repoId: string) => void;
}

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Connection state enum
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// Event callback types
type IssueEventCallback = (event: FileChangeEvent) => void;
type RepoSyncCallback = (event: RepoSyncEvent) => void;
type ErrorCallback = (error: { message: string; code?: string }) => void;

/**
 * Socket.io client store using Svelte 5 runes
 */
function createSocketStore() {
	// Reactive state using $state
	let connectionState = $state<ConnectionState>('disconnected');
	let subscribedRepos = $state<Set<string>>(new Set());
	let lastError = $state<string | null>(null);
	let reconnectAttempts = $state(0);

	// Socket instance
	let socket: TypedSocket | null = null;

	// Event listeners
	const issueChangedListeners = new Set<IssueEventCallback>();
	const issueCreatedListeners = new Set<IssueEventCallback>();
	const issueDeletedListeners = new Set<IssueEventCallback>();
	const repoSyncListeners = new Set<RepoSyncCallback>();
	const errorListeners = new Set<ErrorCallback>();

	/**
	 * Connect to socket.io server
	 */
	function connect(): void {
		if (!browser) return;
		if (socket?.connected) return;

		connectionState = 'connecting';
		lastError = null;

		socket = io({
			path: '/socket.io',
			transports: ['websocket', 'polling'],
			reconnection: true,
			reconnectionAttempts: Infinity,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			timeout: 20000
		});

		// Connection events
		socket.on('connect', () => {
			connectionState = 'connected';
			reconnectAttempts = 0;
			lastError = null;
			console.log('[SocketStore] Connected:', socket?.id);

			// Re-subscribe to previously subscribed repos
			for (const repoId of subscribedRepos) {
				socket?.emit('repo:subscribe', repoId);
			}
		});

		socket.on('disconnect', (reason) => {
			connectionState = 'disconnected';
			console.log('[SocketStore] Disconnected:', reason);
		});

		socket.on('connect_error', (error) => {
			connectionState = 'error';
			lastError = error.message;
			reconnectAttempts++;
			console.error('[SocketStore] Connection error:', error.message);
		});

		// Issue events
		socket.on('issue:changed', (event) => {
			for (const listener of issueChangedListeners) {
				listener(event);
			}
		});

		socket.on('issue:created', (event) => {
			for (const listener of issueCreatedListeners) {
				listener(event);
			}
		});

		socket.on('issue:deleted', (event) => {
			for (const listener of issueDeletedListeners) {
				listener(event);
			}
		});

		// Repo events
		socket.on('repo:sync', (event) => {
			for (const listener of repoSyncListeners) {
				listener(event);
			}
		});

		socket.on('repo:subscribed', ({ repoId, clientCount }) => {
			subscribedRepos = new Set([...subscribedRepos, repoId]);
			console.log(`[SocketStore] Subscribed to repo:${repoId} (${clientCount} clients)`);
		});

		socket.on('repo:unsubscribed', ({ repoId }) => {
			const newSet = new Set(subscribedRepos);
			newSet.delete(repoId);
			subscribedRepos = newSet;
			console.log(`[SocketStore] Unsubscribed from repo:${repoId}`);
		});

		socket.on('error', (error) => {
			lastError = error.message;
			for (const listener of errorListeners) {
				listener(error);
			}
		});
	}

	/**
	 * Disconnect from socket.io server
	 */
	function disconnect(): void {
		if (socket) {
			socket.disconnect();
			socket = null;
			connectionState = 'disconnected';
			subscribedRepos = new Set();
		}
	}

	/**
	 * Subscribe to a repository's real-time events
	 */
	function subscribeToRepo(repoId: string): void {
		if (!socket?.connected) {
			// Queue subscription for when connected
			subscribedRepos = new Set([...subscribedRepos, repoId]);
			return;
		}

		socket.emit('repo:subscribe', repoId);
	}

	/**
	 * Unsubscribe from a repository's real-time events
	 */
	function unsubscribeFromRepo(repoId: string): void {
		if (!socket?.connected) {
			const newSet = new Set(subscribedRepos);
			newSet.delete(repoId);
			subscribedRepos = newSet;
			return;
		}

		socket.emit('repo:unsubscribe', repoId);
	}

	/**
	 * Check if subscribed to a specific repo
	 */
	function isSubscribedTo(repoId: string): boolean {
		return subscribedRepos.has(repoId);
	}

	/**
	 * Add event listener for issue changes
	 */
	function onIssueChanged(callback: IssueEventCallback): () => void {
		issueChangedListeners.add(callback);
		return () => issueChangedListeners.delete(callback);
	}

	/**
	 * Add event listener for issue creation
	 */
	function onIssueCreated(callback: IssueEventCallback): () => void {
		issueCreatedListeners.add(callback);
		return () => issueCreatedListeners.delete(callback);
	}

	/**
	 * Add event listener for issue deletion
	 */
	function onIssueDeleted(callback: IssueEventCallback): () => void {
		issueDeletedListeners.add(callback);
		return () => issueDeletedListeners.delete(callback);
	}

	/**
	 * Add event listener for repo sync events
	 */
	function onRepoSync(callback: RepoSyncCallback): () => void {
		repoSyncListeners.add(callback);
		return () => repoSyncListeners.delete(callback);
	}

	/**
	 * Add event listener for errors
	 */
	function onError(callback: ErrorCallback): () => void {
		errorListeners.add(callback);
		return () => errorListeners.delete(callback);
	}

	return {
		// Getters for reactive state (using getter functions for $state)
		get connectionState() {
			return connectionState;
		},
		get subscribedRepos() {
			return subscribedRepos;
		},
		get lastError() {
			return lastError;
		},
		get reconnectAttempts() {
			return reconnectAttempts;
		},
		get isConnected() {
			return connectionState === 'connected';
		},

		// Methods
		connect,
		disconnect,
		subscribeToRepo,
		unsubscribeFromRepo,
		isSubscribedTo,

		// Event listeners
		onIssueChanged,
		onIssueCreated,
		onIssueDeleted,
		onRepoSync,
		onError
	};
}

// Export singleton store instance
export const socketStore = createSocketStore();

/**
 * Svelte 5 runes hook for using socket store in components
 * Automatically connects on mount and handles cleanup
 */
export function useSocket(options: { autoConnect?: boolean; repos?: string[] } = {}) {
	const { autoConnect = true, repos = [] } = options;

	// Track cleanup functions
	let cleanupFns: (() => void)[] = [];

	$effect(() => {
		if (!browser) return;

		if (autoConnect) {
			socketStore.connect();
		}

		// Subscribe to specified repos
		for (const repoId of repos) {
			socketStore.subscribeToRepo(repoId);
		}

		// Cleanup function
		return () => {
			for (const repoId of repos) {
				socketStore.unsubscribeFromRepo(repoId);
			}
			for (const cleanup of cleanupFns) {
				cleanup();
			}
			cleanupFns = [];
		};
	});

	/**
	 * Subscribe to issue changes for a specific repo
	 */
	function watchIssues(
		repoId: string,
		callbacks: {
			onChanged?: IssueEventCallback;
			onCreated?: IssueEventCallback;
			onDeleted?: IssueEventCallback;
		}
	): () => void {
		socketStore.subscribeToRepo(repoId);

		const cleanups: (() => void)[] = [];

		if (callbacks.onChanged) {
			cleanups.push(
				socketStore.onIssueChanged((event) => {
					if (event.repoId === repoId) {
						callbacks.onChanged!(event);
					}
				})
			);
		}

		if (callbacks.onCreated) {
			cleanups.push(
				socketStore.onIssueCreated((event) => {
					if (event.repoId === repoId) {
						callbacks.onCreated!(event);
					}
				})
			);
		}

		if (callbacks.onDeleted) {
			cleanups.push(
				socketStore.onIssueDeleted((event) => {
					if (event.repoId === repoId) {
						callbacks.onDeleted!(event);
					}
				})
			);
		}

		const cleanup = () => {
			for (const fn of cleanups) {
				fn();
			}
			socketStore.unsubscribeFromRepo(repoId);
		};

		cleanupFns.push(cleanup);

		return cleanup;
	}

	return {
		store: socketStore,
		watchIssues
	};
}
