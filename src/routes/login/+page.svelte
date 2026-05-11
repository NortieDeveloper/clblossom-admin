<script>
	let { data, form } = $props();
</script>

<svelte:head>
	<title>Admin Login | C.L. Blossom</title>
</svelte:head>

<main class="grid min-h-screen place-items-center bg-[#fff7fb] px-4">
	<div class="panel w-full max-w-sm space-y-5 p-6">
		<div class="space-y-1">
			<p class="text-xs font-black uppercase tracking-[0.18em] text-pink-700">C.L. Blossom</p>
			<h1 class="text-2xl font-black text-gray-950">Admin sign in</h1>
		</div>

		{#if form?.error || data.error}
			<p class="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-semibold text-red-800">
				{form?.error || data.error}
			</p>
		{/if}

		<a class="button button-primary block w-full text-center" href="/auth/login">Sign in with Auth0</a>
	</div>
</main>
