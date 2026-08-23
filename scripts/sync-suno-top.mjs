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

// Suno now ships the profile payload as a backslash-escaped JSON string inside the
// Next.js flight data, so the song fields arrive as \"play_count\":56 rather than
// "play_count":56. Unescape one level before matching, and keep the raw pass as a
// fallback in case they revert.
function unescapeFlightPayload(html) {
  return html.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

function parseSongsFromProfileHtml(html) {
  const direct = matchSongs(html);
  return direct.length > 0 ? direct : matchSongs(unescapeFlightPayload(html));
}

function matchSongs(html) {
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

// The `pinned` list is hand-maintained in data/suno.toml, so read it back off
// the existing file and carry it through — otherwise a routine sync would drop
// the chosen ordering on the floor.
function readPinnedFromToml(toml) {
  const match = toml.match(/^pinned\s*=\s*\[([\s\S]*?)\]/m);
  if (!match) return [];
  return [...match[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
}

// Pinned songs lead, in the order listed, whether or not they charted. The rest
// fill the remaining slots by play count.
function selectSongs(songs, pinned, limit) {
  const byId = new Map(songs.map((song) => [song.id, song]));
  const lead = pinned.map((id) => byId.get(id)).filter(Boolean);
  const leadIds = new Set(lead.map((song) => song.id));
  const rest = songs
    .filter((song) => !leadIds.has(song.id))
    .sort((a, b) => b.play_count - a.play_count);

  // Never let the cap silently drop a song that was explicitly pinned.
  return [...lead, ...rest].slice(0, Math.max(limit, lead.length));
}

function toToml(config) {
  const lines = [];
  lines.push(`profile_url = "${escapeTomlString(config.profile_url)}"`);
  lines.push(`handle = "${escapeTomlString(config.handle)}"`);
  lines.push(`section_title = "${escapeTomlString(config.section_title)}"`);
  lines.push(`section_summary = "${escapeTomlString(config.section_summary)}"`);
  lines.push(`button_label = "${escapeTomlString(config.button_label)}"`);
  if (config.pinned.length > 0) {
    lines.push(`pinned = [${config.pinned.map((id) => `"${escapeTomlString(id)}"`).join(", ")}]`);
  }
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
  const parsed = parseSongsFromProfileHtml(html);

  const existing = await fs.readFile(outFile, "utf8").catch(() => "");
  const pinned = readPinnedFromToml(existing);
  const songs = selectSongs(parsed, pinned, limit);

  const missing = pinned.filter((id) => !parsed.some((song) => song.id === id));
  if (missing.length > 0) {
    console.warn(`Pinned id(s) not found on the profile, skipping: ${missing.join(", ")}`);
  }

  if (songs.length === 0) {
    throw new Error("No songs parsed from Suno profile HTML. The page format may have changed.");
  }

  const toml = toToml({
    profile_url: profileUrl,
    handle,
    section_title: "Top Played Music",
    section_summary: "Most-played tracks from my public Suno profile.",
    button_label: "Open Suno Profile",
    pinned,
    songs,
  });

  await fs.writeFile(outFile, toml, "utf8");
  console.log(`Updated ${outFile} with ${songs.length} top-played songs from ${profileUrl}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
