import type { Issue, IssueType, IssueStatus, Priority } from '$lib/types/beads';

const METADATA_PATTERNS = {
	type: /^-\s*\*\*Type:\*\*\s*(.+)$/im,
	status: /^-\s*\*\*Status:\*\*\s*(.+)$/im,
	priority: /^-\s*\*\*Priority:\*\*\s*(\d+)$/im,
	created: /^-\s*\*\*Created:\*\*\s*(.+)$/im,
	updated: /^-\s*\*\*Updated:\*\*\s*(.+)$/im,
	closed: /^-\s*\*\*Closed:\*\*\s*(.+)$/im,
	labels: /^-\s*\*\*Labels:\*\*\s*(.+)$/im,
	parent: /^-\s*\*\*Parent:\*\*\s*(.+)$/im,
	blockedBy: /^-\s*\*\*Blocked by:\*\*\s*(.+)$/im,
	blocks: /^-\s*\*\*Blocks:\*\*\s*(.+)$/im
};

export class ParseError extends Error {
	constructor(
		message: string,
		public filePath: string
	) {
		super(`${message} in ${filePath}`);
		this.name = 'ParseError';
	}
}

export function parseIssue(content: string, filePath: string): Issue {
	// Extract title from H1 line: "# issue-id: Title here"
	const titleMatch = content.match(/^#\s+([^:\n]+):\s*(.+)$/m);
	if (!titleMatch) {
		throw new ParseError('Invalid issue format: missing title', filePath);
	}

	const id = titleMatch[1].trim();
	const title = titleMatch[2].trim();

	// Parse metadata
	const type = extractMatch(content, METADATA_PATTERNS.type, 'task') as IssueType;
	const status = extractMatch(content, METADATA_PATTERNS.status, 'open')
		.toLowerCase()
		.replace('-', '_') as IssueStatus;
	const priority = parseInt(extractMatch(content, METADATA_PATTERNS.priority, '2'), 10) as Priority;
	const created = extractMatch(
		content,
		METADATA_PATTERNS.created,
		new Date().toISOString().split('T')[0]
	);
	const updated = extractMatch(content, METADATA_PATTERNS.updated, undefined);
	const closed = extractMatch(content, METADATA_PATTERNS.closed, undefined);
	const labelsStr = extractMatch(content, METADATA_PATTERNS.labels, '');
	const parentId = extractMatch(content, METADATA_PATTERNS.parent, undefined);
	const blockedByStr = extractMatch(content, METADATA_PATTERNS.blockedBy, '');
	const blocksStr = extractMatch(content, METADATA_PATTERNS.blocks, '');

	// Parse arrays
	const labels = labelsStr
		? labelsStr
				.split(',')
				.map((l) => l.trim())
				.filter(Boolean)
		: [];
	const blockedBy = blockedByStr
		? blockedByStr
				.split(',')
				.map((l) => l.trim())
				.filter(Boolean)
		: [];
	const blocks = blocksStr
		? blocksStr
				.split(',')
				.map((l) => l.trim())
				.filter(Boolean)
		: [];

	// Parse description section
	const description = extractSection(content, 'Description') || '';
	const acceptanceCriteria = extractSection(content, 'Acceptance Criteria');

	return {
		id,
		title,
		type,
		status,
		priority,
		created,
		updated,
		closed,
		description,
		acceptanceCriteria,
		labels,
		blockedBy,
		blocks,
		parentId,
		filePath
	};
}

export function serializeIssue(issue: Issue): string {
	const lines: string[] = [];

	// Title
	lines.push(`# ${issue.id}: ${issue.title}`);
	lines.push('');

	// Metadata
	lines.push(`- **Type:** ${issue.type}`);
	lines.push(`- **Status:** ${issue.status.replace('_', '-')}`);
	lines.push(`- **Priority:** ${issue.priority}`);
	lines.push(`- **Created:** ${issue.created}`);
	if (issue.updated) lines.push(`- **Updated:** ${issue.updated}`);
	if (issue.closed) lines.push(`- **Closed:** ${issue.closed}`);
	if (issue.labels.length > 0) lines.push(`- **Labels:** ${issue.labels.join(', ')}`);
	if (issue.parentId) lines.push(`- **Parent:** ${issue.parentId}`);
	if (issue.blockedBy.length > 0) lines.push(`- **Blocked by:** ${issue.blockedBy.join(', ')}`);
	if (issue.blocks.length > 0) lines.push(`- **Blocks:** ${issue.blocks.join(', ')}`);
	lines.push('');

	// Description
	lines.push('## Description');
	lines.push('');
	lines.push(issue.description);
	lines.push('');

	// Acceptance Criteria
	if (issue.acceptanceCriteria) {
		lines.push('## Acceptance Criteria');
		lines.push('');
		lines.push(issue.acceptanceCriteria);
		lines.push('');
	}

	return lines.join('\n');
}

function extractMatch(content: string, pattern: RegExp, defaultValue: string): string;
function extractMatch(
	content: string,
	pattern: RegExp,
	defaultValue: undefined
): string | undefined;
function extractMatch(
	content: string,
	pattern: RegExp,
	defaultValue: string | undefined
): string | undefined {
	const match = content.match(pattern);
	return match?.[1]?.trim() ?? defaultValue;
}

function extractSection(content: string, sectionName: string): string | undefined {
	const pattern = new RegExp(`^##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=^##\\s|$)`, 'mi');
	const match = content.match(pattern);
	return match?.[1]?.trim();
}
