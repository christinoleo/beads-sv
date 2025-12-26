# beads-sv

A Svelte/SvelteKit implementation of [beads-ui](https://github.com/mantoni/beads-ui) with **multi-repo support**.

## What is this?

beads-sv provides a local web UI for [Beads](https://github.com/steveyegge/beads) - a lightweight issue tracking system designed for AI coding agents. Unlike the original beads-ui which works with a single repository, beads-sv is designed to manage **multiple repositories** from a single instance.

## Key Features

- **Multi-repo management** - Add individual repos or import an entire folder of repositories
- **Unified dashboard** - See issues across all your projects in one place
- **Per-repo beads-ui experience** - Each repository gets its own familiar beads-ui interface
- **Built with Svelte 5 & SvelteKit** - Modern, fast, reactive UI

## How it works

1. Launch a single beads-sv instance
2. Add repositories individually or import a folder containing multiple repos
3. Browse and manage issues for each repo with a beads-ui-like experience
4. View cross-repo insights and dashboards

## Developing

Install dependencies with `npm install`, then start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To create a production version of your app:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

## Related Projects

- [beads](https://github.com/steveyegge/beads) - The core Beads issue tracking system
- [beads-ui](https://github.com/mantoni/beads-ui) - Local UI for single-repo Beads (inspiration for this project)
- [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) - Terminal UI for Beads

## License

MIT
