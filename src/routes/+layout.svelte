<script>
	import '../app.css';
	import { page } from '$app/state';

	let { children, data } = $props();
	let userName = $derived(data.admin.name || data.admin.email || 'Admin');

	const nav = [
		{ href: '/', label: 'Overview', icon: '⌂' },
		{ href: '/products', label: 'Products', icon: '▦' },
		{ href: '/books', label: 'Books', icon: '▥' },
		{ href: '/orders', label: 'Orders', icon: '▤' },
		{ href: '/events', label: 'Events', icon: '◷' },
		{ href: '/settings', label: 'Settings', icon: '⚙' }
	];
</script>

<svelte:head>
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap"
		rel="stylesheet"
	/>
</svelte:head>

{#if page.url.pathname === '/login' || !data.admin.authenticated}
	{@render children()}
{:else}
	<div class="min-h-screen max-w-full overflow-x-hidden bg-[#fff7fb] lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]">
		<aside class="fixed inset-y-0 left-0 hidden w-68 border-r border-pink-100 bg-white px-5 py-5 lg:block">
			<a href="/" class="flex items-center gap-3">
				<span class="grid size-9 place-items-center rounded-lg bg-pink-200 font-black text-pink-800">CL</span>
				<span>
					<span class="block text-sm font-black text-gray-950">C.L. Blossom</span>
					<span class="block text-xs font-bold text-pink-700">Admin</span>
				</span>
			</a>

			<nav class="mt-8 space-y-1">
				{#each nav as item}
					<a
						href={item.href}
						class="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold {page.url.pathname ===
							item.href || (item.href !== '/' && page.url.pathname.startsWith(item.href))
							? 'bg-pink-100 text-pink-900'
							: 'text-gray-700 hover:bg-pink-50'}"
					>
						<span aria-hidden="true">{item.icon}</span>
						{item.label}
					</a>
				{/each}
			</nav>
		</aside>

		<div class="min-w-0 lg:col-start-2">
			<header
				class="sticky top-0 z-10 flex min-h-16 items-center justify-between border-b border-pink-100 bg-white/90 px-4 backdrop-blur md:px-8"
			>
				<div>
					<p class="text-xs font-black uppercase tracking-[0.18em] text-pink-700">Dashboard</p>
					<p class="text-sm font-semibold text-gray-600">Products, inventory, and events</p>
				</div>
				<div class="flex items-center gap-3">
					<div class="hidden text-right sm:block">
						<p class="text-sm font-black text-gray-950">{userName}</p>
						<p class="text-xs font-semibold text-gray-500">Signed in</p>
					</div>
					<form method="POST" action="/login?/logout">
						<button class="button button-secondary" type="submit" title="Sign out">↪ Sign out</button>
					</form>
				</div>
			</header>

			<main class="min-w-0 px-4 py-6 md:px-8">{@render children()}</main>
		</div>
	</div>
{/if}
