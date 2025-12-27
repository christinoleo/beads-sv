// Issue Types
export type IssueType = 'task' | 'bug' | 'feature' | 'epic' | 'chore';
export type IssueStatus = 'open' | 'in_progress' | 'closed';
export type Priority = 0 | 1 | 2 | 3 | 4; // 0=critical, 4=backlog

// Core Issue Interface
export interface Issue {
	id: string;
	title: string;
	type: IssueType;
	status: IssueStatus;
	priority: Priority;
	created: string; // ISO date
	updated?: string; // ISO date
	closed?: string; // ISO date
	closeReason?: string; // Reason for closing
	description: string;
	acceptanceCriteria?: string;
	labels: string[];
	blockedBy: string[]; // Issue IDs
	blocks: string[]; // Issue IDs
	parentId?: string; // Epic ID
	filePath: string;
}

// Beads Config (per-repo .beads/config.json or config.yaml)
export interface BeadsConfig {
	prefix: string;
	nextId?: number;
	created?: string;
	version?: string;
}

// Managed Repository
export interface ManagedRepo {
	id: string;
	path: string;
	name: string;
	color?: string;
	config: BeadsConfig;
	lastSyncedAt: string;
	issueCount?: number;
	openCount?: number;
	isValid: boolean;
	errorMessage?: string;
}

// App Config (~/.beads-sv/config.json)
export interface AppConfig {
	version: string;
	repos: ManagedRepo[];
	preferences: AppPreferences;
	recentRepos: string[]; // repo IDs
}

export interface AppPreferences {
	theme: 'light' | 'dark' | 'system';
	defaultView: 'list' | 'board' | 'epics';
	issuesPerPage: number;
}

// API Response Types
export interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: ApiError;
}

export interface ApiError {
	code: string;
	message: string;
	details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
	items: T[];
	total: number;
	page: number;
	pageSize: number;
	hasMore: boolean;
}

// Issue Filters
export interface IssueFilter {
	status?: IssueStatus[];
	type?: IssueType[];
	priority?: Priority[];
	labels?: string[];
	search?: string;
	parentId?: string;
}

export interface IssueSort {
	field: 'created' | 'updated' | 'priority' | 'status' | 'title';
	direction: 'asc' | 'desc';
}

// Socket Event Types
export type FileChangeType = 'created' | 'modified' | 'deleted';

export interface FileChangeEvent {
	type: FileChangeType;
	repoId: string;
	issueId?: string;
	filePath: string;
	timestamp: string;
}

export interface RepoSyncEvent {
	repoId: string;
	type: 'sync_start' | 'sync_complete' | 'sync_error';
	issueCount?: number;
	error?: string;
}

// Validation Types
export interface ValidationResult {
	isValid: boolean;
	config?: BeadsConfig;
	error?: string;
	warnings?: string[];
}

export interface ImportResult {
	imported: ManagedRepo[];
	skipped: string[];
	errors: { path: string; error: string }[];
}

// Create/Update DTOs
export interface CreateIssueDto {
	title: string;
	type?: IssueType;
	priority?: Priority;
	description?: string;
	labels?: string[];
	parentId?: string;
}

export interface UpdateIssueDto {
	title?: string;
	type?: IssueType;
	status?: IssueStatus;
	priority?: Priority;
	description?: string;
	acceptanceCriteria?: string;
	labels?: string[];
	closeReason?: string;
}

export interface AddRepoDto {
	path: string;
	name?: string;
	color?: string;
}
