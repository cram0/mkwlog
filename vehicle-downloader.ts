/**
 * Vehicle Image Downloader and Validator
 * Downloads images from vehicles.json and validates against app.vue vehicle list
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

interface VehicleData {
	vehicleName: string;
	imageUrl: string;
	filename: string;
}

// Read vehicles from app.vue
function extractVehiclesFromAppVue(): string[] {
	try {
		const appVueContent = readFileSync("app.vue", "utf-8");

		// Find the vehicles array in the TypeScript section
		const vehiclesMatch = appVueContent.match(
			/const vehicles: string\[\] = \[([\s\S]*?)\];/
		);

		if (!vehiclesMatch) {
			throw new Error("Could not find vehicles array in app.vue");
		}

		// Extract vehicle names from the array
		const vehiclesString = vehiclesMatch[1];
		const vehicleMatches = vehiclesString.match(/"([^"]+)"/g);

		if (!vehicleMatches) {
			throw new Error("Could not parse vehicle names from app.vue");
		}

		return vehicleMatches.map((match) => match.replace(/"/g, ""));
	} catch (error) {
		console.error("Error reading app.vue:", error);
		return [];
	}
}

// Normalize vehicle names for comparison
function normalizeVehicleName(name: string): string {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]/g, "")
		.trim();
}

// Create filename from vehicle name
function createFilename(vehicleName: string): string {
	return (
		vehicleName
			.replace(/[^a-zA-Z0-9_-]/g, "_")
			.replace(/__+/g, "_") // Replace multiple underscores with single
			.replace(/^_|_$/g, "") + // Remove leading/trailing underscores
		".png"
	);
}

// Download image from URL
async function downloadImage(url: string, filepath: string): Promise<boolean> {
	try {
		const response = await fetch(url);
		if (!response.ok) {
			console.log(`  ❌ Failed to download: ${response.status}`);
			return false;
		}

		const buffer = await response.arrayBuffer();
		writeFileSync(filepath, new Uint8Array(buffer));
		return true;
	} catch (error) {
		console.log(`  ❌ Error downloading: ${error}`);
		return false;
	}
}

async function main() {
	console.log("🚗 Vehicle Image Downloader and Validator\n");

	// Read vehicles from app.vue
	console.log("📋 Reading vehicle list from app.vue...");
	const appVueVehicles = extractVehiclesFromAppVue();
	console.log(`Found ${appVueVehicles.length} vehicles in app.vue\n`);

	// Read vehicles.json
	console.log("📄 Reading vehicles.json...");
	let vehiclesData: VehicleData[];
	try {
		const jsonContent = readFileSync("vehicles.json", "utf-8");
		vehiclesData = JSON.parse(jsonContent);
		console.log(`Found ${vehiclesData.length} vehicles in vehicles.json\n`);
	} catch (error) {
		console.error("❌ Error reading vehicles.json:", error);
		return;
	}

	// Create downloads directory
	const downloadDir = "downloads/vehicles";
	if (!existsSync(downloadDir)) {
		mkdirSync(downloadDir, { recursive: true });
	}

	// Normalize app.vue vehicles for comparison
	const normalizedAppVehicles = appVueVehicles.map((v) => ({
		original: v,
		normalized: normalizeVehicleName(v),
	}));

	// Validate and download vehicles
	console.log("🔍 Validating and downloading vehicles...\n");
	const results = {
		downloaded: 0,
		failed: 0,
		corrected: 0,
		missing: [] as string[],
		extra: [] as string[],
	};

	// Track which app.vue vehicles we've found
	const foundVehicles = new Set<string>();

	for (let i = 0; i < vehiclesData.length; i++) {
		const vehicle = vehiclesData[i];
		const normalizedJsonName = normalizeVehicleName(vehicle.vehicleName);

		console.log(`${i + 1}/${vehiclesData.length}: ${vehicle.vehicleName}`);

		// Find matching vehicle in app.vue
		const matchingAppVehicle = normalizedAppVehicles.find(
			(av) => av.normalized === normalizedJsonName
		);

		let finalVehicleName = vehicle.vehicleName;
		let corrected = false;

		if (matchingAppVehicle) {
			foundVehicles.add(matchingAppVehicle.original);

			// Use app.vue name as higher priority
			if (matchingAppVehicle.original !== vehicle.vehicleName) {
				console.log(
					`  📝 Correcting name: "${vehicle.vehicleName}" → "${matchingAppVehicle.original}"`
				);
				finalVehicleName = matchingAppVehicle.original;
				corrected = true;
				results.corrected++;
			}
		} else {
			console.log(
				`  ⚠️  Vehicle not found in app.vue: ${vehicle.vehicleName}`
			);
			results.extra.push(vehicle.vehicleName);
		}

		// Create proper filename
		const filename = createFilename(finalVehicleName);
		const filepath = join(downloadDir, filename);

		console.log(`  📥 Downloading: ${filename}`);
		const success = await downloadImage(vehicle.imageUrl, filepath);

		if (success) {
			console.log(`  ✅ Downloaded: ${filename}`);
			results.downloaded++;
		} else {
			results.failed++;
		}

		// Update the vehicle data if corrected
		if (corrected) {
			vehiclesData[i].vehicleName = finalVehicleName;
			vehiclesData[i].filename = filename;
		}

		console.log("");
	}

	// Check for missing vehicles from app.vue
	appVueVehicles.forEach((appVehicle) => {
		if (!foundVehicles.has(appVehicle)) {
			results.missing.push(appVehicle);
		}
	});

	// Write corrected vehicles.json if changes were made
	if (results.corrected > 0) {
		console.log("💾 Writing corrected vehicles.json...");
		writeFileSync(
			"vehicles.json",
			JSON.stringify(vehiclesData, null, "\t")
		);
		console.log("✅ Updated vehicles.json with corrected names\n");
	}

	// Summary report
	console.log("📊 Summary Report:");
	console.log("==================");
	console.log(`✅ Successfully downloaded: ${results.downloaded}`);
	console.log(`❌ Failed downloads: ${results.failed}`);
	console.log(`📝 Names corrected: ${results.corrected}`);
	console.log(`⚠️  Extra vehicles in JSON: ${results.extra.length}`);
	console.log(`❓ Missing from JSON: ${results.missing.length}`);

	if (results.extra.length > 0) {
		console.log("\n🔶 Extra vehicles in JSON (not in app.vue):");
		results.extra.forEach((name) => console.log(`   - ${name}`));
	}

	if (results.missing.length > 0) {
		console.log("\n🔴 Missing vehicles (in app.vue but not in JSON):");
		results.missing.forEach((name) => console.log(`   - ${name}`));
	}

	console.log(`\n🎉 Process completed! Images saved to ./${downloadDir}/`);
}

main().catch(console.error);
