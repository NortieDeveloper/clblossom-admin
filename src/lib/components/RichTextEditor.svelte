<script>
	let { id = undefined, value = $bindable('') } = $props();

	let editor = $state();
	let sourceMode = $state(false);
	let sourceValue = $state(value ?? '');
	let lastEditorValue = $state('');

	$effect(() => {
		const nextValue = value ?? '';
		if (sourceMode) {
			sourceValue = nextValue;
			return;
		}

		if (editor && nextValue !== lastEditorValue && nextValue !== editor.innerHTML) {
			editor.innerHTML = nextValue;
			lastEditorValue = nextValue;
		}
	});

	function syncFromEditor() {
		value = editor?.innerHTML ?? '';
		lastEditorValue = value;
	}

	function run(command, argument = null) {
		editor?.focus();
		document.execCommand(command, false, argument);
		syncFromEditor();
	}

	function addLink() {
		const url = window.prompt('Link URL');
		if (!url) return;
		run('createLink', url);
	}

	function toggleSourceMode() {
		if (sourceMode) {
			value = sourceValue;
			sourceMode = false;
			return;
		}

		syncFromEditor();
		sourceValue = value ?? '';
		sourceMode = true;
	}
</script>

<div class="overflow-hidden rounded-lg border border-pink-100 bg-white">
	<div class="flex flex-wrap gap-1 border-b border-pink-100 bg-pink-50 p-2">
		<button class="tool-button" type="button" title="Bold" onclick={() => run('bold')}>B</button>
		<button class="tool-button italic" type="button" title="Italic" onclick={() => run('italic')}>I</button>
		<button class="tool-button underline" type="button" title="Underline" onclick={() => run('underline')}>U</button>
		<button class="tool-button" type="button" title="Heading" onclick={() => run('formatBlock', 'h3')}>H</button>
		<button class="tool-button" type="button" title="Paragraph" onclick={() => run('formatBlock', 'p')}>P</button>
		<button class="tool-button" type="button" title="Bulleted list" onclick={() => run('insertUnorderedList')}>-</button>
		<button class="tool-button" type="button" title="Numbered list" onclick={() => run('insertOrderedList')}>1.</button>
		<button class="tool-button" type="button" title="Link" onclick={addLink}>Link</button>
		<button class="tool-button ml-auto" type="button" title="Edit HTML" onclick={toggleSourceMode}>
			{sourceMode ? 'Editor' : 'HTML'}
		</button>
	</div>

	{#if sourceMode}
		<textarea
			{id}
			class="min-h-56 w-full resize-y border-0 p-3 font-mono text-sm text-gray-900 focus:ring-0"
			bind:value={sourceValue}
			oninput={() => (value = sourceValue)}
		></textarea>
	{:else}
		<div
			{id}
			class="rich-editor min-h-56 p-4 text-sm leading-6 text-gray-900 outline-none"
			contenteditable="true"
			role="textbox"
			aria-multiline="true"
			bind:this={editor}
			oninput={syncFromEditor}
			onblur={syncFromEditor}
		></div>
	{/if}
</div>

<style>
	.tool-button {
		display: inline-flex;
		min-width: 2.15rem;
		height: 2.15rem;
		align-items: center;
		justify-content: center;
		border: 1px solid #e9c4d3;
		border-radius: 6px;
		background: #fff;
		padding: 0 0.6rem;
		color: #7a1d43;
		font-size: 0.8rem;
		font-weight: 800;
		line-height: 1;
	}

	.rich-editor :global(h3) {
		margin: 0.75rem 0 0.35rem;
		font-size: 1.1rem;
		font-weight: 800;
	}

	.rich-editor :global(p) {
		margin: 0 0 0.75rem;
	}

	.rich-editor :global(ul),
	.rich-editor :global(ol) {
		margin: 0 0 0.75rem 1.25rem;
		padding-left: 1rem;
	}

	.rich-editor :global(ul) {
		list-style: disc;
	}

	.rich-editor :global(ol) {
		list-style: decimal;
	}

	.rich-editor :global(a) {
		color: #be185d;
		text-decoration: underline;
	}
</style>
