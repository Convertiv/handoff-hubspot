#!/usr/bin/env npx tsx
/**
 * Capture test fixtures from the Handoff API.
 * 
 * This script fetches component data from the API and saves it as JSON fixtures
 * that can be used for self-contained testing without requiring API access.
 * 
 * Usage: npx tsx scripts/capture-fixtures.ts
 */
import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read config
const configPath = path.resolve(__dirname, "../handoff.config.json");
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

const FIXTURES_DIR = path.resolve(__dirname, "../tests/fixtures");

async function main() {
  // Ensure fixtures directory exists
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
  }

  const request = axios.create({
    baseURL: config.url,
    headers: { "Content-Type": "application/json" },
  });

  if (config.username && config.password) {
    request.defaults.auth = {
      username: config.username,
      password: config.password,
    };
  }

  // Fetch the component list
  console.log("Fetching component list...");
  const listResponse = await request.get("components.json");
  const components = listResponse.data;
  console.log(`Found ${components.length} components`);

  // Fetch each component's full data
  for (const component of components) {
    console.log(`  Fetching ${component.id}...`);
    try {
      const response = await request.get(`component/${component.id}.json`);
      const data = response.data;

      // Save the full component as a fixture
      // We strip the CSS and JS to keep fixtures lean — we only need
      // `code`, `properties`, and metadata for testing transpile/fields
      const fixture = {
        id: data.id,
        version: data.version,
        title: data.title,
        description: data.description,
        type: data.type,
        group: data.group,
        categories: data.categories,
        tags: data.tags,
        code: data.code,
        properties: data.properties,
      };

      const fixturePath = path.join(FIXTURES_DIR, `${data.id}.json`);
      fs.writeFileSync(fixturePath, JSON.stringify(fixture, null, 2));
      console.log(`    ✓ Saved ${fixturePath}`);
    } catch (e: any) {
      console.error(`    ✗ Failed to fetch ${component.id}: ${e.message}`);
    }
  }

  // Also save the list of all component IDs for test discovery
  const manifest = components.map((c: any) => ({
    id: c.id,
    title: c.title,
    group: c.group,
  }));
  fs.writeFileSync(
    path.join(FIXTURES_DIR, "_manifest.json"),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\nDone! Saved ${components.length} fixtures to ${FIXTURES_DIR}`);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
