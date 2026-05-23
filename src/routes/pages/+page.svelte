<script>
	let { data, form } = $props();

	function pageKind(page) {
		if (page.isRequired) return 'Required';
		if (page.isProtected) return 'Built-in';
		return 'Custom';
	}
</script>

<svelte:head>
	<title>Pages | C.L. Blossom Admin</title>
</svelte:head>

<section class="space-y-6">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<h1 class="text-3xl font-black text-gray-950">Pages</h1>
			<p class="mt-1 text-sm font-semibold text-gray-600">Edit site pages with reusable content blocks.</p>
		</div>
	</div>

	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">{form.error}</p>
	{/if}

	<section class="panel overflow-hidden">
		<div class="border-b border-pink-100 px-5 py-4">
			<h2 class="text-lg font-black text-gray-950">Editable pages</h2>
		</div>
		<div class="divide-y divide-pink-100">
			{#each data.pages as page}
				<a href="/pages/{page.id}" class="grid gap-3 px-5 py-4 hover:bg-pink-50 md:grid-cols-[minmax(0,1fr)_8rem_7rem] md:items-center">
					<div class="min-w-0">
						<div class="flex flex-wrap items-center gap-2">
							<h3 class="font-black text-gray-950">{page.title}</h3>
							<span class="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-black text-pink-800">{pageKind(page)}</span>
							{#if !page.isPublished}
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-black text-gray-700">Hidden</span>
							{/if}
						</div>
						<p class="mt-1 truncate text-sm font-semibold text-gray-600">{page.path}</p>
					</div>
					<p class="text-sm font-bold text-gray-600">{page.updatedAt ? new Date(page.updatedAt).toLocaleDateString() : ''}</p>
					<span class="button button-secondary justify-center">Edit</span>
				</a>
			{:else}
				<p class="px-5 py-4 text-sm font-semibold text-gray-600">No pages found.</p>
			{/each}
		</div>
	</section>

	<section class="panel p-5">
		<h2 class="text-lg font-black text-gray-950">New custom page</h2>
		<form method="POST" action="?/create" class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<span class="label">Title</span>
				<input class="input" name="title" required />
			</div>
			<div class="field">
				<span class="label">Page address</span>
				<input class="input" name="slug" placeholder="bonus-content" required />
			</div>
			<div class="field md:col-span-2">
				<span class="label">Search description</span>
				<textarea class="textarea" name="metaDescription" rows="3"></textarea>
			</div>
			<div class="md:col-span-2">
				<button class="button button-primary" type="submit">Create page</button>
			</div>
		</form>
	</section>
</section>
