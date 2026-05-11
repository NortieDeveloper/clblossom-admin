<script>
	let { form } = $props();

	const stripeImportResult = $derived(form?.stripeImportResult ?? form?.stripeImportPreview);
	const hasPreview = $derived(Boolean(form?.stripeImportPreview));

	function actionLabel(action) {
		if (action === 'create') return 'Create';
		if (action === 'update') return 'Update';
		if (action === 'skip') return 'Skip';
		return action;
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
