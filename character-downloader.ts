/**
 * Character Image Downloader
 * Downloads character images from HTML tables (like Game8 Mario Kart character tables)
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

interface CharacterData {
	name: string;
	imageUrl: string;
	filename: string;
}

interface ValidationResult {
	codeCharacters: string[];
	downloadedImages: string[];
	missing: string[];
	extra: string[];
	matches: string[];
}

// Create filename from character name
function createFilename(characterName: string): string {
	return (
		characterName
			.replace(/[^a-zA-Z0-9_-]/g, '_')
			.replace(/__+/g, '_') // Replace multiple underscores with single
			.replace(/^_|_$/g, '') + // Remove leading/trailing underscores
		'.png'
	);
}

// Download image from URL
async function downloadImage(url: string, filepath: string): Promise<boolean> {
	try {
		console.log(`    🌐 Fetching: ${url}`);
		const response = await fetch(url);
		if (!response.ok) {
			console.log(`    ❌ HTTP Error: ${response.status} ${response.statusText}`);
			return false;
		}

		const buffer = await response.arrayBuffer();
		writeFileSync(filepath, new Uint8Array(buffer));

		// Check file size to ensure it was downloaded
		const stats = statSync(filepath);
		if (stats.size === 0) {
			console.log(`    ❌ Downloaded file is empty`);
			return false;
		}

		console.log(`    ✅ Downloaded (${Math.round(stats.size / 1024)}KB)`);
		return true;
	} catch (error) {
		console.log(`    ❌ Error downloading: ${error}`);
		return false;
	}
}

// Parse HTML table to extract character images
function parseCharacterTable(htmlContent: string): CharacterData[] {
	const characters: CharacterData[] = [];

	console.log('🔍 Parsing HTML table for character images...');

	// More flexible regex patterns to catch different table structures
	const patterns = [
		// Pattern 1: Standard table rows
		/<tr[^>]*>([\s\S]*?)<\/tr>/gi,
		// Pattern 2: Direct td elements (in case tr tags are malformed)
		/<td[^>]*>([\s\S]*?)<\/td>/gi,
	];

	for (const pattern of patterns) {
		const matches = htmlContent.match(pattern) || [];
		console.log(`  Found ${matches.length} potential containers with pattern ${pattern.source.substring(0, 20)}...`);

		for (const match of matches) {
			// Look for img tags with various attribute orders
			const imgPatterns = [
				// src before alt
				/<img[^>]+src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
				// alt before src
				/<img[^>]+alt=["']([^"']*)["'][^>]*src=["']([^"']+)["'][^>]*>/gi,
				// data-src (for lazy loading)
				/<img[^>]+data-src=["']([^"']+)["'][^>]*alt=["']([^"']*)["'][^>]*>/gi,
				// Just src (no alt)
				/<img[^>]+src=["']([^"']+)["'][^>]*>/gi,
			];

			for (let i = 0; i < imgPatterns.length; i++) {
				const imgRegex = imgPatterns[i];
				let imgMatch;

				while ((imgMatch = imgRegex.exec(match)) !== null) {
					let imageUrl: string;
					let altText: string;

					if (i === 0) {
						// src before alt
						imageUrl = imgMatch[1];
						altText = imgMatch[2] || '';
					} else if (i === 1) {
						// alt before src
						altText = imgMatch[1] || '';
						imageUrl = imgMatch[2];
					} else if (i === 2) {
						// data-src
						imageUrl = imgMatch[1];
						altText = imgMatch[2] || '';
					} else {
						// just src
						imageUrl = imgMatch[1];
						altText = '';
					}

					// Clean up alt text or extract from surrounding content
					let characterName = altText.trim();

					// If no alt text, try to extract from surrounding text
					if (!characterName) {
						// Look for text content around the image
						const textMatch = match.match(/>([^<]*[a-zA-Z][^<]*)</);
						if (textMatch) {
							characterName = textMatch[1].trim();
						}
					}

					// Clean up character name
					characterName =
						characterName
							.replace(/\s+/g, ' ')
							.replace(/[^\w\s-]/g, '')
							.trim() || 'Unknown_Character';

					// Skip if we already have this image or if URL is invalid
					const isValidUrl = imageUrl && (imageUrl.startsWith('http') || imageUrl.startsWith('//'));
					const isDuplicate = characters.some((char) => char.imageUrl === imageUrl);

					if (isValidUrl && !isDuplicate) {
						// Ensure URL is complete
						if (imageUrl.startsWith('//')) {
							imageUrl = 'https:' + imageUrl;
						}

						characters.push({
							name: characterName,
							imageUrl: imageUrl,
							filename: createFilename(characterName),
						});

						console.log(`  📸 Found: ${characterName} → ${imageUrl}`);
					}
				}
			}
		}
	}

	return characters;
}

// Download characters from HTML table
async function downloadCharacters(htmlFilePath: string): Promise<void> {
	console.log('🎮 Character Image Downloader\n');

	try {
		// Read HTML file
		console.log(`📄 Reading HTML from: ${htmlFilePath}`);
		const htmlContent = readFileSync(htmlFilePath, 'utf-8');
		console.log(`  File size: ${Math.round(htmlContent.length / 1024)}KB\n`);

		// Parse characters from table
		const characters = parseCharacterTable(htmlContent);
		console.log(`\n🎯 Found ${characters.length} character images\n`);

		if (characters.length === 0) {
			console.log('❌ No character images found in HTML table');
			console.log('💡 Make sure your HTML contains <img> tags with src attributes');
			return;
		}

		// Create downloads directory
		const downloadDir = 'downloads/characters';
		if (!existsSync(downloadDir)) {
			mkdirSync(downloadDir, { recursive: true });
			console.log(`📁 Created directory: ${downloadDir}`);
		}

		// Download each character image
		let downloaded = 0;
		let failed = 0;
		let skipped = 0;

		console.log('🚀 Starting downloads...\n');

		for (let i = 0; i < characters.length; i++) {
			const { name, imageUrl, filename } = characters[i];
			const filepath = join(downloadDir, filename);

			console.log(`${i + 1}/${characters.length}: ${name}`);
			console.log(`  💾 Filename: ${filename}`);

			// Check if file already exists
			if (existsSync(filepath)) {
				console.log(`  ⏭️  File already exists, skipping`);
				skipped++;
			} else {
				const success = await downloadImage(imageUrl, filepath);

				if (success) {
					downloaded++;
				} else {
					failed++;
				}
			}

			console.log('');
		}

		// Create a summary JSON file
		const summaryFile = join(downloadDir, 'characters-summary.json');
		writeFileSync(summaryFile, JSON.stringify(characters, null, 2));

		// Final summary
		console.log('📊 Character Download Summary:');
		console.log('==============================');
		console.log(`🎯 Characters found: ${characters.length}`);
		console.log(`✅ Successfully downloaded: ${downloaded}`);
		console.log(`⏭️  Already existed (skipped): ${skipped}`);
		console.log(`❌ Failed downloads: ${failed}`);
		console.log(`📁 Images saved to: ./${downloadDir}/`);
		console.log(`📄 Summary saved to: ./${summaryFile}`);

		if (failed > 0) {
			console.log('\n💡 Tips for failed downloads:');
			console.log('   - Check if URLs are accessible');
			console.log('   - Some images might require authentication');
			console.log('   - Try downloading failed URLs manually');
		}
	} catch (error) {
		console.error('❌ Error processing HTML file:', error);
		console.log('\n💡 Make sure the HTML file exists and is readable');
	}
}

// Extract character list from app.vue
function extractCharacterListFromCode(): string[] {
	try {
		const appVueContent = readFileSync(join(__dirname, 'app.vue'), 'utf-8');

		// Find the characterSkins object
		const characterSkinsMatch = appVueContent.match(/const characterSkins:\s*Record<string,\s*string\[\]>\s*=\s*{([\s\S]*?)};/);
		if (!characterSkinsMatch) {
			throw new Error('Could not find characterSkins definition in app.vue');
		}

		const characterSkinsContent = characterSkinsMatch[1];

		// Extract character names - handle both quoted and unquoted keys
		const lines = characterSkinsContent.split('\n');
		const characters: string[] = [];

		for (const line of lines) {
			// Try quoted strings first (handles apostrophes properly)
			const quotedMatch = line.match(/^\s*(['"])(.*?)\1\s*:/);
			if (quotedMatch) {
				characters.push(quotedMatch[2].trim());
				continue;
			}

			// Then try unquoted identifiers
			const unquotedMatch = line.match(/^\s*([^'":]+?)\s*:/);
			if (unquotedMatch) {
				const name = unquotedMatch[1].trim();
				if (name && !name.includes(' ')) {
					// Ensure it's a valid identifier
					characters.push(name);
				}
			}
		}

		return characters.sort();
	} catch (error) {
		console.error('❌ Error extracting character list from app.vue:', error);
		return [];
	}
}

// Get list of downloaded character images
function getDownloadedCharacterImages(): string[] {
	const downloadsDir = join(__dirname, 'downloads', 'characters');

	if (!existsSync(downloadsDir)) {
		return [];
	}

	try {
		const files = readdirSync(downloadsDir);
		return files
			.filter((file) => file.endsWith('.png'))
			.map((file) => file.replace('.png', '').replace(/_/g, ' '))
			.sort();
	} catch (error) {
		console.error('❌ Error reading downloads directory:', error);
		return [];
	}
}

// Validate character images against code
function validateCharacterImages(): ValidationResult {
	const codeCharacters = extractCharacterListFromCode();
	const downloadedImages = getDownloadedCharacterImages();

	// Convert both lists to normalized forms for comparison
	const normalizeForComparison = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');

	const codeNormalized = codeCharacters.map(normalizeForComparison);
	const downloadedNormalized = downloadedImages.map(normalizeForComparison);

	// Find missing characters (in code but not downloaded)
	const missing = codeCharacters.filter((char) => !downloadedNormalized.includes(normalizeForComparison(char)));

	// Find extra images (downloaded but not in code)
	const extra = downloadedImages.filter((img) => !codeNormalized.includes(normalizeForComparison(img)));

	// Find matches
	const matches = codeCharacters.filter((char) => downloadedNormalized.includes(normalizeForComparison(char)));

	return {
		codeCharacters,
		downloadedImages,
		missing,
		extra,
		matches,
	};
}

// Print validation report
function printValidationReport(): void {
	console.log('🎮 Character Validation Report');
	console.log('==============================');
	console.log('');

	const result = validateCharacterImages();

	console.log(`📋 Characters in code: ${result.codeCharacters.length}`);
	console.log(`📁 Downloaded images: ${result.downloadedImages.length}`);
	console.log(`✅ Matches: ${result.matches.length}`);
	console.log(`❌ Missing: ${result.missing.length}`);
	console.log(`➕ Extra: ${result.extra.length}`);
	console.log('');

	if (result.missing.length > 0) {
		console.log('❌ Missing character images:');
		result.missing.forEach((char) => {
			const expectedFilename = createFilename(char);
			console.log(`   • ${char} → ${expectedFilename}`);
		});
		console.log('');
	}

	if (result.extra.length > 0) {
		console.log('➕ Extra downloaded images (not in code):');
		result.extra.forEach((img) => {
			// Try to find potential matches in code characters
			const normalizeForComparison = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, '');
			const imgNormalized = normalizeForComparison(img);
			const potentialMatches = result.codeCharacters.filter((char) => {
				const charNormalized = normalizeForComparison(char);
				return charNormalized.includes(imgNormalized) || imgNormalized.includes(charNormalized);
			});

			if (potentialMatches.length > 0) {
				console.log(`   • ${img} → (possible match: ${potentialMatches.join(', ')})`);
			} else {
				console.log(`   • ${img}`);
			}
		});
		console.log('');
	}

	if (result.missing.length === 0 && result.extra.length === 0) {
		console.log('🎉 Perfect match! All characters from code have corresponding images.');
	} else {
		console.log('💡 Tips:');
		if (result.missing.length > 0) {
			console.log('   • Download missing character images or remove them from the code');
		}
		if (result.extra.length > 0) {
			console.log('   • Remove extra images, rename them, or add missing characters to the code');
		}
	}
	console.log('');

	// Show successful matches for confidence
	if (result.matches.length > 0) {
		console.log(`✅ Successfully matched characters (${result.matches.length}):`);
		result.matches.slice(0, 10).forEach((char) => {
			const downloadedFilename = createFilename(char);
			console.log(`   • ${char} → ${downloadedFilename}`);
		});
		if (result.matches.length > 10) {
			console.log(`   ... and ${result.matches.length - 10} more`);
		}
	}
}

async function main() {
	// Check command line arguments
	const args = process.argv.slice(2);

	if (args.length === 0 || args[0] === 'help' || args[0] === '--help' || args[0] === '-h') {
		console.log('🎮 Character Image Downloader');
		console.log('============================');
		console.log('');
		console.log('Usage:');
		console.log('  bun run character-downloader.ts <command>');
		console.log('');
		console.log('Commands:');
		console.log('  validate                     Check character images against app.vue');
		console.log('  <html-file>                  Download characters from HTML table');
		console.log('');
		console.log('Examples:');
		console.log('  bun run character-downloader.ts validate');
		console.log('  bun run character-downloader.ts characters.html');
		console.log('  bun run character-downloader.ts mario-roster.html');
		console.log('');
		console.log('Features:');
		console.log('  ✅ Extracts images from HTML tables');
		console.log('  ✅ Handles lazy-loaded images (data-src)');
		console.log('  ✅ Creates clean filenames from character names');
		console.log('  ✅ Skips duplicate downloads');
		console.log('  ✅ Generates summary JSON file');
		console.log('  ✅ Validates downloads against app.vue character list');
		return;
	}

	const command = args[0];

	// Handle validation command
	if (command === 'validate') {
		printValidationReport();
		return;
	}

	// Handle HTML file download
	const htmlFile = command;

	// Check if file exists
	if (!existsSync(htmlFile)) {
		console.error(`❌ File not found: ${htmlFile}`);
		console.log('💡 Make sure the HTML file path is correct');
		console.log('💡 Or use "validate" command to check existing downloads');
		return;
	}

	await downloadCharacters(htmlFile);

	// Print validation report after downloading
	console.log('');
	printValidationReport();
}

main().catch(console.error);
