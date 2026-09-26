// xapi-json-viewer.js — open one xAPI statement, pretty-printed and explained, in a new tab.
//
// Why a new tab and not an inline panel: MicroSims are embedded in fixed-height iframes, so
// an inline panel that grows to fit a ~60-line statement is either clipped or forces the
// iframe taller for everyone; a modal inside the iframe centres on the iframe's viewport,
// which can be off-screen when the reader has scrolled the parent page. A tab has the whole
// screen, can sit beside the sim, and does not disturb the lesson.
//
// Usage (from a click handler, so pop-up blockers allow it):
//   XapiJsonViewer.open(statement, { source: 'Sine Wave MicroSim' });
//
// Nothing here posts anything. The tab is a Blob URL built from the statement in memory.

(function (global) {
  'use strict';

  var EXT = 'https://w3id.org/lrs/ext/';

  // Keys that exist only because of compact mode — highlighted so a student sees at once
  // what a summary adds to an ordinary statement.
  var COMPACT_KEYS = ['statements_represented', 'controls', 'end_reason', 'xapi_mode',
                      'active_ms', 'session_ms', 'interaction_count', 'runs'];

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Colour one line of JSON.stringify(..., null, 2) output. Strings are matched first, so
  // digits inside a UUID or IRI are never mistaken for numbers.
  function colour(line) {
    return esc(line).replace(
      /("(?:\\.|[^"\\])*")(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g,
      function (m, str, colon, lit) {
        if (str) return colon ? '<span class="k">' + str + '</span>' + colon
                              : '<span class="s">' + str + '</span>';
        if (lit) return '<span class="l">' + lit + '</span>';
        return '<span class="n">' + m + '</span>';
      });
  }

  function isCompactLine(line) {
    for (var i = 0; i < COMPACT_KEYS.length; i++) {
      if (line.indexOf('"' + EXT + COMPACT_KEYS[i] + '"') !== -1) return true;
    }
    return false;
  }

  function get(obj, path) {
    return path.split('.').reduce(function (o, k) { return o == null ? undefined : o[k]; }, obj);
  }

  // What each part of the statement means — only rows for fields actually present.
  function legend(st) {
    var rx = (st.result && st.result.extensions) || {};
    var cx = (st.context && st.context.extensions) || {};
    var rows = [
      ['actor', 'Who did it. The real account name enters here and is pseudonymized by the LRS, never by the sim.', st.actor],
      ['verb', 'What kind of act: <code>interacted</code> (a control), <code>experienced</code> (engagement over time), or <code>answered</code> (a question).', st.verb],
      ['object.id', 'Which activity. A page IRI, or page IRI + <code>#fragment</code> for one control on it.', get(st, 'object.id')],
      ['result.duration', 'Engaged time, as an ISO-8601 duration (<code>PT12.5S</code> = 12.5 seconds).', get(st, 'result.duration')],
      ['…/ext/value', 'The control\'s new value.', rx[EXT + 'value']],
      ['…/ext/previous-value', 'The value before this change, so one statement shows the direction of a move.', rx[EXT + 'previous-value']],
      ['…/ext/action', 'Which press of a Start/Pause control this was: <code>start</code> or <code>pause</code>. Carries no duration.', rx[EXT + 'action']],
      ['…/ext/run-ended-by', 'What closed this run interval: <code>paused</code> (the student), or a flush such as <code>tab-hidden</code> or <code>simulated-done</code>.', rx[EXT + 'run-ended-by']],
      ['…/ext/runs', 'Start/Pause run intervals folded into this summary: how many, and their total milliseconds.', rx[EXT + 'runs']],
      ['…/ext/controls', 'Per control, what compact mode folded: <code>n</code> movements, <code>min</code>/<code>max</code>/<code>last</code> value, the <code>concept</code> it is evidence for, and <code>reversals</code> (direction changes — the one thing a summary cannot recover later, because it has no order).', rx[EXT + 'controls']],
      ['…/ext/end_reason', 'Why the session ended: <code>simulated-done</code>, <code>tab-hidden</code>, <code>scrolled-away</code>, <code>idle</code>, <code>mode-switch</code>, …', rx[EXT + 'end_reason']],
      ['…/ext/active_ms', 'Milliseconds the student was plausibly engaged during the session.', rx[EXT + 'active_ms']],
      ['…/ext/concept_id', 'The concept this statement is evidence for. Mastery is rolled up per concept.', cx[EXT + 'concept_id']],
      ['…/ext/statements_represented', 'How many full-mode statements this one summary stands for.', cx[EXT + 'statements_represented']],
      ['context.contextActivities.grouping', 'The textbook and version the activity was used in.', get(st, 'context.contextActivities.grouping')]
    ];
    return rows.filter(function (r) { return r[2] !== undefined; }).map(function (r) {
      return '<tr><th><code>' + r[0] + '</code></th><td>' + r[1] + '</td></tr>';
    }).join('');
  }

  function page(st, opts) {
    var json = JSON.stringify(st, null, 2);
    var lines = json.split('\n');
    var body = lines.map(function (l, i) {
      return '<span class="ln' + (isCompactLine(l) ? ' hl' : '') + '"><span class="no">' +
        (i + 1) + '</span>' + colour(l) + '</span>';
    }).join('');   // each .ln is a block already; a '\n' here would double-space the <pre>

    var verb = get(st, 'verb.display.en-US') || get(st, 'verb.id') || 'statement';
    var name = get(st, 'object.definition.name.en-US') || get(st, 'object.id') || '';
    var represented = get(st, 'context.extensions')
      ? st.context.extensions[EXT + 'statements_represented'] : undefined;
    var compact = represented !== undefined;

    var banner = compact
      ? '<div class="banner">This <b>one</b> compact summary stands for <b>' + esc(represented) +
        '</b> full-mode statement' + (represented === 1 ? '' : 's') + '. The highlighted lines ' +
        'are what compact mode adds; everything else is an ordinary xAPI statement.</div>'
      : '<div class="banner plain">A full-mode statement: one act, sent as it happened.</div>';

    // Embed the JSON for the Copy/Download buttons; escape '<' so no string can close <script>.
    var data = JSON.stringify(json).replace(/</g, '\\u003c');

    return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      '<title>xAPI ' + esc(verb) + ' — ' + esc(name) + '</title><style>' +
      ':root{--bg:#fbfbfd;--fg:#1d1d24;--muted:#5d5d6b;--panel:#fff;--line:#e3e3ea;' +
      '--k:#7a3e9d;--s:#1c6b3a;--n:#b3541e;--l:#1f5fa8;--hl:#fff4c2;--no:#a0a0ad;--ban:#eef4ff;--banb:#b7cdf5}' +
      '@media (prefers-color-scheme: dark){:root{--bg:#16161b;--fg:#e8e8ee;--muted:#a3a3b2;' +
      '--panel:#1e1e25;--line:#33333d;--k:#d6a4f5;--s:#8fd6a5;--n:#f2ad7c;--l:#8fb8f2;' +
      '--hl:#4a3f12;--no:#6b6b78;--ban:#1d2a44;--banb:#34507f}}' +
      'body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 -apple-system,Segoe UI,Arial,sans-serif}' +
      '.wrap{max-width:1100px;margin:0 auto;padding:20px 16px 40px}' +
      'h1{font-size:20px;margin:0 0 2px}.sub{color:var(--muted);font-size:13px;margin-bottom:14px}' +
      '.banner{background:var(--ban);border:1px solid var(--banb);border-radius:8px;padding:10px 12px;margin-bottom:14px}' +
      '.bar{display:flex;gap:8px;margin-bottom:10px}button{font:inherit;font-size:13px;padding:5px 12px;' +
      'border:1px solid var(--line);border-radius:6px;background:var(--panel);color:var(--fg);cursor:pointer}' +
      '.grid{display:grid;grid-template-columns:minmax(0,3fr) minmax(0,2fr);gap:16px}' +
      '@media (max-width:820px){.grid{grid-template-columns:1fr}}' +
      'pre{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:8px;padding:10px 0;' +
      'overflow-x:auto;font:13px/1.55 SFMono-Regular,Menlo,Consolas,monospace}' +
      // Long IRIs wrap instead of being cut off; the hanging indent keeps continuation
      // lines clear of the line-number gutter.
      '.ln{display:block;padding:0 12px 0 46px;text-indent:-46px;white-space:pre-wrap;' +
      'overflow-wrap:anywhere}.ln.hl{background:var(--hl)}' +
      '.no{display:inline-block;width:34px;text-indent:0;text-align:right;margin-right:12px;' +
      'color:var(--no);user-select:none}' +
      '.k{color:var(--k)}.s{color:var(--s)}.n{color:var(--n)}.l{color:var(--l)}' +
      'table{width:100%;border-collapse:collapse;background:var(--panel);border:1px solid var(--line);border-radius:8px;font-size:13px}' +
      'th,td{text-align:left;vertical-align:top;padding:7px 9px;border-bottom:1px solid var(--line)}' +
      'th code{white-space:nowrap}code{font-family:SFMono-Regular,Menlo,Consolas,monospace;font-size:12px}' +
      'h2{font-size:15px;margin:0 0 8px}.foot{color:var(--muted);font-size:12px;margin-top:16px}' +
      '</style></head><body><div class="wrap">' +
      '<h1>xAPI statement: <code>' + esc(verb) + '</code> ' + esc(name) + '</h1>' +
      '<div class="sub">From ' + esc(opts.source || 'a MicroSim') + ' · ' + esc(st.timestamp || '') +
      ' · id ' + esc(st.id || '(assigned by the LRS)') + '</div>' + banner +
      '<div class="grid"><div><div class="bar"><button id="copy">Copy JSON</button>' +
      '<button id="dl">Download .json</button><span id="msg" class="sub"></span></div>' +
      '<pre>' + body + '</pre></div>' +
      '<div><h2>How to read it</h2><table>' + legend(st) + '</table></div></div>' +
      '<div class="foot">Generated in your browser by the MicroSim. Nothing was sent to a server.</div>' +
      '</div><script>(function(){var j=' + data + ';' +
      'document.getElementById("copy").onclick=function(){navigator.clipboard.writeText(j).then(' +
      'function(){document.getElementById("msg").textContent="Copied."})};' +
      'document.getElementById("dl").onclick=function(){var a=document.createElement("a");' +
      'a.href=URL.createObjectURL(new Blob([j],{type:"application/json"}));' +
      'a.download="xapi-statement.json";a.click()};})();</script></body></html>';
  }

  function open(statement, opts) {
    var url = URL.createObjectURL(new Blob([page(statement, opts || {})], { type: 'text/html' }));
    // Not revoked: a few KB, and revoking would break reloading the tab.
    return global.open(url, '_blank');
  }

  global.XapiJsonViewer = { open: open, page: page };
})(typeof window !== 'undefined' ? window : this);
