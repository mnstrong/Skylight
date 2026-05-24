/* ============================================================
   SKYLIGHT HOMEPAGE — homepage.js  v4
   Add AFTER script.js in index.html:
     <script src="homepage.js"></script>
   ============================================================ */

(function () {
'use strict';

// ── State ────────────────────────────────────────────────────
var hpTaskPage   = 0;
var hpListPage   = 0;
var hpWeekOffset = 0;

var HP_STORAGE_KEY = 'skylight_homepage_widgets';
var hpWidgets = loadHpWidgets();

function loadHpWidgets() {
    try { var r = localStorage.getItem(HP_STORAGE_KEY); if (r) return JSON.parse(r); } catch(e){}
    return { calendar: true, tasks: true, lists: true };
}
function saveHpWidgets() {
    try { localStorage.setItem(HP_STORAGE_KEY, JSON.stringify(hpWidgets)); } catch(e){}
}

// ── patchHandleHashChange ─────────────────────────────────────
function patchHandleHashChange() {
    var _orig = window.handleHashChange;
    window.handleHashChange = function() {
        var hash = window.location.hash;
        if (window.innerWidth > 768 && (hash === '#/home' || hash === '#/' || !hash)) {
            renderHomepage();
            return;
        }
        if (_orig) _orig.apply(this, arguments);
    };
}

// ── Add Home nav item ─────────────────────────────────────────
function addHomeNavItem() {
    var sidebar = document.querySelector('.nav-sidebar');
    if (!sidebar || document.querySelector('.nav-item[href="#/home"]')) return;
    var a = document.createElement('a');
    a.href = '#/home';
    a.className = 'nav-item';
    a.innerHTML = '<div class="nav-icon" style="font-size:26px;">🏠</div><div>Home</div>';
    sidebar.insertBefore(a, sidebar.firstChild);
}

// ── Main render ───────────────────────────────────────────────
function renderHomepage() {
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#/home') item.classList.add('active');
    });

    if (window.location.hash !== '#/home') {
        window.history.replaceState(null, null, '#/home');
    }

    ['monthNav','todayNav','weekNav'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    var vs = document.getElementById('mainViewSelector');
    if (vs) vs.style.display = 'none';

    var f1 = document.getElementById('floatingAddBtn');
    var f2 = document.getElementById('floatingAddTaskBtn');
    if (f1) f1.classList.remove('active');
    if (f2) f2.classList.remove('active');

    hpTaskPage = 0;
    hpListPage = 0;
    hpWeekOffset = 0;

    var ca = document.getElementById('contentArea');
    if (!ca) return;
    ca.style.padding  = '0';
    ca.style.overflow = 'hidden';
    ca.style.height   = '100%';

    var mc = document.querySelector('.main-content');
    if (mc) {
        mc.style.padding   = '0';
        mc.style.overflowY = 'hidden';
        mc.style.height    = '100%';
    }

    ca.innerHTML = buildHTML();

    document.getElementById('hpCalPrev').addEventListener('click', function() { hpWeekOffset--; renderHpWeekCal(); });
    document.getElementById('hpCalNext').addEventListener('click', function() { hpWeekOffset++; renderHpWeekCal(); });

    renderHpWeekCal();
    renderHpTasks();
    renderHpLists();
}

// ── HTML skeleton ─────────────────────────────────────────────
function buildHTML() {
    return (
    '<div class="homepage-layout">' +
      '<div class="hp-calendar-panel">' +
        '<div class="hp-calendar-inner">' +
          '<div class="hp-panel-header">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div class="hp-panel-title"><span class="hp-panel-title-icon">📅</span>CALENDAR</div>' +
              '<div class="hp-cal-nav">' +
                '<button class="hp-arrow-btn" id="hpCalPrev">&#8249;</button>' +
                '<span class="hp-cal-nav-label" id="hpCalLabel"></span>' +
                '<button class="hp-arrow-btn" id="hpCalNext">&#8250;</button>' +
              '</div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<button class="hp-customize-btn" onclick="openHpCustomize()">⚙ Customize</button>' +
            '</div>' +
          '</div>' +
          '<div class="hp-panel-body" id="hpCalBody"></div>' +
        '</div>' +
      '</div>' +

      '<div class="hp-right-col">' +
        '<div class="hp-right-panel">' +
          '<div class="hp-panel-header">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div class="hp-panel-title"><span class="hp-panel-title-icon">✅</span>TODAY\'S TASKS</div>' +
              '<div class="hp-scroll-indicator" id="hpTaskDots"></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:5px;">' +
              '<a class="hp-goto-link" onclick="switchSection(\'chores\')">Open →</a>' +
              '<div class="hp-panel-arrows">' +
                '<button class="hp-arrow-btn" id="hpTaskPrev" onclick="hpScrollTasks(-1)">&#8249;</button>' +
                '<button class="hp-arrow-btn" id="hpTaskNext" onclick="hpScrollTasks(1)">&#8250;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hp-cards-viewport"><div class="hp-cards-scroller" id="hpTasksScroller"><div class="hp-cards-track" id="hpTasksTrack"></div></div></div>' +
        '</div>' +

        '<div class="hp-right-panel">' +
          '<div class="hp-panel-header">' +
            '<div style="display:flex;align-items:center;gap:8px;">' +
              '<div class="hp-panel-title"><span class="hp-panel-title-icon">📋</span>LISTS</div>' +
              '<div class="hp-scroll-indicator" id="hpListDots"></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:5px;">' +
              '<a class="hp-goto-link" onclick="switchSection(\'lists\')">Open →</a>' +
              '<div class="hp-panel-arrows">' +
                '<button class="hp-arrow-btn" id="hpListPrev" onclick="hpScrollLists(-1)">&#8249;</button>' +
                '<button class="hp-arrow-btn" id="hpListNext" onclick="hpScrollLists(1)">&#8250;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hp-cards-viewport"><div class="hp-cards-scroller" id="hpListsScroller"><div class="hp-cards-track" id="hpListsTrack"></div></div></div>' +
        '</div>' +
      '</div>' +
    '</div>' +

    '<div class="hp-customize-modal" id="hpCustomizeModal">' +
      '<div class="hp-customize-backdrop" onclick="closeHpCustomize()"></div>' +
      '<div class="hp-customize-panel">' +
        '<div class="hp-customize-title">Customize Homepage</div>' +
        '<div class="hp-customize-subtitle">Choose which sections appear on your homepage.</div>' +
        '<div class="hp-customize-items" id="hpCustomizeItems"></div>' +
        '<button class="hp-customize-close-btn" onclick="closeHpCustomize()">Done</button>' +
      '</div>' +
    '</div>'
    );
}

// ─────────────────────────────────────────────────────────────
// WEEK CALENDAR
// ─────────────────────────────────────────────────────────────
function renderHpWeekCal() {
    var body = document.getElementById('hpCalBody');
    if (!body) return;

    var today = new Date(); today.setHours(0,0,0,0);

    var sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + hpWeekOffset * 7);
    sunday.setHours(0,0,0,0);

    var week = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        week.push(d);
    }

    var nwStart = new Date(sunday); nwStart.setDate(sunday.getDate() + 7);
    var nwEnd   = new Date(sunday); nwEnd.setDate(sunday.getDate() + 13);

    var allEvts = getHpAllEvents();

    function evtsForDay(dt) {
        var ds = datStr(dt);
        return allEvts.filter(function(e) {
            if (typeof isEventVisible === 'function' && !isEventVisible(e)) return false;
            if (typeof isEventOnDate  === 'function') return isEventOnDate(e, ds);
            return e.date === ds;
        });
    }

    function evtsForRange(s, e) {
        var out = [], cur = new Date(s);
        while (cur <= e) {
            evtsForDay(cur).forEach(function(ev) {
                if (!out.some(function(x){ return x.id === ev.id; })) out.push(ev);
            });
            cur.setDate(cur.getDate() + 1);
        }
        return out;
    }

    var label = document.getElementById('hpCalLabel');
    if (label) {
        var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        label.textContent = M[sunday.getMonth()] + ' ' + sunday.getDate() +
            ' – ' + M[week[6].getMonth()] + ' ' + week[6].getDate() +
            ', ' + sunday.getFullYear();
    }

    var row1 = week.slice(0, 4);
    var row2 = week.slice(4, 7);
    var nwEvts = evtsForRange(nwStart, nwEnd);

    var html = '<div class="hp-week-cal">';

    // Row 1 header
    html += '<div class="hp-week-header">';
    row1.forEach(function(d) {
        html += '<div class="hp-week-header-cell">' + dName(d) + ' <span style="font-weight:400;opacity:.6;">' + d.getDate() + '</span></div>';
    });
    html += '</div>';

    // Row 1 cells
    html += '<div class="hp-week-rows"><div class="hp-week-row">';
    row1.forEach(function(d) { html += dayCell(d, today, evtsForDay(d)); });
    html += '</div>';

    // Row 2 header
    html += '<div class="hp-week-header" style="border-top:1px solid #E8EBF0;">';
    row2.forEach(function(d) {
        html += '<div class="hp-week-header-cell">' + dName(d) + ' <span style="font-weight:400;opacity:.6;">' + d.getDate() + '</span></div>';
    });
    html += '<div class="hp-week-header-cell" style="color:#667eea;">Next Week</div>';
    html += '</div>';

    // Row 2 cells
    html += '<div class="hp-week-row">';
    row2.forEach(function(d) { html += dayCell(d, today, evtsForDay(d)); });
    html += nextWeekCell(nwStart, nwEnd, nwEvts);
    html += '</div>';

    html += '</div></div>';
    body.innerHTML = html;
}

