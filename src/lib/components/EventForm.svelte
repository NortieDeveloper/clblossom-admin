<script>
	let { event = null, form = null, mode = 'create', action = undefined } = $props();
	let payload = $state('');
	let clientError = $state('');
	let dateOnly = $state(event?.dateOnly ?? false);

	function initialDateValue(value) {
		if (!value) return '';
		return event?.dateOnly ? value.slice(0, 10) : value.slice(0, 16);
	}

	let model = $state({
		title: event?.title ?? '',
		slug: event?.slug ?? '',
		type: event?.type ?? '',
		description: event?.description ?? '',
		startsAt: initialDateValue(event?.startsAt),
		endsAt: initialDateValue(event?.endsAt),
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
		status: event?.status ?? 'draft'
	});

	function datePart(value) {
		return value ? value.slice(0, 10) : '';
	}

	function midnightIso(value) {
		return value ? new Date(`${value}T00:00`).toISOString() : null;
	}

	function toOffset(value) {
		return value ? new Date(value).toISOString() : null;
	}

	function prepare(submitEvent) {
		clientError = '';
		const startsAt = dateOnly ? midnightIso(datePart(model.startsAt)) : toOffset(model.startsAt);
		const endsAt = dateOnly ? midnightIso(datePart(model.endsAt)) : toOffset(model.endsAt);
		if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) {
			submitEvent.preventDefault();
			clientError = 'Event end date cannot be before the start date.';
			return;
		}

		payload = JSON.stringify({
			...model,
			dateOnly,
			startsAt,
			endsAt
		});
	}
</script>

<form method="POST" {action} class="space-y-6" onsubmit={prepare}>
	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{form.error}
		</p>
	{/if}
	{#if clientError}
		<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
			{clientError}
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
			<label class="flex items-center gap-2 text-sm font-bold text-gray-700 md:col-span-2">
				<input class="rounded border-pink-200 text-pink-700" type="checkbox" bind:checked={dateOnly} />
				Date only
			</label>
			<div class="field">
				<span class="label">Starts</span>
				<input class="input" type={dateOnly ? 'date' : 'datetime-local'} bind:value={model.startsAt} required />
			</div>
			<div class="field">
				<span class="label">Ends</span>
				<input class="input" type={dateOnly ? 'date' : 'datetime-local'} min={model.startsAt || undefined} bind:value={model.endsAt} />
			</div>
			<div class="field">
				<span class="label">Timezone</span>
				<input class="input" bind:value={model.timeZone} />
			</div>
			<div class="field md:col-span-2">
				<span class="label">Description</span>
				<textarea class="textarea" bind:value={model.description}></textarea>
			</div>
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

	<div class="flex justify-end gap-3">
		<a class="button button-secondary" href="/events">Cancel</a>
		<button class="button button-primary" type="submit">{mode === 'create' ? 'Create event' : 'Save event'}</button>
	</div>
</form>
