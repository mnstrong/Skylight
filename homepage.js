/* ============================================================
   SKYLIGHT HOMEPAGE — homepage.js  v3
   Add AFTER script.js in index.html:
     <script src="homepage.js"></script>
   ============================================================ */

(function () {
'use strict';

// ── State ────────────────────────────────────────────────────
var hpTaskPage   = 0;
var hpListPage   = 0;
var hpWeekOffset = 0;  // 0 = this week, -1 = last, +1 = next

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
// script.js's handleHashChange maps desktop #/home → calendar.
// We replace it so #/home → renderHomepage() instead.
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
    // Nav highlighting
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#/home') item.classList.add('active');
    });

    // Set hash without triggering hashchange loop
    if (window.location.hash !== '#/home') {
        window.history.replaceState(null, null, '#/home');
    }

    // Hide header controls
    ['monthNav','todayNav','weekNav'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    var vs = document.getElementById('mainViewSelector');
    if (vs) vs.style.display = 'none';
    // Filter button: leave visible (it works for the homepage calendar too)

    // Floating buttons off
    var f1 = document.getElementById('floatingAddBtn');
    var f2 = document.getElementById('floatingAddTaskBtn');
    if (f1) f1.classList.remove('active');
    if (f2) f2.classList.remove('active');

    // Reset pagination
    hpTaskPage = 0;
    hpListPage = 0;
    hpWeekOffset = 0;

    var ca = document.getElementById('contentArea');
    if (!ca) return;
    ca.style.padding  = '0';
    ca.style.overflow = 'hidden';
    ca.style.height   = '100%';

    // Also zero out the parent .main-content padding so homepage fills edge-to-edge
    var mc = document.querySelector('.main-content');
    if (mc) {
        mc.style.padding   = '0';
        mc.style.overflowY = 'hidden';
        mc.style.height    = '100%';
    }

    ca.innerHTML = buildHTML();

    // Wire calendar nav arrows
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
            '<a class="hp-goto-link" onclick="switchSection(\'calendar\')">Open →</a>' +
            '<button class="hp-customize-btn" onclick="openHpCustomize()">⚙ Customize</button>' +
          '</div>' +
        '</div>' +
        '<div class="hp-panel-body" id="hpCalBody"></div>' +
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
// WEEK CALENDAR — 2 rows: Sun–Wed (top) | Thu–Sat + Next Week (bottom)
// This is entirely self-contained; does NOT call renderCalendar() or
// write to any IDs that script.js owns (calendarGrid, monthYear, etc.)
// ─────────────────────────────────────────────────────────────
function renderHpWeekCal() {
    var body = document.getElementById('hpCalBody');
    if (!body) return;

    var today = new Date(); today.setHours(0,0,0,0);

    // Sunday of the week we're viewing
    var sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + hpWeekOffset * 7);
    sunday.setHours(0,0,0,0);

    // 7 days of this week: Sun(0) Mon(1) … Sat(6)
    var week = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        week.push(d);
    }

    // Next week start/end
    var nwStart = new Date(sunday); nwStart.setDate(sunday.getDate() + 7);
    var nwEnd   = new Date(sunday); nwEnd.setDate(sunday.getDate() + 13);

    // Pull events
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

    // Update nav label
    var label = document.getElementById('hpCalLabel');
    if (label) {
        var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        label.textContent = M[sunday.getMonth()] + ' ' + sunday.getDate() +
            ' – ' + M[week[6].getMonth()] + ' ' + week[6].getDate() +
            ', ' + sunday.getFullYear();
    }

    // Split: row1 = Sun–Wed (4 days), row2 = Thu–Sat (3 days) + Next Week cell
    var row1 = week.slice(0, 4);   // Sun Mon Tue Wed
    var row2 = week.slice(4, 7);   // Thu Fri Sat
    var nwEvts = evtsForRange(nwStart, nwEnd);

    // ── Build HTML ────────────────────────────────────────────
    var weatherIcon = getWeatherIcon();
    var html = '<div class="hp-week-cal">';

    // Row 1: day name/date lives inside each cell — no separate header row
    html += '<div class="hp-week-rows"><div class="hp-week-row">';
    row1.forEach(function(d) { html += dayCell(d, today, evtsForDay(d), weatherIcon); });
    html += '</div>';

    // Row 2
    html += '<div class="hp-week-row">';
    row2.forEach(function(d) { html += dayCell(d, today, evtsForDay(d), weatherIcon); });
    html += nextWeekCell(nwStart, nwEnd, nwEvts);
    html += '</div>';

    html += '</div></div>'; // .hp-week-rows / .hp-week-cal
    body.innerHTML = html;
}

