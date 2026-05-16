<script>
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { product = null, form = null, mode = 'create', action = undefined, categories = [] } = $props();
	const SHORT_DESCRIPTION_LIMIT = 500;

	let base = $state({
		slug: product?.slug ?? '',
		name: product?.name ?? '',
		category: product?.category ?? '',
		shortDescription: (product?.shortDescription ?? '').slice(0, SHORT_DESCRIPTION_LIMIT),
		descriptionHtml: product?.descriptionHtml ?? '',
		isVisible: product?.isVisible ?? false,
		sortOrder: product?.sortOrder ?? 0
	});

	let variants = $state(
		(product?.variants?.length
			? structuredClone(product.variants)
			: [
					{
						name: 'Default',
						sku: '',
						unitAmount: 2000,
						currency: 'usd',
						isDefault: true,
						isActive: true,
						weight: 1,
						length: 10,
						width: 7,
						height: 1,
						preorder: false,
						allowBackorder: false,
						expectedAvailabilityDate: '',
						trackInventory: false,
						stockQuantity: 0,
						outOfStock: false,
						sortOrder: 0
					}
				]
		).map(withDisplayPrice)
	);

	let images = $state(product?.images?.length ? structuredClone(product.images) : []);
	let payload = $state('');
	let categoryWarning = $state(false);
	let uploadInput = $state();
	let uploadError = $state('');
	let uploading = $state(false);
	let categoryOptions = $derived(categories ?? []);
	let shortDescriptionRemaining = $derived(SHORT_DESCRIPTION_LIMIT - base.shortDescription.length);

	$effect(() => {
		if (base.category && categoryOptions.length > 0 && !categoryOptions.some((category) => category.id === base.category)) {
			categoryWarning = true;
			base.category = '';
		}
	});

	function addVariant() {
		variants.push({
			name: '',
			sku: '',
			unitAmount: 0,
			priceDisplay: '',
			currency: 'usd',
			isDefault: variants.length === 0,
			isActive: true,
			weight: 1,
			length: 10,
			width: 7,
			height: 1,
			preorder: false,
			allowBackorder: false,
			expectedAvailabilityDate: '',
			trackInventory: false,
			stockQuantity: 0,
			outOfStock: false,
			sortOrder: variants.length
		});
	}

	function addImage() {
		images.push({ url: '', altText: '', sortOrder: images.length, isPrimary: images.length === 0 });
	}

	function selectPrimaryImage(index) {
		images.forEach((image, imageIndex) => {
			image.isPrimary = imageIndex === index;
		});
	}

	async function uploadImage() {
		uploadError = '';
		const file = uploadInput?.files?.[0];
		if (!file) {
			uploadError = 'Choose an image to upload.';
			return;
		}

		uploading = true;
		try {
			const form = new FormData();
			form.set('file', file);
			const response = await fetch('/products/images/upload', {
				method: 'POST',
				body: form
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				uploadError = result.error || result.message || 'Unable to upload image.';
				return;
			}

			images.push({
				url: result.url,
				altText: '',
				sortOrder: images.length,
				isPrimary: images.length === 0
			});
			uploadInput.value = '';
		} catch {
			uploadError = 'Unable to upload image.';
		} finally {
			uploading = false;
		}
	}

	function withDisplayPrice(variant) {
		const { preorder, ...rest } = variant;
		return {
			...rest,
			preorder: preorder ?? false,
			allowBackorder: variant.allowBackorder ?? preorder ?? false,
			priceDisplay:
				variant.priceDisplay ??
				(Number.isFinite(Number(variant.unitAmount)) && Number(variant.unitAmount) > 0
					? (Number(variant.unitAmount) / 100).toFixed(2)
					: '')
		};
	}

	function parsePriceToCents(value) {
		const normalized = String(value ?? '').replace(/[$,\s]/g, '');
		const amount = Number(normalized);
		return Number.isFinite(amount) ? Math.round(amount * 100) : 0;
	}

	function prepare() {
		const firstPrimaryIndex = images.findIndex((image) => image.isPrimary);
		if (firstPrimaryIndex >= 0) {
			selectPrimaryImage(firstPrimaryIndex);
		}
		const variantPayload = variants.map(({ priceDisplay, ...variant }) => ({
			...variant,
			unitAmount: parsePriceToCents(priceDisplay)
		}));
		payload = JSON.stringify({
			...base,
			shortDescription: base.shortDescription.slice(0, SHORT_DESCRIPTION_LIMIT),
			variants: variantPayload,
			images
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
		<h2 class="text-lg font-black text-gray-950">Storefront</h2>
		<div class="mt-4 grid gap-4 md:grid-cols-2">
			<div class="field">
				<label for="name">Name</label>
				<input class="input" id="name" bind:value={base.name} required />
			</div>
			<div class="field">
				<label for="slug">Slug</label>
				<input class="input" id="slug" bind:value={base.slug} placeholder="auto-generated when blank" />
			</div>
			<div class="field">
				<label for="category">Category</label>
				<select class="input" id="category" bind:value={base.category}>
					<option value="">Select a category</option>
					{#each categoryOptions as category}
						<option value={category.id}>
							{category.name || category.id} {category.id}
						</option>
					{/each}
				</select>
				{#if categoryWarning}
					<p class="text-xs font-semibold text-red-700">
						The saved category is no longer available. Select Books or General - Tangible Goods before saving.
					</p>
				{/if}
			</div>
			<div class="field">
				<label for="sortOrder">Sort order</label>
				<input class="input" id="sortOrder" type="number" bind:value={base.sortOrder} />
			</div>
			<div class="field md:col-span-2">
				<label for="shortDescription">Short description</label>
				<textarea
					class="textarea"
					id="shortDescription"
					maxlength={SHORT_DESCRIPTION_LIMIT}
					aria-describedby="shortDescriptionLimit"
					bind:value={base.shortDescription}
				></textarea>
				<p id="shortDescriptionLimit" class="text-xs font-semibold text-gray-500">
					{shortDescriptionRemaining} characters remaining
				</p>
			</div>
			<div class="field md:col-span-2">
				<label for="descriptionHtml">Long HTML description</label>
				<RichTextEditor id="descriptionHtml" bind:value={base.descriptionHtml} />
			</div>
			<label class="flex items-center gap-3 text-sm font-bold text-gray-800">
				<input type="checkbox" bind:checked={base.isVisible} />
				Visible on storefront
			</label>
		</div>
	</section>

	<section class="panel p-5">
		<div class="flex items-center justify-between gap-4">
			<h2 class="text-lg font-black text-gray-950">Variants</h2>
			<button class="button button-secondary" type="button" onclick={addVariant}>＋ Add variant</button>
		</div>
		<div class="mt-4 space-y-4">
			{#each variants as variant, index}
				<div class="rounded-lg border border-pink-100 p-4">
					<div class="mb-4 flex items-center justify-between gap-3">
						<h3 class="font-black text-gray-950">Variant {index + 1}</h3>
						<button class="button button-secondary" type="button" onclick={() => variants.splice(index, 1)}>Remove</button>
					</div>
					<div class="grid gap-4 md:grid-cols-4">
						<div class="field md:col-span-2">
							<span class="label">Name</span>
							<input class="input" bind:value={variant.name} required />
						</div>
						<div class="field">
							<span class="label">SKU</span>
							<input class="input" bind:value={variant.sku} />
						</div>
						<div class="field">
							<span class="label">Price</span>
							<input
								class="input"
								inputmode="decimal"
								placeholder="$10.00"
								bind:value={variant.priceDisplay}
								required
							/>
						</div>
						<div class="field">
							<span class="label">Currency</span>
							<input class="input" bind:value={variant.currency} />
						</div>
						<div class="field">
							<span class="label">Weight (oz)</span>
							<input class="input" type="number" step="0.01" bind:value={variant.weight} />
						</div>
						<div class="field">
							<span class="label">Length (in)</span>
							<input class="input" type="number" step="0.01" bind:value={variant.length} />
						</div>
						<div class="field">
							<span class="label">Width (in)</span>
							<input class="input" type="number" step="0.01" bind:value={variant.width} />
						</div>
						<div class="field">
							<span class="label">Height (in)</span>
							<input class="input" type="number" step="0.01" bind:value={variant.height} />
						</div>
						<div class="field">
							<span class="label">Availability date</span>
							<input class="input" type="date" bind:value={variant.expectedAvailabilityDate} />
						</div>
						<div class="field">
							<span class="label">Stock quantity</span>
							<input class="input" type="number" min="0" bind:value={variant.stockQuantity} />
						</div>
						<div class="flex flex-wrap items-center gap-4 md:col-span-2">
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.isDefault} /> Default</label>
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.isActive} /> Active</label>
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.preorder} /> Preorder</label>
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.allowBackorder} /> Allow backorder</label>
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.trackInventory} /> Track inventory</label>
							<label class="label flex items-center gap-2"><input type="checkbox" bind:checked={variant.outOfStock} /> Out of stock</label>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<section class="panel p-5">
		<div class="flex items-center justify-between gap-4">
			<div>
				<h2 class="text-lg font-black text-gray-950">Images</h2>
				<p class="text-sm font-semibold text-gray-500">Upload to R2 or enter a hosted image URL.</p>
			</div>
			<button class="button button-secondary" type="button" onclick={addImage}>＋ Add image</button>
		</div>
		<div class="mt-4 flex flex-wrap items-center gap-3">
			<input
				class="input max-w-md"
				type="file"
				accept="image/jpeg,image/png,image/webp,image/gif"
				bind:this={uploadInput}
			/>
			<button class="button button-secondary" type="button" onclick={uploadImage} disabled={uploading}>
				{uploading ? 'Uploading...' : 'Upload image'}
			</button>
		</div>
		{#if uploadError}
			<p class="mt-2 text-sm font-semibold text-red-700">{uploadError}</p>
		{/if}
		<div class="mt-4 space-y-3">
			{#each images as image, index}
				<div class="grid gap-3 rounded-lg border border-pink-100 p-3 md:grid-cols-[80px_1fr_1fr_auto_auto]">
					<div class="h-20 w-20 overflow-hidden rounded-md border border-pink-100 bg-pink-50">
						{#if image.url}
							<img class="h-full w-full object-cover" src={image.url} alt={image.altText || ''} />
						{/if}
					</div>
					<input class="input" bind:value={image.url} placeholder="Image URL" />
					<input class="input" bind:value={image.altText} placeholder="Alt text" />
					<label class="label flex items-center gap-2">
						<input
							type="radio"
							name="primaryImage"
							checked={image.isPrimary}
							onchange={() => selectPrimaryImage(index)}
						/>
						Primary
					</label>
					<button class="button button-secondary" type="button" onclick={() => images.splice(index, 1)}>Remove</button>
				</div>
			{/each}
		</div>
	</section>

	<div class="flex justify-end gap-3">
		<a class="button button-secondary" href="/products">Cancel</a>
		<button class="button button-primary" type="submit">{mode === 'create' ? 'Create product' : 'Save product'}</button>
	</div>
</form>