function getMemberAvatar(memberName) {
    if (typeof familyMembers === 'undefined') return null;
    var m = familyMembers.find(function(fm){ return fm.name === memberName; });
    return m || null;
}

function memberAvatarHTML(memberName, size) {
    var m = getMemberAvatar(memberName);
    if (!m) return '';
    size = size || 16;
    var initial = m.name.charAt(0).toUpperCase();
    if (m.photo) {
        return '<img src="' + esc(m.photo) + '" style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;object-fit:cover;flex-shrink:0;" />';
    }
    return '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:50%;background:' + (m.color||'#667eea') + ';display:flex;align-items:center;justify-content:center;color:white;font-size:' + Math.round(size*0.55) + 'px;font-weight:700;flex-shrink:0;">' + initial + '</div>';
}

function dayCell(d, today, evts) {
    var isToday = d.getTime() === today.getTime();
    var shown   = evts.slice(0, 3);
    var extra   = evts.length - shown.length;

    var evtHtml = shown.map(function(e) {
        var c  = hpEvtColor(e);
        var bg = hexRgba(c, 0.13);
        var dot = '';
        if (e.member) {
            dot = '<div class="hp-event-pill-dot" style="background:' + hexRgba(c,0.25) + ';">' + memberAvatarHTML(e.member, 14) + '</div>';
        }
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + c + ';">' + dot + '<span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;">' + esc(e.title||'') + '</span></div>';
    }).join('');
    if (extra > 0) evtHtml += '<div class="hp-more-events">+' + extra + ' more</div>';

    return '<div class="hp-day-cell' + (isToday ? ' today' : '') + '">' +
        '<div class="hp-day-number-row">' +
          '<div class="hp-day-number' + (isToday ? ' today-num' : '') + '">' + d.getDate() + '</div>' +
          (evts.length ? '<div class="hp-day-event-count">' + evts.length + ' event' + (evts.length!==1?'s':'') + '</div>' : '') +
        '</div>' +
        '<div class="hp-day-events">' + evtHtml + '</div>' +
        '</div>';
}

