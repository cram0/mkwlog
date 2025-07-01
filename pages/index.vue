<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import type { TableColumn } from '@nuxt/ui';

// SEO and Meta
useSeoMeta({
	title: 'MKWLog - Mario Kart World Time Tracker',
	description: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.',
	keywords: 'Mario Kart World, time attack, lap times, racing tracker, MKW, speedrun, time trials',
	author: 'cram0',
	ogTitle: 'MKWLog - Mario Kart World Time Tracker',
	ogDescription: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.',
	ogImage: '/og-image.png',
	ogUrl: 'https://mkwlog.com',
	twitterTitle: 'MKWLog - Mario Kart World Time Tracker',
	twitterDescription: 'Track your Mario Kart World time attack progress with MKWLog. Record lap times, manage character/vehicle combos, and analyze your racing performance.',
	twitterImage: '/og-image.png',
	twitterCard: 'summary_large_image',
});

// Theme functionality
const colorMode = useColorMode();

// Theme menu items for dropdown
const themeMenuItems = computed(() => [
	[
		{
			label: 'Light',
			icon: 'i-lucide-sun',
			onSelect: () => (colorMode.preference = 'light'),
		},
		{
			label: 'Dark',
			icon: 'i-lucide-moon',
			onSelect: () => (colorMode.preference = 'dark'),
		},
		{
			label: 'System',
			icon: 'i-lucide-monitor',
			onSelect: () => (colorMode.preference = 'system'),
		},
	],
]);

// Theme icon based on current preference
const themeIcon = computed(() => {
	switch (colorMode.preference) {
		case 'light':
			return 'i-lucide-sun';
		case 'Light':
			return 'i-lucide-sun';
		case 'dark':
			return 'i-lucide-moon';
		case 'Dark':
			return 'i-lucide-moon';
		default:
			return 'i-lucide-monitor';
	}
});

// Settings functionality
const showSettingsModal = ref(false);
const enableConfetti = ref(true);

// Settings persistence
function saveSettings(): void {
	if (import.meta.client) {
		localStorage.setItem(
			'mkwlog-settings',
			JSON.stringify({
				enableConfetti: enableConfetti.value,
			})
		);
	}
}

function loadSettings(): void {
	if (import.meta.client) {
		const savedSettings = localStorage.getItem('mkwlog-settings');
		if (savedSettings) {
			const settings = JSON.parse(savedSettings);
			enableConfetti.value = settings.enableConfetti ?? true;
		}
	}
}

// Watch for settings changes
watch(enableConfetti, () => {
	saveSettings();
});

// TypeScript interfaces
interface TimeEntry {
	time: string;
	circuit: string;
	profileId: string;
	date: string;
	vehicle?: string; // Optional for backward compatibility
	character?: string; // Optional for backward compatibility
}

interface FormState {
	time: string;
	circuit: string;
	profileId: string;
}

interface EditFormState {
	time: string;
	circuit: string;
	character: string;
	vehicle: string;
}

interface Profile {
	id: string;
	name: string;
	character: string;
	characterSkin: string;
	vehicle: string;
	createdAt: string;
}

// Form state
const formState = ref<FormState>({
	time: '',
	circuit: '',
	profileId: '',
});

// Profiles array (stored in localStorage for persistence)
const profiles = ref<Profile[]>([]);

// Times array (stored in localStorage for persistence)
const times = ref<TimeEntry[]>([]);

// Confetti state
const showConfetti = ref(false);

// UI state for new design
const showCreateProfileForm = ref(false);
const selectedProfileId = ref<string>('');
const selectedCircuit = ref<string>('');

// Recent circuits tracking (stored in localStorage)
const recentCircuitsList = ref<string[]>([]);

// Reference to recent circuits element
const recentCircuitsRef = ref<HTMLElement>();

// Reference to recent circuits scroll container
const recentCircuitsScrollRef = ref<HTMLElement>();

// Reference to CSV file input
const csvFileInput = ref<HTMLInputElement>();

// Import confirmation state
const showImportConfirmation = ref(false);
const pendingImportData = ref<TimeEntry[]>([]);
const importErrorCount = ref(0);

// Reset confirmation state
const showResetConfirmation = ref(false);

// About modal state
const showAboutModal = ref(false);

// Popover state for confirmations
const deleteProfilePopover = ref<Record<string, boolean>>({});
const deleteTimePopover = ref<Record<number, boolean>>({});

// Date display preference
const showRelativeTime = ref(false);

// Filtering and pagination state
const filters = ref({
	timeSearch: '',
	character: {
		label: 'All Characters',
		disabled: true,
		class: 'italic text-dimmed',
	},
	vehicle: {
		label: 'All Vehicles',
		disabled: true,
		class: 'italic text-dimmed',
	},
	circuit: {
		label: 'All Circuits',
		disabled: true,
		class: 'italic text-dimmed',
	},
});

const currentPage = ref(1);
const itemsPerPage = ref(10);

// New combo form state
const newProfile = ref({
	character: {
		label: 'Choose your character...',
		disabled: true,
		class: 'italic text-dimmed',
	},
	characterSkin: {
		label: 'First select a character...',
		disabled: true,
		class: 'italic text-dimmed',
	},
	vehicle: {
		label: 'Choose your vehicle...',
		disabled: true,
		class: 'italic text-dimmed',
	},
});

// Circuit selection state (matching newProfile pattern)
const newCircuitSelection = ref({
	circuit: {
		label: 'Browse All Circuits...',
		disabled: true,
		class: 'italic text-dimmed',
	},
});

// Mario Kart World circuits (alphabetically ordered)
const circuits: string[] = ['Acorn Heights', 'Airship Fortress', 'Boo Cinema', "Bowser's Castle", 'Cheep Cheep Falls', 'Choco Mountain', 'Crown City', 'Dandelion Depths', 'Desert Hills', 'Dino Dino Jungle', 'DK Pass', 'DK Spaceport', 'Dry Bones Burnout', 'Faraway Oasis', 'Great Block Ruins', 'Koopa Troopa Beach', 'Mario Bros. Circuit', 'Mario Circuit', 'Moo Moo Meadows', 'Peach Beach', 'Peach Stadium', 'Rainbow Road', 'Salty Salty Speedway', 'Shy Guy Bazaar', 'Sky-High Sundae', 'Starview Peak', "Toad's Factory", 'Wario Shipyard', 'Wario Stadium', 'Whistlestop Summit'];

// Mario Kart World characters with their skins
const characterSkins: Record<string, string[]> = {
	// Main characters with multiple skins
	Mario: [
		'Mario', // Default
		'Touring',
		'Pro Racer',
		'Mechanic',
		'Dune Rider',
		'Cowboy',
		'Sightseeing',
		'Aviator',
		'Happi',
		'All-Terrain',
	],
	Luigi: [
		'Luigi', // Default
		'Touring',
		'Pro Racer',
		'Mechanic',
		'Oasis',
		'Farmer',
		'Happi',
		'All-Terrain',
		'Gondolier',
	],
	Peach: [
		'Peach', // Default
		'Touring',
		'Pro Racer',
		'Farmer',
		'Sightseeing',
		'Aviator',
		'Yukata',
		'Aero',
		'Vacation',
	],
	Daisy: [
		'Daisy', // Default
		'Touring',
		'Pro Racer',
		'Oasis',
		'Swimwear',
		'Aero',
		'Vacation',
	],
	Yoshi: [
		'Yoshi', // Default
		'Touring',
		'Pro Racer',
		'Aristocrat',
		'Soft Server',
		'Biker',
		'Swimwear',
		'Matsuri',
		'Food Slinger',
	],
	'Donkey Kong': [
		'Donkey Kong', // Default
		'All-Terrain',
	],
	Bowser: [
		'Bowser', // Default
		'Pro Racer',
		'Supercharged',
		'Biker',
		'All-Terrain',
	],
	'Bowser Jr.': [
		'Bowser Jr.', // Default
		'Pro Racer',
		'Biker Jr.',
		'Explorer',
	],
	'Koopa Troopa': [
		'Koopa Troopa', // Default
		'Runner',
		'Pro Racer',
		'Sailor',
		'All-Terrain',
		'Work Crew',
	],
	Toad: [
		'Toad', // Default
		'Pro Racer',
		'Engineer',
		'Burger Bud',
		'Explorer',
	],
	Toadette: [
		'Toadette', // Default
		'Pro Racer',
		'Conductor',
		'Soft Server',
		'Explorer',
	],
	Lakitu: [
		'Lakitu', // Default
		'Pit Crew',
		'Fisherman',
	],
	'King Boo': [
		'King Boo', // Default
		'Pro Racer',
		'Aristocrat',
		'Pirate',
	],
	'Shy Guy': [
		'Shy Guy', // Default
		'Pit Crew',
		'Slope Styler',
	],
	Wario: [
		'Wario', // Default
		'Pro Racer',
		'Oasis',
		'Wicked Wasp',
		'Biker',
		'Pirate',
		'Road Ruffian',
		'Work Crew',
	],
	Waluigi: [
		'Waluigi', // Default
		'Pro Racer',
		'Wampire',
		'Mariachi',
		'Biker',
		'Road Ruffian',
	],
	Birdo: [
		'Birdo', // Default
		'Pro Racer',
		'Vacation',
	],
	Pauline: [
		'Pauline', // Default
		'Aero',
	],
	Rosalina: [
		'Rosalina', // Default
		'Touring',
		'Pro Racer',
		'Aurora',
		'Aero',
	],
	'Baby Mario': [
		'Baby Mario', // Default
		'Pro Racer',
		'Swimwear',
		'Work Crew',
	],
	'Baby Luigi': [
		'Baby Luigi', // Default
		'Pro Racer',
		'Work Crew',
	],
	'Baby Peach': [
		'Baby Peach', // Default
		'Touring',
		'Pro Racer',
		'Sailor',
		'Explorer',
	],
	'Baby Daisy': [
		'Baby Daisy', // Default
		'Touring',
		'Pro Racer',
		'Sailor',
		'Explorer',
	],
	'Baby Rosalina': [
		'Baby Rosalina', // Default
		'Touring',
		'Pro Racer',
		'Sailor',
		'Explorer',
	],
	// Characters with only default skins
	Nabbit: ['Nabbit'],
	'Piranha Plant': ['Piranha Plant'],
	'Hammer Bro': ['Hammer Bro'],
	'Monty Mole': ['Monty Mole'],
	Goomba: ['Goomba'],
	Sidestepper: ['Sidestepper'],
	'Cheep Cheep': ['Cheep Cheep'],
	'Dry Bones': ['Dry Bones'],
	Wiggler: ['Wiggler'],
	Pokey: ['Pokey'],
	Cow: ['Cow'],
	Stingby: ['Stingby'],
	Snowman: ['Snowman'],
	Penguin: ['Penguin'],
	'Para-Biddybud': ['Para-Biddybud'],
	Spike: ['Spike'],
	Cataquack: ['Cataquack'],
	Pianta: ['Pianta'],
	'Rocky Wrench': ['Rocky Wrench'],
	Conkdor: ['Conkdor'],
	Peepa: ['Peepa'],
	Swoop: ['Swoop'],
	'Fish Bone': ['Fish Bone'],
	'Coin Coffer': ['Coin Coffer'],
	Dolphin: ['Dolphin'],
	"Chargin' Chuck": ["Chargin' Chuck"],
};

