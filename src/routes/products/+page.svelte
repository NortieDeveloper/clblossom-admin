<script>
	let { data } = $props();
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
		<a class="button button-primary" href="/products/new">＋ New product</a>
	</div>

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
</section>