function nextWeekCell(s, e, evts) {
    var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var shown = evts.slice(0, 4);
    var extra = evts.length - shown.length;
    var evtHtml = shown.map(function(ev) {
        var c  = hpEvtColor(ev);
        var bg = hexRgba(c, 0.13);
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + c + ';"><span style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;">' + esc(ev.title||'') + '</span></div>';
    }).join('');
    if (extra > 0) evtHtml += '<div class="hp-more-events">+' + extra + ' more</div>';

    return '<div class="hp-day-cell next-week-cell">' +
        '<div class="hp-next-week-label">Next Week</div>' +
        '<div class="hp-next-week-dates">' + M[s.getMonth()] + ' ' + s.getDate() + ' – ' + M[e.getMonth()] + ' ' + e.getDate() + '</div>' +
        '<div class="hp-next-week-events">' + evtHtml + '</div>' +
        '</div>';
}

function dName(d)   { return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()]; }
function datStr(d)  {
    return d.getFullYear() + '-' +
        String(d.getMonth()+1).padStart(2,'0') + '-' +
        String(d.getDate()).padStart(2,'0');
}

function getHpAllEvents() {
    if (typeof getAllEvents === 'function') {
        try { return getAllEvents(); } catch(e){}
    }
    return (typeof window.events !== 'undefined') ? window.events : [];
}

