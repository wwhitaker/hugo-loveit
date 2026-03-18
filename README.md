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
event_date = "2026-03-01"
date_label = "Mar 2026"
lane = "home"          # career | home | personal
kind = "build"         # talk | build | analysis | personal
impact = 3              # 1-3
summary = "Updated speedtest collection and storage flow for clearer trend visibility."
outcome = "Shipped"
filters = ["homelab", "lessons"]
```

Notes:

- If a post has `timeline.enable = true`, the timeline uses that post metadata.
- Existing `data/timeline.toml` entries are still used as fallback during migration.
- If a post and `data/timeline.toml` entry share the same URL, the post metadata wins.
