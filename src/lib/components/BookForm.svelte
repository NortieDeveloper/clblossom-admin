<script>
	import { onDestroy } from 'svelte';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { book = null, form = null, mode = 'create', action = undefined } = $props();
	let payload = $state('');
	let uploadInput = $state();
	let uploading = $state(false);
	let uploadError = $state('');
	let previewUrl = $state('');

	let model = $state({
		title: book?.title ?? '',
		slug: book?.slug ?? '',
		coverImageUrl: book?.coverImageUrl ?? '',
		coverImageAltText: book?.coverImageAltText ?? '',
		descriptionHtml: book?.descriptionHtml ?? '',
		isVisible: book?.isVisible ?? true,
		sortOrder: book?.sortOrder ?? 0
	});

	let links = $state(
		book?.links?.length
			? structuredClone(book.links)
			: [{ label: '', url: '', style: 'primary', sortOrder: 0 }]
	);

	function addLink() {
		links.push({ label: '', url: '', style: 'secondary', sortOrder: links.length });
	}

	function removeLink(index) {
		links.splice(index, 1);
		normalizeLinks();
	}

	function moveLink(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= links.length) return;
		const link = links[index];
		links[index] = links[nextIndex];
		links[nextIndex] = link;
		normalizeLinks();
	}

	function moveLinkTo(index, nextIndex) {
		if (index === nextIndex || index < 0 || index >= links.length) return;
		const [link] = links.splice(index, 1);
		links.splice(nextIndex, 0, link);
		normalizeLinks();
	}

	function normalizeLinks() {
		links.forEach((link, index) => {
			link.sortOrder = index;
		});
	}

	function browseCover() {
		uploadInput?.click();
	}

	async function uploadCover(event) {
		uploadError = '';
		const file = event.currentTarget.files?.[0];
		event.currentTarget.value = '';
		if (!file) return;

		if (previewUrl) URL.revokeObjectURL(previewUrl);
		previewUrl = URL.createObjectURL(file);
		uploading = true;
		try {
			const formData = new FormData();
			formData.set('file', file);
			const response = await fetch('/books/images/upload', {
				method: 'POST',
				body: formData
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				uploadError = result.error || result.message || 'Unable to upload cover.';
				return;
			}

			model.coverImageUrl = result.url;
			if (!model.coverImageAltText) {
				model.coverImageAltText = `${model.title || 'Book'} cover by C.L. Blossom`;
			}
		} catch {
			uploadError = 'Unable to upload cover.';
		} finally {
			uploading = false;
		}
	}

	function prepare() {
		normalizeLinks();
		payload = JSON.stringify({
			...model,
			links: links
				.filter((link) => link.label.trim() || link.url.trim())
				.map((link, index) => ({ ...link, sortOrder: index }))
		});
	}

	onDestroy(() => {
		if (previewUrl) URL.revokeObjectURL(previewUrl);
	});
</script>

<form method="POST" {action} class="space-y-6" onsubmit={prepare}>
	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{form.error}
		</p>
	{/if}
	<input type="hidden" name="payload" bind:value={payload} />

	<section class="panel p-5">
		<h2 class="text-lg font-black text-gray-950">Book details</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<span class="label">Title</span>
				<input class="input" bind:value={model.title} required />
			</div>
			<div class="field">
				<span class="label">Slug</span>
				<input class="input" bind:value={model.slug} placeholder="auto-generated when blank" />
			</div>
			<div class="field">
				<span class="label">Display order</span>
				<input class="input" type="number" bind:value={model.sortOrder} />
			</div>
			<label class="flex items-center gap-3 text-sm font-bold text-gray-800">
				<input type="checkbox" bind:checked={model.isVisible} />
				Visible on public books page
			</label>
			<div class="field md:col-span-2">
				<span class="label">Description</span>
				<RichTextEditor id="descriptionHtml" bind:value={model.descriptionHtml} />
			</div>
		</div>
	</section>

	<section class="panel p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-lg font-black text-gray-950">Cover</h2>
				<p class="text-sm font-semibold text-gray-500">Upload to R2 or enter a hosted image URL.</p>
			</div>
			<button class="button button-secondary" type="button" onclick={browseCover} disabled={uploading}>
				{uploading ? 'Uploading...' : 'Upload cover'}
			</button>
		</div>
		<input class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif" bind:this={uploadInput} onchange={uploadCover} />
		{#if uploadError}
			<p class="mt-3 text-sm font-semibold text-red-700">{uploadError}</p>
		{/if}
		<div class="mt-4 grid gap-4 md:grid-cols-[12rem_minmax(0,1fr)]">
			<div class="overflow-hidden rounded-lg border border-pink-100 bg-pink-50">
				{#if previewUrl || model.coverImageUrl}
					<img class="aspect-[2/3] w-full object-cover" src={previewUrl || model.coverImageUrl} alt={model.coverImageAltText || ''} />
				{:else}
					<div class="grid aspect-[2/3] place-items-center px-4 text-center text-sm font-semibold text-gray-500">Cover preview</div>
				{/if}
			</div>
			<div class="grid gap-4">
				<div class="field">
					<span class="label">Cover image URL</span>
					<input class="input" bind:value={model.coverImageUrl} />
				</div>
				<div class="field">
					<span class="label">Cover alt text</span>
					<input class="input" bind:value={model.coverImageAltText} />
				</div>
			</div>
		</div>
	</section>

	<section class="panel p-5">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<h2 class="text-lg font-black text-gray-950">Links</h2>
			<button class="button button-secondary" type="button" onclick={addLink}>＋ Add link</button>
		</div>
		<div class="mt-4 space-y-3">
			{#each links as link, index}
				<div class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)_9rem_auto]">
					<input class="input" bind:value={link.label} placeholder="Button label" />
					<input class="input" bind:value={link.url} placeholder="/shop or https://..." />
					<select class="select" bind:value={link.style}>
						<option value="primary">Primary</option>
						<option value="secondary">Secondary</option>
					</select>
					<div class="flex flex-wrap gap-2 md:justify-end">
						<button class="button button-secondary" type="button" onclick={() => moveLinkTo(index, 0)} disabled={index === 0}>Top</button>
						<button class="button button-secondary" type="button" onclick={() => moveLink(index, -1)} disabled={index === 0}>Up</button>
						<button class="button button-secondary" type="button" onclick={() => moveLink(index, 1)} disabled={index === links.length - 1}>Down</button>
						<button class="button button-secondary" type="button" onclick={() => moveLinkTo(index, links.length - 1)} disabled={index === links.length - 1}>Bottom</button>
						<button class="button button-secondary" type="button" onclick={() => removeLink(index)}>Remove</button>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<div class="flex justify-end gap-3">
		<a class="button button-secondary" href="/books">Cancel</a>
		<button class="button button-primary" type="submit">{mode === 'create' ? 'Create book' : 'Save book'}</button>
	</div>
</form>
