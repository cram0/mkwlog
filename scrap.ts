/**
 * PNG Link Scraper
 * Fetches all PNG image links from a given webpage URL
 */

import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, basename } from "path";

interface PngLink {
	url: string;
	alt?: string;
}

async function scrapePngLinks(url: string): Promise<PngLink[]> {
	try {
		// Fetch the webpage
		const response = await fetch(url);
		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		const html = await response.text();
		const pngLinks: PngLink[] = [];
		const seenUrls = new Set<string>();

		// Get base URL for resolving relative links
		const baseUrl = new URL(url);
		const baseUrlString = `${baseUrl.protocol}//${baseUrl.host}`;

		// Find all PNG links with regex patterns
		const patterns = [
			// img src attributes
			/<img[^>]+src=["']([^"']*\.png[^"']*?)["'][^>]*>/gi,
			// a href attributes
			/<a[^>]+href=["']([^"']*\.png[^"']*?)["'][^>]*>/gi,
			// Direct PNG URLs
			/https?:\/\/[^\s<>"]+\.png/gi,
		];

		patterns.forEach((pattern) => {
			let match;
			while ((match = pattern.exec(html)) !== null) {
				let pngUrl = match[1] || match[0];

				// Resolve relative URLs
				if (pngUrl.startsWith("/")) {
					pngUrl = baseUrlString + pngUrl;
				} else if (!pngUrl.startsWith("http")) {
					pngUrl =
						url.substring(0, url.lastIndexOf("/") + 1) + pngUrl;
				}

				if (!seenUrls.has(pngUrl)) {
					seenUrls.add(pngUrl);

					// Try to get alt text for img tags
					let alt: string | undefined;
					if (pattern.source.includes("img")) {
						const imgTag = html.substring(
							match.index,
							match.index + match[0].length
						);
						const altMatch = imgTag.match(/alt=["']([^"']*)["']/i);
						alt = altMatch ? altMatch[1] : undefined;
					}

					pngLinks.push({ url: pngUrl, alt });
				}
			}
		});

		return pngLinks;
	} catch (error) {
		throw new Error(`Failed to scrape PNG links: ${error}`);
	}
}

async function downloadPngImages(
	pngLinks: PngLink[],
	downloadDir: string = "downloads"
): Promise<void> {
	// Create downloads directory if it doesn't exist
	if (!existsSync(downloadDir)) {
		mkdirSync(downloadDir, { recursive: true });
	}

	console.log(`\nDownloading ${pngLinks.length} images to ./${downloadDir}/`);

	for (let i = 0; i < pngLinks.length; i++) {
		const link = pngLinks[i];
		try {
			console.log(`Downloading ${i + 1}/${pngLinks.length}: ${link.url}`);

			const response = await fetch(link.url);
			if (!response.ok) {
				console.log(`  ❌ Failed: ${response.status}`);
				continue;
			}

			const buffer = await response.arrayBuffer();
			const filename =
				basename(new URL(link.url).pathname) || `image_${i + 1}.png`;
			const filepath = join(downloadDir, filename);

			writeFileSync(filepath, new Uint8Array(buffer));
			console.log(`  ✅ Saved: ${filename}`);
		} catch (error) {
			console.log(`  ❌ Error downloading ${link.url}: ${error}`);
		}
	}
}

// Usage example
async function main() {
	const url = process.argv[2];
	const shouldDownload =
		process.argv.includes("--download") || process.argv.includes("-d");

	if (!url) {
		console.log("Usage: node scrap.ts <URL> [--download|-d]");
		console.log("  --download, -d: Download all found PNG images");
		process.exit(1);
	}

	try {
		console.log(`Scraping PNG links from: ${url}`);
		const pngLinks = await scrapePngLinks(url);

		console.log(`\nFound ${pngLinks.length} PNG links:`);
		pngLinks.forEach((link, index) => {
			console.log(`${index + 1}. ${link.url}`);
			if (link.alt) console.log(`   Alt: ${link.alt}`);
		});

		if (shouldDownload && pngLinks.length > 0) {
			await downloadPngImages(pngLinks);
			console.log("\n🎉 Download completed!");
		} else if (!shouldDownload) {
			console.log("\nAdd --download or -d flag to download the images");
		}
	} catch (error) {
		console.error("Error:", error);
	}
}

main();
