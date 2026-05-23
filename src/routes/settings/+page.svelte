<script>
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';

	let { data, form } = $props();

	const stripeImportResult = $derived(form?.stripeImportResult ?? form?.stripeImportPreview);
	const hasPreview = $derived(Boolean(form?.stripeImportPreview));
	const flipDurationMs = 150;
	const kinds = [
		{ value: 'page', label: 'Page' },
		{ value: 'internal', label: 'Site link' },
		{ value: 'external', label: 'External link' }
	];
	let navigationItems = $state((data.navigation ?? []).map(normalizeNavItem));
	let navigationPayload = $derived(JSON.stringify({ items: serializeNavigationItems() }));

	function actionLabel(action) {
		if (action === 'create') return 'Create';
		if (action === 'update') return 'Update';
		if (action === 'skip') return 'Skip';
		return action;
	}

	function makeId() {
		return `nav-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	function normalizeNavItem(item) {
		return {
			id: item.id ?? makeId(),
			label: item.label ?? '',
			url: item.url ?? '',
			kind: item.kind ?? 'internal',
			pageId: item.pageId ?? data.pages[0]?.id ?? '',
			isVisible: item.isVisible ?? true,
			openInNewTab: item.openInNewTab ?? false,
			sortOrder: item.sortOrder ?? 0
		};
	}

	function addItem(kind = 'internal') {
		navigationItems.push(
			normalizeNavItem({
				id: makeId(),
				label: kind === 'page' ? data.pages[0]?.title ?? 'Page' : '',
				url: kind === 'internal' ? '/' : '',
				kind,
				pageId: kind === 'page' ? data.pages[0]?.id ?? '' : '',
				isVisible: true,
				openInNewTab: kind === 'external',
				sortOrder: navigationItems.length
			})
		);
	}

	function removeItem(index) {
		navigationItems.splice(index, 1);
		normalizeOrder();
	}

	function moveItem(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= navigationItems.length) return;
		const item = navigationItems[index];
		navigationItems[index] = navigationItems[nextIndex];
		navigationItems[nextIndex] = item;
		normalizeOrder();
	}

	function handleDnd(event) {
		navigationItems = event.detail.items;
		normalizeOrder();
	}

	function normalizeOrder() {
		navigationItems.forEach((item, index) => {
			item.sortOrder = index;
		});
	}

	function pagePath(pageId) {
		return data.pages.find((page) => page.id === pageId)?.path ?? '';
	}

	function serializeNavigationItems() {
		return navigationItems.map((item, index) => ({
			id: item.id?.startsWith?.('nav-') ? null : item.id,
			label: item.label,
			url: item.kind === 'page' ? pagePath(item.pageId) : item.url,
			kind: item.kind,
			pageId: item.kind === 'page' ? item.pageId : null,
			isVisible: item.isVisible,
			openInNewTab: item.kind === 'external' ? item.openInNewTab : false,
			sortOrder: index
		}));
	}
</script>

<svelte:head>
	<title>Settings | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-6">
	<div>
		<h1 class="text-3xl font-black text-gray-950">Settings</h1>
		<p class="mt-1 text-sm font-semibold text-gray-600">Admin tools for storefront operations.</p>
	</div>

	<section class="panel p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-lg font-black text-gray-950">Header Navigation</h2>
				<p class="mt-1 max-w-3xl text-sm font-semibold text-gray-600">
					Choose the links shown in the public desktop and mobile header menus.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<button class="button button-secondary" type="button" onclick={() => addItem('page')}>＋ Page</button>
				<button class="button button-secondary" type="button" onclick={() => addItem('internal')}>＋ Site link</button>
				<button class="button button-secondary" type="button" onclick={() => addItem('external')}>＋ External link</button>
			</div>
		</div>

		{#if form?.navigationSaved}
			<p class="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-bold text-green-800">Navigation saved.</p>
		{/if}
		{#if form?.error}
			<p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{form.error}</p>
		{/if}

		<form method="POST" action="?/saveNavigation" class="mt-5 space-y-4">
			<input type="hidden" name="navigationPayload" value={navigationPayload} />
			<div
				class="space-y-3"
				use:dragHandleZone={{ items: navigationItems, flipDurationMs, morphDisabled: true }}
				onconsider={handleDnd}
				onfinalize={handleDnd}
			>
				{#each navigationItems as item, index (item.id)}
					<div animate:flip={{ duration: flipDurationMs }} class="rounded-xl border border-pink-100 bg-white p-4">
						<div class="grid gap-3 lg:grid-cols-[3rem_minmax(0,1fr)_10rem_minmax(0,1.2fr)_auto] lg:items-start">
							<div
								class="grid size-10 cursor-grab place-items-center rounded-lg bg-pink-50 text-sm font-black text-pink-800 active:cursor-grabbing"
								role="button"
								tabindex="0"
								use:dragHandle
								aria-label="Drag navigation item {index + 1}"
								title="Drag to reorder"
							>
								{index + 1}
							</div>
							<div class="field">
								<span class="label">Label</span>
								<input class="input" bind:value={item.label} required />
							</div>
							<div class="field">
								<span class="label">Type</span>
								<select class="select" bind:value={item.kind}>
									{#each kinds as kind}
										<option value={kind.value}>{kind.label}</option>
									{/each}
								</select>
							</div>
							{#if item.kind === 'page'}
								<div class="field">
									<span class="label">Page</span>
									<select class="select" bind:value={item.pageId}>
										{#each data.pages as page}
											<option value={page.id}>{page.title} ({page.path})</option>
										{/each}
									</select>
								</div>
							{:else}
								<div class="field">
									<span class="label">URL</span>
									<input class="input" bind:value={item.url} placeholder={item.kind === 'internal' ? '/books' : 'https://example.com'} required />
								</div>
							{/if}
							<div class="flex flex-wrap gap-2 lg:justify-end">
								<button class="button button-secondary" type="button" onclick={() => moveItem(index, -1)} disabled={index === 0}>Up</button>
								<button class="button button-secondary" type="button" onclick={() => moveItem(index, 1)} disabled={index === navigationItems.length - 1}>Down</button>
								<button class="button button-secondary" type="button" onclick={() => removeItem(index)}>Remove</button>
							</div>
						</div>
						<div class="mt-3 flex flex-wrap gap-4">
							<label class="flex items-center gap-2 text-sm font-black text-gray-700">
								<input type="checkbox" bind:checked={item.isVisible} />
								Visible
							</label>
							{#if item.kind === 'external'}
								<label class="flex items-center gap-2 text-sm font-black text-gray-700">
									<input type="checkbox" bind:checked={item.openInNewTab} />
									Open in new tab
								</label>
							{/if}
						</div>
					</div>
				{:else}
					<p class="rounded-lg border border-pink-100 p-4 text-sm font-semibold text-gray-600">No navigation items yet.</p>
				{/each}
			</div>
			<div class="flex justify-end">
				<button class="button button-primary" type="submit">Save navigation</button>
			</div>
		</form>
	</section>

	<section class="panel p-5">
		<div class="flex flex-wrap items-start justify-between gap-4">
			<div>
				<h2 class="text-lg font-black text-gray-950">Stripe Product Import</h2>
				<p class="mt-1 max-w-3xl text-sm font-semibold text-gray-600">
					Imports active Stripe products marked with storefront metadata, using each product's default price.
					Run a preview first to see which products will be created, updated, or skipped.
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<form method="POST" action="?/previewStripeImport">
					<button class="button button-secondary" type="submit">Preview import</button>
				</form>
				<form method="POST" action="?/runStripeImport">
					<button
						class="button button-primary disabled:cursor-not-allowed disabled:bg-gray-300"
						type="submit"
						disabled={!hasPreview}
					>
						Import products
					</button>
				</form>
			</div>
		</div>

		{#if form?.error}
			<p class="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{form.error}</p>
		{/if}

		{#if stripeImportResult}
			<div class="mt-5 grid gap-3 sm:grid-cols-4">
				<div class="rounded-lg border border-pink-100 p-3">
					<p class="text-xs font-black uppercase text-pink-800">Mode</p>
					<p class="mt-1 text-xl font-black text-gray-950">{stripeImportResult.dryRun ? 'Preview' : 'Imported'}</p>
				</div>
				<div class="rounded-lg border border-pink-100 p-3">
					<p class="text-xs font-black uppercase text-pink-800">Create</p>
					<p class="mt-1 text-xl font-black text-gray-950">{stripeImportResult.created}</p>
				</div>
				<div class="rounded-lg border border-pink-100 p-3">
					<p class="text-xs font-black uppercase text-pink-800">Update</p>
					<p class="mt-1 text-xl font-black text-gray-950">{stripeImportResult.updated}</p>
				</div>
				<div class="rounded-lg border border-pink-100 p-3">
					<p class="text-xs font-black uppercase text-pink-800">Skip</p>
					<p class="mt-1 text-xl font-black text-gray-950">{stripeImportResult.skipped}</p>
				</div>
			</div>

			<div class="mt-5 overflow-x-auto rounded-lg border border-pink-100">
				<table class="w-full min-w-[760px] text-left text-sm">
					<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
						<tr>
							<th class="px-4 py-3">Product</th>
							<th class="px-4 py-3">Stripe ID</th>
							<th class="px-4 py-3">Action</th>
							<th class="px-4 py-3">Message</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-pink-100">
						{#each stripeImportResult.items as item}
							<tr>
								<td class="px-4 py-3 font-black text-gray-950">{item.name}</td>
								<td class="px-4 py-3 font-semibold text-gray-600">{item.stripeProductId}</td>
								<td class="px-4 py-3">
									<span
										class="rounded-full px-2 py-1 text-xs font-black {item.action === 'skip'
											? 'bg-gray-100 text-gray-700'
											: item.action === 'create'
												? 'bg-green-100 text-green-800'
												: 'bg-blue-100 text-blue-800'}"
									>
										{actionLabel(item.action)}
									</span>
								</td>
								<td class="px-4 py-3 font-semibold text-gray-600">{item.message || ''}</td>
							</tr>
						{:else}
							<tr>
								<td class="px-4 py-6 text-sm font-semibold text-gray-500" colspan="4">
									No Stripe products matched the storefront import rules.
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</section>
</section>