// Character options for profile creation
const characterOptions = computed(() => [
	{
		label: 'Choose your character...',
		disabled: true,
		class: 'italic text-dimmed',
	},
	...Object.keys(characterSkins).map((character) => ({
		label: character,
		avatar: { src: getCharacterImagePath(character), alt: character },
	})),
]);

// Character options for editing (returns string values)
const characterEditOptions = computed(() => [...Object.keys(characterSkins).map((character) => character)]);

// Vehicle options for editing (returns string values)
const vehicleEditOptions = computed(() => [...vehicles.map((vehicle) => vehicle)]);

// Circuit options for editing (returns string values)
const circuitEditOptions = computed(() => [...circuits.map((circuit) => circuit)]);

// Circuit options for dropdown selection
const circuitOptions = computed(() => [
	{
		label: 'Browse All Circuits...',
		disabled: true,
		class: 'italic text-dimmed',
	},
	...circuits.map((circuit) => ({
		label: circuit,
		avatar: { src: getCircuitImagePath(circuit), alt: circuit },
	})),
]);

// Get character skins for a specific character
const getCharacterSkins = (character: string): string[] => {
	return characterSkins[character] || [character];
};

// Character skin options based on selected character
const characterSkinOptions = computed(() => {
	const characterLabel = typeof newProfile.value.character === 'object' ? newProfile.value.character.label : newProfile.value.character;

	if (!characterLabel) {
		return [
			{
				label: 'First select a character...',
				disabled: true,
				class: 'italic text-dimmed',
			},
		];
	}

	const skins = getCharacterSkins(characterLabel);
	return skins.map((skin) => ({
		label: skin,
	}));
});

// Vehicle options
const vehicleOptions = computed(() => [
	{
		label: 'Choose your vehicle...',
		disabled: true,
		class: 'italic text-dimmed',
	},
	...vehicles.map((vehicle) => ({
		label: vehicle,
		avatar: { src: getVehicleImagePath(vehicle), alt: vehicle },
	})),
]);

// Check if combo can be created
const canCreateProfile = computed(() => {
	const characterLabel = typeof newProfile.value.character === 'object' ? newProfile.value.character.label : newProfile.value.character;
	const characterSkinLabel = typeof newProfile.value.characterSkin === 'object' ? newProfile.value.characterSkin.label : newProfile.value.characterSkin;
	const vehicleLabel = typeof newProfile.value.vehicle === 'object' ? newProfile.value.vehicle.label : newProfile.value.vehicle;

	// Check if all fields are filled and not placeholder values
	const isCharacterValid = characterLabel !== '' && !characterLabel.includes('Choose your character');
	const isSkinValid = characterSkinLabel !== '' && !characterSkinLabel.includes('First select a character');
	const isVehicleValid = vehicleLabel !== '' && !vehicleLabel.includes('Choose your vehicle');

	return isCharacterValid && isSkinValid && isVehicleValid;
});

// Validate time format (M:SS.mmm or M:SS or SS.mmm or just SS)
function isValidTimeFormat(timeStr: string): boolean {
	if (!timeStr || timeStr.trim() === '') return false;

	// Only allow format: M:SS.sss (minutes:seconds.milliseconds)
	const timeRegex = /^\d{1,2}:[0-5]\d\.\d{3}$/;

	// Check if it matches the strict pattern
	if (!timeRegex.test(timeStr)) return false;

	// Additional validation for parts
	const parts = timeStr.split(':');
	const minutes = parseInt(parts[0]);
	const secondsPart = parts[1].split('.');
	const seconds = parseInt(secondsPart[0]);

	return minutes >= 0 && seconds >= 0 && seconds <= 59;
}

// Check if time can be submitted
const canSubmitTime = computed(() => {
	return isValidTimeFormat(formState.value.time) && selectedCircuit.value && selectedProfileId.value;
});

// Get recent circuits from tracked list (max 8, most recent first)
const recentCircuits = computed(() => {
	return recentCircuitsList.value.slice(0, 8);
});

// Mario Kart World vehicles
const vehicles: string[] = [
	// Karts
	'Standard Kart',
	'Rally Kart',
	'Plushbuggy',
	'Baby Blooper',
	'Zoom Buggy',
	"Chargin' Truck",
	'Hot Rod',
	'Ribbit Revster',
	'Roadster Royale',
	'B Dasher',
	'Biddybuggy',
	'Tiny Titan',
	'Stellar Sled',
	'Reel Racer',
	'Bumble V',
	'Carpet Flyer',
	'Cloud 9',
	'Blastronaut III',
	'Big Horn',
	"Li'l Dumpy",
	'Mecha Trike',
	'Pipe Frame',
	'Billdozer',

	// Bikes
	'Standard Bike',
	'Rally Bike',
	'Cute Scoot',
	'Mach Rocket',
	'Hyper Pipe',
	'Tune Thumper',
	'W-Twin Chopper',
	'Fin Twin',
	'R.O.B. H.O.G.',
	'Dolphin Dasher',
	'Loco Moto',

	// ATVs
	'Funky Dorrie',
	'Junkyard Hog',
	'Lobster Roller',
	'Dread Sled',
	'Rallygator',
	'Bowser Bruiser',
];

// Computed property for sorted times (recent dates first)
const sortedTimes = computed<TimeEntry[]>(() => {
	return [...times.value].sort((a: TimeEntry, b: TimeEntry) => {
		// Sort by date from recent to oldest
		return new Date(b.date).getTime() - new Date(a.date).getTime();
	});
});

// Filter options for the dropdowns
const characterFilterOptions = computed(() => {
	const uniqueCharacters = [...new Set(times.value.map((time) => time.character).filter(Boolean))];
	return [
		{
			label: 'All Characters',
			disabled: true,
			class: 'italic text-dimmed',
		},
		...uniqueCharacters
			.filter((char): char is string => Boolean(char))
			.map((character) => ({
				label: character,
				avatar: { src: getCharacterImagePath(character), alt: character },
			})),
	];
});

const vehicleFilterOptions = computed(() => {
	const uniqueVehicles = [...new Set(times.value.map((time) => time.vehicle).filter(Boolean))];
	return [
		{
			label: 'All Vehicles',
			disabled: true,
			class: 'italic text-dimmed',
		},
		...uniqueVehicles
			.filter((vehicle): vehicle is string => Boolean(vehicle))
			.map((vehicle) => ({
				label: vehicle,
				avatar: { src: getVehicleImagePath(vehicle), alt: vehicle },
			})),
	];
});

const circuitFilterOptions = computed(() => {
	const uniqueCircuits = [...new Set(times.value.map((time) => time.circuit))];
	return [
		{
			label: 'All Circuits',
			disabled: true,
			class: 'italic text-dimmed',
		},
		...uniqueCircuits
			.filter((circuit): circuit is string => Boolean(circuit))
			.map((circuit) => ({
				label: circuit,
				avatar: { src: getCircuitImagePath(circuit), alt: circuit },
			})),
	];
});

// Computed property for filtered times
const filteredTimes = computed<TimeEntry[]>(() => {
	let filtered = sortedTimes.value;

	// Apply time search filter
	if (filters.value.timeSearch) {
		const searchTerm = filters.value.timeSearch.toLowerCase();
		filtered = filtered.filter((time) => time.time.toLowerCase().includes(searchTerm) || time.circuit.toLowerCase().includes(searchTerm) || time.character?.toLowerCase().includes(searchTerm) || time.vehicle?.toLowerCase().includes(searchTerm));
	}

	// Apply character filter
	const characterLabel = typeof filters.value.character === 'object' ? filters.value.character.label : filters.value.character;
	if (characterLabel && !characterLabel.includes('All Characters')) {
		filtered = filtered.filter((time) => time.character === characterLabel);
	}

	// Apply vehicle filter
	const vehicleLabel = typeof filters.value.vehicle === 'object' ? filters.value.vehicle.label : filters.value.vehicle;
	if (vehicleLabel && !vehicleLabel.includes('All Vehicles')) {
		filtered = filtered.filter((time) => time.vehicle === vehicleLabel);
	}

	// Apply circuit filter
	const circuitLabel = typeof filters.value.circuit === 'object' ? filters.value.circuit.label : filters.value.circuit;
	if (circuitLabel && !circuitLabel.includes('All Circuits')) {
		filtered = filtered.filter((time) => time.circuit === circuitLabel);
	}

	return filtered;
});