function hpEvtColor(ev) {
    if (ev.member && typeof familyMembers !== 'undefined') {
        var m = familyMembers.find(function(fm){ return fm.name === ev.member; });
        if (m) return m.color;
    }
    if (ev.color) return ev.color;
    return '#667eea';
}

// ─────────────────────────────────────────────────────────────
// TASKS PANEL
// ─────────────────────────────────────────────────────────────

var hpSelectedPeriod = {};

function getCurrentPeriod() {
    var h = new Date().getHours();
    if (h >= 18) return 'Evening';
    if (h >= 12) return 'Afternoon';
    return 'Morning';
}

function buildPeriodIndicators(member, rItems, cItems, color) {
    var periods = ['Morning', 'Afternoon', 'Evening', 'Chores'];
    var icons   = { Morning: '⛅', Afternoon: '☀️', Evening: '🌙', Chores: '🧹' };
    var circ    = 2 * Math.PI * 20;
    var selected = hpSelectedPeriod[member] || getCurrentPeriod();
    var html = '<div class="hp-period-indicators">';

    periods.forEach(function(period) {
        var items, total, done;
        if (period === 'Chores') {
            items = cItems;
        } else {
            items = rItems.filter(function(r) { return r.period === period; });
        }
        total = items.length;
        done  = items.filter(function(i) { return i.completed; }).length;

        if (total === 0) return;

        var pct     = total > 0 ? done / total : 0;
        var offset  = circ * (1 - pct);
        var icon    = (done === total && total > 0) ? '✓' : icons[period];
        var isSelected = (period === selected);

        var btnStyle = isSelected
            ? 'background:' + color + ';color:white;'
            : 'background:rgba(0,0,0,0.05);color:#555;';

        html +=
            '<button class="hp-period-btn' + (isSelected ? ' active' : '') + '" ' +
            'style="' + btnStyle + '" ' +
            'onclick="hpSelectPeriod(\'' + esc(member) + '\',\'' + period + '\')" ' +
            'title="' + period + ': ' + done + '/' + total + '">' +
            '<div class="hp-period-btn-inner">' +
            '<svg class="hp-period-ring" viewBox="0 0 50 50">' +
            '<circle cx="25" cy="25" r="20" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="3.5"></circle>' +
            '<circle cx="25" cy="25" r="20" fill="none" stroke="' + (isSelected ? 'rgba(255,255,255,0.9)' : color) + '" ' +
            'stroke-width="3.5" stroke-dasharray="' + circ.toFixed(2) + '" stroke-dashoffset="' + offset.toFixed(2) + '" ' +
            'stroke-linecap="round" transform="rotate(-90 25 25)"></circle>' +
            '</svg>' +
            '<span class="hp-period-icon">' + icon + '</span>' +
            '</div>' +
            '<span class="hp-period-label">' + period + '</span>' +
            '</button>';
    });

    html += '</div>';
    return html;
}

