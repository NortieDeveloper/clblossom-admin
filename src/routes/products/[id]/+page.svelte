<script>
	import AdminActivityList from '$lib/components/AdminActivityList.svelte';
	import ProductForm from '$lib/components/ProductForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.product.name} | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">{data.product.name}</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Edit product details, Stripe-backed prices, and inventory.</p>
			{#if form?.saved}
				<p class="mt-2 text-sm font-black text-green-700">Saved.</p>
			{/if}
		</div>
		<form method="POST" action="?/delete">
			<button class="button border border-red-200 bg-red-50 text-red-700" type="submit">Delete</button>
		</form>
	</div>
	<ProductForm product={data.product} {form} mode="edit" action="?/save" categories={data.categories} componentOptions={data.componentOptions} />
	<section class="panel p-5">
		<h2 class="mb-4 text-lg font-black text-gray-950">Activity</h2>
		<AdminActivityList activities={data.activities} />
	</section>
</section>