// Computed property for paginated times
const paginatedTimes = computed(() => {
	const startIndex = (currentPage.value - 1) * itemsPerPage.value;
	const endIndex = startIndex + itemsPerPage.value;

	return filteredTimes.value.slice(startIndex, endIndex).map((time, localIndex) => ({
		...time,
		index: startIndex + localIndex, // Global index for editing
	}));
});

// Check if there are active filters
const hasActiveFilters = computed(() => {
	const characterLabel = typeof filters.value.character === 'object' ? filters.value.character.label : filters.value.character;
	const vehicleLabel = typeof filters.value.vehicle === 'object' ? filters.value.vehicle.label : filters.value.vehicle;
	const circuitLabel = typeof filters.value.circuit === 'object' ? filters.value.circuit.label : filters.value.circuit;

	const hasCharacterFilter = characterLabel && !characterLabel.includes('All Characters');
	const hasVehicleFilter = vehicleLabel && !vehicleLabel.includes('All Vehicles');
	const hasCircuitFilter = circuitLabel && !circuitLabel.includes('All Circuits');

	return Boolean(filters.value.timeSearch || hasCharacterFilter || hasVehicleFilter || hasCircuitFilter);
});

// Function to clear all filters
function clearFilters(): void {
	filters.value = {
		timeSearch: '',
		character: {
			label: 'All Characters',
			disabled: true,
			class: 'italic text-dimmed',
		},
		vehicle: {
			label: 'All Vehicles',
			disabled: true,
			class: 'italic text-dimmed',
		},
		circuit: {
			label: 'All Circuits',
			disabled: true,
			class: 'italic text-dimmed',
		},
	};
	currentPage.value = 1;
}

// Watch for filter changes to reset pagination
watch(
	() => [filters.value.timeSearch, filters.value.character, filters.value.vehicle, filters.value.circuit],
	() => {
		currentPage.value = 1;
	}
);

// Watch for relative time preference changes to save to localStorage
watch(
	() => showRelativeTime.value,
	() => {
		if (import.meta.client) {
			localStorage.setItem('mario-kart-show-relative-time', JSON.stringify(showRelativeTime.value));
		}
	}
);

// Convert time string (e.g., "1:32.456") to seconds for comparison
function convertTimeToSeconds(timeStr: string): number {
	const parts: string[] = timeStr.split(':');
	if (parts.length === 2) {
		const minutes: number = parseInt(parts[0]);
		const seconds: number = parseFloat(parts[1]);
		return minutes * 60 + seconds;
	}
	return parseFloat(timeStr); // if only seconds
}

// Format date for display
function formatDate(date: string): string {
	return new Date(date).toLocaleDateString('en-US', {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});
}

// Format date as relative time (e.g., "2 hours ago", "today")
function formatRelativeDate(date: string): string {
	const now = new Date();
	const recordDate = new Date(date);
	const diffInMs = now.getTime() - recordDate.getTime();
	const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
	const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
	const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

	// Keep the time part for display
	const timeStr = recordDate.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
	});

	// Determine relative date part
	let relativePart = '';
	if (diffInMinutes < 1) {
		relativePart = 'Just now';
	} else if (diffInMinutes < 60) {
		relativePart = `${diffInMinutes} min ago`;
	} else if (diffInHours < 24) {
		relativePart = `${diffInHours}h ago`;
	} else if (diffInDays === 0) {
		relativePart = 'Today';
	} else if (diffInDays === 1) {
		relativePart = 'Yesterday';
	} else if (diffInDays < 7) {
		relativePart = `${diffInDays} days ago`;
	} else if (diffInDays < 30) {
		const weeks = Math.floor(diffInDays / 7);
		relativePart = weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
	} else if (diffInDays < 365) {
		const months = Math.floor(diffInDays / 30);
		relativePart = months === 1 ? '1 month ago' : `${months} months ago`;
	} else {
		const years = Math.floor(diffInDays / 365);
		relativePart = years === 1 ? '1 year ago' : `${years} years ago`;
	}

	// For "Just now", "Today", "Yesterday" show just the relative part with time
	if (diffInMinutes < 1) {
		return relativePart;
	} else if (diffInDays <= 1) {
		return `${relativePart} at ${timeStr}`;
	} else {
		return `${relativePart} (${timeStr})`;
	}
}

// Add new time
function addTime(): void {
	if (!formState.value.time || !selectedCircuit.value || !selectedProfileId.value) {
		return;
	}

	// Validate time format before adding
	if (!isValidTimeFormat(formState.value.time)) {
		return;
	}

	const newTimeSeconds = convertTimeToSeconds(formState.value.time);

	// Check if this is a new best time for this circuit
	const existingTimesForCircuit = times.value.filter((time) => time.circuit === selectedCircuit.value);
	const currentBestTime = existingTimesForCircuit.length > 0 ? Math.min(...existingTimesForCircuit.map((time) => convertTimeToSeconds(time.time))) : Infinity;

	const isNewBest = newTimeSeconds < currentBestTime;

	// Get the profile to include vehicle information
	const profile = profiles.value.find((p) => p.id === selectedProfileId.value);

	const newTime: TimeEntry = {
		time: formState.value.time,
		circuit: selectedCircuit.value,
		profileId: selectedProfileId.value,
		date: new Date().toISOString(),
		vehicle: profile?.vehicle || '', // Include vehicle information
		character: profile?.character || '', // Include character information
	};

	times.value.push(newTime);

	// Add circuit to recent circuits
	const currentList = [...recentCircuitsList.value];
	// Remove if already exists
	const existingIndex = currentList.indexOf(selectedCircuit.value);
	if (existingIndex > -1) {
		currentList.splice(existingIndex, 1);
	}
	// Add to front
	currentList.unshift(selectedCircuit.value);
	// Keep max 8
	recentCircuitsList.value = currentList.slice(0, 8);

	saveToLocalStorage();

	// Trigger confetti if new best time
	if (isNewBest) {
		triggerConfetti();
	}

	// Reset only the time input, keep selections
	formState.value.time = '';

	// Scroll recent circuits list to the left (to show the newly added circuit)
	if (recentCircuitsScrollRef.value) {
		recentCircuitsScrollRef.value.scrollTo({ left: 0, behavior: 'smooth' });
	}

	// Show success toast (if available)
	// You could add a toast notification here
}

// Remove time with confirmation
function confirmRemoveTime(index: number): void {
	times.value.splice(index, 1);

	// Close the popover
	deleteTimePopover.value[index] = false;

	saveToLocalStorage();
}

// Save to localStorage
function saveToLocalStorage(): void {
	if (import.meta.client) {
		localStorage.setItem('mario-kart-times', JSON.stringify(times.value));
		localStorage.setItem('mario-kart-profiles', JSON.stringify(profiles.value));
		localStorage.setItem('mario-kart-recent-circuits', JSON.stringify(recentCircuitsList.value));
		localStorage.setItem('mario-kart-show-relative-time', JSON.stringify(showRelativeTime.value));

		// Auto-save to CSV in the background (optional)
		autoExportToCSV();
	}
}

// Auto-export to CSV (saves to browser downloads periodically)
function autoExportToCSV(): void {
	if (times.value.length === 0) return;

	try {
		const csvData = times.value.map(timeEntryToCSV);
		const headers = ['time_of_entry', 'track', 'character', 'outfit', 'kart', 'race_time'];
		const csvContent = [
			headers.join(','),
			...csvData.map((row) =>
				headers
					.map((header) => {
						const value = row[header as keyof CSVTimeEntry];
						if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
							return `"${value.replace(/"/g, '""')}"`;
						}
						return value;
					})
					.join(',')
			),
		].join('\n');

		// Store in localStorage as backup CSV
		localStorage.setItem('mario-kart-csv-backup', csvContent);
	} catch (error) {
		console.warn('Auto CSV export failed:', error);
	}
}

// Load from localStorage
function loadFromLocalStorage(): void {
	if (import.meta.client) {
		const savedTimes: string | null = localStorage.getItem('mario-kart-times');
		if (savedTimes) {
			times.value = JSON.parse(savedTimes) as TimeEntry[];
		}

		const savedProfiles: string | null = localStorage.getItem('mario-kart-profiles');
		if (savedProfiles) {
			profiles.value = JSON.parse(savedProfiles) as Profile[];
			// Auto-select first profile if none selected
			if (profiles.value.length > 0 && !selectedProfileId.value) {
				selectedProfileId.value = profiles.value[0].id;
			}
		}

		const savedRecentCircuits: string | null = localStorage.getItem('mario-kart-recent-circuits');
		if (savedRecentCircuits) {
			recentCircuitsList.value = JSON.parse(savedRecentCircuits) as string[];
		}

		const savedShowRelativeTime: string | null = localStorage.getItem('mario-kart-show-relative-time');
		if (savedShowRelativeTime) {
			showRelativeTime.value = JSON.parse(savedShowRelativeTime) as boolean;
		}

		// Auto-select most recent circuit if any recent circuits exist
		if (recentCircuitsList.value.length > 0 && !selectedCircuit.value) {
			selectedCircuit.value = recentCircuitsList.value[0];
		} else if (times.value.length > 0 && !selectedCircuit.value) {
			// Fallback to most recent from times
			const sortedByDate = [...times.value].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
			selectedCircuit.value = sortedByDate[0].circuit;
		}

		// Save to localStorage and CSV on data changes
		saveToLocalStorage();
	}
}

