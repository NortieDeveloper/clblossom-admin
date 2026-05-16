<script>
	import AdminActivityList from '$lib/components/AdminActivityList.svelte';

	let { data } = $props();
	const visibleProducts = $derived(data.products.filter((item) => item.isVisible).length);
	const publishedEvents = $derived(data.events.filter((item) => item.status === 'published').length);

	function activityHref(activity) {
		if (activity.entityId === '00000000-0000-0000-0000-000000000000') return null;
		return activity.action === 'deleted' ? null : `/${activity.entityType}s/${activity.entityId}`;
	}
</script>

<svelte:head>
	<title>Admin Dashboard | C.L. Blossom</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">Dashboard</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Manage storefront products and author events.</p>
		</div>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		<div class="panel p-5">
			<p class="text-sm font-bold text-pink-800">Products</p>
			<p class="mt-2 text-4xl font-black text-gray-950">{data.products.length}</p>
			<p class="text-sm font-semibold text-gray-500">{visibleProducts} visible</p>
		</div>
		<div class="panel p-5">
			<p class="text-sm font-bold text-pink-800">Events</p>
			<p class="mt-2 text-4xl font-black text-gray-950">{data.events.length}</p>
			<p class="text-sm font-semibold text-gray-500">{publishedEvents} published</p>
		</div>
		<div class="panel p-5">
			<p class="text-sm font-bold text-pink-800">Inventory Watch</p>
			<p class="mt-2 text-4xl font-black text-gray-950">
				{data.products
					.flatMap((item) => item.variants)
					.filter((item) => !item.preorder && !item.allowBackorder && (item.outOfStock || (item.trackInventory && item.stockQuantity <= 0))).length}
			</p>
			<p class="text-sm font-semibold text-gray-500">blocked variants</p>
		</div>
	</div>

	<div class="grid gap-4 xl:grid-cols-2">
		<section class="panel p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-black text-gray-950">Recent Products</h2>
				<a class="button button-secondary" href="/products">Open</a>
			</div>
			<div class="space-y-3">
				{#each data.products.slice(0, 5) as product}
					<a class="block rounded-lg border border-pink-100 p-3 hover:bg-pink-50" href="/products/{product.id}">
						<span class="block font-black text-gray-950">{product.name}</span>
						<span class="text-sm font-semibold text-gray-500">{product.category || 'Uncategorized'}</span>
					</a>
				{:else}
					<p class="text-sm font-semibold text-gray-500">No products yet.</p>
				{/each}
			</div>
		</section>

		<section class="panel p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="text-lg font-black text-gray-950">Upcoming Events</h2>
				<a class="button button-secondary" href="/events">Open</a>
			</div>
			<div class="space-y-3">
				{#each data.events.slice(0, 5) as event}
					<a class="block rounded-lg border border-pink-100 p-3 hover:bg-pink-50" href="/events/{event.id}">
						<span class="block font-black text-gray-950">{event.title}</span>
						<span class="text-sm font-semibold text-gray-500">{new Date(event.startsAt).toLocaleString()}</span>
					</a>
				{:else}
					<p class="text-sm font-semibold text-gray-500">No events yet.</p>
				{/each}
			</div>
		</section>
	</div>

	<section class="panel p-5">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-lg font-black text-gray-950">Activity</h2>
		</div>
		<AdminActivityList activities={data.activities} getHref={activityHref} />
	</section>
</section>
