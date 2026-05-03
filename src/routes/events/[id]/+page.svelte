<script>
	import EventForm from '$lib/components/EventForm.svelte';
	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.event.title} | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-start justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">{data.event.title}</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Edit public event details and attendance links.</p>
			{#if form?.saved}
				<p class="mt-2 text-sm font-black text-green-700">Saved.</p>
			{/if}
		</div>
		<form method="POST" action="?/delete">
			<button class="button border border-red-200 bg-red-50 text-red-700" type="submit">Delete</button>
		</form>
	</div>
	<EventForm event={data.event} {form} mode="edit" action="?/save" />
</section>
