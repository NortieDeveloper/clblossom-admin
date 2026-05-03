<script>
	import EventForm from '$lib/components/EventForm.svelte';
	let { form } = $props();
</script>

<svelte:head>
	<title>New Event | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div>
		<h1 class="text-3xl font-black text-gray-950">New event</h1>
		<p class="mt-1 text-sm font-semibold text-gray-600">Create an event for the public events page.</p>
	</div>
	<EventForm {form} mode="create" />
</section>
