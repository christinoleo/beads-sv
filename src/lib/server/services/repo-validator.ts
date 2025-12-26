import { promises as fs } from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';
import type { BeadsConfig, ValidationResult } from '$lib/types/beads';

export async function validateBeadsRepo(repoPath: string): Promise<ValidationResult> {
	const warnings: string[] = [];
	const beadsDir = path.join(repoPath, '.beads');

	// Check .beads directory exists
	try {
		const stat = await fs.stat(beadsDir);
		if (!stat.isDirectory()) {
			return { isValid: false, error: '.beads exists but is not a directory' };
		}
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
			return { isValid: false, error: '.beads directory not found' };
		}
		return { isValid: false, error: `Cannot access .beads: ${(e as Error).message}` };
	}

	// Try to read config (config.yaml or config.json)
	let config: BeadsConfig | undefined;

	// Try YAML first (bd default)
	const yamlPath = path.join(beadsDir, 'config.yaml');
	const jsonPath = path.join(beadsDir, 'config.json');

	try {
		const yamlContent = await fs.readFile(yamlPath, 'utf-8');
		config = yaml.load(yamlContent) as BeadsConfig;
	} catch {
		// Try JSON fallback
		try {
			const jsonContent = await fs.readFile(jsonPath, 'utf-8');
			config = JSON.parse(jsonContent) as BeadsConfig;
		} catch (e) {
			if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
				return { isValid: false, error: '.beads/config.yaml or config.json not found' };
			}
			return { isValid: false, error: `Cannot read config: ${(e as Error).message}` };
		}
	}

	// Validate and normalize prefix field
	// Beads uses 'issue-prefix' in YAML, but we normalize to 'prefix'
	const rawConfig = config as Record<string, unknown>;
	const prefix = rawConfig['issue-prefix'] || rawConfig.prefix || rawConfig.issuePrefix;

	// If no prefix specified, derive from directory name
	const normalizedPrefix = typeof prefix === 'string' && prefix.trim()
		? prefix.trim()
		: path.basename(repoPath);

	config.prefix = normalizedPrefix;

	if (!config.version) {
		warnings.push('Config missing "version" field');
	}

	// Check for issues directory or database
	const issuesDir = path.join(beadsDir, 'issues');
	const dbPath = path.join(beadsDir, 'beads.db');

	try {
		await fs.stat(issuesDir);
	} catch {
		try {
			await fs.stat(dbPath);
		} catch {
			warnings.push('No issues directory or database found');
		}
	}

	// Check permissions
	try {
		await fs.access(beadsDir, fs.constants.R_OK | fs.constants.W_OK);
	} catch {
		return { isValid: false, error: 'Insufficient permissions on .beads directory' };
	}

	return {
		isValid: true,
		config,
		warnings: warnings.length > 0 ? warnings : undefined
	};
}

export async function scanForBeadsRepos(
	folderPath: string,
	options: { recursive?: boolean; maxDepth?: number } = {}
): Promise<{ path: string; config: BeadsConfig }[]> {
	const { recursive = true, maxDepth = 3 } = options;
	const foundRepos: { path: string; config: BeadsConfig }[] = [];

	async function scan(currentPath: string, depth: number): Promise<void> {
		if (depth > maxDepth) return;

		// Check if current directory is a beads repo
		const validation = await validateBeadsRepo(currentPath);
		if (validation.isValid && validation.config) {
			foundRepos.push({ path: currentPath, config: validation.config });
			return; // Don't recurse into beads repos
		}

		if (!recursive) return;

		// Scan subdirectories
		try {
			const entries = await fs.readdir(currentPath, { withFileTypes: true });

			for (const entry of entries) {
				if (!entry.isDirectory()) continue;
				if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

				await scan(path.join(currentPath, entry.name), depth + 1);
			}
		} catch {
			// Ignore permission errors on subdirectories
		}
	}

	await scan(folderPath, 0);
	return foundRepos;
}
