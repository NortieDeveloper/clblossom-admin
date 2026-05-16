<script>
	import BookForm from '$lib/components/BookForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>New Book | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div>
		<h1 class="text-3xl font-black text-gray-950">New book</h1>
		<p class="mt-1 text-sm font-semibold text-gray-600">Create a public book entry.</p>
	</div>
	<BookForm {form} mode="create" />
</section>