window.hpSelectPeriod = function(memberName, period) {
    hpSelectedPeriod[memberName] = period;
    var pg = hpTaskPage;
    renderHpTasks();
    setTimeout(function() { goTaskPage(pg); }, 20);
};

function renderHpTasks() {
    var track    = document.getElementById('hpTasksTrack');
    var scroller = document.getElementById('hpTasksScroller');
    if (!track || !scroller) return;

    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];

    if (members.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">✅</div><div>No family members yet</div></div>';
        updateDots('hpTaskDots', 0, 0);
        updateArrows('hpTaskPrev','hpTaskNext', 0, 0);
        return;
    }

    var html = '';
    members.forEach(function(member) {
        var rItems = (typeof routines !== 'undefined') ? routines.filter(function(r){ return r.member === member.name; }) : [];
        var cItems = (typeof chores   !== 'undefined') ? chores.filter(function(c){   return c.member === member.name; }) : [];
        var allItems = rItems.concat(cItems);
        var done   = allItems.filter(function(i){ return i.completed; }).length;
        var points = allItems.reduce(function(s,i){ return s + (i.completed ? (i.points||0) : 0); }, 0);

        var selPeriod = hpSelectedPeriod[member.name] || getCurrentPeriod();
        var listItems;
        if (selPeriod === 'Chores') {
            listItems = cItems;
        } else {
            var periodItems = rItems.filter(function(r){ return r.period === selPeriod; });
            listItems = periodItems.length > 0 ? periodItems : rItems;
        }

        // Build avatar — use photo if available
        var avatarInner;
        if (member.photo) {
            avatarInner = '<img src="' + esc(member.photo) + '" style="width:100%;height:100%;object-fit:cover;border-radius:50%;" />';
        } else {
            avatarInner = member.name.charAt(0).toUpperCase();
        }

        html += '<div class="hp-task-card" style="background:' + hexRgba(member.color,.06) + ';border-color:' + hexRgba(member.color,.18) + ';">' +

            '<div class="hp-task-card-header">' +
            '<div class="hp-task-avatar" style="background:' + member.color + ';">' + avatarInner + '</div>' +
            '<div class="hp-task-member-info">' +
            '<div class="hp-task-member-name">' + esc(member.name) + '</div>' +
            '<div class="hp-task-meta">' +
              '<span>✓ ' + done + '/' + allItems.length + '</span>' +
              (points > 0 ? '<span class="hp-task-meta-star">⭐ ' + points + '</span>' : '') +
            '</div>' +
            '</div>' +
            '</div>' +

            buildPeriodIndicators(member.name, rItems, cItems, member.color) +

            '<div class="hp-task-items">';

        if (listItems.length === 0) {
            html += '<div style="color:#BBBFC8;font-size:12px;text-align:center;padding:10px 0;">All done! 🎉</div>';
        } else {
            listItems.slice(0, 12).forEach(function(item) {
                var itemId = esc(item.id || '');
                html += '<div class="hp-task-row">' +
                    '<span class="hp-task-row-text' + (item.completed ? ' completed' : '') + '">' +
                    (item.icon ? item.icon + ' ' : '') + esc(item.title||'') +
                    '</span>' +
                    '<button class="hp-task-toggle' + (item.completed ? ' on' : '') + '" ' +
                    'onclick="hpToggleTask(\'' + itemId + '\',this)" aria-label="Toggle task"></button>' +
                    '</div>';
            });
        }

        html += '</div></div>';
    });

    track.innerHTML = html;

    // size + scroll
    setTimeout(function() {
        sizeCards(scroller, track, 'hp-task-card');
        goTaskPage(hpTaskPage);
        addSwipe(scroller, hpScrollTasks);
    }, 30);
}

