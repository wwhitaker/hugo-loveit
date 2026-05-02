#!/usr/bin/env node

import fs from "node:fs/promises";

const args = process.argv.slice(2);

function getArg(name, fallback) {
  const idx = args.findIndex((arg) => arg === `--${name}`);
  if (idx === -1) return fallback;
  const value = args[idx + 1];
  if (!value || value.startsWith("--")) return fallback;
  return value;
}

function slugFromHandle(handle) {
  return handle.replace(/^@+/, "").trim();
}

function escapeTomlString(value) {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, " ")
    .trim();
}

function parseSongsFromProfileHtml(html) {
  const clipRegex = /"content_item":\{"status":"complete","title":"((?:\\.|[^"\\])*)","play_count":(\d+)[\s\S]*?"id":"([0-9a-f-]{36})","entity_type":"song_schema"/g;
  const seen = new Map();
  let match;

  while ((match = clipRegex.exec(html)) !== null) {
    const rawTitle = match[1];
    const playCount = Number(match[2]);
    const id = match[3];

    if (!id || !Number.isFinite(playCount)) continue;

    let title;
    try {
      title = JSON.parse(`"${rawTitle}"`);
    } catch {
      title = rawTitle.replace(/\\"/g, '"');
    }

    const existing = seen.get(id);
    if (!existing || playCount > existing.play_count) {
      seen.set(id, {
        id,
        title: (title || "Untitled").trim(),
        play_count: playCount,
      });
    }
  }

  return [...seen.values()];
}

function toToml(config) {
  const lines = [];
  lines.push(`profile_url = "${escapeTomlString(config.profile_url)}"`);
  lines.push(`handle = "${escapeTomlString(config.handle)}"`);
  lines.push(`section_title = "${escapeTomlString(config.section_title)}"`);
  lines.push(`section_summary = "${escapeTomlString(config.section_summary)}"`);
  lines.push(`button_label = "${escapeTomlString(config.button_label)}"`);
  lines.push("");

  for (const song of config.songs) {
    lines.push("[[songs]]");
    lines.push(`id = "${escapeTomlString(song.id)}"`);
    lines.push(`title = "${escapeTomlString(song.title)}"`);
    lines.push(`play_count = ${Number(song.play_count) || 0}`);
    lines.push("");
  }

  return `${lines.join("\n")}\n`;
}

async function main() {
  const handle = getArg("handle", "@mysticalcondensers");
  const limit = Math.max(1, Math.min(20, Number(getArg("limit", "3")) || 3));
  const outFile = getArg("out", "data/suno.toml");
  const slug = slugFromHandle(handle);
  const profileUrl = `https://suno.com/@${slug}`;

  const response = await fetch(profileUrl, {
    headers: {
      "user-agent": "Mozilla/5.0",
      accept: "text/html",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load ${profileUrl} (${response.status})`);
  }

  const html = await response.text();
  const songs = parseSongsFromProfileHtml(html)
    .sort((a, b) => b.play_count - a.play_count)
    .slice(0, limit);

  if (songs.length === 0) {
    throw new Error("No songs parsed from Suno profile HTML. The page format may have changed.");
  }

  const toml = toToml({
    profile_url: profileUrl,
    handle,
    section_title: "Top Played Music",
    section_summary: "Most-played tracks from my public Suno profile.",
    button_label: "Open Suno Profile",
    songs,
  });

  await fs.writeFile(outFile, toml, "utf8");
  console.log(`Updated ${outFile} with ${songs.length} top-played songs from ${profileUrl}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
