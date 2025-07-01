<template>
	<SpeedInsights />
	<Analytics />
	<NuxtPage />
</template>

<script setup lang="ts">
import { SpeedInsights } from '@vercel/speed-insights/nuxt';
import { Analytics } from '@vercel/analytics/nuxt';
</script>