window.hpToggleTask = function(id, btn) {
    // Try to toggle in chores first, then routines
    var toggled = false;
    if (typeof chores !== 'undefined') {
        var c = chores.find(function(x){ return x.id === id; });
        if (c) {
            c.completed = !c.completed;
            if (typeof saveChores === 'function') saveChores();
            toggled = true;
        }
    }
    if (!toggled && typeof routines !== 'undefined') {
        var r = routines.find(function(x){ return x.id === id; });
        if (r) {
            r.completed = !r.completed;
            if (typeof saveRoutines === 'function') saveRoutines();
            toggled = true;
        }
    }
    if (btn) {
        btn.classList.toggle('on');
        var txt = btn.previousElementSibling;
        if (txt) txt.classList.toggle('completed');
    }
};

// ─────────────────────────────────────────────────────────────
// LISTS PANEL
// ─────────────────────────────────────────────────────────────
function renderHpLists() {
    var track    = document.getElementById('hpListsTrack');
    var scroller = document.getElementById('hpListsScroller');
    if (!track || !scroller) return;

    var ld = (typeof lists !== 'undefined') ? lists : [];

    if (ld.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">📋</div><div>No lists yet</div></div>';
        updateDots('hpListDots', 0, 0);
        updateArrows('hpListPrev','hpListNext', 0, 0);
        return;
    }

    var html = '';
    ld.forEach(function(list) {
        var items   = list.items || [];
        var pending = items.filter(function(i){ return !i.completed; });
        var color   = list.color || '#667eea';
        var listId  = esc(list.id || '');

        html += '<div class="hp-list-card" onclick="switchSection(\'lists\')">' +
            '<div class="hp-list-card-header">' +
            '<div class="hp-list-name">' + esc(list.name||'Untitled') + '</div>' +
            (pending.length > 0 ? '<div class="hp-list-count-badge" style="background:' + color + ';">' + pending.length + '</div>' : '') +
            '</div>';

        // Add item input
        html += '<input class="hp-list-add-input" placeholder="Add item…" ' +
            'onclick="event.stopPropagation()" ' +
            'onkeydown="if(event.key===\'Enter\')hpAddListItem(\'' + listId + '\',this)" />';

        // List items with checkboxes
        if (items.length === 0) {
            html += '<div style="color:#BBBFC8;font-size:12px;padding:6px 0;">Empty list</div>';
        } else {
            html += '<div class="hp-list-items">';
            items.slice(0, 10).forEach(function(item) {
                var iid = esc(item.id || '');
                html += '<div class="hp-list-item-row">' +
                    '<div class="hp-list-checkbox' + (item.completed ? ' checked' : '') + '" ' +
                    'onclick="event.stopPropagation();hpToggleListItem(\'' + listId + '\',\'' + iid + '\',this)">' +
                    (item.completed ? '✓' : '') +
                    '</div>' +
                    '<span class="hp-list-item-text' + (item.completed ? ' completed' : '') + '">' + esc(item.text||item.name||'') + '</span>' +
                    '</div>';
            });
            if (items.length > 10) {
                html += '<div style="font-size:11px;color:#999;padding:2px 0;">+' + (items.length-10) + ' more items</div>';
            }
            html += '</div>';
        }

        html += '</div>';
    });

    track.innerHTML = html;

    setTimeout(function() {
        sizeCards(scroller, track, 'hp-list-card');
        goListPage(hpListPage);
        addSwipe(scroller, hpScrollLists);
    }, 30);
}

window.hpAddListItem = function(listId, input) {
    var text = (input.value || '').trim();
    if (!text) return;
    if (typeof lists === 'undefined') return;
    var list = lists.find(function(l){ return l.id === listId; });
    if (!list) return;
    if (!list.items) list.items = [];
    list.items.push({ id: Date.now().toString(), text: text, completed: false });
    if (typeof saveLists === 'function') saveLists();
    input.value = '';
    renderHpLists();
    setTimeout(function() { goListPage(hpListPage); }, 20);
};

