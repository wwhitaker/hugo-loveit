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

// Suno ships the profile payload as a backslash-escaped JSON string inside the
// Next.js flight data, so song fields arrive as \"play_count\":56 rather than
// "play_count":56. Unescape one level before scanning, and keep the raw pass as
// a fallback in case they revert.
function unescapeFlightPayload(html) {
  return html.replace(/\\"/g, '"').replace(/\\\\/g, "\\");
}

// Read one balanced {...} starting at `start`, skipping over braces that sit
// inside string literals. Pulling the whole object out and JSON.parse-ing it is
// far steadier than field-order-sensitive regexes, which is how this script
// broke the last time Suno reshaped the payload.
function readBalancedObject(text, start) {
  let depth = 0;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (char === '"') {
      i += 1;
      while (i < text.length && !(text[i] === '"' && text[i - 1] !== "\\")) {
        i += 1;
      }
      continue;
    }

    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }

  return null;
}

// Suno's style tags are a mixed bag: older tracks carry a tidy genre
// ("ska", "emo alternative rock") while newer ones paste the entire style
// prompt in alongside a short one. The shortest comma-separated piece is
// reliably the human-readable genre.
function pickGenre(tags) {
  if (!tags) return "";

  const parts = String(tags)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length === 0) return "";

  const shortest = parts.reduce((a, b) => (b.length < a.length ? b : a));
  return shortest.length <= 40 ? shortest.toLowerCase() : "";
}

function scanSongObjects(text) {
  const marker = '"content_item":';
  const seen = new Map();
  let idx = text.indexOf(marker);

  while (idx !== -1) {
    const start = idx + marker.length;

    if (text[start] === "{") {
      const raw = readBalancedObject(text, start);
      if (raw) {
        let obj = null;
        try {
          obj = JSON.parse(raw);
        } catch {
          obj = null;
        }

        if (obj && obj.entity_type === "song_schema" && obj.status === "complete" && obj.id) {
          const meta = obj.metadata || {};
          const song = {
            id: obj.id,
            title: (obj.title || "Untitled").trim(),
            play_count: Number(obj.play_count) || 0,
            duration: Math.round(Number(meta.duration) || 0),
            genre: pickGenre(meta.tags),
          };

          const existing = seen.get(song.id);
          if (!existing || song.play_count > existing.play_count) {
            seen.set(song.id, song);
          }
        }
      }
    }

    idx = text.indexOf(marker, start);
  }

  return [...seen.values()];
}

function parseSongsFromProfileHtml(html) {
  const direct = scanSongObjects(html);
  return direct.length > 0 ? direct : scanSongObjects(unescapeFlightPayload(html));
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
    // play_count is no longer shown on the site — it only ever refreshed when
    // this script ran, so it read as stale. It stays in the data because the
    // unpinned tracks are still ordered by it.
    lines.push(`play_count = ${Number(song.play_count) || 0}`);
    if (Number(song.duration) > 0) {
      lines.push(`duration = ${Number(song.duration)}`);
    }
    if (song.genre) {
      lines.push(`genre = "${escapeTomlString(song.genre)}"`);
    }
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
