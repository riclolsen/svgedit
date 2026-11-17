/**
 * Tag picker for the SCADA animation dialogs: filter-as-you-type suggestions
 * under a tag field and a modal to browse the tag address space
 * (group1 > group2 > group3 > tags) of the JSON-SCADA server.
 *
 * Data comes from the JSON-SCADA server that serves the editor (same origin,
 * session cookie): `/Invoke/auth/listTags` (admin route, paged, regex filter)
 * and the `/Invoke/` unique group1 values service. Without a server or
 * without admin rights, the fields stay plain text inputs.
 */

const LIST_TAGS_URL = '/Invoke/auth/listTags'
const INVOKE_URL = '/Invoke/'
const SUGGEST_LIMIT = 20
const SEARCH_LIMIT = 500
const GROUP_PAGE = 1000
const GROUP_MAX = 20000
const MAX_REGEX = 200 // server limit for a $regex filter
const TYPING_DELAY = 250 // ms
const SERVICE_UNIQUE_VALUES = 100000001 // Extended_RequestUniqueAttributeValues
const SERVICE_UNIQUE_VALUES_RESP = 100000002 // Extended_ResponseUniqueAttributeValues
const ATTR_GROUP1 = 100000001 // ExtendedGroup1
const STATUS_GOOD = 0

const Z_MODAL = 6000
const Z_SUGGEST = 6500

let stylesAdded = false
function addStyles () {
  if (stylesAdded) return
  stylesAdded = true
  const style = document.createElement('style')
  style.textContent = `
    .scada-tag-field { display: flex; gap: 2px; width: 100%; }
    .scada-tag-field input { flex: 1; min-width: 0; width: auto !important; }
    .scada-tag-field .scada-tag-browse {
      flex-shrink: 0; padding: 0 6px; border: 1px solid #ccc; background: #fff; color: #555;
      display: flex; align-items: center; justify-content: center;
    }
    .scada-tag-field .scada-tag-browse:hover { background: #e1f5fe; border-color: #03a9f4; }
    .scada-tag-suggest {
      position: fixed; z-index: ${Z_SUGGEST}; background: #fff; border: 1px solid #aaa;
      border-radius: 4px; box-shadow: 0 6px 12px rgba(0,0,0,0.2); max-height: 260px; overflow-y: auto;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 12px; min-width: 240px;
    }
    .scada-tag-suggest div { padding: 4px 8px; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .scada-tag-suggest div.active, .scada-tag-suggest div:hover { background: #e1f5fe; }
    .scada-tag-suggest b { font-family: 'Consolas', monospace; font-weight: 600; color: #333; }
    .scada-tag-suggest small { color: #888; margin-left: 6px; }
    .scada-tag-suggest .info { color: #888; cursor: default; background: none !important; }
    .scada-tag-modal-bg {
      position: fixed; inset: 0; z-index: ${Z_MODAL}; background: rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; font-size: 13px;
    }
    .scada-tag-modal {
      background: #f8f8f8; border-radius: 8px; box-shadow: 0 8px 24px rgba(0,0,0,0.3);
      width: min(960px, 95vw); height: min(640px, 90vh); display: flex; flex-direction: column; padding: 12px; box-sizing: border-box;
    }
    .scada-tag-modal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .scada-tag-modal header strong { font-size: 1.15em; color: #333; }
    .scada-tag-modal header button { background: none; border: none; font-size: 20px; color: #999; cursor: pointer; }
    .scada-tag-modal .bar { display: flex; gap: 6px; margin-bottom: 8px; }
    .scada-tag-modal .bar input, .scada-tag-modal .bar select {
      border: 1px solid #ccc; border-radius: 4px; padding: 6px; font-size: 13px; box-sizing: border-box;
    }
    .scada-tag-modal .bar input { flex: 1; min-width: 0; }
    .scada-tag-modal .body { flex: 1; display: flex; gap: 8px; min-height: 0; }
    .scada-tag-modal .tree, .scada-tag-modal .list {
      background: #fff; border: 1px solid #ddd; border-radius: 4px; overflow: auto;
    }
    .scada-tag-modal .tree { width: 32%; min-width: 180px; padding: 4px 0; }
    .scada-tag-modal .list { flex: 1; }
    .scada-tag-modal .node { padding: 3px 6px; cursor: pointer; white-space: nowrap; user-select: none; }
    .scada-tag-modal .node:hover { background: #f0f8ff; }
    .scada-tag-modal .node.sel { background: #e1f5fe; font-weight: 600; }
    .scada-tag-modal .node .tw { display: inline-block; width: 14px; color: #888; }
    .scada-tag-modal .node .cnt { color: #999; font-size: 0.85em; margin-left: 4px; }
    .scada-tag-modal table { border-collapse: collapse; width: 100%; }
    .scada-tag-modal th {
      position: sticky; top: 0; background: #eee; text-align: left; padding: 5px 6px; font-weight: 600; color: #555;
      border-bottom: 1px solid #ddd;
    }
    .scada-tag-modal td { padding: 4px 6px; border-bottom: 1px solid #f0f0f0; white-space: nowrap; max-width: 320px; overflow: hidden; text-overflow: ellipsis; }
    .scada-tag-modal td.tag { font-family: 'Consolas', monospace; }
    .scada-tag-modal tbody tr { cursor: pointer; }
    .scada-tag-modal tbody tr:hover { background: #f0f8ff; }
    .scada-tag-modal tbody tr.sel { background: #e1f5fe; }
    .scada-tag-modal .msg { padding: 12px; color: #888; text-align: center; }
    .scada-tag-modal footer { display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-top: 8px; }
    .scada-tag-modal footer .status { color: #888; font-size: 0.9em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .scada-tag-modal footer .picked { font-family: 'Consolas', monospace; color: #01579b; }
    .scada-tag-modal footer button { padding: 6px 14px; border-radius: 4px; cursor: pointer; border: 1px solid #ccc; background: #fff; }
    .scada-tag-modal footer button.ok { background: #e1f5fe; border-color: #03a9f4; color: #01579b; font-weight: 600; }
    .scada-tag-modal footer button:disabled { opacity: 0.5; cursor: default; }
  `
  document.head.appendChild(style)
}

