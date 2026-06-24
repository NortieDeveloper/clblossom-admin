<script>
	let { data, form } = $props();
	let expandedOrderId = $state(form?.labelRates?.orderId ?? null);

	$effect(() => {
		if (form?.labelRates?.orderId) {
			expandedOrderId = form.labelRates.orderId;
		}
	});

	function formatMoney(amount, currency) {
		if (amount === null || amount === undefined) return '';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: (currency || 'usd').toUpperCase()
		}).format(amount / 100);
	}

	function statusClass(status) {
		if (status === 'Fulfilled') return 'bg-green-100 text-green-800';
		if (status === 'Cancelled') return 'bg-gray-200 text-gray-800';
		if (status === 'InventoryFailed' || status === 'FulfillmentFailed') return 'bg-red-100 text-red-800';
		if (status === 'InventoryAllocated') return 'bg-blue-100 text-blue-800';
		if (status === 'AllocatingInventory') return 'bg-yellow-100 text-yellow-800';
		return 'bg-gray-100 text-gray-700';
	}

	function statusLabel(status) {
		if (status === 'InventoryFailed') return 'Manual review';
		if (status === 'FulfillmentFailed') return 'Fulfillment failed';
		if (status === 'Fulfilled') return 'Fulfilled';
		if (status === 'Cancelled') return 'Cancelled';
		if (status === 'FulfillmentCreated') return 'Ready to fulfill';
		if (status === 'InventoryAllocated') return 'Ready to fulfill';
		if (status === 'AllocatingInventory') return 'Allocating';
		return status;
	}

	function canMarkFulfilled(order) {
		return order.status !== 'Fulfilled' && order.status !== 'Cancelled' && order.status !== 'AllocatingInventory';
	}

	function canBuyLabel(order) {
		return order.status !== 'Cancelled' && order.shippoOrderId && !order.label?.transactionId;
	}

	function formatRate(rate) {
		const amount = Number.parseFloat(rate.amount || '0');
		const money = Number.isFinite(amount)
			? new Intl.NumberFormat('en-US', {
					style: 'currency',
					currency: (rate.currency || 'usd').toUpperCase()
				}).format(amount)
			: '';
		const days = rate.days ? `${rate.days} days` : 'No ETA';
		return { service: `${rate.provider} ${rate.serviceName}`.trim(), money, days };
	}

	function formatLabelCost(label) {
		if (!label?.cost) return '';
		const amount = Number.parseFloat(label.cost);
		if (!Number.isFinite(amount)) return '';
		return new Intl.NumberFormat('en-US', {
			style: 'currency',
			currency: (label.currency || 'usd').toUpperCase()
		}).format(amount);
	}

	function itemSummary(order) {
		if (!order.items?.length) return 'No items';
		const first = order.items[0];
		const suffix = order.items.length > 1 ? ` +${order.items.length - 1}` : '';
		return `${first.quantity}x ${first.name}${suffix}`;
	}

	function personalizationSummary(order) {
		const field = order.customFields?.find((item) => item.value);
		return field ? field.value : 'None';
	}

	function shippingServiceSummary(order) {
		const service = order.selectedShippingService || order.selectedShippingServiceToken;
		return [order.selectedShippingProvider, service].filter(Boolean).join(' ') || 'Service unknown';
	}

	function toggleOrder(orderId) {
		expandedOrderId = expandedOrderId === orderId ? null : orderId;
	}
</script>

<svelte:head>
	<title>Orders | C.L. Blossom Admin</title>
</svelte:head>

