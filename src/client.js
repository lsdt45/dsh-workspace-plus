/**
 * dsh-workspace-plus — client half (plain JavaScript, no build step).
 *
 * Three registrations:
 *  1. `sidebar.workspaces` (priority -1): replaces the shipped workspace
 *     browser with a hierarchy tree derived from "/" inside workspace titles.
 *  2. `conversation.hero.workspace.directoryFlow`: the add-workspace picking
 *     interaction for the conversation empty-state menu — native directory
 *     pick, then a parent-group popup, then create + rename with the prefix.
 *  3. `sidebar.workspaces.directoryFlow`: the same interaction for the
 *     shipped sidebar browser (fills only when that hole is declared, i.e.
 *     whenever this plugin's own browser is not the occupying entry).
 *
 * Every require below is a dsh client baseline module (see
 * @deepseek-ai/dsh-client-web seed.ts): react, @deepseek-ai/dsh-client-store,
 * @deepseek-ai/dsh-client-ui-primitives.
 */
window.__ModuleLoader__.load({
  id: 'dsh-workspace-plus',
  factory: (require) => {
    const React = require('react')
    const storeKit = require('@deepseek-ai/dsh-client-store')
    const ui = require('@deepseek-ai/dsh-client-ui-primitives')

    const E = React.createElement
    const NS = 'betterWorkspace'

    /* ============================== i18n ============================== */

    const zh = {
      'title': '工作区',
      'search.placeholder': '搜索工作区或会话',
      'add': '添加工作区',
      'rail.search': '搜索',
      'rail.add': '添加工作区',
      'empty': '暂无工作区',
      'empty.search': '没有匹配的结果',
      'session.new': '新会话',
      'group.ungrouped': '未分组',
      'sessions.expand': '展开 {n} 个会话',
      'sessions.collapse': '收起',
      'time.now': '刚刚',
      'time.minutes': '{n} 分钟',
      'time.hours': '{n} 小时',
      'time.days': '{n} 天',
      'time.months': '{n} 个月',
      'time.years': '{n} 年',
      'status.running': '生成中',
      'status.completed': '已完成',
      'status.approval': '等待批准',
      'status.planReview': '等待计划确认',
      'status.question': '等待回答',
      'status.subagents': '{n} 个子任务运行中',
      'schedule.active': '有活动定时任务',
      'menu.rename': '重命名',
      'menu.delete': '删除',
      'menu.fork': '分叉',
      'menu.archive': '归档',
      'menu.newSubfolder': '新增子分组',
      'menu.newSubWorkspace': '新增子工作区',
      'menu.renameFolder': '重命名分组',
      'menu.removeFolder': '删除分组',
      'menu.renameSgroup': '重命名会话分组',
      'menu.pin': '置顶',
      'menu.unpin': '取消置顶',
      'view.label': '视图',
      'view.projects': '项目视图',
      'view.time': '时间视图',
      'view.time.latest': '最新在前',
      'view.time.oldest': '最旧在前',
      'view.hint': '项目视图按名称 / 分组展示会话并支持拖拽重排;时间视图按今天 / 昨天 / 近 7 天 / 近 30 天 / 更早分桶(忽略名称分组),方向可选最新或最旧在前。',
      'bucket.today': '今天',
      'bucket.yesterday': '昨天',
      'bucket.week': '近 7 天',
      'bucket.month': '近 30 天',
      'bucket.earlier': '更早',
      'pinned.header': '已置顶',
      'settings.title': '更好的工作区',
      'settings.desc': '工作区树的外观与折叠偏好',
      'settings.expand': '展开',
      'settings.collapse': '收起',
      'settings.compactChains': '单链分组折叠显示',
      'settings.compactChains.hint': '单层链合并为一行,出现多个子级时自动展开为树状;拖拽工作区期间单链临时展开回文件夹树,可放入任意一级;展开状态与自定义外观保存在当前浏览器。',
      'settings.statusPulse': '状态呼吸灯',
      'settings.statusPulse.hint': '被折叠藏起的状态灯(完成绿 / 运行蓝 / 待交互琥珀)沿层级向外冒泡:工作区与分组行以图标呼吸发光(颜色随状态,自定义过发光的标题一起呼吸),会话分组行显示呼吸状态灯;默认开启,可在此关闭。',
      'custom.title': '自定义外观',
      'custom.color': '颜色',
      'custom.glow': '发光',
      'custom.preview': '实时预览',
      'custom.preview.sample': '工作区示例',
      'custom.weight': '字体粗细',
      'custom.weight.regular': '常规',
      'custom.weight.medium': '中',
      'custom.weight.semibold': '半粗',
      'custom.weight.bold': '粗',
      'custom.shadow': '字体阴影',
      'custom.weak': '弱',
      'custom.medium': '中',
      'custom.strong': '强',
      'custom.icon': '图标',
      'custom.icon.solid': '实心文件夹',
      'custom.icon.outline': '空心文件夹',
      'custom.icon.none': '不显示',
      'custom.none': '不显示',
      'custom.reset': '清除自定义',
      'custom.done': '完成',
      'settings.on': '开',
      'settings.off': '关',
      'flow.title': '添加工作区',
      'flow.picked': '所选文件夹',
      'flow.parent': '所属分组',
      'flow.parentHint': '输入或下拉选择分组路径,留空表示根分组;多级用 / 分隔',
      'flow.creating': '正在创建…',
      'error.title': '出错了',
      'cancel': '取消',
      'create': '创建',
      'confirm': '确定',
      'close': '关闭',
      'ws.rename.title': '重命名工作区',
      'ws.rename.hint': '名称中的 / 即层级分组,例如 web/前端',
      'ws.delete.title': '删除工作区',
      'ws.delete.body': '仅移除工作区登记,目录和会话记录都会保留。确定删除「{name}」?',
      'folder.new.title': '新建分组',
      'folder.new.hint': '分组路径,可用 / 表示多级,例如 web/前端',
      'folder.rename.title': '重命名分组',
      'folder.rename.hint': '重命名会同步更新组内所有工作区名称',
      'folder.delete.body': '删除空分组「{name}」?',
      'folder.error.empty': '分组路径不能为空',
      'folder.error.exists': '分组已存在',
      'folder.error.notEmpty': '分组内还有工作区,无法删除',
    }

    const en = {
      'title': 'Workspaces',
      'search.placeholder': 'Search workspaces or sessions',
      'add': 'Add workspace',
      'rail.search': 'Search',
      'rail.add': 'Add workspace',
      'empty': 'No workspaces yet',
      'empty.search': 'No matches',
      'session.new': 'New session',
      'group.ungrouped': 'Ungrouped',
      'sessions.expand': 'Show {n} more sessions',
      'sessions.collapse': 'Collapse',
      'time.now': 'now',
      'time.minutes': '{n}min',
      'time.hours': '{n}h',
      'time.days': '{n}d',
      'time.months': '{n}mo',
      'time.years': '{n}y',
      'status.running': 'Running',
      'status.completed': 'Completed',
      'status.approval': 'Waiting for approval',
      'status.planReview': 'Waiting for plan review',
      'status.question': 'Waiting for answer',
      'status.subagents': '{n} subagent(s) running',
      'schedule.active': 'Has active scheduled task',
      'menu.rename': 'Rename',
      'menu.delete': 'Delete',
      'menu.fork': 'Fork',
      'menu.archive': 'Archive',
      'menu.newSubfolder': 'New subfolder',
      'menu.newSubWorkspace': 'New workspace here',
      'menu.renameFolder': 'Rename folder',
      'menu.removeFolder': 'Delete folder',
      'menu.renameSgroup': 'Rename session group',
      'menu.pin': 'Pin',
      'menu.unpin': 'Unpin',
      'view.label': 'View',
      'view.projects': 'Projects view',
      'view.time': 'Time view',
      'view.time.latest': 'Latest first',
      'view.time.oldest': 'Oldest first',
      'view.hint': 'The projects view shows sessions as a title-grouped tree with drag reordering; the time view buckets them by today / yesterday / last 7 days / last 30 days / earlier (ignoring title groups), with a latest or oldest direction.',
      'bucket.today': 'Today',
      'bucket.yesterday': 'Yesterday',
      'bucket.week': 'Last 7 days',
      'bucket.month': 'Last 30 days',
      'bucket.earlier': 'Earlier',
      'pinned.header': 'Pinned',
      'settings.title': 'Better Workspaces',
      'settings.desc': 'Workspace tree appearance and folding preferences',
      'settings.expand': 'Expand',
      'settings.collapse': 'Collapse',
      'settings.compactChains': 'Merge single-child chains',
      'settings.compactChains.hint': 'Single-child chains merge into one row; levels with multiple children expand as a tree. Chains re-expand into folder rows while you drag a workspace, so it can drop into any level. State and custom styling persist in this browser.',
      'settings.statusPulse': 'Status breathing light',
      'settings.statusPulse.hint': 'Status dots hidden by collapse (done green / running blue / pending amber) bubble outward: workspace and folder rows breathe on their icon in the status color (custom-glow labels breathe along), session-group rows show a breathing dot; on by default, turn it off here.',
      'custom.title': 'Customize',
      'custom.color': 'Color',
      'custom.glow': 'Glow',
      'custom.preview': 'Live preview',
      'custom.preview.sample': 'Workspace sample',
      'custom.weight': 'Font weight',
      'custom.weight.regular': 'Regular',
      'custom.weight.medium': 'Medium',
      'custom.weight.semibold': 'Semi-bold',
      'custom.weight.bold': 'Bold',
      'custom.shadow': 'Font shadow',
      'custom.weak': 'Subtle',
      'custom.medium': 'Medium',
      'custom.strong': 'Strong',
      'custom.icon': 'Icon',
      'custom.icon.solid': 'Solid folder',
      'custom.icon.outline': 'Outline folder',
      'custom.icon.none': 'Hidden',
      'custom.none': 'None',
      'custom.reset': 'Clear custom style',
      'custom.done': 'Done',
      'settings.on': 'On',
      'settings.off': 'Off',
      'flow.title': 'Add workspace',
      'flow.picked': 'Chosen folder',
      'flow.parent': 'Parent group',
      'flow.parentHint': 'Type or pick a group path; empty means root. Nest with /',
      'flow.creating': 'Creating…',
      'error.title': 'Something went wrong',
      'cancel': 'Cancel',
      'create': 'Create',
      'confirm': 'OK',
      'close': 'Close',
      'ws.rename.title': 'Rename workspace',
      'ws.rename.hint': 'Use / inside the name to nest, e.g. web/frontend',
      'ws.delete.title': 'Delete workspace',
      'ws.delete.body': 'Only the workspace registration is removed; the directory and session logs remain. Delete "{name}"?',
      'folder.new.title': 'New folder',
      'folder.new.hint': 'Folder path; nest with /, e.g. web/frontend',
      'folder.rename.title': 'Rename folder',
      'folder.rename.hint': 'Renaming updates every workspace title inside the folder',
      'folder.delete.body': 'Delete empty folder "{name}"?',
      'folder.error.empty': 'Folder path must not be empty',
      'folder.error.exists': 'Folder already exists',
      'folder.error.notEmpty': 'Folder still contains workspaces',
    }

    /* ============================= helpers ============================ */

    const cls = (...xs) => xs.filter(Boolean).join(' ')
    const messageOf = (reason) => (reason instanceof Error ? reason.message : String(reason))

    const basename = (p) => {
      if (!p) return ''
      const s = String(p).replace(/[\\/]+$/, '')
      const i = Math.max(s.lastIndexOf('/'), s.lastIndexOf('\\'))
      return i === -1 ? s : s.slice(i + 1)
    }
    /**
     * Plain-text splitting with the URL tail kept opaque: a bare "/" split
     * shreds URLs ("https:" → empty → host → path...), so from the first
     * "://" onward the tail is ONE leaf; text before the marker splits
     * normally at the last "/" before it. This is the FALLBACK guard —
     * freshly generated titles get their whole "/"-bearing title wrapped in
     * quotes by the quote-on-land effect (see BetterBrowser), which is the
     * primary mechanism.
     */
    const splitPlainSegs = (text) => {
      const s = String(text || '')
      const schemeAt = s.indexOf('://')
      if (schemeAt === -1) return s.split('/').map(x => x.trim()).filter(Boolean)
      const cut = s.lastIndexOf('/', schemeAt)
      const segs = (cut === -1 ? '' : s.slice(0, cut)).split('/').map(x => x.trim()).filter(Boolean)
      const tail = s.slice(cut + 1).trim()
      if (tail !== '') segs.push(tail)
      return segs
    }

    /**
     * Title → hierarchy segments, QUOTE-AWARE: a PAIRED “…” (or "…") span is
     * verbatim — slashes inside quotes never split, the quotes stay part of
     * the leaf. Text outside paired spans splits through splitPlainSegs
     * (URL-tail opaque). A LONE quote character — an opener with no matching
     * closer, or a closer without an opener — is an ORDINARY character and
     * splits normally around it (0.9.1 swallowed the tail after an
     * unterminated opener; the user wants lone quotes as plain text).
     * Grouping is a pure projection, so previously shredded titles re-flow
     * on reload.
     */
    const splitTitleSegs = (title) => {
      const s = String(title || '')
      if (!/["“]/.test(s)) return splitPlainSegs(s)
      const out = []
      let plain = ''
      let i = 0
      while (i < s.length) {
        const ch = s[i]
        if (ch === '"' || ch === '“') {
          const close = ch === '“' ? '”' : '"'
          const j = s.indexOf(close, i + 1)
          if (j === -1) { // lone opener: ordinary character, keep scanning
            plain += ch
            i += 1
            continue
          }
          for (const seg of splitPlainSegs(plain)) out.push(seg)
          plain = ''
          const end = j + 1
          const quoted = s.slice(i, end).trim()
          if (quoted !== '') out.push(quoted)
          i = end
          continue
        }
        plain += ch
        i += 1
      }
      for (const seg of splitPlainSegs(plain)) out.push(seg)
      return out
    }
    const normPath = (p) => splitTitleSegs(p).join('/')

    /** Render a primitives icon by name; unknown names degrade to null, never crash. */
    const icon = (name, size) => {
      const C = ui[name]
      return C ? E(C, { size: size || 16 }) : null
    }

    /**
     * Pin glyph, embedded from Lucide "pin" (v0.545.0, ISC license,
     * https://lucide.dev) because the dsh primitives set ships no pin. Same
     * outline language as the ic_ds family: stroke=currentColor, 24 viewBox
     * rendered at 14~16px so the visual weight matches IconClockOutline16.
     */
    const PinIcon16 = ({ size = 14, className }) => E('svg', {
      width: size, height: size, className: className || undefined, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': 'true', focusable: 'false',
    },
      E('path', { d: 'M12 17v5' }),
      E('path', { d: 'M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z' }),
    )

    /**
     * View-mode glyphs, embedded from Lucide (v0.545.0, ISC license,
     * https://lucide.dev): the header button previews the shape of the ACTIVE
     * view — a branching tree for the projects view, a calendar for the time
     * view — same stroke conventions as PinIcon16.
     */
    const lucideSvg = (size, className, children) => E('svg', {
      width: size, height: size, className: className || undefined, viewBox: '0 0 24 24',
      fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round',
      'aria-hidden': 'true', focusable: 'false',
    }, ...children)
    const ListTreeIcon16 = ({ size = 14, className }) => lucideSvg(size, className, [
      E('path', { d: 'M8 5h13' }),
      E('path', { d: 'M13 12h8' }),
      E('path', { d: 'M13 19h8' }),
      E('path', { d: 'M3 10a2 2 0 0 0 2 2h3' }),
      E('path', { d: 'M3 5v12a2 2 0 0 0 2 2h3' }),
    ])
    const CalendarDaysIcon16 = ({ size = 14, className }) => lucideSvg(size, className, [
      E('path', { d: 'M8 2v4' }),
      E('path', { d: 'M16 2v4' }),
      E('rect', { width: '18', height: '18', x: '3', y: '4', rx: '2' }),
      E('path', { d: 'M3 10h18' }),
      E('path', { d: 'M8 14h.01' }),
      E('path', { d: 'M12 14h.01' }),
      E('path', { d: 'M16 14h.01' }),
      E('path', { d: 'M8 18h.01' }),
      E('path', { d: 'M12 18h.01' }),
      E('path', { d: 'M16 18h.01' }),
    ])

    /**
     * Time bucket for the sorted views: local-calendar day boundaries (the
     * label a user reads, not a UTC slice), then 7d / 30d windows, else
     * "earlier". updatedAt 0 (unknown) lands in "earlier".
     */
    const bucketOf = (updatedAt, now) => {
      const t = Number(updatedAt) || 0
      if (t <= 0) return 'earlier'
      const n = new Date(now)
      const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime()
      if (t >= today) return 'today'
      if (t >= today - 86400000) return 'yesterday'
      if (t >= today - 7 * 86400000) return 'week'
      if (t >= today - 30 * 86400000) return 'month'
      return 'earlier'
    }
    const BUCKET_ORDER = ['today', 'yesterday', 'week', 'month', 'earlier']

    const FALLBACK_UNITS = { minutes: 'm', hours: 'h', days: 'd', months: 'mo', years: 'y' }
    const timeLabel = (updatedAt, now, t) => {
      if (typeof ui.relativeTime !== 'function') return ''
      const r = ui.relativeTime(updatedAt, now)
      if (!r) return ''
      if (r.unit === 'now') return t('time.now')
      const key = 'time.' + r.unit
      const out = t(key, { n: r.n })
      if (typeof out === 'string' && out !== '' && out !== key) return out
      return String(r.n) + (FALLBACK_UNITS[r.unit] || '')
    }

    const pendingKindOf = (pending, id) => {
      if (!pending) return undefined
      const p = typeof pending.get === 'function' ? pending.get(id) : pending[id]
      if (!p) return undefined
      return p.kind || p.status || p.type || 'pending'
    }

    const sessionTitleOf = (summary, t) => {
      if (!summary) return ''
      if (summary.blank) return t('session.new')
      return String(summary.displayTitle || summary.title || '')
    }

    /**
     * Official visibility rule (dsh tree.ts sessionVisible): subagent children
     * live in their parent's catalog, archived sessions are visible nowhere,
     * and a blank row is the provisional New Session of the current selection.
     */
    const sessionVisible = (summary, current, archivedSet) => !!summary
      && summary.origin !== 'subagent'
      && !(archivedSet && archivedSet.has(summary.id))
      && (!summary.blank || summary.id === current)

    /**
     * Active-schedule marker, mirroring the official tree's
     * hasActiveSchedule(): the list projection carries one entry per active
     * Schedule record, and a non-empty projection is the badge's only gate.
     * Defensive shapes (missing/mis-typed projection) degrade to false.
     */
    const hasActiveScheduleOf = (summary) => !!(summary
      && summary.projectionValues
      && Array.isArray(summary.projectionValues.schedule)
      && summary.projectionValues.schedule.length > 0)

    /**
     * Running subagent descendants per session (light lineage walk over
     * parent links) — a parent row keeps its "ongoing" ring while a spawned
     * subagent is still working. The client SessionSummary exposes the
     * parent as parentId (the session controller maps parentSessionId to
     * parentId on the wire); the old parentSessionId spelling is kept as a
     * fallback for profiles serving the pre-rename shape.
     */
    const subagentRunningCounts = (byId) => {
      const children = new Map()
      for (const id of Object.keys(byId || {})) {
        const summary = byId[id]
        const parentId = summary && (summary.parentId || summary.parentSessionId)
        if (!summary || !parentId) continue
        let list = children.get(parentId)
        if (!list) { list = []; children.set(parentId, list) }
        list.push(summary)
      }
      const countFor = (rootId) => {
        let count = 0
        const queue = (children.get(rootId) || []).slice()
        const seen = new Set([rootId])
        while (queue.length > 0) {
          const summary = queue.shift()
          if (!summary || seen.has(summary.id)) continue
          seen.add(summary.id)
          if (summary.running) count += 1
          const kids = children.get(summary.id)
          if (kids) for (const kid of kids) queue.push(kid)
        }
        return count
      }
      const counts = new Map()
      for (const id of Object.keys(byId || {})) counts.set(id, countFor(id))
      return counts
    }

    /**
     * Session nesting inside one workspace: same "/" convention as workspace
     * titles. Groups are virtual (projection of names). Rows keep the Host
     * workspace.sessionIds (manual) order — drag-to-reorder must be visible.
     */
    function buildSessionTree(rows) {
      const root = { path: '', name: '', groups: [], sessions: [] }
      const byPath = new Map([['', root]])
      // SEGMENT-driven: paths arrive as already-split segment arrays (URL-aware
      // splitTitleSegs can yield segments containing "//", e.g. the
      // "scheme://host" authority segment) and are joined into the path KEY
      // verbatim — never re-split on "/", which would shred an authority
      // segment into "https:" + "" + host.
      const ensure = (segs) => {
        let node = root
        let key = ''
        for (const seg of segs) {
          key = key === '' ? seg : key + '/' + seg
          let next = byPath.get(key)
          if (!next) {
            next = { path: key, name: seg, groups: [], sessions: [] }
            byPath.set(key, next)
            node.groups.push(next)
          }
          node = next
        }
        return node
      }
      for (const row of rows || []) {
        const segs = splitTitleSegs(row.title)
        const folderPath = segs.slice(0, -1).join('/')
        const leaf = segs.length > 0 ? segs[segs.length - 1] : row.title
        ensure(segs.slice(0, -1)).sessions.push({ ...row, leaf })
      }
      const sortRec = (node) => {
        node.groups.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        for (const group of node.groups) sortRec(group)
      }
      sortRec(root)
      return root
    }

    const countSessionTree = (node) => node.sessions.length + node.groups.reduce((sum, group) => sum + countSessionTree(group), 0)

    const collectSessionRows = (node) => {
      const out = node.sessions.slice()
      for (const group of node.groups) out.push(...collectSessionRows(group))
      return out
    }

    const findSessionGroup = (node, path) => {
      if (node.path === path) return node
      for (const group of node.groups) {
        const hit = findSessionGroup(group, path)
        if (hit) return hit
      }
      return null
    }

    /**
     * Build the folder tree. Folders are virtual: they exist where workspace
     * titles contain "/", plus the explicit empty folders the user created.
     * Returns { path, name, folders, workspaces } with workspaces carrying
     * their leaf display name.
     */
    function buildTree(items, explicitFolders) {
      const root = { path: '', name: '', folders: [], workspaces: [] }
      const byPath = new Map([['', root]])
      // SEGMENT-driven, same as buildSessionTree: the joined path is only a
      // KEY; parsing it back on "/" would break URL authority segments.
      const ensure = (segs) => {
        let node = root
        let key = ''
        for (const seg of segs) {
          key = key === '' ? seg : key + '/' + seg
          let next = byPath.get(key)
          if (!next) {
            next = { path: key, name: seg, folders: [], workspaces: [] }
            byPath.set(key, next)
            node.folders.push(next)
          }
          node = next
        }
        return node
      }
      for (const folder of explicitFolders || []) {
        const segs = splitTitleSegs(normPath(folder))
        if (segs.length > 0) ensure(segs)
      }
      for (const workspace of items || []) {
        const segs = splitTitleSegs(workspace.title)
        const folderPath = segs.slice(0, -1).join('/')
        const leaf = segs.length > 0 ? segs[segs.length - 1] : (basename(workspace.path) || String(workspace.title || '') || String(workspace.workspaceId || ''))
        ensure(segs.slice(0, -1)).workspaces.push({
          workspaceId: workspace.workspaceId,
          title: String(workspace.title || ''),
          path: String(workspace.path || ''),
          sessionIds: Array.isArray(workspace.sessionIds) ? workspace.sessionIds : [],
          leaf,
          folderPath,
        })
      }
      const sortRec = (node) => {
        node.folders.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
        for (const child of node.folders) sortRec(child)
      }
      sortRec(root)
      return root
    }

    const countWorkspaces = (node) => (node.kind === 'ws' ? 1 : node.workspaces.length + node.folders.reduce((sum, f) => sum + countWorkspaces(f), 0))

    /**
     * VS Code-style single-child chain compression (preference-controlled):
     * a folder level holding exactly ONE child and nothing else merges into a
     * single display row; a chain ending in one workspace becomes that
     * workspace row with the merged label. Only presentation changes; the
     * underlying workspace/title data is untouched.
     *
     * The merged label is the chain RELATIVE to the first un-compressed
     * ancestor (VS Code explorer behaviour): a chain a/b/c holding only
     * workspace W shows "a/b/c/W" at the root, but the same chain nested
     * inside a populated folder "a" shows "b/c/W". Labels are therefore
     * assembled from RELATIVE segments (segs + pure leaf name) and only
     * materialised into a display node at the chain's top — the pre-0.8 code
     * prefixed each recursion level with the FULL node.path, so nested chains
     * rendered duplicated prefixes like "1/2/1/2/3/A".
     */
    const materializeChain = (chain) => chain.kind === 'ws'
      ? {
        kind: 'ws',
        path: chain.path,
        workspace: { ...chain.workspace, leaf: chain.segs.join('/') + '/' + chain.pure, title: chain.workspace.title, folderPath: '' },
        folders: [],
        workspaces: [],
      }
      : { kind: 'folder', path: chain.path, name: chain.segs.join('/'), folders: chain.folders, workspaces: chain.workspaces }

    function compressTree(node) {
      const folders = (node.folders || []).map(compressTree)
      const workspaces = node.workspaces || []
      if (workspaces.length === 0 && folders.length === 1) {
        // Continue the chain upward: one more relative segment in front of
        // whatever the child chain accumulated. path stays the DEEPEST full
        // path (expansion identity); the label is joined only at the top.
        const child = folders[0]
        return {
          kind: child.kind,
          path: child.path,
          segs: [node.name].concat(child.segs || []),
          pure: child.pure,
          workspace: child.workspace,
          folders: child.folders,
          workspaces: child.workspaces,
        }
      }
      if (folders.length === 0 && workspaces.length === 1) {
        return { kind: 'ws', path: node.path, segs: [node.name], pure: workspaces[0].leaf, workspace: workspaces[0], folders: [], workspaces: [] }
      }
      // Chain top (multiple children, or a mix): children are materialised
      // relative to this node; this node itself keeps its single name.
      return { kind: 'folder', path: node.path, segs: [node.name], folders: folders.map(materializeChain), workspaces }
    }

    /* ============================== styles ============================ */

    const CSS_TEXT = [
      '.bw-root{height:100%;display:flex;flex-direction:column;min-height:0;position:relative;color:var(--dsw-alias-label-primary,#e6e6e6);container-type:inline-size}',
      '.bw-header{display:flex;align-items:center;gap:2px;padding:10px 10px 4px;flex:none}',
      '.bw-header-title{flex:1;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,#b8b8b8);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.bw-icon-btn{flex:none;width:24px;height:24px;border:none;background:transparent;border-radius:6px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}',
      '.bw-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15));color:var(--dsw-alias-label-primary,#e6e6e6)}',
      '.bw-search-row{flex:none;padding:0 10px 6px}',
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
      '.bw-dot{flex:none;width:6px;height:6px;border-radius:50%;background:transparent}',
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
      '.bw-ctx-danger{color:var(--dsw-alias-state-error-primary,#f85149)}',
      '.bw-ctx-sep{height:1px;background:var(--dsw-alias-border-l1,rgba(127,127,127,.2));margin:4px 6px}',
      '.bw-settings{display:flex;flex-direction:column;gap:6px;max-width:640px}',
      '.bw-plugin-card{list-style:none;border:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18));border-radius:12px;background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.05));transition:border-color .16s,background .16s}',
      '.bw-plugin-card:hover{border-color:var(--dsw-alias-label-dimmed,#7a7a7a)}',
      '.bw-plugin-card-open{background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border-color:var(--dsw-alias-label-dimmed,#7a7a7a)}',
      '.bw-plugin-head{width:100%;appearance:none;border:0;background:none;font:inherit;color:inherit;text-align:left;cursor:pointer;display:flex;align-items:center;gap:12px;padding:14px 16px;border-radius:12px}',
      '.bw-plugin-head:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}',
      '.bw-plugin-headtext{flex:1;min-width:0;display:flex;flex-direction:column;gap:4px}',
      '.bw-plugin-name{font-size:15px;font-weight:600;line-height:1.4;color:var(--dsw-alias-label-primary,#e6e6e6)}',
      '.bw-plugin-desc{font-size:13px;line-height:1.5;color:var(--dsw-alias-label-tertiary,#9a9a9a)}',
      '.bw-plugin-chevron{flex:none;color:var(--dsw-alias-label-tertiary,#9a9a9a);transition:transform .16s}',
      '.bw-plugin-chevron-open{transform:rotate(180deg)}',
      '.bw-plugin-body{border-top:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18));margin:0 16px;padding:12px 0 16px}',
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
      '.bw-glow-row{display:flex;align-items:center;gap:10px}',
      '.bw-slider{flex:1;accent-color:var(--dsw-alias-brand-primary,#5b8def);height:22px}',
      '.bw-glow-value{min-width:44px;text-align:right;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8);font-variant-numeric:tabular-nums}',
      '.bw-preview{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:6px;min-height:28px}',
      '.bw-preview-icon{flex:none;display:grid;place-items:center;width:20px;height:20px;color:var(--dsw-alias-label-primary,#e6e6e6)}',
      '.bw-preview-icon svg{width:18px;height:18px}',
      '.bw-preview-label{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}',
      '.bw-pulse{animation:bw-breathe 1.8s ease-in-out infinite}',
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

    const StyleNode = () => E('style', null, CSS_TEXT)

    /* ========================== view store =========================== */

    const createViewStore = () => storeKit.defineStore({
      // View model: prefs.viewMode ∈ projects|time; prefs.timeDirection only
      // matters in the time view. Legacy sortMode values (manual/latest/oldest)
      // map onto the pair when read — see viewStateOf below.
      init: () => ({ folders: [], expanded: {}, sessionsExpanded: {}, sessionGroups: {}, prefs: { compactChains: true, viewMode: 'projects', timeDirection: 'latest' }, styling: {}, pinned: [] }),
      // NOTE: hydration REPLACES the state with the persisted whole value —
      // init defaults never merge. Every action must tolerate a missing key
      // (states persisted by older plugin versions lack sessionGroups), and
      // every selector read takes a fallback.
      persist: 'dsh.betterWorkspace.view.v1',
      actions: {
        setExpanded: (d, key, value) => { if (!d.expanded) d.expanded = {}; d.expanded[key] = value },
        setSessionsExpanded: (d, key, value) => { if (!d.sessionsExpanded) d.sessionsExpanded = {}; d.sessionsExpanded[key] = value },
        setSessionGroupExpanded: (d, key, value) => { if (!d.sessionGroups) d.sessionGroups = {}; d.sessionGroups[key] = value },
        setPref: (d, key, value) => { if (!d.prefs) d.prefs = {}; d.prefs[key] = value },
        setStyling: (d, key, value) => { if (!d.styling) d.styling = {}; if (value === null) delete d.styling[key]; else d.styling[key] = value },
        setViewMode: (d, mode) => { if (!d.prefs) d.prefs = {}; d.prefs.viewMode = mode === 'time' ? 'time' : 'projects' },
        setTimeDirection: (d, dir) => { if (!d.prefs) d.prefs = {}; d.prefs.timeDirection = dir === 'oldest' ? 'oldest' : 'latest' },
        // Pin order IS the visual order: most recent unshift first. Removing
        // keeps the rest of the order intact. Session ids are stable host ids.
        togglePin: (d, id) => {
          if (!Array.isArray(d.pinned)) d.pinned = []
          const key = String(id)
          if (d.pinned.includes(key)) d.pinned = d.pinned.filter(p => p !== key)
          else d.pinned = [key].concat(d.pinned)
        },
        addFolder: (d, path) => {
          if (!Array.isArray(d.folders)) d.folders = []
          const p = normPath(path)
          if (p !== '' && !d.folders.includes(p)) d.folders.push(p)
        },
        removeFolder: (d, path) => {
          if (!Array.isArray(d.folders)) d.folders = []
          d.folders = d.folders.filter(f => f !== path)
        },
        renameFolder: (d, oldPath, newPath) => {
          if (!Array.isArray(d.folders)) d.folders = []
          const oo = oldPath + '/'
          const nn = newPath + '/'
          const next = d.folders.map(f => (f === oldPath ? newPath : (f.startsWith(oo) ? nn + f.slice(oo.length) : f)))
          d.folders = Array.from(new Set(next))
        },
      },
    })

    /* ============================ flow dialog ========================= */

    const BTN = (props) => (
      ui.Button
        ? E(ui.Button, props)
        : E('button', { type: 'button', className: cls('bw-btn', props.variant === 'primary' && 'bw-btn-primary'), onClick: props.onClick, disabled: props.disabled }, props.children)
    )

    function TextDialog({ title, hint, initial, confirmLabel, onConfirm, onClose, t }) {
      const [value, setValue] = React.useState(initial)
      const inputRef = React.useRef(null)
      React.useEffect(() => { if (inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [])
      const commit = () => onConfirm(value)
      return E(ui.Modal, {
        open: true,
        onClose,
        closeLabel: t('close'),
        title,
        footer: E('div', { className: 'bw-modal-actions' },
          E(BTN, { variant: 'outline', onClick: onClose }, t('cancel')),
          E(BTN, { variant: 'primary', onClick: commit }, confirmLabel || t('confirm')),
        ),
      },
        E('div', { className: 'bw-modal-body' },
          E('div', { className: 'bw-field' },
            E('input', {
              ref: inputRef,
              className: 'bw-input',
              value,
              onChange: (e) => setValue(e.target.value),
              onKeyDown: (e) => { if (e.key === 'Enter') commit() },
            }),
            hint ? E('div', { className: 'bw-hint' }, hint) : null,
          ),
        ),
        StyleNode(),
      )
    }

    function ConfirmDialog({ title, body, onConfirm, onClose, t }) {
      return E(ui.Modal, {
        open: true,
        onClose,
        closeLabel: t('close'),
        title,
        footer: E('div', { className: 'bw-modal-actions' },
          E(BTN, { variant: 'outline', onClick: onClose }, t('cancel')),
          E(BTN, { variant: 'primary', onClick: onConfirm }, t('confirm')),
        ),
      }, E('div', { className: 'bw-modal-body' }, E('div', { className: 'bw-hint' }, body)), StyleNode())
    }

    /**
     * Render crash insurance: dsh boots all-or-nothing (one failed entry
     * fails the whole web boot) and React unmounts the root on an uncaught
     * render error — so our registrations render behind this boundary and a
     * bug degrades to "region renders nothing", never a blank application.
     */
    class QuietBoundary extends React.Component {
      constructor(props) {
        super(props)
        this.state = { failed: false }
      }
      static getDerivedStateFromError() {
        return { failed: true }
      }
      componentDidCatch(error, info) {
        console.error('[dsh-workspace-plus] render error (region degraded to empty)', error, info)
      }
      render() {
        return this.state.failed ? null : this.props.children
      }
    }

    /**
     * The add-workspace picking interaction: native directory pick, then a
     * small parent-group popup, then create + rename with the chosen prefix.
     * Works as a directoryFlow occupant (owner conversation props) and as the
     * browser's directly composed flow (same props, owner state lives above).
     */
    function BetterFlow(props) {
      const { open, busy, onPicked, onCancel, onError, createWorkspace, renameWorkspace, pickDirectory, useWorkspaces, useStore, t } = props
      const initialParent = props.initialParent || ''
      const actions = props.actions
      const [phase, setPhase] = React.useState('idle') // idle | picking | picked | submitting
      const [pickedPath, setPickedPath] = React.useState('')
      const [parentInput, setParentInput] = React.useState('')
      // All hooks run before any early return: the flow unmounts its dialog
      // while closed, but its hook sequence must stay stable.
      const snapshotItems = typeof useWorkspaces === 'function' ? useWorkspaces(s => s.items) : []
      const storeFolders = typeof useStore === 'function' ? (useStore(s => s.folders) || []) : []

      React.useEffect(() => {
        if (!open) {
          setPhase('idle')
          setPickedPath('')
          setParentInput('')
          return
        }
        let alive = true
        setPhase('picking')
        Promise.resolve()
          .then(() => pickDirectory())
          .then((path) => {
            if (!alive) return
            if (!path) { onCancel(); return }
            setPickedPath(String(path))
            setParentInput(initialParent)
            setPhase('picked')
          })
          .catch((reason) => {
            if (!alive) return
            setPhase('idle')
            onError(messageOf(reason))
          })
        return () => { alive = false }
      }, [open])

      if (!open || (phase !== 'picked' && phase !== 'submitting')) return null

      const folderOptions = (() => {
        const set = new Set(storeFolders)
        for (const w of snapshotItems || []) {
          const segs = splitTitleSegs(w.title)
          for (let i = 1; i < segs.length; i++) set.add(segs.slice(0, i).join('/'))
        }
        return Array.from(set).sort((a, b) => a.localeCompare(b, 'zh'))
      })()

      const confirm = () => {
        if (phase === 'submitting') return
        const prefix = normPath(parentInput)
        const base = basename(pickedPath)
        const fullTitle = prefix !== '' ? prefix + '/' + base : base
        setPhase('submitting')
        Promise.resolve()
          .then(() => createWorkspace({ path: pickedPath }))
          .then(async (workspace) => {
            try {
              await renameWorkspace(workspace.workspaceId, fullTitle)
            } catch (renameError) {
              onError(messageOf(renameError))
              onCancel()
              return
            }
            if (prefix !== '' && actions && typeof actions.addFolder === 'function') actions.addFolder(prefix)
            onCancel()
          })
          .catch((reason) => {
            onError(messageOf(reason))
            onCancel()
          })
      }

      const submitting = phase === 'submitting' || busy === true
      const datalistId = 'bw-folder-options'
      const body = E('div', { className: 'bw-modal-body' },
        E('div', { className: 'bw-field' },
          t('flow.picked'),
          E('div', { className: 'bw-path-echo' }, pickedPath),
        ),
        E('div', { className: 'bw-field' },
          t('flow.parent'),
          E('div', { className: 'bw-dialog-input-row' },
            E('input', {
              className: 'bw-input',
              list: datalistId,
              value: parentInput,
              autoFocus: true,
              placeholder: 'web/frontend',
              disabled: submitting,
              onChange: (e) => setParentInput(e.target.value),
              onKeyDown: (e) => { if (e.key === 'Enter') confirm() },
            }),
            E('datalist', { id: datalistId },
              folderOptions.map((option) => E('option', { key: option, value: option })),
            ),
          ),
          E('div', { className: 'bw-hint' }, t('flow.parentHint')),
        ),
      )
      const footer = E('div', { className: 'bw-modal-actions' },
        E(BTN, { variant: 'outline', onClick: onCancel, disabled: submitting }, t('cancel')),
        E(BTN, { variant: 'primary', onClick: confirm, disabled: submitting }, submitting ? t('flow.creating') : t('create')),
      )
      return E(ui.Modal, { open: true, onClose: () => { if (!submitting) onCancel() }, closeLabel: t('close'), title: t('flow.title'), footer }, body, StyleNode())
    }

    /* ============================== rows ============================== */

    /** Folder glyph variants from the primitives family (solid / outline / hidden). */
    /** Custom icon value → glyph: legacy slots (solid/outline/none) or any primitives icon name. */
    const iconOf = (mode, expanded) => {
      if (!mode || mode === 'none') return null
      if (mode === 'solid') return icon(expanded ? 'IconFolderOpen16' : 'IconFolderClose16')
      if (mode === 'outline') return icon('IconFolderOpenOutline16')
      return icon(mode)
    }

    const colorToRgb = (hex) => {
      if (!hex) return null
      const m = /^#?([0-9a-fA-F]{6})$/.exec(hex)
      if (!m) return null
      const v = parseInt(m[1], 16)
      return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
    }
    const rgbToHex = (r, g, b) => '#' + [r, g, b]
      .map(n => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'))
      .join('')

    function FolderRow({ node, depth, expanded, onToggle, onContextMenu, dropInto, dragEvents, custStyle, iconMode, pulse, t }) {
      const total = countWorkspaces(node)
      const iconEl = iconOf(iconMode, expanded)
      // Hidden status dots breathe on the icon; with the icon hidden (mode
      // "none" or a missing primitive) the official StateDot stands in.
      const iconChild = pulse
        ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null))
        : iconEl
      return E('div', {
        className: cls('bw-row', dropInto && 'bw-drop-into'),
        style: { paddingLeft: 4 + depth * 12, ...(custStyle || {}), ...(pulse ? { '--bw-pulse-color': PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null) },
        onClick: onToggle,
        onContextMenu: onContextMenu,
        role: 'treeitem',
        'aria-expanded': expanded,
        ...(dragEvents || {}),
      },
        E('span', { className: cls('bw-chevron', expanded && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
        E('span', { className: 'bw-row-icon' }, iconChild),
        // A row that already carries a custom label glow breathes in sync.
        E('span', { className: cls('bw-row-label', pulse && custStyle && custStyle.textShadow && 'bw-pulse-text') }, node.name),
        total > 0 ? E('span', { className: 'bw-row-count' }, String(total)) : null,
      )
    }

    function WorkspaceRow({ workspace, depth, count, sessionsOpen, onToggle, onStart, onContextMenu, currentInside, dropHalf, dragEvents, custStyle, iconMode, pulse, pinCount, t }) {
      const iconEl = iconOf(iconMode, sessionsOpen)
      const iconChild = pulse
        ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null))
        : iconEl
      return E('div', {
        className: cls('bw-row', currentInside && 'bw-row-current', dropHalf === 'before' && 'bw-drop-before', dropHalf === 'after' && 'bw-drop-after'),
        style: { paddingLeft: 6 + depth * 12, ...(custStyle || {}), ...(pulse ? { '--bw-pulse-color': PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null) },
        onClick: onToggle,
        onContextMenu: onContextMenu,
        role: 'treeitem',
        'aria-expanded': sessionsOpen,
        ...(dragEvents || {}),
      },
        E('span', { className: cls('bw-chevron', sessionsOpen && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
        E('span', { className: 'bw-row-icon' }, iconChild),
        E('span', { className: cls('bw-row-label', pulse && custStyle && custStyle.textShadow && 'bw-pulse-text'), title: workspace.title || workspace.leaf }, workspace.leaf),
        pinCount > 0 ? E('span', { className: 'bw-pin-ind', 'aria-label': t('pinned.header'), title: t('pinned.header') }, E(PinIcon16, { size: 10 }), String(pinCount)) : null,
        count > 0 ? E('span', { className: 'bw-row-count' }, String(count)) : null,
        E('span', { className: 'bw-row-actions', onClick: (e) => e.stopPropagation() },
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('session.new'), onClick: (e) => { e.stopPropagation(); onStart() } }, icon('IconPlusOutline16')),
        ),
      )
    }

    // Official status priority: pending interaction > running > running
    // subagents > completed reminder; idle rows show no dot at all.
    const sessionStateOf = (row) => {
      if (!row) return null
      if (row.pending === 'approval' || row.pending === 'plan-review' || row.pending === 'question') return 'warning'
      if (row.running || row.subagents > 0) return 'ongoing'
      if (row.completed) return 'done'
      return null
    }

    /**
     * Status breathing light (preference-controlled, default ON): status dots
     * hidden by a collapse bubble outward to the nearest visible container
     * row. Workspace/folder rows breathe on their icon (drop-shadow glow in
     * the status color; a hidden/no icon falls back to the official StateDot);
     * session-group rows carry a breathing StateDot in front of the label.
     * Colors mirror the official dots: warning amber > ongoing blue > done
     * green, so the glow always matches the lamp it relays.
     */
    const PULSE_RANK = { warning: 3, ongoing: 2, done: 1 }
    const PULSE_COLORS = { warning: '#d29922', ongoing: '#5b8def', done: '#3fb950' }
    const pulseRank = (state) => (state ? (PULSE_RANK[state] || 0) : 0)

    function PulseGlow({ state, children }) {
      return E('span', {
        className: 'bw-pulse',
        style: { '--bw-pulse-color': PULSE_COLORS[state] || PULSE_COLORS.ongoing },
      }, children)
    }

    // RUNNING deliberately stays on the session row itself (its official ring
    // breathes blue there) and does NOT bubble outward — the user found the
    // ongoing relay noisy. Only pending-amber and done-green propagate.
    const relayStateOf = (row) => {
      const s = sessionStateOf(row)
      return s === 'ongoing' ? null : s
    }

    function SessionRow({ node, depth, current, onOpen, onContextMenu, now, dropHalf, dragEvents, custStyle, breathing, pinned, onTogglePin, workspaceTag, tagOnHover, tooltip, t }) {
      const state = sessionStateOf(node)
      const status = state === null ? null : {
        state,
        title: state === 'warning'
          ? t('status.' + (node.pending === 'plan-review' ? 'planReview' : node.pending))
          : state === 'ongoing'
            ? (node.running ? t('status.running') : t('status.subagents', { n: node.subagents }))
            : t('status.completed'),
      }
      // Hover tooltip label: line 1 is the full title, line 2 the project ·
      // absolute timestamp. Built only while the bubble is visible (the
      // primitives resolver). updatedAt 0 contributes no time part; a blank
      // workspace tag drops the meta segment.
      const hasHoverLabel = tooltip === true
      const hoverLabel = hasHoverLabel
        ? () => {
          const meta = [workspaceTag, Number(node.updatedAt) > 0 ? new Date(Number(node.updatedAt)).toLocaleString() : ''].filter(Boolean).join(' · ')
          const title = node.leaf || node.title
          return meta !== '' ? title + '\n' + meta : title
        }
        : null
      const nativeTitle = hasHoverLabel && typeof ui.Tooltip !== 'function'
        ? hoverLabel()
        : undefined
      const row = E('div', {
        className: cls('bw-row', 'bw-session-row', current && 'bw-row-current', pinned && 'bw-session-row-pinned', workspaceTag && !tagOnHover && 'bw-tray-row', dropHalf === 'before' && 'bw-drop-before', dropHalf === 'after' && 'bw-drop-after'),
        title: nativeTitle,
        style: { paddingLeft: 8 + depth * 12, ...(custStyle || {}) },
        onClick: () => onOpen(node.id),
        onContextMenu: onContextMenu,
        role: 'treeitem',
        'aria-current': current || undefined,
        ...(dragEvents || {}),
      },
        pinned ? E('span', { className: 'bw-pin-mark' }, E(PinIcon16, null)) : null,
        E('span', { className: 'bw-row-icon', title: status ? status.title : undefined },
          status && typeof ui.StateDot === 'function'
            ? (state === 'ongoing' && breathing
              // Running breathes blue ON the session row only (never relays);
              // the settings toggle covers this breathing too.
              ? E(PulseGlow, { state: 'ongoing' }, E(ui.StateDot, { state: status.state, size: 10 }))
              : E(ui.StateDot, { state: status.state, size: 10 }))
            : E('span', { className: 'bw-dot' }),
        ),
        E('span', { className: 'bw-row-label' }, node.leaf || node.title),
        workspaceTag ? E('span', { className: cls('bw-pinned-ws-tag', tagOnHover && 'bw-ws-tag-hover'), title: workspaceTag }, workspaceTag) : null,
        node.hasActiveSchedule
          ? E('span', { className: 'bw-schedule-badge', role: 'img', 'aria-label': t('schedule.active'), title: t('schedule.active') }, icon('IconAlarmClockOutline16', 14))
          : null,
        E('span', { className: 'bw-row-time' }, timeLabel(node.updatedAt, now, t)),
        typeof onTogglePin === 'function'
          ? E('span', { className: 'bw-row-actions', onClick: (e) => e.stopPropagation() },
            E('button', {
              type: 'button', className: 'bw-icon-btn', 'aria-pressed': pinned ? 'true' : 'false',
              'aria-label': pinned ? t('menu.unpin') : t('menu.pin'), title: pinned ? t('menu.unpin') : t('menu.pin'),
              onClick: (e) => { e.stopPropagation(); onTogglePin(node.id) },
            }, E(PinIcon16, null)),
          ) : null,
      )
      // The official primitives Tooltip replaces the native title when the
      // runtime ships it: same bubble as every dsh surface, anchored UNDER
      // the session row (side bottom centers it on the row and the built-in
      // viewport fit slides it back inside the edges).
      if (hasHoverLabel && typeof ui.Tooltip === 'function') {
        return E(ui.Tooltip, { label: hoverLabel, side: 'bottom', delayMs: 300, maxWidth: 320 }, row)
      }
      return row
    }

    /**
     * Session sub-group inside a workspace (same "/" convention on session
     * titles). Deliberately NOT styled like a workspace folder — no folder
     * icon, tertiary color — so a session level never reads as a workspace.
     */
    function SessionGroupRow({ name, depth, expanded, count, onToggle, onContextMenu, dropInto, dragEvents, custStyle, pulse, t }) {
      return E('div', {
        className: cls('bw-row', 'bw-sgroup-row', dropInto && 'bw-drop-into'),
        style: { paddingLeft: 10 + depth * 12, ...(custStyle || {}) },
        onClick: onToggle,
        onContextMenu: onContextMenu,
        role: 'treeitem',
        'aria-expanded': expanded,
        ...(dragEvents || {}),
      },
        E('span', { className: cls('bw-chevron', expanded && 'bw-chevron-open') }, icon('IconTriangleRightFill14', 14)),
        // Session groups have no icon slot: a collapsed group with hidden
        // status relays through a breathing official StateDot instead.
        pulse ? E(PulseGlow, { state: pulse }, typeof ui.StateDot === 'function' ? E(ui.StateDot, { state: pulse, size: 10 }) : null) : null,
        E('span', { className: 'bw-row-label' }, name),
        count > 0 ? E('span', { className: 'bw-row-count' }, String(count)) : null,
      )
    }

    /* --------------------- customization dialog ----------------------- */

    const SWATCHES = ['', '#5b8def', '#3fb950', '#d29922', '#f85149', '#a371f7', '#39c5cf', '#ec6cb9', '#ff9f45', '#6e7681']
    const GLOW_MAX = 14
    const ICON_CHOICES = [
      'solid', 'outline', 'none',
      'IconProjectAddOutline16', 'IconBranchOutline16', 'IconArchiveOutline20', 'IconCodeOutline16',
      'IconDataOutline16', 'IconGoalOutline16', 'IconGlobeOutline14', 'IconInspectOutline12',
      'IconCopyOutline16', 'IconLinkOutline16', 'IconListPenOutline16', 'IconChecklistOutline14',
      'IconBrowseOutline16', 'IconDownloadOutline16', 'IconContextInjectionOutline16',
      'IconCordisPluginOutline14', 'IconApiOutline14', 'IconAgentPresetOutline16', 'IconEnhanceOutline16',
      'IconSkillOutline16', 'IconSparkle16', 'IconNewChatOutline16',
      'IconCheckOutline14', 'IconCheckOutline16', 'IconChevronDownOutline14', 'IconChevronLeftOutline14',
      'IconChevronRightOutline14', 'IconChevronUpOutline14', 'IconCloseOutline16', 'IconDarkOutline16',
      'IconEditOutline16', 'IconEllipsisOutline16', 'IconFolderClose16', 'IconFolderOpen16',
      'IconFolderOpenOutline16', 'IconFullscreenOutline16', 'IconLightOutline16', 'IconLinkOutline14',
      'IconLoadingOutline16', 'IconPanelLeftOutline16', 'IconPaperclipOutline16', 'IconPersonalizationOutline16',
      'IconPlayOutline16', 'IconPauseOutline16', 'IconPlusOutline16', 'IconQuestionOutline14',
      'IconQueueOutline14', 'IconRefreshOutline14', 'IconRefreshOutline16', 'IconRightUpOutline14',
      'IconSearchOutline16', 'IconSendOutline14', 'IconSendOutline16', 'IconSettingsOutline14',
      'IconSettingsOutline16', 'IconShareOutline16', 'IconStopFill16', 'IconThinkOutline14',
      'IconThinkOutline16', 'IconTrashOutline16', 'IconUserOutline16', 'IconWarningOutline16',
      'IconLikeOutline16', 'IconDislikeOutline16', 'IconFollowsystemOutline16',
      'IconAlarmClockOutline16', 'IconClockOutline16', 'IconDatabaseOutline16',
    ]

    /**
     * Per-row appearance: color swatches (+ native picker), glow intensity,
     * folder-glyph mode. Committing the defaults clears the entry; Reset
     * removes it entirely.
     */
    function CustomizeDialog({ open, initial, kind, onChange, onReset, onClose, t }) {
      // Icons render only for workspace / workspace-folder rows. Session rows
      // already carry the official status dot (pending/running/done) in the
      // leading slot, and session sub-group rows have no icon either — so the
      // icon grid is offered only where it actually displays.
      const allowIcon = kind === 'folder' || kind === 'workspace'
      const [color, setColor] = React.useState('')
      const [glow, setGlow] = React.useState(0)
      const [iconMode, setIconMode] = React.useState('solid')
      const [weight, setWeight] = React.useState(0)
      const [shadow, setShadow] = React.useState(false)
      React.useEffect(() => {
        if (!open) return
        setColor(initial && initial.color ? initial.color : '')
        setGlow(initial && initial.glow ? Number(initial.glow) || 0 : 0)
        setIconMode(initial && initial.icon ? initial.icon : 'solid')
        setWeight(initial && initial.weight ? Number(initial.weight) || 0 : 0)
        setShadow(initial && initial.shadow === true)
      }, [open, initial])
      if (!open) return null
      const commit = () => {
        const empty = allowIcon
          ? (color === '' && glow === 0 && iconMode === 'solid' && weight === 0 && !shadow)
          : (color === '' && glow === 0 && weight === 0 && !shadow)
        const style = empty
          ? null
          : { color, glow, weight: weight > 0 ? weight : undefined, shadow: shadow || undefined, ...(allowIcon ? { icon: iconMode } : {}) }
        onChange(style)
        onClose()
      }
      const channels = colorToRgb(color)
      const setChannel = (index, raw) => {
        const n = Math.max(0, Math.min(255, parseInt(raw, 10) || 0))
        const base = channels || [0, 0, 0]
        const next = base.slice()
        next[index] = n
        setColor(rgbToHex(next[0], next[1], next[2]))
      }
      const previewShadows = []
      if (glow > 0 && color) previewShadows.push('0 0 ' + glow + 'px ' + color)
      if (shadow) previewShadows.push('1px 1px 2px rgba(0,0,0,.85)')
      return E(ui.Modal, {
        open: true,
        onClose,
        closeLabel: t('close'),
        title: t('custom.title'),
        footer: E('div', { className: 'bw-modal-actions' },
          E(BTN, { variant: 'outline', onClick: () => { onReset(); onClose() } }, t('custom.reset')),
          E(BTN, { variant: 'primary', onClick: commit }, t('custom.done')),
        ),
      },
        E('div', { className: 'bw-modal-body' },
          E('div', { className: 'bw-field' },
            t('custom.color'),
            E('div', { className: 'bw-dialog-input-row' },
              SWATCHES.map((swatch) => E('button', {
                key: swatch || 'none',
                type: 'button',
                className: cls('bw-swatch', color === swatch && 'bw-swatch-active'),
                style: swatch === '' ? undefined : { background: swatch },
                'aria-label': swatch === '' ? t('custom.reset') : swatch,
                onClick: () => setColor(swatch),
              })),
              E('input', {
                type: 'color',
                className: 'bw-color-input',
                value: color || '#5b8def',
                onChange: (e) => setColor(e.target.value),
              }),
            ),
            E('div', { className: 'bw-rgb-row' },
              ['R', 'G', 'B'].map((label, index) => E('label', { key: label, className: 'bw-rgb-label' },
                label,
                E('input', {
                  type: 'number',
                  className: 'bw-rgb-input',
                  min: 0,
                  max: 255,
                  value: channels ? channels[index] : '',
                  placeholder: '—',
                  onChange: (e) => setChannel(index, e.target.value),
                }),
              )),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.glow'),
            E('div', { className: 'bw-glow-row' },
              E('input', {
                type: 'range',
                className: 'bw-slider',
                min: 0,
                max: GLOW_MAX,
                step: 1,
                value: glow,
                'aria-label': t('custom.glow'),
                onChange: (e) => setGlow(Number(e.target.value)),
              }),
              E('span', { className: 'bw-glow-value' }, glow === 0 ? t('custom.none') : glow + 'px'),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.weight'),
            E('div', { className: 'bw-seg' },
              [400, 500, 600, 700].map((wt) => E('button', {
                key: String(wt),
                type: 'button',
                className: cls('bw-seg-btn', weight === wt && 'bw-seg-btn-active'),
                onClick: () => setWeight(wt),
              }, wt === 400 ? t('custom.weight.regular') : wt === 500 ? t('custom.weight.medium') : wt === 600 ? t('custom.weight.semibold') : t('custom.weight.bold'))),
            ),
          ),
          E('div', { className: 'bw-field' },
            t('custom.shadow'),
            E('div', { className: 'bw-seg' },
              E('button', { type: 'button', className: cls('bw-seg-btn', !shadow && 'bw-seg-btn-active'), onClick: () => setShadow(false) }, t('custom.none')),
              E('button', { type: 'button', className: cls('bw-seg-btn', shadow && 'bw-seg-btn-active'), onClick: () => setShadow(true) }, t('settings.on')),
            ),
          ),
          allowIcon ? E('div', { className: 'bw-field' },
            t('custom.icon'),
            E('div', { className: 'bw-icon-grid' },
              ICON_CHOICES.map((mode) => E('button', {
                key: mode,
                type: 'button',
                className: cls('bw-icon-cell', iconMode === mode && 'bw-icon-cell-active'),
                title: mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
                'aria-label': mode === 'solid' ? t('custom.icon.solid') : (mode === 'outline' ? t('custom.icon.outline') : mode),
                onClick: () => setIconMode(mode),
              }, mode === 'none' ? E('span', { className: 'bw-icon-none' }) : iconOf(mode, false))),
            ),
          ) : null,
          E('div', { className: 'bw-field' },
            t('custom.preview'),
            E('div', {
              className: 'bw-preview',
              style: {
                color: color || undefined,
                fontWeight: weight > 0 ? weight : undefined,
                textShadow: previewShadows.length > 0 ? previewShadows.join(',') : undefined,
              },
            },
              allowIcon ? E('span', { className: 'bw-preview-icon' }, iconOf(iconMode, true)) : null,
              E('span', { className: 'bw-preview-label' }, t('custom.preview.sample')),
            ),
          ),
        ),
        StyleNode(),
      )
    }

    /* ------------------------- settings page ------------------------- */

    function BetterWorkspaceSettings({ useStore, actions, t }) {
      const prefs = useStore ? (useStore(s => s.prefs) || {}) : {}
      const compactChains = prefs.compactChains !== false
      const statusPulse = prefs.statusPulse !== false
      // Same legacy mapping as the browser (sortMode 0.1.0-dev builds).
      const viewStateOf = (p) => {
        const legacy = p && p.sortMode
        const mode = (p && p.viewMode) === 'time' || ((p && p.viewMode) === undefined && (legacy === 'latest' || legacy === 'oldest'))
          ? 'time'
          : 'projects'
        const dir = (p && p.timeDirection) === 'oldest' || ((p && p.timeDirection) === undefined && legacy === 'oldest')
          ? 'oldest'
          : 'latest'
        return { mode, dir }
      }
      const { mode: viewMode, dir: timeDirection } = viewStateOf(prefs)
      return E('div', { className: 'bw-settings' },
        StyleNode(),
        E('div', { className: 'bw-setting-row' },
          E('div', { className: 'bw-setting-label' }, t('settings.compactChains')),
          E('button', {
            type: 'button',
            role: 'switch',
            'aria-checked': compactChains,
            'aria-label': t('settings.compactChains'),
            className: cls('bw-switch', compactChains && 'bw-switch-on'),
            onClick: () => { actions.setPref('compactChains', !compactChains) },
          }, E('span', { className: 'bw-switch-thumb' })),
        ),
        E('div', { className: 'bw-hint' }, t('settings.compactChains.hint')),
        E('div', { className: 'bw-setting-row', style: { marginTop: 10 } },
          E('div', { className: 'bw-setting-label' }, t('settings.statusPulse')),
          E('button', {
            type: 'button',
            role: 'switch',
            'aria-checked': statusPulse,
            'aria-label': t('settings.statusPulse'),
            className: cls('bw-switch', statusPulse && 'bw-switch-on'),
            onClick: () => { actions.setPref('statusPulse', !statusPulse) },
          }, E('span', { className: 'bw-switch-thumb' })),
        ),
        E('div', { className: 'bw-hint' }, t('settings.statusPulse.hint')),
        E('div', { className: 'bw-setting-row', style: { marginTop: 10 } },
          E('div', { className: 'bw-setting-label' }, t('view.label')),
          E('div', { className: 'bw-seg', role: 'radiogroup', 'aria-label': t('view.label') },
            [['projects', 'view.projects'], ['time', 'view.time']].map(([mode, key]) => E('button', {
              key: mode,
              type: 'button',
              role: 'radio',
              'aria-checked': viewMode === mode,
              className: cls('bw-seg-btn', viewMode === mode && 'bw-seg-btn-active'),
              onClick: () => { actions.setViewMode(mode) },
            }, t(key))),
          ),
        ),
        viewMode === 'time' ? E('div', { className: 'bw-setting-row' },
          E('div', { className: 'bw-setting-label' }, t('view.time')),
          E('div', { className: 'bw-seg', role: 'radiogroup', 'aria-label': t('view.time') },
            [['latest', 'view.time.latest'], ['oldest', 'view.time.oldest']].map(([dir, key]) => E('button', {
              key: dir,
              type: 'button',
              role: 'radio',
              'aria-checked': timeDirection === dir,
              className: cls('bw-seg-btn', timeDirection === dir && 'bw-seg-btn-active'),
              onClick: () => { actions.setTimeDirection(dir) },
            }, t(key))),
          ),
        ) : null,
        E('div', { className: 'bw-hint' }, t('view.hint')),
      )
    }

    /* --------- settings → plug-ins card (accordion like official cards) --------- */

    function BetterWorkspacePluginCard({ useStore, actions, t }) {
      const [open, setOpen] = React.useState(false)
      const Chevron = ui.IconChevronDownOutline14
      return E('li', { className: cls('bw-plugin-card', open && 'bw-plugin-card-open') },
        E('button', {
          type: 'button',
          className: 'bw-plugin-head',
          'aria-expanded': open,
          'aria-label': (open ? t('settings.collapse') : t('settings.expand')) + ': ' + t('settings.title'),
          onClick: () => setOpen(!open),
        },
          E('span', { className: 'bw-plugin-headtext' },
            E('span', { className: 'bw-plugin-name' }, t('settings.title')),
            E('span', { className: 'bw-plugin-desc' }, t('settings.desc')),
          ),
          Chevron ? E(Chevron, { className: cls('bw-plugin-chevron', open && 'bw-plugin-chevron-open') }) : null,
        ),
        open ? E('div', { className: 'bw-plugin-body' },
          E(BetterWorkspaceSettings, { useStore, actions, t }),
        ) : null,
      )
    }

    /* ============================= browser ============================ */

    function BetterBrowser(props) {
      const {
        wide, expandSidebar,
        useSessions, useSessionPendingInteraction, useWorkspaces,
        useStore, actions,
        startSession, open, renameSession, forkSession, renameWorkspace, deleteWorkspace,
        archiveSession, createWorkspace, pickDirectory, insertWorkspaceBefore, insertSessionBefore,
        t,
      } = props

      if (typeof useWorkspaces !== 'function' || typeof useSessions !== 'function') {
        console.error('[dsh-workspace-plus] standard snapshot hooks missing; browser renders nothing')
        return null
      }

      const items = useWorkspaces(s => s.items)
      const phase = useWorkspaces(s => s.phase)
      const archivedSessionIds = useWorkspaces(s => s.archivedSessionIds) || []
      const list = useSessions(s => s)
      const pending = useSessionPendingInteraction ? useSessionPendingInteraction(s => s) : null
      const storeFolders = useStore ? (useStore(s => s.folders) || []) : []
      const expandedMap = useStore ? (useStore(s => s.expanded) || {}) : {}
      const sessionsExpandedMap = useStore ? (useStore(s => s.sessionsExpanded) || {}) : {}
      const sessionGroupsMap = useStore ? (useStore(s => s.sessionGroups) || {}) : {}
      const prefsMap = useStore ? (useStore(s => s.prefs) || {}) : {}
      const stylingMap = useStore ? (useStore(s => s.styling) || {}) : {}
      const compactChains = prefsMap.compactChains !== false
      // Legacy sortMode (0.1.0 dev builds) maps onto the view model: manual →
      // projects view; latest/oldest → time view with that direction.
      const viewStateOf = (prefs) => {
        const p = prefs || {}
        const legacy = p.sortMode
        const mode = p.viewMode === 'time' || (p.viewMode === undefined && (legacy === 'latest' || legacy === 'oldest'))
          ? 'time'
          : 'projects'
        const dir = p.timeDirection === 'oldest' || (p.timeDirection === undefined && legacy === 'oldest')
          ? 'oldest'
          : 'latest'
        return { mode, dir }
      }
      const { mode: viewMode, dir: timeDirection } = viewStateOf(prefsMap)
      const timeSorted = viewMode === 'time'
      const pinnedList = useStore ? (useStore(s => s.pinned) || []) : []
      const statusPulse = prefsMap.statusPulse !== false
      const archivedSet = React.useMemo(() => new Set(archivedSessionIds), [archivedSessionIds])
      const subCounts = React.useMemo(() => subagentRunningCounts(list ? list.byId : {}), [list ? list.byId : null])
      // Pinned membership set + workspace lookup for the global pinned tray.
      const pinnedSet = React.useMemo(() => new Set(pinnedList.map(String)), [pinnedList])
      const workspaceTitleOf = (workspaceId) => {
        const workspace = (items || []).find(w => w.workspaceId === workspaceId)
        if (!workspace) return ''
        const segs = splitTitleSegs(workspace.title)
        return segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || '')
      }

      const [query, setQuery] = React.useState('')
      const [searchOpen, setSearchOpen] = React.useState(false)
      const [flowOpen, setFlowOpen] = React.useState(false)
      const [flowParent, setFlowParent] = React.useState('') // parent path prefill for the add-workspace flow (context menu entry)
      const [dialog, setDialog] = React.useState(null) // { kind, ... }
      const [ctx, setCtx] = React.useState(null) // context menu { kind, payload, x, y }
      const [customize, setCustomize] = React.useState(null) // { kind, entryKey, name }
      const [errorText, setErrorText] = React.useState(null)
      const [drag, setDrag] = React.useState(null) // { kind: 'workspace'|'session', source, over } | null
      // Workspace drags arm their state one frame LATE (see workspaceDragEvents):
      // arming synchronously re-renders during the dragstart dispatch, the chain
      // expansion inserts rows above the drag source, the cursor leaves the
      // source element, and Chromium cancels the whole gesture. dragEnd clears
      // the timer so a same-tick cancel never leaves a ghost drag behind.
      const wsDragArmTimer = React.useRef(null)
      // Quote-on-land eligibility sets (mount-scoped):
      // - blankSeen: ids observed BLANK in any snapshot. A blank row is a
      //   freshly created New Session, so ONLY these may ever receive an
      //   automatic quote. A titled row missing from blankSeen — rows that
      //   stream into the store after mount, fork children (born titled),
      //   rows hidden by load-time filtering — predates this mount or was
      //   named deliberately, and is NEVER touched. (0.9.1 keyed "fresh" off
      //   the first snapshot instead, so late-arriving OLD sessions were
      //   misquoted; blank is the only trustworthy birth mark.)
      // - humanTouched: ids renamed through THIS component's user actions
      //   (rename dialog, drag into a group, group prefix rewrite). A
      //   user-written "/" is a deliberate grouping; a user-written quote
      //   pair is the verbatim escape. The host pins user titles (a later
      //   automatic name is superseded), so the mark is final.
      // - autoStable: id → { title, since } for freshly landed automatic
      //   titles waiting out the stabilization window below.
      const blankSeenRef = React.useRef(null)
      const humanTouchedRef = React.useRef(null)
      const autoStableRef = React.useRef(null)
      const stableTimerRef = React.useRef(null)
      const [stableTick, setStableTick] = React.useState(0)
      // The wire cannot tell the deterministic fallback title (first user
      // message echo, "/"-prone) from the async LLM name that replaces it
      // seconds later — SessionSummary carries no source field. So a landed
      // "/"-bearing title is quoted only after it survives 20s unchanged;
      // any rename resets the window, and the common slash-free LLM name
      // simply releases the session untouched. Only the "new session
      // auto-title stayed slashy" case gets wrapped.
      const TITLE_STABLE_MS = 20000

      // User-driven renames funnel through here: mark first so the
      // quote-on-land effect never second-guesses a deliberate title.
      const renameByUser = (sessionId, title) => {
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        humanTouchedRef.current.add(String(sessionId))
        if (autoStableRef.current) autoStableRef.current.delete(String(sessionId))
        return renameSession(sessionId, title)
      }

      React.useEffect(() => {
        if (!list || !list.byId || typeof renameSession !== 'function') return
        if (blankSeenRef.current === null) blankSeenRef.current = new Set()
        if (humanTouchedRef.current === null) humanTouchedRef.current = new Set()
        if (autoStableRef.current === null) autoStableRef.current = new Map()
        const blankSeen = blankSeenRef.current
        const touched = humanTouchedRef.current
        const stable = autoStableRef.current
        const now = Date.now()
        const fixes = []
        let deadline = Infinity
        for (const id of Object.keys(list.byId)) {
          const summary = list.byId[id]
          if (!summary) continue
          if (summary.blank) { blankSeen.add(id); stable.delete(id); continue }
          if (!blankSeen.has(id) || touched.has(id)) { stable.delete(id); continue }
          const text = String(summary.title || '')
          if (text.trim() === '' || text.includes('“') || text.includes('"') || !text.includes('/')) {
            stable.delete(id) // quoted already, or the LLM name arrived slash-free: done
            continue
          }
          const prev = stable.get(id)
          if (prev && prev.title === text) {
            if (now - prev.since >= TITLE_STABLE_MS) {
              stable.delete(id)
              fixes.push([id, '“' + text + '”'])
            } else {
              deadline = Math.min(deadline, prev.since + TITLE_STABLE_MS)
            }
            continue
          }
          stable.set(id, { title: text, since: now }) // new landing or fallback→LLM rename: reset
          deadline = Math.min(deadline, now + TITLE_STABLE_MS)
        }
        for (const id of Array.from(stable.keys())) {
          if (!list.byId[id]) stable.delete(id) // session vanished (archived/deleted): drop the wait
        }
        if (stableTimerRef.current !== null) { clearTimeout(stableTimerRef.current); stableTimerRef.current = null }
        if (deadline !== Infinity) {
          stableTimerRef.current = setTimeout(() => {
            stableTimerRef.current = null
            setStableTick(t => t + 1) // re-evaluate through the effect, never rename from a stale closure
          }, Math.max(1, deadline - now))
        }
        if (fixes.length === 0) return
        Promise.resolve()
          .then(async () => { for (const [id, next] of fixes) await renameSession(id, next) })
          .catch(() => { /* display-layer fallback keeps the row flat; a later snapshot re-evaluates */ })
      }, [list, stableTick])
      React.useEffect(() => () => {
        if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current)
      }, [])

      /**
       * Stale-pin self-heal: unpin only sessions that were SEEN in list.byId
       * on a previous snapshot and later vanished (hard delete). Progressive
       * hydration never un-sees an id it has not shown yet, so mount-time
       * partial snapshots never strip pins; archived ids remain in byId and
       * keep their pin for the unarchive path.
       */
      const seenIdsRef = React.useRef(null)
      React.useEffect(() => {
        if (!list || !list.byId) return
        if (seenIdsRef.current === null) seenIdsRef.current = new Set()
        const seen = seenIdsRef.current
        const current = new Set(Object.keys(list.byId))
        const pinnedNow = new Set((Array.isArray(pinnedList) ? pinnedList : []).map(String))
        if (pinnedNow.size > 0) {
          for (const id of Array.from(seen)) {
            if (!current.has(id) && pinnedNow.has(id)) actions.togglePin(id)
          }
        }
        for (const id of current) seen.add(id)
      }, [list, pinnedList])
      const normalizedQuery = query.trim().toLowerCase()
      const now = Date.now()

      const fail = (text) => { setFlowOpen(false); setDialog(null); setErrorText(String(text || 'unknown error')) }

      const styleEntry = (key) => stylingMap[key] || null
      const rowStyleOf = (key) => {
        const entry = styleEntry(key)
        if (!entry || !entry.color) return null
        const glow = Number(entry.glow) || 0
        const weight = Number(entry.weight) || 0
        const shadow = entry.shadow === true
        const shadows = []
        if (glow > 0) shadows.push('0 0 ' + glow + 'px ' + entry.color)
        if (shadow) shadows.push('1px 1px 2px rgba(0,0,0,.85)')
        return {
          color: entry.color,
          fontWeight: weight > 0 ? weight : undefined,
          textShadow: shadows.length > 0 ? shadows.join(',') : undefined,
        }
      }
      const keyOf = (kind, payload) => {
        if (kind === 'folder') return 'folder:' + payload.path
        if (kind === 'workspace') return 'workspace:' + payload.workspaceId
        if (kind === 'session') return 'session:' + payload.id
        if (kind === 'sgroup') return 'sgroup:' + payload.workspaceId + '|' + payload.path
        return String(kind)
      }

      // accounted: ids bound to some workspace (host membership); their
      // workspace id doubles as tray provenance. All rows build through
      // sessionRowOf so visibility, translations, and derived flags stay
      // identical across the tree, the ungrouped area, and the pinned tray.
      const accounted = new Set()
      const workspaceIndexOf = new Map()
      for (const workspace of items || []) for (const id of workspace.sessionIds || []) { accounted.add(id); workspaceIndexOf.set(id, workspace.workspaceId) }
      const sessionRowOf = (id) => {
        const summary = list && list.byId ? list.byId[id] : undefined
        if (!sessionVisible(summary, list ? list.current : undefined, archivedSet)) return null
        return {
          id,
          title: sessionTitleOf(summary, t),
          leaf: sessionTitleOf(summary, t),
          blank: !!summary.blank,
          running: !!summary.running,
          completed: summary.completed === true,
          hasActiveSchedule: hasActiveScheduleOf(summary),
          subagents: subCounts.get(id) || 0,
          updatedAt: summary.updatedAt || 0,
          pending: pendingKindOf(pending, id),
        }
      }
      const ungrouped = []
      if (list && Array.isArray(list.ids)) {
        for (const id of list.ids) {
          if (accounted.has(id)) continue
          const row = sessionRowOf(id)
          if (row) ungrouped.push(row)
        }
        // Host has no display order for unassigned sessions; recency-desc
        // stays the shipped baseline for every mode (buckets re-sort their
        // own members in the time views).
        ungrouped.sort((a, b) => b.updatedAt - a.updatedAt)
      }

      // While a workspace drag is active, single-child chains render UNCOMPRESSED:
      // a merged "group/workspace" row hides every folder level of the chain inside
      // its label, and those levels are exactly the drop targets for "move into
      // this group". Suspending the merge for the drag's duration re-exposes each
      // level as a real folder row (folder expansion defaults apply); when the
      // drag ends, the chains merge back. Session drags keep the merged view —
      // their drop targets live inside workspace rows, which compression merges.
      const draggingWorkspace = drag !== null && drag.kind === 'workspace'
      const tree = React.useMemo(() => {
        const built = buildTree(items, storeFolders)
        if (!compactChains || draggingWorkspace) return built
        return { ...built, folders: built.folders.map((f) => materializeChain(compressTree(f))), workspaces: built.workspaces }
      }, [items, storeFolders, compactChains, draggingWorkspace])

      const sessionsOf = (workspace) => {
        const rows = []
        for (const id of workspace.sessionIds || []) {
          const row = sessionRowOf(id)
          if (row) rows.push(row)
        }
        return rows
      }

      const searchAgent = (agent) => {
        // Returns a pruned copy of the tree node, or null when nothing matches.
        if (!normalizedQuery) return agent
        if (agent.kind === 'ws') {
          const ws = agent.workspace
          const sessions = sessionsOf(ws)
          const wsHit = ws.leaf.toLowerCase().includes(normalizedQuery) || ws.title.toLowerCase().includes(normalizedQuery)
          if (wsHit || sessions.some(s => s.title.toLowerCase().includes(normalizedQuery))) {
            return { ...agent, node: agent, folders: [], workspaces: [ws] }
          }
          return null
        }
        const folders = []
        for (const folder of agent.folders) {
          const hit = searchAgent(folder)
          if (hit) folders.push(hit)
        }
        const workspaces = []
        for (const workspace of agent.workspaces) {
          const sessions = sessionsOf(workspace)
          const wsHit = workspace.leaf.toLowerCase().includes(normalizedQuery) || workspace.title.toLowerCase().includes(normalizedQuery)
          const matchedSessions = wsHit ? sessions : sessions.filter(s => s.title.toLowerCase().includes(normalizedQuery))
          if (wsHit || matchedSessions.length > 0) workspaces.push({ workspace, matchedSessions })
        }
        if (folders.length === 0 && workspaces.length === 0) return null
        return { node: agent, folders, workspaces }
      }
      const searched = normalizedQuery ? searchAgent(tree) : null
      const searching = normalizedQuery !== ''

      /* --------------------- status breathing relay -------------------- */

      // Highest-priority status across a whole session subtree (groups + rows).
      const nodePulseOf = (sessionNode) => {
        let best = null
        for (const group of sessionNode.groups || []) {
          const s = nodePulseOf(group)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        for (const row of sessionNode.sessions || []) {
          const s = relayStateOf(row)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        return best
      }
      // A COLLAPSED workspace row relays its whole session tree; an open row
      // shows the real dots (deeper collapsed groups relay on their own rows).
      const wsPulseOf = (workspace) => (!statusPulse || searching || sessionsOpenOf(workspace.workspaceId))
        ? null
        : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
      // A collapsed FOLDER hides everything below — including open workspaces —
      // so its aggregation ignores inner expansion states entirely.
      const wsAllPulseOf = (workspace) => (!statusPulse || searching)
        ? null
        : nodePulseOf(buildSessionTree(sessionsOf(workspace)))
      const folderPulseOf = (node) => {
        if (node.kind === 'ws') return wsAllPulseOf(node.workspace)
        let best = null
        for (const child of node.folders) {
          const s = folderPulseOf(child)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        for (const w of node.workspaces) {
          const s = wsAllPulseOf(w)
          if (pulseRank(s) > pulseRank(best)) best = s
        }
        return best
      }

      const folderExpanded = (path) => (expandedMap ? expandedMap[path] !== false : true)
      const sessionsOpenOf = (workspaceId) => (sessionsExpandedMap ? sessionsExpandedMap[workspaceId] !== false : true)
      const sessionGroupOpen = (key) => (sessionGroupsMap ? sessionGroupsMap[key] !== false : true)

      const openCtx = (kind, payload, e) => {
        if (e) e.preventDefault()
        setCtx({ kind, payload, x: e.clientX, y: e.clientY })
      }

      /* ------------------------- drag & drop -------------------------- */

      React.useEffect(() => {
        if (drag === null) return
        const accept = (event) => {
          event.preventDefault()
          if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
        }
        const acceptDrop = (event) => { event.preventDefault() }
        document.addEventListener('dragover', accept)
        document.addEventListener('drop', acceptDrop)
        return () => {
          document.removeEventListener('dragover', accept)
          document.removeEventListener('drop', acceptDrop)
        }
      }, [drag === null])

      const rowHalf = (event) => {
        const rect = event.currentTarget.getBoundingClientRect()
        return event.clientY < rect.top + rect.height / 2 ? 'before' : 'after'
      }
      const dragMatches = (kind) => drag !== null && drag.kind === kind
      const canDragWorkspace = typeof insertWorkspaceBefore === 'function'
      // Session REORDER needs the host insertSessionBefore action; dragging a
      // session onto a sub-group row (a pure rename) stays available without it.
      const canReorderSessions = typeof insertSessionBefore === 'function'

      /* --------------------- workspace drag & drop -------------------- */

      const wsDropHalf = (workspaceId) => {
        if (!dragMatches('workspace')) return null
        const over = drag.over
        return over && over.kind === 'workspace' && over.target === workspaceId ? over.half : null
      }
      const wsDropInto = (path) => dragMatches('workspace') && drag.over && drag.over.kind === 'folder' && drag.over.target === path
      const workspaceDragEvents = (workspace) => ({
        draggable: !searching && canDragWorkspace,
        onDragStart: (event) => {
          if (searching || !canDragWorkspace) return
          event.stopPropagation()
          try {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', workspace.workspaceId)
          } catch { /* drag payload is best-effort */ }
          // Drag identity derives from the RAW title, never the displayed leaf:
          // a compressed single-chain row shows "group/workspace" as its leaf with
          // folderPath '' — carrying that would make move-into / cross-folder
          // drops rebuild titles like "x/group/workspace". The real leaf and
          // folder keep every drop target's rename correct.
          const segs = splitTitleSegs(workspace.title)
          const sourceLeaf = segs.length > 0 ? segs[segs.length - 1] : (workspace.leaf || String(workspace.workspaceId))
          const sourceFolder = segs.length > 1 ? segs.slice(0, -1).join('/') : ''
          // Deferred by one frame on purpose (Chromium cancels a just-started
          // drag whose source element is moved out from under the cursor; see
          // wsDragArmTimer above). By the next frame the gesture has settled
          // and the chain expansion is an ordinary mid-drag update.
          if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current)
          wsDragArmTimer.current = setTimeout(() => {
            wsDragArmTimer.current = null
            setDrag({ kind: 'workspace', source: { workspaceId: workspace.workspaceId, leaf: sourceLeaf, folderPath: sourceFolder }, over: null })
          }, 0)
        },
        onDragEnd: () => {
          if (wsDragArmTimer.current !== null) { clearTimeout(wsDragArmTimer.current); wsDragArmTimer.current = null }
          setDrag(null)
        },
        onDragOver: (event) => {
          if (!dragMatches('workspace')) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          const half = rowHalf(event)
          setDrag(current => (current && current.over && current.over.kind === 'workspace' && current.over.target === workspace.workspaceId && current.over.half === half)
            ? current
            : (current ? { ...current, over: { kind: 'workspace', target: workspace.workspaceId, half } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('workspace')) return
          event.preventDefault()
          event.stopPropagation()
          const half = drag.over && drag.over.kind === 'workspace' && drag.over.target === workspace.workspaceId ? drag.over.half : rowHalf(event)
          commitWorkspaceDrop(workspace, half)
        },
      })
      const folderDropEvents = (path) => ({
        onDragOver: (event) => {
          if (!dragMatches('workspace')) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          setDrag(current => (current && current.over && current.over.kind === 'folder' && current.over.target === path)
            ? current
            : (current ? { ...current, over: { kind: 'folder', target: path } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('workspace')) return
          event.preventDefault()
          event.stopPropagation()
          commitWorkspaceMoveInto(path)
        },
      })
      const nextWorkspaceAfter = (folderPath, workspaceId) => {
        const node = findTreeNode(tree, folderPath)
        if (!node) return undefined
        const index = node.workspaces.findIndex(w => w.workspaceId === workspaceId)
        return index === -1 ? undefined : (node.workspaces[index + 1] ? node.workspaces[index + 1].workspaceId : undefined)
      }
      const commitWorkspaceDrop = (targetWorkspace, half) => {
        const source = drag.source
        setDrag(null)
        if (source.workspaceId === targetWorkspace.workspaceId) return
        const sameFolder = (targetWorkspace.folderPath || '') === source.folderPath
        const anchor = half === 'after'
          ? nextWorkspaceAfter(targetWorkspace.folderPath || '', targetWorkspace.workspaceId)
          : targetWorkspace.workspaceId
        const chain = sameFolder
          ? Promise.resolve()
          : Promise.resolve().then(() => {
            const newTitle = (targetWorkspace.folderPath || '') !== '' ? (targetWorkspace.folderPath || '') + '/' + source.leaf : source.leaf
            return renameWorkspace(source.workspaceId, newTitle)
          })
        chain
          .then(() => (anchor !== undefined ? insertWorkspaceBefore(source.workspaceId, anchor) : insertWorkspaceBefore(source.workspaceId)))
          .catch(fail)
      }
      const commitWorkspaceMoveInto = (folderPath) => {
        const source = drag.source
        setDrag(null)
        if (source.folderPath === folderPath) return
        const newTitle = folderPath !== '' ? folderPath + '/' + source.leaf : source.leaf
        Promise.resolve()
          .then(() => renameWorkspace(source.workspaceId, newTitle))
          .then(() => insertWorkspaceBefore(source.workspaceId))
          .catch(fail)
      }

      /* ---------------------- session drag & drop --------------------- */

      const sessDropHalf = (sessionId) => {
        // Time views and pinned rows never anchor a reorder: their visual
        // position is derived (recency / pin order), not the host manual
        // order, so a committed drop there would silently reorder nothing.
        if (!dragMatches('session') || timeSorted) return null
        const over = drag.over
        return over && over.kind === 'session' && over.target === sessionId ? over.half : null
      }
      const sgroupDropInto = (workspaceId, path) => dragMatches('session') && drag.over && drag.over.kind === 'sgroup' && drag.over.target === path
      // Pinned rows float by projection and time views carry no sub-groups,
      // so neither is a meaningful drag source; plain manual-order rows keep
      // both reorder and group-move drops, exactly as before.
      const sessionDraggable = (session) => !searching && !timeSorted && !pinnedSet.has(session.id)
      const sessionDragEvents = (session, workspaceId) => ({
        draggable: sessionDraggable(session),
        onDragStart: (event) => {
          if (searching || !sessionDraggable(session)) return
          event.stopPropagation()
          try {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData('text/plain', session.id)
          } catch { }
          setDrag({ kind: 'session', source: { sessionId: session.id, workspaceId, title: session.title, leaf: session.leaf || session.title }, over: null })
        },
        onDragEnd: () => setDrag(null),
        onDragOver: (event) => {
          // Pinned rows are not reorder anchors (visible position ≠ host
          // order); drop targets stay plain rows only. Belt-and-braces: the
          // source side already refuses to arm for pinned rows.
          if (!dragMatches('session') || !canReorderSessions || timeSorted
            || drag.source.workspaceId !== workspaceId
            || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          const half = rowHalf(event)
          setDrag(current => (current && current.over && current.over.kind === 'session' && current.over.target === session.id && current.over.half === half)
            ? current
            : (current ? { ...current, over: { kind: 'session', target: session.id, half } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('session') || !canReorderSessions || timeSorted
            || drag.source.workspaceId !== workspaceId
            || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return
          event.preventDefault()
          event.stopPropagation()
          const half = drag.over && drag.over.kind === 'session' && drag.over.target === session.id ? drag.over.half : rowHalf(event)
          commitSessionDrop(workspaceId, session.id, half)
        },
      })
      const sgroupDropEvents = (workspaceId, path) => ({
        onDragOver: (event) => {
          if (!dragMatches('session') || drag.source.workspaceId !== workspaceId) return
          event.preventDefault()
          event.stopPropagation()
          try { event.dataTransfer.dropEffect = 'move' } catch { }
          setDrag(current => (current && current.over && current.over.kind === 'sgroup' && current.over.target === path)
            ? current
            : (current ? { ...current, over: { kind: 'sgroup', target: path } } : current))
        },
        onDrop: (event) => {
          if (!dragMatches('session') || drag.source.workspaceId !== workspaceId) return
          event.preventDefault()
          event.stopPropagation()
          commitSessionMoveInto(workspaceId, path)
        },
      })
      const commitSessionDrop = (workspaceId, targetSessionId, half) => {
        const source = drag.source
        setDrag(null)
        // Same guards as the drop handlers (time views / pinned rows are not
        // reorder surfaces) — a stale drag never commits an invisible move.
        if (!canReorderSessions || timeSorted) return
        if (pinnedSet.has(source.sessionId) || pinnedSet.has(targetSessionId)) return
        if (source.sessionId === targetSessionId) return
        const workspace = (items || []).find(w => w.workspaceId === workspaceId)
        if (!workspace) return
        const flat = sessionsOf(workspace)
        const index = flat.findIndex(s => s.id === targetSessionId)
        const anchor = half === 'after'
          ? (index === -1 ? undefined : (flat[index + 1] ? flat[index + 1].id : undefined))
          : targetSessionId
        Promise.resolve()
          .then(() => (anchor !== undefined ? insertSessionBefore(workspaceId, source.sessionId, anchor) : insertSessionBefore(workspaceId, source.sessionId)))
          .catch(fail)
      }
      const commitSessionMoveInto = (workspaceId, groupPath) => {
        const source = drag.source
        setDrag(null)
        const newTitle = groupPath !== '' ? groupPath + '/' + source.leaf : source.leaf
        if (newTitle === source.title) return
        Promise.resolve()
          .then(() => renameByUser(source.sessionId, newTitle))
          .catch(fail)
      }

      /* --------------------------- actions --------------------------- */

      const submitWorkspaceRename = (workspace, nextTitle) => {
        const title = String(nextTitle || '').trim()
        if (title === '' || title === workspace.title) { setDialog(null); return }
        Promise.resolve()
          .then(() => renameWorkspace(workspace.workspaceId, title))
          .then(() => setDialog(null))
          .catch(fail)
      }

      const submitWorkspaceDelete = (workspace) => {
        Promise.resolve()
          .then(() => deleteWorkspace(workspace.workspaceId))
          .then(() => setDialog(null))
          .catch(fail)
      }

      const submitSessionRename = (session, nextTitle) => {
        const title = String(nextTitle || '').trim()
        if (title === '' || title === session.title) { setDialog(null); return }
        Promise.resolve()
          .then(() => renameByUser(session.id, title))
          .then(() => setDialog(null))
          .catch(fail)
      }

      /** Rename one session sub-group: rewrite the title prefix of every member. */
      const submitSessionGroupRename = (target, rawName) => {
        const name = normPath(rawName)
        if (name === '') { setErrorText(t('folder.error.empty')); return }
        if (name === target.name) { setDialog(null); return }
        const workspace = (items || []).find(w => w.workspaceId === target.workspaceId)
        if (!workspace) { setDialog(null); return }
        const node = findSessionGroup(buildSessionTree(sessionsOf(workspace)), target.path)
        if (!node) { setDialog(null); return }
        const parentPath = target.path.includes('/') ? target.path.slice(0, target.path.lastIndexOf('/')) : ''
        const nextPath = parentPath !== '' ? parentPath + '/' + name : name
        const affected = collectSessionRows(node)
        Promise.resolve()
          .then(async () => {
            for (const row of affected) {
              if (row.blank) continue
              const nextTitle = nextPath + row.title.slice(target.path.length)
              await renameByUser(row.id, nextTitle)
            }
          })
          .then(() => setDialog(null))
          .catch(fail)
      }

      const findTreeNode = (node, path) => {
        if (node.path === path) return node
        for (const folder of node.folders) {
          const hit = findTreeNode(folder, path)
          if (hit) return hit
        }
        return null
      }

      const submitFolderNew = (parentPath, rawPath) => {
        const parent = normPath(parentPath)
        const sub = normPath(rawPath)
        if (sub === '') { setErrorText(t('folder.error.empty')); return }
        const p = parent !== '' ? parent + '/' + sub : sub
        // Existence check covers explicit folders AND every folder derived
        // from workspace titles, so "already exists" means either kind.
        const derived = new Set()
        for (const w of items || []) {
          const segs = splitTitleSegs(w.title)
          for (let i = 1; i < segs.length; i++) derived.add(segs.slice(0, i).join('/'))
        }
        if (storeFolders.includes(p) || derived.has(p)) { setErrorText(t('folder.error.exists')); return }
        actions.addFolder(p)
        setDialog(null)
      }

      const submitFolderRename = (oldPath, rawPath) => {
        const newPath = normPath(rawPath)
        if (newPath === '') { setErrorText(t('folder.error.empty')); return }
        if (newPath === oldPath) { setDialog(null); return }
        const node = findTreeNode(tree, oldPath)
        const hasChildren = node ? countWorkspaces(node) > 0 : false
        const prefix = oldPath + '/'
        const affected = hasChildren
          ? (items || []).filter(w => String(w.title || '').startsWith(prefix))
          : []
        Promise.resolve()
          .then(async () => {
            for (const w of affected) {
              const nextTitle = newPath + String(w.title).slice(oldPath.length)
              await renameWorkspace(w.workspaceId, nextTitle)
            }
          })
          .then(() => { actions.renameFolder(oldPath, newPath); setDialog(null) })
          .catch(fail)
      }

      const submitFolderDelete = (path) => {
        const node = findTreeNode(tree, path)
        if (node && countWorkspaces(node) > 0) { setErrorText(t('folder.error.notEmpty')); return }
        actions.removeFolder(path)
        setDialog(null)
      }

      /* ---------------------------- rows ----------------------------- */

      /**
       * Session list of ONE workspace in the projects view: pinned rows are
       * hidden (tray-only display — unpinning restores them) and the rest
       * render as the "/" title grouping tree in host order (drag-reorder
       * anchors stay valid). Search mode overrides the split: the tree shows
       * every match in place (pinned rows included). The time view never
       * routes here — the global timeline in the bodyRows assembly replaces
       * the workspace scaffolding entirely.
       */
      const renderSessionTree = (workspace, depth) => {
        // Folder semantics: a closed workspace shows no sessions at all (the
        // list keeps its count badge); an open one shows the full session tree.
        if (!searching && !sessionsOpenOf(workspace.workspaceId)) return []
        const rows = sessionsOf(workspace)
        if (rows.length === 0) return []
        if (searching) return renderSessionNode(buildSessionTree(rows), workspace.workspaceId, depth)
        const unpinned = rows.filter(r => !pinnedSet.has(r.id))
        if (unpinned.length === 0) return []
        return renderSessionNode(buildSessionTree(unpinned), workspace.workspaceId, depth)
      }

      /** Recency buckets over un-pinned rows; empty buckets stay hidden. */
      const renderTimeBuckets = (rows, workspaceId, depth) => {
        const buckets = new Map()
        for (const key of BUCKET_ORDER) buckets.set(key, [])
        for (const r of rows) buckets.get(bucketOf(r.updatedAt, now)).push(r)
        const direction = timeDirection === 'oldest' ? 1 : -1
        const prefix = workspaceId || 'timeline'
        const out = []
        for (const key of BUCKET_ORDER) {
          const bucketRows = buckets.get(key)
          if (bucketRows.length === 0) continue
          out.push(E('div', { key: 'bucket-' + prefix + '-' + key, className: 'bw-bucket-header' }, t('bucket.' + key)))
          const sorted = bucketRows.slice().sort((a, b) => direction * (a.updatedAt - b.updatedAt))
          // Rows render without a workspace context: no drag surfaces here
          // (the timeline is a derived view, not a reorder surface). The
          // relative time is the tail label by default; the workspace tag
          // reveals on hover and the native tooltip carries the full title,
          // project and absolute timestamp.
          for (const s of sorted) out.push(renderSessionRow(s, depth, null, { workspaceTag: s.workspaceTag, tagOnHover: true, tooltip: true }))
        }
        return out
      }
      const searchSessionNode = (node) => {
        const groups = []
        for (const group of node.groups) {
          const hit = searchSessionNode(group)
          if (hit) groups.push(hit)
        }
        const sessions = node.sessions.filter(s => ((s.leaf || s.title) + ' ' + s.title).toLowerCase().includes(normalizedQuery))
        if (groups.length === 0 && sessions.length === 0) return null
        return { path: node.path, name: node.name, groups, sessions }
      }
      const renderSessionNode = (node, workspaceId, depth) => {
        const view = searching ? searchSessionNode(node) : node
        if (!view) return []
        const out = []
        for (const group of view.groups) {
          const key = workspaceId + '|' + group.path
          const open = searching || sessionGroupOpen(key)
          out.push(E(SessionGroupRow, {
            key: 'sg-' + key,
            name: group.name,
            depth,
            expanded: open,
            pulse: (statusPulse && !open) ? nodePulseOf(group) : null,
            count: countSessionTree(group),
            onToggle: () => { if (!searching) actions.setSessionGroupExpanded(key, !open) },
            onContextMenu: (e) => openCtx('sgroup', { workspaceId, path: group.path, name: group.name }, e),
            dropInto: sgroupDropInto(workspaceId, group.path),
            dragEvents: sgroupDropEvents(workspaceId, group.path),
            custStyle: rowStyleOf('sgroup:' + workspaceId + '|' + group.path),
            t,
          }))
          if (open) out.push(...renderSessionNode(group, workspaceId, depth + 1))
        }
        for (const s of view.sessions) out.push(renderSessionRow(s, depth, workspaceId))
        return out
      }

      /**
       * One session row anywhere it renders. opts: { pinned, inTray, workspaceTag }.
       * Pin membership marks the row automatically (pinned badge + tinted
       * backdrop) wherever it appears; inTray disables drag (tray rows are
       * projections, not reorder anchors) and keys the row apart from its
       * in-workspace sibling. Pin button hidden when the store lacks the
       * action (older host wiring).
       */
      const renderSessionRow = (session, depth, workspaceId, opts) => {
        const o = opts || {}
        const pinned = o.pinned === true || pinnedSet.has(session.id)
        const togglePin = typeof actions.togglePin === 'function' ? (id) => actions.togglePin(id) : undefined
        const inTray = o.inTray === true
        return E(SessionRow, {
          key: String(session.id) + (inTray ? '-tray' : ''),
          node: session,
          depth,
          current: list && list.current === session.id,
          now,
          onOpen: (id) => open(id),
          onContextMenu: (e) => openCtx('session', session, e),
          dropHalf: workspaceId && !pinned ? sessDropHalf(session.id) : null,
          dragEvents: (workspaceId && !pinned && !inTray && !timeSorted) ? sessionDragEvents(session, workspaceId) : undefined,
          custStyle: rowStyleOf('session:' + session.id),
          breathing: statusPulse,
          pinned,
          onTogglePin: togglePin,
          workspaceTag: o.workspaceTag,
          tagOnHover: o.tagOnHover === true,
          tooltip: o.tooltip === true,
          t,
        })
      }

      const renderWorkspaceEntry = (entry, depth, pulse) => {
        const { workspace } = entry
        const wsRows = sessionsOf(workspace)
        const count = countSessionTree(buildSessionTree(wsRows))
        const pinCount = wsRows.reduce((n, s) => n + (pinnedSet.has(s.id) ? 1 : 0), 0)
        const rows = [E(WorkspaceRow, {
          key: 'ws-' + workspace.workspaceId,
          workspace,
          depth,
          count,
          pinCount,
          sessionsOpen: searching ? true : sessionsOpenOf(workspace.workspaceId),
          currentInside: !!(list && list.current && (workspace.sessionIds || []).includes(list.current)),
          onToggle: () => { if (!searching) actions.setSessionsExpanded(workspace.workspaceId, !sessionsOpenOf(workspace.workspaceId)) },
          // Starting a session force-expands the workspace row: the user must
          // SEE the new session appear, even if the row was collapsed.
          onStart: () => { actions.setSessionsExpanded(workspace.workspaceId, true); startSession(workspace.workspaceId) },
          onContextMenu: (e) => openCtx('workspace', workspace, e),
          dropHalf: wsDropHalf(workspace.workspaceId),
          dragEvents: workspaceDragEvents(workspace),
          custStyle: rowStyleOf('workspace:' + workspace.workspaceId),
          iconMode: (styleEntry('workspace:' + workspace.workspaceId) || {}).icon || 'solid',
          pulse,
          t,
        })]
        rows.push(...renderSessionTree(workspace, depth + 1))
        return rows
      }

      const renderPlainFolder = (node, depth) => {
        if (node.kind === 'ws') return renderWorkspaceEntry({ workspace: node.workspace }, depth, wsPulseOf(node.workspace))
        const expanded = searching || folderExpanded(node.path)
        const rows = [E(FolderRow, {
          key: 'f-' + node.path,
          node,
          depth,
          expanded,
          onToggle: () => { if (!searching) actions.setExpanded(node.path, !expanded) },
          onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
          dropInto: wsDropInto(node.path),
          dragEvents: folderDropEvents(node.path),
          custStyle: rowStyleOf('folder:' + node.path),
          iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
          pulse: expanded ? null : folderPulseOf(node),
          t,
        })]
        if (expanded) {
          for (const child of node.folders) rows.push(...renderPlainFolder(child, depth + 1))
          for (const workspace of node.workspaces) rows.push(...renderWorkspaceEntry({ workspace }, depth + 1, wsPulseOf(workspace)))
        }
        return rows
      }
      const renderSearchedFolder = (hit, depth) => {
        if (hit.kind === 'ws') return renderWorkspaceEntry({ workspace: hit.workspace }, depth)
        const node = hit.node
        const rows = [E(FolderRow, {
          key: 'f-' + node.path,
          node,
          depth,
          expanded: true,
          onToggle: () => {},
          onContextMenu: (e) => openCtx('folder', { path: node.path, name: node.name }, e),
          dropInto: false,
          dragEvents: undefined,
          custStyle: rowStyleOf('folder:' + node.path),
          iconMode: (styleEntry('folder:' + node.path) || {}).icon || 'solid',
          t,
        })]
        for (const child of hit.folders) rows.push(...renderSearchedFolder(child, depth + 1))
        for (const entry of hit.workspaces) rows.push(...renderWorkspaceEntry(entry, depth + 1))
        return rows
      }

      /**
       * Global pinned tray at the top of the tree: header row (pin glyph +
       * count) plus one session row per pin, tagged with its workspace leaf
       * name so the cross-workspace context stays readable. Rows open the
       * session directly (open() handles cross-workspace switching).
       */
      const renderPinnedSection = (rows) => E('div', { key: 'pinned-section', className: 'bw-pinned-section' },
        E('div', { className: 'bw-pinned-header' },
          E('span', { className: 'bw-pin-mark' }, E(PinIcon16, { size: 11 })),
          E('span', null, t('pinned.header')),
          E('span', { className: 'bw-row-count' }, String(rows.length)),
        ),
        rows.map((s) => renderSessionRow(s, 0, workspaceIndexOf.get(s.id) || undefined, { pinned: true, inTray: true, workspaceTag: s.workspaceTag })),
      )

      // Global pinned tray: every pinned session that is visible right now,
      // across workspaces and ungrouped, in pin-recency order (store order).
      // Archived or hard-deleted pins stay stored but render nothing. During
      // search the tray filters like any other row.
      const pinnedTray = []
      if (Array.isArray(pinnedList) && pinnedList.length > 0 && list) {
        for (const rawId of pinnedList) {
          const id = String(rawId)
          const row = sessionRowOf(id)
          if (!row) continue
          if (searching && !((row.leaf || row.title) + ' ' + row.title).toLowerCase().includes(normalizedQuery)) continue
          const wsId = workspaceIndexOf.get(id)
          row.workspaceTag = wsId !== undefined ? workspaceTitleOf(wsId) : ''
          pinnedTray.push(row)
        }
      }

      let bodyRows = []
      if (searching) {
        // Search is a locator: it always renders through the projects tree
        // (results in place) regardless of the active view.
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        if (searched) {
          for (const child of searched.folders) bodyRows.push(...renderSearchedFolder(child, 0))
          for (const entry of searched.workspaces) bodyRows.push(...renderWorkspaceEntry(entry, 0))
        }
      } else if (timeSorted) {
        // Global timeline: ONE recency stream across every project. The
        // workspace/folder scaffolding disappears entirely — time is the
        // first level, project membership degrades to a row tag. Pinned
        // sessions live in the tray above and never duplicate here.
        const timelineRows = []
        const collectWorkspace = (workspace) => {
          for (const s of sessionsOf(workspace)) {
            if (pinnedSet.has(s.id)) continue
            const wsId = workspaceIndexOf.get(s.id)
            s.workspaceTag = wsId !== undefined ? workspaceTitleOf(wsId) : ''
            timelineRows.push(s)
          }
        }
        const collectFolder = (node) => {
          for (const child of node.folders) collectFolder(child)
          for (const workspace of node.workspaces) collectWorkspace(workspace)
        }
        for (const folder of tree.folders) collectFolder(folder)
        for (const workspace of tree.workspaces) collectWorkspace(workspace)
        for (const s of ungrouped) {
          if (pinnedSet.has(s.id)) continue
          timelineRows.push(s)
        }
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        if (timelineRows.length > 0) {
          for (const row of renderTimeBuckets(timelineRows, null, 0)) bodyRows.push(row)
        }
      } else {
        if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray))
        for (const folder of tree.folders) bodyRows.push(...renderPlainFolder(folder, 0))
        for (const workspace of tree.workspaces) bodyRows.push(...renderWorkspaceEntry({ workspace }, 0, wsPulseOf(workspace)))
        if (ungrouped.length > 0) {
          const plainUn = ungrouped.filter(s => !pinnedSet.has(s.id))
          if (plainUn.length > 0) {
            bodyRows.push(E('div', { key: 'ungrouped-label', className: 'bw-header-title', style: { padding: '10px 6px 2px' } }, t('group.ungrouped')))
          }
          for (const s of plainUn) bodyRows.push(renderSessionRow(s, 0, null))
        }
      }
      const isEmpty = bodyRows.length === 0
      if (isEmpty) {
        bodyRows = [E('div', { key: 'empty', className: 'bw-empty' }, searching ? t('empty.search') : (phase === 'pending' ? '…' : t('empty')))]
      }

      /* ------------------------- context menu ------------------------ */

      const ctxItems = () => {
        if (ctx === null) return []
        // View menu: two views, and while the time view is active a sub-level
        // direction pair (latest / oldest) rendered indented.
        if (ctx.kind === 'view') {
          const items = [
            {
              id: 'view-projects', label: t('view.projects'), sub: false,
              role: 'menuitemradio', checked: !timeSorted, leadingIcon: ListTreeIcon16,
            },
            {
              id: 'view-time', label: t('view.time'), sub: false,
              role: 'menuitemradio', checked: timeSorted, leadingIcon: CalendarDaysIcon16,
            },
          ]
          if (timeSorted) {
            items.push({ sep: true })
            for (const [dir, key] of [['latest', 'view.time.latest'], ['oldest', 'view.time.oldest']]) {
              items.push({
                id: 'view-dir-' + dir, label: t(key), sub: true,
                role: 'menuitemradio', checked: timeDirection === dir,
                leading: timeDirection === dir ? icon('IconCheckOutline16', 14) : null,
              })
            }
          }
          return items
        }
        if (ctx.kind === 'folder') {
          const items = [
            { id: 'new-subfolder', label: t('menu.newSubfolder') },
            { id: 'new-subworkspace', label: t('menu.newSubWorkspace') },
            { id: 'rename-folder', label: t('menu.renameFolder') },
          ]
          if (storeFolders.includes(ctx.payload.path)) items.push({ id: 'remove-folder', label: t('menu.removeFolder'), danger: true })
          items.push({ sep: true })
          items.push({ id: 'customize', label: t('custom.title') })
          return items
        }
        if (ctx.kind === 'workspace') return [
          { id: 'rename', label: t('menu.rename') },
          { id: 'delete', label: t('menu.delete'), danger: true },
          { sep: true },
          { id: 'customize', label: t('custom.title') },
        ]
        if (ctx.kind === 'session') {
          const isPinned = pinnedSet.has(ctx.payload.id)
          return [
            { id: 'pin', label: isPinned ? t('menu.unpin') : t('menu.pin'), leading: E(PinIcon16, { size: 14 }) },
            { id: 'rename', label: t('menu.rename') },
            { id: 'fork', label: t('menu.fork') },
            { id: 'archive', label: t('menu.archive'), danger: true },
            { sep: true },
            { id: 'customize', label: t('custom.title') },
          ]
        }
        return [
          { id: 'rename-sgroup', label: t('menu.renameSgroup') },
          { sep: true },
          { id: 'customize', label: t('custom.title') },
        ]
      }
      const handleCtxPick = (id) => {
        const current = ctx
        if (current === null) return
        if (current.kind === 'view' && id.startsWith('view-')) {
          if (id === 'view-projects') actions.setViewMode('projects')
          else if (id === 'view-time') actions.setViewMode('time')
          else if (id.startsWith('view-dir-')) actions.setTimeDirection(id.slice('view-dir-'.length))
          setCtx(null)
          return
        }
        if (id === 'customize') {
          const payload = current.payload
          const name = current.kind === 'workspace' ? (payload.title || payload.leaf)
            : (current.kind === 'session' ? payload.title : payload.name)
          setCustomize({ kind: current.kind, entryKey: keyOf(current.kind, payload), name })
          setCtx(null)
          return
        }
        const { kind, payload } = current
        setCtx(null)
        if (kind === 'folder' && id === 'new-subfolder') setDialog({ kind: 'folder-new', parentPath: payload.path })
        else if (kind === 'folder' && id === 'new-subworkspace') { setFlowParent(payload.path); setFlowOpen(true) }
        else if (kind === 'folder' && id === 'rename-folder') setDialog({ kind: 'folder-rename', path: payload.path })
        else if (kind === 'folder' && id === 'remove-folder') setDialog({ kind: 'folder-delete', path: payload.path })
        else if (kind === 'workspace' && id === 'rename') setDialog({ kind: 'ws-rename', workspace: payload })
        else if (kind === 'workspace' && id === 'delete') setDialog({ kind: 'ws-delete', workspace: payload })
        else if (kind === 'sgroup' && id === 'rename-sgroup') setDialog({ kind: 'sgroup-rename', target: payload })
        else if (kind === 'session' && id === 'pin') actions.togglePin(payload.id)
        else if (kind === 'session' && id === 'rename') setDialog({ kind: 'sess-rename', session: payload })
        else if (kind === 'session' && id === 'fork') forkSession(payload.id)
        else if (kind === 'session' && id === 'archive') { Promise.resolve().then(() => archiveSession(payload.id)).catch(fail) }
      }

      /* --------------------------- dialogs --------------------------- */
      // TextDialog / ConfirmDialog are module-level components: a per-render
      // inline definition would remount on every parent tick and drop input.

      /* ---------------------------- render --------------------------- */

      if (!wide) {
        return E('div', { className: 'bw-rail' },
          StyleNode(),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.search'), onClick: () => { expandSidebar(); setSearchOpen(true) } }, icon('IconSearchOutline16', 18)),
          E('button', { type: 'button', className: 'bw-rail-btn', 'aria-label': t('rail.add'), onClick: () => { expandSidebar(); setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16', 18)),
        )
      }

      const dialogElement = (() => {
        if (dialog === null) return null
        if (dialog.kind === 'ws-rename') return E(TextDialog, {
          key: 'ws-rename',
          title: t('ws.rename.title'),
          hint: t('ws.rename.hint'),
          initial: dialog.workspace.title || dialog.workspace.leaf,
          onConfirm: (v) => submitWorkspaceRename(dialog.workspace, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'ws-delete') return E(ConfirmDialog, {
          key: 'ws-delete',
          title: t('ws.delete.title'),
          body: t('ws.delete.body', { name: dialog.workspace.title || dialog.workspace.leaf }),
          onConfirm: () => submitWorkspaceDelete(dialog.workspace),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sess-rename') return E(TextDialog, {
          key: 'sess-rename',
          title: t('menu.rename'),
          initial: dialog.session.title,
          onConfirm: (v) => submitSessionRename(dialog.session, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'sgroup-rename') return E(TextDialog, {
          key: 'sgroup-rename',
          title: t('menu.renameSgroup'),
          hint: t('ws.rename.hint'),
          initial: dialog.target.name,
          onConfirm: (v) => submitSessionGroupRename(dialog.target, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-new') return E(TextDialog, {
          key: 'folder-new',
          title: t('folder.new.title'),
          hint: t('folder.new.hint'),
          initial: dialog.parentPath ? dialog.parentPath + '/' : '',
          onConfirm: (v) => submitFolderNew(dialog.parentPath || '', v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-rename') return E(TextDialog, {
          key: 'folder-rename',
          title: t('folder.rename.title'),
          hint: t('folder.rename.hint'),
          initial: dialog.path,
          onConfirm: (v) => submitFolderRename(dialog.path, v),
          onClose: () => setDialog(null),
          t,
        })
        if (dialog.kind === 'folder-delete') {
          return E(ConfirmDialog, {
            key: 'folder-delete',
            title: t('menu.removeFolder'),
            body: t('folder.delete.body', { name: dialog.path }),
            onConfirm: () => submitFolderDelete(dialog.path),
            onClose: () => setDialog(null),
            t,
          })
        }
        return null
      })()

      const flowOwner = {
        open: flowOpen,
        busy: false,
        onPicked: () => {},
        onCancel: () => setFlowOpen(false),
        onError: fail,
      }

      return E('div', { className: 'bw-root' },
        StyleNode(),
        E('div', { className: 'bw-header' },
          E('div', { className: 'bw-header-title' }, t('title')),
          (searchOpen || query !== '') ? E('input', {
            className: 'bw-input',
            style: { width: 130, flex: 'none' },
            value: query,
            autoFocus: true,
            placeholder: t('search.placeholder'),
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => { if (e.key === 'Escape') { setQuery(''); setSearchOpen(false) } },
            onBlur: () => { if (query === '') setSearchOpen(false) },
          }) : null,
          E('button', {
            type: 'button', className: 'bw-icon-btn', 'aria-label': t('view.label'), title: t('view.label'),
            'aria-haspopup': 'menu', 'aria-expanded': ctx !== null && ctx.kind === 'view',
            onClick: (e) => { e.preventDefault(); setCtx({ kind: 'view', payload: {}, x: e.clientX, y: e.clientY }) },
          }, timeSorted ? E(CalendarDaysIcon16, { size: 15 }) : E(ListTreeIcon16, { size: 15 })),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('search.placeholder'), onClick: () => setSearchOpen(v => !v) }, icon('IconSearchOutline16')),
          E('button', { type: 'button', className: 'bw-icon-btn', 'aria-label': t('add'), onClick: () => { setFlowParent(''); setFlowOpen(true) } }, icon('IconProjectAddOutline16')),
        ),
        E('div', { className: 'bw-tree', role: 'tree', 'aria-label': t('title') }, bodyRows),
        E(BetterFlow, {
          open: flowOpen,
          busy: false,
          initialParent: flowParent,
          onPicked: flowOwner.onPicked,
          onCancel: flowOwner.onCancel,
          onError: flowOwner.onError,
          createWorkspace,
          renameWorkspace,
          pickDirectory,
          useWorkspaces,
          actions,
          useStore,
          t,
        }),
        dialogElement,
        ctx !== null ? E('div', {
          className: 'bw-ctx-overlay',
          onMouseDown: () => setCtx(null),
          onContextMenu: (e) => e.preventDefault(),
        },
          E('div', {
            className: 'bw-ctx-menu',
            style: { left: Math.min(ctx.x, window.innerWidth - 190), top: Math.min(ctx.y, window.innerHeight - 240) },
            onMouseDown: (e) => e.stopPropagation(),
            onContextMenu: (e) => e.preventDefault(),
          },
            ctxItems().map((item, index) => item.sep
              ? E('div', { key: 'sep-' + index, className: 'bw-ctx-sep' })
              : E('button', {
                key: item.id,
                type: 'button',
                className: cls('bw-ctx-item', item.danger && 'bw-ctx-danger', item.sub && 'bw-ctx-subitem'),
                role: item.role || 'menuitem',
                'aria-checked': item.checked === undefined ? undefined : (item.checked ? 'true' : 'false'),
                onClick: () => handleCtxPick(item.id),
              },
                item.leading !== undefined
                  ? E('span', { className: 'bw-sort-menu-check' }, item.leading)
                  : (item.leadingIcon ? E('span', { className: 'bw-sort-menu-check' }, E(item.leadingIcon, { size: 14 })) : null),
                item.label,
              ),
            ),
          ),
        ) : null,
        E(CustomizeDialog, {
          open: customize !== null,
          kind: customize ? customize.kind : undefined,
          initial: customize ? styleEntry(customize.entryKey) : undefined,
          onChange: (style) => { if (customize) actions.setStyling(customize.entryKey, style) },
          onReset: () => { if (customize) actions.setStyling(customize.entryKey, null) },
          onClose: () => setCustomize(null),
          t,
        }),
        E(ui.Modal, {
          open: errorText !== null,
          onClose: () => setErrorText(null),
          closeLabel: t('close'),
          title: t('error.title'),
          footer: E('div', { className: 'bw-modal-actions' }, E(BTN, { variant: 'primary', onClick: () => setErrorText(null) }, t('close'))),
        }, E('div', { className: 'bw-modal-body' }, E('div', { className: 'bw-error-text', role: 'alert' }, errorText || '')), StyleNode()),
      )
    }

    /* ============================ plugin ============================== */

    const flowSource = (slots, hole) => ({
      getSnapshot: () => {
        try { return slots.entries(hole).length > 0 } catch { return false }
      },
      subscribe: (listener) => {
        try { return slots.subscribe(hole, listener) } catch { return () => {} }
      },
    })

    function apply(ctx) {
      const slots = ctx.get('slots')
      if (slots === undefined || typeof slots.register !== 'function') {
        console.error('[dsh-workspace-plus] slots service unavailable; plugin idle')
        return
      }
      const sessions = ctx.get('sessions')
      const workspaces = ctx.get('workspaces')
      const uiWorkspace = ctx.get('uiWorkspace')
      if (!sessions || !workspaces || !uiWorkspace) {
        console.error('[dsh-workspace-plus] required services missing', {
          sessions: !!sessions, workspaces: !!workspaces, uiWorkspace: !!uiWorkspace,
        })
        return
      }

      if (ctx.locale && typeof ctx.locale.register === 'function') {
        ctx.effect(() => {
          try {
            return ctx.locale.register(NS, { zh, en })
          } catch (localeError) {
            console.warn('[dsh-workspace-plus] dictionary registration failed', localeError)
            return () => {}
          }
        }, 'better-workspace: dictionaries')
      }

      const searchSessions = async (query, signal) => {
        const result = await sessions.search(query, signal)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session search failed')
        return result.value
      }
      const renameSession = async (sessionId, title) => {
        const binding = sessions.binding(sessionId)
        const session = binding && binding.session
        if (!session) throw new Error('unknown session "' + sessionId + '"')
        const result = await session.rename(title)
        if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : 'session rename failed')
      }
      const forkSession = (sessionId) => {
        sessions.fork({ sessionId, increaseTitle: true })
          .then((childId) => sessions.open(childId))
          .catch(() => { /* keep current selection */ })
      }

      const browserInjected = () => ({
        startSession: (workspaceId) => { uiWorkspace.startSession(workspaceId) },
        open: (sessionId) => { sessions.open(sessionId) },
        searchSessions,
        searchResultLimit: sessions.searchResultLimit !== undefined ? sessions.searchResultLimit : 20,
        renameSession,
        forkSession,
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
        insertWorkspaceBefore: typeof workspaces.insertBefore === 'function'
          ? (workspaceId, beforeWorkspaceId) => workspaces.insertBefore(workspaceId, beforeWorkspaceId)
          : undefined,
        // Official contract exposes session reorder through the WORKSPACES
        // service (see dsh ui-workspace client index.ts); feature-probed so
        // older hosts degrade to "group-move only" instead of a TypeError.
        insertSessionBefore: typeof workspaces.insertSessionBefore === 'function'
          ? (workspaceId, sessionId, beforeSessionId) => workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId)
          : undefined,
        archiveSession: (sessionId) => uiWorkspace.archiveSession(sessionId),
        createWorkspace: (input) => workspaces.create(input),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: {
          directoryFlow: flowSource(slots, 'sidebar.workspaces.directoryFlow'),
        },
      })
      const flowInjected = (hole) => () => ({
        createWorkspace: (input) => workspaces.create(input),
        renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
        pickDirectory: () => uiWorkspace.pickDirectory(),
        hooks: { directoryFlow: flowSource(slots, hole) },
      })

      // Registration helper: a thrown register (semantics drift, vanishing
      // hole declaration mid-transition) degrades this one seat, never the
      // plugin fiber — the whole web boot is all-or-nothing.
      const guarded = (slotKey, options, component) => () => {
        try {
          return slots.register(options, (props) => E(QuietBoundary, null, E(component, props)))
        } catch (registerError) {
          console.warn('[dsh-workspace-plus] register skipped for ' + slotKey, registerError)
          return undefined
        }
      }

      // 1+2. the two directory-flow holes (hero picker, shipped sidebar browser).
      // Since dsh 0.1.2-alpha.1 the shell's own directory picker occupies each
      // hole at priority 0, so shadow at -1 (ascending, lowest renders) exactly
      // like the sidebar.workspaces browser below.
      slots.inject('conversation.hero.workspace.directoryFlow', guarded(
        'conversation.hero.workspace.directoryFlow',
        { name: 'conversation.hero.workspace.directoryFlow', inject: flowInjected('conversation.hero.workspace.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))
      slots.inject('sidebar.workspaces.directoryFlow', guarded(
        'sidebar.workspaces.directoryFlow',
        { name: 'sidebar.workspaces.directoryFlow', inject: flowInjected('sidebar.workspaces.directoryFlow'), locale: NS, priority: -1 },
        BetterFlow,
      ))

      // One shared store handle: the browser and the settings page must see the
      // same persisted state (expansion, folder list, prefs, styling).
      const viewStore = createViewStore()

      // Settings → Plugins card only (the tab dispatches the intersection of
      // served namespaces — registered host-side — and settings.plugin.item
      // cards). The old left-nav settings.section entry was removed: the
      // plugins-section card is the single settings surface now.
      slots.inject('settings.plugin.item', guarded(
        'settings.plugin.item',
        {
          name: 'settings.plugin.item',
          key: 'better-workspace',
          locale: NS,
          store: viewStore,
        },
        BetterWorkspacePluginCard,
      ))

      // 3. the browser itself — lowest priority renders, shadowing the shipped entry.
      slots.inject('sidebar.workspaces', guarded(
        'sidebar.workspaces',
        {
          name: 'sidebar.workspaces',
          priority: -1,
          store: viewStore,
          inject: browserInjected,
          locale: NS,
        },
        BetterBrowser,
      ))
    }

    return {
      name: 'dsh-workspace-plus',
      inject: ['slots', 'sessions', 'workspaces', 'locale', 'uiWorkspace'],
      apply,
    }
  },
})
