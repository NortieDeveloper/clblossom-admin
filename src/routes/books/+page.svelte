<script>
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';

	let { data, form } = $props();
	const flipDurationMs = 150;
	let reorderMode = $state(false);
	let orderedBooks = $state([]);
	let bookIds = $derived(orderedBooks.map((book) => book.id).join(','));
	let hasOrderChanges = $derived(bookIds !== data.books.map((book) => book.id).join(','));

	$effect(() => {
		orderedBooks = structuredClone(data.books);
	});

	$effect(() => {
		if (form?.bookOrderSaved) reorderMode = false;
	});

	function enterReorderMode() {
		orderedBooks = structuredClone(data.books);
		reorderMode = true;
	}

	function cancelReorder() {
		orderedBooks = structuredClone(data.books);
		reorderMode = false;
	}

	function moveBook(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= orderedBooks.length) return;
		const book = orderedBooks[index];
		orderedBooks[index] = orderedBooks[nextIndex];
		orderedBooks[nextIndex] = book;
	}

	function moveBookTo(index, nextIndex) {
		if (index === nextIndex || index < 0 || index >= orderedBooks.length) return;
		const [book] = orderedBooks.splice(index, 1);
		orderedBooks.splice(nextIndex, 0, book);
	}

	function handleBookDnd(event) {
		orderedBooks = event.detail.items;
	}
</script>

<svelte:head>
	<title>Books | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-5">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">Books</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Public book entries, covers, descriptions, and links.</p>
		</div>
		<div class="flex flex-wrap gap-2">
			{#if reorderMode}
				<button class="button button-secondary" type="button" onclick={cancelReorder}>Cancel</button>
			{:else}
				<button class="button button-secondary" type="button" onclick={enterReorderMode} disabled={data.books.length < 2}>Reorder</button>
				<a class="button button-primary" href="/books/new">＋ New book</a>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{form.error}
		</p>
	{/if}
	{#if form?.bookOrderSaved}
		<p class="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm font-semibold text-green-800">
			Book order saved.
		</p>
	{/if}

	{#if reorderMode}
		<form class="panel p-4" method="POST" action="?/reorder">
			<div class="flex flex-wrap items-center justify-between gap-3">
				<div>
					<h2 class="text-lg font-black text-gray-950">Reorder Books</h2>
					<p class="text-sm font-semibold text-gray-500">Drag rows or use the controls to set public display order.</p>
				</div>
				<div class="flex flex-wrap gap-2">
					<button class="button button-secondary" type="button" onclick={cancelReorder}>Cancel</button>
					<button class="button button-primary" type="submit" disabled={!hasOrderChanges}>Save order</button>
				</div>
			</div>
			<input type="hidden" name="bookIds" value={bookIds} />
			{#if hasOrderChanges}
				<p class="mt-3 rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 text-sm font-semibold text-yellow-800">
					You have unsaved order changes.
				</p>
			{/if}
			<div
				class="mt-4 space-y-3"
				use:dragHandleZone={{ items: orderedBooks, flipDurationMs }}
				onconsider={handleBookDnd}
				onfinalize={handleBookDnd}
			>
				{#each orderedBooks as book, index (book.id)}
					<div
						animate:flip={{ duration: flipDurationMs }}
						class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[3rem_minmax(0,1fr)_auto] {book.isVisible ? 'bg-white' : 'bg-gray-50 opacity-75'}"
					>
						<div
							class="grid size-10 cursor-grab place-items-center rounded-lg bg-pink-50 text-sm font-black text-pink-800 active:cursor-grabbing"
							role="button"
							tabindex="0"
							use:dragHandle
							aria-label="Drag {book.title}"
							title="Drag to reorder"
						>
							{index + 1}
						</div>
						<div class="min-w-0">
							<div class="flex flex-wrap items-center gap-2">
								<p class="truncate font-black text-gray-950">{book.title}</p>
								<span class="rounded-full px-2 py-1 text-xs font-black {book.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}">
									{book.isVisible ? 'Visible' : 'Hidden'}
								</span>
							</div>
							<p class="text-sm font-semibold text-gray-500">/{book.slug}</p>
						</div>
						<div class="flex flex-wrap items-center gap-2 md:justify-end">
							<button class="button button-secondary" type="button" onclick={() => moveBookTo(index, 0)} disabled={index === 0}>Top</button>
							<button class="button button-secondary" type="button" onclick={() => moveBook(index, -1)} disabled={index === 0}>Up</button>
							<button class="button button-secondary" type="button" onclick={() => moveBook(index, 1)} disabled={index === orderedBooks.length - 1}>Down</button>
							<button class="button button-secondary" type="button" onclick={() => moveBookTo(index, orderedBooks.length - 1)} disabled={index === orderedBooks.length - 1}>Bottom</button>
						</div>
					</div>
				{/each}
			</div>
		</form>
	{:else}
		<div class="panel overflow-hidden">
			<table class="w-full min-w-[760px] text-left text-sm">
				<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
					<tr>
						<th class="px-4 py-3">Book</th>
						<th class="px-4 py-3">Links</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3"></th>
					</tr>
				</thead>
				<tbody class="divide-y divide-pink-100">
					{#each data.books as book}
						<tr>
							<td class="px-4 py-3">
								<p class="font-black text-gray-950">{book.title}</p>
								<p class="font-semibold text-gray-500">/{book.slug}</p>
							</td>
							<td class="px-4 py-3 font-semibold text-gray-700">{book.links.length}</td>
							<td class="px-4 py-3">
								<span class="rounded-full px-2 py-1 text-xs font-black {book.isVisible ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-700'}">
									{book.isVisible ? 'Visible' : 'Hidden'}
								</span>
							</td>
							<td class="px-4 py-3 text-right">
								<a class="button button-secondary" href="/books/{book.id}">Edit</a>
							</td>
						</tr>
					{:else}
						<tr>
							<td class="px-4 py-6 text-sm font-semibold text-gray-500" colspan="4">No books yet.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</section>
