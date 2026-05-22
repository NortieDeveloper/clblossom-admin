<script>
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import { slide } from 'svelte/transition';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';
	import AdminActivityList from '$lib/components/AdminActivityList.svelte';

	let { data, form } = $props();

	const flipDurationMs = 150;
	const blockTypes = [
		{ type: 'banner', label: 'Banner' },
		{ type: 'bookFeature', label: 'Book feature' },
		{ type: 'richText', label: 'Rich text' },
		{ type: 'imageText', label: 'Image + text' },
		{ type: 'linkButtons', label: 'Link buttons' }
	];

	let blocks = $state((data.homepage.blocks ?? []).map(normalizeBlock));
	let payload = $derived(JSON.stringify({ blocks: serializeBlocks() }));
	let uploadInput = $state();
	let uploadTarget = $state(null);
	let uploadError = $state('');
	let uploading = $state(false);
	let collapsedBlockIds = $state(new Set());
	let allBlocksCollapsed = $derived(blocks.length > 0 && blocks.every((block) => collapsedBlockIds.has(block.id)));

	function makeId(prefix = 'block') {
		return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	function normalizeBlock(block) {
		return {
			id: block.id || makeId(block.type || 'block'),
			type: block.type || 'richText',
			isVisible: block.isVisible ?? true,
			sortOrder: block.sortOrder ?? 0,
			content: normalizeContent(block.type || 'richText', structuredClone(block.content ?? {}))
		};
	}

	function normalizeContent(type, content) {
		if (type === 'banner') {
			return {
				imageUrl: content.imageUrl ?? '',
				imageAltText: content.imageAltText ?? '',
				heading: content.heading ?? '',
				subheading: content.subheading ?? '',
				linkUrl: content.linkUrl ?? ''
			};
		}
		if (type === 'bookFeature') {
			return {
				bookId: content.bookId ?? data.books[0]?.id ?? '',
				heading: content.heading ?? '',
				descriptionHtml: content.descriptionHtml ?? '',
				coverImageUrl: content.coverImageUrl ?? '',
				coverImageAltText: content.coverImageAltText ?? '',
				links: normalizeLinks(content.links ?? [])
			};
		}
		if (type === 'imageText') {
			return {
				heading: content.heading ?? '',
				bodyHtml: content.bodyHtml ?? '',
				imageUrl: content.imageUrl ?? '',
				imageAltText: content.imageAltText ?? '',
				imagePosition: content.imagePosition ?? 'left'
			};
		}
		if (type === 'linkButtons') {
			return {
				heading: content.heading ?? '',
				links: normalizeLinks(content.links?.length ? content.links : [blankLink()])
			};
		}
		return {
			heading: content.heading ?? '',
			bodyHtml: content.bodyHtml ?? ''
		};
	}

	function normalizeLinks(links) {
		return links.map((link, index) => ({
			id: link.id || makeId('link'),
			label: link.label ?? '',
			url: link.url ?? '',
			style: link.style ?? 'secondary',
			sortOrder: index
		}));
	}

	function blankLink() {
		return { id: makeId('link'), label: '', url: '', style: 'secondary', sortOrder: 0 };
	}

	function addBlock(type) {
		blocks.push(
			normalizeBlock({
				id: makeId(type),
				type,
				isVisible: true,
				sortOrder: blocks.length,
				content: {}
			})
		);
	}

	function duplicateBlock(index) {
		const source = blocks[index];
		const copy = normalizeBlock({
			id: makeId(source.type),
			type: source.type,
			isVisible: source.isVisible,
			sortOrder: index + 1,
			content: cleanContent(source)
		});
		blocks.splice(index + 1, 0, copy);
		normalizeOrder();
	}

	function removeBlock(index) {
		collapsedBlockIds.delete(blocks[index].id);
		blocks.splice(index, 1);
		normalizeOrder();
	}

	function moveBlock(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= blocks.length) return;
		const block = blocks[index];
		blocks[index] = blocks[nextIndex];
		blocks[nextIndex] = block;
		normalizeOrder();
	}

	function moveBlockTo(index, nextIndex) {
		if (index === nextIndex || index < 0 || index >= blocks.length) return;
		const [block] = blocks.splice(index, 1);
		blocks.splice(nextIndex, 0, block);
		normalizeOrder();
	}

	function handleBlockDnd(event) {
		blocks = event.detail.items;
		normalizeOrder();
	}

	function normalizeOrder() {
		blocks.forEach((block, index) => {
			block.sortOrder = index;
		});
	}

	function addLink(block) {
		block.content.links ??= [];
		block.content.links.push(blankLink());
		normalizeLinkOrder(block);
	}

	function removeLink(block, index) {
		block.content.links.splice(index, 1);
		normalizeLinkOrder(block);
	}

	function moveLink(block, index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= block.content.links.length) return;
		const link = block.content.links[index];
		block.content.links[index] = block.content.links[nextIndex];
		block.content.links[nextIndex] = link;
		normalizeLinkOrder(block);
	}

	function normalizeLinkOrder(block) {
		block.content.links.forEach((link, index) => {
			link.sortOrder = index;
		});
	}

	function browseImage(block, urlField, altField) {
		uploadError = '';
		uploadTarget = { blockId: block.id, urlField, altField };
		uploadInput?.click();
	}

	async function uploadImage(event) {
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file || !uploadTarget) return;

		uploading = true;
		uploadError = '';
		try {
			const formData = new FormData();
			formData.set('file', file);
			const response = await fetch('/homepage/images/upload', {
				method: 'POST',
				body: formData
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				uploadError = result.error || result.message || 'Unable to upload image.';
				return;
			}

			const block = blocks.find((item) => item.id === uploadTarget.blockId);
			if (!block) return;
			block.content[uploadTarget.urlField] = result.url;
			if (uploadTarget.altField && !block.content[uploadTarget.altField]) {
				block.content[uploadTarget.altField] = file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
			}
		} catch {
			uploadError = 'Unable to upload image.';
		} finally {
			uploading = false;
			uploadTarget = null;
		}
	}

	function selectedBook(block) {
		return data.books.find((book) => book.id === block.content.bookId);
	}

	function blockSummary(block) {
		if (block.type === 'banner') return block.content.heading || block.content.imageAltText || block.content.imageUrl || 'Banner';
		if (block.type === 'bookFeature') return block.content.heading || selectedBook(block)?.title || 'Book feature';
		if (block.type === 'richText') return block.content.heading || 'Rich text';
		if (block.type === 'imageText') return block.content.heading || block.content.imageAltText || 'Image + text';
		if (block.type === 'linkButtons') return block.content.heading || `${block.content.links?.length ?? 0} links`;
		return block.type;
	}

	function isCollapsed(block) {
		return collapsedBlockIds.has(block.id);
	}

	function toggleCollapsed(block) {
		const next = new Set(collapsedBlockIds);
		if (next.has(block.id)) next.delete(block.id);
		else next.add(block.id);
		collapsedBlockIds = next;
	}

	function collapseAll() {
		collapsedBlockIds = new Set(blocks.map((block) => block.id));
	}

	function expandAll() {
		collapsedBlockIds = new Set();
	}

	function serializeBlocks() {
		return blocks.map((block, index) => ({
			id: block.id,
			type: block.type,
			isVisible: block.isVisible,
			sortOrder: index,
			content: cleanContent(block)
		}));
	}

	function cleanContent(block) {
		const content = { ...block.content };
		if (Array.isArray(content.links)) {
			content.links = content.links
				.filter((link) => (link.label ?? '').trim() || (link.url ?? '').trim())
				.map((link, index) => ({
					id: link.id,
					label: link.label ?? '',
					url: link.url ?? '',
					style: link.style ?? 'secondary',
					sortOrder: index
				}));
		}
		delete content.book;
		return content;
	}
