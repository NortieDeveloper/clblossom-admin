<script>
	let { activities = [], getHref = () => null } = $props();

	function formatActivityDate(value) {
		return new Date(value).toLocaleString();
	}

	function actor(activity) {
		return activity.changedByName || activity.changedByEmail || 'Unknown admin';
	}

	function fieldLabel(field) {
		return field
			.replaceAll('.', ' ')
			.replace(/([a-z])([A-Z])/g, '$1 $2')
			.replace(/\[(\d+)\]/g, ' $1')
			.replace(/^\w/, (value) => value.toUpperCase());
	}
</script>

<div class="divide-y divide-pink-100">
	{#each activities as activity}
		<div class="py-4">
			<div class="flex flex-wrap items-start justify-between gap-3">
				<div>
					<p class="font-black text-gray-950">
						{#if getHref(activity)}
							<a class="hover:text-pink-700" href={getHref(activity)}>{activity.entityName}</a>
						{:else}
							{activity.entityName}
						{/if}
					</p>
					<p class="text-sm font-semibold text-gray-600">
						{actor(activity)} {activity.action} {activity.entityType}
					</p>
				</div>
				<p class="text-xs font-bold text-gray-500">{formatActivityDate(activity.createdAt)}</p>
			</div>
			{#if activity.changes?.length}
				<ul class="mt-2 space-y-1 text-sm text-gray-700">
					{#each activity.changes.slice(0, 5) as change}
						<li>
							<span class="font-bold">{fieldLabel(change.field)}:</span>
							<span class="text-gray-500">{change.before ?? 'blank'}</span>
							<span class="text-gray-400"> -> </span>
							<span>{change.after ?? 'blank'}</span>
						</li>
					{/each}
					{#if activity.changes.length > 5}
						<li class="font-semibold text-gray-500">+{activity.changes.length - 5} more changes</li>
					{/if}
				</ul>
			{/if}
		</div>
	{:else}
		<p class="text-sm font-semibold text-gray-500">No activity yet.</p>
	{/each}
</div>