// --- server access ------------------------------------------------------------

/** Error with a text for the user. */
class TagSourceError extends Error {}

async function postJson (url, body) {
  let resp
  try {
    resp = await fetch(url, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch (e) {
    throw new TagSourceError('JSON-SCADA server not reachable.')
  }
  if (resp.status === 401 || resp.status === 403) {
    throw new TagSourceError('Listing tags requires a JSON-SCADA user with admin rights.')
  }
  if (!resp.ok) throw new TagSourceError(`Server error (HTTP ${resp.status}).`)
  let json
  try {
    json = await resp.json()
  } catch (e) {
    throw new TagSourceError('JSON-SCADA server not reachable (no JSON answer).')
  }
  if (json && json.error) throw new TagSourceError(String(json.error))
  return json
}

/**
 * Case-insensitive regex for a typed filter: a substring match where `*`
 * matches any characters. Null when nothing was typed.
 */
export function filterRegex (text) {
  const t = String(text || '').trim()
  if (!t) return null
  const re = t.split('*').map(s => s.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')
  return re.length > MAX_REGEX ? null : re
}

async function listTags (filter, limit, page = 1) {
  const json = await postJson(LIST_TAGS_URL, {
    itemsPerPage: limit,
    page,
    sortBy: [{ key: 'tag', order: 'asc' }],
    filter
  })
  return { tags: json.tags || [], total: json.countTotal || 0 }
}

/** Tags whose `field` (tag or description) matches the typed text. */
export async function searchTags (text, { field = 'tag', group1 = null, limit = SUGGEST_LIMIT } = {}) {
  const re = filterRegex(text)
  const filter = {}
  if (re) filter[field] = { $regex: re, $options: 'i' }
  if (group1 !== null) filter.group1 = group1
  return listTags(filter, limit)
}

async function listGroup1 () {
  const handle = Math.floor(Math.random() * 1e9)
  const json = await postJson(INVOKE_URL, {
    ServiceId: SERVICE_UNIQUE_VALUES,
    Body: {
      RequestHeader: {
        Timestamp: new Date().toISOString(),
        RequestHandle: handle,
        TimeoutHint: 5000,
        ReturnDiagnostics: 2,
        AuthenticationToken: null
      },
      AttributeId: ATTR_GROUP1
    }
  })
  if (json?.ServiceId !== SERVICE_UNIQUE_VALUES_RESP ||
    json?.Body?.ResponseHeader?.ServiceResult !== STATUS_GOOD) {
    throw new TagSourceError('Could not list the tag groups.')
  }
  return (json.Body.Results || [])
    .map(r => ({ name: r?.Value?.Body ?? '', count: r?.Value?.Count ?? 0 }))
    .filter(g => typeof g.name === 'string')
}

/** All tags of a group1 (up to GROUP_MAX). */
async function listGroupTags (group1) {
  const tags = []
  let total = 0
  for (let page = 1; tags.length < GROUP_MAX; page++) {
    const r = await listTags({ group1 }, GROUP_PAGE, page)
    total = r.total
    tags.push(...r.tags)
    if (r.tags.length < GROUP_PAGE || tags.length >= total) break
  }
  return { tags, total }
}

// --- filter as you type ---------------------------------------------------------

/**
 * Turns a text input into a tag field: suggestions while typing and a browse
 * button opening the address space modal. A picked tag is written to the input
 * and a `change` event is dispatched, so existing change handlers save it.
 * @param {HTMLInputElement} input
 * @returns {HTMLElement} the element to insert in place of the input
 */
export function makeTagField (input) {
  addStyles()
  const wrap = document.createElement('div')
  wrap.className = 'scada-tag-field'
  input.autocomplete = 'off'
  input.spellcheck = false

  const browse = document.createElement('button')
  browse.type = 'button'
  browse.className = 'scada-tag-browse'
  browse.title = 'Browse tags'
  browse.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h7l2 2h9v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1z"/><circle cx="15" cy="14" r="2.5"/><path d="m17 16 2 2"/></svg>'

  wrap.appendChild(input)
  wrap.appendChild(browse)

  const commit = (tag) => {
    input.value = tag
    input.dispatchEvent(new Event('change'))
  }

  browse.onclick = async () => {
    close()
    const tag = await openTagBrowser(input.value)
    if (tag !== null) commit(tag)
    input.focus()
  }

  let box = null
  let items = []
  let active = -1
  let timer = null
  let seq = 0

  const place = () => {
    if (!box) return
    const r = input.getBoundingClientRect()
    box.style.left = `${r.left}px`
    box.style.top = `${r.bottom + 2}px`
    box.style.width = `${Math.max(r.width + browse.offsetWidth, 240)}px`
  }
  const onScroll = (e) => {
    if (box && !box.contains(e.target)) place()
  }

  function close () {
    clearTimeout(timer)
    seq++
    if (box) {
      box.remove()
      box = null
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', place)
    }
    items = []
    active = -1
  }

  const highlight = (i) => {
    if (!box) return
    const rows = box.querySelectorAll('div[data-i]')
    rows.forEach(el => el.classList.toggle('active', Number(el.dataset.i) === i))
    active = i
    rows[i]?.scrollIntoView({ block: 'nearest' })
  }

  const render = (list, total, info) => {
    if (!document.body.contains(input)) return close()
    if (!box) {
      box = document.createElement('div')
      box.className = 'scada-tag-suggest'
      // keep the focus in the input while clicking a suggestion
      box.addEventListener('mousedown', e => e.preventDefault())
      document.body.appendChild(box)
      window.addEventListener('scroll', onScroll, true)
      window.addEventListener('resize', place)
    }
    box.innerHTML = ''
    items = list
    active = -1
    list.forEach((t, i) => {
      const row = document.createElement('div')
      row.dataset.i = i
      const b = document.createElement('b')
      b.textContent = t.tag
      row.appendChild(b)
      if (t.description) {
        const s = document.createElement('small')
        s.textContent = t.description
        row.appendChild(s)
      }
      row.title = t.description ? `${t.tag} - ${t.description}` : t.tag
      row.onclick = () => {
        close()
        commit(t.tag)
      }
      box.appendChild(row)
    })
    const more = total > list.length ? `${total - list.length} more, keep typing or browse…` : ''
    if (info || more) {
      const row = document.createElement('div')
      row.className = 'info'
      row.textContent = info || more
      box.appendChild(row)
    }
    place()
  }

  const query = () => {
    clearTimeout(timer)
    const text = input.value
    if (!filterRegex(text)) return close()
    const my = ++seq
    timer = setTimeout(async () => {
      try {
        const { tags, total } = await searchTags(text, { limit: SUGGEST_LIMIT })
        if (my !== seq) return
        if (tags.length === 0) return render([], 0, 'No matching tags.')
        // an exact entry needs no suggestion
        if (tags.length === 1 && tags[0].tag === text) return close()
        render(tags, total)
      } catch (e) {
        // no server or no rights: a plain text field
        if (my === seq) close()
      }
    }, TYPING_DELAY)
  }

  input.addEventListener('input', query)
  input.addEventListener('blur', () => close())
  input.addEventListener('keydown', (e) => {
    if (e.key === 'F2' || (e.key === ' ' && e.ctrlKey)) {
      e.preventDefault()
      browse.click()
      return
    }
    if (!box || items.length === 0) {
      if (e.key === 'ArrowDown' && filterRegex(input.value)) query()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      highlight((active + 1) % items.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      highlight(active <= 0 ? items.length - 1 : active - 1)
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault()
      const t = items[active]
      close()
      commit(t.tag)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close()
    }
  })

  return wrap
}

// --- address space browser ------------------------------------------------------

/**
 * Opens the modal to browse the tags of the server.
 * @param {string} [current] tag of the field, preselected when found
 * @returns {Promise<string|null>} the picked tag, null when cancelled
 */
export function openTagBrowser (current = '') {
  addStyles()
  return new Promise(resolve => {
    const bg = document.createElement('div')
    bg.className = 'scada-tag-modal-bg'
    bg.innerHTML = `
      <div class="scada-tag-modal" role="dialog" aria-modal="true" aria-label="Browse tags">
        <header><strong>Browse Tags</strong><button type="button" class="x" title="Close">&times;</button></header>
        <div class="bar">
          <input type="search" class="q" placeholder="Filter (* matches anything)" autocomplete="off" spellcheck="false">
          <select class="fld" title="Field to filter">
            <option value="tag">Tag</option>
            <option value="description">Description</option>
          </select>
          <select class="scope" title="Where to search">
            <option value="all">All groups</option>
            <option value="group">Selected group1</option>
          </select>
        </div>
        <div class="body">
          <div class="tree"><div class="msg">Loading…</div></div>
          <div class="list"></div>
        </div>
        <footer>
          <span class="status"></span>
          <span style="display:flex; gap:8px; align-items:center; min-width:0;">
            <span class="picked"></span>
            <button type="button" class="cancel">Cancel</button>
            <button type="button" class="ok" disabled>Select</button>
          </span>
        </footer>
      </div>`
    document.body.appendChild(bg)

    const $ = s => bg.querySelector(s)
    const q = $('.q')
    const fld = $('.fld')
    const scope = $('.scope')
    const tree = $('.tree')
    const list = $('.list')
    const status = $('.status')
    const picked = $('.picked')
    const ok = $('.ok')

    let selected = null // picked tag name
    let groupSel = null // { g1, g2, g3 } selected tree node
    const groupCache = new Map() // group1 -> { tags, total }
    let listSeq = 0
    let timer = null

    const finish = (val) => {
      clearTimeout(timer)
      listSeq++
      document.removeEventListener('keydown', onKey, true)
      bg.remove()
      resolve(val)
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        finish(null)
      }
    }
    document.addEventListener('keydown', onKey, true)
    $('.x').onclick = () => finish(null)
    $('.cancel').onclick = () => finish(null)
    ok.onclick = () => { if (selected !== null) finish(selected) }
    bg.addEventListener('mousedown', e => { if (e.target === bg) finish(null) })

    const pick = (tag) => {
      selected = tag
      picked.textContent = tag ?? ''
      ok.disabled = tag === null
      list.querySelectorAll('tbody tr').forEach(tr => tr.classList.toggle('sel', tr.dataset.tag === tag))
    }

    const showMsg = (el, text) => {
      el.innerHTML = ''
      const d = document.createElement('div')
      d.className = 'msg'
      d.textContent = text
      el.appendChild(d)
    }

    const renderTags = (tags, total, note) => {
      list.innerHTML = ''
      if (tags.length === 0) {
        showMsg(list, note || 'No tags.')
        status.textContent = ''
        return
      }
      const table = document.createElement('table')
      table.innerHTML = '<thead><tr><th>Tag</th><th>Description</th><th>Type</th><th>Group</th></tr></thead>'
      const tbody = document.createElement('tbody')
      tags.forEach(t => {
        const tr = document.createElement('tr')
        tr.dataset.tag = t.tag
        const cells = [
          [t.tag, 'tag'],
          [t.description || ''],
          [t.type || ''],
          [[t.group1, t.group2, t.group3].filter(Boolean).join(' / ')]
        ]
        cells.forEach(([text, cls]) => {
          const td = document.createElement('td')
          td.textContent = text
          td.title = text
          if (cls) td.className = cls
          tr.appendChild(td)
        })
        tr.onclick = () => pick(t.tag)
        tr.ondblclick = () => finish(t.tag)
        tbody.appendChild(tr)
      })
      table.appendChild(tbody)
      list.appendChild(table)
      status.textContent = total > tags.length
        ? `Showing ${tags.length} of ${total} tags${note ? ` (${note})` : ''}.`
        : `${tags.length} tag${tags.length === 1 ? '' : 's'}.`
      if (selected !== null) {
        pick(selected)
        list.querySelector('tr.sel')?.scrollIntoView({ block: 'nearest' })
      }
    }

    // tags of the selected tree node (cached group1 contents filtered locally)
    const showGroup = async () => {
      if (!groupSel) return
      const my = ++listSeq
      const { g1, g2, g3 } = groupSel
      if (!groupCache.has(g1)) showMsg(list, 'Loading…')
      try {
        const data = await loadGroup(g1)
        if (my !== listSeq) return
        const tags = data.tags.filter(t =>
          (g2 === undefined || (t.group2 || '') === g2) &&
          (g3 === undefined || (t.group3 || '') === g3))
        renderTags(tags, g2 === undefined ? data.total : tags.length,
          data.total > data.tags.length ? 'group too large, use the filter' : '')
      } catch (e) {
        if (my === listSeq) showMsg(list, e instanceof TagSourceError ? e.message : String(e))
      }
    }

    const runSearch = async () => {
      const text = q.value
      if (!filterRegex(text)) {
        if (groupSel) showGroup()
        else {
          listSeq++
          showMsg(list, 'Type a filter or select a group.')
          status.textContent = ''
        }
        return
      }
      const my = ++listSeq
      const group1 = scope.value === 'group' && groupSel ? groupSel.g1 : null
      try {
        const { tags, total } = await searchTags(text, { field: fld.value, group1, limit: SEARCH_LIMIT })
        if (my !== listSeq) return
        renderTags(tags, total, total > tags.length ? 'refine the filter' : '')
      } catch (e) {
        if (my === listSeq) showMsg(list, e instanceof TagSourceError ? e.message : String(e))
      }
    }

    const loadGroup = async (g1) => {
      if (!groupCache.has(g1)) groupCache.set(g1, listGroupTags(g1))
      try {
        return await groupCache.get(g1)
      } catch (e) {
        groupCache.delete(g1)
        throw e
      }
    }

    // --- tree: group1 nodes from the server, group2/group3 from their tags ---
    const selectNode = (el, sel) => {
      tree.querySelectorAll('.node.sel').forEach(n => n.classList.remove('sel'))
      el.classList.add('sel')
      groupSel = sel
      if (filterRegex(q.value) && scope.value === 'group') runSearch()
      else if (!filterRegex(q.value)) showGroup()
    }

    const makeNode = (label, count, depth, sel, children) => {
      const box = document.createElement('div')
      const el = document.createElement('div')
      el.className = 'node'
      el.style.paddingLeft = `${6 + depth * 14}px`
      const tw = document.createElement('span')
      tw.className = 'tw'
      el.appendChild(tw)
      el.appendChild(document.createTextNode(label === '' ? '(none)' : label))
      if (count !== null) {
        const c = document.createElement('span')
        c.className = 'cnt'
        c.textContent = `(${count})`
        el.appendChild(c)
      }
      box.appendChild(el)
      const sub = document.createElement('div')
      sub.style.display = 'none'
      box.appendChild(sub)
      let loaded = false
      const expandable = typeof children === 'function'
      tw.textContent = expandable ? '▸' : ''
      const toggle = async (open) => {
        if (!expandable) return
        open = open ?? sub.style.display === 'none'
        sub.style.display = open ? '' : 'none'
        tw.textContent = open ? '▾' : '▸'
        if (open && !loaded) {
          loaded = true
          showMsg(sub, 'Loading…')
          try {
            const nodes = await children()
            sub.innerHTML = ''
            nodes.forEach(n => sub.appendChild(n))
            if (nodes.length === 0) {
              tw.textContent = ''
            }
          } catch (e) {
            loaded = false
            showMsg(sub, e instanceof TagSourceError ? e.message : String(e))
          }
        }
      }
      tw.onclick = (e) => {
        e.stopPropagation()
        toggle()
      }
      el.onclick = () => {
        selectNode(el, sel)
        toggle(true)
      }
      return box
    }

    // distinct values of `key` among tags, with counts, sorted
    const distinct = (tags, key) => {
      const m = new Map()
      tags.forEach(t => {
        const v = t[key] || ''
        m.set(v, (m.get(v) || 0) + 1)
      })
      return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))
    }

    const g1Node = ({ name, count }) => makeNode(name, count, 0, { g1: name }, async () => {
      const { tags } = await loadGroup(name)
      const g2s = distinct(tags, 'group2')
      // a group1 whose tags have no group2 has nothing to expand
      if (g2s.length === 1 && g2s[0][0] === '') return []
      return g2s.map(([g2, c2]) => {
        const sub2 = tags.filter(t => (t.group2 || '') === g2)
        const g3s = distinct(sub2, 'group3')
        const hasG3 = !(g3s.length === 1 && g3s[0][0] === '')
        return makeNode(g2, c2, 1, { g1: name, g2 }, hasG3
          ? async () => g3s.map(([g3, c3]) => makeNode(g3, c3, 2, { g1: name, g2, g3 }, null))
          : null)
      })
    })

    ;(async () => {
      try {
        const groups = await listGroup1()
        if (!document.body.contains(bg)) return
        tree.innerHTML = ''
        groups.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
        groups.forEach(g => tree.appendChild(g1Node(g)))
        if (groups.length === 0) showMsg(tree, 'No groups.')
      } catch (e) {
        showMsg(tree, e instanceof TagSourceError ? e.message : String(e))
      }
    })()

    q.addEventListener('input', () => {
      clearTimeout(timer)
      timer = setTimeout(runSearch, TYPING_DELAY)
    })
    q.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        if (selected !== null) finish(selected)
        else {
          const first = list.querySelector('tbody tr')
          if (first) pick(first.dataset.tag)
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const rows = [...list.querySelectorAll('tbody tr')]
        if (rows.length === 0) return
        e.preventDefault()
        let i = rows.findIndex(tr => tr.dataset.tag === selected)
        i = e.key === 'ArrowDown' ? Math.min(i + 1, rows.length - 1) : Math.max(i - 1, 0)
        pick(rows[i].dataset.tag)
        rows[i].scrollIntoView({ block: 'nearest' })
      }
    })
    fld.onchange = runSearch
    scope.onchange = runSearch

    // start with the current tag of the field
    const cur = String(current || '').trim()
    if (cur) {
      selected = cur
      picked.textContent = cur
      ok.disabled = false
      q.value = cur
      runSearch()
    } else {
      showMsg(list, 'Type a filter or select a group.')
    }
    q.focus()
    q.select()
  })
}