window.hpToggleListItem = function(listId, itemId, el) {
    if (typeof lists === 'undefined') return;
    var list = lists.find(function(l){ return l.id === listId; });
    if (!list || !list.items) return;
    var item = list.items.find(function(i){ return i.id === itemId; });
    if (!item) return;
    item.completed = !item.completed;
    if (typeof saveLists === 'function') saveLists();
    // Update UI immediately
    el.classList.toggle('checked', item.completed);
    el.textContent = item.completed ? '✓' : '';
    var txt = el.nextElementSibling;
    if (txt) txt.classList.toggle('completed', item.completed);
    // Refresh count badge
    renderHpLists();
    setTimeout(function() { goListPage(hpListPage); }, 20);
};

// ─────────────────────────────────────────────────────────────
// SWIPE
// ─────────────────────────────────────────────────────────────
function addSwipe(el, scrollFn) {
    if (!el || el._swipeAdded) return;
    el._swipeAdded = true;
    var startX = null;
    el.addEventListener('touchstart', function(e) { startX = e.touches[0].clientX; }, { passive: true });
    el.addEventListener('touchend', function(e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        startX = null;
        if (Math.abs(dx) > 40) scrollFn(dx < 0 ? 1 : -1);
    }, { passive: true });
    var mouseStartX = null;
    el.addEventListener('mousedown', function(e) { mouseStartX = e.clientX; });
    el.addEventListener('mouseup', function(e) {
        if (mouseStartX === null) return;
        var dx = e.clientX - mouseStartX;
        mouseStartX = null;
        if (Math.abs(dx) > 40) scrollFn(dx < 0 ? 1 : -1);
    });
    el.addEventListener('mouseleave', function() { mouseStartX = null; });
}

// ─────────────────────────────────────────────────────────────
// SCROLL PAGINATION
// ─────────────────────────────────────────────────────────────
function sizeCards(scroller, track, cls) {
    if (!scroller || !track) return;
    var w   = scroller.clientWidth;
    var pad = 14;
    var gap = 10;
    var cw  = Math.floor((w - pad*2 - gap) / 2);
    track.querySelectorAll('.' + cls).forEach(function(c) {
        c.style.width    = cw + 'px';
        c.style.minWidth = cw + 'px';
    });
    var n = track.querySelectorAll('.' + cls).length;
    if (n) track.style.width = (pad*2 + n*cw + (n-1)*gap) + 'px';
}

window.hpScrollTasks = function(dir) {
    var members = (typeof familyMembers!=='undefined') ? familyMembers : [];
    hpTaskPage = Math.max(0, Math.min(Math.ceil(members.length/2)-1, hpTaskPage+dir));
    goTaskPage(hpTaskPage);
};

window.hpScrollLists = function(dir) {
    var ld = (typeof lists!=='undefined') ? lists : [];
    hpListPage = Math.max(0, Math.min(Math.ceil(ld.length/2)-1, hpListPage+dir));
    goListPage(hpListPage);
};

function goTaskPage(page) {
    hpTaskPage = page;
    var sc = document.getElementById('hpTasksScroller');
    var tr = document.getElementById('hpTasksTrack');
    if (sc && tr) {
        sizeCards(sc, tr, 'hp-task-card');
        var c = tr.querySelector('.hp-task-card');
        if (c) sc.scrollLeft = page * (c.offsetWidth + 10) * 2;
    }
    var members = (typeof familyMembers!=='undefined') ? familyMembers : [];
    updateDots('hpTaskDots', page, Math.ceil(members.length/2));
    updateArrows('hpTaskPrev','hpTaskNext', page, Math.ceil(members.length/2));
}

function goListPage(page) {
    hpListPage = page;
    var sc = document.getElementById('hpListsScroller');
    var tr = document.getElementById('hpListsTrack');
    if (sc && tr) {
        sizeCards(sc, tr, 'hp-list-card');
        var c = tr.querySelector('.hp-list-card');
        if (c) sc.scrollLeft = page * (c.offsetWidth + 10) * 2;
    }
    var ld = (typeof lists!=='undefined') ? lists : [];
    updateDots('hpListDots', page, Math.ceil(ld.length/2));
    updateArrows('hpListPrev','hpListNext', page, Math.ceil(ld.length/2));
}

