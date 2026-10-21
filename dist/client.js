/* GENERATED FILE — do not edit.
 * Source: src/client/**  ·  Rebuild: npm run build  ·  Verify: npm run check
 * The DSH client module table takes exactly one bundle per package
 * (exports["./client"]), so the split sources are bundled here. */
"use strict";
(() => {
  // src/client/platform.ts
  var NS = "betterWorkspace";
  var React = null;
  var E = null;
  var ui = null;
  var storeKit = null;
  function installPlatform(hostRequire) {
    React = hostRequire("react");
    E = React.createElement;
    ui = hostRequire("@deepseek-ai/dsh-client-ui-primitives");
    storeKit = hostRequire("@deepseek-ai/dsh-client-store");
  }

  // src/client/i18n/zh.ts
  var zh = {
    "title": "\u5DE5\u4F5C\u533A",
    "search.placeholder": "\u641C\u7D22\u5DE5\u4F5C\u533A\u6216\u4F1A\u8BDD",
    "add": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
    "rail.search": "\u641C\u7D22",
    "rail.add": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
    "empty": "\u6682\u65E0\u5DE5\u4F5C\u533A",
    "empty.search": "\u6CA1\u6709\u5339\u914D\u7684\u7ED3\u679C",
    "empty.archived": "\u6682\u65E0\u5DF2\u5F52\u6863\u4F1A\u8BDD",
    "empty.sessions": "\u6682\u65E0\u7B26\u5408\u7B5B\u9009\u6761\u4EF6\u7684\u4F1A\u8BDD",
    "empty.showAll": "\u67E5\u770B\u5168\u90E8\u5BF9\u8BDD",
    "session.new": "\u65B0\u4F1A\u8BDD",
    "group.ungrouped": "\u672A\u5206\u7EC4",
    "sessions.expand": "\u5C55\u5F00 {n} \u4E2A\u4F1A\u8BDD",
    "sessions.collapse": "\u6536\u8D77",
    "time.now": "\u521A\u521A",
    "time.minutes": "{n} \u5206\u949F",
    "time.hours": "{n} \u5C0F\u65F6",
    "time.days": "{n} \u5929",
    "time.months": "{n} \u4E2A\u6708",
    "time.years": "{n} \u5E74",
    "status.running": "\u751F\u6210\u4E2D",
    "status.completed": "\u5DF2\u5B8C\u6210",
    "status.approval": "\u7B49\u5F85\u6279\u51C6",
    "status.planReview": "\u7B49\u5F85\u8BA1\u5212\u786E\u8BA4",
    "status.question": "\u7B49\u5F85\u56DE\u7B54",
    "status.subagents": "{n} \u4E2A\u5B50\u4EFB\u52A1\u8FD0\u884C\u4E2D",
    "schedule.active": "\u6709\u6D3B\u52A8\u5B9A\u65F6\u4EFB\u52A1",
    "menu.rename": "\u91CD\u547D\u540D",
    "menu.renameSession": "\u91CD\u547D\u540D\u4F1A\u8BDD",
    "menu.archiveSession": "\u5F52\u6863\u4F1A\u8BDD",
    "menu.deleteSession": "\u5220\u9664\u4F1A\u8BDD",
    "menu.openDirectory": "\u5728\u8D44\u6E90\u7BA1\u7406\u5668\u4E2D\u6253\u5F00",
    "menu.copyDirectory": "\u590D\u5236\u5DE5\u4F5C\u76EE\u5F55",
    "menu.copySessionId": "\u590D\u5236\u4F1A\u8BDD ID",
    "menu.refresh": "\u5237\u65B0",
    "menu.deleteUnavailable": "\u5220\u9664\u4F1A\u8BDD\u670D\u52A1\u4E0D\u53EF\u7528",
    "session.delete.title": "\u6C38\u4E45\u5220\u9664\u4F1A\u8BDD\uFF1F",
    "session.delete.body": "\u786E\u5B9A\u5220\u9664\u300C{name}\u300D\uFF1F\u4F1A\u8BDD\u8BB0\u5F55\u4E0E\u9644\u4EF6\u5C06\u6C38\u4E45\u5220\u9664\uFF0C\u8FD0\u884C\u4E2D\u7684\u4EFB\u52A1\u4E5F\u4F1A\u505C\u6B62\u3002\u6B64\u64CD\u4F5C\u65E0\u6CD5\u6062\u590D\u3002",
    "session.delete.confirm": "\u786E\u5B9A\u5220\u9664",
    "session.delete.busy": "\u6B63\u5728\u5220\u9664\u2026",
    "session.delete.done": "\u4F1A\u8BDD\u5DF2\u5220\u9664",
    "session.delete.cleanupWarning": "\u4F1A\u8BDD\u6587\u4EF6\u5DF2\u5220\u9664\uFF0C\u4F46\u5217\u8868\u540C\u6B65\u672A\u5B8C\u6210\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u3002",
    "session.delete.failed": "\u5220\u9664\u4F1A\u8BDD\u5931\u8D25\uFF1A{reason}",
    "copy.directory.done": "\u5DF2\u590D\u5236\u5DE5\u4F5C\u76EE\u5F55",
    "copy.sessionId.done": "\u5DF2\u590D\u5236\u4F1A\u8BDD ID",
    "copy.failed": "\u590D\u5236\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u526A\u8D34\u677F\u6743\u9650",
    "menu.delete": "\u5220\u9664",
    "menu.fork": "\u521B\u5EFA\u4F1A\u8BDD\u5206\u652F",
    "menu.archive": "\u5F52\u6863",
    "menu.unarchive": "\u53D6\u6D88\u5F52\u6863",
    "session.archived": "\u5DF2\u5F52\u6863",
    "session.archivedHint": "\u8BF7\u5148\u53D6\u6D88\u5F52\u6863\uFF0C\u518D\u6253\u5F00\u6B64\u4F1A\u8BDD\u3002",
    "menu.openTab": "\u5728\u65B0\u6807\u7B7E\u9875\u6253\u5F00",
    "tabs.label": "\u4F1A\u8BDD\u6807\u7B7E\u9875",
    "tabs.close": "\u5173\u95ED\u6807\u7B7E\u9875",
    "tabs.ongoing": "\u8FD0\u884C\u4E2D",
    "tabs.done": "\u5DF2\u5B8C\u6210\u672A\u8BFB",
    "tabs.warning": "\u7B49\u5F85\u4F60\u5904\u7406",
    "menu.newSubfolder": "\u65B0\u589E\u5B50\u5206\u7EC4",
    "menu.newSubWorkspace": "\u65B0\u589E\u5B50\u5DE5\u4F5C\u533A",
    "menu.renameFolder": "\u91CD\u547D\u540D\u5206\u7EC4",
    "menu.removeFolder": "\u5220\u9664\u5206\u7EC4",
    "menu.renameSgroup": "\u91CD\u547D\u540D\u4F1A\u8BDD\u5206\u7EC4",
    "menu.pin": "\u7F6E\u9876",
    "menu.unpin": "\u53D6\u6D88\u7F6E\u9876",
    "view.label": "\u89C6\u56FE\u914D\u7F6E",
    "view.grouping": "\u5206\u7EC4\u65B9\u5F0F",
    "view.workspaces": "\u6309\u5DE5\u4F5C\u533A",
    "view.projects": "\u6309\u5DE5\u4F5C\u533A\u6811",
    "view.flat": "\u5355\u5217\u8868",
    "view.time": "\u6309\u65F6\u95F4",
    "view.sort": "\u6392\u5E8F\u65B9\u5F0F",
    "view.sort.manual": "\u624B\u52A8\u6392\u5E8F",
    "view.sort.latest": "\u6700\u8FD1\u66F4\u65B0",
    "view.filter": "\u7B5B\u9009\u4F1A\u8BDD",
    "view.filter.hide": "\u9690\u85CF\u5DF2\u5F52\u6863",
    "view.filter.show": "\u5168\u90E8\u5BF9\u8BDD\uFF08\u663E\u793A\u5DF2\u5F52\u6863\uFF09",
    "view.filter.only": "\u4EC5\u663E\u793A\u5DF2\u5F52\u6863",
    "view.time.direction": "\u65F6\u95F4\u65B9\u5411",
    "view.time.hint": "\u65F6\u95F4\u89C6\u56FE\u6309\u66F4\u65B0\u65F6\u95F4\u5206\u6876\uFF0C\u4E0D\u80FD\u624B\u52A8\u91CD\u6392\u3002",
    "view.flat.hint": "\u5355\u5217\u8868\u7684\u624B\u52A8\u987A\u5E8F\u6CBF\u7528\u5DE5\u4F5C\u533A\u53CA\u5176\u4F1A\u8BDD\u987A\u5E8F\uFF1B\u8BF7\u5728\u5DE5\u4F5C\u533A\u89C6\u56FE\u4E2D\u62D6\u62FD\u8C03\u6574\u3002",
    "view.time.latest": "\u6700\u65B0\u5728\u524D",
    "view.time.oldest": "\u6700\u65E7\u5728\u524D",
    "view.hint": "\u5206\u7EC4\u3001\u6392\u5E8F\u4E0E\u5F52\u6863\u7B5B\u9009\u72EC\u7ACB\u4FDD\u5B58\u3002\u6700\u8FD1\u66F4\u65B0\u53EA\u6539\u53D8\u663E\u793A\u987A\u5E8F\uFF0C\u5207\u56DE\u624B\u52A8\u6392\u5E8F\u6062\u590D\u539F\u987A\u5E8F\uFF1B\u81EA\u52A8\u6392\u5E8F\u671F\u95F4\u5173\u95ED\u62D6\u62FD\u91CD\u6392\u3002",
    "bucket.today": "\u4ECA\u5929",
    "bucket.yesterday": "\u6628\u5929",
    "bucket.week": "\u8FD1 7 \u5929",
    "bucket.month": "\u8FD1 30 \u5929",
    "bucket.earlier": "\u66F4\u65E9",
    "pinned.header": "\u5DF2\u7F6E\u9876",
    "settings.title": "\u66F4\u597D\u7684\u5DE5\u4F5C\u533A",
    "settings.desc": "\u5DE5\u4F5C\u533A\u6811\u7684\u5916\u89C2\u4E0E\u6298\u53E0\u504F\u597D",
    "settings.expand": "\u5C55\u5F00",
    "settings.collapse": "\u6536\u8D77",
    "settings.showTabs": "\u5C55\u793A\u4F1A\u8BDD\u6807\u7B7E\u9875",
    "settings.showTabs.hint": "\u5728\u5BF9\u8BDD\u9876\u680F\u663E\u793A\u4F1A\u8BDD\u6807\u7B7E\u9875;\u5173\u95ED\u540E\u9690\u85CF\u6807\u7B7E\u6761,\u9876\u680F\u8FD8\u539F\u4E3A\u5BBF\u4E3B\u539F\u751F\u5E03\u5C40(\u4F1A\u8BDD\u6807\u9898\u4E0E\u64CD\u4F5C\u533A\u56DE\u5230\u539F\u4F4D\u7F6E)\u3002",
    "settings.statusDots": "\u542F\u7528\u5706\u70B9\u72B6\u6001",
    "settings.statusDots.hint": "\u4F1A\u8BDD\u884C\u4F7F\u7528\u63D2\u4EF6\u7ED8\u5236\u7684\u7EDF\u4E00 6px \u72B6\u6001\u70B9(\u8FD0\u884C\u6A59 / \u5F85\u4EA4\u4E92\u7425\u73C0 / \u5B8C\u6210\u7EFF);\u5173\u95ED\u540E\u8FD8\u539F\u4E3A\u5BBF\u4E3B\u539F\u751F\u7684\u72B6\u6001\u706F\u6837\u5F0F,\u6807\u7B7E\u9875\u4E5F\u4E0D\u518D\u663E\u793A\u72B6\u6001\u70B9\u3002",
    "settings.compactChains": "\u5355\u94FE\u5206\u7EC4\u6298\u53E0\u663E\u793A",
    "settings.compactChains.hint": "\u5355\u5C42\u94FE\u5408\u5E76\u4E3A\u4E00\u884C,\u51FA\u73B0\u591A\u4E2A\u5B50\u7EA7\u65F6\u81EA\u52A8\u5C55\u5F00\u4E3A\u6811\u72B6;\u62D6\u62FD\u5DE5\u4F5C\u533A\u671F\u95F4\u5355\u94FE\u4E34\u65F6\u5C55\u5F00\u56DE\u6587\u4EF6\u5939\u6811,\u53EF\u653E\u5165\u4EFB\u610F\u4E00\u7EA7;\u5C55\u5F00\u72B6\u6001\u4E0E\u81EA\u5B9A\u4E49\u5916\u89C2\u4FDD\u5B58\u5728\u5F53\u524D\u6D4F\u89C8\u5668\u3002",
    "settings.statusPulse": "\u72B6\u6001\u547C\u5438\u706F",
    "settings.statusPulse.hint": "\u88AB\u6298\u53E0\u85CF\u8D77\u7684\u72B6\u6001\u706F(\u5B8C\u6210\u7EFF / \u8FD0\u884C\u6A59 / \u5F85\u4EA4\u4E92\u7425\u73C0)\u6CBF\u5C42\u7EA7\u5411\u5916\u5192\u6CE1:\u5DE5\u4F5C\u533A\u4E0E\u5206\u7EC4\u884C\u4EE5\u56FE\u6807\u547C\u5438\u53D1\u5149(\u989C\u8272\u968F\u72B6\u6001,\u81EA\u5B9A\u4E49\u8FC7\u53D1\u5149\u7684\u6807\u9898\u4E00\u8D77\u547C\u5438),\u4F1A\u8BDD\u5206\u7EC4\u884C\u663E\u793A\u547C\u5438\u72B6\u6001\u706F;\u9ED8\u8BA4\u5F00\u542F,\u53EF\u5728\u6B64\u5173\u95ED\u3002",
    "custom.title": "\u81EA\u5B9A\u4E49\u5916\u89C2",
    "custom.color": "\u989C\u8272",
    "custom.glow": "\u53D1\u5149",
    "custom.preview": "\u5B9E\u65F6\u9884\u89C8",
    "custom.preview.sample": "\u5DE5\u4F5C\u533A\u793A\u4F8B",
    "custom.weight": "\u5B57\u4F53\u7C97\u7EC6",
    "custom.weight.regular": "\u5E38\u89C4",
    "custom.weight.medium": "\u4E2D",
    "custom.weight.semibold": "\u534A\u7C97",
    "custom.weight.bold": "\u7C97",
    "custom.shadow": "\u5B57\u4F53\u9634\u5F71",
    "custom.weak": "\u5F31",
    "custom.medium": "\u4E2D",
    "custom.strong": "\u5F3A",
    "custom.icon": "\u56FE\u6807",
    "custom.icon.solid": "\u5B9E\u5FC3\u6587\u4EF6\u5939",
    "custom.icon.outline": "\u7A7A\u5FC3\u6587\u4EF6\u5939",
    "custom.icon.none": "\u4E0D\u663E\u793A",
    "custom.none": "\u4E0D\u663E\u793A",
    "custom.reset": "\u6E05\u9664\u81EA\u5B9A\u4E49",
    "custom.done": "\u5B8C\u6210",
    "settings.on": "\u5F00",
    "settings.off": "\u5173",
    "flow.title": "\u6DFB\u52A0\u5DE5\u4F5C\u533A",
    "flow.picked": "\u6240\u9009\u6587\u4EF6\u5939",
    "flow.section": "\u6240\u5C5E\u5206\u533A",
    "flow.section.none": "\u4E0D\u5206\u533A\uFF08\u9879\u76EE\uFF09",
    "flow.section.heading": "\u5206\u533A",
    "flow.section.new": "\u65B0\u5EFA\u5206\u533A\u2026",
    "flow.section.name": "\u5206\u533A\u540D\u79F0",
    "flow.section.empty": "\u5206\u533A\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A",
    "flow.section.exists": "\u5206\u533A\u5DF2\u5B58\u5728",
    "flow.section.hint": "\u76F4\u63A5\u70B9\u9009\u5206\u533A\uFF0C\u65B0\u5DE5\u4F5C\u533A\u521B\u5EFA\u540E\u5373\u5E76\u5165\u8BE5\u5206\u533A\uFF1B\u968F\u65F6\u53EF\u5728\u53F3\u952E\u83DC\u5355\u4E2D\u8C03\u6574",
    "flow.parent": "\u6240\u5C5E\u5206\u7EC4",
    "flow.parentHint": "\u5728\u201C\u9879\u76EE\u201D\u533A\u57DF\u6309\u540D\u79F0\u8DEF\u5F84\u5D4C\u5957\uFF0C\u4F8B\u5982 web/frontend\uFF1B\u7559\u7A7A\u8868\u793A\u4E0D\u5D4C\u5957",
    "flow.parent.root": "\u4E0D\u5D4C\u5957\uFF08\u6839\u7EA7\uFF09",
    "flow.parent.heading": "\u5DF2\u6709\u5206\u7EC4",
    "flow.parent.new": "\u65B0\u5EFA\u5206\u7EC4\u300C{path}\u300D",
    "flow.parent.empty": "\u8FD8\u6CA1\u6709\u5206\u7EC4\uFF0C\u76F4\u63A5\u8F93\u5165\u8DEF\u5F84\u5373\u53EF\u65B0\u5EFA",
    "flow.preview": "\u6807\u9898\uFF1A{title}",
    "flow.preview.section": "\u6807\u9898\uFF1A{title} \xB7 \u5E76\u5165\u5206\u533A\u300C{name}\u300D",
    "flow.creating": "\u6B63\u5728\u521B\u5EFA\u2026",
    "error.title": "\u51FA\u9519\u4E86",
    "cancel": "\u53D6\u6D88",
    "create": "\u521B\u5EFA",
    "confirm": "\u786E\u5B9A",
    "close": "\u5173\u95ED",
    "ws.rename.title": "\u91CD\u547D\u540D\u5DE5\u4F5C\u533A",
    "ws.rename.hint": "\u540D\u79F0\u4E2D\u7684 / \u5373\u5C42\u7EA7\u5206\u7EC4,\u4F8B\u5982 web/\u524D\u7AEF",
    "ws.delete.title": "\u5220\u9664\u5DE5\u4F5C\u533A",
    "ws.delete.body": "\u4EC5\u79FB\u9664\u5DE5\u4F5C\u533A\u767B\u8BB0,\u76EE\u5F55\u548C\u4F1A\u8BDD\u8BB0\u5F55\u90FD\u4F1A\u4FDD\u7559\u3002\u786E\u5B9A\u5220\u9664\u300C{name}\u300D?",
    "folder.new.title": "\u65B0\u5EFA\u5206\u7EC4",
    "folder.new.hint": "\u5206\u7EC4\u8DEF\u5F84,\u53EF\u7528 / \u8868\u793A\u591A\u7EA7,\u4F8B\u5982 web/\u524D\u7AEF",
    "folder.rename.title": "\u91CD\u547D\u540D\u5206\u7EC4",
    "folder.rename.hint": "\u91CD\u547D\u540D\u4F1A\u540C\u6B65\u66F4\u65B0\u7EC4\u5185\u6240\u6709\u5DE5\u4F5C\u533A\u540D\u79F0",
    "folder.delete.body": "\u5220\u9664\u7A7A\u5206\u7EC4\u300C{name}\u300D?",
    "folder.error.empty": "\u5206\u7EC4\u8DEF\u5F84\u4E0D\u80FD\u4E3A\u7A7A",
    "folder.error.exists": "\u5206\u7EC4\u5DF2\u5B58\u5728",
    "folder.error.notEmpty": "\u5206\u7EC4\u5185\u8FD8\u6709\u5DE5\u4F5C\u533A,\u65E0\u6CD5\u5220\u9664",
    "wgroup.menu": "\u5206\u533A",
    "wgroup.projects": "\u9879\u76EE",
    "wgroup.unassigned": "\u672A\u5206\u533A\uFF08\u9879\u76EE\uFF09",
    "wgroup.new": "\u65B0\u5EFA\u5206\u533A\u2026",
    "wgroup.new.title": "\u65B0\u5EFA\u5206\u533A",
    "wgroup.hint": "\u5206\u533A\u540D\u79F0\uFF1B\u5DE5\u4F5C\u533A\u4E0E\u4F1A\u8BDD\u7684\u540D\u79F0\u3001\u76EE\u5F55\u4FDD\u6301\u539F\u6837",
    "wgroup.rename": "\u91CD\u547D\u540D\u5206\u533A",
    "wgroup.delete": "\u5220\u9664\u5206\u533A",
    "wgroup.delete.body": "\u5220\u9664\u300C{name}\u300D\uFF1F\u7EC4\u5185\u5DE5\u4F5C\u533A\u5C06\u79FB\u56DE\u201C\u9879\u76EE\u201D\uFF0C\u5355\u72EC\u5206\u533A\u7684\u4F1A\u8BDD\u56DE\u5230\u6240\u5C5E\u5DE5\u4F5C\u533A\uFF0C\u5DE5\u4F5C\u533A\u4E0E\u4F1A\u8BDD\u90FD\u4F1A\u4FDD\u7559\u3002",
    "wgroup.followWorkspace": "\u8DDF\u968F\u6240\u5C5E\u5DE5\u4F5C\u533A",
    "wgroup.error.empty": "\u5206\u533A\u540D\u79F0\u4E0D\u80FD\u4E3A\u7A7A",
    "wgroup.error.exists": "\u5206\u533A\u5DF2\u5B58\u5728"
  };

  // src/client/i18n/en.ts
  var en = {
    "title": "Workspaces",
    "search.placeholder": "Search workspaces or sessions",
    "add": "Add workspace",
    "rail.search": "Search",
    "rail.add": "Add workspace",
    "empty": "No workspaces yet",
    "empty.search": "No matches",
    "empty.archived": "No archived sessions",
    "empty.sessions": "No sessions match this filter",
    "empty.showAll": "Show all conversations",
    "session.new": "New session",
    "group.ungrouped": "Ungrouped",
    "sessions.expand": "Show {n} more sessions",
    "sessions.collapse": "Collapse",
    "time.now": "now",
    "time.minutes": "{n}min",
    "time.hours": "{n}h",
    "time.days": "{n}d",
    "time.months": "{n}mo",
    "time.years": "{n}y",
    "status.running": "Running",
    "status.completed": "Completed",
    "status.approval": "Waiting for approval",
    "status.planReview": "Waiting for plan review",
    "status.question": "Waiting for answer",
    "status.subagents": "{n} subagent(s) running",
    "schedule.active": "Has active scheduled task",
    "menu.rename": "Rename",
    "menu.renameSession": "Rename session",
    "menu.archiveSession": "Archive session",
    "menu.deleteSession": "Delete session",
    "menu.openDirectory": "Open in File Explorer",
    "menu.copyDirectory": "Copy working directory",
    "menu.copySessionId": "Copy session ID",
    "menu.refresh": "Refresh",
    "menu.deleteUnavailable": "Session deletion service is unavailable",
    "session.delete.title": "Permanently delete session?",
    "session.delete.body": 'Delete "{name}"? Session records and attachments will be permanently deleted, and running tasks will stop. This cannot be undone.',
    "session.delete.confirm": "Delete",
    "session.delete.busy": "Deleting\u2026",
    "session.delete.done": "Session deleted",
    "session.delete.cleanupWarning": "Session files were deleted, but list synchronization is incomplete. Please refresh the page.",
    "session.delete.failed": "Session deletion failed: {reason}",
    "copy.directory.done": "Working directory copied",
    "copy.sessionId.done": "Session ID copied",
    "copy.failed": "Copy failed. Check clipboard permissions.",
    "menu.delete": "Delete",
    "menu.fork": "Fork",
    "menu.archive": "Archive",
    "menu.unarchive": "Unarchive",
    "session.archived": "Archived",
    "session.archivedHint": "Unarchive this session before opening it.",
    "menu.openTab": "Open in a new tab",
    "tabs.label": "Session tabs",
    "tabs.close": "Close tab",
    "tabs.ongoing": "Running",
    "tabs.done": "Finished, unread",
    "tabs.warning": "Waiting for you",
    "menu.newSubfolder": "New subfolder",
    "menu.newSubWorkspace": "New workspace here",
    "menu.renameFolder": "Rename folder",
    "menu.removeFolder": "Delete folder",
    "menu.renameSgroup": "Rename session group",
    "menu.pin": "Pin",
    "menu.unpin": "Unpin",
    "view.label": "View settings",
    "view.grouping": "Group by",
    "view.workspaces": "Workspace",
    "view.projects": "Workspace tree",
    "view.flat": "Single list",
    "view.time": "Time",
    "view.sort": "Sort by",
    "view.sort.manual": "Manual order",
    "view.sort.latest": "Recently updated",
    "view.filter": "Filter sessions",
    "view.filter.hide": "Hide archived",
    "view.filter.show": "All conversations (including archived)",
    "view.filter.only": "Archived only",
    "view.time.direction": "Time direction",
    "view.time.hint": "The time view uses update-time buckets and cannot be manually reordered.",
    "view.flat.hint": "Manual list order follows workspace and session order. Drag in a workspace view to reorder.",
    "view.time.latest": "Latest first",
    "view.time.oldest": "Oldest first",
    "view.hint": "Grouping, sorting and archive visibility are saved independently. Recency changes display order only; manual mode restores the original order. Drag reordering is disabled during automatic sorting.",
    "bucket.today": "Today",
    "bucket.yesterday": "Yesterday",
    "bucket.week": "Last 7 days",
    "bucket.month": "Last 30 days",
    "bucket.earlier": "Earlier",
    "pinned.header": "Pinned",
    "settings.title": "Better Workspaces",
    "settings.desc": "Workspace tree appearance and folding preferences",
    "settings.expand": "Expand",
    "settings.collapse": "Collapse",
    "settings.showTabs": "Show session tabs",
    "settings.showTabs.hint": "Draw the session tab strip in the conversation header; turning it off hides the strip and restores the shell's native header layout (the session title and actions return to their original spots).",
    "settings.statusDots": "Enable status dots",
    "settings.statusDots.hint": "Session rows use the plugin-drawn 6px status dots (running orange / pending amber / done green); turning it off restores the host's native status-light style and hides the dots in the tab strip.",
    "settings.compactChains": "Merge single-child chains",
    "settings.compactChains.hint": "Single-child chains merge into one row; levels with multiple children expand as a tree. Chains re-expand into folder rows while you drag a workspace, so it can drop into any level. State and custom styling persist in this browser.",
    "settings.statusPulse": "Status breathing light",
    "settings.statusPulse.hint": "Status dots hidden by collapse (done green / running orange / pending amber) bubble outward: workspace and folder rows breathe on their icon in the status color (custom-glow labels breathe along), session-group rows show a breathing dot; on by default, turn it off here.",
    "custom.title": "Customize",
    "custom.color": "Color",
    "custom.glow": "Glow",
    "custom.preview": "Live preview",
    "custom.preview.sample": "Workspace sample",
    "custom.weight": "Font weight",
    "custom.weight.regular": "Regular",
    "custom.weight.medium": "Medium",
    "custom.weight.semibold": "Semi-bold",
    "custom.weight.bold": "Bold",
    "custom.shadow": "Font shadow",
    "custom.weak": "Subtle",
    "custom.medium": "Medium",
    "custom.strong": "Strong",
    "custom.icon": "Icon",
    "custom.icon.solid": "Solid folder",
    "custom.icon.outline": "Outline folder",
    "custom.icon.none": "Hidden",
    "custom.none": "None",
    "custom.reset": "Clear custom style",
    "custom.done": "Done",
    "settings.on": "On",
    "settings.off": "Off",
    "flow.title": "Add workspace",
    "flow.picked": "Chosen folder",
    "flow.section": "Section",
    "flow.section.none": "No section (Projects)",
    "flow.section.heading": "Sections",
    "flow.section.new": "New section\u2026",
    "flow.section.name": "Section name",
    "flow.section.empty": "Section name cannot be empty",
    "flow.section.exists": "That section already exists",
    "flow.section.hint": "Pick a section here and the new workspace joins it right away; change it later from the context menu.",
    "flow.parent": "Name-path group",
    "flow.parentHint": "Nests inside the Projects area by name path, e.g. web/frontend; leave empty for no nesting",
    "flow.parent.root": "No nesting (root)",
    "flow.parent.heading": "Existing groups",
    "flow.parent.new": "New group \u201C{path}\u201D",
    "flow.parent.empty": "No groups yet \u2014 type a path to create one",
    "flow.preview": "Title: {title}",
    "flow.preview.section": "Title: {title} \xB7 joins section \u201C{name}\u201D",
    "flow.creating": "Creating\u2026",
    "error.title": "Something went wrong",
    "cancel": "Cancel",
    "create": "Create",
    "confirm": "OK",
    "close": "Close",
    "ws.rename.title": "Rename workspace",
    "ws.rename.hint": "Use / inside the name to nest, e.g. web/frontend",
    "ws.delete.title": "Delete workspace",
    "ws.delete.body": 'Only the workspace registration is removed; the directory and session logs remain. Delete "{name}"?',
    "folder.new.title": "New folder",
    "folder.new.hint": "Folder path; nest with /, e.g. web/frontend",
    "folder.rename.title": "Rename folder",
    "folder.rename.hint": "Renaming updates every workspace title inside the folder",
    "folder.delete.body": 'Delete empty folder "{name}"?',
    "folder.error.empty": "Folder path must not be empty",
    "folder.error.exists": "Folder already exists",
    "folder.error.notEmpty": "Folder still contains workspaces",
    "wgroup.menu": "Section",
    "wgroup.projects": "Projects",
    "wgroup.unassigned": "Ungrouped (Projects)",
    "wgroup.new": "New section\u2026",
    "wgroup.new.title": "New section",
    "wgroup.hint": "Section name; workspace and session names and directories stay unchanged",
    "wgroup.rename": "Rename section",
    "wgroup.delete": "Delete section",
    "wgroup.delete.body": 'Delete "{name}"? Its workspaces return to Projects and individually sectioned sessions return to their workspace. Workspaces and sessions will be retained.',
    "wgroup.followWorkspace": "Follow workspace",
    "wgroup.error.empty": "Section name must not be empty",
    "wgroup.error.exists": "Section already exists"
  };

  // src/client/core/text.ts
  var cls = (...xs) => xs.filter(Boolean).join(" ");
  var basename = (p) => {
    if (!p) return "";
    const s = String(p).replace(/[\\/]+$/, "");
    const i = Math.max(s.lastIndexOf("/"), s.lastIndexOf("\\"));
    return i === -1 ? s : s.slice(i + 1);
  };
  var splitPlainSegs = (text) => {
    const s = String(text || "");
    const schemeAt = s.indexOf("://");
    if (schemeAt === -1) return s.split("/").map((x) => x.trim()).filter(Boolean);
    const cut = s.lastIndexOf("/", schemeAt);
    const segs = (cut === -1 ? "" : s.slice(0, cut)).split("/").map((x) => x.trim()).filter(Boolean);
    const tail = s.slice(cut + 1).trim();
    if (tail !== "") segs.push(tail);
    return segs;
  };
  var splitTitleSegs = (title) => {
    const s = String(title || "");
    if (!/["“]/.test(s)) return splitPlainSegs(s);
    const out = [];
    let plain = "";
    let i = 0;
    while (i < s.length) {
      const ch = s[i];
      if (ch === '"' || ch === "\u201C") {
        const close = ch === "\u201C" ? "\u201D" : '"';
        const j = s.indexOf(close, i + 1);
        if (j === -1) {
          plain += ch;
          i += 1;
          continue;
        }
        for (const seg of splitPlainSegs(plain)) out.push(seg);
        plain = "";
        const end = j + 1;
        const quoted = s.slice(i, end).trim();
        if (quoted !== "") out.push(quoted);
        i = end;
        continue;
      }
      plain += ch;
      i += 1;
    }
    for (const seg of splitPlainSegs(plain)) out.push(seg);
    return out;
  };
  var normPath = (p) => splitTitleSegs(p).join("/");

  // src/client/core/time.ts
  var bucketOf = (updatedAt, now) => {
    const t = Number(updatedAt) || 0;
    if (t <= 0) return "earlier";
    const n = new Date(now);
    const today = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
    if (t >= today) return "today";
    if (t >= today - 864e5) return "yesterday";
    if (t >= today - 7 * 864e5) return "week";
    if (t >= today - 30 * 864e5) return "month";
    return "earlier";
  };
  var BUCKET_ORDER = ["today", "yesterday", "week", "month", "earlier"];
  var FALLBACK_UNITS = { minutes: "m", hours: "h", days: "d", months: "mo", years: "y" };
  var timeLabel = (updatedAt, now, t, relativeTime) => {
    if (typeof relativeTime !== "function") return "";
    const r = relativeTime(updatedAt, now);
    if (!r) return "";
    if (r.unit === "now") return t("time.now");
    const key = "time." + r.unit;
    const count = r.n ?? 0;
    const out = t(key, { n: count });
    if (typeof out === "string" && out !== "" && out !== key) return out;
    return String(count) + (FALLBACK_UNITS[r.unit] || "");
  };

  // src/client/core/view.ts
  var VIEW_MODES = ["workspaces", "projects", "flat", "time"];
  var ARCHIVED_FILTERS = ["hide", "show", "only"];
  var viewStateOf = (prefs) => {
    const p = prefs || {};
    const legacy = p.sortMode;
    let mode = "projects";
    if (VIEW_MODES.includes(p.viewMode)) mode = p.viewMode;
    else if (p.viewMode === void 0 && (legacy === "latest" || legacy === "oldest")) mode = "time";
    let dir = "latest";
    if (p.timeDirection === "oldest" || p.timeDirection === void 0 && legacy === "oldest") dir = "oldest";
    return {
      mode,
      dir,
      sortOrder: p.sortOrder === "latest" ? "latest" : "manual",
      archivedFilter: ARCHIVED_FILTERS.includes(p.archivedFilter) ? p.archivedFilter : "hide"
    };
  };
  var sessionVisible = (summary, current, archivedSet, archivedFilter = "hide") => {
    if (!summary || summary.origin === "subagent" || summary.blank && summary.id !== current) return false;
    const archived = archivedSet.has(summary.id);
    if (archivedFilter === "only") return archived;
    if (archivedFilter === "show") return true;
    return !archived;
  };
  var orderRows = (rows, sortOrder) => {
    if (sortOrder !== "latest") return rows.slice();
    return rows.slice().sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  };
  var pendingKind = (entry) => {
    if (!entry) return void 0;
    const p = entry;
    return p.kind || p.status || p.type || "pending";
  };
  var pendingKindOf = (pending, id) => {
    if (!pending) return void 0;
    const source = pending;
    const p = typeof source.get === "function" ? source.get(id) : source[id];
    return pendingKind(p);
  };
  var statusPendingKindOf = (status) => {
    const p = status;
    return pendingKind(p && p.pendingInteraction);
  };
  var currentSessionIdOf = (list) => {
    const byId = list && list.byId;
    if (!byId) return null;
    for (const summary of Object.values(byId)) {
      if (!summary || !summary.retainedBy) continue;
      if ((summary.retainedBy.mainView || 0) > 0) return String(summary.id);
    }
    return null;
  };
  var sessionTitleOf = (summary, t) => {
    if (!summary) return "";
    if (summary.blank) return t("session.new");
    return String(summary.displayTitle || summary.title || "");
  };
  var hasActiveScheduleOf = (summary) => !!(summary && summary.projectionValues && Array.isArray(summary.projectionValues.schedule) && summary.projectionValues.schedule.length > 0);
  var subagentRunningCounts = (byId, runningOf) => {
    const children = /* @__PURE__ */ new Map();
    for (const id of Object.keys(byId || {})) {
      const summary = byId[id];
      const parentId = summary && (summary.parentId || summary.parentSessionId);
      if (!summary || !parentId) continue;
      let list = children.get(parentId);
      if (!list) {
        list = [];
        children.set(parentId, list);
      }
      list.push(summary);
    }
    const countFor = (rootId) => {
      let count = 0;
      const queue = (children.get(rootId) || []).slice();
      const seen = /* @__PURE__ */ new Set([rootId]);
      while (queue.length > 0) {
        const summary = queue.shift();
        if (!summary || seen.has(summary.id)) continue;
        seen.add(summary.id);
        const running = typeof runningOf === "function" ? runningOf(summary.id) === true : !!summary.running;
        if (running) count += 1;
        const kids = children.get(summary.id);
        if (kids) for (const kid of kids) queue.push(kid);
      }
      return count;
    };
    const counts = /* @__PURE__ */ new Map();
    for (const id of Object.keys(byId || {})) counts.set(id, countFor(id));
    return counts;
  };

  // src/client/core/tree.ts
  function buildSessionTree(rows, sortOrder = "manual") {
    const root = { path: "", name: "", groups: [], sessions: [] };
    const byPath = /* @__PURE__ */ new Map([["", root]]);
    const ensure = (segs) => {
      let node = root;
      let key = "";
      for (const seg of segs) {
        key = key === "" ? seg : key + "/" + seg;
        let next = byPath.get(key);
        if (!next) {
          next = { path: key, name: seg, groups: [], sessions: [] };
          byPath.set(key, next);
          node.groups.push(next);
        }
        node = next;
      }
      return node;
    };
    for (const row of rows || []) {
      const segs = splitTitleSegs(row.title);
      const leaf = segs.length > 0 ? segs[segs.length - 1] : String(row.title || "");
      ensure(segs.slice(0, -1)).sessions.push({ ...row, leaf });
    }
    const sortRec = (node) => {
      for (const group of node.groups) sortRec(group);
      node.updatedAt = [...node.sessions, ...node.groups].reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0);
      if (sortOrder === "latest") {
        node.sessions = orderRows(node.sessions, sortOrder);
        node.groups.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.name.localeCompare(b.name, "zh"));
      } else node.groups.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    };
    sortRec(root);
    return root;
  }
  var countSessionTree = (node) => node.sessions.length + node.groups.reduce((sum, group) => sum + countSessionTree(group), 0);
  var collectSessionRows = (node) => {
    const out = node.sessions.slice();
    for (const group of node.groups) out.push(...collectSessionRows(group));
    return out;
  };
  var findSessionGroup = (node, path) => {
    if (node.path === path) return node;
    for (const group of node.groups) {
      const hit = findSessionGroup(group, path);
      if (hit) return hit;
    }
    return null;
  };
  function buildTree(items, explicitFolders, recency) {
    const root = { path: "", name: "", folders: [], workspaces: [] };
    const byPath = /* @__PURE__ */ new Map([["", root]]);
    const ensure = (segs) => {
      let node = root;
      let key = "";
      for (const seg of segs) {
        key = key === "" ? seg : key + "/" + seg;
        let next = byPath.get(key);
        if (!next) {
          next = { path: key, name: seg, folders: [], workspaces: [] };
          byPath.set(key, next);
          node.folders.push(next);
        }
        node = next;
      }
      return node;
    };
    for (const folder of explicitFolders || []) {
      const segs = splitTitleSegs(normPath(folder));
      if (segs.length > 0) ensure(segs);
    }
    for (const workspace of items || []) {
      const segs = splitTitleSegs(workspace.title);
      const folderPath = segs.slice(0, -1).join("/");
      const leaf = segs.length > 0 ? segs[segs.length - 1] : basename(workspace.path) || String(workspace.title || "") || String(workspace.workspaceId || "");
      ensure(segs.slice(0, -1)).workspaces.push({
        workspaceId: workspace.workspaceId,
        title: String(workspace.title || ""),
        path: String(workspace.path || ""),
        sessionIds: Array.isArray(workspace.sessionIds) ? workspace.sessionIds : [],
        leaf,
        folderPath,
        updatedAt: recency ? recency.get(workspace.workspaceId) || 0 : 0
      });
    }
    const sortRec = (node) => {
      for (const child of node.folders) sortRec(child);
      node.updatedAt = [...node.workspaces, ...node.folders].reduce((latest, row) => Math.max(latest, row.updatedAt || 0), 0);
      if (recency) {
        node.workspaces = orderRows(node.workspaces, "latest");
        node.folders.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0) || a.name.localeCompare(b.name, "zh"));
      } else node.folders.sort((a, b) => a.name.localeCompare(b.name, "zh"));
    };
    sortRec(root);
    return root;
  }
  var buildWorkspaceList = (items, recency) => {
    const tree = buildTree(items, [], recency);
    const byId = /* @__PURE__ */ new Map();
    const collect = (node) => {
      for (const workspace of node.workspaces) byId.set(workspace.workspaceId, { ...workspace, leaf: workspace.title || workspace.leaf });
      for (const folder of node.folders) collect(folder);
    };
    collect(tree);
    const rows = (items || []).map((workspace) => byId.get(workspace.workspaceId));
    return { ...tree, folders: [], workspaces: orderRows(rows, recency ? "latest" : "manual") };
  };
  var countWorkspaces = (node) => node.kind === "ws" ? 1 : node.workspaces.length + node.folders.reduce((sum, folder) => sum + countWorkspaces(folder), 0);
  var materializeChain = (chain) => chain.kind === "ws" ? {
    kind: "ws",
    path: chain.path,
    segs: chain.segs,
    pure: chain.pure,
    workspace: {
      ...chain.workspace,
      leaf: chain.segs.join("/") + "/" + chain.pure,
      title: chain.workspace.title,
      folderPath: ""
    },
    folders: [],
    workspaces: []
  } : { kind: "folder", path: chain.path, segs: chain.segs, folders: chain.folders, workspaces: chain.workspaces };
  function compressTree(node) {
    const folders = (node.folders || []).map(compressTree);
    const workspaces = node.workspaces || [];
    if (workspaces.length === 0 && folders.length === 1) {
      const child = folders[0];
      return {
        kind: child.kind,
        path: child.path,
        segs: [node.name].concat(child.segs || []),
        pure: child.pure,
        workspace: child.workspace,
        folders: child.folders,
        workspaces: child.workspaces
      };
    }
    if (folders.length === 0 && workspaces.length === 1) {
      return { kind: "ws", path: node.path, segs: [node.name], pure: workspaces[0].leaf, workspace: workspaces[0], folders: [], workspaces: [] };
    }
    return { kind: "folder", path: node.path, segs: [node.name], folders: folders.map(materializeChain), workspaces };
  }

  // src/client/host.ts
  var messageOf = (reason) => reason instanceof Error ? reason.message : String(reason);
  var SESSION_DELETE_ROUTE = "/dsh-workspace-plus/delete-session";
  var checkSessionDelete = async () => {
    const response = await fetch(SESSION_DELETE_ROUTE, { method: "GET" });
    if (response.status !== 405) return false;
    const result = await response.json();
    return result.error === "method-not-allowed";
  };
  var deleteSessionRecord = async (sessionId) => {
    const response = await fetch(SESSION_DELETE_ROUTE, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const result = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(result && (result.detail || result.error) || "HTTP " + response.status);
    }
    if (!result || result.ok !== true || result.removed !== true) {
      throw new Error(result && (result.detail || result.error) || "not-confirmed");
    }
    return result;
  };
  var writeClipboardText = async (text, writeClipboard) => {
    if (typeof writeClipboard === "function") return writeClipboard(text);
    if (typeof navigator !== "undefined" && navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  };
  var openSessionDirectory = async (path) => {
    const response = await fetch("/api/session/openWorkspacePath", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type: "client-request", rpcId: crypto.randomUUID(), method: "session/openWorkspacePath", payload: { args: { request: { path } } } })
    });
    if (!response.ok) throw new Error("Open directory failed (HTTP " + response.status + ")");
    const envelope = await response.json();
    const result = envelope.result;
    if (!result || result.ok !== true || !result.value || result.value.opened !== true) {
      throw new Error(result && result.error ? (typeof result.error === "object" ? result.error.message : result.error) || messageOf(result.error) : "Open directory was not confirmed");
    }
  };

  // src/client/store.ts
  var createViewStore = () => storeKit.defineStore({
    init: () => ({ folders: [], workspaceGroups: [], workspaceGroupById: {}, sessionSectionById: {}, expanded: {}, sessionsExpanded: {}, sessionGroups: {}, prefs: { showTabs: true, statusDots: true, compactChains: true, viewMode: "projects", timeDirection: "latest", sortOrder: "manual", archivedFilter: "hide" }, styling: {}, pinned: [] }),
    // NOTE: hydration REPLACES the state with the persisted whole value —
    // init defaults never merge. Every action must tolerate a missing key
    // (states persisted by older plugin versions lack sessionGroups), and
    // every selector read takes a fallback.
    persist: "dsh.betterWorkspace.view.v1",
    actions: {
      setExpanded: (d, key, value) => {
        if (!d.expanded) d.expanded = {};
        d.expanded[key] = value;
      },
      setSessionsExpanded: (d, key, value) => {
        if (!d.sessionsExpanded) d.sessionsExpanded = {};
        d.sessionsExpanded[key] = value;
      },
      setSessionGroupExpanded: (d, key, value) => {
        if (!d.sessionGroups) d.sessionGroups = {};
        d.sessionGroups[key] = value;
      },
      setPref: (d, key, value) => {
        if (!d.prefs) d.prefs = {};
        d.prefs[key] = value;
      },
      setStyling: (d, key, value) => {
        if (!d.styling) d.styling = {};
        if (value === null) delete d.styling[key];
        else d.styling[key] = value;
      },
      createWorkspaceGroup: (d, id, name, workspaceId) => {
        if (!Array.isArray(d.workspaceGroups)) d.workspaceGroups = [];
        if (d.workspaceGroups.some((group) => group.id === id)) return;
        d.workspaceGroups.push({ id, name });
        if (workspaceId) {
          if (!d.workspaceGroupById) d.workspaceGroupById = {};
          d.workspaceGroupById[workspaceId] = id;
        }
      },
      assignWorkspaceGroup: (d, workspaceId, groupId) => {
        if (groupId && !(d.workspaceGroups || []).some((group) => group.id === groupId)) return;
        if (!d.workspaceGroupById) d.workspaceGroupById = {};
        if (groupId) d.workspaceGroupById[workspaceId] = groupId;
        else delete d.workspaceGroupById[workspaceId];
      },
      assignSessionSection: (d, sessionId, groupId) => {
        if (groupId && !(d.workspaceGroups || []).some((group) => group.id === groupId)) return;
        if (!d.sessionSectionById) d.sessionSectionById = {};
        if (groupId === null) delete d.sessionSectionById[sessionId];
        else d.sessionSectionById[sessionId] = groupId;
      },
      renameWorkspaceGroup: (d, id, name) => {
        const group = (d.workspaceGroups || []).find((group2) => group2.id === id);
        if (group) group.name = name;
      },
      deleteWorkspaceGroup: (d, id) => {
        d.workspaceGroups = (d.workspaceGroups || []).filter((group) => group.id !== id);
        for (const [workspaceId, groupId] of Object.entries(d.workspaceGroupById || {})) {
          if (groupId === id) delete d.workspaceGroupById[workspaceId];
        }
        for (const [sessionId, groupId] of Object.entries(d.sessionSectionById || {})) {
          if (groupId === id) delete d.sessionSectionById[sessionId];
        }
        if (d.expanded) delete d.expanded["workspace-group:" + id];
      },
      setViewMode: (d, mode) => {
        if (!d.prefs) d.prefs = {};
        d.prefs.viewMode = VIEW_MODES.includes(mode) ? mode : "projects";
      },
      setTimeDirection: (d, dir) => {
        if (!d.prefs) d.prefs = {};
        d.prefs.timeDirection = dir === "oldest" ? "oldest" : "latest";
      },
      setSortOrder: (d, order) => {
        if (!d.prefs) d.prefs = {};
        d.prefs.sortOrder = order === "latest" ? "latest" : "manual";
      },
      setArchivedFilter: (d, filter) => {
        if (!d.prefs) d.prefs = {};
        d.prefs.archivedFilter = ARCHIVED_FILTERS.includes(filter) ? filter : "hide";
      },
      // Pin order IS the visual order: most recent unshift first. Removing
      // keeps the rest of the order intact. Session ids are stable host ids.
      togglePin: (d, id) => {
        if (!Array.isArray(d.pinned)) d.pinned = [];
        const key = String(id);
        if (d.pinned.includes(key)) d.pinned = d.pinned.filter((p) => p !== key);
        else d.pinned = [key].concat(d.pinned);
      },
      addFolder: (d, path) => {
        if (!Array.isArray(d.folders)) d.folders = [];
        const p = normPath(path);
        if (p !== "" && !d.folders.includes(p)) d.folders.push(p);
      },
      removeFolder: (d, path) => {
        if (!Array.isArray(d.folders)) d.folders = [];
        d.folders = d.folders.filter((f) => f !== path);
      },
      renameFolder: (d, oldPath, newPath) => {
        if (!Array.isArray(d.folders)) d.folders = [];
        const oo = oldPath + "/";
        const nn = newPath + "/";
        const next = d.folders.map((f) => f === oldPath ? newPath : f.startsWith(oo) ? nn + f.slice(oo.length) : f);
        d.folders = Array.from(new Set(next));
      }
    }
  });

  // src/client/icons.ts
  var iconCache = /* @__PURE__ */ new Map();
  var ICON_SIZE_SUFFIX = /^(.*?)(\d+)$/;
  var ICON_WEIGHT_SUFFIX = /^(.*?)(Regular|Medium)$/;
  var iconExport = (key) => {
    if (!Object.prototype.hasOwnProperty.call(ui, key)) return null;
    const C = ui[key];
    if (typeof C === "function") return C;
    return C !== null && typeof C === "object" && C.$$typeof !== void 0 ? C : null;
  };
  var resolveIcon = (name) => {
    const key = String(name == null ? "" : name);
    if (key === "") return null;
    if (iconCache.has(key)) return iconCache.get(key);
    let C = iconExport(key);
    const sized = ICON_SIZE_SUFFIX.exec(key);
    if (!C && sized) C = iconExport(sized[1] + "Regular") || iconExport(sized[1] + "Medium");
    const weighted = ICON_WEIGHT_SUFFIX.exec(key);
    if (!C && weighted) C = iconExport(weighted[1] + "16") || iconExport(weighted[1] + "14") || iconExport(weighted[1]);
    if (!C) {
      const base = sized ? sized[1] : weighted ? weighted[1] : key;
      for (const k of Object.keys(ui).filter((k2) => k2.indexOf(base) === 0 && k2.length > base.length).sort((a, b) => a.length - b.length)) {
        C = iconExport(k);
        if (C) break;
      }
    }
    if (!C && typeof console !== "undefined" && console.warn) {
      console.warn("[workspace-plus] primitives icon unavailable: " + key);
    }
    iconCache.set(key, C || null);
    return C || null;
  };
  var icon = (name, size) => {
    const C = resolveIcon(name);
    return C ? E(C, { size: size || 16 }) : null;
  };
  var PinIcon16 = ({ size = 14, className }) => E(
    "svg",
    {
      width: size,
      height: size,
      className: className || void 0,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false"
    },
    E("path", { d: "M12 17v5" }),
    E("path", { d: "M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 1 1-1 2 2 0 0 0 0-4H8a2 2 0 0 0 0 4 1 1 0 0 1 1 1z" })
  );
  var lucideSvg = (size, className, children) => E("svg", {
    width: size,
    height: size,
    className: className || void 0,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": "true",
    focusable: "false"
  }, ...children);
  var ListTreeIcon16 = ({ size = 14, className }) => lucideSvg(size, className, [
    E("path", { d: "M8 5h13" }),
    E("path", { d: "M13 12h8" }),
    E("path", { d: "M13 19h8" }),
    E("path", { d: "M3 10a2 2 0 0 0 2 2h3" }),
    E("path", { d: "M3 5v12a2 2 0 0 0 2 2h3" })
  ]);
  var ListIcon16 = ({ size = 14, className }) => lucideSvg(size, className, [
    E("path", { key: "lines", d: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" })
  ]);
  var CalendarDaysIcon16 = ({ size = 14, className }) => lucideSvg(size, className, [
    E("path", { d: "M8 2v4" }),
    E("path", { d: "M16 2v4" }),
    E("rect", { width: "18", height: "18", x: "3", y: "4", rx: "2" }),
    E("path", { d: "M3 10h18" }),
    E("path", { d: "M8 14h.01" }),
    E("path", { d: "M12 14h.01" }),
    E("path", { d: "M16 14h.01" }),
    E("path", { d: "M8 18h.01" }),
    E("path", { d: "M12 18h.01" }),
    E("path", { d: "M16 18h.01" })
  ]);

  // src/client/styles.ts
  var CSS_TEXT = [
    ".bw-root{height:100%;display:flex;flex-direction:column;min-height:0;position:relative;color:var(--dsw-alias-label-primary,#e6e6e6);container-type:inline-size}",
    ".bw-header{display:flex;align-items:center;gap:2px;padding:10px 10px 4px;flex:none}",
    ".bw-header-title{flex:1;font-size:12px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-secondary,#b8b8b8);min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".bw-icon-btn{flex:none;width:24px;height:24px;border:none;background:transparent;border-radius:6px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}",
    ".bw-icon-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15));color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-search-row{flex:none;padding:0 10px 6px}",
    ".bw-input{width:100%;box-sizing:border-box;height:26px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;color:inherit;padding:0 8px;font-size:12px;outline:none;font-family:inherit}",
    ".bw-input:focus{border-color:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-input::placeholder{color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-tree{flex:1;overflow-y:auto;overflow-x:hidden;padding:2px 6px 12px;min-height:0}",
    ".bw-row{display:flex;align-items:center;gap:6px;min-height:28px;padding:0 6px;border-radius:6px;cursor:pointer;user-select:none;font-size:13px;color:var(--dsw-alias-label-primary,#e6e6e6);position:relative}",
    '.bw-drop-before::after{content:"";position:absolute;left:8px;right:8px;top:-1px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary,#5b8def);pointer-events:none}',
    '.bw-drop-after::after{content:"";position:absolute;left:8px;right:8px;bottom:-1px;height:2px;border-radius:1px;background:var(--dsw-alias-brand-primary,#5b8def);pointer-events:none}',
    ".bw-drop-into{outline:1.5px dashed var(--dsw-alias-brand-primary,#5b8def);outline-offset:-1.5px}",
    ".bw-row:hover{background:var(--dsw-specific-sidebar-nav-item-hover,var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12)))}",
    ".bw-row:hover{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-hover,rgba(127,127,127,.14)) 50%,transparent)}",
    ".bw-row-current{background:var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.15))}",
    ".bw-row-current{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.16)) 40%,transparent)}",
    ".bw-row-icon{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-chevron{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a);transition:transform .15s ease}",
    ".bw-chevron-open{transform:rotate(90deg)}",
    ".bw-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".bw-row-count{flex:none;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-row-time{flex:none;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-schedule-badge{flex:none;display:inline-flex;align-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a);margin:0 6px}",
    ".bw-row-actions{flex:none;display:none;align-items:center;gap:2px}",
    ".bw-row:hover .bw-row-actions{display:flex}",
    ".bw-row:hover .bw-row-time,.bw-row:hover .bw-row-count,.bw-row:hover .bw-schedule-badge{display:none}",
    // Session-row hover bubble (ui/tooltip.js). Metrics and tokens mirror the
    // host primitives bubble, so the plugin-owned tip is visually identical.
    ".bw-tip{display:inline-flex;align-items:center;gap:8px;position:fixed;z-index:100;width:max-content;max-width:50vw;padding:3px 7px;border-radius:var(--dsw-radius-sm,6px);background:var(--dsw-alias-tooltip-bg,rgba(24,24,28,.95));color:var(--dsw-static-neutral-bluish-00,#fff);font-size:13px;line-height:20px;white-space:pre-line;overflow-wrap:break-word;pointer-events:none;animation:bw-tip-in 150ms var(--ds-ease-in-out,ease)}",
    '.bw-tip[data-side="bottom"]{transform:translateX(-50%)}',
    '.bw-tip[data-side="top"]{transform:translate(-50%,-100%)}',
    "@keyframes bw-tip-in{from{opacity:0}}",
    "@media (prefers-reduced-motion:reduce){.bw-tip{animation:none}}",
    ".bw-dot{flex:none;width:6px;height:6px;border-radius:50%;background:transparent}",
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
    "html:not([data-bw-tabs-off]) header[data-window-drag]{position:relative}",
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
    ".bw-tabs{display:flex;align-items:center;gap:2px;min-width:0;max-width:52vw;overflow-x:auto;scrollbar-width:none;-webkit-app-region:no-drag;app-region:no-drag}",
    ".bw-tabs::-webkit-scrollbar{display:none}",
    ".bw-tab{display:flex;align-items:center;gap:6px;flex:none;max-width:200px;padding:5px 4px 5px 8px;border-radius:6px;color:var(--dsw-alias-label-secondary,#b6b6b6);cursor:pointer;user-select:none}",
    ".bw-tab:hover{background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.08))}",
    ".bw-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}",
    ".bw-tab-active{box-shadow:inset 0 -2px 0 var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-tab-active .bw-tab-label{color:var(--dsw-alias-brand-primary,#5b8def);font-weight:600}",
    ".bw-tab-dragging{opacity:.45}",
    ".bw-tab-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:13px;line-height:18px}",
    ".bw-tab-dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--dsw-alias-label-caption,#8a8a8a);opacity:.55}",
    ".bw-tab-close{flex:none;appearance:none;border:0;background:none;color:inherit;cursor:pointer;font-size:14px;line-height:1;padding:1px 4px 2px;border-radius:4px;opacity:.45}",
    ".bw-tab:hover .bw-tab-close{opacity:1}",
    ".bw-tab-close:hover{background:var(--dsw-alias-bg-layer-3,rgba(127,127,127,.16));color:var(--dsw-alias-label-primary,#e6e6e6)}",
    // The plugin-drawn status dot (all three states): geometry only, the colour is
    // inline (one source of truth with the glow, see rows.js PULSE_COLORS).
    // display:inline-block is load-bearing — the dot sits inside the .bw-pulse
    // span, so it is NOT a grid item of the row icon, and an inline span would
    // ignore width/height (the dot then renders at zero size: invisible).
    ".bw-state-dot{display:inline-block;flex:none;width:6px;height:6px;border-radius:50%}",
    ".bw-session-row{font-size:12.5px;color:var(--dsw-alias-label-secondary,#b8b8b8);min-height:26px}",
    ".bw-sgroup-row{font-size:12.5px;color:var(--dsw-alias-label-tertiary,#9a9a9a);min-height:24px}",
    ".bw-sgroup-row:hover{color:var(--dsw-alias-label-secondary,#b8b8b8)}",
    ".bw-session-row:hover{color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-empty{padding:28px 12px;text-align:center;font-size:12px;color:var(--dsw-alias-label-dimmed,#7a7a7a)}",
    ".bw-swatch{width:20px;height:20px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));cursor:pointer;flex:none;background:transparent;padding:0}",
    ".bw-swatch-active{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:1px}",
    ".bw-color-input{width:36px;height:26px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:transparent;cursor:pointer;padding:0}",
    ".bw-seg{display:flex;gap:6px;flex-wrap:wrap}",
    ".bw-seg-btn{height:24px;padding:0 10px;border-radius:6px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));background:transparent;color:var(--dsw-alias-label-secondary,#b8b8b8);font-size:12px;cursor:pointer;font-family:inherit}",
    ".bw-seg-btn:disabled{opacity:.45;cursor:default}",
    ".bw-seg-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
    ".bw-seg-btn-active{background:var(--dsw-alias-brand-primary,#5b8def);border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}",
    ".bw-seg-btn-active:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary,#5b8def));border-color:transparent}",
    ".bw-icon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(30px,1fr));gap:4px}",
    ".bw-icon-cell{height:30px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:transparent;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}",
    ".bw-icon-cell:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12));color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-icon-cell-active{border-color:var(--dsw-alias-brand-primary,#5b8def);color:var(--dsw-alias-label-primary,#e6e6e6);outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}",
    ".bw-icon-none{width:12px;height:2px;background:currentColor;border-radius:1px;opacity:.7}",
    ".bw-rgb-row{display:flex;gap:10px;align-items:center}",
    ".bw-rgb-label{display:flex;align-items:center;gap:4px;font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-rgb-input{width:52px;height:26px;box-sizing:border-box;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;color:inherit;font-size:12px;padding:0 6px;font-family:inherit}",
    ".bw-ctx-overlay{position:fixed;inset:0;z-index:40}",
    ".bw-ctx-menu{position:fixed;min-width:170px;background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,rgba(28,28,32,.72)));-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3));border-radius:8px;padding:4px;box-shadow:0 8px 24px rgba(0,0,0,.35);display:flex;flex-direction:column}",
    ".bw-ctx-item{display:flex;align-items:center;gap:8px;height:28px;padding:0 10px;border:none;background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-size:12.5px;border-radius:6px;cursor:pointer;text-align:left;font-family:inherit}",
    ".bw-ctx-item:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}",
    ".bw-ctx-item:disabled{opacity:.45;cursor:default}",
    ".bw-ctx-heading{padding:6px 10px 4px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-ctx-menu{max-height:calc(100vh - 16px);overflow-y:auto}",
    ".bw-archive-mark{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-session-row-archived .bw-row-label{color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-empty .bw-btn{margin-top:10px}",
    ".bw-menu-label{flex:1}",
    ".bw-menu-icon{flex:none;width:14px;height:14px;display:grid;place-items:center;color:inherit}",
    ".bw-menu-pin{color:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-workspace-group{display:flex;align-items:center;gap:6px;min-height:32px;margin-top:10px;padding:4px 8px;box-sizing:border-box;border-radius:6px;color:var(--dsw-alias-label-tertiary,#9a9a9a);font-size:12.5px;cursor:pointer}",
    ".bw-workspace-group:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.14))}",
    ".bw-workspace-group .bw-row-label{flex:0 1 auto}",
    ".bw-workspace-group:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:-2px}",
    ".bw-workspace-group-chevron{display:grid;place-items:center;transition:transform .12s}",
    ".bw-workspace-group-chevron-open{transform:rotate(90deg)}",
    ".bw-ctx-submenu{min-width:200px;max-width:min(280px,calc(100vw - 16px))}",
    ".bw-ctx-submenu .bw-menu-label{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".bw-menu-shortcut{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-notice{position:absolute;bottom:16px;left:8px;right:8px;padding:8px 10px;border-radius:6px;background:var(--dsw-alias-bg-overlay,#222);color:var(--dsw-alias-label-primary,#fff);box-shadow:0 4px 14px rgba(0,0,0,.2);font-size:12px;pointer-events:none;z-index:41}",
    ".bw-confirm-danger{background:var(--dsw-alias-state-error-primary,#d93025)!important;color:#fff!important}",
    ".bw-ctx-danger{color:var(--dsw-alias-state-error-primary,#f85149)}",
    ".bw-ctx-sep{height:1px;background:var(--dsw-alias-border-l1,rgba(127,127,127,.2));margin:4px 6px}",
    ".bw-settings{display:flex;flex-direction:column;gap:6px;max-width:640px}",
    // Settings → Plugins: the body our plugins.bundle.config slot renders on the
    // bundle's page.
    ".bw-plugin-config{display:flex;flex-direction:column;gap:2px;padding:4px 0 8px}",
    ".bw-setting-row{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary,#b8b8b8)}",
    ".bw-setting-label{flex:1;min-width:0;font-size:13px;line-height:1.5;color:var(--dsw-alias-label-secondary,#b8b8b8)}",
    ".bw-switch{box-sizing:border-box;position:relative;flex:0 0 auto;width:36px;height:20px;padding:2px;border:0;border-radius:10px;background:var(--dsw-alias-border-l3,rgba(127,127,127,.3));cursor:pointer;transition:background 120ms ease}",
    ".bw-switch:hover{background:var(--dsw-alias-label-dimmed,#7a7a7a)}",
    ".bw-switch-on{background:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-switch:focus-visible{outline:2px solid var(--dsw-alias-brand-primary,#5b8def);outline-offset:2px}",
    ".bw-switch-thumb{display:block;width:16px;height:16px;border-radius:50%;background:var(--dsw-alias-label-primary-foreground,#fff);transition:transform 120ms ease}",
    ".bw-switch-on .bw-switch-thumb{transform:translateX(16px)}",
    ".bw-plugin-body .bw-hint{font-size:12px;color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-rail{display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 0}",
    ".bw-rail-btn{width:36px;height:36px;border:none;background:transparent;border-radius:8px;display:grid;place-items:center;color:var(--dsw-alias-label-secondary,#b8b8b8);cursor:pointer;padding:0}",
    ".bw-rail-btn:hover{background:var(--dsw-specific-sidebar-nav-item-hover,var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12)));color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-modal-body{display:flex;flex-direction:column;gap:10px;min-width:300px;max-width:380px;box-sizing:border-box}",
    ".bw-field{display:flex;flex-direction:column;gap:4px;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8)}",
    ".bw-hint{font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a);line-height:1.5;white-space:normal;word-break:break-word}",
    ".bw-path-echo{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a);word-break:break-all;max-width:380px}",
    ".bw-modal-actions{display:flex;justify-content:flex-end;gap:8px}",
    ".bw-btn{height:28px;padding:0 14px;border-radius:6px;font-size:12.5px;cursor:pointer;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit}",
    ".bw-btn:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.12))}",
    ".bw-btn-primary{background:var(--dsw-alias-brand-primary,#5b8def);border-color:transparent;color:var(--dsw-alias-brand-text,#fff)}",
    ".bw-btn-primary:hover{background:var(--dsw-alias-button-primary-hover,var(--dsw-alias-brand-primary,#5b8def))}",
    ".bw-btn:disabled{opacity:.5;cursor:default}",
    ".bw-error-text{font-size:12.5px;color:var(--dsw-alias-state-error-primary,#f85149);word-break:break-all;max-width:380px}",
    ".bw-dialog-input-row{display:flex;gap:6px;align-items:center}",
    // Add-workspace destination pickers: a real click-to-select list (the
    // native <datalist> popup the field used before rendered outside the
    // dialog, needed typing, and covered the footer buttons). The list is
    // in-flow under its trigger and scrolls inside a fixed max-height, so
    // the dialog stays clear of the viewport.
    // The name-path control carries its chevron INSIDE the box, exactly like
    // the section trigger above it: one control shape per dialog, no second
    // outlined button sitting beside the field.
    ".bw-picker{position:relative}",
    ".bw-field-row{position:relative;min-width:0}",
    ".bw-field-row .bw-input{display:block;width:100%;padding-right:26px}",
    ".bw-field-caret{position:absolute;right:3px;top:50%;transform:translateY(-50%);width:20px;height:20px;display:grid;place-items:center;padding:0;border:none;border-radius:5px;background:transparent;color:var(--dsw-alias-label-tertiary,#9a9a9a);cursor:pointer}",
    ".bw-field-caret:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15));color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-field-caret:disabled{opacity:.5;cursor:default}",
    ".bw-picker-trigger{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;height:26px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:6px;background:var(--dsw-alias-bg-layer-2,rgba(127,127,127,.1));color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}",
    ".bw-picker-trigger:hover{border-color:var(--dsw-alias-border-l2,rgba(127,127,127,.4))}",
    '.bw-picker-trigger[aria-expanded="true"]{border-color:var(--dsw-alias-brand-primary,#5b8def)}',
    ".bw-picker-trigger:disabled{opacity:.5;cursor:default}",
    ".bw-picker-value{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".bw-picker-value-muted{color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    ".bw-picker-caret{flex:none;display:grid;place-items:center;color:var(--dsw-alias-label-tertiary,#9a9a9a)}",
    // The raised list surface: the dialog itself sits on bg-layer-2, so the list uses the overlay surface plus its own border/shadow to separate from the card underneath.
    // It is a FIXED popover (geometry written inline by PickerList): the
    // dialog keeps its height while a list is open, and the modal card's
    // overflow:hidden cannot crop it.
    ".bw-picker-list{position:fixed;z-index:1100;display:flex;flex-direction:column;overflow-y:auto;padding:4px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:8px;background:var(--dsw-alias-bg-overlay,rgba(127,127,127,.08));box-shadow:0 6px 18px rgba(0,0,0,.16)}",
    ".bw-picker-row{display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;min-height:26px;padding:0 6px;border:none;border-radius:6px;background:transparent;color:var(--dsw-alias-label-primary,#e6e6e6);font-family:inherit;font-size:12px;text-align:left;cursor:pointer}",
    ".bw-picker-row:hover{background:var(--dsw-alias-interactive-bg-hover,rgba(127,127,127,.15))}",
    ".bw-picker-row:disabled{opacity:.5;cursor:default}",
    ".bw-picker-row-on{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 14%,transparent)}",
    ".bw-picker-check{flex:none;width:14px;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-picker-row-label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
    ".bw-picker-heading{padding:6px 6px 2px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-picker-empty{padding:4px 6px;font-size:11px;color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-picker-new{display:flex;align-items:center;gap:6px;padding:4px 2px 2px}",
    ".bw-picker-new .bw-input{flex:1;min-width:0}",
    ".bw-picker-error{padding:4px 6px 0;font-size:11px;color:var(--dsw-alias-state-error-primary,#f85149)}",
    ".bw-btn-sm{height:24px;padding:0 10px;font-size:12px}",
    ".bw-preview-line{font-size:11px;color:var(--dsw-alias-label-tertiary,#9a9a9a);word-break:break-all}",
    ".bw-glow-row{display:flex;align-items:center;gap:10px}",
    ".bw-slider{flex:1;accent-color:var(--dsw-alias-brand-primary,#5b8def);height:22px}",
    ".bw-glow-value{min-width:44px;text-align:right;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8);font-variant-numeric:tabular-nums}",
    ".bw-preview{display:flex;align-items:center;gap:8px;padding:6px 8px;border:1px dashed var(--dsw-alias-border-l2,rgba(127,127,127,.3));border-radius:6px;min-height:28px}",
    ".bw-preview-icon{flex:none;display:grid;place-items:center;width:20px;height:20px;color:var(--dsw-alias-label-primary,#e6e6e6)}",
    ".bw-preview-icon svg{width:18px;height:18px}",
    ".bw-preview-label{font-size:12.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;line-height:18px}",
    ".bw-pulse{display:inline-flex;align-items:center;justify-content:center;animation:bw-breathe 1.8s ease-in-out infinite}",
    "@keyframes bw-breathe{0%,100%{filter:drop-shadow(0 0 1px var(--bw-pulse-color));opacity:.55}50%{filter:drop-shadow(0 0 6px var(--bw-pulse-color));opacity:1}}",
    ".bw-pulse-text{animation:bw-breathe-text 1.8s ease-in-out infinite}",
    "@keyframes bw-breathe-text{0%,100%{text-shadow:0 0 1px var(--bw-pulse-color);opacity:.65}50%{text-shadow:0 0 7px var(--bw-pulse-color);opacity:1}}",
    ".bw-pin-mark{flex:none;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-session-row-pinned{box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary,#5b8def);background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 9%,transparent)}",
    ".bw-session-row-pinned:hover{background:color-mix(in srgb,var(--dsw-alias-brand-primary,#5b8def) 13%,transparent)}",
    ".bw-row-current.bw-session-row-pinned{background:color-mix(in srgb,var(--dsw-specific-sidebar-nav-item-active,rgba(91,141,239,.16)) 55%,var(--dsw-alias-brand-primary,#5b8def) 9%)}",
    ".bw-pinned-section{flex:none;margin:0 6px 4px;padding:0 0 4px;border-bottom:1px solid var(--dsw-alias-border-l2,rgba(127,127,127,.18))}",
    ".bw-pinned-header{display:flex;align-items:center;gap:5px;padding:8px 4px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a);user-select:none}",
    ".bw-pinned-header .bw-pin-mark{color:var(--dsw-alias-label-quaternary,#8a8a8a)}",
    ".bw-pin-ind{flex:none;display:inline-flex;align-items:center;gap:2px;color:var(--dsw-alias-brand-primary,#5b8def);font-size:10.5px;font-variant-numeric:tabular-nums}",
    // Pinned-tray rows keep the title readable in the narrow sidebar: the
    // workspace tag shrinks to a compact pill, the title guarantees a
    // minimal readable width, and under ~280px containers the relative
    // time hides in favor of the tag (container query; older engines just
    // show both and squeeze the tag instead).
    ".bw-pinned-ws-tag{flex:none;max-width:84px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:10px;line-height:16px;color:var(--dsw-alias-label-quaternary,#8a8a8a);border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.25));border-radius:4px;padding:0 4px}",
    // Badge text ships as generated content (see renderWsTag): a real text
    // child inside a session row reads as a workspace label to the third-party
    // context-menu plugin and would swap the session menu for the workspace one.
    ".bw-pinned-ws-tag::after{content:attr(data-tag)}",
    ".bw-bucket-header{display:flex;align-items:center;gap:5px;padding:8px 4px 3px;font-size:11px;font-weight:600;letter-spacing:.02em;color:var(--dsw-alias-label-quaternary,#8a8a8a);user-select:none}",
    ".bw-sort-menu-item{display:flex;align-items:center;gap:8px}",
    ".bw-sort-menu-check{flex:none;width:14px;display:grid;place-items:center;color:var(--dsw-alias-brand-primary,#5b8def)}",
    ".bw-ctx-subitem{padding-left:26px;font-size:12px;color:var(--dsw-alias-label-secondary,#b8b8b8)}",
    ".bw-tray-row .bw-row-label{min-width:56px}",
    "@container (max-width: 280px){.bw-tray-row .bw-row-time{display:none}}",
    // Timeline rows show the relative time by default and swap to the
    // workspace tag on hover (time already hides via .bw-row:hover rules).
    ".bw-ws-tag-hover{display:none}",
    ".bw-row:hover .bw-ws-tag-hover{display:inline-block}",
    // Our timeline bubbles: the primitives bubble is translucent by token
    // and washes out over theme wallpapers — re-surface it with the same
    // tokens as the context menu (opaque overlay + blur + label color).
    // Scoped to OUR bubbles only (direct children of our tree/section),
    // so official tooltips elsewhere are untouched.
    ".bw-tree > span[data-side], .bw-pinned-section > span[data-side]{background:var(--dsw-specific-menu,var(--dsw-alias-bg-overlay,rgba(28,28,32,.88)));color:var(--dsw-alias-label-primary,#e6e6e6);-webkit-backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));backdrop-filter:var(--dsh-any-blur-card-panels,blur(12px) saturate(1.15));box-shadow:0 8px 24px rgba(0,0,0,.4);padding:6px 10px;font-size:12px;line-height:18px;border:1px solid var(--dsw-alias-border-l1,rgba(127,127,127,.3))}",
    ".bw-seg-btn .bw-pin-mark{color:currentColor}"
  ].join("");

  // src/client/ui/base.ts
  var BTN = (props) => ui.Button ? E(ui.Button, props) : E("button", { type: "button", className: cls("bw-btn", props.variant === "primary" && "bw-btn-primary", props.className), onClick: props.onClick, disabled: props.disabled }, props.children);
  function TextDialog({ title, hint, initial, confirmLabel, onConfirm, onClose, t }) {
    const [value, setValue] = React.useState(initial);
    const inputRef = React.useRef(null);
    React.useEffect(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, []);
    const commit = () => onConfirm(value);
    return E(
      ui.Modal,
      {
        open: true,
        onClose,
        closeLabel: t("close"),
        title,
        footer: E(
          "div",
          { className: "bw-modal-actions" },
          E(BTN, { variant: "outline", onClick: onClose }, t("cancel")),
          E(BTN, { variant: "primary", onClick: commit }, confirmLabel || t("confirm"))
        )
      },
      E(
        "div",
        { className: "bw-modal-body" },
        E(
          "div",
          { className: "bw-field" },
          E("input", {
            ref: inputRef,
            className: "bw-input",
            value,
            onChange: (e) => setValue(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Enter") commit();
            }
          }),
          hint ? E("div", { className: "bw-hint" }, hint) : null
        )
      ),
      StyleNode()
    );
  }
  function ConfirmDialog({ title, body, onConfirm, onClose, confirmLabel, danger, busy, t }) {
    return E(ui.Modal, {
      open: true,
      onClose,
      closeLabel: t("close"),
      title,
      footer: E(
        "div",
        { className: "bw-modal-actions" },
        E(BTN, { variant: "outline", onClick: onClose, disabled: busy }, t("cancel")),
        E(BTN, { variant: "primary", className: danger ? "bw-confirm-danger" : void 0, onClick: onConfirm, disabled: busy }, confirmLabel || t("confirm"))
      )
    }, E("div", { className: "bw-modal-body" }, E("div", { className: "bw-hint" }, body)), StyleNode());
  }
  function createQuietBoundary() {
    return class Boundary extends React.Component {
      constructor(props) {
        super(props);
        this.state = { failed: false };
      }
      static getDerivedStateFromError() {
        return { failed: true };
      }
      componentDidCatch(error, info) {
        console.error("[dsh-workspace-plus] render error (region degraded to empty)", error, info);
      }
      render() {
        return this.state.failed ? null : this.props.children;
      }
    };
  }
  var PICKER_LIST_MAX = 168;
  function PickerList({ anchorRef, label, preferAbove = false, onKeyDown, children }) {
    const listRef = React.useRef(null);
    const [box, setBox] = React.useState(null);
    const place = () => {
      const anchor = anchorRef.current;
      const list = listRef.current;
      if (!anchor || !list) return;
      const rect = anchor.getBoundingClientRect();
      const gap = 4;
      const margin = 8;
      const content = Math.min(list.scrollHeight, PICKER_LIST_MAX);
      const spaceBelow = window.innerHeight - rect.bottom - margin - gap;
      const spaceAbove = rect.top - margin - gap;
      const fitsBelow = spaceBelow >= content;
      const fitsAbove = spaceAbove >= content;
      const below = fitsBelow && fitsAbove ? !preferAbove : fitsBelow ? true : fitsAbove ? false : spaceBelow >= spaceAbove;
      const maxHeight = Math.max(72, Math.min(content, below ? spaceBelow : spaceAbove));
      const height = Math.min(content, maxHeight);
      const next = {
        left: Math.round(rect.left),
        top: Math.round(below ? rect.bottom + gap : rect.top - gap - height),
        width: Math.round(rect.width),
        maxHeight: Math.round(maxHeight)
      };
      setBox((prev) => prev !== null && prev.left === next.left && prev.top === next.top && prev.width === next.width && prev.maxHeight === next.maxHeight ? prev : next);
    };
    React.useLayoutEffect(() => {
      place();
    });
    React.useEffect(() => {
      const onMove = () => place();
      window.addEventListener("resize", onMove);
      window.addEventListener("scroll", onMove, true);
      return () => {
        window.removeEventListener("resize", onMove);
        window.removeEventListener("scroll", onMove, true);
      };
    }, []);
    return E("div", {
      ref: listRef,
      className: "bw-picker-list",
      role: "listbox",
      "aria-label": label,
      // First paint stays invisible until the anchor is measured (the layout
      // effect runs before paint, so nothing flickers).
      style: box === null ? { position: "fixed", left: 0, top: 0, width: 240, maxHeight: PICKER_LIST_MAX, visibility: "hidden" } : { position: "fixed", left: box.left, top: box.top, width: box.width, maxHeight: box.maxHeight },
      onKeyDown
    }, children);
  }
  var renderWsTag = (workspaceTag, tagOnHover) => E("span", {
    className: cls("bw-pinned-ws-tag", tagOnHover && "bw-ws-tag-hover"),
    title: workspaceTag,
    "data-tag": workspaceTag
  });
  var StyleNode = () => E("style", null, CSS_TEXT);

  // src/client/ui/flow.ts
  function BetterFlow(props) {
    const { open, busy, onPicked, onCancel, onError, createWorkspace, renameWorkspace, pickDirectory, useWorkspaces, useStore, t } = props;
    const initialParent = props.initialParent || "";
    const actions = props.actions;
    const [phase, setPhase] = React.useState("idle");
    const [pickedPath, setPickedPath] = React.useState("");
    const [parentInput, setParentInput] = React.useState("");
    const [sectionPick, setSectionPick] = React.useState(null);
    const [sectionOpen, setSectionOpen] = React.useState(false);
    const [sectionNewOpen, setSectionNewOpen] = React.useState(false);
    const [sectionDraft, setSectionDraft] = React.useState("");
    const [sectionError, setSectionError] = React.useState("");
    const [pathOpen, setPathOpen] = React.useState(false);
    const sectionBoxRef = React.useRef(null);
    const pathBoxRef = React.useRef(null);
    const sectionTriggerRef = React.useRef(null);
    const pathAnchorRef = React.useRef(null);
    const snapshotItems = typeof useWorkspaces === "function" ? useWorkspaces((s) => s.items) : [];
    const storeFolders = typeof useStore === "function" ? useStore((s) => s.folders) || [] : [];
    const storedSections = typeof useStore === "function" ? useStore((s) => s.workspaceGroups) || [] : [];
    const sections = React.useMemo(() => Array.isArray(storedSections) ? storedSections.slice().sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "zh")) : [], [storedSections]);
    const canAssignSection = !!(actions && typeof actions.assignWorkspaceGroup === "function");
    React.useEffect(() => {
      if (!open) {
        setPhase("idle");
        setPickedPath("");
        setParentInput("");
        setSectionPick(null);
        setSectionOpen(false);
        setSectionNewOpen(false);
        setSectionDraft("");
        setSectionError("");
        setPathOpen(false);
        return;
      }
      let alive = true;
      setPhase("picking");
      Promise.resolve().then(() => pickDirectory()).then((path) => {
        if (!alive) return;
        if (!path) {
          onCancel();
          return;
        }
        setPickedPath(String(path));
        setParentInput(initialParent);
        setPhase("picked");
      }).catch((reason) => {
        if (!alive) return;
        setPhase("idle");
        onError(messageOf(reason));
      });
      return () => {
        alive = false;
      };
    }, [open]);
    React.useEffect(() => {
      if (!open) return;
      const onPointerDown = (event) => {
        const node = event.target;
        if (!(node instanceof Node)) return;
        if (sectionBoxRef.current && sectionBoxRef.current.contains(node)) return;
        if (pathBoxRef.current && pathBoxRef.current.contains(node)) return;
        setSectionOpen(false);
        setPathOpen(false);
      };
      document.addEventListener("pointerdown", onPointerDown);
      return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [open]);
    if (!open || phase !== "picked" && phase !== "submitting") return null;
    const folderOptions = (() => {
      const set = new Set(storeFolders);
      for (const w of snapshotItems || []) {
        const segs = splitTitleSegs(w.title);
        for (let i = 1; i < segs.length; i++) set.add(segs.slice(0, i).join("/"));
      }
      return Array.from(set).sort((a, b) => a.localeCompare(b, "zh"));
    })();
    const submitting = phase === "submitting" || busy === true;
    const previewTitle = (() => {
      const prefix = normPath(parentInput);
      const base = basename(pickedPath);
      return prefix !== "" ? prefix + "/" + base : base;
    })();
    const typedPath = normPath(parentInput);
    const pathFilter = parentInput.trim().toLocaleLowerCase();
    const visibleFolders = (pathFilter === "" ? folderOptions : folderOptions.filter((option) => option.toLocaleLowerCase().indexOf(pathFilter) !== -1)).slice(0, 60);
    const canCreatePath = typedPath !== "" && folderOptions.indexOf(typedPath) === -1;
    const consumeEscape = (event, close) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      close();
    };
    const openListKeys = (event, isOpen, open2) => {
      if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
      event.preventDefault();
      if (isOpen) {
        const box = event.currentTarget.closest(".bw-field");
        const row = box ? box.querySelector("button.bw-picker-row:not(:disabled)") : null;
        if (row) row.focus();
        return;
      }
      open2();
    };
    const walkListKeys = (event) => {
      if (event.target && event.target.tagName === "INPUT") return;
      if (["ArrowDown", "ArrowUp", "Home", "End"].indexOf(event.key) === -1) return;
      const rows = event.currentTarget.querySelectorAll("button.bw-picker-row:not(:disabled)");
      if (rows.length === 0) return;
      event.preventDefault();
      const current = Array.prototype.indexOf.call(rows, event.target);
      const next = event.key === "Home" ? 0 : event.key === "End" ? rows.length - 1 : current === -1 ? event.key === "ArrowDown" ? 0 : rows.length - 1 : (current + (event.key === "ArrowDown" ? 1 : -1) + rows.length) % rows.length;
      rows[next].focus();
    };
    const pickerRow = (key, label, active, onPick, glyph) => E(
      "button",
      {
        key,
        type: "button",
        role: "option",
        "aria-selected": active === true,
        disabled: submitting,
        className: cls("bw-picker-row", active && "bw-picker-row-on"),
        onClick: onPick
      },
      E("span", { className: "bw-picker-check", "aria-hidden": true }, active ? icon("IconCheckOutline14", 12) : glyph || null),
      E("span", { className: "bw-picker-row-label" }, label)
    );
    const commitNewSection = () => {
      const name = sectionDraft.trim();
      if (name === "") {
        setSectionError(t("flow.section.empty"));
        return;
      }
      if (sections.some((group) => String(group.name || "").toLocaleLowerCase() === name.toLocaleLowerCase())) {
        setSectionError(t("flow.section.exists"));
        return;
      }
      setSectionPick({ name, isNew: true });
      setSectionNewOpen(false);
      setSectionDraft("");
      setSectionError("");
      setSectionOpen(false);
    };
    const confirm = () => {
      if (phase === "submitting") return;
      const prefix = normPath(parentInput);
      const base = basename(pickedPath);
      const fullTitle = prefix !== "" ? prefix + "/" + base : base;
      const section = canAssignSection ? sectionPick : null;
      setPhase("submitting");
      Promise.resolve().then(() => createWorkspace({ path: pickedPath })).then(async (workspace) => {
        try {
          await renameWorkspace(workspace.workspaceId, fullTitle);
        } catch (renameError) {
          onError(messageOf(renameError));
          onCancel();
          return;
        }
        try {
          if (prefix !== "" && actions && typeof actions.addFolder === "function") actions.addFolder(prefix);
          if (section) {
            if (section.isNew) {
              const groupId = crypto.randomUUID();
              actions.createWorkspaceGroup(groupId, section.name, workspace.workspaceId);
              actions.setExpanded("workspace-group:" + groupId, true);
            } else {
              actions.assignWorkspaceGroup(workspace.workspaceId, section.id);
              actions.setExpanded("workspace-group:" + section.id, true);
            }
          }
        } catch (assignError) {
          onError(messageOf(assignError));
        }
        onCancel();
      }).catch((reason) => {
        onError(messageOf(reason));
        onCancel();
      });
    };
    const body = E(
      "div",
      { className: "bw-modal-body" },
      E(
        "div",
        { className: "bw-field" },
        t("flow.picked"),
        E("div", { className: "bw-path-echo" }, pickedPath)
      ),
      canAssignSection ? E(
        "div",
        {
          className: "bw-field",
          ref: sectionBoxRef,
          // Escape belongs to the OPEN LIST, wherever the keyboard sits inside
          // this field (trigger, list, inline name input) — the dialog's own
          // Escape must not fire while a list is open.
          onKeyDown: (event) => {
            if (sectionOpen) consumeEscape(event, () => setSectionOpen(false));
          }
        },
        t("flow.section"),
        E(
          "div",
          { className: "bw-picker" },
          E(
            "button",
            {
              type: "button",
              className: "bw-picker-trigger",
              disabled: submitting,
              ref: sectionTriggerRef,
              "aria-haspopup": "listbox",
              "aria-expanded": sectionOpen,
              onClick: () => {
                setSectionOpen((v) => !v);
                setSectionNewOpen(false);
                setSectionDraft("");
                setSectionError("");
                setPathOpen(false);
              },
              onKeyDown: (event) => openListKeys(event, sectionOpen, () => setSectionOpen(true))
            },
            E(
              "span",
              { className: cls("bw-picker-value", sectionPick === null && "bw-picker-value-muted") },
              sectionPick === null ? t("flow.section.none") : sectionPick.name
            ),
            E("span", { className: "bw-picker-caret", "aria-hidden": true }, icon("IconChevronDownOutline14", 12))
          ),
          sectionOpen ? E(
            PickerList,
            {
              anchorRef: sectionTriggerRef,
              label: t("flow.section"),
              onKeyDown: walkListKeys
            },
            pickerRow(
              "section:none",
              t("flow.section.none"),
              sectionPick === null,
              () => {
                setSectionPick(null);
                setSectionOpen(false);
              }
            ),
            sections.length > 0 ? E("div", { key: "section:heading", className: "bw-picker-heading" }, t("flow.section.heading")) : null,
            sections.map((group) => pickerRow(
              "section:" + group.id,
              group.name,
              sectionPick !== null && sectionPick.id === group.id,
              () => {
                setSectionPick({ id: group.id, name: group.name });
                setSectionOpen(false);
              }
            )),
            sectionNewOpen ? E(
              "div",
              { key: "section:new-row", className: "bw-picker-new" },
              E("input", {
                className: "bw-input",
                value: sectionDraft,
                placeholder: t("flow.section.name"),
                disabled: submitting,
                autoFocus: true,
                onChange: (event) => {
                  setSectionDraft(event.target.value);
                  setSectionError("");
                },
                onKeyDown: (event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    event.stopPropagation();
                    commitNewSection();
                    return;
                  }
                  consumeEscape(event, () => {
                    setSectionNewOpen(false);
                    setSectionDraft("");
                    setSectionError("");
                  });
                }
              }),
              E("button", {
                type: "button",
                className: "bw-btn bw-btn-primary bw-btn-sm",
                disabled: submitting,
                onClick: commitNewSection
              }, t("confirm"))
            ) : pickerRow(
              "section:new",
              t("flow.section.new"),
              sectionPick !== null && sectionPick.isNew === true,
              () => {
                setSectionNewOpen(true);
                setSectionDraft("");
              },
              icon("IconPlusOutline14", 12)
            ),
            sectionError !== "" ? E("div", { key: "section:error", className: "bw-picker-error" }, sectionError) : null
          ) : null
        ),
        E("div", { className: "bw-hint" }, t("flow.section.hint"))
      ) : null,
      E(
        "div",
        {
          className: "bw-field",
          ref: pathBoxRef,
          // Escape belongs to the OPEN LIST, wherever the keyboard sits inside
          // this field; with no list open it stays the dialog's own Escape.
          onKeyDown: (event) => {
            if (pathOpen) consumeEscape(event, () => setPathOpen(false));
          }
        },
        t("flow.parent"),
        E(
          "div",
          { className: "bw-picker" },
          E(
            "div",
            { className: "bw-field-row", ref: pathAnchorRef },
            E("input", {
              className: "bw-input",
              value: parentInput,
              autoFocus: true,
              placeholder: "web/frontend",
              disabled: submitting,
              onChange: (event) => {
                setParentInput(event.target.value);
                setPathOpen(true);
              },
              // Suggestions open when the field is actually used (typing, a
              // click, or the caret) — an autofocus must not grow the dialog.
              onPointerDown: () => setPathOpen(true),
              onKeyDown: (event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  confirm();
                }
              }
            }),
            E("button", {
              type: "button",
              className: "bw-field-caret",
              disabled: submitting,
              "aria-label": t("flow.parent"),
              "aria-expanded": pathOpen,
              onClick: () => {
                setPathOpen((v) => !v);
                setSectionOpen(false);
              },
              onKeyDown: (event) => openListKeys(event, pathOpen, () => {
                setPathOpen(true);
                setSectionOpen(false);
              })
            }, icon("IconChevronDownOutline14", 12))
          ),
          pathOpen ? E(
            PickerList,
            {
              anchorRef: pathAnchorRef,
              label: t("flow.parent"),
              preferAbove: true,
              onKeyDown: walkListKeys
            },
            pickerRow(
              "path:root",
              t("flow.parent.root"),
              typedPath === "",
              () => {
                setParentInput("");
                setPathOpen(false);
              }
            ),
            folderOptions.length > 0 ? E("div", { key: "path:heading", className: "bw-picker-heading" }, t("flow.parent.heading")) : null,
            visibleFolders.map((option) => pickerRow(
              "path:" + option,
              option,
              typedPath === option,
              () => {
                setParentInput(option);
                setPathOpen(false);
              }
            )),
            canCreatePath ? pickerRow(
              "path:new",
              t("flow.parent.new", { path: typedPath }),
              false,
              () => setPathOpen(false),
              icon("IconPlusOutline14", 12)
            ) : null,
            folderOptions.length === 0 && !canCreatePath ? E("div", { key: "path:empty", className: "bw-picker-empty" }, t("flow.parent.empty")) : null
          ) : null
        ),
        E("div", { className: "bw-hint" }, t("flow.parentHint"))
      ),
      E(
        "div",
        { className: "bw-preview-line" },
        sectionPick !== null && canAssignSection ? t("flow.preview.section", { title: previewTitle, name: sectionPick.name }) : t("flow.preview", { title: previewTitle })
      )
    );
    const footer = E(
      "div",
      { className: "bw-modal-actions" },
      E(BTN, { variant: "outline", onClick: onCancel, disabled: submitting }, t("cancel")),
      E(BTN, { variant: "primary", onClick: confirm, disabled: submitting }, submitting ? t("flow.creating") : t("create"))
    );
    return E(ui.Modal, { open: true, onClose: () => {
      if (!submitting) onCancel();
    }, closeLabel: t("close"), title: t("flow.title"), footer }, body, StyleNode());
  }

  // src/client/ui/tooltip.ts
  var TIP_EDGE = 12;
  var TIP_TICK_MS = 120;
  var pointInRect = (rect, point) => !!rect && !!point && point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
  var placeTip = (anchor, size, viewport, gap = 8) => {
    const lo = TIP_EDGE + size.width / 2;
    const hi = viewport.width - TIP_EDGE - size.width / 2;
    const left = Math.max(lo, Math.min(anchor.left + anchor.width / 2, hi));
    const below = anchor.bottom + gap;
    const above = anchor.top - gap - size.height;
    const fitsBelow = below + size.height <= viewport.height - TIP_EDGE;
    const fitsAbove = above >= TIP_EDGE;
    const flipped = !fitsBelow && fitsAbove;
    return { left, top: flipped ? above : below, side: flipped ? "top" : "bottom" };
  };
  function useHoverTip(options) {
    const opts = options || {};
    const label = opts.label === void 0 ? null : opts.label;
    const delayMs = opts.delayMs === void 0 ? 300 : opts.delayMs;
    const gap = opts.gap === void 0 ? 8 : opts.gap;
    const maxWidth = opts.maxWidth === void 0 ? 320 : opts.maxWidth;
    const anchorRef = React.useRef(null);
    const pointerRef = React.useRef(null);
    const timerRef = React.useRef(null);
    const bubbleRef = React.useRef(null);
    const hoverAwareRef = React.useRef(false);
    const [anchor, setAnchor] = React.useState(null);
    const [size, setSize] = React.useState(null);
    const open = anchor !== null;
    const clearTimer = () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
    const hide = () => {
      clearTimer();
      pointerRef.current = null;
      setAnchor(null);
      setSize(null);
    };
    const measure = () => {
      const el = anchorRef.current;
      if (!el || el.isConnected === false) return null;
      const rect = el.getBoundingClientRect();
      return { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height };
    };
    const show = () => {
      clearTimer();
      const rect = measure();
      if (rect) setAnchor(rect);
    };
    const attach = {
      ref: anchorRef,
      onMouseEnter: (event) => {
        if (label === null) return;
        pointerRef.current = { x: event.clientX, y: event.clientY };
        clearTimer();
        if (delayMs > 0) timerRef.current = setTimeout(() => {
          timerRef.current = null;
          show();
        }, delayMs);
        else show();
      },
      onMouseLeave: () => hide()
    };
    React.useEffect(() => {
      if (!open) return void 0;
      const step = () => {
        const el = anchorRef.current;
        if (!el || el.isConnected === false) {
          hide();
          return;
        }
        if (typeof el.matches === "function") {
          if (el.matches(":hover")) hoverAwareRef.current = true;
          else if (hoverAwareRef.current) {
            hide();
            return;
          }
        }
        const point = pointerRef.current;
        if (!point) {
          hide();
          return;
        }
        const rect = el.getBoundingClientRect();
        if (!pointInRect({ left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom }, point)) {
          hide();
          return;
        }
        setAnchor((prev) => prev && prev.left === rect.left && prev.top === rect.top && prev.right === rect.right && prev.bottom === rect.bottom ? prev : { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom, width: rect.width, height: rect.height });
      };
      const onMove = (event) => {
        pointerRef.current = { x: event.clientX, y: event.clientY };
        step();
      };
      const onKey = (event) => {
        if (event.key === "Escape") hide();
      };
      const onVisibility = () => {
        if (document.visibilityState === "hidden") hide();
      };
      const onWindowOut = (event) => {
        if (!event.relatedTarget) hide();
      };
      const passive = { capture: true, passive: true };
      const tick = setInterval(step, TIP_TICK_MS);
      document.addEventListener("pointermove", onMove, passive);
      document.addEventListener("mousemove", onMove, passive);
      document.addEventListener("scroll", step, passive);
      document.addEventListener("mouseout", onWindowOut, passive);
      document.addEventListener("pointerdown", hide, true);
      document.addEventListener("pointercancel", hide, true);
      document.addEventListener("dragstart", hide, true);
      document.addEventListener("keydown", onKey, true);
      document.addEventListener("visibilitychange", onVisibility);
      document.addEventListener("mouseleave", hide, true);
      window.addEventListener("blur", hide);
      return () => {
        clearInterval(tick);
        document.removeEventListener("pointermove", onMove, passive);
        document.removeEventListener("mousemove", onMove, passive);
        document.removeEventListener("scroll", step, passive);
        document.removeEventListener("mouseout", onWindowOut, passive);
        document.removeEventListener("pointerdown", hide, true);
        document.removeEventListener("pointercancel", hide, true);
        document.removeEventListener("dragstart", hide, true);
        document.removeEventListener("keydown", onKey, true);
        document.removeEventListener("visibilitychange", onVisibility);
        document.removeEventListener("mouseleave", hide, true);
        window.removeEventListener("blur", hide);
      };
    }, [open]);
    React.useEffect(() => {
      if (!open) {
        setSize(null);
        return;
      }
      const el = bubbleRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setSize((prev) => prev && prev.width === rect.width && prev.height === rect.height ? prev : { width: rect.width, height: rect.height });
    }, [open, anchor, label]);
    const text = open && label !== null ? typeof label === "function" ? label() : String(label) : null;
    let bubble = null;
    if (text) {
      const placement = anchor && size ? placeTip(anchor, size, { width: window.innerWidth, height: window.innerHeight }, gap) : { left: 0, top: 0, side: "bottom" };
      bubble = E("span", {
        ref: bubbleRef,
        className: "bw-tip",
        "data-side": placement.side,
        role: "tooltip",
        style: { left: placement.left, top: placement.top, visibility: size ? "visible" : "hidden", maxWidth }
      }, text);
    }
    return { attach, bubble };
  }

  // src/client/rows.ts
  var iconOf = (mode, expanded) => {
    if (!mode || mode === "none") return null;
    if (mode === "solid") return icon(expanded ? "IconFolderOpen16" : "IconFolderClose16");
    if (mode === "outline") return icon("IconFolderOpenOutline16");
    return icon(mode);
  };
  var colorToRgb = (hex) => {
    if (!hex) return null;
    const m = /^#?([0-9a-fA-F]{6})$/.exec(hex);
    if (!m) return null;
    const v = parseInt(m[1], 16);
    return [v >> 16 & 255, v >> 8 & 255, v & 255];
  };
  var rgbToHex = (r, g, b) => "#" + [r, g, b].map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
  function FolderRow({ node, depth, expanded, onToggle, onContextMenu, dropInto, dragEvents, custStyle, iconMode, pulse, t }) {
    const total = countWorkspaces(node);
    const iconEl = iconOf(iconMode, expanded);
    const iconChild = pulse ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === "function" ? E(ui.StateDot, { state: pulse, size: 10 }) : null)) : iconEl;
    return E(
      "div",
      {
        className: cls("bw-row", dropInto && "bw-drop-into"),
        "data-bw-context": "folder",
        style: { paddingLeft: 4 + depth * 12, ...custStyle || {}, ...pulse ? { "--bw-pulse-color": PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null },
        onClick: onToggle,
        onContextMenu,
        role: "treeitem",
        "aria-expanded": expanded,
        ...dragEvents || {}
      },
      E("span", { className: cls("bw-chevron", expanded && "bw-chevron-open") }, icon("IconTriangleRightFill14", 14)),
      E("span", { className: "bw-row-icon" }, iconChild),
      // A row that already carries a custom label glow breathes in sync.
      E("span", { className: cls("bw-row-label", pulse && custStyle && custStyle.textShadow && "bw-pulse-text") }, node.name),
      total > 0 ? E("span", { className: "bw-row-count" }, String(total)) : null
    );
  }
  function WorkspaceGroupRow({ group, expanded, onToggle, onContextMenu, dropInto, dragEvents }) {
    return E(
      "div",
      {
        className: cls("bw-workspace-group", dropInto && "bw-drop-into"),
        "data-bw-context": "workspace-group",
        role: "treeitem",
        "aria-expanded": group.id ? expanded : void 0,
        tabIndex: 0,
        onClick: onToggle,
        onContextMenu,
        onKeyDown: (event) => {
          if (onToggle && (event.key === "Enter" || event.key === " ")) {
            event.preventDefault();
            onToggle();
          }
        },
        ...dragEvents || {}
      },
      E("span", { className: "bw-row-label" }, group.name),
      group.id ? E("span", { className: cls("bw-workspace-group-chevron", expanded && "bw-workspace-group-chevron-open"), "aria-hidden": true }, icon("IconChevronRightOutline14", 14)) : null
    );
  }
  function WorkspaceRow({ workspace, depth, count, sessionsOpen, onToggle, onStart, onContextMenu, currentInside, dropHalf, dragEvents, custStyle, iconMode, pulse, pinCount, t }) {
    const iconEl = iconOf(iconMode, sessionsOpen);
    const iconChild = pulse ? E(PulseGlow, { state: pulse }, iconEl || (typeof ui.StateDot === "function" ? E(ui.StateDot, { state: pulse, size: 10 }) : null)) : iconEl;
    return E(
      "div",
      {
        className: cls("bw-row", currentInside && "bw-row-current", dropHalf === "before" && "bw-drop-before", dropHalf === "after" && "bw-drop-after"),
        "data-bw-context": "workspace",
        style: { paddingLeft: 6 + depth * 12, ...custStyle || {}, ...pulse ? { "--bw-pulse-color": PULSE_COLORS[pulse] || PULSE_COLORS.ongoing } : null },
        onClick: onToggle,
        onContextMenu,
        role: "treeitem",
        "aria-expanded": sessionsOpen,
        ...dragEvents || {}
      },
      E("span", { className: cls("bw-chevron", sessionsOpen && "bw-chevron-open") }, icon("IconTriangleRightFill14", 14)),
      E("span", { className: "bw-row-icon" }, iconChild),
      E("span", { className: cls("bw-row-label", pulse && custStyle && custStyle.textShadow && "bw-pulse-text"), title: workspace.title || workspace.leaf }, workspace.leaf),
      pinCount > 0 ? E("span", { className: "bw-pin-ind", "aria-label": t("pinned.header"), title: t("pinned.header") }, E(PinIcon16, { size: 10 }), String(pinCount)) : null,
      count > 0 ? E("span", { className: "bw-row-count" }, String(count)) : null,
      E(
        "span",
        { className: "bw-row-actions", onClick: (e) => e.stopPropagation() },
        E("button", { type: "button", className: "bw-icon-btn", "aria-label": t("session.new"), onClick: (e) => {
          e.stopPropagation();
          onStart();
        } }, icon("IconPlusOutline16"))
      )
    );
  }
  var sessionStateOf = (row, current) => {
    if (!row) return null;
    if (row.pending === "approval" || row.pending === "plan-review" || row.pending === "question") return "warning";
    if (row.running || row.subagents > 0) return "ongoing";
    if (row.completed && current !== true) return "done";
    return null;
  };
  var PULSE_RANK = { warning: 3, ongoing: 2, done: 1 };
  var PULSE_COLORS = { warning: "#d29922", ongoing: "#ff9f45", done: "#3fb950" };
  var pulseRank = (state) => state ? PULSE_RANK[state] || 0 : 0;
  function PulseGlow({ state, children }) {
    return E("span", {
      className: "bw-pulse",
      style: { "--bw-pulse-color": PULSE_COLORS[state] || PULSE_COLORS.ongoing }
    }, children);
  }
  var STATUS_DOT_SIZE = 6;
  function StatusDot({ state, size = STATUS_DOT_SIZE, label, native }) {
    if (native === true && ui && typeof ui.StateDot === "function") {
      return E(ui.StateDot, { state, size: 10 });
    }
    return E("span", {
      className: "bw-state-dot",
      role: label ? "img" : void 0,
      "aria-label": label,
      style: { width: size, height: size, background: PULSE_COLORS[state] }
    });
  }
  var relayStateOf = (row, current) => {
    const s = sessionStateOf(row, current);
    return s === "ongoing" ? null : s;
  };
  function SessionRow({ node, depth, current, onOpen, onContextMenu, now, dropHalf, dragEvents, custStyle, breathing, statusDots, pinned, onTogglePin, onUnarchive, workspaceTag, tagOnHover, tooltip, t }) {
    const state = sessionStateOf(node, current);
    const status = state === null ? null : {
      state,
      title: state === "warning" ? t("status." + (node.pending === "plan-review" ? "planReview" : node.pending)) : state === "ongoing" ? node.running ? t("status.running") : t("status.subagents", { n: node.subagents }) : t("status.completed")
    };
    const hasHoverLabel = tooltip === true;
    const hoverLabel = hasHoverLabel ? () => {
      const meta = [workspaceTag, Number(node.updatedAt) > 0 ? new Date(Number(node.updatedAt)).toLocaleString() : ""].filter(Boolean).join(" \xB7 ");
      const title = node.leaf || node.title;
      return meta !== "" ? title + "\n" + meta : title;
    } : null;
    const tip = useHoverTip({ label: hoverLabel, delayMs: 300, gap: 8, maxWidth: 320 });
    const renderActions = () => {
      let button;
      if (node.archived) {
        button = E("button", {
          type: "button",
          className: "bw-icon-btn",
          disabled: typeof onUnarchive !== "function",
          "aria-label": t("menu.unarchive"),
          title: t("menu.unarchive"),
          onClick: (e) => {
            e.stopPropagation();
            if (onUnarchive) onUnarchive(node.id);
          }
        }, icon("IconArchiveOutline20", 14));
      } else if (typeof onTogglePin === "function") {
        button = E("button", {
          type: "button",
          className: "bw-icon-btn",
          "aria-pressed": pinned ? "true" : "false",
          "aria-label": pinned ? t("menu.unpin") : t("menu.pin"),
          title: pinned ? t("menu.unpin") : t("menu.pin"),
          onClick: (e) => {
            e.stopPropagation();
            onTogglePin(node.id);
          }
        }, E(PinIcon16, null));
      } else return null;
      return E("span", { className: "bw-row-actions", onClick: (e) => e.stopPropagation() }, button);
    };
    const row = E(
      "div",
      {
        className: cls("bw-row", "bw-session-row", node.archived && "bw-session-row-archived", current && "bw-row-current", pinned && "bw-session-row-pinned", workspaceTag && !tagOnHover && "bw-tray-row", dropHalf === "before" && "bw-drop-before", dropHalf === "after" && "bw-drop-after"),
        "data-bw-context": "session",
        ...hasHoverLabel ? tip.attach : null,
        style: { paddingLeft: 8 + depth * 12, ...custStyle || {} },
        // The event carries Shift, which the browser turns into "open a new tab".
        onClick: (event) => onOpen(node.id, event),
        onContextMenu,
        role: "treeitem",
        "aria-current": current || void 0,
        ...dragEvents || {}
      },
      pinned ? E("span", { className: "bw-pin-mark" }, E(PinIcon16, null)) : null,
      E(
        "span",
        { className: "bw-row-icon", title: status ? status.title : void 0 },
        status ? state === "ongoing" ? breathing ? E(PulseGlow, { state: "ongoing" }, E(StatusDot, { state: "ongoing", label: status.title, native: statusDots === false })) : E(StatusDot, { state: "ongoing", label: status.title, native: statusDots === false }) : E(StatusDot, { state: status.state, label: status.title, native: statusDots === false }) : E("span", { className: "bw-dot" })
      ),
      E("span", { className: "bw-row-label" }, node.leaf || node.title),
      node.archived ? E("span", { className: "bw-archive-mark", role: "img", "aria-label": t("session.archived"), title: t("session.archived") }, icon("IconArchiveOutline20", 14)) : null,
      workspaceTag ? renderWsTag(workspaceTag, tagOnHover) : null,
      node.hasActiveSchedule ? E("span", { className: "bw-schedule-badge", role: "img", "aria-label": t("schedule.active"), title: t("schedule.active") }, icon("IconAlarmClockOutline16", 14)) : null,
      E("span", { className: "bw-row-time" }, timeLabel(node.updatedAt, now, t, ui.relativeTime)),
      renderActions(),
      // Out of flow (position:fixed), so it adds no flex item to the row.
      hasHoverLabel ? tip.bubble : null
    );
    return row;
  }
  function SessionGroupRow({ name, depth, expanded, count, onToggle, onContextMenu, dropInto, dragEvents, custStyle, pulse, statusDots, t }) {
    return E(
      "div",
      {
        "data-bw-context": "session-group",
        className: cls("bw-row", "bw-sgroup-row", dropInto && "bw-drop-into"),
        style: { paddingLeft: 10 + depth * 12, ...custStyle || {} },
        onClick: onToggle,
        onContextMenu,
        role: "treeitem",
        "aria-expanded": expanded,
        ...dragEvents || {}
      },
      E("span", { className: cls("bw-chevron", expanded && "bw-chevron-open") }, icon("IconTriangleRightFill14", 14)),
      // Session groups have no icon slot: a collapsed group with hidden
      // status relays through the same breathing dot as the rows inside it.
      pulse ? E(PulseGlow, { state: pulse }, E(StatusDot, { state: pulse, native: statusDots === false })) : null,
      E("span", { className: "bw-row-label" }, name),
      count > 0 ? E("span", { className: "bw-row-count" }, String(count)) : null
    );
  }

  // src/client/browser/model.ts
  function createBrowserModel(input) {
    const {
      normalizedQuery,
      items,
      list,
      archivedSet,
      archivedFilter,
      subCounts,
      pending,
      statuses,
      t,
      sessionSectionOf,
      drag,
      sortOrder,
      viewMode,
      storeFolders,
      compactChains,
      workspaceGroupOf,
      statusPulse,
      expandedMap,
      sessionsExpandedMap,
      sessionGroupsMap
    } = input;
    const currentSessionId = currentSessionIdOf(list);
    const accounted = /* @__PURE__ */ new Set();
    const workspaceIndexOf = /* @__PURE__ */ new Map();
    for (const workspace of items || []) for (const id of workspace.sessionIds || []) {
      accounted.add(id);
      workspaceIndexOf.set(id, workspace.workspaceId);
    }
    const statusOf = (id) => statuses && typeof statuses.get === "function" ? statuses.get(id) : void 0;
    const sessionRowOf = (id) => {
      const summary = list && list.byId ? list.byId[id] : void 0;
      if (!summary || !sessionVisible(summary, currentSessionId, archivedSet, archivedFilter)) return null;
      const status = statusOf(id);
      const workspace = (items || []).find((item) => item.workspaceId === workspaceIndexOf.get(id));
      return {
        id,
        cwd: summary.cwd || workspace && workspace.path || "",
        title: sessionTitleOf(summary, t),
        leaf: sessionTitleOf(summary, t),
        blank: !!summary.blank,
        archived: archivedSet.has(id),
        // The status store wins when present; the list snapshot only carries the
        // older fields (and no live running flag at all).
        running: status && status.running !== void 0 ? status.running === true : !!summary.running,
        completed: status ? status.completionUnread === true : summary.completed === true,
        hasActiveSchedule: hasActiveScheduleOf(summary),
        subagents: subCounts.get(id) || 0,
        updatedAt: summary.updatedAt || 0,
        pending: pendingKindOf(pending, id) || statusPendingKindOf(status)
      };
    };
    const ungrouped = [];
    if (list && Array.isArray(list.ids)) {
      for (const id of list.ids) {
        if (accounted.has(id)) continue;
        const row = sessionRowOf(id);
        if (row) ungrouped.push(row);
      }
      ungrouped.sort((a, b) => b.updatedAt - a.updatedAt);
    }
    const sectionedSessions = (list && list.ids || []).filter((id) => sessionSectionOf(id) !== null).map(sessionRowOf).filter(Boolean);
    const draggingWorkspace = drag !== null && drag.kind === "workspace";
    const workspaceRecency = /* @__PURE__ */ new Map();
    const visibleItems = (items || []).filter((workspace) => {
      const rows = (workspace.sessionIds || []).filter((id) => sessionSectionOf(id) === null).map(sessionRowOf).filter(Boolean);
      workspaceRecency.set(workspace.workspaceId, rows.reduce((latest, row) => Math.max(latest, row.updatedAt), 0));
      return archivedFilter !== "only" || rows.length > 0;
    });
    const recency = sortOrder === "latest" ? workspaceRecency : void 0;
    const projectItems = visibleItems.filter((workspace) => !workspaceGroupOf(workspace.workspaceId));
    const tree = (() => {
      if (viewMode === "workspaces") return buildWorkspaceList(projectItems, recency);
      const built = buildTree(projectItems, archivedFilter === "only" ? [] : storeFolders, recency);
      if (!compactChains || draggingWorkspace) return built;
      return { ...built, folders: built.folders.map((f) => materializeChain(compressTree(f))), workspaces: built.workspaces };
    })();
    const sessionsOf = (workspace, includeSectioned = false) => {
      const rows = [];
      for (const id of workspace.sessionIds || []) {
        if (!includeSectioned && sessionSectionOf(id) !== null) continue;
        const row = sessionRowOf(id);
        if (row) rows.push(row);
      }
      return orderRows(rows, sortOrder);
    };
    const searchAgent = (agent) => {
      if (!normalizedQuery) return agent;
      if (agent.kind === "ws") {
        const ws = agent.workspace;
        const sessions = sessionsOf(ws);
        const wsHit = ws.leaf.toLowerCase().includes(normalizedQuery) || ws.title.toLowerCase().includes(normalizedQuery);
        if (wsHit || sessions.some((s) => s.title.toLowerCase().includes(normalizedQuery))) {
          return { ...agent, node: agent, folders: [], workspaces: [ws] };
        }
        return null;
      }
      const folders = [];
      for (const folder of agent.folders) {
        const hit = searchAgent(folder);
        if (hit) folders.push(hit);
      }
      const workspaces = [];
      for (const workspace of agent.workspaces) {
        const sessions = sessionsOf(workspace);
        const wsHit = workspace.leaf.toLowerCase().includes(normalizedQuery) || workspace.title.toLowerCase().includes(normalizedQuery);
        const matchedSessions = wsHit ? sessions : sessions.filter((s) => s.title.toLowerCase().includes(normalizedQuery));
        if (wsHit || matchedSessions.length > 0) workspaces.push({ workspace, matchedSessions });
      }
      if (folders.length === 0 && workspaces.length === 0) return null;
      return { node: agent, folders, workspaces };
    };
    const searched = normalizedQuery ? searchAgent(tree) : null;
    const searching = normalizedQuery !== "";
    const viewedSessionId = currentSessionId;
    const nodePulseOf = (sessionNode) => {
      let best = null;
      for (const group of sessionNode.groups || []) {
        const s = nodePulseOf(group);
        if (pulseRank(s) > pulseRank(best)) best = s;
      }
      for (const row of sessionNode.sessions || []) {
        const s = relayStateOf(row, viewedSessionId !== null && String(row.id) === viewedSessionId);
        if (pulseRank(s) > pulseRank(best)) best = s;
      }
      return best;
    };
    const wsPulseOf = (workspace) => !statusPulse || searching || sessionsOpenOf(workspace.workspaceId) ? null : nodePulseOf(buildSessionTree(sessionsOf(workspace)));
    const wsAllPulseOf = (workspace) => !statusPulse || searching ? null : nodePulseOf(buildSessionTree(sessionsOf(workspace)));
    const folderPulseOf = (node) => {
      if (node.kind === "ws") return wsAllPulseOf(node.workspace);
      let best = null;
      for (const child of node.folders) {
        const s = folderPulseOf(child);
        if (pulseRank(s) > pulseRank(best)) best = s;
      }
      for (const w of node.workspaces) {
        const s = wsAllPulseOf(w);
        if (pulseRank(s) > pulseRank(best)) best = s;
      }
      return best;
    };
    const folderExpanded = (path) => expandedMap ? expandedMap[path] !== false : true;
    const sessionsOpenOf = (workspaceId) => sessionsExpandedMap ? sessionsExpandedMap[workspaceId] !== false : true;
    const sessionGroupOpen = (key) => sessionGroupsMap ? sessionGroupsMap[key] !== false : true;
    return {
      searching,
      accounted,
      workspaceIndexOf,
      sessionRowOf,
      ungrouped,
      sectionedSessions,
      visibleItems,
      workspaceRecency,
      recency,
      projectItems,
      tree,
      sessionsOf,
      searchAgent,
      searched,
      nodePulseOf,
      wsPulseOf,
      wsAllPulseOf,
      folderPulseOf,
      folderExpanded,
      sessionsOpenOf,
      sessionGroupOpen
    };
  }

  // src/client/browser/dnd.ts
  function createDnd(input) {
    const {
      archivedSet,
      assignSessionSection,
      assignWorkspaceGroup,
      automaticSort,
      drag,
      fail,
      findTreeNode,
      groupedView,
      insertSessionBefore,
      insertWorkspaceBefore,
      items,
      pinnedSet,
      recency,
      renameByUser,
      renameWorkspace,
      searching,
      sessionsOf,
      setDrag,
      tree,
      viewMode,
      visibleItems,
      workspaceGroupOf,
      workspaceGroups,
      wsDragArmTimer
    } = input;
    React.useEffect(() => {
      if (drag === null) return;
      const accept = (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      };
      const acceptDrop = (event) => {
        event.preventDefault();
      };
      document.addEventListener("dragover", accept);
      document.addEventListener("drop", acceptDrop);
      return () => {
        document.removeEventListener("dragover", accept);
        document.removeEventListener("drop", acceptDrop);
      };
    }, [drag === null]);
    const rowHalf = (event) => {
      const rect = event.currentTarget.getBoundingClientRect();
      return event.clientY < rect.top + rect.height / 2 ? "before" : "after";
    };
    const dragMatches = (kind) => drag !== null && drag.kind === kind;
    const canReorderWorkspaces = !automaticSort && groupedView && typeof insertWorkspaceBefore === "function";
    const canMoveWorkspaceGroup = groupedView && workspaceGroups.length > 0;
    const canDragWorkspace = canReorderWorkspaces || canMoveWorkspaceGroup;
    const canReorderSessions = typeof insertSessionBefore === "function";
    const wsDropHalf = (workspaceId) => {
      if (!dragMatches("workspace") || !canReorderWorkspaces) return null;
      const over = drag.over;
      return over && over.kind === "workspace" && over.target === workspaceId ? over.half : null;
    };
    const wsDropInto = (path) => dragMatches("workspace") && drag.over && drag.over.kind === "folder" && drag.over.target === path;
    const workspaceDragEvents = (workspace) => ({
      draggable: !searching && canDragWorkspace,
      onDragStart: (event) => {
        if (searching || !canDragWorkspace) return;
        event.stopPropagation();
        try {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", workspace.workspaceId);
        } catch {
        }
        const segs = splitTitleSegs(workspace.title);
        const sourceLeaf = segs.length > 0 ? segs[segs.length - 1] : workspace.leaf || String(workspace.workspaceId);
        const sourceFolder = segs.length > 1 ? segs.slice(0, -1).join("/") : "";
        if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current);
        wsDragArmTimer.current = setTimeout(() => {
          wsDragArmTimer.current = null;
          setDrag({ kind: "workspace", source: { workspaceId: workspace.workspaceId, leaf: sourceLeaf, folderPath: sourceFolder }, over: null });
        }, 0);
      },
      onDragEnd: () => {
        if (wsDragArmTimer.current !== null) {
          clearTimeout(wsDragArmTimer.current);
          wsDragArmTimer.current = null;
        }
        setDrag(null);
      },
      onDragOver: (event) => {
        if (!dragMatches("workspace") || !canDragWorkspace || searching) return;
        if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        const half = rowHalf(event);
        setDrag((current) => current && current.over && current.over.kind === "workspace" && current.over.target === workspace.workspaceId && current.over.half === half ? current : current ? { ...current, over: { kind: "workspace", target: workspace.workspaceId, half } } : current);
      },
      onDrop: (event) => {
        if (!dragMatches("workspace") || !canDragWorkspace || searching) return;
        if (!canReorderWorkspaces && workspaceGroupOf(drag.source.workspaceId) === workspaceGroupOf(workspace.workspaceId)) return;
        event.preventDefault();
        event.stopPropagation();
        const half = drag.over && drag.over.kind === "workspace" && drag.over.target === workspace.workspaceId ? drag.over.half : rowHalf(event);
        commitWorkspaceDrop(workspace, half);
      }
    });
    const folderDropEvents = (path) => ({
      onDragOver: (event) => {
        if (!dragMatches("workspace") || !canReorderWorkspaces || searching || workspaceGroupOf(drag.source.workspaceId)) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        setDrag((current) => current && current.over && current.over.kind === "folder" && current.over.target === path ? current : current ? { ...current, over: { kind: "folder", target: path } } : current);
      },
      onDrop: (event) => {
        if (!dragMatches("workspace") || !canReorderWorkspaces || searching || workspaceGroupOf(drag.source.workspaceId)) return;
        event.preventDefault();
        event.stopPropagation();
        commitWorkspaceMoveInto(path);
      }
    });
    const nextWorkspaceAfter = (folderPath, workspaceId) => {
      const groupId = workspaceGroupOf(workspaceId);
      if (groupId) {
        const rows = buildWorkspaceList(visibleItems.filter((workspace) => workspaceGroupOf(workspace.workspaceId) === groupId), recency).workspaces;
        const index2 = rows.findIndex((workspace) => workspace.workspaceId === workspaceId);
        return rows[index2 + 1] && rows[index2 + 1].workspaceId;
      }
      if (viewMode === "workspaces") {
        const index2 = tree.workspaces.findIndex((workspace) => workspace.workspaceId === workspaceId);
        return tree.workspaces[index2 + 1] && tree.workspaces[index2 + 1].workspaceId;
      }
      const node = findTreeNode(tree, folderPath);
      if (!node) return void 0;
      const index = node.workspaces.findIndex((w) => w.workspaceId === workspaceId);
      return index === -1 ? void 0 : node.workspaces[index + 1] ? node.workspaces[index + 1].workspaceId : void 0;
    };
    const commitWorkspaceDrop = (targetWorkspace, half) => {
      if (!drag || !canDragWorkspace || searching) {
        setDrag(null);
        return;
      }
      const source = drag.source;
      setDrag(null);
      if (source.workspaceId === targetWorkspace.workspaceId) return;
      const sourceGroup = workspaceGroupOf(source.workspaceId);
      const targetGroup = workspaceGroupOf(targetWorkspace.workspaceId);
      const anchor = half === "after" ? nextWorkspaceAfter(targetWorkspace.folderPath || "", targetWorkspace.workspaceId) : targetWorkspace.workspaceId;
      if (sourceGroup !== targetGroup) assignWorkspaceGroup(source.workspaceId, targetGroup);
      if (!canReorderWorkspaces) return;
      const sameFolder = sourceGroup !== targetGroup || !!targetGroup || viewMode === "workspaces" || (targetWorkspace.folderPath || "") === source.folderPath;
      const chain = sameFolder ? Promise.resolve() : Promise.resolve().then(() => {
        const newTitle = (targetWorkspace.folderPath || "") !== "" ? (targetWorkspace.folderPath || "") + "/" + source.leaf : source.leaf;
        return renameWorkspace(source.workspaceId, newTitle);
      });
      chain.then(() => anchor !== void 0 ? insertWorkspaceBefore(source.workspaceId, anchor) : insertWorkspaceBefore(source.workspaceId)).catch(fail);
    };
    const commitWorkspaceMoveInto = (folderPath) => {
      if (!drag || !canReorderWorkspaces || searching || viewMode !== "projects" || workspaceGroupOf(drag.source.workspaceId)) {
        setDrag(null);
        return;
      }
      const source = drag.source;
      setDrag(null);
      if (source.folderPath === folderPath) return;
      const newTitle = folderPath !== "" ? folderPath + "/" + source.leaf : source.leaf;
      Promise.resolve().then(() => renameWorkspace(source.workspaceId, newTitle)).then(() => insertWorkspaceBefore(source.workspaceId)).catch(fail);
    };
    const workspaceGroupDropEvents = (groupId) => ({
      onDragOver: (event) => {
        if (!dragMatches("workspace") && !dragMatches("session") || !canMoveWorkspaceGroup || searching) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        setDrag((current) => {
          if (!current || current.over && current.over.kind === "wgroup" && current.over.target === groupId) return current;
          return { ...current, over: { kind: "wgroup", target: groupId } };
        });
      },
      onDrop: (event) => {
        if (!dragMatches("workspace") && !dragMatches("session") || !canMoveWorkspaceGroup || searching) return;
        event.preventDefault();
        event.stopPropagation();
        if (drag.kind === "session") assignSessionSection(drag.source.sessionId, groupId);
        else assignWorkspaceGroup(drag.source.workspaceId, groupId);
        setDrag(null);
      }
    });
    const sessDropHalf = (sessionId) => {
      if (!dragMatches("session") || drag.source.sectioned || automaticSort || !groupedView) return null;
      const over = drag.over;
      return over && over.kind === "session" && over.target === sessionId ? over.half : null;
    };
    const sgroupDropInto = (workspaceId, path) => !automaticSort && dragMatches("session") && !drag.source.sectioned && drag.source.workspaceId === workspaceId && drag.over && drag.over.kind === "sgroup" && drag.over.target === path;
    const sessionDraggable = (session) => {
      if (searching || !groupedView || session.blank) return false;
      if (workspaceGroups.length > 0) return true;
      return !automaticSort && !session.archived && !pinnedSet.has(session.id);
    };
    const sessionDragEvents = (session, workspaceId, sectioned = false) => ({
      draggable: sessionDraggable(session),
      onDragStart: (event) => {
        if (searching || !sessionDraggable(session)) return;
        event.stopPropagation();
        try {
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", session.id);
        } catch {
        }
        setDrag({ kind: "session", source: { sessionId: session.id, workspaceId, sectioned, title: session.title, leaf: session.leaf || session.title }, over: null });
      },
      onDragEnd: () => setDrag(null),
      onDragOver: (event) => {
        if (!dragMatches("session") || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView || searching || drag.source.workspaceId !== workspaceId || session.archived || archivedSet.has(drag.source.sessionId) || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        const half = rowHalf(event);
        setDrag((current) => current && current.over && current.over.kind === "session" && current.over.target === session.id && current.over.half === half ? current : current ? { ...current, over: { kind: "session", target: session.id, half } } : current);
      },
      onDrop: (event) => {
        if (!dragMatches("session") || drag.source.sectioned || sectioned || !canReorderSessions || automaticSort || !groupedView || searching || drag.source.workspaceId !== workspaceId || session.archived || archivedSet.has(drag.source.sessionId) || pinnedSet.has(session.id) || pinnedSet.has(drag.source.sessionId)) return;
        event.preventDefault();
        event.stopPropagation();
        const half = drag.over && drag.over.kind === "session" && drag.over.target === session.id ? drag.over.half : rowHalf(event);
        commitSessionDrop(workspaceId, session.id, half);
      }
    });
    const sgroupDropEvents = (workspaceId, path) => ({
      onDragOver: (event) => {
        if (!dragMatches("session") || drag.source.sectioned || automaticSort || !groupedView || searching || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return;
        event.preventDefault();
        event.stopPropagation();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        setDrag((current) => current && current.over && current.over.kind === "sgroup" && current.over.target === path ? current : current ? { ...current, over: { kind: "sgroup", target: path } } : current);
      },
      onDrop: (event) => {
        if (!dragMatches("session") || drag.source.sectioned || automaticSort || !groupedView || searching || archivedSet.has(drag.source.sessionId) || drag.source.workspaceId !== workspaceId) return;
        event.preventDefault();
        event.stopPropagation();
        commitSessionMoveInto(workspaceId, path);
      }
    });
    const commitSessionDrop = (workspaceId, targetSessionId, half) => {
      if (!drag) return;
      const source = drag.source;
      setDrag(null);
      if (!canReorderSessions || automaticSort || !groupedView || searching) return;
      if (archivedSet.has(source.sessionId) || archivedSet.has(targetSessionId)) return;
      if (pinnedSet.has(source.sessionId) || pinnedSet.has(targetSessionId)) return;
      if (source.sessionId === targetSessionId) return;
      const workspace = (items || []).find((w) => w.workspaceId === workspaceId);
      if (!workspace) return;
      const flat = sessionsOf(workspace);
      const index = flat.findIndex((s) => s.id === targetSessionId);
      const anchor = half === "after" ? index === -1 ? void 0 : flat[index + 1] ? flat[index + 1].id : void 0 : targetSessionId;
      Promise.resolve().then(() => anchor !== void 0 ? insertSessionBefore(workspaceId, source.sessionId, anchor) : insertSessionBefore(workspaceId, source.sessionId)).catch(fail);
    };
    const commitSessionMoveInto = (workspaceId, groupPath) => {
      if (!drag || automaticSort || !groupedView || searching || archivedSet.has(drag.source.sessionId)) {
        setDrag(null);
        return;
      }
      const source = drag.source;
      setDrag(null);
      const newTitle = groupPath !== "" ? groupPath + "/" + source.leaf : source.leaf;
      if (newTitle === source.title) return;
      Promise.resolve().then(() => renameByUser(source.sessionId, newTitle)).catch(fail);
    };
    return { canDragWorkspace, canMoveWorkspaceGroup, canReorderSessions, canReorderWorkspaces, commitSessionDrop, commitSessionMoveInto, commitWorkspaceDrop, commitWorkspaceMoveInto, dragMatches, folderDropEvents, nextWorkspaceAfter, rowHalf, sessDropHalf, sessionDragEvents, sessionDraggable, sgroupDropEvents, sgroupDropInto, workspaceDragEvents, workspaceGroupDropEvents, wsDropHalf, wsDropInto };
  }
  function useTabReorder({ onReorder }) {
    const [dragId, setDragId] = React.useState(null);
    const [overId, setOverId] = React.useState(null);
    const lastOverRef = React.useRef(null);
    React.useEffect(() => {
      if (dragId === null) return void 0;
      const accept = (event) => {
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = "move";
      };
      const acceptDrop = (event) => {
        event.preventDefault();
      };
      document.addEventListener("dragover", accept);
      document.addEventListener("drop", acceptDrop);
      return () => {
        document.removeEventListener("dragover", accept);
        document.removeEventListener("drop", acceptDrop);
      };
    }, [dragId === null]);
    const eventsFor = (id) => ({
      draggable: true,
      onDragStart: (event) => {
        lastOverRef.current = null;
        setDragId(id);
        try {
          event.dataTransfer.setData("text/plain", id);
          event.dataTransfer.effectAllowed = "move";
        } catch {
        }
      },
      onDragOver: (event) => {
        if (!dragId || dragId === id) return;
        event.preventDefault();
        try {
          event.dataTransfer.dropEffect = "move";
        } catch {
        }
        if (lastOverRef.current === id) return;
        lastOverRef.current = id;
        setOverId(id);
        if (typeof onReorder === "function") onReorder(dragId, id);
      },
      onDragLeave: () => {
        if (lastOverRef.current === id) lastOverRef.current = null;
        setOverId((current) => current === id ? null : current);
      },
      onDrop: (event) => {
        event.preventDefault();
        lastOverRef.current = null;
        setDragId(null);
        setOverId(null);
      },
      onDragEnd: () => {
        lastOverRef.current = null;
        setDragId(null);
        setOverId(null);
      }
    });
    return { draggingId: dragId, overId, eventsFor };
  }

  // src/client/browser/actions.ts
  function createActions(input) {
    const {
      actions,
      deleteAvailable,
      deleteSession,
      deleteWorkspace,
      deletingRef,
      fail,
      items,
      list,
      pinnedList,
      refreshSessions,
      renameByUser,
      renameWorkspace,
      sessionsOf,
      setDeleting,
      setDialog,
      setErrorText,
      setNotice,
      storeFolders,
      t,
      tree,
      workspaceGroupIds,
      workspaceGroupOf,
      workspaceGroups,
      workspaceIndexOf
    } = input;
    const assignWorkspaceGroup = (workspaceId, groupId) => {
      const workspace = (items || []).find((workspace2) => workspace2.workspaceId === workspaceId);
      if (!workspace) return;
      if (groupId && !workspaceGroupIds.has(groupId)) return;
      actions.assignWorkspaceGroup(workspaceId, groupId);
      for (const sessionId of workspace.sessionIds || []) actions.assignSessionSection(sessionId, null);
      if (groupId) actions.setExpanded("workspace-group:" + groupId, true);
    };
    const assignSessionSection = (sessionId, groupId) => {
      if (!list || !list.byId || !list.byId[sessionId]) return;
      if (groupId && !workspaceGroupIds.has(groupId)) return;
      actions.assignSessionSection(sessionId, groupId);
      if (groupId) actions.setExpanded("workspace-group:" + groupId, true);
      if (groupId === null) {
        const workspaceId = workspaceIndexOf.get(sessionId);
        const workspaceGroup = workspaceGroupOf(workspaceId);
        if (workspaceGroup) actions.setExpanded("workspace-group:" + workspaceGroup, true);
        if (workspaceId) actions.setSessionsExpanded(workspaceId, true);
      }
    };
    const submitWorkspaceGroup = (target, rawName) => {
      const name = String(rawName || "").trim();
      if (!name) {
        setErrorText(t("wgroup.error.empty"));
        return;
      }
      if (workspaceGroups.some((group) => group.id !== target.groupId && group.name.toLocaleLowerCase() === name.toLocaleLowerCase())) {
        setErrorText(t("wgroup.error.exists"));
        return;
      }
      if (target.groupId) actions.renameWorkspaceGroup(target.groupId, name);
      else {
        const groupId = crypto.randomUUID();
        const workspaceId = (items || []).some((workspace) => workspace.workspaceId === target.workspaceId) ? target.workspaceId : void 0;
        actions.createWorkspaceGroup(groupId, name, workspaceId);
        if (workspaceId) {
          const workspace = (items || []).find((workspace2) => workspace2.workspaceId === workspaceId);
          for (const sessionId of workspace.sessionIds || []) actions.assignSessionSection(sessionId, null);
        }
        if (target.sessionId && list && list.byId && list.byId[target.sessionId]) actions.assignSessionSection(target.sessionId, groupId);
        actions.setExpanded("workspace-group:" + groupId, true);
      }
      setDialog(null);
    };
    const submitWorkspaceRename = (workspace, nextTitle) => {
      const title = String(nextTitle || "").trim();
      if (title === "" || title === workspace.title) {
        setDialog(null);
        return;
      }
      Promise.resolve().then(() => renameWorkspace(workspace.workspaceId, title)).then(() => setDialog(null)).catch(fail);
    };
    const submitWorkspaceDelete = (workspace) => {
      Promise.resolve().then(() => deleteWorkspace(workspace.workspaceId)).then(() => setDialog(null)).catch(fail);
    };
    const submitSessionRename = (session, nextTitle) => {
      const title = String(nextTitle || "").trim();
      if (title === "" || title === session.title) {
        setDialog(null);
        return;
      }
      Promise.resolve().then(() => renameByUser(session.id, title)).then(() => setDialog(null)).catch(fail);
    };
    const submitSessionDelete = async (session) => {
      if (deletingRef.current || !deleteAvailable || typeof deleteSession !== "function" || session.blank) return;
      deletingRef.current = true;
      setDeleting(true);
      try {
        const result = await deleteSession(session.id);
        actions.assignSessionSection(session.id, null);
        if (pinnedList.includes(session.id)) actions.togglePin(session.id);
        setDialog(null);
        setNotice(t("session.delete.done"));
        try {
          if (typeof refreshSessions === "function") await refreshSessions();
        } catch (error) {
          setErrorText(t("session.delete.cleanupWarning") + "\n" + messageOf(error));
        }
        if (result && Array.isArray(result.warnings) && result.warnings.length > 0) setErrorText(t("session.delete.cleanupWarning"));
      } catch (error) {
        fail(t("session.delete.failed", { reason: messageOf(error) }));
      } finally {
        deletingRef.current = false;
        setDeleting(false);
      }
    };
    const copySessionText = async (text, successKey) => {
      try {
        if (!await writeClipboardText(text, ui.writeClipboard)) throw new Error(t("copy.failed"));
        setNotice(t(successKey));
      } catch (error) {
        fail(messageOf(error));
      }
    };
    const submitSessionGroupRename = (target, rawName) => {
      const name = normPath(rawName);
      if (name === "") {
        setErrorText(t("folder.error.empty"));
        return;
      }
      if (name === target.name) {
        setDialog(null);
        return;
      }
      const workspace = (items || []).find((w) => w.workspaceId === target.workspaceId);
      if (!workspace) {
        setDialog(null);
        return;
      }
      const node = findSessionGroup(buildSessionTree(sessionsOf(workspace)), target.path);
      if (!node) {
        setDialog(null);
        return;
      }
      const parentPath = target.path.includes("/") ? target.path.slice(0, target.path.lastIndexOf("/")) : "";
      const nextPath = parentPath !== "" ? parentPath + "/" + name : name;
      const affected = collectSessionRows(node);
      Promise.resolve().then(async () => {
        for (const row of affected) {
          if (row.blank) continue;
          const nextTitle = nextPath + row.title.slice(target.path.length);
          await renameByUser(row.id, nextTitle);
        }
      }).then(() => setDialog(null)).catch(fail);
    };
    const findTreeNode = (node, path) => {
      if (node.path === path) return node;
      for (const folder of node.folders) {
        const hit = findTreeNode(folder, path);
        if (hit) return hit;
      }
      return null;
    };
    const submitFolderNew = (parentPath, rawPath) => {
      const parent = normPath(parentPath);
      const sub = normPath(rawPath);
      if (sub === "") {
        setErrorText(t("folder.error.empty"));
        return;
      }
      const p = parent !== "" ? parent + "/" + sub : sub;
      const derived = /* @__PURE__ */ new Set();
      for (const w of items || []) {
        const segs = splitTitleSegs(w.title);
        for (let i = 1; i < segs.length; i++) derived.add(segs.slice(0, i).join("/"));
      }
      if (storeFolders.includes(p) || derived.has(p)) {
        setErrorText(t("folder.error.exists"));
        return;
      }
      actions.addFolder(p);
      setDialog(null);
    };
    const submitFolderRename = (oldPath, rawPath) => {
      const newPath = normPath(rawPath);
      if (newPath === "") {
        setErrorText(t("folder.error.empty"));
        return;
      }
      if (newPath === oldPath) {
        setDialog(null);
        return;
      }
      const node = findTreeNode(tree, oldPath);
      const hasChildren = node ? countWorkspaces(node) > 0 : false;
      const prefix = oldPath + "/";
      const affected = hasChildren ? (items || []).filter((w) => !workspaceGroupOf(w.workspaceId) && String(w.title || "").startsWith(prefix)) : [];
      Promise.resolve().then(async () => {
        for (const w of affected) {
          const nextTitle = newPath + String(w.title).slice(oldPath.length);
          await renameWorkspace(w.workspaceId, nextTitle);
        }
      }).then(() => {
        actions.renameFolder(oldPath, newPath);
        setDialog(null);
      }).catch(fail);
    };
    const submitFolderDelete = (path) => {
      const node = findTreeNode(tree, path);
      if (node && countWorkspaces(node) > 0) {
        setErrorText(t("folder.error.notEmpty"));
        return;
      }
      actions.removeFolder(path);
      setDialog(null);
    };
    return { assignSessionSection, assignWorkspaceGroup, copySessionText, findTreeNode, submitFolderDelete, submitFolderNew, submitFolderRename, submitSessionDelete, submitSessionGroupRename, submitSessionRename, submitWorkspaceDelete, submitWorkspaceGroup, submitWorkspaceRename };
  }

  // src/client/tabs.ts
  var MAX_TABS = 12;
  var STORAGE_KEY = "dsh.betterWorkspace.tabs.v1";
  var tabIdOf = (value) => value === void 0 || value === null ? "" : String(value);
  function normalizeTabs(value) {
    const list = [];
    const seen = /* @__PURE__ */ new Set();
    for (const entry of Array.isArray(value) ? value : []) {
      const id = tabIdOf(entry);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      list.push(id);
      if (list.length >= MAX_TABS) break;
    }
    return list;
  }
  function openTab(tabs, sessionId) {
    const id = tabIdOf(sessionId);
    const list = normalizeTabs(tabs);
    if (!id || list.includes(id)) return list;
    list.push(id);
    return list.length > MAX_TABS ? list.slice(list.length - MAX_TABS) : list;
  }
  function replaceTab(tabs, previousId, nextId) {
    const prev = tabIdOf(previousId);
    const next = tabIdOf(nextId);
    const list = normalizeTabs(tabs);
    if (!next) return list;
    if (!list.length) return [next];
    const at = prev ? list.indexOf(prev) : -1;
    if (at < 0) return list.includes(next) ? list : openTab(list, next);
    if (list.includes(next)) return list.filter((id) => id !== prev);
    const copy = list.slice();
    copy[at] = next;
    return copy;
  }
  function reconcileTabs(tabs, currentId, previousId, options = {}) {
    const current = tabIdOf(currentId);
    if (!current) return normalizeTabs(tabs);
    const isBlank = typeof options.isBlank === "function" ? options.isBlank : () => false;
    const isArchived = typeof options.isArchived === "function" ? options.isArchived : () => false;
    const kept = normalizeTabs(tabs).filter((id) => id === current || !isBlank(id) && !isArchived(id));
    if (kept.includes(current)) return kept;
    return isBlank(current) ? openTab(kept, current) : replaceTab(kept, previousId, current);
  }
  function moveTab(tabs, fromId, toId) {
    const from = tabIdOf(fromId);
    const to = tabIdOf(toId);
    const list = normalizeTabs(tabs);
    const at = list.indexOf(from);
    const target = list.indexOf(to);
    if (at < 0 || target < 0 || at === target) return list;
    const copy = list.slice();
    const [moved] = copy.splice(at, 1);
    copy.splice(Math.min(target, copy.length), 0, moved);
    return copy;
  }
  function closeTab(tabs, sessionId, activeSessionId) {
    const id = tabIdOf(sessionId);
    const list = normalizeTabs(tabs);
    const at = list.indexOf(id);
    if (at < 0) return { tabs: list, next: null };
    const rest = list.filter((entry) => entry !== id);
    const wasActive = tabIdOf(activeSessionId) === id;
    const next = wasActive ? rest[Math.min(at, rest.length - 1)] || null : null;
    return { tabs: rest, next };
  }
  function loadTabs() {
    try {
      const raw = globalThis.localStorage ? globalThis.localStorage.getItem(STORAGE_KEY) : null;
      return raw ? normalizeTabs(JSON.parse(raw)) : [];
    } catch {
      return [];
    }
  }
  var tabList = loadTabs();
  var activeTab = null;
  var listeners = /* @__PURE__ */ new Set();
  function tabsSnapshot() {
    return tabList.slice();
  }
  function tabsActive() {
    return activeTab;
  }
  function setActiveTab(value) {
    const next = tabIdOf(value) || null;
    if (next === activeTab) return activeTab;
    activeTab = next;
    for (const listener of [...listeners]) {
      try {
        listener();
      } catch {
      }
    }
    return activeTab;
  }
  function saveTabs(value) {
    const next = normalizeTabs(value);
    const same = next.length === tabList.length && next.every((id, index) => id === tabList[index]);
    tabList = next;
    if (!same) {
      try {
        if (globalThis.localStorage) globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
      }
      for (const listener of [...listeners]) {
        try {
          listener();
        } catch {
        }
      }
    }
    return tabList.slice();
  }
  function subscribeTabs(listener) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }

  // src/client/browser/tree-view.ts
  function createTreeView(input) {
    const {
      actions,
      tabs,
      archivedFilter,
      canMoveWorkspaceGroup,
      drag,
      expandedMap,
      fail,
      folderDropEvents,
      folderExpanded,
      folderPulseOf,
      groupedView,
      items,
      list,
      nodePulseOf,
      normalizedQuery,
      now,
      open,
      openCtx,
      phase,
      pinnedList,
      pinnedSet,
      projectItems,
      recency,
      rowStyleOf,
      searchAgent,
      searched,
      searching,
      sectionedSessions,
      sessDropHalf,
      sessionDragEvents,
      sessionDraggable,
      sessionGroupOpen,
      sessionRowOf,
      sessionSectionOf,
      sessionsOf,
      sessionsOpenOf,
      setErrorText,
      sgroupDropEvents,
      sgroupDropInto,
      sortOrder,
      startSession,
      statusPulse,
      statusDots,
      styleEntry,
      t,
      timeDirection,
      timeSorted,
      tree,
      unarchiveSession,
      ungrouped,
      viewMode,
      visibleItems,
      workspaceDragEvents,
      workspaceGroupDropEvents,
      workspaceGroupOf,
      workspaceGroups,
      workspaceIndexOf,
      workspaceTitleOf,
      wsDropHalf,
      wsDropInto,
      wsPulseOf
    } = input;
    const currentSessionId = currentSessionIdOf(list);
    const matchesSession = (row) => {
      if (!searching) return true;
      const workspaceId = workspaceIndexOf.get(row.id);
      const workspace = (items || []).find((item) => item.workspaceId === workspaceId);
      const sectionId = sessionSectionOf(row.id);
      const groupId = sectionId === null ? workspaceGroupOf(workspaceId) : sectionId;
      const group = workspaceGroups.find((group2) => group2.id === groupId);
      return (row.title + " " + (workspace ? workspace.title : "") + " " + (group ? group.name : "")).toLowerCase().includes(normalizedQuery);
    };
    const renderSessionTree = (workspace, depth) => {
      if (!searching && !sessionsOpenOf(workspace.workspaceId)) return [];
      const rows = sessionsOf(workspace);
      if (rows.length === 0) return [];
      const unpinned = rows.filter((r) => !pinnedSet.has(r.id));
      if (unpinned.length === 0) return [];
      return renderSessionNode(buildSessionTree(unpinned, sortOrder), workspace.workspaceId, depth);
    };
    const renderTimeBuckets = (rows, workspaceId, depth) => {
      const buckets = /* @__PURE__ */ new Map();
      for (const key of BUCKET_ORDER) buckets.set(key, []);
      for (const r of rows) buckets.get(bucketOf(r.updatedAt, now)).push(r);
      const direction = timeDirection === "oldest" ? 1 : -1;
      const prefix = workspaceId || "timeline";
      const out = [];
      const bucketKeys = timeDirection === "oldest" ? BUCKET_ORDER.slice().reverse() : BUCKET_ORDER;
      for (const key of bucketKeys) {
        const bucketRows = buckets.get(key);
        if (bucketRows.length === 0) continue;
        out.push(E("div", { key: "bucket-" + prefix + "-" + key, className: "bw-bucket-header" }, t("bucket." + key)));
        const sorted = bucketRows.slice().sort((a, b) => direction * (a.updatedAt - b.updatedAt));
        for (const s of sorted) out.push(renderSessionRow(s, depth, null, { workspaceTag: s.workspaceTag, tagOnHover: true, tooltip: true }));
      }
      return out;
    };
    const searchSessionNode = (node) => {
      const groups = [];
      for (const group of node.groups) {
        const hit = searchSessionNode(group);
        if (hit) groups.push(hit);
      }
      const sessions = node.sessions.filter((row) => matchesSession(row));
      if (groups.length === 0 && sessions.length === 0) return null;
      return { path: node.path, name: node.name, groups, sessions };
    };
    const renderSessionNode = (node, workspaceId, depth) => {
      const view = searching ? searchSessionNode(node) : node;
      if (!view) return [];
      const out = [];
      for (const group of view.groups) {
        const key = workspaceId + "|" + group.path;
        const open2 = searching || sessionGroupOpen(key);
        out.push(E(SessionGroupRow, {
          key: "sg-" + key,
          name: group.name,
          depth,
          expanded: open2,
          pulse: statusPulse && !open2 ? nodePulseOf(group) : null,
          count: countSessionTree(group),
          onToggle: () => {
            if (!searching) actions.setSessionGroupExpanded(key, !open2);
          },
          onContextMenu: (e) => openCtx("sgroup", { workspaceId, path: group.path, name: group.name }, e),
          dropInto: sgroupDropInto(workspaceId, group.path),
          dragEvents: sgroupDropEvents(workspaceId, group.path),
          custStyle: rowStyleOf("sgroup:" + workspaceId + "|" + group.path),
          statusDots,
          t
        }));
        if (open2) out.push(...renderSessionNode(group, workspaceId, depth + 1));
      }
      for (const s of view.sessions) out.push(renderSessionRow(s, depth, workspaceId));
      return out;
    };
    const restoreSession = (id) => {
      if (typeof unarchiveSession !== "function") return;
      Promise.resolve().then(() => unarchiveSession(id)).catch(fail);
    };
    const renderSessionRow = (session, depth, workspaceId, opts) => {
      const o = opts || {};
      const pinned = o.pinned === true || pinnedSet.has(session.id);
      const togglePin = typeof actions.togglePin === "function" ? (id) => actions.togglePin(id) : void 0;
      const inTray = o.inTray === true;
      return E(SessionRow, {
        key: String(session.id) + (inTray ? "-tray" : ""),
        node: session,
        depth,
        // Ids compare as strings so the row and the collapse relay (model.js)
        // agree on which session is on screen whatever the host hands over.
        current: currentSessionId !== null && currentSessionId === String(session.id),
        now,
        onOpen: (id, event) => {
          if (session.archived) {
            setErrorText(t("session.archivedHint"));
            return;
          }
          const newTab = !!(event && event.shiftKey);
          const active = tabsActive();
          saveTabs(newTab ? openTab(tabsSnapshot(), id) : replaceTab(tabsSnapshot(), active, id));
          setActiveTab(id);
          open(id);
        },
        onContextMenu: (e) => openCtx("session", session, e),
        dropHalf: workspaceId && !pinned && !o.sectioned ? sessDropHalf(session.id) : null,
        dragEvents: sessionDraggable(session) && (canMoveWorkspaceGroup || workspaceId && !o.sectioned) ? sessionDragEvents(session, workspaceId, o.sectioned === true) : void 0,
        custStyle: rowStyleOf("session:" + session.id),
        breathing: statusPulse,
        statusDots,
        pinned,
        onTogglePin: session.archived ? void 0 : togglePin,
        onUnarchive: typeof unarchiveSession === "function" ? restoreSession : void 0,
        workspaceTag: o.workspaceTag,
        tagOnHover: o.tagOnHover === true,
        tooltip: o.tooltip === true,
        t
      });
    };
    const renderWorkspaceEntry = (entry, depth, pulse) => {
      const { workspace } = entry;
      const wsRows = sessionsOf(workspace);
      const count = countSessionTree(buildSessionTree(wsRows));
      const pinCount = wsRows.reduce((n, s) => n + (pinnedSet.has(s.id) ? 1 : 0), 0);
      const rows = [E(WorkspaceRow, {
        key: "ws-" + workspace.workspaceId,
        workspace,
        depth,
        count,
        pinCount,
        sessionsOpen: searching ? true : sessionsOpenOf(workspace.workspaceId),
        currentInside: !!(currentSessionId !== null && (workspace.sessionIds || []).includes(currentSessionId)),
        onToggle: () => {
          if (!searching) actions.setSessionsExpanded(workspace.workspaceId, !sessionsOpenOf(workspace.workspaceId));
        },
        // Starting a session force-expands the workspace row: the user must
        // SEE the new session appear, even if the row was collapsed.
        onStart: () => {
          actions.setSessionsExpanded(workspace.workspaceId, true);
          startSession(workspace.workspaceId);
        },
        onContextMenu: (e) => openCtx("workspace", workspace, e),
        dropHalf: wsDropHalf(workspace.workspaceId),
        dragEvents: workspaceDragEvents(workspace),
        custStyle: rowStyleOf("workspace:" + workspace.workspaceId),
        iconMode: (styleEntry("workspace:" + workspace.workspaceId) || {}).icon || "solid",
        pulse,
        t
      })];
      rows.push(...renderSessionTree(workspace, depth + 1));
      return rows;
    };
    const renderPlainFolder = (node, depth) => {
      if (node.kind === "ws") return renderWorkspaceEntry({ workspace: node.workspace }, depth, wsPulseOf(node.workspace));
      const expanded = searching || folderExpanded(node.path);
      const rows = [E(FolderRow, {
        key: "f-" + node.path,
        node,
        depth,
        expanded,
        onToggle: () => {
          if (!searching) actions.setExpanded(node.path, !expanded);
        },
        onContextMenu: (e) => openCtx("folder", { path: node.path, name: node.name }, e),
        dropInto: wsDropInto(node.path),
        dragEvents: folderDropEvents(node.path),
        custStyle: rowStyleOf("folder:" + node.path),
        iconMode: (styleEntry("folder:" + node.path) || {}).icon || "solid",
        pulse: expanded ? null : folderPulseOf(node),
        t
      })];
      if (expanded) {
        for (const child of node.folders) rows.push(...renderPlainFolder(child, depth + 1));
        for (const workspace of node.workspaces) rows.push(...renderWorkspaceEntry({ workspace }, depth + 1, wsPulseOf(workspace)));
      }
      return rows;
    };
    const renderSearchedFolder = (hit, depth) => {
      if (hit.kind === "ws") return renderWorkspaceEntry({ workspace: hit.workspace }, depth);
      const node = hit.node;
      const rows = [E(FolderRow, {
        key: "f-" + node.path,
        node,
        depth,
        expanded: true,
        onToggle: () => {
        },
        onContextMenu: (e) => openCtx("folder", { path: node.path, name: node.name }, e),
        dropInto: false,
        dragEvents: void 0,
        custStyle: rowStyleOf("folder:" + node.path),
        iconMode: (styleEntry("folder:" + node.path) || {}).icon || "solid",
        t
      })];
      for (const child of hit.folders) rows.push(...renderSearchedFolder(child, depth + 1));
      for (const entry of hit.workspaces) rows.push(...renderWorkspaceEntry(entry, depth + 1));
      return rows;
    };
    const renderPinnedSection = (rows) => E(
      "div",
      { key: "pinned-section", className: "bw-pinned-section" },
      E(
        "div",
        { className: "bw-pinned-header" },
        E("span", { className: "bw-pin-mark" }, E(PinIcon16, { size: 11 })),
        E("span", null, t("pinned.header")),
        E("span", { className: "bw-row-count" }, String(rows.length))
      ),
      rows.map((s) => renderSessionRow(s, 0, workspaceIndexOf.get(s.id) || void 0, { pinned: true, inTray: true, workspaceTag: s.workspaceTag }))
    );
    const pinnedTray = [];
    if (Array.isArray(pinnedList) && pinnedList.length > 0 && list) {
      for (const rawId of pinnedList) {
        const id = String(rawId);
        const row = sessionRowOf(id);
        if (!row || row.archived) continue;
        if (!matchesSession(row)) continue;
        const wsId = workspaceIndexOf.get(id);
        row.workspaceTag = wsId !== void 0 ? workspaceTitleOf(wsId) : "";
        pinnedTray.push(row);
      }
    }
    const sectionRowsOf = (groupId) => orderRows(sectionedSessions.filter((row) => sessionSectionOf(row.id) === groupId && !pinnedSet.has(row.id) && matchesSession(row)), sortOrder);
    const renderSectionedSession = (row) => renderSessionRow(row, 0, workspaceIndexOf.get(row.id), {
      sectioned: true,
      workspaceTag: workspaceTitleOf(workspaceIndexOf.get(row.id)),
      tooltip: true
    });
    const renderCustomWorkspaceGroups = () => {
      const rows = [];
      for (const group of workspaceGroups) {
        const members = visibleItems.filter((workspace) => workspaceGroupOf(workspace.workspaceId) === group.id);
        const looseRows = sectionRowsOf(group.id);
        if (archivedFilter === "only" && members.length === 0 && looseRows.length === 0) continue;
        const groupTree = buildWorkspaceList(members, recency);
        const groupMatch = searching && group.name.toLowerCase().includes(normalizedQuery);
        const hit = searching && !groupMatch ? searchAgent(groupTree) : null;
        if (searching && !groupMatch && !hit && looseRows.length === 0) continue;
        const expanded = searching || expandedMap["workspace-group:" + group.id] !== false;
        rows.push(E(WorkspaceGroupRow, {
          key: "workspace-group-" + group.id,
          group,
          expanded,
          onToggle: () => {
            if (!searching) actions.setExpanded("workspace-group:" + group.id, !expanded);
          },
          onContextMenu: (event) => openCtx("wgroup", group, event),
          dropInto: drag !== null && drag.over && drag.over.kind === "wgroup" && drag.over.target === group.id,
          dragEvents: workspaceGroupDropEvents(group.id)
        }));
        if (expanded) {
          const entries = hit ? hit.workspaces : groupTree.workspaces.map((workspace) => ({ workspace }));
          if (!searching || groupMatch || hit) {
            for (const entry of entries) rows.push(...renderWorkspaceEntry(entry, 0, wsPulseOf(entry.workspace)));
          }
          for (const row of looseRows) rows.push(renderSectionedSession(row));
        }
      }
      return rows;
    };
    const renderProjectsHeader = () => {
      const looseRows = sectionRowsOf("");
      if (workspaceGroups.length === 0 && looseRows.length === 0) return [];
      if (searching && !searched && looseRows.length === 0) return [];
      if (archivedFilter === "only" && projectItems.length === 0 && looseRows.length === 0) return [];
      const group = { id: "", name: t("wgroup.projects") };
      return [E(WorkspaceGroupRow, {
        key: "workspace-group-projects",
        group,
        onContextMenu: (event) => openCtx("wgroup", group, event),
        dropInto: drag !== null && drag.over && drag.over.kind === "wgroup" && drag.over.target === "",
        dragEvents: workspaceGroupDropEvents("")
      })];
    };
    let bodyRows = [];
    if (searching && groupedView) {
      if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray));
      bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader());
      if (searched) {
        for (const child of searched.folders) bodyRows.push(...renderSearchedFolder(child, 0));
        for (const entry of searched.workspaces) bodyRows.push(...renderWorkspaceEntry(entry, 0));
      }
      for (const row of sectionRowsOf("")) bodyRows.push(renderSectionedSession(row));
    } else if (timeSorted || viewMode === "flat") {
      const timelineRows = [];
      const included = /* @__PURE__ */ new Set();
      const append = (row) => {
        if (included.has(row.id) || pinnedSet.has(row.id) || !matchesSession(row)) return;
        included.add(row.id);
        const workspaceId = workspaceIndexOf.get(row.id);
        row.workspaceTag = workspaceId !== void 0 ? workspaceTitleOf(workspaceId) : "";
        timelineRows.push(row);
      };
      for (const workspace of items || []) for (const row of sessionsOf(workspace, true)) append(row);
      for (const row of ungrouped) append(row);
      if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray));
      if (timeSorted) {
        for (const row of renderTimeBuckets(timelineRows, null, 0)) bodyRows.push(row);
      } else {
        for (const row of orderRows(timelineRows, sortOrder)) {
          bodyRows.push(renderSessionRow(row, 0, null, { workspaceTag: row.workspaceTag, tagOnHover: true, tooltip: true }));
        }
      }
    } else {
      if (pinnedTray.length > 0) bodyRows.push(renderPinnedSection(pinnedTray));
      bodyRows.push(...renderCustomWorkspaceGroups(), ...renderProjectsHeader());
      for (const folder of tree.folders) bodyRows.push(...renderPlainFolder(folder, 0));
      for (const workspace of tree.workspaces) bodyRows.push(...renderWorkspaceEntry({ workspace }, 0, wsPulseOf(workspace)));
      for (const row of sectionRowsOf("")) bodyRows.push(renderSectionedSession(row));
      if (ungrouped.length > 0) {
        const plainUn = ungrouped.filter((s) => sessionSectionOf(s.id) === null && !pinnedSet.has(s.id) && matchesSession(s));
        if (plainUn.length > 0) {
          bodyRows.push(E("div", { key: "ungrouped-label", className: "bw-header-title", style: { padding: "10px 6px 2px" } }, t("group.ungrouped")));
        }
        for (const s of plainUn) bodyRows.push(renderSessionRow(s, 0, null));
      }
    }
    if (searching && groupedView) {
      const matchedUngrouped = ungrouped.filter((row) => sessionSectionOf(row.id) === null && !pinnedSet.has(row.id) && matchesSession(row));
      if (matchedUngrouped.length > 0) {
        bodyRows.push(E("div", { key: "ungrouped-label", className: "bw-header-title", style: { padding: "10px 6px 2px" } }, t("group.ungrouped")));
        for (const row of matchedUngrouped) bodyRows.push(renderSessionRow(row, 0, null));
      }
    }
    const isEmpty = bodyRows.length === 0;
    if (isEmpty) {
      let emptyText = t("empty.sessions");
      if (searching) emptyText = t("empty.search");
      else if (phase === "pending") emptyText = "\u2026";
      else if (archivedFilter === "only") emptyText = t("empty.archived");
      else if (groupedView && visibleItems.length === 0) emptyText = t("empty");
      bodyRows = [E(
        "div",
        { key: "empty", className: "bw-empty" },
        E("div", null, emptyText),
        archivedFilter !== "show" && phase !== "pending" ? E(BTN, { variant: "outline", onClick: () => actions.setArchivedFilter("show") }, t("empty.showAll")) : null
      )];
    }
    return { bodyRows, isEmpty, matchesSession, pinnedTray, renderCustomWorkspaceGroups, renderPinnedSection, renderPlainFolder, renderProjectsHeader, renderSearchedFolder, renderSectionedSession, renderSessionNode, renderSessionRow, renderSessionTree, renderTimeBuckets, renderWorkspaceEntry, restoreSession, searchSessionNode, sectionRowsOf };
  }

  // src/client/tabs-strip.ts
  var tabsHost = { openSessionMenu: null };
  function useChipsAfterNav(enabled) {
    React.useEffect(() => {
      if (typeof document === "undefined") return void 0;
      const header = document.querySelector("header[data-window-drag]");
      if (!enabled) {
        if (header) {
          for (const name of ["--bw-chips-left", "--bw-chips-right", "--bw-chips-top", "--bw-chips-bottom"]) header.style.removeProperty(name);
        }
        return void 0;
      }
      const place = () => {
        const header2 = document.querySelector("header[data-window-drag]");
        if (!header2) return;
        const nav2 = header2.querySelector('[class*="_tabs"]');
        if (!nav2) return;
        const head = header2.getBoundingClientRect();
        const items = nav2.children && nav2.children.length ? nav2.children : [nav2];
        const last = items[items.length - 1];
        const row = (last || nav2).getBoundingClientRect();
        if (!head.width || !row.width) return;
        const offset = Math.max(24, Math.round(row.right - head.left + 18));
        if (offset > head.width - 220) return;
        header2.style.setProperty("--bw-chips-left", offset + "px");
        header2.style.setProperty("--bw-chips-right", "auto");
        const chips = header2.querySelector('[class*="_headerActions"]');
        if (chips) {
          const chipsHeight = chips.getBoundingClientRect().height;
          if (chipsHeight > 0) {
            const top = Math.round(row.top + row.height / 2 - head.top - chipsHeight / 2 - 4);
            header2.style.setProperty("--bw-chips-top", top + "px");
            header2.style.setProperty("--bw-chips-bottom", "auto");
          }
        }
      };
      place();
      const nav = header ? header.querySelector('[class*="_tabs"]') : null;
      const observer = typeof ResizeObserver === "function" ? new ResizeObserver(place) : null;
      if (observer && header) observer.observe(header);
      if (observer && nav) observer.observe(nav);
      window.addEventListener("resize", place);
      return () => {
        if (observer) observer.disconnect();
        window.removeEventListener("resize", place);
      };
    }, [enabled]);
  }
  function useTabsSurface(showTabs) {
    const useIsoLayoutEffect = typeof React.useLayoutEffect === "function" ? React.useLayoutEffect : React.useEffect;
    useIsoLayoutEffect(() => {
      if (typeof document === "undefined") return void 0;
      const root = document.documentElement;
      if (showTabs) delete root.dataset.bwTabsOff;
      else root.dataset.bwTabsOff = "1";
      return () => {
        delete root.dataset.bwTabsOff;
      };
    }, [showTabs]);
  }
  function useTabs() {
    const [tabs, setTabs] = React.useState(() => tabsSnapshot());
    React.useEffect(() => subscribeTabs(() => setTabs(tabsSnapshot())), []);
    return tabs;
  }
  var NO_ARCHIVED = [];
  function useTabSync(sessions, useWorkspaces) {
    const workspaces = typeof useWorkspaces === "function" ? useWorkspaces((s) => s) : null;
    const archivedIds = workspaces && Array.isArray(workspaces.archivedSessionIds) ? workspaces.archivedSessionIds : NO_ARCHIVED;
    const previousRef = React.useRef(null);
    React.useEffect(() => {
      const current = currentSessionIdOf(sessions);
      const previous = previousRef.current;
      previousRef.current = current;
      if (!current) return;
      setActiveTab(current);
      const byId = sessions && sessions.byId ? sessions.byId : null;
      const archived = new Set(archivedIds.map(String));
      saveTabs(reconcileTabs(tabsSnapshot(), current, previous, {
        isBlank: (id) => !!(byId && byId[id] && byId[id].blank),
        isArchived: (id) => archived.has(String(id))
      }));
    }, [sessions, archivedIds]);
  }
  function TabsStrip(props) {
    const { useSessions, useSessionStatus, useWorkspaces, useStore, t, open } = props;
    const prefs = typeof useStore === "function" ? useStore((s) => s.prefs) || {} : {};
    const showTabs = prefs.showTabs !== false;
    const statusDots = prefs.statusDots !== false;
    useTabsSurface(showTabs);
    useChipsAfterNav(showTabs);
    const stored = useTabs();
    const { draggingId, eventsFor } = useTabReorder({
      onReorder: (fromId, toId) => {
        saveTabs(moveTab(tabsSnapshot(), fromId, toId));
      }
    });
    const sessions = typeof useSessions === "function" ? useSessions((s) => s) : null;
    useTabSync(sessions, useWorkspaces);
    const statuses = typeof useSessionStatus === "function" ? useSessionStatus((s) => s) : null;
    if (sessions === null && typeof useSessions !== "function") return null;
    if (!showTabs) return null;
    const bound = props.sessionId === void 0 || props.sessionId === null ? null : String(props.sessionId);
    const liveCurrent = currentSessionIdOf(sessions);
    const sessionId = liveCurrent || tabsActive() || bound || null;
    const tabs = stored.length ? stored : sessionId ? [sessionId] : [];
    if (tabs.length === 0) return null;
    const titleOf = (id) => {
      const summary = sessions && sessions.byId ? sessions.byId[id] : void 0;
      return sessionTitleOf(summary, t) || id;
    };
    const stateOf = (id) => {
      const status = statuses && typeof statuses.get === "function" ? statuses.get(id) : void 0;
      const summary = sessions && sessions.byId ? sessions.byId[id] : void 0;
      return sessionStateOf({
        running: status ? status.running === true : !!(summary && summary.running),
        completed: status ? status.completionUnread === true : !!(summary && summary.completed),
        pending: status && status.pendingInteraction ? status.pendingInteraction.kind : void 0
      }, sessionId === id);
    };
    const switchTo = (id) => {
      setActiveTab(id);
      if (typeof open === "function" && id !== sessionId) open(id);
    };
    const closeOne = (event, id) => {
      event.stopPropagation();
      event.preventDefault();
      const result = closeTab(tabs, id, sessionId);
      saveTabs(result.tabs);
      if (result.next) switchTo(result.next);
    };
    return E(
      "div",
      { className: "bw-tabs", role: "tablist", "aria-label": t("tabs.label"), "data-bw-tabs": String(tabs.length) },
      StyleNode(),
      tabs.map((id) => {
        const active = sessionId === id;
        const state = stateOf(id);
        const title = titleOf(id);
        const activeStyle = active ? { boxShadow: "inset 0 -2px 0 var(--dsw-alias-brand-primary, #5b8def)" } : void 0;
        return E(
          "div",
          {
            key: id,
            className: cls("bw-tab", active && "bw-tab-active", draggingId === id && "bw-tab-dragging"),
            "data-bw-active": active ? "1" : "0",
            role: "tab",
            tabIndex: active ? 0 : -1,
            "aria-selected": active,
            title,
            draggable: true,
            style: activeStyle,
            onClick: () => switchTo(id),
            onKeyDown: (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                switchTo(id);
              }
            },
            onContextMenu: (event) => {
              if (!tabsHost.openSessionMenu) return;
              event.preventDefault();
              event.stopPropagation();
              tabsHost.openSessionMenu(id, event);
            },
            // The spread re-declares `draggable` (eventsFor always arms it) and still
            // wins at runtime; the wide record view keeps TS from flagging the repeat.
            ...eventsFor(id)
          },
          statusDots ? state ? E(StatusDot, { state, label: t("tabs." + state) }) : E("span", { className: "bw-tab-dot", "aria-hidden": "true" }) : null,
          E("span", { className: "bw-tab-label", style: active ? { color: "var(--dsw-alias-brand-primary, #5b8def)", fontWeight: 600 } : void 0 }, title),
          E("button", {
            type: "button",
            className: "bw-tab-close",
            draggable: false,
            "aria-label": t("tabs.close"),
            title: t("tabs.close"),
            onClick: (event) => closeOne(event, id)
          }, "\xD7")
        );
      })
    );
  }

  // src/client/browser/menu.ts
  function createMenu(input) {
    const {
      actions,
      archiveSession,
      archivedFilter,
      assignSessionSection,
      assignWorkspaceGroup,
      automaticSort,
      copySessionText,
      ctx,
      deleteAvailable,
      deleting,
      fail,
      forkSession,
      items,
      keyOf,
      openDirectory,
      pinnedSet,
      refreshPage,
      renameSession,
      restoreSession,
      setCtx,
      setCtxSubmenu,
      setCustomize,
      setDialog,
      setDrag,
      setFlowOpen,
      setFlowParent,
      storeFolders,
      t,
      timeDirection,
      timeSorted,
      unarchiveSession,
      viewMode
    } = input;
    const ctxItems = () => {
      if (ctx === null) return [];
      if (ctx.kind === "view") {
        const choice = (id, label, checked, disabled = false) => ({
          id,
          label: t(label),
          role: "menuitemradio",
          checked,
          disabled,
          leading: checked ? icon("IconCheckOutline16", 14) : null
        });
        const items2 = [{ heading: t("view.grouping") }];
        for (const mode of VIEW_MODES) items2.push(choice("view-" + mode, "view." + mode, viewMode === mode));
        items2.push({ sep: true }, { heading: t("view.sort") });
        items2.push(choice("view-sort-manual", "view.sort.manual", !automaticSort, timeSorted));
        items2.push(choice("view-sort-latest", "view.sort.latest", automaticSort, timeSorted));
        if (timeSorted) {
          for (const dir of ["latest", "oldest"]) items2.push(choice("view-dir-" + dir, "view.time." + dir, timeDirection === dir));
        }
        items2.push({ sep: true }, { heading: t("view.filter") });
        for (const filter of ARCHIVED_FILTERS) items2.push(choice("view-filter-" + filter, "view.filter." + filter, archivedFilter === filter));
        return items2;
      }
      if (ctx.kind === "folder") {
        const items2 = [
          { id: "new-subfolder", label: t("menu.newSubfolder") },
          { id: "new-subworkspace", label: t("menu.newSubWorkspace") },
          { id: "rename-folder", label: t("menu.renameFolder") }
        ];
        if (storeFolders.includes(ctx.payload.path)) items2.push({ id: "remove-folder", label: t("menu.removeFolder"), danger: true });
        items2.push({ sep: true });
        items2.push({ id: "customize", label: t("custom.title") });
        return items2;
      }
      if (ctx.kind === "workspace") return [
        { id: "rename", label: t("menu.rename"), leading: icon("IconEditOutline16", 14) },
        { id: "group-workspace", label: t("wgroup.menu"), leading: icon("IconFolderOpenOutline16", 14), submenu: true },
        { id: "delete", label: t("menu.delete"), leading: icon("IconTrashOutline16", 14), danger: true },
        { sep: true },
        { id: "customize", label: t("custom.title"), leading: icon("IconPersonalizationOutline16", 14) }
      ];
      if (ctx.kind === "wgroup") {
        const items2 = [{ id: "new-workspace-group", label: t("wgroup.new"), leading: icon("IconPlusOutline16", 14) }];
        if (ctx.payload.id) items2.push(
          { sep: true },
          { id: "rename-workspace-group", label: t("wgroup.rename"), leading: icon("IconEditOutline16", 14) },
          { id: "delete-workspace-group", label: t("wgroup.delete"), leading: icon("IconTrashOutline16", 14), danger: true }
        );
        return items2;
      }
      if (ctx.kind === "session") {
        const isPinned = pinnedSet.has(ctx.payload.id);
        const items2 = [];
        if (ctx.payload.archived) items2.push({ id: "unarchive", label: t("menu.unarchive"), leading: icon("IconArchiveOutline20", 14), disabled: typeof unarchiveSession !== "function" });
        else items2.push(
          { id: "rename", label: t("menu.renameSession"), leading: icon("IconEditOutline16", 14), disabled: typeof renameSession !== "function" },
          { id: "archive", label: t("menu.archiveSession"), leading: icon("IconArchiveOutline20", 14), disabled: typeof archiveSession !== "function" }
        );
        items2.push(
          { id: "group-session", label: t("wgroup.menu"), leading: icon("IconListPenOutline16", 14), submenu: true },
          { id: "delete-session", label: t("menu.deleteSession"), leading: icon("IconTrashOutline16", 14), danger: true, disabled: !deleteAvailable || ctx.payload.blank || deleting, hint: !deleteAvailable ? t("menu.deleteUnavailable") : void 0 },
          { sep: true },
          { id: "open-directory", label: t("menu.openDirectory"), leading: icon("IconFolderOpenOutline16", 14), disabled: !ctx.payload.cwd || typeof openDirectory !== "function" },
          { id: "copy-directory", label: t("menu.copyDirectory"), leading: icon("IconCopyOutline16", 14), disabled: !ctx.payload.cwd },
          { id: "copy-id", label: t("menu.copySessionId"), leading: icon("IconLinkOutline16", 14) }
        );
        if (!ctx.payload.archived) items2.push(
          { sep: true },
          { id: "fork", label: t("menu.fork"), leading: icon("IconBranchOutline16", 14), disabled: ctx.payload.blank || typeof forkSession !== "function" },
          { id: "pin", label: isPinned ? t("menu.unpin") : t("menu.pin"), leading: E(PinIcon16, { size: 14 }) }
        );
        items2.push(
          { sep: true },
          { id: "customize", label: t("custom.title"), leading: icon("IconPersonalizationOutline16", 14) },
          { sep: true },
          { id: "refresh", label: t("menu.refresh"), leading: icon("IconRefreshOutline16", 14), shortcut: "Ctrl+R", disabled: typeof refreshPage !== "function" }
        );
        return items2;
      }
      return [
        { id: "rename-sgroup", label: t("menu.renameSgroup") },
        { sep: true },
        { id: "customize", label: t("custom.title") }
      ];
    };
    const handleCtxPick = (id) => {
      const current = ctx;
      if (current === null) return;
      if (id.startsWith("assign-workspace-group:") && current.kind === "workspace") {
        assignWorkspaceGroup(current.payload.workspaceId, id.slice("assign-workspace-group:".length));
        setCtxSubmenu(null);
        setCtx(null);
        return;
      }
      if (id.startsWith("assign-session-section:") && current.kind === "session") {
        assignSessionSection(current.payload.id, id.slice("assign-session-section:".length));
        setCtxSubmenu(null);
        setCtx(null);
        return;
      }
      if (id === "follow-workspace" && current.kind === "session") {
        assignSessionSection(current.payload.id, null);
        setCtxSubmenu(null);
        setCtx(null);
        return;
      }
      if (id === "new-workspace-group") {
        setDialog({
          kind: "wgroup-new",
          workspaceId: current.kind === "workspace" ? current.payload.workspaceId : void 0,
          sessionId: current.kind === "session" ? current.payload.id : void 0
        });
        setCtxSubmenu(null);
        setCtx(null);
        return;
      }
      setCtxSubmenu(null);
      if (current.kind === "view" && id.startsWith("view-")) {
        const mode = id.slice("view-".length);
        if (VIEW_MODES.includes(mode)) actions.setViewMode(mode);
        else if (id.startsWith("view-dir-")) actions.setTimeDirection(id.slice("view-dir-".length));
        else if (id.startsWith("view-sort-") && !timeSorted) actions.setSortOrder(id.slice("view-sort-".length));
        else if (id.startsWith("view-filter-")) actions.setArchivedFilter(id.slice("view-filter-".length));
        setCtx(null);
        setDrag(null);
        return;
      }
      if (id === "customize") {
        const payload2 = current.payload;
        let name = payload2.name;
        if (current.kind === "workspace") name = payload2.title || payload2.leaf;
        else if (current.kind === "session") name = payload2.title;
        setCustomize({ kind: current.kind, entryKey: keyOf(current.kind, payload2), name });
        setCtx(null);
        return;
      }
      const { kind, payload } = current;
      setCtx(null);
      if (kind === "folder" && id === "new-subfolder") setDialog({ kind: "folder-new", parentPath: payload.path });
      else if (kind === "folder" && id === "new-subworkspace") {
        setFlowParent(payload.path);
        setFlowOpen(true);
      } else if (kind === "folder" && id === "rename-folder") setDialog({ kind: "folder-rename", path: payload.path });
      else if (kind === "folder" && id === "remove-folder") setDialog({ kind: "folder-delete", path: payload.path });
      else if (kind === "workspace" && id === "rename") setDialog({ kind: "ws-rename", workspace: payload });
      else if (kind === "workspace" && id === "delete") setDialog({ kind: "ws-delete", workspace: payload });
      else if (kind === "wgroup" && id === "rename-workspace-group") setDialog({ kind: "wgroup-rename", groupId: payload.id, name: payload.name });
      else if (kind === "wgroup" && id === "delete-workspace-group") setDialog({ kind: "wgroup-delete", group: payload });
      else if (kind === "sgroup" && id === "rename-sgroup") setDialog({ kind: "sgroup-rename", target: payload });
      else if (kind === "session" && id === "pin") actions.togglePin(payload.id);
      else if (kind === "session" && id === "rename") setDialog({ kind: "sess-rename", session: payload });
      else if (kind === "session" && id === "fork") {
        Promise.resolve().then(() => forkSession(payload.id)).catch((error) => fail(messageOf(error)));
      } else if (kind === "session" && id === "unarchive") restoreSession(payload.id);
      else if (kind === "session" && id === "archive") {
        Promise.resolve().then(() => archiveSession(payload.id)).catch(fail);
      } else if (kind === "session" && id === "delete-session" && deleteAvailable && !payload.blank && !deleting) setDialog({ kind: "sess-delete", session: payload });
      else if (kind === "session" && id === "open-directory" && payload.cwd) {
        Promise.resolve().then(() => openDirectory(payload.cwd)).catch((error) => fail(messageOf(error)));
      } else if (kind === "session" && id === "copy-directory" && payload.cwd) copySessionText(payload.cwd, "copy.directory.done");
      else if (kind === "session" && id === "copy-id") copySessionText(payload.id, "copy.sessionId.done");
      else if (kind === "session" && id === "refresh" && typeof refreshPage === "function") refreshPage();
    };
    return { ctxItems, handleCtxPick };
  }

  // src/client/customize.ts
  var SWATCHES = ["", "#5b8def", "#3fb950", "#d29922", "#f85149", "#a371f7", "#39c5cf", "#ec6cb9", "#ff9f45", "#6e7681"];
  var GLOW_MAX = 14;
  var ICON_CHOICES = [
    "solid",
    "outline",
    "none",
    "IconProjectAddOutline16",
    "IconBranchOutline16",
    "IconArchiveOutline20",
    "IconCodeOutline16",
    "IconDataOutline16",
    "IconGoalOutline16",
    "IconGlobeOutline14",
    "IconInspectOutline12",
    "IconCopyOutline16",
    "IconLinkOutline16",
    "IconListPenOutline16",
    "IconChecklistOutline14",
    "IconBrowseOutline16",
    "IconDownloadOutline16",
    "IconContextInjectionOutline16",
    "IconCordisPluginOutline14",
    "IconApiOutline14",
    "IconAgentPresetOutline16",
    "IconEnhanceOutline16",
    "IconSkillOutline16",
    "IconSparkle16",
    "IconNewChatOutline16",
    "IconCheckOutline14",
    "IconCheckOutline16",
    "IconChevronDownOutline14",
    "IconChevronLeftOutline14",
    "IconChevronRightOutline14",
    "IconChevronUpOutline14",
    "IconCloseOutline16",
    "IconDarkOutline16",
    "IconEditOutline16",
    "IconEllipsisOutline16",
    "IconFolderClose16",
    "IconFolderOpen16",
    "IconFolderOpenOutline16",
    "IconFullscreenOutline16",
    "IconLightOutline16",
    "IconLinkOutline14",
    "IconLoadingOutline16",
    "IconPanelLeftOutline16",
    "IconPaperclipOutline16",
    "IconPersonalizationOutline16",
    "IconPlayOutline16",
    "IconPauseOutline16",
    "IconPlusOutline16",
    "IconQuestionOutline14",
    "IconQueueOutline14",
    "IconRefreshOutline14",
    "IconRefreshOutline16",
    "IconRightUpOutline14",
    "IconSearchOutline16",
    "IconSendOutline14",
    "IconSendOutline16",
    "IconSettingsOutline14",
    "IconSettingsOutline16",
    "IconShareOutline16",
    "IconStopFill16",
    "IconThinkOutline14",
    "IconThinkOutline16",
    "IconTrashOutline16",
    "IconUserOutline16",
    "IconWarningOutline16",
    "IconLikeOutline16",
    "IconDislikeOutline16",
    "IconFollowsystemOutline16",
    "IconAlarmClockOutline16",
    "IconClockOutline16",
    "IconDatabaseOutline16"
  ];
  function CustomizeDialog({ open, initial, kind, onChange, onReset, onClose, t }) {
    const allowIcon = kind === "folder" || kind === "workspace";
    const [color, setColor] = React.useState("");
    const [glow, setGlow] = React.useState(0);
    const [iconMode, setIconMode] = React.useState("solid");
    const [weight, setWeight] = React.useState(0);
    const [shadow, setShadow] = React.useState(false);
    React.useEffect(() => {
      if (!open) return;
      setColor(initial && initial.color ? initial.color : "");
      setGlow(initial && initial.glow ? Number(initial.glow) || 0 : 0);
      setIconMode(initial && initial.icon ? initial.icon : "solid");
      setWeight(initial && initial.weight ? Number(initial.weight) || 0 : 0);
      setShadow(initial && initial.shadow === true);
    }, [open, initial]);
    if (!open) return null;
    const commit = () => {
      const empty = allowIcon ? color === "" && glow === 0 && iconMode === "solid" && weight === 0 && !shadow : color === "" && glow === 0 && weight === 0 && !shadow;
      const style = empty ? null : { color, glow, weight: weight > 0 ? weight : void 0, shadow: shadow || void 0, ...allowIcon ? { icon: iconMode } : {} };
      onChange(style);
      onClose();
    };
    const channels = colorToRgb(color);
    const setChannel = (index, raw) => {
      const n = Math.max(0, Math.min(255, parseInt(raw, 10) || 0));
      const base = channels || [0, 0, 0];
      const next = base.slice();
      next[index] = n;
      setColor(rgbToHex(next[0], next[1], next[2]));
    };
    const previewShadows = [];
    if (glow > 0 && color) previewShadows.push("0 0 " + glow + "px " + color);
    if (shadow) previewShadows.push("1px 1px 2px rgba(0,0,0,.85)");
    return E(
      ui.Modal,
      {
        open: true,
        onClose,
        closeLabel: t("close"),
        title: t("custom.title"),
        footer: E(
          "div",
          { className: "bw-modal-actions" },
          E(BTN, { variant: "outline", onClick: () => {
            onReset();
            onClose();
          } }, t("custom.reset")),
          E(BTN, { variant: "primary", onClick: commit }, t("custom.done"))
        )
      },
      E(
        "div",
        { className: "bw-modal-body" },
        E(
          "div",
          { className: "bw-field" },
          t("custom.color"),
          E(
            "div",
            { className: "bw-dialog-input-row" },
            SWATCHES.map((swatch) => E("button", {
              key: swatch || "none",
              type: "button",
              className: cls("bw-swatch", color === swatch && "bw-swatch-active"),
              style: swatch === "" ? void 0 : { background: swatch },
              "aria-label": swatch === "" ? t("custom.reset") : swatch,
              onClick: () => setColor(swatch)
            })),
            E("input", {
              type: "color",
              className: "bw-color-input",
              value: color || "#5b8def",
              onChange: (e) => setColor(e.target.value)
            })
          ),
          E(
            "div",
            { className: "bw-rgb-row" },
            ["R", "G", "B"].map((label, index) => E(
              "label",
              { key: label, className: "bw-rgb-label" },
              label,
              E("input", {
                type: "number",
                className: "bw-rgb-input",
                min: 0,
                max: 255,
                value: channels ? channels[index] : "",
                placeholder: "\u2014",
                onChange: (e) => setChannel(index, e.target.value)
              })
            ))
          )
        ),
        E(
          "div",
          { className: "bw-field" },
          t("custom.glow"),
          E(
            "div",
            { className: "bw-glow-row" },
            E("input", {
              type: "range",
              className: "bw-slider",
              min: 0,
              max: GLOW_MAX,
              step: 1,
              value: glow,
              "aria-label": t("custom.glow"),
              onChange: (e) => setGlow(Number(e.target.value))
            }),
            E("span", { className: "bw-glow-value" }, glow === 0 ? t("custom.none") : glow + "px")
          )
        ),
        E(
          "div",
          { className: "bw-field" },
          t("custom.weight"),
          E(
            "div",
            { className: "bw-seg" },
            [400, 500, 600, 700].map((wt) => E("button", {
              key: String(wt),
              type: "button",
              className: cls("bw-seg-btn", weight === wt && "bw-seg-btn-active"),
              onClick: () => setWeight(wt)
            }, wt === 400 ? t("custom.weight.regular") : wt === 500 ? t("custom.weight.medium") : wt === 600 ? t("custom.weight.semibold") : t("custom.weight.bold")))
          )
        ),
        E(
          "div",
          { className: "bw-field" },
          t("custom.shadow"),
          E(
            "div",
            { className: "bw-seg" },
            E("button", { type: "button", className: cls("bw-seg-btn", !shadow && "bw-seg-btn-active"), onClick: () => setShadow(false) }, t("custom.none")),
            E("button", { type: "button", className: cls("bw-seg-btn", shadow && "bw-seg-btn-active"), onClick: () => setShadow(true) }, t("settings.on"))
          )
        ),
        allowIcon ? E(
          "div",
          { className: "bw-field" },
          t("custom.icon"),
          E(
            "div",
            { className: "bw-icon-grid" },
            ICON_CHOICES.map((mode) => E("button", {
              key: mode,
              type: "button",
              className: cls("bw-icon-cell", iconMode === mode && "bw-icon-cell-active"),
              title: mode === "solid" ? t("custom.icon.solid") : mode === "outline" ? t("custom.icon.outline") : mode,
              "aria-label": mode === "solid" ? t("custom.icon.solid") : mode === "outline" ? t("custom.icon.outline") : mode,
              onClick: () => setIconMode(mode)
            }, mode === "none" ? E("span", { className: "bw-icon-none" }) : iconOf(mode, false)))
          )
        ) : null,
        E(
          "div",
          { className: "bw-field" },
          t("custom.preview"),
          E(
            "div",
            {
              className: "bw-preview",
              style: {
                color: color || void 0,
                fontWeight: weight > 0 ? weight : void 0,
                textShadow: previewShadows.length > 0 ? previewShadows.join(",") : void 0
              }
            },
            allowIcon ? E("span", { className: "bw-preview-icon" }, iconOf(iconMode, true)) : null,
            E("span", { className: "bw-preview-label" }, t("custom.preview.sample"))
          )
        )
      ),
      StyleNode()
    );
  }

  // src/client/browser/layout.ts
  function createLayout(input) {
    const {
      actions,
      bodyRows,
      createWorkspace,
      ctx,
      ctxItems,
      ctxSubmenu,
      customize,
      deleting,
      deletingRef,
      dialog,
      errorText,
      expandSidebar,
      fail,
      flowOpen,
      flowParent,
      handleCtxPick,
      items,
      notice,
      ownMenuRoot,
      pickDirectory,
      query,
      renameWorkspace,
      searchOpen,
      sessionSectionOf,
      setCtx,
      setCtxSubmenu,
      setCustomize,
      setDialog,
      setErrorText,
      setFlowOpen,
      setFlowParent,
      setQuery,
      setSearchOpen,
      styleEntry,
      submitFolderDelete,
      submitFolderNew,
      submitFolderRename,
      submitSessionDelete,
      submitSessionGroupRename,
      submitSessionRename,
      submitWorkspaceDelete,
      submitWorkspaceGroup,
      submitWorkspaceRename,
      t,
      useStore,
      useWorkspaces,
      viewMode,
      wide,
      workspaceGroupOf,
      workspaceGroups,
      workspaceIndexOf
    } = input;
    function render() {
      if (!wide) {
        return E(
          "div",
          { className: "bw-rail" },
          StyleNode(),
          E("button", { type: "button", className: "bw-rail-btn", "aria-label": t("rail.search"), onClick: () => {
            expandSidebar();
            setSearchOpen(true);
          } }, icon("IconSearchOutline16", 18)),
          E("button", { type: "button", className: "bw-rail-btn", "aria-label": t("rail.add"), onClick: () => {
            expandSidebar();
            setFlowParent("");
            setFlowOpen(true);
          } }, icon("IconProjectAddOutline16", 18))
        );
      }
      const dialogElement = (() => {
        if (dialog === null) return null;
        if (dialog.kind === "wgroup-new" || dialog.kind === "wgroup-rename") return E(TextDialog, {
          key: dialog.kind,
          title: t(dialog.kind === "wgroup-new" ? "wgroup.new.title" : "wgroup.rename"),
          hint: t("wgroup.hint"),
          initial: dialog.name || "",
          onConfirm: (name) => submitWorkspaceGroup(dialog, name),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "wgroup-delete") return E(ConfirmDialog, {
          key: "wgroup-delete",
          title: t("wgroup.delete"),
          body: t("wgroup.delete.body", { name: dialog.group.name }),
          onConfirm: () => {
            actions.deleteWorkspaceGroup(dialog.group.id);
            setDialog(null);
          },
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "ws-rename") return E(TextDialog, {
          key: "ws-rename",
          title: t("ws.rename.title"),
          hint: t("ws.rename.hint"),
          initial: dialog.workspace.title || dialog.workspace.leaf,
          onConfirm: (v) => submitWorkspaceRename(dialog.workspace, v),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "ws-delete") return E(ConfirmDialog, {
          key: "ws-delete",
          title: t("ws.delete.title"),
          body: t("ws.delete.body", { name: dialog.workspace.title || dialog.workspace.leaf }),
          onConfirm: () => submitWorkspaceDelete(dialog.workspace),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "sess-rename") return E(TextDialog, {
          key: "sess-rename",
          title: t("menu.rename"),
          initial: dialog.session.title,
          onConfirm: (v) => submitSessionRename(dialog.session, v),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "sess-delete") return E(ConfirmDialog, {
          key: "sess-delete",
          title: t("session.delete.title"),
          body: t("session.delete.body", { name: dialog.session.title }),
          confirmLabel: t(deleting ? "session.delete.busy" : "session.delete.confirm"),
          danger: true,
          busy: deleting,
          onConfirm: () => submitSessionDelete(dialog.session),
          onClose: () => {
            if (!deletingRef.current) setDialog(null);
          },
          t
        });
        if (dialog.kind === "sgroup-rename") return E(TextDialog, {
          key: "sgroup-rename",
          title: t("menu.renameSgroup"),
          hint: t("ws.rename.hint"),
          initial: dialog.target.name,
          onConfirm: (v) => submitSessionGroupRename(dialog.target, v),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "folder-new") return E(TextDialog, {
          key: "folder-new",
          title: t("folder.new.title"),
          hint: t("folder.new.hint"),
          initial: dialog.parentPath ? dialog.parentPath + "/" : "",
          onConfirm: (v) => submitFolderNew(dialog.parentPath || "", v),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "folder-rename") return E(TextDialog, {
          key: "folder-rename",
          title: t("folder.rename.title"),
          hint: t("folder.rename.hint"),
          initial: dialog.path,
          onConfirm: (v) => submitFolderRename(dialog.path, v),
          onClose: () => setDialog(null),
          t
        });
        if (dialog.kind === "folder-delete") {
          return E(ConfirmDialog, {
            key: "folder-delete",
            title: t("menu.removeFolder"),
            body: t("folder.delete.body", { name: dialog.path }),
            onConfirm: () => submitFolderDelete(dialog.path),
            onClose: () => setDialog(null),
            t
          });
        }
        return null;
      })();
      const flowOwner = {
        open: flowOpen,
        busy: false,
        onPicked: () => {
        },
        onCancel: () => setFlowOpen(false),
        onError: fail
      };
      const viewGlyph = () => {
        if (viewMode === "time") return E(CalendarDaysIcon16, { size: 15 });
        if (viewMode === "flat") return E(ListIcon16, { size: 15 });
        if (viewMode === "workspaces") return icon("IconFolderClose16", 15);
        return E(ListTreeIcon16, { size: 15 });
      };
      const renderCtxItem = (item, index) => {
        if (item.sep) return E("div", { key: "sep-" + index, className: "bw-ctx-sep" });
        if (item.heading) return E("div", { key: "heading-" + index, className: "bw-ctx-heading" }, item.heading);
        let checked;
        if (item.checked !== void 0) checked = String(item.checked);
        let leading = null;
        const iconClass = item.role === "menuitemradio" ? "bw-sort-menu-check" : cls("bw-menu-icon", item.id === "pin" && "bw-menu-pin");
        if (item.leading !== void 0) leading = E("span", { className: iconClass, "aria-hidden": true }, item.leading);
        else if (item.leadingIcon) leading = E("span", { className: iconClass, "aria-hidden": true }, E(item.leadingIcon, { size: 14 }));
        return E("button", {
          key: item.id,
          type: "button",
          className: cls("bw-ctx-item", item.danger && "bw-ctx-danger", item.sub && "bw-ctx-subitem"),
          role: item.role || "menuitem",
          "aria-checked": checked,
          disabled: item.disabled === true,
          title: item.hint,
          "aria-haspopup": item.submenu ? "menu" : void 0,
          "aria-expanded": item.submenu ? ctxSubmenu !== null : void 0,
          onMouseEnter: (event) => {
            if (item.submenu) openSectionMenu(event);
            else if (!item.groupChoice) setCtxSubmenu(null);
          },
          onKeyDown: (event) => {
            if (item.submenu && event.key === "ArrowRight") {
              event.preventDefault();
              openSectionMenu(event);
            }
          },
          onClick: (event) => {
            if (item.submenu) openSectionMenu(event);
            else handleCtxPick(item.id);
          }
        }, leading, E("span", { className: "bw-menu-label" }, item.label), item.submenu ? icon("IconChevronRightOutline14", 14) : null, item.shortcut ? E("span", { className: "bw-menu-shortcut" }, item.shortcut) : null);
      };
      const openSectionMenu = (event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        let x = rect.right + 4;
        if (x + 280 > window.innerWidth - 8) x = rect.left - 284;
        setCtxSubmenu({ x: Math.max(8, x), y: rect.top });
      };
      const sectionMenuItems = () => {
        if (!ctx || ctx.kind !== "workspace" && ctx.kind !== "session") return [];
        const isSession = ctx.kind === "session";
        let currentGroup = workspaceGroupOf(ctx.payload.workspaceId);
        let followsWorkspace = false;
        if (isSession) {
          currentGroup = sessionSectionOf(ctx.payload.id);
          followsWorkspace = currentGroup === null && workspaceIndexOf.has(ctx.payload.id);
          if (currentGroup === null && !followsWorkspace) currentGroup = "";
        }
        const choice = (group) => ({
          id: (isSession ? "assign-session-section:" : "assign-workspace-group:") + group.id,
          label: group.name,
          groupChoice: true,
          role: "menuitemradio",
          checked: currentGroup === group.id,
          leading: currentGroup === group.id ? icon("IconCheckOutline16", 14) : null
        });
        const items2 = [
          ...workspaceGroups.map(choice),
          choice({ id: "", name: t("wgroup.unassigned") })
        ];
        if (isSession && workspaceIndexOf.has(ctx.payload.id)) items2.push({
          id: "follow-workspace",
          label: t("wgroup.followWorkspace"),
          groupChoice: true,
          role: "menuitemradio",
          checked: followsWorkspace,
          leading: followsWorkspace ? icon("IconCheckOutline16", 14) : null
        });
        items2.push({ sep: true }, { id: "new-workspace-group", label: t("wgroup.new"), groupChoice: true, leading: icon("IconPlusOutline16", 14) });
        return items2;
      };
      let menuHeight = 240;
      if (ctx && ctx.kind === "view") menuHeight = 450;
      else if (ctx && ctx.kind === "session") menuHeight = 400;
      return E(
        "div",
        { className: "bw-root", ref: ownMenuRoot },
        StyleNode(),
        E(
          "div",
          { className: "bw-header" },
          E("div", { className: "bw-header-title" }, t("title")),
          searchOpen || query !== "" ? E("input", {
            className: "bw-input",
            style: { width: 130, flex: "none" },
            value: query,
            autoFocus: true,
            placeholder: t("search.placeholder"),
            onChange: (e) => setQuery(e.target.value),
            onKeyDown: (e) => {
              if (e.key === "Escape") {
                setQuery("");
                setSearchOpen(false);
              }
            },
            onBlur: () => {
              if (query === "") setSearchOpen(false);
            }
          }) : null,
          E("button", {
            type: "button",
            className: "bw-icon-btn",
            "aria-label": t("view.label"),
            title: t("view.label"),
            "aria-haspopup": "menu",
            "aria-expanded": ctx !== null && ctx.kind === "view",
            onClick: (e) => {
              e.preventDefault();
              setCtx({ kind: "view", payload: {}, x: e.clientX, y: e.clientY });
            }
          }, viewGlyph()),
          E("button", { type: "button", className: "bw-icon-btn", "aria-label": t("search.placeholder"), onClick: () => setSearchOpen((v) => !v) }, icon("IconSearchOutline16")),
          E("button", { type: "button", className: "bw-icon-btn", "aria-label": t("add"), onClick: () => {
            setFlowParent("");
            setFlowOpen(true);
          } }, icon("IconProjectAddOutline16"))
        ),
        E("div", { className: "bw-tree", role: "tree", "aria-label": t("title") }, bodyRows),
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
          t
        }),
        dialogElement,
        notice ? E("div", { className: "bw-notice", role: "status", "aria-live": "polite" }, notice) : null,
        ctx !== null ? E(
          "div",
          {
            className: "bw-ctx-overlay",
            onMouseDown: () => setCtx(null),
            onContextMenu: (e) => e.preventDefault(),
            onKeyDown: (event) => {
              if (event.key === "Escape") {
                setCtx(null);
                setCtxSubmenu(null);
              }
            }
          },
          E(
            "div",
            {
              className: "bw-ctx-menu",
              role: "menu",
              "aria-label": ctx.kind === "view" ? t("view.label") : void 0,
              style: { left: Math.max(8, Math.min(ctx.x, window.innerWidth - 250)), top: Math.max(8, Math.min(ctx.y, window.innerHeight - menuHeight)) },
              onMouseDown: (e) => e.stopPropagation(),
              onContextMenu: (e) => e.preventDefault()
            },
            ctxItems().map(renderCtxItem)
          ),
          (ctx.kind === "workspace" || ctx.kind === "session") && ctxSubmenu ? E("div", {
            className: "bw-ctx-menu bw-ctx-submenu",
            role: "menu",
            "aria-label": t("wgroup.menu"),
            style: { left: ctxSubmenu.x, top: Math.max(8, Math.min(ctxSubmenu.y, window.innerHeight - (sectionMenuItems().length * 28 + 12))) },
            onMouseDown: (event) => event.stopPropagation(),
            onContextMenu: (event) => event.preventDefault()
          }, sectionMenuItems().map(renderCtxItem)) : null
        ) : null,
        E(CustomizeDialog, {
          open: customize !== null,
          kind: customize ? customize.kind : void 0,
          initial: customize ? styleEntry(customize.entryKey) : void 0,
          onChange: (style) => {
            if (customize) actions.setStyling(customize.entryKey, style);
          },
          onReset: () => {
            if (customize) actions.setStyling(customize.entryKey, null);
          },
          onClose: () => setCustomize(null),
          t
        }),
        E(ui.Modal, {
          open: errorText !== null,
          onClose: () => setErrorText(null),
          closeLabel: t("close"),
          title: t("error.title"),
          footer: E("div", { className: "bw-modal-actions" }, E(BTN, { variant: "primary", onClick: () => setErrorText(null) }, t("close")))
        }, E("div", { className: "bw-modal-body" }, E("div", { className: "bw-error-text", role: "alert" }, errorText || "")), StyleNode())
      );
    }
    return { render };
  }

  // src/client/settings.ts
  function BetterWorkspaceSettings({ useStore, actions, t }) {
    const prefs = useStore ? useStore((s) => s.prefs) || {} : {};
    const compactChains = prefs.compactChains !== false;
    const statusPulse = prefs.statusPulse !== false;
    const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefs);
    const choices = (label, options, selected, onPick, disabled = false) => E(
      "div",
      { className: "bw-setting-row", style: { marginTop: 10 } },
      E("div", { className: "bw-setting-label" }, t(label)),
      E(
        "div",
        { className: "bw-seg", role: "radiogroup", "aria-label": t(label) },
        options.map(([value, key]) => E("button", {
          key: value,
          type: "button",
          role: "radio",
          disabled,
          "aria-checked": selected === value,
          className: cls("bw-seg-btn", selected === value && "bw-seg-btn-active"),
          onClick: () => onPick(value)
        }, t(key)))
      )
    );
    const switches = [
      ["showTabs", prefs.showTabs !== false],
      ["statusDots", prefs.statusDots !== false],
      ["compactChains", compactChains],
      ["statusPulse", statusPulse]
    ];
    const switchRow = ([key, value], index) => [
      E(
        "div",
        { className: "bw-setting-row", key: "row-" + key, style: index === 0 ? void 0 : { marginTop: 10 } },
        E("div", { className: "bw-setting-label" }, t("settings." + key)),
        E("button", {
          type: "button",
          role: "switch",
          "aria-checked": value,
          "aria-label": t("settings." + key),
          className: cls("bw-switch", value && "bw-switch-on"),
          onClick: () => {
            actions.setPref(key, !value);
          }
        }, E("span", { className: "bw-switch-thumb" }))
      ),
      E("div", { className: "bw-hint", key: "hint-" + key }, t("settings." + key + ".hint"))
    ];
    return E(
      "div",
      { className: "bw-settings" },
      StyleNode(),
      ...switches.flatMap(switchRow),
      choices("view.grouping", VIEW_MODES.map((mode) => [mode, "view." + mode]), viewMode, (mode) => actions.setViewMode(mode)),
      choices("view.sort", [["manual", "view.sort.manual"], ["latest", "view.sort.latest"]], viewMode === "time" ? "latest" : sortOrder, (order) => actions.setSortOrder(order), viewMode === "time"),
      viewMode === "time" ? choices("view.time.direction", [["latest", "view.time.latest"], ["oldest", "view.time.oldest"]], timeDirection, (dir) => actions.setTimeDirection(dir)) : null,
      viewMode === "time" ? E("div", { className: "bw-hint" }, t("view.time.hint")) : null,
      viewMode === "flat" ? E("div", { className: "bw-hint" }, t("view.flat.hint")) : null,
      choices("view.filter", ARCHIVED_FILTERS.map((filter) => [filter, "view.filter." + filter]), archivedFilter, (filter) => actions.setArchivedFilter(filter)),
      E("div", { className: "bw-hint" }, t("view.hint"))
    );
  }
  function BetterWorkspaceBundleConfig({ view, useStore, actions, t }) {
    if (view !== "page") return null;
    return E("div", { className: "bw-plugin-config" }, E(BetterWorkspaceSettings, { useStore, actions, t }));
  }

  // src/client/index.ts
  window.__ModuleLoader__.load({
    id: "dsh-workspace-plus",
    factory: (hostRequire) => {
      installPlatform(hostRequire);
      const QuietBoundary = createQuietBoundary();
      let statusStoreWarned = false;
      function BetterBrowser(props) {
        const {
          wide,
          expandSidebar,
          useSessions,
          useSessionStatus,
          useSessionPendingInteraction,
          useWorkspaces,
          useStore,
          actions,
          startSession,
          open,
          renameSession,
          forkSession,
          renameWorkspace,
          deleteWorkspace,
          archiveSession,
          unarchiveSession,
          createWorkspace,
          pickDirectory,
          insertWorkspaceBefore,
          insertSessionBefore,
          deleteSession,
          checkSessionDelete: checkDelete,
          openDirectory,
          refreshSessions,
          refreshPage,
          t
        } = props;
        if (typeof useWorkspaces !== "function" || typeof useSessions !== "function") {
          console.error("[dsh-workspace-plus] standard snapshot hooks missing; browser renders nothing");
          return null;
        }
        const items = useWorkspaces((s) => s.items);
        const phase = useWorkspaces((s) => s.phase);
        const archivedSessionIds = useWorkspaces((s) => s.archivedSessionIds) || [];
        const list = useSessions((s) => s);
        const statuses = typeof useSessionStatus === "function" ? useSessionStatus((s) => s) : null;
        if (statuses === null && !statusStoreWarned) {
          statusStoreWarned = true;
          console.warn("[dsh-workspace-plus] host status store missing; session status dots fall back to the session list snapshot");
        }
        const pending = useSessionPendingInteraction ? useSessionPendingInteraction((s) => s) : null;
        const storeTabs = useStore ? useStore((s) => s.tabs) || [] : [];
        const storeFolders = useStore ? useStore((s) => s.folders) || [] : [];
        const workspaceGroups = useStore ? useStore((s) => s.workspaceGroups) || [] : [];
        const workspaceGroupById = useStore ? useStore((s) => s.workspaceGroupById) || {} : {};
        const sessionSectionById = useStore ? useStore((s) => s.sessionSectionById) || {} : {};
        const workspaceGroupIds = new Set(workspaceGroups.map((group) => String(group.id)));
        const workspaceGroupOf = (id) => workspaceGroupIds.has(workspaceGroupById[id]) ? workspaceGroupById[id] : "";
        const sessionSectionOf = (id) => {
          if (!Object.prototype.hasOwnProperty.call(sessionSectionById, id)) return null;
          const groupId = sessionSectionById[id];
          if (groupId === "" || workspaceGroupIds.has(groupId)) return groupId;
          return null;
        };
        const expandedMap = useStore ? useStore((s) => s.expanded) || {} : {};
        const sessionsExpandedMap = useStore ? useStore((s) => s.sessionsExpanded) || {} : {};
        const sessionGroupsMap = useStore ? useStore((s) => s.sessionGroups) || {} : {};
        const prefsMap = useStore ? useStore((s) => s.prefs) || {} : {};
        const stylingMap = useStore ? useStore((s) => s.styling) || {} : {};
        const compactChains = prefsMap.compactChains !== false;
        const { mode: viewMode, dir: timeDirection, sortOrder, archivedFilter } = viewStateOf(prefsMap);
        const timeSorted = viewMode === "time";
        const automaticSort = timeSorted || sortOrder === "latest";
        const groupedView = viewMode === "projects" || viewMode === "workspaces";
        const pinnedList = useStore ? useStore((s) => s.pinned) || [] : [];
        const statusPulse = prefsMap.statusPulse !== false;
        const statusDots = prefsMap.statusDots !== false;
        const archivedSet = new Set(archivedSessionIds || []);
        const runningOf = (id) => {
          const status = statuses && typeof statuses.get === "function" ? statuses.get(id) : void 0;
          if (status && status.running !== void 0) return status.running === true;
          const summary = list && list.byId ? list.byId[id] : void 0;
          return !!(summary && summary.running === true);
        };
        const subCounts = React.useMemo(
          () => subagentRunningCounts(list ? list.byId : {}, statuses ? runningOf : null),
          [list ? list.byId : null, statuses]
        );
        const pinnedSet = new Set(pinnedList.map(String).filter((id) => !archivedSet.has(id)));
        const workspaceTitleOf = (workspaceId) => {
          const workspace = (items || []).find((w) => w.workspaceId === workspaceId);
          if (!workspace) return "";
          const segs = splitTitleSegs(workspace.title);
          return segs.length > 0 ? segs[segs.length - 1] : workspace.leaf || "";
        };
        const [query, setQuery] = React.useState("");
        const [searchOpen, setSearchOpen] = React.useState(false);
        const [flowOpen, setFlowOpen] = React.useState(false);
        const [flowParent, setFlowParent] = React.useState("");
        const [dialog, setDialog] = React.useState(null);
        const [ctx, setCtx] = React.useState(null);
        const [ctxSubmenu, setCtxSubmenu] = React.useState(null);
        const [customize, setCustomize] = React.useState(null);
        const [errorText, setErrorText] = React.useState(null);
        const [drag, setDrag] = React.useState(null);
        const [deleteAvailable, setDeleteAvailable] = React.useState(typeof deleteSession === "function" && !checkDelete);
        const [deleting, setDeleting] = React.useState(false);
        const deletingRef = React.useRef(false);
        const [notice, setNotice] = React.useState(null);
        const ownMenuRoot = React.useRef(null);
        React.useEffect(() => {
          const ownContextMenu = (event) => {
            if (!event.target || typeof event.target.closest !== "function") return;
            const row = event.target.closest("[data-bw-context]");
            if (row && ownMenuRoot.current && ownMenuRoot.current.contains(row)) event.preventDefault();
          };
          window.addEventListener("contextmenu", ownContextMenu, true);
          return () => window.removeEventListener("contextmenu", ownContextMenu, true);
        }, []);
        React.useEffect(() => {
          if (!ctx || ctx.kind !== "session" || typeof checkDelete !== "function") return;
          let alive = true;
          Promise.resolve().then(checkDelete).then((available) => {
            if (alive) setDeleteAvailable(available === true);
          }).catch(() => {
            if (alive) setDeleteAvailable(false);
          });
          return () => {
            alive = false;
          };
        }, [ctx, checkDelete]);
        React.useEffect(() => {
          if (!notice) return;
          const timer = setTimeout(() => setNotice(null), 2500);
          return () => clearTimeout(timer);
        }, [notice]);
        const wsDragArmTimer = React.useRef(null);
        const blankSeenRef = React.useRef(null);
        const humanTouchedRef = React.useRef(null);
        const autoStableRef = React.useRef(null);
        const stableTimerRef = React.useRef(null);
        const [stableTick, setStableTick] = React.useState(0);
        const TITLE_STABLE_MS = 2e4;
        const renameByUser = (sessionId, title) => {
          if (humanTouchedRef.current === null) humanTouchedRef.current = /* @__PURE__ */ new Set();
          humanTouchedRef.current.add(String(sessionId));
          if (autoStableRef.current) autoStableRef.current.delete(String(sessionId));
          return renameSession(sessionId, title);
        };
        React.useEffect(() => {
          if (!list || !list.byId || typeof renameSession !== "function") return;
          if (blankSeenRef.current === null) blankSeenRef.current = /* @__PURE__ */ new Set();
          if (humanTouchedRef.current === null) humanTouchedRef.current = /* @__PURE__ */ new Set();
          if (autoStableRef.current === null) autoStableRef.current = /* @__PURE__ */ new Map();
          const blankSeen = blankSeenRef.current;
          const touched = humanTouchedRef.current;
          const stable = autoStableRef.current;
          const now2 = Date.now();
          const fixes = [];
          let deadline = Infinity;
          for (const id of Object.keys(list.byId)) {
            const summary = list.byId[id];
            if (!summary) continue;
            if (summary.blank) {
              blankSeen.add(id);
              stable.delete(id);
              continue;
            }
            if (!blankSeen.has(id) || touched.has(id)) {
              stable.delete(id);
              continue;
            }
            const text = String(summary.title || "");
            if (text.trim() === "" || text.includes("\u201C") || text.includes('"') || !text.includes("/")) {
              stable.delete(id);
              continue;
            }
            const prev = stable.get(id);
            if (prev && prev.title === text) {
              if (now2 - prev.since >= TITLE_STABLE_MS) {
                stable.delete(id);
                fixes.push([id, "\u201C" + text + "\u201D"]);
              } else {
                deadline = Math.min(deadline, prev.since + TITLE_STABLE_MS);
              }
              continue;
            }
            stable.set(id, { title: text, since: now2 });
            deadline = Math.min(deadline, now2 + TITLE_STABLE_MS);
          }
          for (const id of Array.from(stable.keys())) {
            if (!list.byId[id]) stable.delete(id);
          }
          if (stableTimerRef.current !== null) {
            clearTimeout(stableTimerRef.current);
            stableTimerRef.current = null;
          }
          if (deadline !== Infinity) {
            stableTimerRef.current = setTimeout(() => {
              stableTimerRef.current = null;
              setStableTick((t2) => t2 + 1);
            }, Math.max(1, deadline - now2));
          }
          if (fixes.length === 0) return;
          Promise.resolve().then(async () => {
            for (const [id, next] of fixes) await renameSession(id, next);
          }).catch(() => {
          });
        }, [list, stableTick]);
        React.useEffect(() => () => {
          if (stableTimerRef.current !== null) clearTimeout(stableTimerRef.current);
        }, []);
        const seenIdsRef = React.useRef(null);
        React.useEffect(() => {
          if (!list || !list.byId) return;
          if (seenIdsRef.current === null) seenIdsRef.current = /* @__PURE__ */ new Set();
          const seen = seenIdsRef.current;
          const current = new Set(Object.keys(list.byId));
          const pinnedNow = new Set((Array.isArray(pinnedList) ? pinnedList : []).map(String));
          if (pinnedNow.size > 0) {
            for (const id of Array.from(seen)) {
              if (!current.has(id) && pinnedNow.has(id)) actions.togglePin(id);
            }
          }
          for (const id of current) seen.add(id);
        }, [list, pinnedList]);
        const normalizedQuery = query.trim().toLowerCase();
        const now = Date.now();
        React.useEffect(() => {
          if (wsDragArmTimer.current !== null) {
            clearTimeout(wsDragArmTimer.current);
            wsDragArmTimer.current = null;
          }
          setDrag(null);
          return () => {
            if (wsDragArmTimer.current !== null) clearTimeout(wsDragArmTimer.current);
          };
        }, [viewMode, sortOrder, archivedFilter, normalizedQuery]);
        const fail = (text) => {
          setFlowOpen(false);
          setDialog(null);
          setNotice(null);
          setErrorText(String(text || "unknown error"));
        };
        const styleEntry = (key) => stylingMap[key] || null;
        const rowStyleOf = (key) => {
          const entry = styleEntry(key);
          if (!entry || !entry.color) return null;
          const glow = Number(entry.glow) || 0;
          const weight = Number(entry.weight) || 0;
          const shadow = entry.shadow === true;
          const shadows = [];
          if (glow > 0) shadows.push("0 0 " + glow + "px " + entry.color);
          if (shadow) shadows.push("1px 1px 2px rgba(0,0,0,.85)");
          return {
            color: entry.color,
            fontWeight: weight > 0 ? weight : void 0,
            textShadow: shadows.length > 0 ? shadows.join(",") : void 0
          };
        };
        const keyOf = (kind, payload) => {
          if (kind === "folder") return "folder:" + payload.path;
          if (kind === "workspace") return "workspace:" + payload.workspaceId;
          if (kind === "session") return "session:" + payload.id;
          if (kind === "sgroup") return "sgroup:" + payload.workspaceId + "|" + payload.path;
          return String(kind);
        };
        const {
          searching,
          accounted,
          workspaceIndexOf,
          sessionRowOf,
          ungrouped,
          sectionedSessions,
          visibleItems,
          workspaceRecency,
          recency,
          projectItems,
          tree,
          sessionsOf,
          searchAgent,
          searched,
          nodePulseOf,
          wsPulseOf,
          wsAllPulseOf,
          folderPulseOf,
          folderExpanded,
          sessionsOpenOf,
          sessionGroupOpen
        } = createBrowserModel({
          normalizedQuery,
          items,
          list,
          archivedSet,
          archivedFilter,
          subCounts,
          pending,
          statuses,
          t,
          sessionSectionOf,
          drag,
          sortOrder,
          viewMode,
          storeFolders,
          compactChains,
          workspaceGroupOf,
          statusPulse,
          expandedMap,
          sessionsExpandedMap,
          sessionGroupsMap
        });
        React.useEffect(() => {
          if (!tabsHost) return void 0;
          const host = tabsHost;
          host.openSessionMenu = (sessionId, event) => {
            const summary = list && list.byId ? list.byId[sessionId] : void 0;
            if (!summary) return;
            openCtx("session", summary, event);
          };
          return () => {
            host.openSessionMenu = null;
          };
        }, [list]);
        const openCtx = (kind, payload, e) => {
          if (e) e.preventDefault();
          setCtxSubmenu(null);
          setCtx({ kind, payload, x: e.clientX, y: e.clientY });
        };
        const {
          assignSessionSection,
          assignWorkspaceGroup,
          copySessionText,
          findTreeNode,
          submitFolderDelete,
          submitFolderNew,
          submitFolderRename,
          submitSessionDelete,
          submitSessionGroupRename,
          submitSessionRename,
          submitWorkspaceDelete,
          submitWorkspaceGroup,
          submitWorkspaceRename
        } = createActions({
          actions,
          deleteAvailable,
          deleteSession,
          deleteWorkspace,
          deletingRef,
          fail,
          items,
          list,
          pinnedList,
          refreshSessions,
          renameByUser,
          renameWorkspace,
          sessionsOf,
          setDeleting,
          setDialog,
          setErrorText,
          setNotice,
          storeFolders,
          t,
          tree,
          workspaceGroupIds,
          workspaceGroupOf,
          workspaceGroups,
          workspaceIndexOf
        });
        const {
          canDragWorkspace,
          canMoveWorkspaceGroup,
          canReorderSessions,
          canReorderWorkspaces,
          commitSessionDrop,
          commitSessionMoveInto,
          commitWorkspaceDrop,
          commitWorkspaceMoveInto,
          dragMatches,
          folderDropEvents,
          nextWorkspaceAfter,
          rowHalf,
          sessDropHalf,
          sessionDragEvents,
          sessionDraggable,
          sgroupDropEvents,
          sgroupDropInto,
          workspaceDragEvents,
          workspaceGroupDropEvents,
          wsDropHalf,
          wsDropInto
        } = createDnd({
          archivedSet,
          assignSessionSection,
          assignWorkspaceGroup,
          automaticSort,
          drag,
          fail,
          findTreeNode,
          groupedView,
          insertSessionBefore,
          insertWorkspaceBefore,
          items,
          pinnedSet,
          recency,
          renameByUser,
          renameWorkspace,
          searching,
          sessionsOf,
          setDrag,
          tree,
          viewMode,
          visibleItems,
          workspaceGroupOf,
          workspaceGroups,
          wsDragArmTimer
        });
        const {
          bodyRows,
          isEmpty,
          matchesSession,
          pinnedTray,
          renderCustomWorkspaceGroups,
          renderPinnedSection,
          renderPlainFolder,
          renderProjectsHeader,
          renderSearchedFolder,
          renderSectionedSession,
          renderSessionNode,
          renderSessionRow,
          renderSessionTree,
          renderTimeBuckets,
          renderWorkspaceEntry,
          restoreSession,
          searchSessionNode,
          sectionRowsOf
        } = createTreeView({
          actions,
          tabs: storeTabs,
          archivedFilter,
          canMoveWorkspaceGroup,
          drag,
          expandedMap,
          fail,
          folderDropEvents,
          folderExpanded,
          folderPulseOf,
          groupedView,
          items,
          list,
          nodePulseOf,
          normalizedQuery,
          now,
          open,
          openCtx,
          phase,
          pinnedList,
          pinnedSet,
          projectItems,
          recency,
          rowStyleOf,
          searchAgent,
          searched,
          searching,
          sectionedSessions,
          sessDropHalf,
          sessionDragEvents,
          sessionDraggable,
          sessionGroupOpen,
          sessionRowOf,
          sessionSectionOf,
          sessionsOf,
          sessionsOpenOf,
          setErrorText,
          sgroupDropEvents,
          sgroupDropInto,
          sortOrder,
          startSession,
          statusPulse,
          statusDots,
          styleEntry,
          t,
          timeDirection,
          timeSorted,
          tree,
          unarchiveSession,
          ungrouped,
          viewMode,
          visibleItems,
          workspaceDragEvents,
          workspaceGroupDropEvents,
          workspaceGroupOf,
          workspaceGroups,
          workspaceIndexOf,
          workspaceTitleOf,
          wsDropHalf,
          wsDropInto,
          wsPulseOf
        });
        const {
          ctxItems,
          handleCtxPick
        } = createMenu({
          actions,
          archiveSession,
          archivedFilter,
          assignSessionSection,
          assignWorkspaceGroup,
          automaticSort,
          copySessionText,
          ctx,
          deleteAvailable,
          deleting,
          fail,
          forkSession,
          items,
          keyOf,
          openDirectory,
          pinnedSet,
          refreshPage,
          renameSession,
          restoreSession,
          setCtx,
          setCtxSubmenu,
          setCustomize,
          setDialog,
          setDrag,
          setFlowOpen,
          setFlowParent,
          storeFolders,
          t,
          timeDirection,
          timeSorted,
          unarchiveSession,
          viewMode
        });
        const { render: renderLayout } = createLayout({
          actions,
          bodyRows,
          createWorkspace,
          ctx,
          ctxItems,
          ctxSubmenu,
          customize,
          deleting,
          deletingRef,
          dialog,
          errorText,
          expandSidebar,
          fail,
          flowOpen,
          flowParent,
          handleCtxPick,
          items,
          notice,
          ownMenuRoot,
          pickDirectory,
          query,
          renameWorkspace,
          searchOpen,
          sessionSectionOf,
          setCtx,
          setCtxSubmenu,
          setCustomize,
          setDialog,
          setErrorText,
          setFlowOpen,
          setFlowParent,
          setQuery,
          setSearchOpen,
          styleEntry,
          submitFolderDelete,
          submitFolderNew,
          submitFolderRename,
          submitSessionDelete,
          submitSessionGroupRename,
          submitSessionRename,
          submitWorkspaceDelete,
          submitWorkspaceGroup,
          submitWorkspaceRename,
          t,
          useStore,
          useWorkspaces,
          viewMode,
          wide: wide === true,
          workspaceGroupOf,
          workspaceGroups,
          workspaceIndexOf
        });
        return renderLayout();
      }
      const flowSource = (slots, hole) => ({
        getSnapshot: () => {
          try {
            return slots.entries(hole).length > 0;
          } catch {
            return false;
          }
        },
        subscribe: (listener) => {
          try {
            return slots.subscribe(hole, listener);
          } catch {
            return () => {
            };
          }
        }
      });
      function apply(ctx) {
        const slots = ctx.get("slots");
        if (slots === void 0 || typeof slots.register !== "function") {
          console.error("[dsh-workspace-plus] slots service unavailable; plugin idle");
          return;
        }
        const sessions = ctx.get("sessions");
        const workspaces = ctx.get("workspaces");
        const uiWorkspace = ctx.get("uiWorkspace");
        if (!sessions || !workspaces || !uiWorkspace) {
          console.error("[dsh-workspace-plus] required services missing", {
            sessions: !!sessions,
            workspaces: !!workspaces,
            uiWorkspace: !!uiWorkspace
          });
          return;
        }
        if (ctx.locale && typeof ctx.locale.register === "function") {
          ctx.effect(() => {
            try {
              return ctx.locale.register(NS, { zh, en });
            } catch (localeError) {
              console.warn("[dsh-workspace-plus] dictionary registration failed", localeError);
              return () => {
              };
            }
          }, "better-workspace: dictionaries");
        }
        const searchSessions = async (query, signal) => {
          const result = await sessions.search(query, signal);
          if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : "session search failed");
          return result.value;
        };
        const renameSession = async (sessionId, title) => {
          const binding = sessions.binding(sessionId);
          const session = binding && binding.session;
          if (!session) throw new Error('unknown session "' + sessionId + '"');
          const result = await session.rename(title);
          if (!result || !result.ok) throw new Error(result && result.error ? result.error.message : "session rename failed");
        };
        const openSessionCompat = (sessionId) => {
          if (uiWorkspace && typeof uiWorkspace.openSession === "function") return uiWorkspace.openSession(sessionId);
          if (typeof sessions.open === "function") return sessions.open(sessionId);
        };
        const forkSession = (sessionId) => {
          return sessions.fork({ sessionId, increaseTitle: true }).then((childId) => openSessionCompat(childId));
        };
        const browserInjected = () => ({
          startSession: (workspaceId) => {
            uiWorkspace.startSession(workspaceId);
          },
          open: (sessionId) => {
            openSessionCompat(sessionId);
          },
          searchSessions,
          searchResultLimit: sessions.searchResultLimit !== void 0 ? sessions.searchResultLimit : 20,
          renameSession,
          forkSession,
          deleteSession: deleteSessionRecord,
          checkSessionDelete,
          openDirectory: openSessionDirectory,
          refreshSessions: typeof sessions.refresh === "function" ? () => sessions.refresh() : void 0,
          refreshPage: () => window.location.reload(),
          renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
          deleteWorkspace: (workspaceId) => workspaces.delete(workspaceId),
          insertWorkspaceBefore: typeof workspaces.insertBefore === "function" ? (workspaceId, beforeWorkspaceId) => workspaces.insertBefore(workspaceId, beforeWorkspaceId) : void 0,
          // Official contract exposes session reorder through the WORKSPACES
          // service (see dsh ui-workspace client index.ts); feature-probed so
          // older hosts degrade to "group-move only" instead of a TypeError.
          insertSessionBefore: typeof workspaces.insertSessionBefore === "function" ? (workspaceId, sessionId, beforeSessionId) => workspaces.insertSessionBefore(workspaceId, sessionId, beforeSessionId) : void 0,
          archiveSession: (sessionId) => uiWorkspace.archiveSession(sessionId),
          unarchiveSession: typeof uiWorkspace.unarchiveSession === "function" ? (sessionId) => uiWorkspace.unarchiveSession(sessionId) : void 0,
          createWorkspace: (input) => workspaces.create(input),
          pickDirectory: () => uiWorkspace.pickDirectory(),
          hooks: {
            directoryFlow: flowSource(slots, "sidebar.workspaces.directoryFlow")
          }
        });
        const flowInjected = (hole) => () => ({
          createWorkspace: (input) => workspaces.create(input),
          renameWorkspace: (workspaceId, title) => workspaces.rename(workspaceId, title),
          pickDirectory: () => uiWorkspace.pickDirectory(),
          hooks: { directoryFlow: flowSource(slots, hole) }
        });
        const guarded = (slotKey, options, component) => () => {
          try {
            return slots.register(options, (props) => E(QuietBoundary, null, E(component, props)));
          } catch (registerError) {
            console.warn("[dsh-workspace-plus] register skipped for " + slotKey, registerError);
            return void 0;
          }
        };
        const viewStore = createViewStore();
        slots.inject("conversation.hero.workspace.directoryFlow", guarded(
          "conversation.hero.workspace.directoryFlow",
          { name: "conversation.hero.workspace.directoryFlow", store: viewStore, inject: flowInjected("conversation.hero.workspace.directoryFlow"), locale: NS, priority: -1 },
          BetterFlow
        ));
        slots.inject("sidebar.workspaces.directoryFlow", guarded(
          "sidebar.workspaces.directoryFlow",
          { name: "sidebar.workspaces.directoryFlow", store: viewStore, inject: flowInjected("sidebar.workspaces.directoryFlow"), locale: NS, priority: -1 },
          BetterFlow
        ));
        slots.inject("plugins.bundle.config", guarded(
          "plugins.bundle.config",
          {
            name: "plugins.bundle.config",
            key: "dsh-workspace-plus",
            locale: NS,
            store: viewStore
          },
          BetterWorkspaceBundleConfig
        ));
        slots.inject("conversation.header.leading", guarded(
          "conversation.header.leading",
          {
            name: "conversation.header.leading",
            locale: NS,
            // The strip reads the shared view store: the plugin settings page can
            // hide tabs / fall back to native dots, and both must be live here.
            store: viewStore,
            inject: () => ({ open: (sessionId) => {
              openSessionCompat(sessionId);
            } })
          },
          TabsStrip
        ));
        slots.inject("sidebar.workspaces", guarded(
          "sidebar.workspaces",
          {
            name: "sidebar.workspaces",
            priority: -1,
            store: viewStore,
            inject: browserInjected,
            locale: NS
          },
          BetterBrowser
        ));
      }
      return {
        name: "dsh-workspace-plus",
        inject: ["slots", "sessions", "workspaces", "locale", "uiWorkspace"],
        apply
      };
    }
  });
})();
