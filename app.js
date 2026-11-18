(() => {
  "use strict";

  const storageKey = "campus-stores.shift.v2";
  const legacyKey = "campus-stores.shift.v1";
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    { id: "RQ-214", club: "Film Society", event: "Courtyard screening", owner: "Isha Rao", due: "Fri 8 pm", items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"], note: "Playback is from a USB-C-only laptop. Kabir will collect the whole kit." },
    { id: "RQ-209", club: "Debate Union", event: "Finals rehearsal", owner: "Tara Shah", due: "Sat 10 am", items: ["Wireless microphone"], note: "Rehearsal runs into the evening." },
    { id: "RQ-217", club: "Photo Circle", event: "Street portrait walk", owner: "Dev Menon", due: "Sat noon", items: ["Digital camera"], note: "Collection on Saturday morning." },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    { id: "PR-06", type: "HDMI projector", model: "Epson EB-X49", bin: "Workshop", repair: true },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    { id: "AD-12", type: "USB-C → HDMI adapter", model: "Belkin AVC002", bin: "C4" },
    { id: "AD-15", type: "USB-C → HDMI adapter", model: "Anker A8312", bin: "C4" },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = ["Isha Rao", "Kabir Sen", "Leela Das", "Tara Shah", "Dev Menon"];
  const shifts = [
    { time: "Friday · 3:45 pm", title: "Pickup at the counter", text: "Kabir is here for the Film Society screening. The film starts at four. Issue all three approved units so the kit leaves complete.", next: "Move to return time" },
    { time: "Friday · 7:30 pm", title: "The kit comes back in pieces", text: "Kabir has the projector and speaker. Leela still has the adapter and expects to return it at nine tomorrow. Record what came back, then leave an item-specific handover.", next: "Move to next morning" },
    { time: "Saturday · 9:00 am", title: "Morning shift", text: "Leela arrives with an adapter. Check the outstanding tag and confirm the exact physical unit before closing its loan." },
  ];
  const tabs = [
    ["Shift workspace", "◫"], ["Requests", "≡"], ["Inventory", "□"], ["Loan register", "▤"], ["Desk book", "✎"],
  ];
  const fresh = () => ({
    version: 2, phase: 0, tab: "Shift workspace", filter: "All items", onlyOpen: true,
    loans: [{ num: 401, req: "RQ-209", asset: "MI-09", who: "Tara Shah", due: "Sat 10 am", back: false }],
    notes: [], handovers: {}, returning: null, handingOver: null, editing: false, selected: "",
    notice: "Sample shift · All records are fictional. Nothing is sent to a server.",
  });
  let s = fresh();
  let issueDraft = { req: "RQ-214", asset: "", who: "Kabir Sen", due: "Fri 8 pm", type: "" };

  const asset = (id) => assets.find((a) => a.id === id);
  const request = (id) => requests.find((r) => r.id === id);
  const openLoan = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const requestLoans = (req) => s.loans.filter((l) => l.req === req);
  const screening = () => request("RQ-214");
  const esc = (value) => String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const options = (pairs, selected = "") => pairs.map(([v, label]) => `<option value="${esc(v)}"${v === selected ? " selected" : ""}>${esc(label)}</option>`).join("");
  const button = (label, action, val = "", className = "") => `<button type="button" data-action="${esc(action)}" data-val="${esc(val)}" class="${esc(className)}">${esc(label)}</button>`;
  const tag = (text, tone = "") => `<span class="tag ${esc(tone)}">${esc(text)}</span>`;
  const header = (title, sub, right = "") => `<div class="sectionhead"><div><h2>${esc(title)}</h2><p>${esc(sub)}</p></div>${right}</div>`;
  const field = (label, name, value = "", required = true, extra = "") => `<label><span>${esc(label)}</span><input name="${esc(name)}" value="${esc(value)}" ${required ? "required" : ""} ${extra} /></label>`;
  const select = (label, name, pairs, selected = "") => `<label><span>${esc(label)}</span><select name="${esc(name)}" required>${options(pairs, selected)}</select></label>`;
  const statusOf = (unit) => unit.repair ? "In repair" : openLoan(unit.id) ? "On loan" : "On shelf";
  const loanForType = (reqId, type) => requestLoans(reqId).find((l) => asset(l.asset)?.type === type);
  const openScreening = () => requestLoans("RQ-214").filter((l) => !l.back);

  function stats() {
    const issued = requestLoans("RQ-214");
    return `<div class="stats"><div class="stat"><strong>${issued.length}/3</strong><span>Units issued</span></div><div class="stat"><strong>${issued.filter((l) => l.back).length}/3</strong><span>Units received</span></div><div class="stat"><strong>${openScreening().length}</strong><span>Still outstanding</span></div></div>`;
  }

  function returnForm(l) {
    const unit = asset(l.asset);
    return `<div class="panel-body"><div class="hint attention">Check the printed asset tag on the physical item. Only <strong>${esc(unit.id)}</strong> should close slip <strong>L-${l.num}</strong>.</div><form data-return="${l.num}"><div class="form">${field(`Confirm physical asset tag (${unit.id})`, "tag", "", true, 'autocapitalize="characters" autocomplete="off" spellcheck="false"')}${field("Received from", "from", s.phase === 2 ? "Leela Das" : "Kabir Sen", true, 'maxlength="60"')}</div><div role="alert" data-form-error></div><div class="form-actions"><button type="submit" class="primary">Confirm this unit received</button>${button("Cancel", "cancel-form")}</div></form></div>`;
  }

  function handoverForm(l) {
    const saved = s.handovers[l.num] || {};
    return `<div class="panel-body"><p class="form-help">This note is linked to <strong>${esc(l.asset)}</strong> and remains visible on the morning shift until the item is received.</p><form data-handover="${l.num}"><div class="form">${field("Person holding the item", "holder", saved.holder || "Leela Das", true, 'maxlength="60"')}${field("Expected back", "expected", saved.expected || "Sat 9 am", true, 'maxlength="60"')}<label class="full"><span>Useful handover detail</span><textarea name="detail" maxlength="400" required>${esc(saved.detail || "Adapter was not returned with the projector and speaker. Verify its asset tag at the counter.")}</textarea></label></div><div role="alert" data-form-error></div><div class="form-actions"><button type="submit" class="primary">Save item handover</button>${button("Cancel", "cancel-form")}</div></form></div>`;
  }

  function kitRows() {
    const rows = screening().items.map((type) => {
      const l = loanForType("RQ-214", type);
      if (!l) return `<div class="equipment-row"><div><strong>${esc(type)}</strong><p>No unit issued yet</p></div><div class="actions">${tag("Not issued", "warn")}${button("Issue unit", "issue-type", type, "primary")}</div></div>`;
      const unit = asset(l.asset);
      const line = `${unit.model} · Asset ${unit.id} · Slip L-${l.num}`;
      if (l.back) return `<div class="equipment-row"><div><strong>${esc(type)}</strong><p>${esc(line)} · Received from ${esc(l.returnedBy || "counter")}</p></div><div class="actions">${tag("Received", "good")}</div></div>`;
      const handover = s.handovers[l.num];
      return `<div class="equipment-row"><div><strong>${esc(type)}</strong><p>${esc(line)}${handover ? ` · Expected ${esc(handover.expected)} from ${esc(handover.holder)}` : ""}</p></div><div class="actions">${tag(handover ? "Handover saved" : "Outstanding", handover ? "warn" : "danger")}${button("Receive", "return", l.num)}${s.phase >= 1 ? button(handover ? "Edit handover" : "Add handover", "handover", l.num) : ""}</div></div>`;
    }).join("");
    return `<div class="panel"><div class="panel-title"><div><h3>RQ-214 · Courtyard screening kit</h3><p>Approved equipment · tracked by physical unit</p></div>${tag(`${requestLoans("RQ-214").filter((l) => l.back).length} of 3 returned`, requestLoans("RQ-214").every((l) => l.back) && requestLoans("RQ-214").length === 3 ? "good" : "")}</div>${rows}${s.returning !== null && s.loans.some((l) => l.num === s.returning && l.req === "RQ-214" && !l.back) ? returnForm(s.loans.find((l) => l.num === s.returning)) : ""}${s.handingOver !== null && s.loans.some((l) => l.num === s.handingOver && l.req === "RQ-214" && !l.back) ? handoverForm(s.loans.find((l) => l.num === s.handingOver)) : ""}</div>`;
  }

  function morningPriority() {
    const remaining = openScreening();
    if (!remaining.length) {
      return `<div class="hint">${requestLoans("RQ-214").length === 3 ? "The screening kit is fully reconciled. No outstanding Film Society units." : "No Film Society unit is currently outstanding. Check that all approved units were issued."}</div>`;
    }
    const linked = remaining.filter((l) => s.handovers[l.num]);
    return `<div class="priority"><div class="section-label">Morning shift · Needs attention</div><h3>${remaining.length} outstanding ${remaining.length === 1 ? "unit" : "units"}</h3><p>${esc(linked.length ? linked.map((l) => `${l.asset} with ${s.handovers[l.num].holder}, expected ${s.handovers[l.num].expected}`).join(" · ") : "No unit-specific handover saved yet. Use the checklist below to identify the outstanding physical asset tags.")}</p><div class="actions">${linked[0] ? button(`Receive ${linked[0].asset}`, "return", linked[0].num, "primary") : ""}${button("View desk notes", "tab", "Desk book")}</div></div>`;
  }

  function workspace() {
    let html = header("Shift workspace", "One screening, three physical units, and a shared handover trail.") + `<div class="steps"><span class="step ${s.phase === 0 ? "active" : ""}">1 · Issue kit</span><span class="step ${s.phase === 1 ? "active" : ""}">2 · Reconcile partial return</span><span class="step ${s.phase === 2 ? "active" : ""}">3 · Morning close-out</span></div>` + stats();
    if (s.phase === 0) html += `<div class="hint">Start with the approved Film Society request. Issue one tracked unit of each type. The existing per-unit slip workflow is preserved.</div>`;
    if (s.phase === 1) html += `<div class="hint attention">Partial return: check the projector and speaker back in. Leave the adapter outstanding with an item-specific handover to Leela.</div>`;
    if (s.phase === 2) html += morningPriority();
    html += kitRows();
    if (s.phase === 1) {
      const unlinked = openScreening().filter((l) => !s.handovers[l.num]);
      html += unlinked.length ? `<div class="hint attention">${unlinked.length} outstanding screening unit${unlinked.length === 1 ? " has" : "s have"} no linked handover yet. The next shift cannot reliably tell who has it or when it will be back.</div>` : `<div class="hint">All outstanding screening units have a linked handover, or the kit is already complete.</div>`;
    }
    html += `<div class="panel"><div class="panel-title"><div><h3>Why this workspace exists</h3><p>Keep the strong unit-level register; make the whole job visible at a glance.</p></div></div><div class="panel-body"><p>The old flow required joining a free-text desk note to a separate loan slip. Here the handover follows a specific asset tag, so the morning shift can verify what is still missing without guessing which adapter belongs to which screening.</p></div></div>`;
    return html;
  }

  function requestsPage() {
    return header("Approved requests", "Student Activities Office · 3 approved forms") + requests.map((r) => `<article class="request-card"><div class="meta">${esc(r.id)} · Approved</div><h3>${esc(r.event)}</h3><div class="meta">${esc(r.club)} · Filed by ${esc(r.owner)} · Return by ${esc(r.due)}</div><p>${esc(r.note)}</p><ul>${r.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>${r.id === "RQ-214" ? button("Open screening workspace", "tab", "Shift workspace", "primary") : button("Open loan register", "tab", "Loan register")}</article>`).join("");
  }

  function inventoryPage() {
    const filters = ["All items", "On shelf", "On loan", "In repair"];
    return header("Inventory", "Physical units · location and current availability") + `<div class="buttons"><label>Show <select data-filter>${options(filters.map((f) => [f, f]), s.filter)}</select></label></div>` + `<div class="panel">` + assets.filter((a) => s.filter === "All items" || statusOf(a) === s.filter).map((a) => `<div class="list-row"><div><strong>${esc(a.id)} · ${esc(a.type)}</strong><p>${esc(a.model)} · Home shelf: ${esc(a.bin)}</p></div><div class="actions">${tag(statusOf(a), statusOf(a) === "On shelf" ? "good" : statusOf(a) === "In repair" ? "danger" : "warn")}</div></div>`).join("") + `</div>`;
  }

  function issueForm() {
    const r = request(issueDraft.req) || screening();
    const pool = assets.filter((a) => !a.repair && !openLoan(a.id) && r.items.includes(a.type) && (!issueDraft.type || a.type === issueDraft.type));
    const pairs = [["", "Select an available approved unit…"], ...pool.map((a) => [a.id, `${a.id} · ${a.type} · ${a.bin}`])];
    return `<div class="panel"><div class="panel-title"><div><h3>New issue slip</h3><p>One slip for each physical unit. Only approved, available units are offered.</p></div></div><div class="panel-body"><form data-issue><div class="form">${select("Approved request", "req", requests.map((r) => [r.id, `${r.id} · ${r.club}`]), r.id)}${select("Unit leaving the desk", "asset", pairs, issueDraft.asset)}${select("Collected by", "who", people.map((p) => [p,p]), issueDraft.who)}${select("Return by", "due", [[r.due, r.due]], r.due)}</div>${pool.length ? "" : `<p class="alert">No approved units are available for this request${issueDraft.type ? ` and type (${esc(issueDraft.type)})` : ""}.</p>`}<div role="alert" data-form-error></div><div class="form-actions"><button type="submit" class="primary" ${!pool.length ? "disabled" : ""}>Save issue slip</button>${button("Cancel", "cancel-form")}</div></form></div></div>`;
  }

  function registerPage() {
    let html = header("Loan register", "Original behaviour retained: one slip per physical unit.", s.editing ? button("Cancel", "cancel-form") : button("New issue slip", "new", "", "primary"));
    if (s.editing) html += issueForm();
    html += `<div class="buttons">${button("Outstanding", "scope", "open", s.onlyOpen ? "primary" : "")}${button("All slips", "scope", "all", !s.onlyOpen ? "primary" : "")}</div><div class="panel">`;
    const shown = s.loans.filter((l) => !s.onlyOpen || !l.back).slice().reverse();
    if (!shown.length) html += `<div class="panel-body"><p class="empty">No ${s.onlyOpen ? "outstanding" : "recorded"} slips.</p></div>`;
    for (const l of shown) {
      const linked = s.handovers[l.num];
      html += `<div class="list-row"><div><strong>L-${l.num} · ${esc(l.asset)} · ${esc(asset(l.asset).type)}</strong><p>${esc(l.req)} · Collected by ${esc(l.who)} · Due ${esc(l.due)}${linked && !l.back ? ` · With ${esc(linked.holder)}, expected ${esc(linked.expected)}` : ""}${l.back ? ` · Received from ${esc(l.returnedBy || "counter")}` : ""}</p></div><div class="actions">${l.back ? tag("Returned", "good") : `${tag("Outstanding", "warn")}${button("Record return", "return", l.num)}`}</div></div>`;
    }
    html += `</div>`;
    if (s.returning !== null && s.loans.some((l) => l.num === s.returning && !l.back && l.req !== "RQ-214")) html += `<div class="panel"><div class="panel-title"><h3>Receive asset</h3></div>${returnForm(s.loans.find((l) => l.num === s.returning))}</div>`;
    if (s.handingOver !== null && s.loans.some((l) => l.num === s.handingOver && !l.back && l.req !== "RQ-214")) html += `<div class="panel"><div class="panel-title"><h3>Unit-specific handover</h3></div>${handoverForm(s.loans.find((l) => l.num === s.handingOver))}</div>`;
    return html;
  }

  function deskbookPage() {
    const entries = [
      { time: "Friday · 3:20 pm", from: "Isha Rao · Film Society", text: "Kabir Sen is picking up the whole screening kit. Please issue it in his name." },
      { time: "Friday · 3:30 pm", from: "Tara Shah · Debate Union", text: "Our microphone stays with me overnight. I'll return it by 10 am Saturday." },
    ];
    if (s.phase >= 1) entries.push({ time: "Friday · 7:30 pm", from: "Kabir Sen · Film Society", text: "I brought the projector and speaker. Leela Das has the adapter and will come at 9 am tomorrow." });
    for (const n of s.notes) entries.push({ time: shifts[n.phase].time, from: n.asset ? `Linked handover · ${n.asset}` : "Counter note", text: n.text });
    const outstanding = s.loans.filter((l) => !l.back && s.handovers[l.num]);
    return header("Desk book", "Context for people, plus linked unit handovers for the next shift.") + `<div class="section-label">Still open · linked handovers</div>${outstanding.length ? outstanding.map((l) => {const h = s.handovers[l.num]; return `<div class="hint attention"><strong>${esc(l.asset)} · L-${l.num}</strong> · With ${esc(h.holder)} · Expected ${esc(h.expected)}<p>${esc(h.detail)}</p>${button("Receive this unit", "return", l.num)}</div>`;}).join("") : `<div class="empty">No outstanding loans currently have a linked handover.</div>`}<div class="section-label" style="margin-top:22px">Desk messages and history</div>${entries.reverse().map((n) => `<article class="note-card"><div class="meta">${esc(n.time)}</div><h3>${esc(n.from)}</h3><p>${esc(n.text)}</p></article>`).join("")}<div class="panel"><div class="panel-title"><h3>General note for the next shift</h3></div><div class="panel-body"><form data-note><label><span>Message (not attached to an asset)</span><textarea name="note" maxlength="400" required></textarea></label><div role="alert" data-form-error></div><div class="form-actions"><button type="submit">Add desk note</button></div></form></div></div>`;
  }

  const screens = { "Shift workspace": workspace, "Requests": requestsPage, "Inventory": inventoryPage, "Loan register": registerPage, "Desk book": deskbookPage };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    const next = q('[data-action="advance"]');
    next.hidden = !phase.next;
    next.textContent = phase.next || "";
    q("[data-nav]").innerHTML = tabs.map(([name, symbol]) => `<button type="button" data-action="tab" data-val="${esc(name)}" ${s.tab === name ? 'aria-current="page"' : ""}><span class="nav-mark" aria-hidden="true">${esc(symbol)}</span>${esc(name)}</button>`).join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    q("[data-status]").textContent = s.notice;
  }
  function save() {
    try { localStorage.setItem(storageKey, JSON.stringify(s)); }
    catch { q("[data-status]").textContent += " Browser storage unavailable; this session will not be saved."; }
  }
  function commit(message) { if (message) s.notice = message; paint(); save(); }
  function error(message, form) {
    const target = form && form.querySelector("[data-form-error]");
    if (target) { target.className = "alert"; target.textContent = message; }
    q("[data-status]").textContent = message;
  }
  function clearForms() { s.returning = null; s.handingOver = null; s.editing = false; }
  function startReturn(num) {
    const l = s.loans.find((l) => l.num === num && !l.back);
    if (!l) return;
    clearForms(); s.returning = num;
    s.tab = l.req === "RQ-214" ? "Shift workspace" : "Loan register";
    commit(`Checking ${l.asset} · verify the physical tag before saving its return.`);
  }

  root.addEventListener("click", (event) => {
    const b = event.target.closest("[data-action]");
    if (!b || !root.contains(b)) return;
    const val = b.dataset.val;
    switch (b.dataset.action) {
      case "restart": s = fresh(); issueDraft = { req: "RQ-214", asset: "", who: "Kabir Sen", due: "Fri 8 pm", type: "" }; commit(); return;
      case "advance": if (s.phase < shifts.length - 1) s.phase++; clearForms(); s.tab = "Shift workspace"; commit(`Moved to ${shifts[s.phase].time}.`); return;
      case "tab": if (Object.hasOwn(screens, val)) s.tab = val; clearForms(); commit(); return;
      case "issue-type": issueDraft = { req: "RQ-214", asset: "", who: "Kabir Sen", due: "Fri 8 pm", type: val }; clearForms(); s.editing = true; s.tab = "Loan register"; commit(`Issue an approved ${val} for the screening.`); return;
      case "new": issueDraft = { req: "RQ-214", asset: "", who: "Kabir Sen", due: "Fri 8 pm", type: "" }; clearForms(); s.editing = true; commit(); return;
      case "cancel-form": clearForms(); commit("Form cancelled. No records were changed."); return;
      case "scope": s.onlyOpen = val === "open"; commit(); return;
      case "return": startReturn(Number(val)); return;
      case "handover": {
        const l = s.loans.find((l) => l.num === Number(val) && !l.back);
        if (!l) return;
        clearForms(); s.handingOver = l.num;
        s.tab = l.req === "RQ-214" ? "Shift workspace" : "Loan register";
        commit(`Add a linked handover for ${l.asset}.`); return;
      }
    }
  });
  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-filter]")) { s.filter = event.target.value; commit(); return; }
    if (event.target.matches('[data-issue] select[name="req"]')) {
      issueDraft = { req: event.target.value, asset: "", who: event.target.value === "RQ-209" ? "Tara Shah" : event.target.value === "RQ-217" ? "Dev Menon" : "Kabir Sen", due: request(event.target.value)?.due || "Fri 8 pm", type: "" };
      commit();
    }
  });
  root.addEventListener("submit", (event) => {
    const form = event.target;
    if (!form.matches("[data-issue], [data-return], [data-handover], [data-note]")) return;
    event.preventDefault();
    const data = new FormData(form);
    if (form.matches("[data-issue]")) {
      const req = String(data.get("req") || ""), unitId = String(data.get("asset") || ""), who = String(data.get("who") || ""), due = String(data.get("due") || "");
      const r = request(req), unit = asset(unitId);
      if (!r || !unit || unit.repair || openLoan(unitId) || !people.includes(who) || due !== r.due || !r.items.includes(unit.type)) return error("Choose a currently available unit approved for this request.", form);
      if (s.loans.some((l) => l.req === req && asset(l.asset)?.type === unit.type)) return error("This request already has a slip for that approved equipment type.", form);
      const next = Math.max(400, ...s.loans.map((l) => l.num)) + 1;
      s.loans.push({ num: next, req, asset: unitId, who, due, back: false });
      clearForms(); s.tab = req === "RQ-214" ? "Shift workspace" : "Loan register";
      commit(`Issued ${unitId} to ${who} on slip L-${next}.`); return;
    }
    if (form.matches("[data-return]")) {
      const num = Number(form.dataset.return);
      const l = s.loans.find((l) => l.num === num && !l.back);
      const tagEntered = String(data.get("tag") || "").trim().toUpperCase();
      const from = String(data.get("from") || "").trim();
      if (!l) return error("That unit is no longer outstanding.", form);
      if (tagEntered !== l.asset.toUpperCase()) return error(`Asset tag does not match slip L-${l.num}. Expected ${l.asset}; this loan was NOT closed.`, form);
      if (!from || from.length > 60) return error("Enter who physically returned the unit (up to 60 characters).", form);
      l.back = true; l.returnedBy = from; l.returnedAt = shifts[s.phase].time;
      clearForms(); commit(`${l.asset} received from ${from}. Slip L-${num} closed.`); return;
    }
    if (form.matches("[data-handover]")) {
      const num = Number(form.dataset.handover);
      const l = s.loans.find((l) => l.num === num && !l.back);
      const holder = String(data.get("holder") || "").trim();
      const expected = String(data.get("expected") || "").trim();
      const detail = String(data.get("detail") || "").trim();
      if (!l) return error("This item is no longer outstanding.", form);
      if (!holder || holder.length > 60 || !expected || expected.length > 60 || !detail || detail.length > 400) return error("Provide the holder, expected return, and a short handover detail.", form);
      s.handovers[num] = { holder, expected, detail, phase: s.phase };
      s.notes.push({ phase: s.phase, asset: l.asset, text: `${l.asset} (L-${num}): ${detail} With ${holder}; expected ${expected}.` });
      clearForms(); commit(`Linked handover saved for ${l.asset}; visible to the morning shift.`); return;
    }
    if (form.matches("[data-note]")) {
      const text = String(data.get("note") || "").trim();
      if (!text || text.length > 400) return error("Enter a desk note of at most 400 characters.", form);
      s.notes.push({ phase: s.phase, text });
      commit("General desk note saved.");
    }
  });

  function restore(candidate) {
    if (!candidate || ![1, 2].includes(candidate.version) || !Number.isInteger(candidate.phase) || !shifts[candidate.phase] || !Array.isArray(candidate.loans) || !Array.isArray(candidate.notes)) return false;
    if (!candidate.loans.every((l) => l && Number.isInteger(l.num) && request(l.req) && asset(l.asset) && typeof l.who === "string" && typeof l.back === "boolean" && typeof l.due === "string")) return false;
    if (!candidate.notes.every((n) => n && Number.isInteger(n.phase) && shifts[n.phase] && typeof n.text === "string")) return false;
    const clean = fresh();
    clean.phase = candidate.phase;
    clean.loans = candidate.loans.map((l) => ({ ...l }));
    clean.notes = candidate.notes.map((n) => ({ ...n }));
    clean.tab = Object.hasOwn(screens, candidate.tab) ? candidate.tab : "Shift workspace";
    clean.onlyOpen = candidate.onlyOpen !== false;
    clean.filter = ["All items", "On shelf", "On loan", "In repair"].includes(candidate.filter) ? candidate.filter : "All items";
    clean.notice = "Sample shift restored from browser storage.";
    if (candidate.version === 2 && candidate.handovers && typeof candidate.handovers === "object") {
      for (const [key, h] of Object.entries(candidate.handovers)) {
        if (clean.loans.some((l) => l.num === Number(key)) && h && typeof h.holder === "string" && typeof h.expected === "string" && typeof h.detail === "string") clean.handovers[key] = { holder: h.holder.slice(0, 60), expected: h.expected.slice(0, 60), detail: h.detail.slice(0, 400), phase: Number.isInteger(h.phase) ? h.phase : 0 };
      }
    }
    s = clean;
    return true;
  }
  try {
    const saved = localStorage.getItem(storageKey);
    if (!restore(saved && JSON.parse(saved))) {
      const old = localStorage.getItem(legacyKey);
      if (old && restore(JSON.parse(old))) s.notice = "Your earlier sample shift was migrated. Unit-specific handover is now available.";
    }
  } catch { s = fresh(); }
  paint();
})();