function updateDots(id, page, pages) {
    var el = document.getElementById(id); if (!el) return;
    var h = '';
    for (var i=0;i<pages;i++) h += '<div class="hp-scroll-dot'+(i===page?' active':'')+'" ></div>';
    el.innerHTML = h;
}

function updateArrows(prevId, nextId, page, pages) {
    var p = document.getElementById(prevId), n = document.getElementById(nextId);
    if (p) p.style.opacity = page<=0 ? '0.3' : '1';
    if (n) n.style.opacity = page>=pages-1 ? '0.3' : '1';
}

// ─────────────────────────────────────────────────────────────
// CUSTOMIZE MODAL
// ─────────────────────────────────────────────────────────────
window.openHpCustomize = function() {
    var modal = document.getElementById('hpCustomizeModal');
    var items = document.getElementById('hpCustomizeItems');
    if (!modal||!items) return;
    var defs = [
        { key:'calendar', icon:'📅', label:'Calendar',     sub:'Weekly 2-row view' },
        { key:'tasks',    icon:'✅', label:"Today's Tasks", sub:'Routines & chores by person' },
        { key:'lists',    icon:'📋', label:'Lists',         sub:'Shared lists & items' }
    ];
    items.innerHTML = defs.map(function(w) {
        var on = hpWidgets[w.key] !== false;
        return '<div class="hp-customize-item" onclick="hpToggleWidget(\'' + w.key + '\')">' +
            '<div class="hp-customize-item-left">' +
            '<div class="hp-customize-item-icon">'+w.icon+'</div>' +
            '<div><div class="hp-customize-item-label">'+w.label+'</div>' +
            '<div class="hp-customize-item-sublabel">'+w.sub+'</div></div></div>' +
            '<div class="hp-toggle-switch'+(on?' on':'')+'" id="hpToggle_'+w.key+'"></div></div>';
    }).join('');
    modal.classList.add('active');
};

window.closeHpCustomize = function() {
    var m = document.getElementById('hpCustomizeModal');
    if (m) m.classList.remove('active');
};

window.hpToggleWidget = function(key) {
    hpWidgets[key] = !hpWidgets[key];
    saveHpWidgets();
    var t = document.getElementById('hpToggle_'+key);
    if (t) t.classList.toggle('on', !!hpWidgets[key]);
};

// ─────────────────────────────────────────────────────────────
// UTILITIES
// ─────────────────────────────────────────────────────────────
function hexRgba(hex, a) {
    if (typeof hexToRgba === 'function') return hexToRgba(hex, a);
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return 'rgba(102,126,234,'+a+')';
    return 'rgba('+parseInt(r[1],16)+','+parseInt(r[2],16)+','+parseInt(r[3],16)+','+a+')';
}

function esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
function init() {
    addHomeNavItem();
    patchHandleHashChange();

    if (!window.lastCalendarView) window.lastCalendarView = 'schedule';
    if (!window.lastCalendarViewFromServer) window.lastCalendarViewFromServer = 'schedule';

    var _inner = window.switchSection;
    window.switchSection = function(section) {
        if (section === 'home') { renderHomepage(); return; }
        var fb = document.getElementById('calendarFilterBtn');
        if (fb) fb.style.display = '';
        var ca = document.getElementById('contentArea');
        if (ca) {
            ca.style.padding  = '';
            ca.style.overflow = '';
            ca.style.height   = '';
        }
        var mc = document.querySelector('.main-content');
        if (mc) {
            mc.style.padding    = '';
            mc.style.overflow   = '';
            mc.style.overflowY  = 'auto';
            mc.style.height     = '';
        }
        if (_inner) _inner.call(this, section);
    };

    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#/home') renderHomepage();
    });

    var hash = window.location.hash;
    if (window.innerWidth > 768 && (hash === '#/home' || !hash || hash === '#/')) {
        setTimeout(renderHomepage, 150);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, 0);
    });
} else {
    setTimeout(init, 0);
}

})();
