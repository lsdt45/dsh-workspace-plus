/** The plugin stylesheet, injected once by the StyleNode element. Class names are part of the DOM contract. */

export const CSS_TEXT = [
  '.bw-root{height:100%;display:flex;flex-direction:column;min-height:0;position:relative;color:var(--dsw-alias-label-primary,#e6e6e6);container-type:inline-size}',
  '.bw-header{display:flex;align-items:center;gap:2px;padding:10px 10px 4px;flex:none}',
  '.bw-header-title{flex:1;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,#b8b8b8);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.bw-icon-btn{flex:none;width:24px;height:24px;border:none;background:transparent;border-radius:6px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}',
  '.bw-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15));color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-input{width:100%;box-sizing:border-box;height:26px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;color:inherit;padding:0 8px;font-size:12px;outline:none;font-family:inherit}',
  '.bw-input:focus{border-color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-input::placeholder{color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-tree{flex:1;overflow-y:auto;overflow-x:hidden;padding:2px 6px 12px;min-height:0}',
  '.bw-row{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 6px;border-radius:6px;cursor:pointer;user-select:none;font-size:13px;color:var(--dsw-alias-label-primary,#e6e6e6);position:relative}',
  '.bw-drop-before::after{content:"";position:absolute;left:8px;right:8px;top:-1px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary,#5b8def);pointer-events:none}',
  '.bw-drop-after::after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary,#5b8def);pointer-events:none}',
  '.bw-drop-into{outline:1.5px dashed var(--dsw-alias-brand-primary,#5b8def);outline-offset:-1.5px}',
  '.bw-row:hover{background:var(--dsw-specific-sidebar-nav-item-hover,var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12)))}',
  '.bw-row:hover{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-hover,rgba(127,127,127,.14)) 50%,transparent)}',
  '.bw-row-current{background:var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.15))}',
  '.bw-row-current{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.16)) 40%,transparent)}',
  '.bw-row-icon{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-chevron{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a);transition:transform .15s ease}',
  '.bw-chevron-open{transform:rotate(90deg)}',
  '.bw-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.bw-row-count{flex:none;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-row-time{flex:none;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-schedule-badge{flex:none;display:inline-flex;align-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a);margin:0 6px}',
  '.bw-row-actions{flex:none;display:none;align-items:center;gap:2px}',
  '.bw-row:hover .bw-row-actions{display:flex}',
  '.bw-row:hover .bw-row-time,.bw-row:hover .bw-row-count,.bw-row:hover .bw-schedule-badge{display:none}',
  // Session-row hover bubble (ui/tooltip.js). Metrics and tokens mirror the
  // host primitives bubble; placement is the bubble's own top-left corner, set
  // beside the row like the Codex hover card — no translate to undo it.
  '.bw-tip{display:inline-flex;align-items:center;gap:8px;position:fixed;z-index:100;width:max-content;max-width:50vw;padding:3px 7px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-tooltip-bg,rgba(24,24,28,.95));color:var(--dsw-static-neutral-bluish-00,#fff);font-size:13px;line-height:20px;white-space:pre-line;overflow-wrap:break-word;pointer-events:none;animation:bw-tip-in 150ms var(--ds-ease-in-out,ease)}',
  '@keyframes bw-tip-in{from{opacity:0}}',
  '@media (prefers-reduced-motion:reduce){.bw-tip{animation:none}}',
  // Floating search overlay (ui/search-overlay.ts): one dark card pinned near
  // the sidebar's top-left corner, matching the shell's menu surfaces.
  '.bw-search-overlay{position:fixed;inset:0;z-index:130}',
  '.bw-search-panel{position:absolute;left:16px;top:64px;width:min(560px,calc(100vw - 32px));max-height:min(72vh,600px);display:flex;flex-direction:column;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,rgba(28,28,32,.94)));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3));border-radius:12px;box-shadow:0 12px 40px rgba(0,0,0,.45);-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));overflow:hidden}',
  '.bw-search-field{flex:none;display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.2));color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-search-input{flex:1;min-width:0;height:22px;background:transparent;border:none;outline:none;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:13px;font-family:inherit}',
  '.bw-search-input::placeholder{color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-search-list{flex:1;min-height:0;overflow-y:auto;padding:6px 8px 8px}',
  '.bw-search-section{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:4px 6px 2px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-search-status{font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.bw-search-empty{padding:18px 10px;text-align:center;font-size:12px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-search-row{display:flex;align-items:center;gap:8px;width:100%;box-sizing:border-box;padding:7px 8px;border:none;background:transparent;border-radius:8px;text-align:left;cursor:pointer;color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit}',
  '.bw-search-row-active{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.16))}',
  '.bw-search-row-main{flex:1;min-width:0;display:flex;flex-direction:column;gap:1px}',
  '.bw-search-row-title{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.bw-search-row-snippet{font-size:11.5px;color:var(--dsw-alias-label-tertiary,#9a9a9a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.bw-search-row-ws{flex:none;max-width:120px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
  '.bw-search-row-idx{flex:none;min-width:26px;padding:1px 5px;border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.14));font-size:10.5px;text-align:center;color:var(--dsw-alias-label-tertiary,#9a9a9a);font-family:ui-monospace,SFMono-Regular,Menlo,monospace}',
  '.bw-dot{flex:none;width:6px;height:6px;border-radius:50%;background:transparent}',
  // The session title repeats what the active tab already says, so hide just that
  // line — the shell's own header layout stays untouched (re-gridding it made the
  // session's chips and utilities disappear). The crumbs line is the only element
  // carrying the title; the status chips and right-hand controls are siblings of it
  // inside the session header and stay where they are.
  //
  // All header overrides below are scoped to "tabs are shown" (the plugin
  // settings page can turn the strip off): with tabs off the shell's header must
  // render exactly as shipped, title line included. tabs-strip.js mirrors the
  // switch into data-bw-tabs-off on <html>.
  'html:not([data-bw-tabs-off]) header[data-window-drag] [class*="_crumbs"]{display:none}',
  // The session's own chips (agent team / PTC mode / subagents) share the view
  // navigation row instead of the tab row: the nav row is the last line of the
  // header, so pinning them to its bottom-right corner puts them after the
  // view chips with no extra header height. Absolute positioning keeps the
  // shell's own header layout untouched.
  'html:not([data-bw-tabs-off]) header[data-window-drag]{position:relative}',
  // z-index lifts the block above the view-nav row it is pinned onto: without it
  // the row paints over the chips and swallows their clicks.
  // left comes from useChipsAfterNav(): the measured end of the view-nav row.
  // Until it lands (first paint, markup drift) the rule falls back to the old
  // right-aligned spot.
  'html:not([data-bw-tabs-off]) header[data-window-drag] [class*="_headerActions"]{position:absolute;left:var(--bw-chips-left,auto);right:var(--bw-chips-right,20px);top:var(--bw-chips-top,auto);bottom:var(--bw-chips-bottom,9px);margin:0;z-index:6;pointer-events:auto}',
  // Session tab strip: compact chips in the conversation header, one per open
  // session. The chip's dot is .bw-state-dot, so the three states stay identical.
  // Session tab strip, modelled on the reference: dot + label chips with a
  // thick active underline, no fill or border, and a quiet close cross.
  '.bw-tabs{display:flex;align-items:center;gap:2px;min-width:0;max-width:52vw;overflow-x:auto;scrollbar-width:none;-webkit-app-region:no-drag;app-region:no-drag}',
  '.bw-tabs::-webkit-scrollbar{display:none}',
  '.bw-tab{display:flex;align-items:center;gap:6px;flex:none;max-width:200px;padding:5px 4px 5px 8px;border-radius:6px;color:var(--dsw-alias-label-secondary,#b6b6b6);cursor:pointer;user-select:none}',
  '.bw-tab:hover{background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08))}',
  '.bw-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}',
  '.bw-tab-active{box-shadow:inset 0 -2px 0 var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-tab-active .bw-tab-label{color:var(--dsw-alias-brand-primary,#5b8def);font-weight:600}',
  '.bw-tab-dragging{opacity:.45}',
  '.bw-tab-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px}',
  '.bw-tab-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption,#8a8a8a);opacity:.55}',
  '.bw-tab-close{flex:none;appearance:none;border:0;background:none;color:inherit;cursor:pointer;font-size:14px;line-height:1;padding:1px 4px 2px;border-radius:4px;opacity:.45}',
  '.bw-tab:hover .bw-tab-close{opacity:1}',
  '.bw-tab-close:hover{background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#e6e6e6)}',
  // The plugin-drawn status dot (all three states): geometry only, the colour is
  // inline (one source of truth with the glow, see rows.js PULSE_COLORS).
  // display:inline-block is load-bearing — the dot sits inside the .bw-pulse
  // span, so it is NOT a grid item of the row icon, and an inline span would
  // ignore width/height (the dot then renders at zero size: invisible).
  '.bw-state-dot{display:inline-block;flex:none;width:6px;height:6px;border-radius:50%}',
  '.bw-session-row{font-size:12.5px;color:var(--dsw-alias-label-secondary,#b8b8b8);min-height:26px}',
  '.bw-sgroup-row{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#9a9a9a);min-height:24px}',
  '.bw-sgroup-row:hover{color:var(--dsw-alias-label-secondary,#b8b8b8)}',
  '.bw-session-row:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-empty{padding:28px 12px;text-align:center;font-size:12px;color:var(--dsw-alias-label-dimmed,#7a7a7a)}',
  '.bw-swatch{width:20px;height:20px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));cursor:pointer;flex:none;background:transparent;padding:0}',
  '.bw-swatch-active{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:1px}',
  '.bw-color-input{width:36px;height:26px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:transparent;cursor:pointer;padding:0}',
  '.bw-seg{display:flex;gap:6px;flex-wrap:wrap}',
  '.bw-seg-btn{height:24px;padding:0 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));background:transparent;color:var(--dsw-alias-label-secondary,#b8b8b8);font-size:12px;cursor:pointer;font-family:inherit}',
  '.bw-seg-btn:disabled{opacity:.45;cursor:default}',
  '.bw-seg-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}',
  '.bw-seg-btn-active{background:var(--dsw-alias-brand-primary,#5b8def);border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}',
  '.bw-seg-btn-active:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary,#5b8def));border-color:transparent}',
  '.bw-icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(30px,1fr));gap:4px}',
  '.bw-icon-cell{height:30px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:transparent;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}',
  '.bw-icon-cell:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-icon-cell-active{border-color:var(--dsw-alias-brand-primary,#5b8def);color:var(--dsw-alias-label-primary,#e6e6e6);outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}',
  '.bw-icon-none{width:12px;height:2px;background:currentColor;border-radius:1px;opacity:.7}',
  '.bw-rgb-row{display:flex;gap:10px;align-items:center}',
  '.bw-rgb-label{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-rgb-input{width:52px;height:26px;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;color:inherit;font-size:12px;padding:0 6px;font-family:inherit}',
  '.bw-ctx-overlay{position:fixed;inset:0;z-index:40}',
  '.bw-ctx-menu{position:fixed;min-width:170px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,rgba(28,28,32,.72)));-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3));border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;flex-direction:column}',
  '.bw-ctx-item{display:flex;align-items:center;gap:8px;height:28px;padding:0 10px;border:none;background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:12.5px;border-radius:6px;cursor:pointer;text-align:left;font-family:inherit}',
  '.bw-ctx-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
  '.bw-ctx-item:disabled{opacity:.45;cursor:default}',
  '.bw-ctx-heading{padding:6px 10px 4px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-ctx-menu{max-height:calc(100vh - 16px);overflow-y:auto}',
  '.bw-archive-mark{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-session-row-archived .bw-row-label{color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-empty .bw-btn{margin-top:10px}',
  '.bw-menu-label{flex:1}',
  '.bw-menu-icon{flex:none;width:14px;height:14px;display:grid;place-items:center;color:inherit}',
  '.bw-menu-pin{color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-workspace-group{display:flex;align-items:center;gap:6px;min-height:32px;margin-top:10px;padding:4px 8px;box-sizing:border-box;border-radius:6px;color:var(--dsw-alias-label-tertiary,#9a9a9a);font-size:12.5px;cursor:pointer}',
  '.bw-workspace-group:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}',
  '.bw-workspace-group .bw-row-label{flex:0 1 auto}',
  '.bw-workspace-group:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}',
  '.bw-workspace-group-chevron{display:grid;place-items:center;transition:transform .12s}',
  '.bw-workspace-group-chevron-open{transform:rotate(90deg)}',
  '.bw-ctx-submenu{min-width:200px;max-width:min(280px,calc(100vw - 16px))}',
  '.bw-ctx-submenu .bw-menu-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.bw-menu-shortcut{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-notice{position:absolute;bottom:16px;left:8px;right:8px;padding:8px 10px;border-radius:6px;background:var(--dsw-alias-bg-overlay,#222);color:var(--dsw-alias-label-primary,#fff);box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:12px;pointer-events:none;z-index:41}',
  '.bw-confirm-danger{background:var(--dsw-alias-state-error-primary,#d93025)!important;color:#fff!important}',
  '.bw-ctx-danger{color:var(--dsw-alias-state-error-primary,#f85149)}',
  '.bw-ctx-sep{height:1px;background:var(--dsw-alias-border-l1,rgba(127,127,127,.2));margin:4px 6px}',
  '.bw-settings{display:flex;flex-direction:column;gap:6px;max-width:640px}',
  // Settings → Plugins: the body our plugins.bundle.config slot renders on the
  // bundle's page.
  '.bw-plugin-config{display:flex;flex-direction:column;gap:2px;padding:4px 0 8px}',
  '.bw-setting-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary,#b8b8b8)}',
  '.bw-setting-label{flex:1;min-width:0;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary,#b8b8b8)}',
  '.bw-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:10px;background:var(--dsw-alias-border-l3,rgba(127,127,127,.3));cursor:pointer;transition:background 120ms ease}',
  '.bw-switch:hover{background:var(--dsw-alias-label-dimmed,#7a7a7a)}',
  '.bw-switch-on{background:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:2px}',
  '.bw-switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground,#fff);transition:transform 120ms ease}',
  '.bw-switch-on .bw-switch-thumb{transform:translateX(16px)}',
  '.bw-plugin-body .bw-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 0}',
  '.bw-rail-btn{width:36px;height:36px;border:none;background:transparent;border-radius:8px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}',
  '.bw-rail-btn:hover{background:var(--dsw-specific-sidebar-nav-item-hover,var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12)));color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-modal-body{display:flex;flex-direction:column;gap:10px;min-width:300px;max-width:380px;box-sizing:border-box}',
  '.bw-field{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8)}',
  '.bw-hint{font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a);line-height:1.5;white-space:normal;word-break:break-word}',
  '.bw-path-echo{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a);word-break:break-all;max-width:380px}',
  '.bw-modal-actions{display:flex;justify-content:flex-end;gap:8px}',
  '.bw-btn{height:28px;padding:0 14px;border-radius:6px;font-size:12.5px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit}',
  '.bw-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}',
  '.bw-btn-primary{background:var(--dsw-alias-brand-primary,#5b8def);border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}',
  '.bw-btn-primary:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary,#5b8def))}',
  '.bw-btn:disabled{opacity:.5;cursor:default}',
  '.bw-error-text{font-size:12.5px;color:var(--dsw-alias-state-error-primary,#f85149);word-break:break-all;max-width:380px}',
  '.bw-dialog-input-row{display:flex;gap:6px;align-items:center}',
  // Add-workspace destination pickers: a real click-to-select list (the
  // native <datalist> popup the field used before rendered outside the
  // dialog, needed typing, and covered the footer buttons). The list is
  // in-flow under its trigger and scrolls inside a fixed max-height, so
  // the dialog stays clear of the viewport.
  // The name-path control carries its chevron INSIDE the box, exactly like
  // the section trigger above it: one control shape per dialog, no second
  // outlined button sitting beside the field.
  '.bw-picker{position:relative}',
  '.bw-field-row{position:relative;min-width:0}',
  '.bw-field-row .bw-input{display:block;width:100%;padding-right:26px}',
  '.bw-field-caret{position:absolute;right:3px;top:50%;transform:translateY(-50%);width:20px;height:20px;display:grid;place-items:center;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#9a9a9a);cursor:pointer}',
  '.bw-field-caret:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15));color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-field-caret:disabled{opacity:.5;cursor:default}',
  '.bw-picker-trigger{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}',
  '.bw-picker-trigger:hover{border-color:var(--dsw-alias-border-l2,rgba(127,127,127,.4))}',
  '.bw-picker-trigger[aria-expanded="true"]{border-color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-picker-trigger:disabled{opacity:.5;cursor:default}',
  '.bw-picker-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.bw-picker-value-muted{color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  '.bw-picker-caret{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
  // The raised list surface: the dialog itself sits on bg-layer-2, so the list uses the overlay surface plus its own border/shadow to separate from the card underneath.
  // It is a FIXED popover (geometry written inline by PickerList): the
  // dialog keeps its height while a list is open, and the modal card's
  // overflow:hidden cannot crop it.
  '.bw-picker-list{position:fixed;z-index:1100;display:flex;flex-direction:column;overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:8px;background:var(--dsw-alias-bg-overlay,rgba(127,127,127,.08));box-shadow:0 6px 18px rgba(0,0,0,.16)}',
  '.bw-picker-row{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;min-height:26px;padding:0 6px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}',
  '.bw-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15))}',
  '.bw-picker-row:disabled{opacity:.5;cursor:default}',
  '.bw-picker-row-on{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 14%,transparent)}',
  '.bw-picker-check{flex:none;width:14px;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-picker-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.bw-picker-heading{padding:6px 6px 2px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-picker-empty{padding:4px 6px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-picker-new{display:flex;align-items:center;gap:6px;padding:4px 2px 2px}',
  '.bw-picker-new .bw-input{flex:1;min-width:0}',
  '.bw-picker-error{padding:4px 6px 0;font-size:11px;color:var(--dsw-alias-state-error-primary,#f85149)}',
  '.bw-btn-sm{height:24px;padding:0 10px;font-size:12px}',
  '.bw-preview-line{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a);word-break:break-all}',
  '.bw-glow-row{display:flex;align-items:center;gap:10px}',
  '.bw-slider{flex:1;accent-color:var(--dsw-alias-brand-primary,#5b8def);height:22px}',
  '.bw-glow-value{min-width:44px;text-align:right;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8);font-variant-numeric:tabular-nums}',
  '.bw-preview{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:6px;min-height:28px}',
  '.bw-preview-icon{flex:none;display:grid;place-items:center;width:20px;height:20px;color:var(--dsw-alias-label-primary,#e6e6e6)}',
  '.bw-preview-icon svg{width:18px;height:18px}',
  '.bw-preview-label{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}',
  '.bw-pulse{display:inline-flex;align-items:center;justify-content:center;animation:bw-breathe 1.8s ease-in-out infinite}',
  '@keyframes bw-breathe{0%,100%{filter:drop-shadow(0 0 1px var(--bw-pulse-color));opacity:.55}50%{filter:drop-shadow(0 0 6px var(--bw-pulse-color));opacity:1}}',
  '.bw-pulse-text{animation:bw-breathe-text 1.8s ease-in-out infinite}',
  '@keyframes bw-breathe-text{0%,100%{text-shadow:0 0 1px var(--bw-pulse-color);opacity:.65}50%{text-shadow:0 0 7px var(--bw-pulse-color);opacity:1}}',
  '.bw-pin-mark{flex:none;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-session-row-pinned{box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary,#5b8def);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 9%,transparent)}',
  '.bw-session-row-pinned:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 13%,transparent)}',
  '.bw-row-current.bw-session-row-pinned{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.16)) 55%,var(--dsw-alias-brand-primary,#5b8def) 9%)}',
  '.bw-pinned-section{flex:none;margin:0 6px 4px;padding:0 0 4px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18))}',
  '.bw-pinned-header{display:flex;align-items:center;gap:5px;padding:8px 4px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a);user-select:none}',
  '.bw-pinned-header .bw-pin-mark{color:var(--dsw-alias-label-quaternary,#8a8a8a)}',
  '.bw-pin-ind{flex:none;display:inline-flex;align-items:center;gap:2px;color:var(--dsw-alias-brand-primary,#5b8def);font-size:10.5px;font-variant-numeric:tabular-nums}',
  // Pinned-tray rows keep the title readable in the narrow sidebar: the
  // workspace tag shrinks to a compact pill, the title guarantees a
  // minimal readable width, and under ~280px containers the relative
  // time hides in favor of the tag (container query; older engines just
  // show both and squeeze the tag instead).
  '.bw-pinned-ws-tag{flex:none;max-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:16px;color:var(--dsw-alias-label-quaternary,#8a8a8a);border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:4px;padding:0 4px}',
  // Badge text ships as generated content (see renderWsTag): a real text
  // child inside a session row reads as a workspace label to the third-party
  // context-menu plugin and would swap the session menu for the workspace one.
  '.bw-pinned-ws-tag::after{content:attr(data-tag)}',
  '.bw-bucket-header{display:flex;align-items:center;gap:5px;padding:8px 4px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a);user-select:none}',
  '.bw-sort-menu-item{display:flex;align-items:center;gap:8px}',
  '.bw-sort-menu-check{flex:none;width:14px;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}',
  '.bw-ctx-subitem{padding-left:26px;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8)}',
  '.bw-tray-row .bw-row-label{min-width:56px}',
  '@container (max-width: 280px){.bw-tray-row .bw-row-time{display:none}}',
  // Timeline rows show the relative time by default and swap to the
  // workspace tag on hover (time already hides via .bw-row:hover rules).
  '.bw-ws-tag-hover{display:none}',
  '.bw-row:hover .bw-ws-tag-hover{display:inline-block}',
  // Our timeline bubbles: the primitives bubble is translucent by token
  // and washes out over theme wallpapers — re-surface it with the same
  // tokens as the context menu (opaque overlay + blur + label color).
  // Scoped to OUR bubbles only (direct children of our tree/section),
  // so official tooltips elsewhere are untouched.
  '.bw-tree > span[data-side], .bw-pinned-section > span[data-side]{background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,rgba(28,28,32,.88)));color:var(--dsw-alias-label-primary,#e6e6e6);-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));box-shadow:0 8px 24px rgba(0,0,0,.4);padding:6px 10px;font-size:12px;line-height:18px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3))}',
  '.bw-seg-btn .bw-pin-mark{color:currentColor}',
].join('')
