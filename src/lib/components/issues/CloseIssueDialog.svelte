<script lang="ts">
	import Icon from '@iconify/svelte';
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';

	interface Props {
		open?: boolean;
		issueId?: string;
		issueTitle?: string;
		onOpenChange?: (open: boolean) => void;
		onConfirm?: (closeReason: string) => void;
	}

	let {
		open = $bindable(false),
		issueId = '',
		issueTitle = '',
		onOpenChange,
		onConfirm
	}: Props = $props();

	let closeReason = $state('');

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		onOpenChange?.(newOpen);
		if (!newOpen) {
			closeReason = '';
		}
	}

	function handleConfirm() {
		// Don't close here - let parent close after save succeeds
		onConfirm?.(closeReason.trim());
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
			handleConfirm();
		}
	}

	const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().includes('MAC');
	const modifierKey = isMac ? 'Cmd' : 'Ctrl';
</script>

<Dialog.Root bind:open onOpenChange={handleOpenChange}>
	<Dialog.Content class="sm:max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Icon icon="mdi:check-circle" class="h-5 w-5 text-green-600" />
				Close Issue
			</Dialog.Title>
			<Dialog.Description>
				{#if issueId}
					Closing <span class="font-mono font-medium">{issueId}</span>
					{#if issueTitle}
						: {issueTitle}
					{/if}
				{:else}
					Close this issue and optionally provide a reason.
				{/if}
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-4 py-4">
			<div class="space-y-2">
				<label for="close-reason" class="text-sm font-medium">
					Close Reason <span class="text-muted-foreground">(optional)</span>
				</label>
				<Textarea
					id="close-reason"
					bind:value={closeReason}
					placeholder="Describe why this issue is being closed..."
					rows={3}
					onkeydown={handleKeydown}
					class="resize-y"
				/>
				<p class="text-xs text-muted-foreground">
					Press <kbd class="rounded border bg-muted px-1">{modifierKey}+Enter</kbd> to confirm
				</p>
			</div>
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={() => handleOpenChange(false)}>Cancel</Button>
			<Button onclick={handleConfirm}>
				<Icon icon="mdi:check" class="h-4 w-4" />
				Close Issue
			</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root>