function getWeatherIcon() {
    var el = document.getElementById('weatherDisplay');
    if (!el) return '';
    var text = (el.textContent || el.innerText || '').trim();
    return text.split(/\s+/)[0] || '';
}

function getMemberAvatar(memberName) {
    if (typeof familyMembers === 'undefined') return null;
    return familyMembers.find(function(fm){ return fm.name === memberName; }) || null;
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

function dayCell(d, today, evts, weatherIcon) {
    var isToday = d.getTime() === today.getTime();
    var isPast  = d.getTime() < today.getTime();
    var shown   = evts.slice(0, 6);
    var extra   = evts.length - shown.length;

    var evtHtml = shown.map(function(e) {
        var c   = hpEvtColor(e);
        var bg  = hexRgba(c, 0.15);
        var dot = e.member
            ? '<div class="hp-event-pill-dot" style="background:' + hexRgba(c,0.25) + ';">' + memberAvatarHTML(e.member, 14) + '</div>'
            : '';
        var timeStr = '';
        if (e.startTime) {
            timeStr = e.startTime + (e.endTime ? ' - ' + e.endTime : '');
        }
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + c + ';">' +
            dot +
            '<div class="hp-event-pill-body">' +
                '<div class="hp-event-pill-title">' + esc(e.title||'') + '</div>' +
                (timeStr ? '<div class="hp-event-pill-time">' + esc(timeStr) + '</div>' : '') +
            '</div>' +
            '</div>';
    }).join('');
    if (extra > 0) evtHtml += '<div class="hp-more-events">+' + extra + ' more</div>';

    var nameStyle = isPast ? 'color:#C0C5CE;' : 'color:#9CA3AF;';
    var numStyle  = isPast ? 'color:#C0C5CE;' : '';

    return '<div class="hp-day-cell' + (isToday ? ' today' : '') + '">' +
        '<div class="hp-day-header-row">' +
            '<div class="hp-day-name-date">' +
                '<span class="hp-day-name" style="' + nameStyle + '">' + dName(d) + '</span>' +
                '<div class="hp-day-number' + (isToday ? ' today-num' : '') + '" style="' + (!isToday ? numStyle : '') + '">' + d.getDate() + '</div>' +
            '</div>' +
            (weatherIcon ? '<span class="hp-day-weather">' + weatherIcon + '</span>' : '') +
        '</div>' +
        (evts.length
            ? '<div class="hp-day-event-count">' + evts.length + ' event' + (evts.length !== 1 ? 's' : '') + '</div>'
            : '<div class="hp-day-event-count" style="visibility:hidden;">0</div>'
        ) +
        '<div class="hp-day-events">' + evtHtml + '</div>' +
        '</div>';
}

function nextWeekCell(s, e, evts) {
    var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var shown = evts.slice(0, 6);
    var extra = evts.length - shown.length;
    var evtHtml = shown.map(function(ev) {
        var c  = hpEvtColor(ev);
        var bg = hexRgba(c, 0.13);
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + c + ';">' +
            '<div class="hp-event-pill-body"><div class="hp-event-pill-title">' + esc(ev.title||'') + '</div></div>' +
            '</div>';
    }).join('');
    if (extra > 0) evtHtml += '<div class="hp-more-events">+' + extra + ' more</div>';

    return '<div class="hp-day-cell next-week-cell">' +
        '<div class="hp-day-header-row">' +
            '<span class="hp-day-name" style="color:#667eea;font-weight:700;font-size:13px;">Next Week</span>' +
        '</div>' +
        '<div class="hp-day-event-count" style="color:#B0B5C0;">' +
            M[s.getMonth()] + ' ' + s.getDate() + ' \u2013 ' + M[e.getMonth()] + ' ' + e.getDate() +
        '</div>' +
        '<div class="hp-day-events">' + evtHtml + '</div>' +
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

// Track which period is selected per member (defaults to current time period)
var hpSelectedPeriod = {}; // { 'MemberName': 'Morning' | 'Afternoon' | 'Evening' | 'Chores' }

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

        if (total === 0) return; // skip periods with no tasks

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

        // Determine which period's tasks to show in the list
        var selPeriod = hpSelectedPeriod[member.name] || getCurrentPeriod();
        var listItems;
        if (selPeriod === 'Chores') {
            listItems = cItems;
        } else {
            // Show selected period routines; fall back to all if that period is empty
            var periodItems = rItems.filter(function(r){ return r.period === selPeriod; });
            listItems = periodItems.length > 0 ? periodItems : rItems;
        }

        html += '<div class="hp-task-card" style="background:' + hexRgba(member.color,.08) + ';border-color:' + hexRgba(member.color,.2) + ';">' +

            // Header: avatar + name + overall progress
            '<div class="hp-task-card-header">' +
            '<div class="hp-task-avatar" style="background:' + member.color + ';">' + member.name.charAt(0) + '</div>' +
            '<div class="hp-task-member-info">' +
            '<div class="hp-task-member-name">' + esc(member.name) + '</div>' +
            '<div class="hp-task-meta">✓ ' + done + '/' + allItems.length + '</div>' +
            '</div></div>' +

            // Period indicator buttons row
            buildPeriodIndicators(member.name, rItems, cItems, member.color) +

            // Task list for selected period
            '<div class="hp-task-items">';

        if (listItems.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;padding:4px 0;">No tasks for this period</div>';
        } else {
            listItems.slice(0, 10).forEach(function(item) {
                var isRoutine = typeof item.period !== 'undefined';
                var isDone    = !!item.completed;
                var call      = 'hpToggleTask(\'' + (isRoutine ? 'routine' : 'chore') + '\',' + JSON.stringify(item.id) + ')';
                html += '<div class="hp-task-row">' +
                    '<div class="hp-task-row-text' + (isDone ? ' completed' : '') + '">' +
                    (item.icon ? item.icon + ' ' : '') + esc(item.title || '') +
                    '</div>' +
                    '<button class="hp-task-toggle' + (isDone ? ' on' : '') + '" onclick="' + call + '"></button>' +
                    '</div>';
            });
        }

        html += '</div></div>';
    });

    track.innerHTML = html;
    requestAnimationFrame(function() {
        sizeCards(scroller, track, 'hp-task-card');
        var pages = Math.ceil(members.length / 2);
        updateDots('hpTaskDots', hpTaskPage, pages);
        updateArrows('hpTaskPrev','hpTaskNext', hpTaskPage, pages);
        addSwipeSupport('hpTasksScroller', window.hpScrollTasks);
    });
}

