<script>
	import ProductForm from '$lib/components/ProductForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>New Product | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div>
		<h1 class="text-3xl font-black text-gray-950">New product</h1>
		<p class="mt-1 text-sm font-semibold text-gray-600">Creates the Stripe product and variant prices on save.</p>
	</div>
	<ProductForm {form} mode="create" categories={data.categories} />
</section>
