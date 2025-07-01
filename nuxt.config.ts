// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	compatibilityDate: '2025-05-15',
	devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	modules: ['@nuxt/eslint', '@nuxt/fonts', '@nuxt/icon', '@nuxt/image', '@nuxt/ui'],

	// SEO Configuration
	app: {
		head: {
			charset: 'utf-8',
			viewport: 'width=device-width, initial-scale=1',
			title: 'MKWLog - Mario Kart World Time Tracker',
			meta: [
				{ name: 'description', content: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.' },
				{ name: 'keywords', content: 'Mario Kart World, time attack, lap times, racing tracker, MKW, speedrun, time trials' },
				{ name: 'author', content: 'cram0' },
				{ name: 'robots', content: 'index, follow' },

				// Open Graph / Facebook
				{ property: 'og:type', content: 'website' },
				{ property: 'og:title', content: 'MKWLog - Mario Kart World Time Tracker' },
				{ property: 'og:description', content: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.' },
				{ property: 'og:url', content: 'https://mkwlog.com' },
				{ property: 'og:site_name', content: 'MKWLog' },
				{ property: 'og:image', content: '/og-image.png' },
				{ property: 'og:image:width', content: '1200' },
				{ property: 'og:image:height', content: '630' },
				{ property: 'og:image:alt', content: 'MKWLog - Mario Kart World Time Tracker' },

				// Twitter
				{ name: 'twitter:card', content: 'summary_large_image' },
				{ name: 'twitter:title', content: 'MKWLog - Mario Kart World Time Tracker' },
				{ name: 'twitter:description', content: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.' },
				{ name: 'twitter:image', content: '/og-image.png' },
				{ name: 'twitter:image:alt', content: 'MKWLog - Mario Kart World Time Tracker' },

				// Additional SEO
				{ name: 'theme-color', content: '#3b82f6' },
				{ name: 'msapplication-TileColor', content: '#3b82f6' },
			],
			link: [
				{ rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
				{ rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
				{ rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
				{ rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
				{ rel: 'manifest', href: '/site.webmanifest' },
				{ rel: 'canonical', href: 'https://mkwlog.com' },
			],
		},
	},

	fonts: {
		families: [
			{ name: 'Nunito', weights: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], subsets: ['latin'], display: 'swap' },
			{ name: 'Roboto-Mono', weights: ['400'], subsets: ['latin'], display: 'swap' },
		],
	},
	ui: {
		theme: {
			colors: ['primary', 'secondary', 'tertiary', 'info', 'success', 'warning', 'error', 'gold', 'silver', 'bronze'],
		},
	},
});
