<script>
	import { onDestroy } from 'svelte';
	import { flip } from 'svelte/animate';
	import { dragHandle, dragHandleZone } from 'svelte-dnd-action';
	import RichTextEditor from '$lib/components/RichTextEditor.svelte';

	let { product = null, form = null, mode = 'create', action = undefined, categories = [] } = $props();
	const SHORT_DESCRIPTION_LIMIT = 500;
	const IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif';
	const flipDurationMs = 150;
	const GUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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

	let images = $state((product?.images?.length ? structuredClone(product.images) : []).map((image) => withSortableId(image, 'image')));
	let uploadQueue = $state([]);
	let payload = $state('');
	let categoryWarning = $state(false);
	let uploadInput = $state();
	let dragDepth = $state(0);
	let categoryOptions = $derived(categories ?? []);
	let shortDescriptionRemaining = $derived(SHORT_DESCRIPTION_LIMIT - base.shortDescription.length);
	let draggingImages = $derived(dragDepth > 0);
	let uploading = $derived(uploadQueue.some((item) => item.status === 'uploading'));

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
		images.push(withSortableId({ url: '', altText: '', sortOrder: images.length, isPrimary: images.length === 0 }, 'image'));
		normalizeImages();
	}

	function selectPrimaryImage(index) {
		images.forEach((image, imageIndex) => {
			image.isPrimary = imageIndex === index;
		});
	}

	function normalizeImages() {
		if (images.length === 0) return;
		const primaryIndex = Math.max(
			0,
			images.findIndex((image) => image.isPrimary)
		);
		images.forEach((image, index) => {
			image.sortOrder = index;
			image.isPrimary = index === primaryIndex;
		});
	}

	function removeImage(index) {
		images.splice(index, 1);
		normalizeImages();
	}

	function moveImage(index, direction) {
		const nextIndex = index + direction;
		if (nextIndex < 0 || nextIndex >= images.length) return;
		const image = images[index];
		images[index] = images[nextIndex];
		images[nextIndex] = image;
		normalizeImages();
	}

	function handleImageDnd(event) {
		images = event.detail.items;
		normalizeImages();
	}

	function browseImages() {
		uploadInput?.click();
	}

	function handleFileChange(event) {
		uploadFiles(event.currentTarget.files);
		event.currentTarget.value = '';
	}

	function handleDragEnter(event) {
		event.preventDefault();
		dragDepth += 1;
	}

	function handleDragOver(event) {
		event.preventDefault();
	}

	function handleDragLeave(event) {
		event.preventDefault();
		dragDepth = Math.max(0, dragDepth - 1);
	}

	function handleDrop(event) {
		event.preventDefault();
		dragDepth = 0;
		uploadFiles(event.dataTransfer?.files);
	}

	function uploadFiles(fileList) {
		const files = Array.from(fileList ?? []);
		files.forEach(uploadFile);
	}

	async function uploadFile(file) {
		const item = {
			id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
			name: file.name,
			size: file.size,
			previewUrl: URL.createObjectURL(file),
			status: 'uploading',
			error: ''
		};
		uploadQueue.push(item);

		try {
			const form = new FormData();
			form.set('file', file);
			const response = await fetch('/products/images/upload', {
				method: 'POST',
				body: form
			});
			const result = await response.json().catch(() => ({}));
			if (!response.ok) {
				item.status = 'failed';
				item.error = result.error || result.message || 'Unable to upload image.';
				return;
			}

			images.push({
				id: makeTempId('image'),
				url: result.url,
				altText: '',
				sortOrder: images.length,
				isPrimary: images.length === 0
			});
			normalizeImages();
			removeUploadItem(item);
		} catch {
			item.status = 'failed';
			item.error = 'Unable to upload image.';
		}
	}

	function removeUploadItem(item) {
		URL.revokeObjectURL(item.previewUrl);
		const index = uploadQueue.indexOf(item);
		if (index >= 0) {
			uploadQueue.splice(index, 1);
		}
	}

	function formatFileSize(size) {
		if (size < 1024) return `${size} B`;
		if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`;
		return `${(size / 1024 / 1024).toFixed(1)} MB`;
	}

	function makeTempId(prefix) {
		return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
	}

	function withSortableId(item, prefix) {
		return item.id ? item : { ...item, id: makeTempId(prefix) };
	}

	function serverId(value) {
		return GUID_REGEX.test(value ?? '') ? value : undefined;
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
		normalizeImages();
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
			images: images.map((image, index) => ({
				...image,
				id: serverId(image.id),
				sortOrder: index
			}))
		});
	}

	onDestroy(() => {
		uploadQueue.forEach((item) => URL.revokeObjectURL(item.previewUrl));
	});
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
				<label for="sortOrder">Display order</label>
				<input class="input" id="sortOrder" type="number" bind:value={base.sortOrder} />
				<p class="text-xs font-semibold text-gray-500">Lower numbers appear first. Use the products list to reorder visually.</p>
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
		<input class="sr-only" type="file" accept={IMAGE_ACCEPT} multiple bind:this={uploadInput} onchange={handleFileChange} />
		<button
			class="mt-4 grid w-full place-items-center rounded-lg border border-dashed p-6 text-center transition {draggingImages
				? 'border-pink-500 bg-pink-50'
				: 'border-pink-200 bg-white hover:bg-pink-50'}"
			type="button"
			ondragenter={handleDragEnter}
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={browseImages}
		>
			<span class="text-sm font-black text-gray-950">{uploading ? 'Uploading images...' : 'Drop images here or browse'}</span>
			<span class="mt-1 text-xs font-semibold text-gray-500">JPEG, PNG, WebP, or GIF</span>
		</button>

		{#if uploadQueue.length}
			<div class="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
				{#each uploadQueue as item (item.id)}
					<div class="overflow-hidden rounded-lg border border-pink-100 bg-white">
						<div class="aspect-[4/3] bg-pink-50">
							<img class="h-full w-full object-cover" src={item.previewUrl} alt="" />
						</div>
						<div class="grid gap-2 p-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-black text-gray-950">{item.name}</p>
								<p class="text-xs font-semibold text-gray-500">{formatFileSize(item.size)}</p>
							</div>
							{#if item.status === 'uploading'}
								<p class="text-xs font-bold text-pink-700">Uploading...</p>
							{:else}
								<p class="text-xs font-bold text-red-700">{item.error}</p>
								<button class="button button-secondary w-fit" type="button" onclick={() => removeUploadItem(item)}>Remove</button>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		{/if}

		<div
			class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3"
			use:dragHandleZone={{ items: images, flipDurationMs }}
			onconsider={handleImageDnd}
			onfinalize={handleImageDnd}
		>
			{#each images as image, index (image.id)}
				<div animate:flip={{ duration: flipDurationMs }} class="overflow-hidden rounded-lg border border-pink-100 bg-white">
					<div
						class="relative aspect-[4/3] cursor-grab bg-pink-50 active:cursor-grabbing"
						role="button"
						tabindex="0"
						use:dragHandle
						aria-label="Drag image {index + 1}"
						title="Drag to reorder"
					>
						{#if image.url}
							<img class="h-full w-full object-cover" src={image.url} alt={image.altText || ''} />
						{:else}
							<div class="grid h-full place-items-center px-4 text-center text-sm font-semibold text-gray-500">Image preview</div>
						{/if}
						{#if image.isPrimary}
							<span class="absolute left-3 top-3 rounded bg-pink-700 px-2 py-1 text-xs font-black uppercase text-white">Primary</span>
						{/if}
					</div>
					<div class="grid gap-3 p-3">
						<input class="input" bind:value={image.url} placeholder="Image URL" />
						<input class="input" bind:value={image.altText} placeholder="Alt text" />
						<div class="flex flex-wrap items-center gap-2">
							<button class="button button-secondary" type="button" onclick={() => selectPrimaryImage(index)} disabled={image.isPrimary}>
								Primary
							</button>
							<button class="button button-secondary" type="button" onclick={() => moveImage(index, -1)} disabled={index === 0}>
								Up
							</button>
							<button class="button button-secondary" type="button" onclick={() => moveImage(index, 1)} disabled={index === images.length - 1}>
								Down
							</button>
							<button class="button button-secondary" type="button" onclick={() => removeImage(index)}>Remove</button>
						</div>
					</div>
				</div>
			{/each}
		</div>
		{#if images.length === 0 && uploadQueue.length === 0}
			<p class="mt-4 rounded-lg border border-pink-100 bg-pink-50 px-3 py-2 text-sm font-semibold text-gray-600">
				No images added yet.
			</p>
		{/if}
	</section>

	<div class="flex justify-end gap-3">
		<a class="button button-secondary" href="/products">Cancel</a>
		<button class="button button-primary" type="submit">{mode === 'create' ? 'Create product' : 'Save product'}</button>
	</div>
</form>
