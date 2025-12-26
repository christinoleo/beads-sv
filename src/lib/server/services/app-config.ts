import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import type { AppConfig, ManagedRepo, AddRepoDto, AppPreferences } from '$lib/types/beads';

const CONFIG_DIR = path.join(os.homedir(), '.beads-sv');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_PREFERENCES: AppPreferences = {
	theme: 'system',
	defaultView: 'list',
	issuesPerPage: 50
};

const DEFAULT_CONFIG: AppConfig = {
	version: '1.0.0',
	repos: [],
	preferences: DEFAULT_PREFERENCES,
	recentRepos: []
};

class AppConfigService {
	private config: AppConfig | null = null;

	async load(): Promise<AppConfig> {
		if (this.config) return this.config;

		try {
			const content = await fs.readFile(CONFIG_FILE, 'utf-8');
			this.config = { ...DEFAULT_CONFIG, ...JSON.parse(content) };
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
				await this.ensureConfigDir();
				this.config = { ...DEFAULT_CONFIG };
				await this.save();
			} else {
				throw e;
			}
		}

		return this.config!;
	}

	async save(): Promise<void> {
		if (!this.config) throw new Error('Config not loaded');
		await this.ensureConfigDir();
		await fs.writeFile(CONFIG_FILE, JSON.stringify(this.config, null, 2), 'utf-8');
	}

	private async ensureConfigDir(): Promise<void> {
		try {
			await fs.mkdir(CONFIG_DIR, { recursive: true });
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code !== 'EEXIST') throw e;
		}
	}

	async getRepos(): Promise<ManagedRepo[]> {
		const config = await this.load();
		return config.repos;
	}

	async getRepo(repoId: string): Promise<ManagedRepo | undefined> {
		const config = await this.load();
		return config.repos.find((r) => r.id === repoId);
	}

	async addRepo(dto: AddRepoDto & { config: ManagedRepo['config'] }): Promise<ManagedRepo> {
		const config = await this.load();

		const id = this.generateRepoId(dto.path);

		// Check for duplicates
		if (config.repos.find((r) => r.id === id || r.path === dto.path)) {
			throw new Error('Repository already managed');
		}

		const newRepo: ManagedRepo = {
			id,
			path: dto.path,
			name: dto.name || path.basename(dto.path),
			color: dto.color,
			config: dto.config,
			lastSyncedAt: new Date().toISOString(),
			isValid: true
		};

		config.repos.push(newRepo);
		await this.save();

		return newRepo;
	}

	async removeRepo(repoId: string): Promise<void> {
		const config = await this.load();
		config.repos = config.repos.filter((r) => r.id !== repoId);
		config.recentRepos = config.recentRepos.filter((id) => id !== repoId);
		await this.save();
	}

	async updateRepo(repoId: string, updates: Partial<ManagedRepo>): Promise<ManagedRepo> {
		const config = await this.load();
		const index = config.repos.findIndex((r) => r.id === repoId);

		if (index === -1) throw new Error('Repository not found');

		config.repos[index] = { ...config.repos[index], ...updates };
		await this.save();

		return config.repos[index];
	}

	async updatePreferences(prefs: Partial<AppPreferences>): Promise<AppPreferences> {
		const config = await this.load();
		config.preferences = { ...config.preferences, ...prefs };
		await this.save();
		return config.preferences;
	}

	async addRecentRepo(repoId: string): Promise<void> {
		const config = await this.load();
		config.recentRepos = [repoId, ...config.recentRepos.filter((id) => id !== repoId)].slice(0, 10);
		await this.save();
	}

	private generateRepoId(repoPath: string): string {
		const hash = Buffer.from(repoPath).toString('base64url').slice(0, 8);
		const name = path.basename(repoPath).toLowerCase().replace(/[^a-z0-9]/g, '-');
		return `${name}-${hash}`;
	}
}

export const appConfig = new AppConfigService();