window.hpToggleTask = function(type, id) {
    var arr = type === 'routine' ? (typeof routines !== 'undefined' ? routines : [])
                                 : (typeof chores   !== 'undefined' ? chores   : []);
    var item = arr.find(function(x){ return String(x.id) === String(id); });
    if (item) {
        item.completed = !item.completed;
        var sync = window.SupabaseSync;
        if (sync) {
            if (type === 'routine' && typeof sync.saveRoutine === 'function') sync.saveRoutine(item);
            if (type === 'chore'   && typeof sync.saveChore   === 'function') sync.saveChore(item);
        }
    }
    var pg = hpTaskPage;
    renderHpTasks();
    setTimeout(function(){ goTaskPage(pg); }, 20);
};

// ─────────────────────────────────────────────────────────────
// LISTS PANEL
// ─────────────────────────────────────────────────────────────
function renderHpLists() {
    var track    = document.getElementById('hpListsTrack');
    var scroller = document.getElementById('hpListsScroller');
    if (!track || !scroller) return;

    var listsData = (typeof lists !== 'undefined') ? lists : [];
    if (listsData.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">📋</div><div>No lists yet</div></div>';
        updateDots('hpListDots', 0, 0);
        updateArrows('hpListPrev','hpListNext', 0, 0);
        return;
    }

    var html = '';
    listsData.forEach(function(list) {
        var member = null;
        if (typeof familyMembers !== 'undefined' && list.assignedTo) {
            member = familyMembers.find(function(m){
                return String(m.id)===String(list.assignedTo) || m.name===list.assignedTo;
            });
        }
        var color  = member ? member.color : '#667eea';
        var active = (list.items||[]).filter(function(i){ return i.text && !i.completed; });

        html += '<div class="hp-list-card" style="background:' + hexRgba(color,.07) + ';border-color:' + hexRgba(color,.2) + ';" onclick="hpOpenList(\'' + list.id + '\')">' +
            '<div class="hp-list-card-header">' +
            '<div class="hp-list-name">' + esc(list.name) + '</div>' +
            '<div class="hp-list-count-badge" style="background:' + color + ';">' + active.length + '</div>' +
            '</div>' +
            '<div class="hp-list-items">';

        if (active.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;">No items</div>';
        } else {
            active.slice(0,8).forEach(function(item) {
                html += '<div class="hp-list-item-row">' +
                    '<div class="hp-list-item-dot" style="background:' + color + ';"></div>' +
                    '<div class="hp-list-item-text">' + esc(item.text) + '</div>' +
                    '</div>';
            });
        }

        html += '</div>' +
            '<input class="hp-list-add-input" placeholder="Add item..." onclick="event.stopPropagation()" ' +
            'onkeypress="if(event.key===\'Enter\') hpAddListItem(\'' + list.id + '\',this)">' +
            '</div>';
    });

    track.innerHTML = html;
    requestAnimationFrame(function() {
        sizeCards(scroller, track, 'hp-list-card');
        var pages = Math.ceil(listsData.length / 2);
        updateDots('hpListDots', hpListPage, pages);
        updateArrows('hpListPrev','hpListNext', hpListPage, pages);
        addSwipeSupport('hpListsScroller', window.hpScrollLists);
    });
}