// Profile management functions
function createProfile(): void {
	if (!canCreateProfile.value) return;

	const characterLabel = typeof newProfile.value.character === 'object' ? newProfile.value.character.label : newProfile.value.character;
	const characterSkinLabel = typeof newProfile.value.characterSkin === 'object' ? newProfile.value.characterSkin.label : newProfile.value.characterSkin;
	const vehicleLabel = typeof newProfile.value.vehicle === 'object' ? newProfile.value.vehicle.label : newProfile.value.vehicle;

	// Auto-generate combo name based on character and vehicle
	const comboName = `${characterLabel} + ${vehicleLabel}`;

	const newProfileObj: Profile = {
		id: `profile_${Date.now()}`,
		name: comboName,
		character: characterLabel,
		characterSkin: characterSkinLabel,
		vehicle: vehicleLabel,
		createdAt: new Date().toISOString(),
	};

	profiles.value.push(newProfileObj);
	saveToLocalStorage();

	// Auto-select the new profile
	selectedProfileId.value = newProfileObj.id;

	// Reset form and hide it
	cancelCreateProfile();
}

function confirmDeleteProfile(profileId: string): void {
	// Remove the profile
	profiles.value = profiles.value.filter((p) => p.id !== profileId);

	// Clear selection if deleted profile was selected
	if (selectedProfileId.value === profileId) {
		selectedProfileId.value = '';
	}

	// Close the popover
	deleteProfilePopover.value[profileId] = false;

	saveToLocalStorage();
}

function selectProfile(profileId: string): void {
	selectedProfileId.value = profileId;
}

function selectCircuit(circuit: string): void {
	selectedCircuit.value = circuit;

	// Add circuit to recent circuits list (prepend)
	const currentList = [...recentCircuitsList.value];
	// Remove if already exists
	const existingIndex = currentList.indexOf(circuit);
	if (existingIndex > -1) {
		currentList.splice(existingIndex, 1);
	}
	// Add to front (prepend)
	currentList.unshift(circuit);
	// Keep max 8
	recentCircuitsList.value = currentList.slice(0, 8);

	// Save to localStorage
	saveToLocalStorage();
}

function selectRecentCircuit(circuit: string): void {
	selectedCircuit.value = circuit;
	// Don't modify the recent circuits order when selecting from recent list
}

function _getProfileName(profileId: string): string {
	const profile = profiles.value.find((p) => p.id === profileId);
	return profile ? profile.name : 'Unknown';
}

function getProfileCharacter(profileId: string): string {
	const profile = profiles.value.find((p) => p.id === profileId);
	return profile ? profile.character : 'Unknown Character';
}

function cancelCreateProfile(): void {
	showCreateProfileForm.value = false;
	// Reset form
	newProfile.value = {
		character: {
			label: 'Choose your character...',
			disabled: true,
			class: 'italic text-dimmed',
		},
		characterSkin: {
			label: 'First select a character...',
			disabled: true,
			class: 'italic text-dimmed',
		},
		vehicle: {
			label: 'Choose your vehicle...',
			disabled: true,
			class: 'italic text-dimmed',
		},
	};
}

function onCharacterChange(): void {
	// Reset character skin when character changes
	if (newProfile.value.character) {
		const characterLabel = typeof newProfile.value.character === 'object' ? newProfile.value.character.label : newProfile.value.character;
		const skins = getCharacterSkins(characterLabel);
		newProfile.value.characterSkin = {
			label: skins[0],
			disabled: false,
			class: '',
		}; // Set to default (character name)
	} else {
		newProfile.value.characterSkin = {
			label: 'First select a character...',
			disabled: true,
			class: 'italic text-dimmed',
		};
	}
}

function onCircuitChange(): void {
	const circuitLabel = typeof newCircuitSelection.value.circuit === 'object' ? newCircuitSelection.value.circuit.label : newCircuitSelection.value.circuit;

	if (circuitLabel && !circuitLabel.includes('Browse All Circuits')) {
		selectCircuit(circuitLabel);
		// Reset the selection after choosing
		newCircuitSelection.value.circuit = {
			label: 'Browse All Circuits...',
			disabled: true,
			class: 'italic text-dimmed',
		};
	}
}

function getProfileVehicle(profileId: string): string {
	const profile = profiles.value.find((p) => p.id === profileId);
	return profile?.vehicle || 'Unknown Vehicle';
}

// Get display text for time confirmation
function getTimeDisplayText(index: number): string {
	const time = times.value[index];
	if (!time) return 'this time';

	const characterName = time.character || 'Unknown Character';

	return `${time.time} on ${time.circuit} by ${characterName}`;
}

// Get actual index in times array from a time entry
function getActualTimeIndex(timeEntry: TimeEntry): number {
	return times.value.findIndex((time) => time.time === timeEntry.time && time.circuit === timeEntry.circuit && time.date === timeEntry.date && time.profileId === timeEntry.profileId);
}

// Table functionality
const editingTimeId = ref<number | null>(null);
const editForm = ref<EditFormState>({
	time: '',
	circuit: '',
	character: '',
	vehicle: '',
});

// Table columns configuration
const tableColumns: TableColumn<TimeEntry & { index: number }>[] = [
	{
		accessorKey: 'time',
		header: 'Time',
		id: 'time',
	},
	{
		accessorKey: 'circuit',
		header: 'Circuit',
		id: 'circuit',
	},
	{
		accessorKey: 'profileId',
		header: 'Character',
		id: 'profile',
	},
	{
		accessorKey: 'vehicle',
		header: 'Vehicle',
		id: 'vehicle',
	},
	{
		accessorKey: 'date',
		header: 'Date',
		id: 'date',
	},
	{
		id: 'actions',
		header: 'Actions',
	},
];

// Table data with sorting and index
// Start editing a time entry
function startEdit(timeEntry: TimeEntry): void {
	// Find the actual index in the times array
	const actualIndex = getActualTimeIndex(timeEntry);

	if (actualIndex !== -1) {
		editingTimeId.value = actualIndex;
		// Get character and vehicle from the time entry or fallback to profile
		const profile = profiles.value.find((p) => p.id === timeEntry.profileId);
		editForm.value = {
			time: timeEntry.time,
			circuit: timeEntry.circuit,
			character: timeEntry.character || profile?.character || '',
			vehicle: timeEntry.vehicle || profile?.vehicle || '',
		};
	}
}

// Save edited time entry
function saveEdit(): void {
	if (!editForm.value.time || !editForm.value.circuit || !editForm.value.character || !editForm.value.vehicle || editingTimeId.value === null) {
		return;
	}

	const index = editingTimeId.value;
	times.value[index] = {
		time: editForm.value.time,
		circuit: editForm.value.circuit,
		profileId: times.value[index].profileId, // Keep original profile ID
		date: times.value[index].date, // Keep original date
		vehicle: editForm.value.vehicle,
		character: editForm.value.character,
	};

	saveToLocalStorage();
	cancelEdit();
}

// Cancel editing
function cancelEdit(): void {
	editingTimeId.value = null;
	editForm.value = {
		time: '',
		circuit: '',
		character: '',
		vehicle: '',
	};
}

