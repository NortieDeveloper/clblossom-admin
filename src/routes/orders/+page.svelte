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

	<div class="panel w-full max-w-full overflow-x-auto">
		<table class="w-full min-w-[1100px] table-fixed text-left text-sm">
			<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
				<tr>
					<th class="w-[18%] px-4 py-3">Customer</th>
					<th class="w-[24%] px-4 py-3">Items</th>
					<th class="w-[16%] px-4 py-3">Details</th>
					<th class="w-[12%] px-4 py-3">Total</th>
					<th class="w-[12%] px-4 py-3">Status</th>
					<th class="w-[12%] px-4 py-3">Fulfillment</th>
					<th class="w-[6%] px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-pink-100">
				{#each data.orders as order}
					<tr class:bg-pink-50={expandedOrderId === order.id}>
						<td class="px-4 py-3 align-top">
							<p class="break-words font-black text-gray-950">{order.customerEmail || 'Unknown'}</p>
							<p class="mt-1 text-xs font-semibold text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
						</td>
						<td class="px-4 py-3 align-top">
							<p class="break-words font-semibold text-gray-800">{itemSummary(order)}</p>
							{#if order.items?.length > 1}
								<p class="mt-1 text-xs font-semibold text-gray-500">{order.items.length} line items</p>
							{/if}
						</td>
						<td class="px-4 py-3 align-top">
							<p class="truncate font-semibold text-gray-700">{personalizationSummary(order)}</p>
						</td>
						<td class="whitespace-nowrap px-4 py-3 align-top">
							<p class="font-black text-gray-950">{formatMoney(order.amountTotal, order.currency)}</p>
							<p class="text-xs font-semibold text-gray-500">Ship {formatMoney(order.shippingAmount, order.currency) || 'unknown'}</p>
							<p class="truncate text-xs font-semibold text-gray-500">{shippingServiceSummary(order)}</p>
						</td>
						<td class="px-4 py-3 align-top">
							<span class="rounded-full px-2 py-1 text-xs font-black {statusClass(order.status)}">
								{statusLabel(order.status)}
							</span>
						</td>
						<td class="px-4 py-3 align-top">
							{#if order.label}
								<p class="font-black text-gray-950">Label ready</p>
								{#if order.label.trackingNumber}
									<p class="truncate text-xs font-semibold text-gray-500">{order.label.trackingNumber}</p>
								{/if}
							{:else if order.shippoOrderId}
								<p class="font-semibold text-gray-700">No label</p>
							{:else}
								<p class="font-semibold text-gray-500">No Shippo order</p>
							{/if}
						</td>
						<td class="px-4 py-3 text-right align-top">
							<button class="button button-secondary" type="button" onclick={() => toggleOrder(order.id)}>
								{expandedOrderId === order.id ? 'Close' : 'Manage'}
							</button>
						</td>
					</tr>
					{#if expandedOrderId === order.id}
						<tr>
							<td class="bg-white px-4 py-4" colspan="7">
								<div class="grid gap-4 lg:grid-cols-[1.1fr_1fr_1.2fr]">
									<section class="space-y-3">
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

									<section class="space-y-3">
										<h2 class="text-sm font-black uppercase tracking-wide text-pink-900">Shipping</h2>
										<div class="space-y-1 rounded border border-gray-200 bg-gray-50 p-3">
											<p class="font-black text-gray-950">Customer paid {formatMoney(order.shippingAmount, order.currency) || 'unknown'}</p>
											<p class="text-sm font-semibold text-gray-700">Selected: {shippingServiceSummary(order)}</p>
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

									<section class="space-y-3">
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
												<div class="mb-2 flex items-center justify-between gap-3">
													<p class="font-black text-gray-950">Available services</p>
													<p class="text-xs font-semibold text-gray-500">{form.labelRates.packageName}</p>
												</div>
												<div class="max-h-80 overflow-y-auto rounded border border-pink-100 bg-white">
													<table class="w-full text-left text-sm">
														<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
															<tr>
																<th class="px-3 py-2">Service</th>
																<th class="px-3 py-2">ETA</th>
																<th class="px-3 py-2">Cost</th>
																<th class="px-3 py-2"></th>
															</tr>
														</thead>
														<tbody class="divide-y divide-pink-100">
															{#each form.labelRates.rates as rate}
																{@const rateInfo = formatRate(rate)}
																<tr>
																	<td class="px-3 py-2 font-semibold text-gray-800">{rateInfo.service}</td>
																	<td class="whitespace-nowrap px-3 py-2 font-semibold text-gray-600">{rateInfo.days}</td>
																	<td class="whitespace-nowrap px-3 py-2 font-black text-gray-950">{rateInfo.money}</td>
																	<td class="px-3 py-2 text-right">
																		<form method="POST" action="?/purchaseLabel">
																			<input type="hidden" name="id" value={order.id} />
																			<input type="hidden" name="rateId" value={rate.objectId} />
																			<input type="hidden" name="shipmentId" value={form.labelRates.shipmentId} />
																			<input type="hidden" name="packageId" value={form.labelRates.packageId} />
																			<input type="hidden" name="packageName" value={form.labelRates.packageName} />
																			<button class="button button-secondary" type="submit">Buy</button>
																		</form>
																	</td>
																</tr>
															{:else}
																<tr>
																	<td class="px-3 py-4 font-semibold text-gray-500" colspan="4">No rates returned.</td>
																</tr>
															{/each}
														</tbody>
													</table>
												</div>
											</div>
										{:else}
											<p class="font-semibold text-gray-500">Preview rates after selecting a package.</p>
										{/if}
									</section>
								</div>
							</td>
						</tr>
					{/if}
				{:else}
					<tr>
						<td class="px-4 py-6 text-sm font-semibold text-gray-500" colspan="7">No orders yet.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
