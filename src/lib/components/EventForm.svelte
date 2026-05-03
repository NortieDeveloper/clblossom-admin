<script>
	let { event = null, form = null, mode = 'create', action = undefined } = $props();
	let payload = $state('');
	let model = $state({
		title: event?.title ?? '',
		slug: event?.slug ?? '',
		type: event?.type ?? '',
		description: event?.description ?? '',
		startsAt: event?.startsAt ? event.startsAt.slice(0, 16) : '',
		endsAt: event?.endsAt ? event.endsAt.slice(0, 16) : '',
		timeZone: event?.timeZone ?? 'America/Detroit',
		locationName: event?.locationName ?? '',
		addressLine1: event?.addressLine1 ?? '',
		addressLine2: event?.addressLine2 ?? '',
		city: event?.city ?? '',
		region: event?.region ?? '',
		postalCode: event?.postalCode ?? '',
		country: event?.country ?? 'US',
		virtualUrl: event?.virtualUrl ?? '',
		websiteUrl: event?.websiteUrl ?? '',
		bannerImageUrl: event?.bannerImageUrl ?? '',
		bannerImageAltText: event?.bannerImageAltText ?? '',
		rsvpRequired: event?.rsvpRequired ?? false,
		rsvpUrl: event?.rsvpUrl ?? '',
		ticketsRequired: event?.ticketsRequired ?? false,
		ticketUrl: event?.ticketUrl ?? '',
		isVisible: event?.isVisible ?? false,
		status: event?.status ?? 'draft',
		sortOrder: event?.sortOrder ?? 0
	});

	function toOffset(value) {
		return value ? new Date(value).toISOString() : null;
	}

	function prepare() {
		payload = JSON.stringify({
			...model,
			startsAt: toOffset(model.startsAt),
			endsAt: toOffset(model.endsAt)
		});
	}
</script>

<form method="POST" {action} class="space-y-6" onsubmit={prepare}>
	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{form.error}
		</p>
	{/if}
	<input type="hidden" name="payload" bind:value={payload} />

	<section class="panel p-5">
		<h2 class="text-lg font-black text-gray-950">Event details</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<span class="label">Title</span>
				<input class="input" bind:value={model.title} required />
			</div>
			<div class="field">
				<span class="label">Slug</span>
				<input class="input" bind:value={model.slug} placeholder="auto-generated when blank" />
			</div>
			<div class="field">
				<span class="label">Type</span>
				<input class="input" bind:value={model.type} placeholder="Signing, fair, virtual" />
			</div>
			<div class="field">
				<span class="label">Status</span>
				<select class="select" bind:value={model.status}>
					<option value="draft">Draft</option>
					<option value="published">Published</option>
					<option value="cancelled">Cancelled</option>
				</select>
			</div>
			<div class="field">
				<span class="label">Starts</span>
				<input class="input" type="datetime-local" bind:value={model.startsAt} required />
			</div>
			<div class="field">
				<span class="label">Ends</span>
				<input class="input" type="datetime-local" bind:value={model.endsAt} />
			</div>
			<div class="field">
				<span class="label">Timezone</span>
				<input class="input" bind:value={model.timeZone} />
			</div>
			<div class="field">
				<span class="label">Sort order</span>
				<input class="input" type="number" bind:value={model.sortOrder} />
			</div>
			<div class="field md:col-span-2">
				<span class="label">Description</span>
				<textarea class="textarea" bind:value={model.description}></textarea>
			</div>
			<label class="flex items-center gap-3 text-sm font-bold text-gray-800">
				<input type="checkbox" bind:checked={model.isVisible} />
				Visible on public events page
			</label>
		</div>
	</section>

	<section class="panel p-5">
		<h2 class="text-lg font-black text-gray-950">Location and links</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<span class="label">Location name</span>
				<input class="input" bind:value={model.locationName} />
			</div>
			<div class="field">
				<span class="label">Website URL</span>
				<input class="input" type="url" bind:value={model.websiteUrl} />
			</div>
			<div class="field">
				<span class="label">Address line 1</span>
				<input class="input" bind:value={model.addressLine1} />
			</div>
			<div class="field">
				<span class="label">Address line 2</span>
				<input class="input" bind:value={model.addressLine2} />
			</div>
			<div class="field">
				<span class="label">City</span>
				<input class="input" bind:value={model.city} />
			</div>
			<div class="field">
				<span class="label">Region</span>
				<input class="input" bind:value={model.region} />
			</div>
			<div class="field">
				<span class="label">Postal code</span>
				<input class="input" bind:value={model.postalCode} />
			</div>
			<div class="field">
				<span class="label">Country</span>
				<input class="input" bind:value={model.country} />
			</div>
			<div class="field md:col-span-2">
				<span class="label">Virtual URL</span>
				<input class="input" type="url" bind:value={model.virtualUrl} />
			</div>
		</div>
	</section>

	<section class="panel p-5">
		<h2 class="text-lg font-black text-gray-950">Media and attendance</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<span class="label">Banner image URL</span>
				<input class="input" type="url" bind:value={model.bannerImageUrl} />
			</div>
			<div class="field">
				<span class="label">Banner alt text</span>
				<input class="input" bind:value={model.bannerImageAltText} />
			</div>
			<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={model.rsvpRequired} /> RSVP required</label>
			<div class="field">
				<span class="label">RSVP URL</span>
				<input class="input" type="url" bind:value={model.rsvpUrl} />
			</div>
			<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={model.ticketsRequired} /> Tickets required</label>
			<div class="field">
				<span class="label">Ticket URL</span>
				<input class="input" type="url" bind:value={model.ticketUrl} />
			</div>
		</div>
	</section>

	<div class="flex justify-end gap-3">
		<a class="button button-secondary" href="/events">Cancel</a>
		<button class="button button-primary" type="submit">{mode === 'create' ? 'Create event' : 'Save event'}</button>
	</div>
</form>
