# defingo.net

This is a personal website utilizing Hugo and the LoveIt theme.

## Search (Pagefind)

Site search uses Pagefind.

- Netlify builds run: `hugo --gc --minify && npx -y pagefind --site public`
- For local production-like output:
	1. `hugo --gc --minify`
	2. `npx -y pagefind --site public`

Then open `public/search/index.html` to test the search UI against the generated index.

## Timeline Events From Posts

Timeline events can be sourced from post front matter so you do not need to maintain a separate entries list.

Add this to any post front matter:

```toml
[timeline]
enable = true
lane = "home"          # career | home | personal
kind = "build"         # talk | build | analysis | personal
impact = 3              # 1-3
summary = "Updated speedtest collection and storage flow for clearer trend visibility."
outcome = "Shipped"
filters = ["homelab", "lessons"]
```

Optional overrides:

```toml
[timeline]
enable = true
event_date = "2026-03-01"
date_label = "Mar 2026"
title = "Speedtest Pipeline Refresh"
```

Notes:

- If a post has `timeline.enable = true`, the timeline uses that post metadata.
- If `timeline.event_date` is omitted, the timeline falls back to the post date.
- If `timeline.date_label` is omitted, the label is derived from the effective event date.
- `data/timeline.toml` is now reserved for `turning_points` that are not tied to a specific post.