window.hpOpenList = function(listId) {
    switchSection('lists');
    setTimeout(function(){ if (typeof openEditListPanel==='function') openEditListPanel(listId); }, 150);
};

window.hpAddListItem = function(listId, inp) {
    var text = inp.value.trim();
    if (!text) return;
    var list = (typeof lists!=='undefined') ? lists.find(function(l){ return String(l.id)===String(listId); }) : null;
    if (!list) return;
    var sec = (list.items && list.items.length) ? (list.items[0].section||'Items') : 'Items';
    list.items = list.items||[];
    list.items.push({ id: Date.now(), text: text, completed: false, section: sec });
    if (window.SupabaseSync && typeof window.SupabaseSync.saveList==='function') window.SupabaseSync.saveList(list);
    inp.value = '';
    var pg = hpListPage;
    renderHpLists();
    setTimeout(function(){ goListPage(pg); }, 20);
};

// ─────────────────────────────────────────────────────────────
// SWIPE SUPPORT — touch events on the scroller
// ─────────────────────────────────────────────────────────────
function addSwipeSupport(scrollerId, scrollFn) {
    var el = document.getElementById(scrollerId);
    if (!el) return;

    var startX = null, startY = null, isDragging = false;

    el.addEventListener('touchstart', function(e) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isDragging = false;
    }, { passive: true });

    el.addEventListener('touchmove', function(e) {
        if (startX === null) return;
        var dx = e.touches[0].clientX - startX;
        var dy = e.touches[0].clientY - startY;
        // Only lock in as horizontal swipe once direction is clear
        if (!isDragging && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) {
            isDragging = true;
        }
        if (isDragging) e.preventDefault();
    }, { passive: false });

    el.addEventListener('touchend', function(e) {
        if (startX === null) return;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        startX = null; startY = null;
        // Require a clear horizontal swipe (dx > 40px, more horizontal than vertical)
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
            scrollFn(dx < 0 ? 1 : -1);
        }
    }, { passive: true });

    // Also support mouse drag for desktop testing
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
// SCROLL PAGINATION — uses scrollLeft
// ─────────────────────────────────────────────────────────────
function sizeCards(scroller, track, cls) {
    if (!scroller || !track) return;
    var w   = scroller.clientWidth;
    var pad = 13; // matches CSS padding 11px 13px
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

    // Default calendar to schedule view if no preference saved yet
    if (!window.lastCalendarView) window.lastCalendarView = 'schedule';
    if (!window.lastCalendarViewFromServer) window.lastCalendarViewFromServer = 'schedule';

    // Re-wrap switchSection AFTER all script.js wrappers have run,
    // so we are always the outermost layer and 'home' is always caught.
    var _inner = window.switchSection;
    window.switchSection = function(section) {
        if (section === 'home') { renderHomepage(); return; }
        // Restore everything the homepage overrode
        var fb = document.getElementById('calendarFilterBtn');
        if (fb) fb.style.display = '';
        // Reset contentArea inline styles so other sections render normally
        var ca = document.getElementById('contentArea');
        if (ca) {
            ca.style.padding  = '';
            ca.style.overflow = '';
            ca.style.height   = '';
        }
        // Reset main-content — critically restores overflow-y:auto so chore indicators aren't clipped
        var mc = document.querySelector('.main-content');
        if (mc) {
            mc.style.padding    = '';
            mc.style.overflow   = '';
            mc.style.overflowY  = 'auto';
            mc.style.height     = '';
        }
        if (_inner) _inner.call(this, section);
    };

    // Hashchange listener (catches nav-item clicks)
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#/home') renderHomepage();
    });

    // Also re-render whenever supabase finishes loading data (catches the initial load race)
    var _origFinish = window.onSupabaseDataLoaded;
    window.onSupabaseDataLoaded = function() {
        if (_origFinish) _origFinish.apply(this, arguments);
        var hash = window.location.hash;
        if (window.innerWidth > 768 && (hash === '#/home' || !hash || hash === '#/')) {
            renderHomepage();
        }
    };

    // Initial load: poll until events/familyMembers are available, then render
    var hash = window.location.hash;
    if (window.innerWidth > 768 && (hash === '#/home' || !hash || hash === '#/')) {
        var attempts = 0;
        function tryRender() {
            attempts++;
            // Consider data ready if familyMembers has been populated, or after 8s fallback
            var hasFamilyData = typeof familyMembers !== 'undefined' && familyMembers.length > 0;
            var hasEventData  = typeof getAllEvents === 'function' && getAllEvents().length > 0;
            if (hasFamilyData || hasEventData || attempts > 40) {
                renderHomepage();
            } else {
                setTimeout(tryRender, 200);
            }
        }
        setTimeout(tryRender, 200);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        // Run after ALL other DOMContentLoaded handlers (script.js, supabase-init, etc.)
        setTimeout(init, 0);
    });
} else {
    setTimeout(init, 0);
}

})();
