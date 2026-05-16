<script>
	import AdminActivityList from '$lib/components/AdminActivityList.svelte';
	import BookForm from '$lib/components/BookForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.book.title} | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">{data.book.title}</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Edit public book details.</p>
			{#if form?.saved}
				<p class="mt-2 text-sm font-black text-green-700">Saved.</p>
			{/if}
		</div>
		<form method="POST" action="?/delete">
			<button class="button border border-red-200 bg-red-50 text-red-700" type="submit">Delete</button>
		</form>
	</div>
	<BookForm book={data.book} {form} mode="edit" action="?/save" />
	<section class="panel p-5">
		<h2 class="mb-4 text-lg font-black text-gray-950">Activity</h2>
		<AdminActivityList activities={data.activities} />
	</section>
</section>