<section class="min-w-0 space-y-5">
	<div>
		<h1 class="text-3xl font-black text-gray-950">Orders</h1>
		<p class="mt-1 text-sm font-semibold text-gray-600">Paid checkouts, inventory allocation, and fulfillment status.</p>
	</div>

	{#if form?.error}
		<p class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{form.error}</p>
	{/if}

	<div class="space-y-3">
		{#each data.orders as order}
			<article class="panel overflow-hidden p-0">
				<div class="flex flex-col gap-4 p-4 lg:flex-row lg:items-start lg:justify-between">
					<div class="min-w-0 flex-1 space-y-3">
						<div class="flex flex-wrap items-center gap-2">
							<span class="rounded-full px-2 py-1 text-xs font-black {statusClass(order.status)}">
								{statusLabel(order.status)}
							</span>
							{#if order.label}
								<span class="rounded-full bg-green-50 px-2 py-1 text-xs font-black text-green-800">Label ready</span>
							{:else if order.shippoOrderId}
								<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-black text-gray-700">No label</span>
							{:else}
								<span class="rounded-full bg-gray-100 px-2 py-1 text-xs font-black text-gray-500">No Shippo order</span>
							{/if}
						</div>

						<div class="grid min-w-0 gap-3 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)_minmax(0,0.9fr)]">
							<div class="min-w-0">
								<p class="break-words text-base font-black text-gray-950">{order.customerEmail || 'Unknown customer'}</p>
								<p class="mt-1 text-xs font-semibold text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
							</div>

							<div class="min-w-0">
								<p class="text-xs font-black uppercase tracking-wide text-pink-900">Items</p>
								<p class="mt-1 break-words font-semibold text-gray-800">{itemSummary(order)}</p>
								{#if order.items?.length > 1}
									<p class="text-xs font-semibold text-gray-500">{order.items.length} line items</p>
								{/if}
							</div>

							<div class="min-w-0">
								<p class="text-xs font-black uppercase tracking-wide text-pink-900">Total</p>
								<p class="mt-1 font-black text-gray-950">{formatMoney(order.amountTotal, order.currency)}</p>
								<p class="break-words text-xs font-semibold text-gray-500">
									Shipping {formatMoney(order.shippingAmount, order.currency) || 'unknown'} · {shippingServiceSummary(order)}
								</p>
							</div>
						</div>

						<div class="grid gap-3 md:grid-cols-2">
							<div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
								<p class="text-xs font-black uppercase tracking-wide text-gray-500">Personalization</p>
								<p class="mt-1 break-words font-semibold text-gray-800">{personalizationSummary(order)}</p>
							</div>
							<div class="min-w-0 rounded border border-gray-200 bg-gray-50 p-3">
								<p class="text-xs font-black uppercase tracking-wide text-gray-500">Fulfillment</p>
								{#if order.label}
									<p class="mt-1 break-words font-semibold text-gray-800">
										{order.label.carrier} {order.label.service}
									</p>
									{#if order.label.trackingNumber}
										<p class="break-all text-xs font-semibold text-gray-500">{order.label.trackingNumber}</p>
									{/if}
								{:else}
									<p class="mt-1 font-semibold text-gray-800">{order.shippoOrderId ? 'Ready for label purchase' : 'Shippo order unavailable'}</p>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex shrink-0 flex-wrap gap-2 lg:justify-end">
						{#if canMarkFulfilled(order)}
							<form method="POST" action="?/markFulfilled">
								<input type="hidden" name="id" value={order.id} />
								<button class="button button-secondary" type="submit">Mark fulfilled</button>
							</form>
						{/if}
						<button class="button button-secondary" type="button" onclick={() => toggleOrder(order.id)}>
							{expandedOrderId === order.id ? 'Close' : 'Manage'}
						</button>
					</div>
				</div>

				{#if expandedOrderId === order.id}
					<div class="border-t border-pink-100 bg-white p-4">
						<div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.1fr)]">
							<section class="min-w-0 space-y-4">
								<div>
									<h2 class="text-sm font-black uppercase tracking-wide text-pink-900">Items</h2>
									<div class="mt-2 space-y-1">
										{#each order.items as item}
											<p class="break-words font-semibold text-gray-800">{item.quantity}x {item.name}</p>
										{:else}
											<p class="font-semibold text-gray-500">No items recorded.</p>
										{/each}
									</div>
								</div>

								<div>
									<h2 class="text-sm font-black uppercase tracking-wide text-pink-900">Custom fields</h2>
									{#if order.customFields?.length}
										<div class="mt-2 space-y-2">
											{#each order.customFields as field}
												<div>
													<p class="text-xs font-black uppercase tracking-wide text-gray-500">{field.label || field.key}</p>
													<p class="break-words font-semibold text-gray-800">{field.value}</p>
												</div>
											{/each}
										</div>
									{:else}
										<p class="mt-2 font-semibold text-gray-500">None</p>
									{/if}
								</div>

								<div class="space-y-1 text-xs font-semibold text-gray-500">
									<p class="break-all">Stripe session: {order.stripeSessionId}</p>
									<p class="break-all">Shippo order: {order.shippoOrderId || 'Not created'}</p>
								</div>
							</section>

							<section class="min-w-0 space-y-3">
								<h2 class="text-sm font-black uppercase tracking-wide text-pink-900">Shipping</h2>
								<div class="space-y-1 rounded border border-gray-200 bg-gray-50 p-3">
									<p class="font-black text-gray-950">Customer paid {formatMoney(order.shippingAmount, order.currency) || 'unknown'}</p>
									<p class="break-words text-sm font-semibold text-gray-700">Selected: {shippingServiceSummary(order)}</p>
									<p class="text-xs font-semibold text-gray-500">Order total {formatMoney(order.amountTotal, order.currency)}</p>
								</div>

								{#if order.label}
									<div class="space-y-2 rounded border border-green-200 bg-green-50 p-3">
										<p class="font-black text-gray-950">{order.label.carrier} {order.label.service}</p>
										{#if order.label.packageName}
											<p class="text-sm font-semibold text-gray-700">Package: {order.label.packageName}</p>
										{/if}
										{#if formatLabelCost(order.label)}
											<p class="text-sm font-semibold text-gray-700">Label cost: {formatLabelCost(order.label)}</p>
										{/if}
										{#if order.label.trackingNumber}
											<p class="break-all text-sm font-semibold text-gray-700">Tracking: {order.label.trackingNumber}</p>
										{/if}
										<a class="button button-secondary inline-flex" href={`/orders/${order.id}/label/download`}>Download label</a>
									</div>
								{:else if canBuyLabel(order)}
									<form class="space-y-2" method="POST" action="?/previewLabelRates">
										<input type="hidden" name="id" value={order.id} />
										<select class="input w-full" name="packageData" required>
											<option value="">Select package</option>
											{#each data.labelPackages as pkg}
												<option value={JSON.stringify(pkg)}>
													{pkg.name}
													{pkg.length && pkg.width && pkg.height ? ` (${pkg.length} x ${pkg.width} x ${pkg.height} ${pkg.distanceUnit || ''})` : ''}
												</option>
											{/each}
										</select>
										<button class="button button-secondary" type="submit">Preview rates</button>
									</form>
								{:else}
									<p class="font-semibold text-gray-500">Label purchase unavailable.</p>
								{/if}
							</section>

							<section class="min-w-0 space-y-3">
								<div class="flex flex-wrap items-center justify-between gap-3">
									<h2 class="text-sm font-black uppercase tracking-wide text-pink-900">Fulfillment</h2>
									{#if canMarkFulfilled(order)}
										<form method="POST" action="?/markFulfilled">
											<input type="hidden" name="id" value={order.id} />
											<button class="button button-secondary" type="submit">Mark fulfilled</button>
										</form>
									{/if}
								</div>

								{#if order.failureReason}
									<p class="rounded border border-red-200 bg-red-50 p-3 text-sm font-bold text-red-700">{order.failureReason}</p>
								{/if}

								{#if form?.labelRates?.orderId === order.id}
									<div class="rounded border border-pink-100 bg-pink-50 p-3">
										<div class="mb-2 flex flex-wrap items-center justify-between gap-2">
											<p class="font-black text-gray-950">Available services</p>
											<p class="break-words text-xs font-semibold text-gray-500">{form.labelRates.packageName}</p>
										</div>
										<div class="space-y-2">
											{#each form.labelRates.rates as rate}
												{@const rateInfo = formatRate(rate)}
												<div class="flex flex-col gap-3 rounded border border-pink-100 bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
													<div class="min-w-0">
														<p class="break-words font-semibold text-gray-800">{rateInfo.service}</p>
														<p class="text-xs font-semibold text-gray-500">{rateInfo.days}</p>
													</div>
													<div class="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
														<p class="font-black text-gray-950">{rateInfo.money}</p>
														<form method="POST" action="?/purchaseLabel">
															<input type="hidden" name="id" value={order.id} />
															<input type="hidden" name="rateId" value={rate.objectId} />
															<input type="hidden" name="shipmentId" value={form.labelRates.shipmentId} />
															<input type="hidden" name="packageId" value={form.labelRates.packageId} />
															<input type="hidden" name="packageName" value={form.labelRates.packageName} />
															<button class="button button-secondary" type="submit">Buy</button>
														</form>
													</div>
												</div>
											{:else}
												<p class="rounded border border-pink-100 bg-white p-3 font-semibold text-gray-500">No rates returned.</p>
											{/each}
										</div>
									</div>
								{:else}
									<p class="font-semibold text-gray-500">Preview rates after selecting a package.</p>
								{/if}
							</section>
						</div>
					</div>
				{/if}
			</article>
		{:else}
			<div class="panel p-6 text-sm font-semibold text-gray-500">No orders yet.</div>
		{/each}
	</div>
</section>
