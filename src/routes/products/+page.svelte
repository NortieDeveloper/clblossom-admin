<script>
	let { data, form } = $props();
	let reorderMode = $state(false);
	let orderedProducts = $state([]);
	let productIds = $derived(orderedProducts.map((product) => product.id).join(','));
	let hasOrderChanges = $derived(productIds !== data.products.map((product) => product.id).join(','));

	$effect(() => {
		orderedProducts = structuredClone(data.products);
	});

	$effect(() => {
		if (form?.productOrderSaved) {
			reorderMode = false;
		}
	});

	function enterReorderMode() {
		orderedProducts = structuredClone(data.products);
		reorderMode = true;
	}

	function cancelReorder() {
		orderedProducts = structuredClone(data.products);
		reorderMode = false;
	}

	function moveProduct(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= orderedProducts.length) return;
		const product = orderedProducts[index];
		orderedProducts[index] = orderedProducts[nextIndex];
		orderedProducts[nextIndex] = product;
	}

	function moveProductTo(index, nextIndex) {
		if (index === nextIndex || index < 0 || index >= orderedProducts.length) return;
		const [product] = orderedProducts.splice(index, 1);
		orderedProducts.splice(nextIndex, 0, product);
	}
</script>

<svelte:head>
	<title>Products | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">Products</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Storefront products, variants, images, and inventory.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if reorderMode}
				<button class="button button-secondary" type="button" onclick={cancelReorder}>Cancel</button>
			{:else}
				<button class="button button-secondary" type="button" onclick={enterReorderMode} disabled={data.products.length < 2}>Reorder</button>
				<a class="button button-primary" href="/products/new">＋ New product</a>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{form.error}
		</p>
	{/if}
	{#if form?.productOrderSaved}
		<p class="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
			Product order saved.
		</p>
	{/if}

	{#if reorderMode}
		<form class="panel p-4" method="POST" action="?/reorder">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-black text-gray-950">Reorder Products</h2>
					<p class="text-sm font-semibold text-gray-500">Use the controls to set storefront display order.</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button class="button button-secondary" type="button" onclick={cancelReorder}>Cancel</button>
					<button class="button button-primary" type="submit" disabled={!hasOrderChanges}>Save order</button>
				</div>
			</div>
			<input type="hidden" name="productIds" value={productIds} />
			{#if hasOrderChanges}
				<p class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800">
					You have unsaved order changes.
				</p>
			{/if}
			<div class="mt-4 space-y-3">
				{#each orderedProducts as product, index}
					<div
						class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[3rem_minmax(0,1fr)_auto] {product.isVisible
							? 'bg-white'
							: 'bg-gray-50 opacity-75'}"
					>
						<div class="grid size-10 place-items-center rounded-lg bg-pink-50 text-sm font-black text-pink-800">
							{index + 1}
						</div>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate font-black text-gray-950">{product.name}</p>
								<span
									class="rounded-full px-2 py-1 text-xs font-black {product.isVisible
										? 'bg-green-100 text-green-800'
										: 'bg-gray-100 text-gray-700'}"
								>
									{product.isVisible ? 'Visible' : 'Hidden'}
								</span>
							</div>
							<p class="text-sm font-semibold text-gray-500">/{product.slug}</p>
							<p class="text-xs font-bold text-gray-500">
								{product.category || 'None'} · {product.variants.length} {product.variants.length === 1 ? 'variant' : 'variants'}
							</p>
						</div>
						<div class="flex flex-wrap items-center gap-2 md:justify-end">
							<button class="button button-secondary" type="button" onclick={() => moveProductTo(index, 0)} disabled={index === 0}>
								Top
							</button>
							<button class="button button-secondary" type="button" onclick={() => moveProduct(index, -1)} disabled={index === 0}>
								Up
							</button>
							<button
								class="button button-secondary"
								type="button"
								onclick={() => moveProduct(index, 1)}
								disabled={index === orderedProducts.length - 1}
							>
								Down
							</button>
							<button
								class="button button-secondary"
								type="button"
								onclick={() => moveProductTo(index, orderedProducts.length - 1)}
								disabled={index === orderedProducts.length - 1}
							>
								Bottom
							</button>
						</div>
					</div>
				{:else}
					<p class="text-sm font-semibold text-gray-500">No products yet.</p>
				{/each}
			</div>
		</form>
	{:else}
	<div class="panel overflow-hidden">
		<table class="w-full min-w-[760px] text-left text-sm">
			<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
				<tr>
					<th class="px-4 py-3">Product</th>
					<th class="px-4 py-3">Category</th>
					<th class="px-4 py-3">Variants</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-pink-100">
				{#each data.products as product}
					<tr>
						<td class="px-4 py-3">
							<p class="font-black text-gray-950">{product.name}</p>
							<p class="font-semibold text-gray-500">/{product.slug}</p>
						</td>
						<td class="px-4 py-3 font-semibold text-gray-700">{product.category || 'None'}</td>
						<td class="px-4 py-3 font-semibold text-gray-700">{product.variants.length}</td>
						<td class="px-4 py-3">
							<span class="rounded-full px-2 py-1 text-xs font-black {product.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}">
								{product.isVisible ? 'Visible' : 'Hidden'}
							</span>
						</td>
						<td class="px-4 py-3 text-right">
							<a class="button button-secondary" href="/products/{product.id}">Edit</a>
						</td>
					</tr>
				{:else}
					<tr>
						<td class="px-4 py-6 text-sm font-semibold text-gray-500" colspan="5">No products yet.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	{/if}
</section>
