# defingo.net

This is a personal website utilizing Hugo and the LoveIt theme.

## Search (Pagefind)

Site search uses Pagefind.

- Netlify builds run: `hugo --gc --minify && npx -y pagefind --site public`
- For local production-like output:
	1. `hugo --gc --minify`
	2. `npx -y pagefind --site public`

Then open `public/search/index.html` to test the search UI against the generated index.
