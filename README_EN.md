<div align="center">

# dsh-workspace-plus

**Folder hierarchy, browser-style session tabs, unified status dots and a plugin settings page for the DSH sidebar**

[![GitHub release](https://img.shields.io/github/v/release/lsdt45/dsh-workspace-plus?color=2ea043&label=release)](https://github.com/lsdt45/dsh-workspace-plus/releases)
[![GitHub downloads](https://img.shields.io/github/downloads/lsdt45/dsh-workspace-plus/total?color=2ea043&label=downloads)](https://github.com/lsdt45/dsh-workspace-plus/releases)
[![DSH](https://img.shields.io/badge/DSH-0.2.x-4c6ef5)](https://github.com/lsdt45/dsh-workspace-plus)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Awesome DSH Plugin](https://awesome-dsh-plugin.com/badge.svg)](https://awesome-dsh-plugin.com)

[简体中文](README.md) · [English](README_EN.md)

</div>

---

A DSH plugin that gives the [DeepSeek Harness (DSH)](https://www.npmjs.com/package/@deepseek-ai/dsh) sidebar workspace list a **folder system** — a workspace is still one directory, but every `/` in its title becomes hierarchy, so `web/frontend` and `web/backend` group under one virtual `web` folder — plus **browser-style session tabs**, unified **status dots** and a **plugin settings page**.

- 🗂️ **Hierarchical tree** — every `/` in a workspace or session title becomes a virtual folder, arbitrarily deep; sections, pinning, time buckets and drag ordering included
- 📑 **Session tabs** — click to replace the current tab, Shift+click to open a new one, right-click for the same session menu, drag to reorder live; order survives restarts, at most 12 tabs
- 🔴 **Status dots** — one 6px dot per row: running orange breathing / pending amber / done green, mirrored in the tab strip
- 🎛️ **Plugin settings page** — switches for "Show session tabs" and "Enable status dots"; turning them off restores the shell's native header and status lights
- 📦 **Install and go** — prebuilt artifacts ship with the repo and the Release, so git installs need no build step

> **Updating**: `dsh plugin --profile desktop update dsh-workspace-plus` (use `web` for the Web profile) and restart DSH; tabs and status dots can each be toggled from Settings → Plugins → Better Workspaces.

> Fork of [KannaKuron/dsh-better-workspace](https://github.com/KannaKuron/dsh-better-workspace)

**Contents**: [Features & preview](#features--preview) · [Install](#install) · [How it works](#how-it-works) · [Develop](#develop) · [Release notes](https://github.com/lsdt45/dsh-workspace-plus/releases) · [License](#license)

```
github/                 <- virtual folder (naming only, not a real directory)
`- dsh-plan-plus        <- workspace "github/dsh-plan-plus"
dsh-workspace-plus      <- single-root workspaces sit at root
codeisland-ask-bridge
dsh-model-config
```

## Features & preview

### Session tabs

<table>
<tr>
<td align="center" width="100%"><img src="docs/screenshots/4-session-tabs.png" alt="Session tabs in the conversation header"/></td>
</tr>
</table>

Each open session owns a tab in the conversation header, above the view switcher: every chip carries a **status dot**, its title and a close button; the active chip gets a **brand-colored underline and a bold title**.

- **Opening**: a plain click on a sidebar session **replaces** the session inside the current tab; **Shift + click** opens a new tab; **New session** (the workspace `+`, the shortcut, or any host entry point) opens its own tab — labelled "New session" until the first prompt lands and the real title arrives. Tabs live in the header's leading slot and shrink with ellipsis when space runs out instead of pushing the title and actions away.
- **Context menu**: right-click a tab for the **exact same menu** as the sidebar session row (rename / archive / section / pin / fork / delete / customize / refresh…, see the Context menu section below); it reuses the sidebar's menu state instead of duplicating it.
- **Drag to reorder**: drag a chip left or right and the strip **reorders live** (the same HTML5 drag mechanism the sidebar rows use — the dragged chip is dimmed, the others step aside, and the drop only ends the gesture).
- **Persistence and limit**: tab order and the open-tab list persist in the current browser (`dsh.betterWorkspace.tabs.v1`) and return after a refresh/restart; at most 12 tabs, and the oldest retires beyond that.
- **Self-cleaning**: closing the active tab hands over to its neighbour; tabs left behind by abandoned blank "New session" pages or by archived sessions are removed automatically, so no dead chip stays clickable.
- **Can be turned off entirely**: switching "Show session tabs" off in the plugin settings page hides the strip and restores the shell's native header; switching it back on brings the same tab list back.

### Hierarchical tree

<table>
<tr>
<td align="center" width="48%"><img src="docs/screenshots/1-workspace-tree.png" alt="Hierarchical workspace tree"/></td>
<td valign="top"><b>Hierarchical tree (Projects view)</b><br/>Every <code>/</code> in a workspace title creates a virtual folder: <code>github/dsh-plan-plus</code> automatically groups under <code>github</code>, arbitrarily deep; workspaces without a <code>/</code> (like <code>dsh-workspace-plus</code>) stay at the root. Renaming a workspace re-derives the tree <b>instantly</b> — folders are a projection of names, there is no second source of truth.</td>
</tr>
</table>

### Add flow: pick a folder, then click a section and a group

After you pick a directory, the small dialog offers two destinations that are both **clicked out of a real list** — no typing-only native datalist:

- **Section**: the trigger opens the section list, one click selects one (including "No section (Projects)"), and "New section…" creates one inline with the workspace — cancelling the dialog never leaves an empty section behind.
- **Name-path group**: free text (e.g. `web`) with clickable suggestions for existing levels, a "New group “…”" row, and a "No nesting (root)" row.

Both controls now share one shape — a box with the chevron INSIDE its right edge — and both lists are floating panels: the dialog keeps its height while one is open, the modal card's rounded clip cannot crop them, and the bottom "name-path group" field opens upward when space is tight so the footer buttons stay visible. With a list open, Escape closes only that list; a click or ↑/↓/Home/End selects. A live preview under the fields shows the resulting title and whether the workspace joins a section. On confirm the plugin creates the workspace, writes the group prefix into its title, and places it in the chosen section. The conversation empty-state "Add workspace" menu uses the same interaction.

### Folder create/delete via context menu

Right-click any folder row: new subfolder (parent prefix pre-filled), new workspace here (the add-flow group field pre-fills with this folder), rename folder, delete empty folder — no standalone header button. Explicit empty folders persist in the browser until workspaces live inside them.

### Search

The sidebar search button (header icon, or the magnifier in the collapsed rail) opens a **floating search panel centred in the window**, in the Codex App style:

- **Title matches (instant)**: sessions whose title or workspace label contains the query, newest first;
- **Content matches (Host full-text)**: after a short debounce the panel also asks the Host's session full-text search (`sessions.search`, SQLite FTS5); sessions that only matched message history are appended with their snippet on a second line;
- **Keyboard**: ↑/↓ to move, Enter to open, Esc to close, ⌃/⌘ + 1–9 to open one of the first nine results; hovering and clicking work too;
- Opening lists **recent sessions** first; the panel degrades to title-only matching when the Host has no content index.

> This replaces the old inline filter row. The panel rides the shell's `shell.overlay` seat, so the sidebar width never clips it.

**Content matches need the Host's full-text index.** DSH ships it off (`openAt: never`; exact reads stay available), and the panel then stays title-only. To turn content search on, append this row to the profile's `cordis.patch.yml` and restart DSH:

```yaml
- id: session-query-sqlite
  config:
    path: !!js dshHomePath('storages/session-search.db')
    openAt: first-search
```

### Workspace and session sections

<table>
<tr>
<td align="center" width="55%"><img src="docs/screenshots/9-workspace-sections.png" alt="Workspace and session sections menu"/></td>
<td valign="top" width="45%">
  <b>Independent Section Management</b><br/>
  Right-click a workspace or session → <b>Section</b> to choose an existing section, <b>Ungrouped (Projects)</b> or <b>New section…</b>.<br/><br/>
  A session action moves only that session; a workspace action moves the workspace and all its sessions together. Sessions can restore original placement by choosing <b>Follow workspace</b>.<br/><br/>
  Sections have one level, can be collapsed, and accept drag & drop from workspaces and sessions.
</td>
</tr>
</table>

Right-click a workspace or session → **Section**, then choose an existing section, **Ungrouped (Projects)** or **New section…**. A session action moves only that session. A workspace action moves the workspace and all its sessions, including previously sectioned sessions. Sessions can choose **Follow workspace** to restore their original placement. Creation assigns the right-clicked object; section-heading menus can create an empty section. Section creation and session forking are available through context menus, with no toolbar entries.

Sections have one level and share the same list for workspaces and sessions. Individually sectioned sessions appear directly under their section with a workspace badge. Section headings collapse. Drag a workspace or session onto a section heading to move it, or onto Projects to ungroup it. Empty and collapsed sections accept drops and expand afterward. Pinned, archived and unassigned sessions also support section moves. Recency sorting preserves local section moves without changing host order.

Workspaces and sessions have separate ID-based membership without changing names, directories or host workspace/session associations. Section-heading menus offer rename and confirmed deletion; deleting a section moves its workspaces back to Projects and individually sectioned sessions back to their workspace. Sections and collapse state persist in the current browser. Sections appear in workspace-tree and workspace views; flat and time views continue to flatten sessions. Existing title-based folders remain under Projects, while custom sections show full workspace names.

### View settings

<table>
<tr>
<td align="center" width="45%"><img src="docs/screenshots/6-time-view.png" alt="Time view timeline"/></td>
<td valign="top" width="55%">
  <img src="docs/screenshots/7-view-switch.png" alt="Sidebar view switch menu"/><br/><br/>
  <b>One-click view switching</b><br/>
  The header button previews the active workspace, tree, list or calendar view. Its menu separates grouping, sorting and archive filters; **Settings → Plugins → dsh-workspace-plus** exposes the same choices (see the Plugin settings page section below).<br/><br/>
  <b>Time view (Global timeline)</b><br/>
  ONE global timeline across all projects — every visible session joins the same stream, bucketed by <b>today / yesterday / last 7 days / last 30 days / earlier</b> (local calendar days), empty buckets hidden; direction is <b>latest / oldest first</b>. On hover, the relative timestamp swaps for its workspace badge (and the pin button appears), with a Codex-style hover card pinned to the row's right edge and vertically centred on it (it flips to the left when short of room and only falls back below/above in a very narrow window); the plugin owns that bubble, so it withdraws the moment the pointer leaves, the row re-sorts away or the list scrolls.
</td>
</tr>
</table>

- **Workspace tree** (default): title-based folders, single-chain merging and custom appearance.
- **Workspace**: full workspace names displayed flat within independent groups and Projects. Switching views or reordering across name groups never renames a workspace.
- **Single list**: sessions across workspaces, with a workspace badge on hover. Manual order follows host workspace and session order; drag in a workspace view to adjust it.
- **Time**: global date buckets with latest-first or oldest-first ordering across buckets.
- **Sorting**: manual or recently updated, independent of grouping. Recency sorts workspaces, folders and sessions by visible session activity without changing host order; manual mode restores that order. Automatic sorting, flat and time views disable drag reordering. The pinned tray keeps pin-recency order.
- **Archive filter**: hide archived (default), all conversations, or archived only; shared by every view and the floating search panel. Archived-only mode omits empty workspaces and folders, with a show-all action for empty results. Archived rows have a badge and hover/context-menu restore actions; unarchive before opening. Restore is disabled when an older host lacks the action.
- Preferences persist per browser; legacy projects/time and sorting preferences remain compatible.

### Plugin settings page

<table>
<tr>
<td align="center" width="52%"><img src="docs/screenshots/13-plugin-config.png" alt="Settings → Plugins → dsh-workspace-plus"/></td>
<td valign="top" width="48%">
  <b>Settings → Plugins → dsh-workspace-plus</b><br/>
  The plugin owns a configuration page in Settings (the plugin version sits next to its name), so nothing has to be hunted down in a sidebar menu:<br/><br/>
  <b>Display</b>: four switches — <b>Show session tabs</b> (off restores the shell's native header layout completely), <b>Enable status dots</b> (off hands the sidebar back to the host's native status lights and hides the dots in the tab strip), single-chain collapsing, and the status breathing light.<br/><br/>
  <b>View</b>: grouping (workspace / workspace tree / flat list / time), sorting (manual / recently updated), time direction (latest / oldest first), and archive filter (hide archived / all conversations / archived only).<br/><br/>
  It reads and writes the same preferences as the sidebar's view menu — a change on either side applies immediately and persists in the current browser.
</td>
</tr>
</table>

### Session pinning

<table>
<tr>
<td align="center" width="45%"><img src="docs/screenshots/8-pinned-tray.png" alt="Global pinned section"/></td>
<td valign="top" width="55%">
  <b>Global Pinned Tray</b><br/>
  Right-click → Pin / Unpin, or click the pin button on row hover, for any session including ungrouped ones.<br/><br/>
  The <b>global Pinned section</b> stays at the very top: cross-workspace aggregation, most-recent pin first, each row tagged with its workspace name, click opens it directly (switching workspaces); a pinned session is <b>hidden inside its workspace / the ungrouped area</b> (tray-only — unpinning restores it), and a collapsed workspace row keeps a pin-count badge.<br/><br/>
  Pinned rows carry a small brand-colored pin glyph, subtle tint and a left accent bar, stacking cleanly with the current-session highlight. Pure display-layer projection (never alters titles or host order), persists across restarts, auto-unpins hard-deleted sessions, and keeps archived pins out of the tray. When archives are shown, they appear as ordinary rows; unarchiving restores their saved pin.
</td>
</tr>
</table>

### Drag & drop

Drag a workspace row above/below another to reorder (writes back the host order) or onto a folder row to move it into that group; drag session rows to reorder within the same workspace, or onto a session group to move. While dragging a workspace, merged single-chain rows temporarily re-expand into folder rows — every level of the path becomes a drop target, and chains merge back when the drag ends. Display order = host manual order, drag results are visible immediately (automatic sorting, flat/time views, archived rows and pinned rows never act as reorder surfaces).

### Status at a glance

<table>
<tr>
<td align="center" width="45%"><img src="docs/screenshots/10-status-dots.png" alt="Status dots and the current-session highlight"/></td>
<td valign="top" width="55%">
  <b>One 6px status dot for every state</b><br/>
  <b>Running</b>: the plugin-drawn orange <code>#ff9f45</code> breathing dot, also covering "<b>{n} subagent(s) running</b>"; <b>waiting for approval / plan review / answer</b>: amber <code>#d29922</code>; <b>completed, unread</b>: green <code>#3fb950</code>. Read sessions draw no dot, and <b>the session on screen never shows the green completion reminder, even the moment it finishes</b>. All three dots share one diameter, so a status change never makes rows jump, and orange never reads as the amber "waiting for you" dot next to it. Sessions with active scheduled tasks show an alarm-clock badge (matching official rows). The current session additionally gets a row highlight that stacks with the pin accent.<br/><br/>
  <b>Can be turned off entirely</b>: switching "Enable status dots" off in the plugin settings page restores the host's native status-light style and hides the dots in the tab strip; switching it back on brings the unified 6px dots back.<br/><br/>
  <b>Status breathing light</b> (toggleable in the plugin settings page): status dots hidden by a collapse bubble outward — workspace/folder rows breathe on their icon in the status color (custom-glow labels breathe along), session-group rows show a breathing dot; the running orange breathes only on the session row itself and never relays, and with the light off it is a static orange dot.
</td>
</tr>
</table>

### Appearance customization

<table>
<tr>
<td align="center" width="58%"><img src="docs/screenshots/3-appearance-dialog.png" alt="Appearance dialog with live preview"/></td>
<td valign="top"><b>Appearance customization</b><br/>Right-click any row (workspace folder / workspace / session / session group) → Customize: color (9 swatches + native picker + RGB input), glow strength (0–14 slider, text glow only), font weight (regular/medium/semibold/bold), font shadow toggle, an icon grid (71 icons: 3 folder-glyph modes + 68 dsh primitives icons; icons apply to workspace &amp; workspace-folder rows only), with a live preview at the bottom. Reset returns to default in one click.</td>
</tr>
<tr>
<td align="center" width="58%"><img src="docs/screenshots/2-customized-tree.png" alt="Custom appearance result"/></td>
<td valign="top"><b>Applied immediately</b><br/>Color, text glow, font weight, shadow and icon apply per row and persist, together with expansion state, via the dsh client store in the current browser.</td>
</tr>
</table>

### Single-chain collapse

A toggle in the plugin settings page (on by default): a level with exactly one child merges into one row (e.g. `level1` holding `AI trade` renders as `level1/AI trade`); with multiple children it re-expands into a tree; during workspace drags it temporarily re-expands so any level is a drop target.

### Native capabilities kept

- Session rows: open / rename / fork / archive; per-workspace new session (the + button always expands the workspace first so the new session is immediately visible, and the tab strip opens a tab for it); current-session highlight; ungrouped-session fallback.
- **Slash-bearing titles never nest from URLs**: when a host-generated session title lands containing `/` (e.g. echoing a pasted URL), it is auto-wrapped in `“”` and shown verbatim — only for sessions **created after this launch**, and only once the name stays stable for ~20s (letting the native AI naming land first); pre-existing sessions and your manually named `/` groupings are never touched. Quotes (manual ones too) never split on `/`, and a lone quote is just an ordinary character; unquoted URL tails still fall back flat.
- zh/en localization follows the UI language; session rows show a relative time at the tail (yields on hover).

### Context menu

<table>
<tr>
<td align="center" width="40%"><img src="docs/screenshots/5-context-menu.png" alt="Session context menu"/></td>
<td valign="top" width="60%">
  <b>Session context menu</b><br/>
  Context menus organize operations into structured sections:
  <ul>
    <li><b>Session lifecycle</b>: Rename, archive, partition (move to section / create section / follow workspace), delete session (permanent deletion with red highlight and confirmation).</li>
    <li><b>Paths & files</b>: Open in file manager, copy working directory, copy session ID.</li>
    <li><b>Fork & persistence</b>: Fork session (opens the new branch immediately), pin (quick toggle to the pinned section).</li>
    <li><b>Custom appearance</b>: Customize appearance (per-session color, text glow, font weight, and text shadow).</li>
    <li><b>Utilities</b>: Refresh (supports <code>Ctrl+R</code> shortcut).</li>
  </ul>
</td>
</tr>
<tr>
<td align="center" width="40%"><img src="docs/screenshots/11-context-menu-sections.png" alt="Session context menu with the section submenu"/></td>
<td valign="top" width="60%">
  <b>"Section" is a second-level menu</b><br/>
  The Section entry opens a submenu: move into an existing section, <b>Follow workspace</b> (drop the independent section), or <b>New section…</b> inline. Sections share the same data as the sidebar and the tree header, and the check mark shows the current membership.
</td>
</tr>
</table>

Workspace context menus offer rename, delete and customize. Folder menus offer new subfolder, new workspace here, rename group (updates all descendant workspaces), delete empty group and customize. Session groups offer rename and customize.

Directory actions prefer the target session's `cwd`, falling back to its workspace path; unassigned sessions can use their own directory. Archived sessions offer restore, delete, directory and copy actions.

Permanent deletion is implemented by this plugin's own host half (`POST /dsh-workspace-plus/delete-session`; DSH ships archive but no delete RPC), so no third-party plugin is required. After the confirmation the host stops a running task, detaches the live session, and removes only a directory that sits under `DSH_HOME/sessions` and is named exactly after the session id, then cleans the projection cache and workspace accounting. Successful deletion clears the plugin's pin entry and refreshes the session list; a refusal (missing directory, subagent session, no persistence service, out-of-root path) reports the failing step and reason.

## Install

Install the plugin into your active DSH profile. Typically `desktop` for desktop builds or `web` for web builds.

```bash
# DSH Desktop
dsh plugin --profile desktop add https://github.com/lsdt45/dsh-workspace-plus.git

# DSH Web
dsh plugin --profile web add https://github.com/lsdt45/dsh-workspace-plus.git
```

Restart DSH after installing.

> The plugin declares DSH `>=0.2.0-rc.1 <0.3.0-0` in [package.json](package.json) → `engines.dsh`; on a mismatched runtime DSH reports it as incompatible at install/load time (an exact-version exemption can be granted with `dsh plugin allow-version`).

### Update

Plugins installed from Git can be updated per profile:

```bash
dsh plugin --profile desktop update dsh-workspace-plus
```

If using a web profile, replace `desktop` with `web`. Restart DSH after updating.

### Local source preview

Replace the path with the absolute path to your local repository:

```bash
dsh plugin --profile desktop add /absolute/path/to/dsh-workspace-plus
```

The local folder is linked into the profile as a `link:` dependency. Edits take effect on restart. For web profiles, use `--profile web`.

### Uninstall

```bash
dsh plugin --profile desktop remove dsh-workspace-plus
```

Restart DSH after removal. For web profiles, use `--profile web`.

## How it works

The sidebar browsing region is the public `sidebar.workspaces` slot; this plugin registers the same slot with a lower priority and replaces the shipped browser with the tree. All data flows through the slot's standard snapshot hooks and injected host actions — no private APIs.

The add flow lands in the seam dsh designed for third parties: the two `directoryFlow` holes. The trigger, busy semantics, and error dialog stay official; this plugin owns everything between the trigger and the adopted path — exactly enough room for pick → section/group popup → create → prefixed rename → section placement.

Both hosts must reach the section and group data: besides passing the store directly whenever this plugin occupies `sidebar.workspaces`, each directory-flow seat now declares the same store seat (`store: viewStore`, all at root scope, so the renderer reuses one instance per handle+scope). A flow hosted by the official shell therefore still lists sections and existing groups.

Session tabs stay on public API too: the strip lives in the conversation header's public `conversation.header.leading` slot (root scope — nothing session-specific, so switching sessions does not remount it), and the tab list persists in the plugin's own tiny store.

"Which session is on screen" is not read from the session-list snapshot (it has no `current` field): it comes from the `mainView` retention count on each session summary — the same marker the shipped sidebar uses. That is what lets the strip follow **every** navigation path — new session, shortcut, command palette, fork — so a fresh blank session gets a new tab while ordinary navigation swaps the current one.

View state (folder collapse, session expansion, explicit empty folders, tab order), custom styling and plugin settings persist browser-side (`dsh.betterWorkspace.view.v1`, `dsh.betterWorkspace.tabs.v1`). Note: the view store's hydration replaces the whole value without merging defaults — after an upgrade, a stale state keeps its old shape and missing keys fall back to defaults.

## Develop

### Build

The whole plugin is a TypeScript project: the browser half's sources live in `src/client/**` (`src/client/index.ts` is the
bundle entry) and the host half in `src/index.ts`. `scripts/build.ts` uses esbuild to produce `dist/client.js`
(+ sourcemap) and `dist/index.js`. The DSH client module table accepts exactly one bundle per package
(`exports["./client"]`, flat module graph), so split sources must be bundled back into one artifact. The artifacts are
committed, which keeps git/tarball installs build-free. Development requires Node ≥ 22.18: the build script and the tests
run `.ts` directly through the native type-stripping support (no ts-node / tsx).

```bash
npm run build     # sources -> dist/client.js (+ .map) + dist/index.js, atomic replace
npm run dev       # watch src/client/** and src/index.ts, repackage on change (the host polls the artifact; HMR reloads it)
npm run check     # fail when the committed dist/ is out of sync with the TypeScript sources
npm run typecheck # tsc --noEmit: full type check over src / tests / scripts
npm test          # node --test: pure-logic units + artifact contract + render smoke + architecture guards
npm run verify    # typecheck + build + check + test
npm pack          # tarball for local install verification (prepack builds and checks first)
```

**Never edit anything under `dist/` by hand** — edit `src/**/*.ts` and run `npm run dev` (or `npm run build`).

### Stale-artifact guards

Because `dist/` is committed, two guards stop a forgotten build from shipping old code:

- **Local pre-commit hook** (`.githooks/pre-commit`, versioned with the repo): runs `npm run check` on commit and
  **blocks the commit** when `dist/` no longer matches the TypeScript sources, printing the fix. With no installed
  dependencies (no esbuild) it warns and skips instead of blocking a fresh clone. Enable once per clone:

  ```bash
  git config core.hooksPath .githooks
  ```

  Emergency bypass: `git commit --no-verify`. Disable: `git config --unset core.hooksPath`.

- **CI** (`.github/workflows/verify.yml`, push / PR): `npm install` → `npm run check` (**before any build**, comparing
  the committed artifacts) → `npm run typecheck` → `npm test`.

Both guards cover sync and tests only; `npm run verify` remains the full local check.

### Plugin display metadata

The card title and one-line description in Settings → Plugins come from the plugin package itself, not from this README:

- `meta.title` / `meta.description` in `locale/en.json` and `locale/zh.json` are the **localized display metadata** (DSH picks the UI language); absent fields fall back to `package.json`'s `name` / `description`.
- DSH **only reads exported package resources**, so `package.json` `exports` must include `"./locale/*.json"` and `"./package.json"`. Without them the plugins list shows the name with an empty description — exactly what 1.0.0 fixes.
- `files` must list `locale` too, or an npm-installed copy would miss both files.

### Module map

| Path | Responsibility |
|---|---|
| `src/client/index.ts` | bundle entry + the `BetterBrowser` component (probes, state, wiring); destructures each module factory's result back into the previous names |
| `src/client/platform.ts` | **the only platform boundary**: `installPlatform(hostRequire)` installs react / client-store / ui-primitives; every other module imports the handles from here |
| `src/client/core/*` | pure logic (text splitting, time buckets, view rules, virtual tree + chain compression), no React/DOM, unit-tested directly |
| `src/client/browser/*` | `model`, `dnd`, `actions`, `tree-view`, `menu`, `layout` — all `createX(input)` factories whose dependencies arrive through an explicit input object |
| `src/client/{store,host,icons,styles}.ts`, `ui/*`, `rows.ts`, `customize.ts`, `settings.ts` | view store, host calls, icons, stylesheet, row components, appearance and settings |
| `src/client/{tabs,tabs-strip}.ts` | tab rules (pure: open / replace / reorder / close / reconcile) and the header strip component (HTML5 drag reordering, context-menu bridge) |
| `src/index.ts` | host half (Node): only the permanent session-delete route |
| `scripts/build.ts` | build/check entry: esbuild emits `dist/client.js` (browser bundle) and `dist/index.js` (host half) |
| `dist/` | **committed artifacts** (bundle + sourcemap + host half); never hand-edit them — `npm run check` proves they match `src/**/*.ts` |

`tests/architecture.test.ts` guards those boundaries (only the entry/platform layer may request platform modules;
core/i18n/styles/host may not touch platform handles; cross-module references — including type references — need an import;
component-scope names must arrive through `input`). `tests/browser.render.test.ts` really renders the sidebar with a stub
React — all four views, the archive filter, the pinned tray, sections and custom styling — so a module that lost an input
fails here immediately.

The tests and the build script are `.ts` files executed by Node 22's native type stripping (no ts-node/tsx dependency);
the strict `tsconfig.json` type check covers `src/`, `tests/` and `scripts/`. The shell's seeded platform modules ship no
type declarations, so they are the documented `any` boundary in `platform.ts`; every other module declares its props and
data shapes explicitly.

### Local verification

Install the tarball into a profile, or link the repository path directly:

```bash
dsh plugin --profile web add /absolute/path/to/dsh-workspace-plus   # linked directory: source edits apply after a restart
```

Checklist: hierarchy tree, add-workspace dialog, rename with instant re-sort, new group, time buckets, pinned tray,
drag reordering, context menus, session tabs (new session opens a tab / Shift+click / context menu / drag reorder /
restored after refresh), appearance customisation, settings toggles, the permanent session delete round-trip, and the
fallback to the shipped browser after uninstall.

> Note: a profile that installed this plugin as a **copy** (rather than a `link:`) keeps serving that copy — only a
> `link:` install picks up freshly built artifacts.

## License

[MIT](./LICENSE)