// Get circuit image path
function getCircuitImagePath(circuit: string): string {
	// Convert circuit name to filename format
	const fileName = circuit.replace(/\s/g, '_').replace(/\./g, '').replace(/'/g, '');
	return `/circuits/${fileName}.png`;
}

// Get character image path
function getCharacterImagePath(character: string): string {
	// Convert character name to filename format (match character-downloader.ts logic)
	const fileName = character
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.replace(/__+/g, '_') // Replace multiple underscores with single
		.replace(/^_|_$/g, ''); // Remove leading/trailing underscores
	return `/characters/${fileName}.png`;
}

// Get vehicle image path
function getVehicleImagePath(vehicle: string): string {
	// Convert vehicle name to filename format (match vehicle-downloader.ts logic)
	const fileName = vehicle
		.replace(/[^a-zA-Z0-9_-]/g, '_')
		.replace(/__+/g, '_') // Replace multiple underscores with single
		.replace(/^_|_$/g, ''); // Remove leading/trailing underscores
	return `/vehicles/${fileName}.png`;
}

// Load data on mount
onMounted(() => {
	loadFromLocalStorage();
	loadSettings();
});

// Time input formatting functions
function formatTimeString(value: string): string {
	// Remove all non-digit characters
	const digits = value.replace(/\D/g, '');

	if (digits.length === 0) return '';

	// Limit to 7 digits max (M:SS.mmm)
	const limitedDigits = digits.slice(0, 7);

	if (limitedDigits.length <= 1) {
		// Just minutes: "1" -> "1"
		return limitedDigits;
	} else if (limitedDigits.length <= 3) {
		// Minutes and seconds: "132" -> "1:32"
		const minutes = limitedDigits.slice(0, -2);
		let seconds = limitedDigits.slice(-2);

		// Validate seconds (00-59)
		const secondsNum = parseInt(seconds);
		if (secondsNum > 59) {
			seconds = '59';
		}

		return `${minutes}:${seconds}`;
	} else {
		// Minutes, seconds, and milliseconds: "132456" -> "1:32.456"
		const minutes = limitedDigits.slice(0, -5);
		let seconds = limitedDigits.slice(-5, -3);
		const milliseconds = limitedDigits.slice(-3);

		// Validate seconds (00-59)
		const secondsNum = parseInt(seconds);
		if (secondsNum > 59) {
			seconds = '59';
		}

		return `${minutes}:${seconds}.${milliseconds}`;
	}
}

function formatTimeInput(event: Event): void {
	const target = event.target as HTMLInputElement;
	const cursorPosition = target.selectionStart || 0;
	const oldValue = target.value;
	const newValue = formatTimeString(target.value);

	// Update both the input value and model value
	target.value = newValue;
	formState.value.time = newValue;

	// Calculate new cursor position based on formatting changes
	const lengthDiff = newValue.length - oldValue.length;
	const newCursorPosition = Math.min(cursorPosition + lengthDiff, newValue.length);
	target.setSelectionRange(newCursorPosition, newCursorPosition);
}

function formatEditTimeInput(event: Event): void {
	const target = event.target as HTMLInputElement;
	const cursorPosition = target.selectionStart || 0;
	const oldValue = target.value;
	const newValue = formatTimeString(target.value);

	// Update both the input value and model value
	target.value = newValue;
	editForm.value.time = newValue;

	// Calculate new cursor position based on formatting changes
	const lengthDiff = newValue.length - oldValue.length;
	const newCursorPosition = Math.min(cursorPosition + lengthDiff, newValue.length);
	target.setSelectionRange(newCursorPosition, newCursorPosition);
}

// Confetti functions
function triggerConfetti(): void {
	if (enableConfetti.value) {
		showConfetti.value = true;
		setTimeout(() => {
			showConfetti.value = false;
		}, 3000); // Hide after 3 seconds
	}
}

function getConfettiStyle(_index: number) {
	const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'];
	const randomColor = colors[Math.floor(Math.random() * colors.length)];
	const randomDelay = Math.random() * 500; // 0-500ms delay for staggered effect
	const randomDuration = 2500 + Math.random() * 1000; // 2.5-3.5 seconds
	const randomSize = 8 + Math.random() * 6; // 8-14px

	// Cone spread: angle between -150 and +150 degrees (300 degree cone)
	const angle = (Math.random() - 0.5) * 300; // -150 to +150 degrees
	const velocity = 200 + Math.random() * 150; // 200-350px spread distance
	const rotation = Math.random() * 720; // 0-720 degrees rotation

	return {
		backgroundColor: randomColor,
		left: '50%', // Start from center
		bottom: '0px', // Start from bottom
		width: `${randomSize}px`,
		height: `${randomSize}px`,
		animationDelay: `${randomDelay}ms`,
		animationDuration: `${randomDuration}ms`,
		transform: `translateX(-50%)`,
		'--angle': `${angle}deg`,
		'--velocity': `${velocity}px`,
		'--rotation': `${rotation}deg`,
	};
}

// CSV Import/Export functionality
interface CSVTimeEntry {
	time_of_entry: string;
	track: string;
	character: string;
	outfit: string;
	kart: string;
	race_time: string;
}

// Convert TimeEntry to CSV format
function timeEntryToCSV(timeEntry: TimeEntry): CSVTimeEntry {
	const profile = profiles.value.find((p) => p.id === timeEntry.profileId);
	return {
		time_of_entry: timeEntry.date,
		track: timeEntry.circuit,
		character: timeEntry.character || profile?.character || 'Unknown Character',
		outfit: profile?.characterSkin || 'Default',
		kart: timeEntry.vehicle || profile?.vehicle || 'Standard Kart',
		race_time: timeEntry.time,
	};
}

// Convert CSV format to TimeEntry
function csvToTimeEntry(csvEntry: CSVTimeEntry): TimeEntry {
	// Find or create a profile for this combination
	let profile = profiles.value.find((p) => p.character === csvEntry.character && p.characterSkin === csvEntry.outfit && p.vehicle === csvEntry.kart);

	if (!profile) {
		// Create a new profile for this combination
		profile = {
			id: `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			name: `${csvEntry.character} (${csvEntry.outfit})`,
			character: csvEntry.character,
			characterSkin: csvEntry.outfit,
			vehicle: csvEntry.kart,
			createdAt: new Date().toISOString(),
		};
		profiles.value.push(profile);
	}

	return {
		time: csvEntry.race_time,
		circuit: csvEntry.track,
		profileId: profile.id,
		date: csvEntry.time_of_entry,
		vehicle: csvEntry.kart,
		character: csvEntry.character,
	};
}

// Export times to CSV
function exportToCSV(): void {
	if (times.value.length === 0) {
		alert('No times to export!');
		return;
	}

	const csvData = times.value.map(timeEntryToCSV);

	// Create CSV content
	const headers = ['time_of_entry', 'track', 'character', 'outfit', 'kart', 'race_time'];
	const csvContent = [
		headers.join(','),
		...csvData.map((row) =>
			headers
				.map((header) => {
					const value = row[header as keyof CSVTimeEntry];
					// Escape quotes and wrap in quotes if contains comma, quote, or newline
					if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
						return `"${value.replace(/"/g, '""')}"`;
					}
					return value;
				})
				.join(',')
		),
	].join('\n');

	// Create and download file
	const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
	const link = document.createElement('a');
	const url = URL.createObjectURL(blob);

	link.setAttribute('href', url);
	link.setAttribute('download', `mario-kart-times-${new Date().toISOString().split('T')[0]}.csv`);
	link.style.visibility = 'hidden';

	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

