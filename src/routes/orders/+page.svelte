<script>
	let { data, form } = $props();

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
		const days = rate.days ? ` · ${rate.days} days` : '';
		return `${rate.provider} ${rate.serviceName} · ${money}${days}`;
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
		<table class="w-max min-w-full text-left text-sm">
			<thead class="bg-pink-50 text-xs font-black uppercase tracking-wide text-pink-900">
				<tr>
					<th class="px-4 py-3">Order</th>
					<th class="px-4 py-3">Customer</th>
					<th class="px-4 py-3">Items</th>
					<th class="px-4 py-3">Details</th>
					<th class="px-4 py-3">Total</th>
					<th class="px-4 py-3">Status</th>
					<th class="px-4 py-3">Fulfillment</th>
					<th class="px-4 py-3"></th>
				</tr>
			</thead>
			<tbody class="divide-y divide-pink-100">
				{#each data.orders as order}
					<tr>
						<td class="max-w-56 px-4 py-3 align-top">
							<p class="font-black text-gray-950">{new Date(order.createdAt).toLocaleString()}</p>
							<p class="break-all font-semibold text-gray-500">{order.stripeSessionId}</p>
						</td>
						<td class="max-w-52 break-words px-4 py-3 align-top font-semibold text-gray-700">{order.customerEmail || 'Unknown'}</td>
						<td class="max-w-72 px-4 py-3 align-top">
							<div class="space-y-1">
								{#each order.items as item}
									<p class="break-words font-semibold text-gray-700">{item.quantity}x {item.name}</p>
								{:else}
									<p class="font-semibold text-gray-500">No items recorded.</p>
								{/each}
							</div>
						</td>
						<td class="max-w-72 px-4 py-3 align-top">
							{#if order.customFields?.length}
								<div class="space-y-2">
									{#each order.customFields as field}
										<div>
											<p class="text-xs font-black uppercase tracking-wide text-gray-500">{field.label || field.key}</p>
											<p class="break-words font-semibold text-gray-800">{field.value}</p>
										</div>
									{/each}
								</div>
							{:else}
								<p class="font-semibold text-gray-500">None</p>
							{/if}
						</td>
						<td class="whitespace-nowrap px-4 py-3 align-top">
							<p class="font-black text-gray-950">{formatMoney(order.amountTotal, order.currency)}</p>
							<p class="font-semibold text-gray-500">Shipping {formatMoney(order.shippingAmount, order.currency)}</p>
						</td>
						<td class="max-w-64 px-4 py-3 align-top">
							<span class="rounded-full px-2 py-1 text-xs font-black {statusClass(order.status)}">
								{statusLabel(order.status)}
							</span>
							{#if order.failureReason}
								<p class="mt-2 max-w-xs font-semibold text-red-700">{order.failureReason}</p>
							{/if}
						</td>
						<td class="max-w-48 break-all px-4 py-3 align-top font-semibold text-gray-700">
							<div class="space-y-3">
								<div>
									<p class="break-all">{order.shippoOrderId || 'Not created'}</p>
									<p class="mt-1 text-xs text-gray-500">Customer paid {formatMoney(order.shippingAmount, order.currency) || 'unknown'}</p>
								</div>
								{#if order.label}
									<div class="space-y-1 rounded border border-gray-200 bg-gray-50 p-2">
										<p class="font-black text-gray-950">{order.label.carrier} {order.label.service}</p>
										{#if order.label.packageName}
											<p class="text-xs text-gray-600">Package: {order.label.packageName}</p>
										{/if}
										{#if formatLabelCost(order.label)}
											<p class="text-xs text-gray-600">Label cost: {formatLabelCost(order.label)}</p>
										{/if}
										{#if order.label.trackingNumber}
											<p class="break-all text-xs text-gray-600">Tracking: {order.label.trackingNumber}</p>
										{/if}
										<a class="button button-secondary inline-flex" href={`/orders/${order.id}/label/download`}>Download label</a>
									</div>
								{:else if canBuyLabel(order)}
									<form class="space-y-2" method="POST" action="?/previewLabelRates">
										<input type="hidden" name="id" value={order.id} />
										<select class="input w-full min-w-48" name="packageData" required>
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
									{#if form?.labelRates?.orderId === order.id}
										<div class="space-y-2 rounded border border-pink-100 bg-white p-2">
											{#each form.labelRates.rates as rate}
												<form method="POST" action="?/purchaseLabel">
													<input type="hidden" name="id" value={order.id} />
													<input type="hidden" name="rateId" value={rate.objectId} />
													<input type="hidden" name="shipmentId" value={form.labelRates.shipmentId} />
													<input type="hidden" name="packageId" value={form.labelRates.packageId} />
													<input type="hidden" name="packageName" value={form.labelRates.packageName} />
													<button class="button button-secondary w-full text-left" type="submit">{formatRate(rate)}</button>
												</form>
											{:else}
												<p class="text-xs font-semibold text-gray-500">No rates returned.</p>
											{/each}
										</div>
									{/if}
								{/if}
							</div>
						</td>
						<td class="px-4 py-3 align-top text-right">
							{#if canMarkFulfilled(order)}
								<form method="POST" action="?/markFulfilled">
									<input type="hidden" name="id" value={order.id} />
									<button class="button button-secondary" type="submit">Mark fulfilled</button>
								</form>
							{/if}
						</td>
					</tr>
				{:else}
					<tr>
						<td class="px-4 py-6 text-sm font-semibold text-gray-500" colspan="8">No orders yet.</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</section>