</script>

<svelte:head>
	<title>Homepage | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">Homepage</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Build the public homepage from ordered content blocks.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			<button class="button button-secondary" type="button" onclick={collapseAll} disabled={!blocks.length || allBlocksCollapsed}>Collapse all</button>
			<button class="button button-secondary" type="button" onclick={expandAll} disabled={!collapsedBlockIds.size}>Expand all</button>
			{#each blockTypes as blockType}
				<button class="button button-secondary" type="button" onclick={() => addBlock(blockType.type)}>＋ {blockType.label}</button>
			{/each}
		</div>
	</div>

	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{form.error}</p>
	{/if}
	{#if form?.saved}
		<p class="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">Homepage saved.</p>
	{/if}
	{#if uploadError}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{uploadError}</p>
	{/if}

	<form method="POST" action="?/save" class="space-y-4">
		<input type="hidden" name="payload" value={payload} />
		<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" bind:this={uploadInput} onchange={uploadImage} />

		<div
			class="space-y-4"
			use:dragHandleZone={{ items: blocks, flipDurationMs, morphDisabled: true }}
			onconsider={handleBlockDnd}
			onfinalize={handleBlockDnd}
		>
			{#each blocks as block, index (block.id)}
				<section animate:flip={{ duration: flipDurationMs }} class="panel overflow-hidden">
					<div class="flex flex-wrap items-center justify-between gap-3 border-b border-pink-100 bg-pink-50 px-4 py-3">
						<div class="flex min-w-0 items-center gap-3">
							<button
								class="grid size-10 place-items-center rounded-lg bg-white text-lg font-black text-pink-800 hover:bg-pink-100"
								type="button"
								onclick={() => toggleCollapsed(block)}
								aria-expanded={!isCollapsed(block)}
								aria-controls="block-editor-{block.id}"
								title={isCollapsed(block) ? 'Expand block' : 'Collapse block'}
							>
								{isCollapsed(block) ? '+' : '-'}
							</button>
							<div
								class="grid size-10 cursor-grab place-items-center rounded-lg bg-white text-sm font-black text-pink-800 active:cursor-grabbing"
								role="button"
								tabindex="0"
								use:dragHandle
								aria-label="Drag block {index + 1}"
								title="Drag to reorder"
							>
								{index + 1}
							</div>
							<div>
								<p class="font-black text-gray-950">{blockTypes.find((item) => item.type === block.type)?.label ?? block.type}</p>
								<p class="max-w-xl truncate text-sm font-semibold text-gray-600">{blockSummary(block)}</p>
								<label class="mt-1 flex items-center gap-2 text-xs font-black text-gray-600">
									<input type="checkbox" bind:checked={block.isVisible} />
									Visible
								</label>
							</div>
						</div>
						<div class="flex flex-wrap gap-2">
							<button class="button button-secondary" type="button" onclick={() => moveBlockTo(index, 0)} disabled={index === 0}>Top</button>
							<button class="button button-secondary" type="button" onclick={() => moveBlock(index, -1)} disabled={index === 0}>Up</button>
							<button class="button button-secondary" type="button" onclick={() => moveBlock(index, 1)} disabled={index === blocks.length - 1}>Down</button>
							<button class="button button-secondary" type="button" onclick={() => moveBlockTo(index, blocks.length - 1)} disabled={index === blocks.length - 1}>Bottom</button>
							<button class="button button-secondary" type="button" onclick={() => duplicateBlock(index)}>Duplicate</button>
							<button class="button button-secondary" type="button" onclick={() => removeBlock(index)}>Remove</button>
						</div>
					</div>

					{#if !isCollapsed(block)}
						<div id="block-editor-{block.id}" class="grid gap-4 p-5" transition:slide={{ duration: 160 }}>
							{#if block.type === 'banner'}
								<div class="grid gap-4 md:grid-cols-2">
								<div class="field">
									<span class="label">Image URL</span>
									<div class="flex gap-2">
										<input class="input" bind:value={block.content.imageUrl} required />
										<button class="button button-secondary" type="button" onclick={() => browseImage(block, 'imageUrl', 'imageAltText')} disabled={uploading}>Upload</button>
									</div>
								</div>
								<div class="field">
									<span class="label">Image alt text</span>
									<input class="input" bind:value={block.content.imageAltText} required />
								</div>
								<div class="field">
									<span class="label">Heading</span>
									<input class="input" bind:value={block.content.heading} />
								</div>
								<div class="field">
									<span class="label">Subheading</span>
									<input class="input" bind:value={block.content.subheading} />
								</div>
								<div class="field md:col-span-2">
									<span class="label">Link URL</span>
									<input class="input" bind:value={block.content.linkUrl} placeholder="/books or https://..." />
								</div>
								</div>
							{:else if block.type === 'bookFeature'}
								<div class="grid gap-4 md:grid-cols-2">
								<div class="field">
									<span class="label">Book</span>
									<select class="select" bind:value={block.content.bookId} required>
										{#each data.books as book}
											<option value={book.id}>{book.title}</option>
										{/each}
									</select>
								</div>
								<div class="field">
									<span class="label">Section heading</span>
									<input class="input" bind:value={block.content.heading} placeholder="Latest Release" />
								</div>
								<div class="field md:col-span-2">
									<span class="label">Description override</span>
									<RichTextEditor id="description-{block.id}" bind:value={block.content.descriptionHtml} />
									<p class="text-xs font-semibold text-gray-500">Leave blank to use {selectedBook(block)?.title ?? 'the selected book'} description.</p>
								</div>
								<div class="field">
									<span class="label">Cover override URL</span>
									<div class="flex gap-2">
										<input class="input" bind:value={block.content.coverImageUrl} />
										<button class="button button-secondary" type="button" onclick={() => browseImage(block, 'coverImageUrl', 'coverImageAltText')} disabled={uploading}>Upload</button>
									</div>
								</div>
								<div class="field">
									<span class="label">Cover override alt text</span>
									<input class="input" bind:value={block.content.coverImageAltText} />
								</div>
								</div>
								<div class="space-y-3">
								<div class="flex items-center justify-between gap-3">
									<h3 class="text-sm font-black text-gray-950">Button overrides</h3>
									<button class="button button-secondary" type="button" onclick={() => addLink(block)}>＋ Add link</button>
								</div>
								{#each block.content.links as link, linkIndex (link.id)}
									<div class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_9rem_auto]">
										<input class="input" bind:value={link.label} placeholder="Button label" />
										<input class="input" bind:value={link.url} placeholder="/shop or https://..." />
										<select class="select" bind:value={link.style}>
											<option value="primary">Primary</option>
											<option value="secondary">Secondary</option>
										</select>
										<div class="flex flex-wrap gap-2 md:justify-end">
											<button class="button button-secondary" type="button" onclick={() => moveLink(block, linkIndex, -1)} disabled={linkIndex === 0}>Up</button>
											<button class="button button-secondary" type="button" onclick={() => moveLink(block, linkIndex, 1)} disabled={linkIndex === block.content.links.length - 1}>Down</button>
											<button class="button button-secondary" type="button" onclick={() => removeLink(block, linkIndex)}>Remove</button>
										</div>
									</div>
								{/each}
								</div>
							{:else if block.type === 'richText'}
								<div class="field">
								<span class="label">Heading</span>
								<input class="input" bind:value={block.content.heading} required />
								</div>
								<div class="field">
								<span class="label">Body</span>
								<RichTextEditor id="body-{block.id}" bind:value={block.content.bodyHtml} />
								</div>
							{:else if block.type === 'imageText'}
								<div class="grid gap-4 md:grid-cols-2">
								<div class="field">
									<span class="label">Heading</span>
									<input class="input" bind:value={block.content.heading} required />
								</div>
								<div class="field">
									<span class="label">Image position</span>
									<select class="select" bind:value={block.content.imagePosition}>
										<option value="left">Left</option>
										<option value="right">Right</option>
									</select>
								</div>
								<div class="field">
									<span class="label">Image URL</span>
									<div class="flex gap-2">
										<input class="input" bind:value={block.content.imageUrl} required />
										<button class="button button-secondary" type="button" onclick={() => browseImage(block, 'imageUrl', 'imageAltText')} disabled={uploading}>Upload</button>
									</div>
								</div>
								<div class="field">
									<span class="label">Image alt text</span>
									<input class="input" bind:value={block.content.imageAltText} required />
								</div>
								<div class="field md:col-span-2">
									<span class="label">Body</span>
									<RichTextEditor id="image-body-{block.id}" bind:value={block.content.bodyHtml} />
								</div>
								</div>
							{:else if block.type === 'linkButtons'}
								<div class="field">
								<span class="label">Heading</span>
								<input class="input" bind:value={block.content.heading} />
								</div>
								<div class="space-y-3">
								<div class="flex justify-end">
									<button class="button button-secondary" type="button" onclick={() => addLink(block)}>＋ Add link</button>
								</div>
								{#each block.content.links as link, linkIndex (link.id)}
									<div class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_9rem_auto]">
										<input class="input" bind:value={link.label} placeholder="Button label" />
										<input class="input" bind:value={link.url} placeholder="/shop or https://..." />
										<select class="select" bind:value={link.style}>
											<option value="primary">Primary</option>
											<option value="secondary">Secondary</option>
										</select>
										<div class="flex flex-wrap gap-2 md:justify-end">
											<button class="button button-secondary" type="button" onclick={() => moveLink(block, linkIndex, -1)} disabled={linkIndex === 0}>Up</button>
											<button class="button button-secondary" type="button" onclick={() => moveLink(block, linkIndex, 1)} disabled={linkIndex === block.content.links.length - 1}>Down</button>
											<button class="button button-secondary" type="button" onclick={() => removeLink(block, linkIndex)}>Remove</button>
										</div>
									</div>
								{/each}
								</div>
							{/if}
						</div>
					{/if}
				</section>
			{:else}
				<p class="panel p-5 text-sm font-semibold text-gray-600">No homepage blocks yet.</p>
			{/each}
		</div>

		<div class="flex justify-end">
			<button class="button button-primary" type="submit">Save homepage</button>
		</div>
	</form>

	<section class="panel p-5">
		<h2 class="mb-4 text-lg font-black text-gray-950">Activity</h2>
		<AdminActivityList activities={data.activities} />
	</section>
</section>