// Import times from CSV
function importFromCSV(event: Event): void {
	const input = event.target as HTMLInputElement;
	const file = input.files?.[0];

	if (!file) return;

	const reader = new FileReader();
	reader.onload = (e) => {
		try {
			const csvText = e.target?.result as string;
			const lines = csvText.split('\n').filter((line) => line.trim());

			if (lines.length < 2) {
				alert('CSV file appears to be empty or invalid.');
				return;
			}

			const headers = lines[0].split(',').map((h) => h.trim().replace(/"/g, ''));
			const expectedHeaders = ['time_of_entry', 'track', 'character', 'outfit', 'kart', 'race_time'];

			// Validate headers
			const hasAllHeaders = expectedHeaders.every((header) => headers.includes(header));
			if (!hasAllHeaders) {
				alert(`CSV file must contain these columns: ${expectedHeaders.join(', ')}`);
				return;
			}

			// Parse data rows
			const newTimes: TimeEntry[] = [];
			const errors: string[] = [];

			for (let i = 1; i < lines.length; i++) {
				try {
					const values = parseCSVLine(lines[i]);
					if (values.length !== headers.length) continue;

					const csvEntry: CSVTimeEntry = {
						time_of_entry: '',
						track: '',
						character: '',
						outfit: '',
						kart: '',
						race_time: '',
					};

					// Map values to headers
					headers.forEach((header, index) => {
						if (expectedHeaders.includes(header)) {
							csvEntry[header as keyof CSVTimeEntry] = values[index].replace(/"/g, '');
						}
					});

					// Validate required fields
					if (!csvEntry.track || !csvEntry.character || !csvEntry.race_time) {
						errors.push(`Row ${i + 1}: Missing required fields`);
						continue;
					}

					// Validate time format
					if (!/^\d+:\d{2}\.\d{3}$/.test(csvEntry.race_time)) {
						errors.push(`Row ${i + 1}: Invalid time format (should be M:SS.mmm)`);
						continue;
					}

					const timeEntry = csvToTimeEntry(csvEntry);
					newTimes.push(timeEntry);
				} catch {
					errors.push(`Row ${i + 1}: Parse error`);
				}
			}

			if (errors.length > 0) {
				console.warn('Import errors:', errors);
			}

			if (newTimes.length === 0) {
				alert('No valid times found in CSV file.');
				return;
			}

			// Store pending import data and show confirmation popover
			pendingImportData.value = newTimes;
			importErrorCount.value = errors.length;
			showImportConfirmation.value = true;

			// Clear the file input
			input.value = '';
		} catch (error) {
			console.error('Import error:', error);
			alert('Error reading CSV file. Please check the file format.');
		}
	};

	reader.readAsText(file);
}

// Confirm import with replace option
function confirmImportReplace(): void {
	times.value = pendingImportData.value;
	saveToLocalStorage();
	showImportConfirmation.value = false;

	const successMessage = `Successfully imported ${pendingImportData.value.length} times!`;
	const errorMessage = importErrorCount.value > 0 ? `\n\n${importErrorCount.value} rows had errors and were skipped.` : '';
	alert(successMessage + errorMessage);

	// Clear pending data
	pendingImportData.value = [];
	importErrorCount.value = 0;
}

// Confirm import with append option
function confirmImportAppend(): void {
	times.value.push(...pendingImportData.value);
	saveToLocalStorage();
	showImportConfirmation.value = false;

	const successMessage = `Successfully imported ${pendingImportData.value.length} times!`;
	const errorMessage = importErrorCount.value > 0 ? `\n\n${importErrorCount.value} rows had errors and were skipped.` : '';
	alert(successMessage + errorMessage);

	// Clear pending data
	pendingImportData.value = [];
	importErrorCount.value = 0;
}

// Cancel import
function cancelImport(): void {
	showImportConfirmation.value = false;
	pendingImportData.value = [];
	importErrorCount.value = 0;
}

// Reset all data
function confirmResetAllData(): void {
	// Clear all localStorage data
	if (import.meta.client) {
		localStorage.removeItem('mario-kart-times');
		localStorage.removeItem('mario-kart-profiles');
		localStorage.removeItem('mario-kart-recent-circuits');
		localStorage.removeItem('mario-kart-csv-backup');
		localStorage.removeItem('mario-kart-show-relative-time');
	}

	// Reset all reactive state
	times.value = [];
	profiles.value = [];
	recentCircuitsList.value = [];
	selectedProfileId.value = '';
	selectedCircuit.value = '';

	// Reset form state
	formState.value = {
		time: '',
		circuit: '',
		profileId: '',
	};

	// Reset filters
	clearFilters();

	// Reset any UI state
	showCreateProfileForm.value = false;
	editingTimeId.value = null;
	currentPage.value = 1;

	// Close the modal
	showResetConfirmation.value = false;

	// Show success feedback (you could add a toast here if available)
	console.log('All data has been reset successfully');
}

// Parse a CSV line handling quoted values
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = '';
	let inQuotes = false;
	let i = 0;

	while (i < line.length) {
		const char = line[i];

		if (char === '"') {
			if (inQuotes && line[i + 1] === '"') {
				// Escaped quote
				current += '"';
				i += 2;
			} else {
				// Toggle quote state
				inQuotes = !inQuotes;
				i++;
			}
		} else if (char === ',' && !inQuotes) {
			result.push(current);
			current = '';
			i++;
		} else {
			current += char;
			i++;
		}
	}

	result.push(current);
	return result;
}

// Trigger file input for CSV import
function triggerFileInput(): void {
	csvFileInput.value?.click();
}

// Function to get the ranking for a specific time within its circuit
function getTimeRanking(timeEntry: TimeEntry): { rank: number; medal: string; color: 'gold' | 'silver' | 'bronze' } | null {
	const key = `${timeEntry.time}-${timeEntry.circuit}-${timeEntry.character}-${timeEntry.vehicle}-${timeEntry.date}`;
	return timeRankings.value.get(key) || null;
}

// Computed property for time rankings (cached for performance)
const timeRankings = computed(() => {
	const rankings = new Map<string, { rank: number; medal: string; color: 'gold' | 'silver' | 'bronze' }>();

	// Group times by circuit
	const circuitGroups = times.value.reduce(
		(groups, time) => {
			if (!groups[time.circuit]) {
				groups[time.circuit] = [];
			}
			groups[time.circuit].push(time);
			return groups;
		},
		{} as Record<string, TimeEntry[]>
	);

	// Calculate rankings for each circuit
	Object.entries(circuitGroups).forEach(([_circuit, circuitTimes]) => {
		const sortedTimes = circuitTimes.sort((a, b) => convertTimeToSeconds(a.time) - convertTimeToSeconds(b.time));

		sortedTimes.forEach((time, index) => {
			const rank = index + 1;
			const key = `${time.time}-${time.circuit}-${time.character}-${time.vehicle}-${time.date}`;

			if (rank === 1) {
				rankings.set(key, { rank: 1, medal: '🥇', color: 'gold' }); // Gold
			} else if (rank === 2) {
				rankings.set(key, { rank: 2, medal: '🥈', color: 'silver' }); // Silver
			} else if (rank === 3) {
				rankings.set(key, { rank: 3, medal: '🥉', color: 'bronze' }); // Bronze
			}
		});
	});

	return rankings;
});
</script>

<template>
	<UApp>
		<div class="min-h-screen">
			<!-- Header with Theme Switcher -->

			<UContainer class="relative py-12">
				<div class="absolute top-6 right-6 z-10 flex items-center gap-2">
					<ClientOnly>
						<UDropdownMenu :items="themeMenuItems" :ui="{ content: 'w-32' }">
							<UButton variant="outline" color="neutral" size="sm" :icon="themeIcon" />
						</UDropdownMenu>
						<UButton variant="outline" color="neutral" size="sm" icon="i-lucide-settings" @click="showSettingsModal = true" />
					</ClientOnly>
				</div>
				<!-- Hero Section -->
				<header class="mb-12 text-center">
					<h1 class="mb-4 text-5xl font-bold font-stretch-150%">MKWLog</h1>
					<p class="text-muted mb-2 text-lg">MKWLog is a tool for tracking your Mario Kart World time attack progress</p>
				</header>

				<!-- Main Content Grid -->
				<main class="mb-12 grid gap-8 lg:gap-12 xl:grid-cols-2">
					<!-- Combo Management -->
					<section aria-labelledby="combo-section">
						<UCard variant="subtle" class="">
							<template #header>
								<div class="flex items-center justify-between">
									<h2 id="combo-section" class="font-header flex items-center gap-2 text-xl font-bold">
										<UIcon name="i-lucide-user" class="size-6" />
										Your Combos
									</h2>
									<UButton color="primary" icon="i-lucide-plus" @click="showCreateProfileForm = !showCreateProfileForm"> Add Combo </UButton>
								</div>
							</template>

							<div class="flex flex-col gap-6">
								<!-- Create Combo Form (collapsible) -->
								<div v-if="showCreateProfileForm" class="border-muted rounded-xl border p-4">
									<h3 class="mb-4 text-lg font-semibold">Create New Combo</h3>
									<div class="space-y-4">
										<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
											<UFormField label="Character" required class="space-y-2">
												<USelectMenu v-model="newProfile.character" :items="characterOptions" placeholder="Choose character..." searchable class="w-full" @update:model-value="onCharacterChange" />
											</UFormField>
											<UFormField label="Character Skin" required class="space-y-2">
												<USelectMenu v-model="newProfile.characterSkin" :items="characterSkinOptions" placeholder="Select skin..." searchable :disabled="!newProfile.character" class="w-full" />
											</UFormField>
										</div>
										<UFormField label="Vehicle" required class="space-y-2">
											<USelectMenu v-model="newProfile.vehicle" :items="vehicleOptions" placeholder="Choose vehicle..." searchable class="w-full" />
										</UFormField>

										<!-- Stats tip -->
										<div class="rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800 dark:bg-blue-900/20">
											<p class="items-center text-xs text-blue-700 dark:text-blue-300">
												Don't know what combo to try? Check out
												<UButton variant="ghost" color="primary" size="xs" icon="i-lucide-external-link" to="https://sarah.fyi/gaming/mkw/stats/" target="_blank" external class="h-auto p-1 font-bold"> sarahfyi's website </UButton>
												for cool MKW stats!
											</p>
										</div>

										<div class="flex gap-3 pt-2">
											<UButton color="primary" block icon="i-lucide-check" :disabled="!canCreateProfile" class="flex-1" @click="createProfile"> Create Combo </UButton>
											<UButton color="neutral" variant="outline" icon="i-lucide-x" class="hover: px-6 transition-all duration-200" @click="cancelCreateProfile"> Cancel </UButton>
										</div>
									</div>
								</div>

								<!-- Combo Selection Cards -->
								<div v-if="profiles.length === 0 && !showCreateProfileForm" class="flex h-full flex-col items-center justify-center text-center">
									<div class="border-muted rounded-xl border-2 border-dashed p-6">
										<UIcon name="i-lucide-user-plus" class="mx-auto mb-4 size-16" />
										<p class="mb-2 text-lg">No combos yet</p>
										<p class="text-muted text-sm">Create your first combo to start tracking times!</p>
									</div>
								</div>

								<div v-else class="space-y-3">
									<UCard v-for="profile in profiles" :key="profile.id" :class="['transform cursor-pointer border-0', selectedProfileId === profile.id ? 'ring-primary-400 bg-primary-500/30' : '']" @click="selectProfile(profile.id)">
										<div class="flex items-center justify-between">
											<!-- Character and Vehicle Info -->
											<div class="flex w-full items-center">
												<!-- Character -->
												<div class="flex basis-1/2 items-center gap-3">
													<div class="rounded-xl">
														<NuxtImg :src="getCharacterImagePath(profile.character)" :alt="profile.character" class="size-12 rounded object-contain" loading="lazy" />
													</div>
													<div>
														<p class="text-lg font-semibold">{{ profile.character }}</p>
														<!-- <p class="text-sm">{{ profile.characterSkin }}</p> -->
													</div>
												</div>

												<!-- Vehicle -->
												<div class="flex basis-1/2 items-center gap-3">
													<div class="rounded-xl">
														<NuxtImg :src="getVehicleImagePath(profile.vehicle)" :alt="profile.vehicle" class="size-12 rounded object-contain" loading="lazy" />
													</div>
													<p class="text-lg font-semibold">{{ profile.vehicle }}</p>
												</div>
											</div>

											<!-- Actions -->
											<div class="flex items-center gap-3">
												<UPopover v-model:open="deleteProfilePopover[profile.id]">
													<UButton color="error" variant="ghost" size="sm" icon="i-lucide-trash-2" class="transition-colors duration-200 hover:bg-red-50 dark:hover:bg-red-900/20" @click.stop />
													<template #content>
														<div class="max-w-xs rounded-lg p-4 shadow-xl">
															<h4 class="mb-2 text-sm font-semibold">Delete Combo</h4>
															<p class="mb-3 text-xs">Are you sure? Your existing times will remain unchanged.</p>
															<div class="flex gap-2">
																<UButton color="error" size="xs" @click="confirmDeleteProfile(profile.id)"> Delete </UButton>
																<UButton color="neutral" variant="ghost" size="xs" @click="deleteProfilePopover[profile.id] = false"> Cancel </UButton>
															</div>
														</div>
													</template>
												</UPopover>
											</div>
										</div>
									</UCard>
								</div>
							</div>
						</UCard>
					</section>

					<!-- Quick Time Entry -->
					<section aria-labelledby="time-entry-section">
						<UCard variant="subtle">
							<template #header>
								<div>
									<h2 id="time-entry-section" class="font-header flex items-center gap-2 text-xl font-bold">
										<UIcon name="i-lucide-timer" class="size-6" />
										Quick Time Entry
									</h2>
								</div>
							</template>

							<div class="space-y-6">
								<!-- Time Input -->
								<div class="text-center">
									<UInput v-model="formState.time" placeholder="0:00.000" class="h-20 text-center font-mono text-3xl font-bold" size="xl" maxlength="8" @input="formatTimeInput" @keydown.enter="addTime" />
								</div>

								<!-- Recent Circuits -->
								<div ref="recentCircuitsRef">
									<h3 class="text-muted mb-2 text-sm font-medium">
										Recent Circuits
										<span v-if="recentCircuits.length > 0" class="text-dimmed ml-1 text-xs">(scroll horizontally)</span>
									</h3>
									<div v-if="recentCircuits.length === 0" class="text-muted py-4 text-center text-sm">No recent circuits. Select a circuit from below to add it here.</div>
									<div v-else ref="recentCircuitsScrollRef" class="scrollbar-thin scrollbar-thumb-muted mb-4 overflow-x-auto p-2">
										<div class="flex min-w-max gap-4 pb-2">
											<UCard v-for="circuit in recentCircuits" :key="circuit" :class="['w-48 flex-shrink-0 cursor-pointer p-3 transition-all duration-100', selectedCircuit === circuit ? 'ring-primary bg-primary/10 dark:bg-primary/5 ring-2' : 'hover:ring-muted hover:ring-1']" @click="selectRecentCircuit(circuit)">
												<div class="text-center">
													<NuxtImg :src="getCircuitImagePath(circuit)" :alt="circuit" class="mx-auto h-24 w-24 rounded object-contain" loading="lazy" />
													<p class="text-xs font-medium">
														{{ circuit }}
													</p>
												</div>
											</UCard>
										</div>
									</div>
									<USelectMenu v-model="newCircuitSelection.circuit" :items="circuitOptions" placeholder="Browse All Circuits..." size="sm" searchable class="w-full" @update:model-value="onCircuitChange" />
								</div>

								<!-- Submit Button -->
								<UButton block color="primary" size="lg" icon="i-lucide-plus" :disabled="!canSubmitTime" class="mt-6" @click="addTime"> Add Time </UButton>

								<!-- Quick Info -->
								<div v-if="selectedProfileId && selectedCircuit" class="bg-muted rounded-lg p-3 text-center">
									<p class="text-muted flex flex-wrap items-center justify-center gap-1 text-xs">
										Logging for
										<span class="text-highlighted flex items-center gap-1 font-medium">
											<NuxtImg :src="getCharacterImagePath(getProfileCharacter(selectedProfileId))" :alt="getProfileCharacter(selectedProfileId)" class="h-3 w-3 rounded object-contain" loading="lazy" />
											{{ getProfileCharacter(selectedProfileId) }}
										</span>
										with
										<span class="text-highlighted flex items-center gap-1 font-medium">
											<NuxtImg :src="getVehicleImagePath(getProfileVehicle(selectedProfileId))" :alt="getProfileVehicle(selectedProfileId)" class="h-3 w-3 rounded object-contain" loading="lazy" />
											{{ getProfileVehicle(selectedProfileId) }}
										</span>
										on
										<span class="text-highlighted flex items-center gap-1 font-medium">
											<NuxtImg :src="getCircuitImagePath(selectedCircuit)" :alt="selectedCircuit" class="h-3 w-3 rounded object-contain" loading="lazy" />
											{{ selectedCircuit }}
										</span>
									</p>
								</div>
							</div>
						</UCard>
					</section>
				</main>

				<!-- Times Table - Full Width -->
				<section aria-labelledby="times-table-section">
					<UCard class="w-full" variant="subtle">
						<template #header>
							<div class="flex items-center justify-between">
								<h2 id="times-table-section" class="font-header flex items-center gap-2 text-xl font-bold">
									<UIcon name="i-lucide-trophy" class="size-6" />
									Your Best Times
								</h2>
								<div class="flex items-center gap-3">
									<UBadge v-if="times.length > 0" variant="soft" color="neutral">
										{{ filteredTimes.length }}
										{{ filteredTimes.length === 1 ? 'time' : 'times' }}
									</UBadge>

									<!-- CSV Import/Export -->
									<div class="flex items-center gap-2">
										<input ref="csvFileInput" type="file" accept=".csv" class="hidden" @change="importFromCSV" />
										<UTooltip text="Import CSV file with columns: time_of_entry, track, character, outfit, kart, race_time">
											<UButton variant="outline" color="neutral" size="sm" icon="i-lucide-download" @click="triggerFileInput"> Import CSV </UButton>
										</UTooltip>
										<UTooltip text="Download all your times as a CSV file with the specified column format">
											<UButton v-if="times.length > 0" variant="outline" color="neutral" size="sm" icon="i-lucide-upload" @click="exportToCSV"> Export CSV </UButton>
										</UTooltip>
									</div>

									<UButton v-if="editingTimeId !== null" variant="outline" color="neutral" size="sm" icon="i-lucide-x" @click="cancelEdit"> Cancel Edit </UButton>
								</div>
							</div>
						</template>

						<div v-if="times.length === 0" class="py-12 text-center">
							<UIcon name="i-lucide-flag" class="text-dimmed mx-auto mb-6 size-20" />
							<p class="text-muted text-lg">No times logged yet. Start racing!</p>
						</div>

						<div v-else>
							<!-- Filters -->
							<div class="mb-6 space-y-4">
								<!-- Search Times and Date Toggle -->
								<div class="flex items-center gap-4">
									<div class="w-full max-w-md">
										<UFormField label="Search Times">
											<UInput v-model="filters.timeSearch" placeholder="Search time..." icon="i-lucide-search" size="sm" clearable />
										</UFormField>
									</div>

									<!-- Date Display Toggle -->
									<!-- <div v-if="times.length > 0" class="flex items-center gap-2">
										<UFormField label="Date Format">
											<div class="flex items-center gap-2">
												<USwitch v-model="showRelativeTime" size="sm" color="primary" :checked-icon="'i-lucide-clock'" :unchecked-icon="'i-lucide-calendar'" />
												<span class="text-muted text-sm font-medium">{{ showRelativeTime ? 'Relative' : 'Absolute' }}</span>
											</div>
										</UFormField>
									</div> -->
								</div>

								<!-- Filter Options -->
								<div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
									<UFormField label="Filter by Circuit" class="w-full">
										<USelectMenu v-model="filters.circuit" :items="circuitFilterOptions" class="w-full" placeholder="All Circuits" size="sm" searchable />
									</UFormField>
									<UFormField label="Filter by Vehicle" class="w-full">
										<USelectMenu v-model="filters.vehicle" :items="vehicleFilterOptions" class="w-full" placeholder="All Vehicles" size="sm" searchable />
									</UFormField>
									<UFormField label="Filter by Character" class="w-full">
										<USelectMenu v-model="filters.character" :items="characterFilterOptions" class="w-full" placeholder="All Characters" size="sm" searchable />
									</UFormField>
								</div>

								<!-- Clear Filters -->
								<div v-if="hasActiveFilters" class="flex items-center justify-between">
									<p class="text-muted text-sm">Showing {{ paginatedTimes.length }} of {{ filteredTimes.length }} filtered times</p>
									<UButton variant="ghost" color="neutral" size="sm" icon="i-lucide-x" @click="clearFilters"> Clear Filters </UButton>
								</div>
							</div>

							<div class="overflow-x-auto">
								<UTable :data="paginatedTimes" :columns="tableColumns" class="w-full min-w-full">
									<!-- Custom slots for editable cells -->
									<template #time-cell="{ row }">
										<div v-if="editingTimeId !== null && editingTimeId === getActualTimeIndex(row.original)" class="min-w-24">
											<UInput v-model="editForm.time" placeholder="0:00.000" class="font-mono" maxlength="8" @input="formatEditTimeInput" />
										</div>
										<div v-else class="flex items-center justify-end gap-2">
											<UBadge v-if="getTimeRanking(row.original)" variant="soft" :color="getTimeRanking(row.original)?.color" size="lg" class="font-mono font-black">
												<span v-if="getTimeRanking(row.original)" class="mr-1">{{ getTimeRanking(row.original)?.medal }}</span>
												{{ row.original.time }}
											</UBadge>
											<span v-else class="text-muted font-mono">
												{{ row.original.time }}
											</span>
										</div>
									</template>

									<template #circuit-cell="{ row }">
										<div v-if="editingTimeId !== null && editingTimeId === getActualTimeIndex(row.original)" class="min-w-48">
											<USelectMenu v-model="editForm.circuit" :items="circuitEditOptions" size="sm" searchable class="w-full" />
										</div>
										<span v-else class="text-highlighted font-medium">
											{{ row.original.circuit }}
										</span>
									</template>

									<template #profile-cell="{ row }">
										<div v-if="editingTimeId !== null && editingTimeId === getActualTimeIndex(row.original)" class="min-w-48">
											<USelectMenu v-model="editForm.character" :items="characterEditOptions" size="sm" searchable class="w-full" />
										</div>
										<span v-else class="flex items-center gap-2">
											<NuxtImg :src="getCharacterImagePath(row.original.character || 'Mario')" :alt="row.original.character || 'Mario'" class="h-4 w-4 rounded object-contain" loading="lazy" />
											{{ row.original.character || 'Unknown Character' }}
										</span>
									</template>

									<template #vehicle-cell="{ row }">
										<div v-if="editingTimeId !== null && editingTimeId === getActualTimeIndex(row.original)" class="min-w-48">
											<USelectMenu v-model="editForm.vehicle" :items="vehicleEditOptions" size="sm" searchable class="w-full" />
										</div>
										<span v-else class="flex items-center gap-2">
											<NuxtImg :src="getVehicleImagePath(row.original.vehicle || 'Standard Kart')" :alt="row.original.vehicle || 'Standard Kart'" class="h-4 w-4 rounded object-contain" loading="lazy" />
											{{ row.original.vehicle || 'Standard Kart' }}
										</span>
									</template>

									<template #date-cell="{ row }">
										<span class="text-muted flex items-center gap-1 text-sm">
											<UIcon name="i-lucide-calendar" class="size-4" />
											{{ showRelativeTime ? formatRelativeDate(row.original.date) : formatDate(row.original.date) }}
										</span>
									</template>

									<template #actions-cell="{ row }">
										<div class="flex items-center gap-2">
											<div v-if="editingTimeId !== null && editingTimeId === getActualTimeIndex(row.original)" class="flex gap-1">
												<UButton variant="solid" color="primary" size="sm" icon="i-lucide-check" @click="saveEdit()" />
												<UButton variant="outline" color="neutral" size="sm" icon="i-lucide-x" @click="cancelEdit" />
											</div>
											<div v-else class="flex gap-1">
												<UButton variant="ghost" color="info" size="sm" icon="i-lucide-edit-2" @click="startEdit(row.original)" />
												<UPopover v-model:open="deleteTimePopover[getActualTimeIndex(row.original)]">
													<UButton variant="ghost" color="error" size="sm" icon="i-lucide-trash-2" />
													<template #content>
														<div class="max-w-xs p-4">
															<h4 class="mb-2 text-sm font-semibold">Delete Time</h4>
															<p class="text-muted mb-3 text-xs">
																Delete
																{{ getTimeDisplayText(getActualTimeIndex(row.original)) }}? This cannot be undone.
															</p>
															<div class="flex gap-2">
																<UButton color="error" size="xs" @click="confirmRemoveTime(getActualTimeIndex(row.original))"> Delete </UButton>
																<UButton color="neutral" variant="ghost" size="xs" @click="deleteTimePopover[getActualTimeIndex(row.original)] = false"> Cancel </UButton>
															</div>
														</div>
													</template>
												</UPopover>
											</div>
										</div>
									</template>
								</UTable>
							</div>
							<!-- End of overflow-x-auto div -->

							<!-- Pagination -->
							<div v-if="filteredTimes.length > itemsPerPage" class="border-default mt-6 flex justify-start border-t pt-4">
								<UPagination v-model:page="currentPage" :items-per-page="itemsPerPage" :total="filteredTimes.length" :sibling-count="1" show-edges />
							</div>
						</div>
						<!-- End of v-else div -->
					</UCard>
				</section>
			</UContainer>

			<!-- Footer -->
			<footer class="border-muted mt-16 border-t py-8">
				<UContainer>
					<div class="flex flex-col items-center justify-center space-y-4 text-center">
						<div class="flex items-center gap-2">
							<span class="text-muted text-sm">Made with &#9829; by</span>
							<UButton variant="ghost" color="primary" size="sm" icon="i-lucide-github" to="https://github.com/cram0" target="_blank" external class="font-semibold"> cram0 </UButton>
						</div>
						<div class="text-muted max-w-md text-xs">
							<p class="mb-1">Mario Kart and all related trademarks are property of Nintendo Co., Ltd.</p>
							<p class="mb-3">This is an unofficial project. Nintendo owns everything, I own nothing.</p>
							<p>Vehicle and character assets sourced from <UButton variant="ghost" color="primary" size="xs" to="https://game8.co" target="_blank" external class="p-0 text-xs underline">Game8</UButton>.</p>
						</div>
						<!-- Footer Buttons -->
						<div class="flex items-center gap-4 pt-2">
							<UButton variant="ghost" color="primary" size="xs" icon="i-lucide-info" class="text-xs" @click="showAboutModal = true"> About </UButton>
							<UButton variant="ghost" color="error" size="xs" icon="i-lucide-trash-2" class="text-xs" @click="showResetConfirmation = true"> Reset All Data </UButton>
						</div>
					</div>
				</UContainer>
			</footer>

			<!-- CSV Import Confirmation Modal -->
			<UModal v-model:open="showImportConfirmation">
				<template #header>
					<div class="flex items-center justify-between">
						<h3 class="text-lg font-semibold">Import CSV Times</h3>
						<UButton color="neutral" variant="ghost" icon="i-lucide-x" size="sm" @click="cancelImport" />
					</div>
				</template>

				<template #body>
					<div class="space-y-4">
						<p class="text-muted text-sm">
							Found {{ pendingImportData.length }} valid times to import.
							<span v-if="importErrorCount > 0" class="text-warning"> {{ importErrorCount }} rows had errors and were skipped. </span>
						</p>

						<p class="text-muted text-sm">Choose how to import these times:</p>

						<div class="flex flex-col gap-3">
							<UButton color="primary" variant="solid" icon="i-lucide-replace" block @click="confirmImportReplace"> Replace All Existing Times </UButton>
							<UButton color="neutral" variant="outline" icon="i-lucide-plus" block @click="confirmImportAppend"> Add to Existing Times </UButton>
							<UButton color="neutral" variant="ghost" icon="i-lucide-x" block @click="cancelImport"> Cancel Import </UButton>
						</div>
					</div>
				</template>
			</UModal>

			<!-- Reset All Data Confirmation Modal -->
			<UModal v-model:open="showResetConfirmation" title="Reset All Data">
				<template #body>
					<div class="space-y-4">
						<p class="text-muted text-sm">If you're experiencing issues with the app, resetting can help resolve them.</p>
						<div class="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
							<UIcon name="i-lucide-alert-triangle" class="size-6 flex-shrink-0 text-red-500" />
							<div>
								<p class="text-sm font-medium text-red-800 dark:text-red-200">This will delete all data stored locally.</p>
								<p class="text-xs text-red-600 dark:text-red-400">This action cannot be undone.</p>
							</div>
						</div>

						<div class="flex flex-col gap-3 pt-2">
							<UButton color="error" variant="solid" icon="i-lucide-trash-2" block @click="confirmResetAllData"> Yes, Reset Everything </UButton>
							<UButton color="neutral" variant="outline" icon="i-lucide-x" block @click="showResetConfirmation = false"> Cancel </UButton>
						</div>
					</div>
				</template>
			</UModal>

			<!-- About Modal -->
			<UModal v-model:open="showAboutModal" title="About Mario Kart World Time Logger">
				<template #body>
					<div class="space-y-4">
						<div class="space-y-3 text-sm">
							<p>This app keeps your data private :</p>

							<ul class="text-muted ml-4 list-inside list-disc space-y-1">
								<li>All your times are saved in your browser</li>
								<li>Nothing is stored anywhere else</li>
								<li>You control your own data</li>
							</ul>

							<p>
								If you want to, you can check out the source code
								<UButton variant="ghost" color="primary" trailing-icon="i-lucide-external-link" to="https://github.com/mkwlog" target="_blank" external> here </UButton>
							</p>
						</div>
					</div>
				</template>
			</UModal>

			<!-- Settings Modal -->
			<UModal v-model:open="showSettingsModal" title="Settings">
				<template #body>
					<div class="space-y-6">
						<!-- Confetti Settings -->
						<div class="space-y-3">
							<h4 class="font-medium">Animations</h4>
							<div class="flex items-center space-y-3">
								<USwitch v-model="enableConfetti" label="Confetti on Personal Best" description="Show confetti animation when you achieve a new personal best time" color="primary" />
							</div>
						</div>
					</div>
				</template>
			</UModal>

			<!-- Confetti Animation -->
			<div v-if="showConfetti" class="pointer-events-none fixed inset-0 z-50">
				<div v-for="i in 100" :key="i" class="confetti" :style="getConfettiStyle(i)" />
			</div>
		</div>
	</UApp>
</template>

<style scoped>
.confetti {
	position: absolute;
	bottom: 0;
	border-radius: 50%;
	animation: confetti-fall linear forwards;
	pointer-events: none;
}

@keyframes confetti-fall {
	0% {
		transform: translateX(-50%) translateY(0) rotate(0deg);
		opacity: 1;
	}
	100% {
		transform: translateX(-50%) translateX(calc(sin(var(--angle)) * var(--velocity))) translateY(calc(-100vh - cos(var(--angle)) * var(--velocity))) rotate(var(--rotation));
		opacity: 0;
	}
}

/* Custom scrollbar for recent circuits */
.scrollbar-thin {
	scrollbar-width: thin;
}

.scrollbar-thumb-muted::-webkit-scrollbar {
	height: 6px;
}

.scrollbar-thumb-muted::-webkit-scrollbar-track {
	background: transparent;
}

.scrollbar-thumb-muted::-webkit-scrollbar-thumb {
	background-color: var(--ui-border-muted);
	border-radius: 3px;
}

.scrollbar-thumb-muted::-webkit-scrollbar-thumb:hover {
	background-color: var(--ui-border-accented);
}
</style>
