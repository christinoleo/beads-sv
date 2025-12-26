import chokidar, { type FSWatcher } from 'chokidar';
import path from 'node:path';
import type { FileChangeEvent } from '$lib/types/beads';
import { appConfig } from './app-config';
import { emitToRepo, getSocketServer } from '../socket';

// Active watchers per repo
const watchers: Map<string, FSWatcher> = new Map();

// Debounce map to prevent duplicate events
const debounceTimers: Map<string, NodeJS.Timeout> = new Map();
const DEBOUNCE_MS = 100;

/**
 * Extract issue ID from file path
 */
function extractIssueId(filePath: string): string | undefined {
	const fileName = path.basename(filePath, '.md');
	// Match patterns like "PROJ-123" or similar issue ID formats
	if (/^[A-Za-z]+-\d+$/.test(fileName)) {
		return fileName;
	}
	return undefined;
}

/**
 * Create a file change event
 */
function createFileChangeEvent(
	type: FileChangeEvent['type'],
	repoId: string,
	filePath: string
): FileChangeEvent {
	return {
		type,
		repoId,
		issueId: extractIssueId(filePath),
		filePath,
		timestamp: new Date().toISOString()
	};
}

/**
 * Handle file change with debouncing
 */
function handleFileChange(
	type: FileChangeEvent['type'],
	repoId: string,
	filePath: string
): void {
	const key = `${repoId}:${filePath}:${type}`;

	// Clear existing timer for this file
	const existingTimer = debounceTimers.get(key);
	if (existingTimer) {
		clearTimeout(existingTimer);
	}

	// Set new debounce timer
	const timer = setTimeout(() => {
		debounceTimers.delete(key);

		const event = createFileChangeEvent(type, repoId, filePath);

		// Map file change type to socket event
		switch (type) {
			case 'created':
				emitToRepo(repoId, 'issue:created', event);
				break;
			case 'modified':
				emitToRepo(repoId, 'issue:changed', event);
				break;
			case 'deleted':
				emitToRepo(repoId, 'issue:deleted', event);
				break;
		}

		console.log(`[FileWatcher] ${type}: ${filePath} in repo ${repoId}`);
	}, DEBOUNCE_MS);

	debounceTimers.set(key, timer);
}

/**
 * Start watching a specific repository's issues directory
 */
export function watchRepo(repoId: string, repoPath: string): FSWatcher {
	// Stop existing watcher if any
	stopWatchingRepo(repoId);

	const issuesDir = path.join(repoPath, '.beads', 'issues');
	const globPattern = path.join(issuesDir, '*.md');

	console.log(`[FileWatcher] Starting watcher for repo ${repoId}: ${globPattern}`);

	const watcher = chokidar.watch(globPattern, {
		persistent: true,
		ignoreInitial: true,
		awaitWriteFinish: {
			stabilityThreshold: 100,
			pollInterval: 50
		},
		// Ignore dot files and temp files
		ignored: /(^|[\/\\])\../
	});

	watcher.on('add', (filePath: string) => {
		handleFileChange('created', repoId, filePath);
	});

	watcher.on('change', (filePath: string) => {
		handleFileChange('modified', repoId, filePath);
	});

	watcher.on('unlink', (filePath: string) => {
		handleFileChange('deleted', repoId, filePath);
	});

	watcher.on('error', (error: unknown) => {
		console.error(`[FileWatcher] Error in repo ${repoId}:`, error);
	});

	watcher.on('ready', () => {
		console.log(`[FileWatcher] Ready for repo ${repoId}`);
	});

	watchers.set(repoId, watcher);
	return watcher;
}

/**
 * Stop watching a specific repository
 */
export async function stopWatchingRepo(repoId: string): Promise<void> {
	const watcher = watchers.get(repoId);
	if (watcher) {
		await watcher.close();
		watchers.delete(repoId);
		console.log(`[FileWatcher] Stopped watcher for repo ${repoId}`);
	}
}

/**
 * Start watching all configured repositories
 */
export async function startFileWatcher(): Promise<void> {
	const io = getSocketServer();
	if (!io) {
		console.warn('[FileWatcher] Socket.io server not available, delaying startup...');
		return;
	}

	try {
		const repos = await appConfig.getRepos();

		for (const repo of repos) {
			if (repo.isValid) {
				watchRepo(repo.id, repo.path);
			}
		}

		console.log(`[FileWatcher] Started watching ${repos.filter(r => r.isValid).length} repositories`);
	} catch (error) {
		console.error('[FileWatcher] Failed to start file watchers:', error);
	}
}

/**
 * Stop all file watchers
 */
export async function stopAllWatchers(): Promise<void> {
	const closePromises: Promise<void>[] = [];

	for (const [repoId] of watchers) {
		closePromises.push(stopWatchingRepo(repoId));
	}

	// Clear all debounce timers
	for (const timer of debounceTimers.values()) {
		clearTimeout(timer);
	}
	debounceTimers.clear();

	await Promise.all(closePromises);
	console.log('[FileWatcher] All watchers stopped');
}

/**
 * Refresh watchers (e.g., when repos are added/removed)
 */
export async function refreshWatchers(): Promise<void> {
	try {
		const repos = await appConfig.getRepos();
		const currentRepoIds = new Set(repos.filter(r => r.isValid).map(r => r.id));
		const watchedRepoIds = new Set(watchers.keys());

		// Stop watchers for removed repos
		for (const repoId of watchedRepoIds) {
			if (!currentRepoIds.has(repoId)) {
				await stopWatchingRepo(repoId);
			}
		}

		// Start watchers for new repos
		for (const repo of repos) {
			if (repo.isValid && !watchedRepoIds.has(repo.id)) {
				watchRepo(repo.id, repo.path);
			}
		}
	} catch (error) {
		console.error('[FileWatcher] Failed to refresh watchers:', error);
	}
}

/**
 * Get list of currently watched repo IDs
 */
export function getWatchedRepos(): string[] {
	return Array.from(watchers.keys());
}
