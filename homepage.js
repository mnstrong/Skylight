/* ============================================================
   SKYLIGHT HOMEPAGE — homepage.js  v2
   Add AFTER script.js in index.html:
     <script src="homepage.js"></script>
   ============================================================ */

(function () {
'use strict';

// ── State ────────────────────────────────────────────────────
var hpTaskPage = 0;
var hpListPage = 0;

// Week offset: 0 = current week, -1 = last week, +1 = next week
var hpWeekOffset = 0;

var HP_STORAGE_KEY = 'skylight_homepage_widgets';
var hpWidgets = loadHpWidgets();

function loadHpWidgets() {
    try {
        var raw = localStorage.getItem(HP_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch (e) {}
    return { calendar: true, tasks: true, lists: true };
}
function saveHpWidgets() {
    try { localStorage.setItem(HP_STORAGE_KEY, JSON.stringify(hpWidgets)); } catch (e) {}
}

// ── Hook into switchSection ──────────────────────────────────
var _prevSwitch = window.switchSection;
window.switchSection = function (section) {
    if (section === 'home') { renderHomepage(); return; }
    if (_prevSwitch) _prevSwitch.call(this, section);
};

// ── Add Home nav item ────────────────────────────────────────
function addHomeNavItem() {
    var sidebar = document.querySelector('.nav-sidebar');
    if (!sidebar || document.querySelector('.nav-item[href="#/home"]')) return;
    var a = document.createElement('a');
    a.href = '#/home';
    a.className = 'nav-item';
    a.innerHTML = '<div class="nav-icon" style="font-size:26px;">🏠</div><div>Home</div>';
    sidebar.insertBefore(a, sidebar.firstChild);
}

// ── Main render ──────────────────────────────────────────────
function renderHomepage() {
    // Nav highlighting
    document.querySelectorAll('.nav-item').forEach(function (item) {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#/home') item.classList.add('active');
    });

    if (window.location.hash !== '#/home') {
        window.history.replaceState(null, null, '#/home');
    }

    // Hide header controls
    ['monthNav','todayNav','weekNav'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
    var viewSel = document.getElementById('mainViewSelector');
    var filterBtn = document.getElementById('calendarFilterBtn');
    if (viewSel)   viewSel.style.display   = 'none';
    if (filterBtn) filterBtn.style.display = 'none';

    // Floating buttons
    var fab1 = document.getElementById('floatingAddBtn');
    var fab2 = document.getElementById('floatingAddTaskBtn');
    if (fab1) fab1.classList.remove('active');
    if (fab2) fab2.classList.remove('active');

    // Reset state
    hpTaskPage = 0;
    hpListPage = 0;
    hpWeekOffset = 0;

    var contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    contentArea.style.padding  = '0';
    contentArea.style.overflow = 'hidden';
    contentArea.style.height   = '100%';

    contentArea.innerHTML = buildHTML();

    // Render panels
    renderHpWeekCal();
    renderHpTasks();
    renderHpLists();

    // Wire calendar nav
    var prev = document.getElementById('hpCalPrev');
    var next = document.getElementById('hpCalNext');
    if (prev) prev.addEventListener('click', function () { hpWeekOffset--; renderHpWeekCal(); });
    if (next) next.addEventListener('click', function () { hpWeekOffset++; renderHpWeekCal(); });
}

// ── HTML skeleton ────────────────────────────────────────────
function buildHTML() {
    return (
    '<div class="homepage-layout">' +

      /* ── LEFT: Calendar ── */
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

      /* ── RIGHT col ── */
      '<div class="hp-right-col">' +

        /* Today's Tasks */
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
          '<div class="hp-cards-viewport">' +
            '<div class="hp-cards-scroller" id="hpTasksScroller">' +
              '<div class="hp-cards-track" id="hpTasksTrack"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

        /* Lists */
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
          '<div class="hp-cards-viewport">' +
            '<div class="hp-cards-scroller" id="hpListsScroller">' +
              '<div class="hp-cards-track" id="hpListsTrack"></div>' +
            '</div>' +
          '</div>' +
        '</div>' +

      '</div>' + /* end right col */

    '</div>' + /* end homepage-layout */

    /* Customize modal */
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
// WEEK CALENDAR — 2 rows: Sun-Wed (top) | Thu-Sat + Next Wk (bottom)
// ─────────────────────────────────────────────────────────────
function renderHpWeekCal() {
    var body = document.getElementById('hpCalBody');
    if (!body) return;

    // Get the Sunday of the current display week
    var today = new Date(); today.setHours(0,0,0,0);

    // Find this week's Sunday
    var sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay()); // back to Sunday
    // Apply week offset
    sunday.setDate(sunday.getDate() + hpWeekOffset * 7);

    // Build the 7 days of this week
    var weekDays = [];
    for (var i = 0; i < 7; i++) {
        var d = new Date(sunday);
        d.setDate(sunday.getDate() + i);
        weekDays.push(d);
    }

    // Next week: Mon–Sun
    var nextWeekStart = new Date(sunday);
    nextWeekStart.setDate(sunday.getDate() + 7);
    var nextWeekEnd = new Date(nextWeekStart);
    nextWeekEnd.setDate(nextWeekStart.getDate() + 6);

    // Get all events
    var allEvts = [];
    if (typeof getAllEvents === 'function') {
        allEvts = getAllEvents();
    } else if (typeof window.events !== 'undefined') {
        allEvts = window.events;
    }

    // Helper: events for a date string
    function eventsForDay(dt) {
        var ds = toDateStr(dt);
        return allEvts.filter(function(e) {
            if (typeof isEventVisible === 'function' && !isEventVisible(e)) return false;
            if (typeof isEventOnDate === 'function') return isEventOnDate(e, ds);
            return e.date === ds;
        });
    }

    function eventsForRange(startDt, endDt) {
        var result = [];
        var cur = new Date(startDt);
        while (cur <= endDt) {
            eventsForDay(cur).forEach(function(e) {
                if (!result.find(function(x) { return x.id === e.id; })) result.push(e);
            });
            cur.setDate(cur.getDate() + 1);
        }
        return result;
    }

    // Update label
    var label = document.getElementById('hpCalLabel');
    if (label) {
        var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        label.textContent = months[sunday.getMonth()] + ' ' + sunday.getDate() +
            ' – ' + months[weekDays[6].getMonth()] + ' ' + weekDays[6].getDate() +
            ', ' + sunday.getFullYear();
    }

    // Row 1: Sun Mon Tue Wed  (indices 0-3)
    // Row 2: Thu Fri Sat + "Next Week" (indices 4-6 + next week cell)

    var row1Days = weekDays.slice(0, 4);  // Sun–Wed
    var row2Days = weekDays.slice(4, 7);  // Thu–Sat

    var nextWeekEvts = eventsForRange(nextWeekStart, nextWeekEnd);

    var html =
        '<div class="hp-week-cal">' +

        /* Header */
        '<div class="hp-week-header">' +
        row1Days.map(function(d) {
            return '<div class="hp-week-header-cell">' + dayName(d) + '</div>';
        }).join('') +
        '<div class="hp-week-header-cell" style="color:#667eea;"></div>' + /* placeholder for row1 4th col label */
        '</div>' +

        '<div class="hp-week-rows">' +

        /* Row 1: Sun Wed */
        '<div class="hp-week-row">' +
        row1Days.map(function(d) { return buildDayCell(d, today, eventsForDay(d)); }).join('') +
        /* 4th column of row 1 is Thu header — but we use the header row for names, so row 1 only has 4 cols */
        '</div>' +

        /* Row 2: Thu Fri Sat + Next Week */
        '<div class="hp-week-row">' +
        row2Days.map(function(d) { return buildDayCell(d, today, eventsForDay(d)); }).join('') +
        buildNextWeekCell(nextWeekStart, nextWeekEnd, nextWeekEvts) +
        '</div>' +

        '</div>' + /* end hp-week-rows */
        '</div>';  /* end hp-week-cal */

    body.innerHTML = html;

    // Rebuild header with correct day names for both rows
    rebuildWeekHeader(row1Days, row2Days);
}

function rebuildWeekHeader(row1Days, row2Days) {
    // The header we built above was wrong — we need two separate header rows
    // Actually the design uses a single shared header across both rows
    // Row 1 cols: Sun Mon Tue Wed; Row 2 cols: Thu Fri Sat Next Wk
    // So build one header that labels all 4 visible columns with the row-specific day names
    // by using two stacked sub-headers inside hp-week-cal.
    // Let's replace the .hp-week-header to show row 1 names, and add a second inside hp-week-rows row 2.
    var weekCal = document.querySelector('.hp-week-cal');
    if (!weekCal) return;

    var oldHeader = weekCal.querySelector('.hp-week-header');
    if (!oldHeader) return;

    // Row 1 names: Sun Mon Tue Wed
    oldHeader.innerHTML =
        row1Days.map(function(d) {
            return '<div class="hp-week-header-cell">' + dayName(d) + '</div>';
        }).join('') +
        '<div class="hp-week-header-cell" style="opacity:0;"></div>'; // placeholder 4th col

    // Insert a second sub-header before row 2
    var rows = weekCal.querySelector('.hp-week-rows');
    if (!rows) return;
    var row2 = rows.querySelectorAll('.hp-week-row')[1];
    if (!row2) return;

    var subHeader = document.createElement('div');
    subHeader.className = 'hp-week-header';
    subHeader.style.borderTop = '1px solid #E8EBF0';
    subHeader.innerHTML =
        row2Days.map(function(d) {
            return '<div class="hp-week-header-cell">' + dayName(d) + '</div>';
        }).join('') +
        '<div class="hp-week-header-cell" style="color:#667eea;font-size:10px;">NEXT WEEK</div>';

    rows.insertBefore(subHeader, row2);
}

function buildDayCell(d, today, evts) {
    var isToday = d.getTime() === today.getTime();
    var classes = 'hp-day-cell' + (isToday ? ' today' : '');

    // Limit to 3 visible events
    var shown  = evts.slice(0, 3);
    var extras = evts.length - shown.length;

    var evtHtml = shown.map(function(e) {
        var color = getHpEventColor(e);
        var textColor = color;
        var bg = hexToRgbaHp(color, 0.15);
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + textColor + ';">' +
            esc(e.title || '') + '</div>';
    }).join('');

    if (extras > 0) {
        evtHtml += '<div class="hp-more-events">+' + extras + ' more</div>';
    }

    return '<div class="' + classes + '">' +
        '<div class="hp-day-number-row">' +
          '<div class="hp-day-number' + (isToday ? ' today-num' : '') + '">' + d.getDate() + '</div>' +
          (evts.length > 0 ? '<div class="hp-day-event-count">' + evts.length + '</div>' : '') +
        '</div>' +
        '<div class="hp-day-events">' + evtHtml + '</div>' +
        '</div>';
}

function buildNextWeekCell(start, end, evts) {
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var dateRange = months[start.getMonth()] + ' ' + start.getDate() +
        ' – ' + months[end.getMonth()] + ' ' + end.getDate();

    var shown  = evts.slice(0, 4);
    var extras = evts.length - shown.length;

    var evtHtml = shown.map(function(e) {
        var color = getHpEventColor(e);
        var bg = hexToRgbaHp(color, 0.15);
        return '<div class="hp-event-pill" style="background:' + bg + ';color:' + color + ';">' +
            esc(e.title || '') + '</div>';
    }).join('');
    if (extras > 0) evtHtml += '<div class="hp-more-events">+' + extras + ' more</div>';

    return '<div class="hp-day-cell next-week-cell">' +
        '<div class="hp-next-week-label">Next Week</div>' +
        '<div class="hp-next-week-dates">' + dateRange + '</div>' +
        '<div class="hp-next-week-events">' + evtHtml + '</div>' +
        '</div>';
}

function dayName(d) {
    return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
}

function toDateStr(d) {
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
}

function getHpEventColor(ev) {
    // Try to get the primary member color
    if (ev.member && typeof familyMembers !== 'undefined') {
        var m = familyMembers.find(function(fm) { return fm.name === ev.member; });
        if (m) return m.color;
    }
    if (ev.color) return ev.color;
    return '#667eea';
}

// ─────────────────────────────────────────────────────────────
// TASKS PANEL
// ─────────────────────────────────────────────────────────────
function renderHpTasks() {
    var track    = document.getElementById('hpTasksTrack');
    var scroller = document.getElementById('hpTasksScroller');
    if (!track || !scroller) return;

    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];

    if (members.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">✅</div><div>No family members yet</div></div>';
        updateHpDots('hpTaskDots', 0, 0);
        updateHpArrows('hpTaskPrev','hpTaskNext', 0, 0);
        return;
    }

    // Build all cards
    var html = '';
    members.forEach(function (member) {
        var routineItems = [];
        var choreItems   = [];

        if (typeof routines !== 'undefined') {
            routineItems = routines.filter(function(r) { return r.member === member.name; });
        }
        if (typeof chores !== 'undefined') {
            choreItems = chores.filter(function(c) { return c.member === member.name; });
        }

        var allItems = routineItems.concat(choreItems);
        var total    = allItems.length;
        var done     = allItems.filter(function(i) { return i.completed; }).length;
        var cardBg   = hexToRgbaHp(member.color, 0.08);
        var cardBdr  = hexToRgbaHp(member.color, 0.2);

        html += '<div class="hp-task-card" style="background:' + cardBg + ';border-color:' + cardBdr + ';">' +
            '<div class="hp-task-card-header">' +
            '<div class="hp-task-avatar" style="background:' + member.color + ';">' + member.name.charAt(0) + '</div>' +
            '<div class="hp-task-member-info">' +
            '<div class="hp-task-member-name">' + esc(member.name) + '</div>' +
            '<div class="hp-task-meta">✓ ' + done + '/' + total + '</div>' +
            '</div></div>' +
            '<div class="hp-task-items">';

        if (allItems.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;">No tasks for today</div>';
        } else {
            allItems.slice(0, 10).forEach(function (item) {
                var isRoutine  = (typeof item.period !== 'undefined');
                var completed  = !!item.completed;
                var itemType   = isRoutine ? 'routine' : 'chore';
                var toggleCall = 'hpToggleTask(\'' + itemType + '\',' + JSON.stringify(item.id) + ')';

                html += '<div class="hp-task-row">' +
                    '<div class="hp-task-row-text' + (completed ? ' completed' : '') + '">' +
                    (item.icon ? item.icon + ' ' : '') + esc(item.title || '') +
                    '</div>' +
                    '<button class="hp-task-toggle' + (completed ? ' on' : '') + '" onclick="' + toggleCall + '"></button>' +
                    '</div>';
            });
        }

        html += '</div></div>';
    });

    track.innerHTML = html;

    // Set card widths and track width based on scroller dimensions
    // Do this after paint so offsetWidth is accurate
    requestAnimationFrame(function() {
        resizeHpCards(scroller, track, 'hp-task-card');
        var pages = Math.ceil(members.length / 2);
        updateHpDots('hpTaskDots', hpTaskPage, pages);
        updateHpArrows('hpTaskPrev', 'hpTaskNext', hpTaskPage, pages);
    });
}

window.hpToggleTask = function (type, id) {
    if (type === 'routine' && typeof routines !== 'undefined') {
        var r = routines.find(function(x) { return String(x.id) === String(id); });
        if (r) {
            r.completed = !r.completed;
            if (window.SupabaseSync && typeof window.SupabaseSync.saveRoutine === 'function') {
                window.SupabaseSync.saveRoutine(r);
            }
        }
    } else if (type === 'chore' && typeof chores !== 'undefined') {
        var c = chores.find(function(x) { return String(x.id) === String(id); });
        if (c) {
            c.completed = !c.completed;
            if (window.SupabaseSync && typeof window.SupabaseSync.saveChore === 'function') {
                window.SupabaseSync.saveChore(c);
            }
        }
    }
    var savedPage = hpTaskPage;
    renderHpTasks();
    // Restore page after rerender
    setTimeout(function() { hpGoTaskPage(savedPage); }, 20);
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
        updateHpDots('hpListDots', 0, 0);
        updateHpArrows('hpListPrev', 'hpListNext', 0, 0);
        return;
    }

    var html = '';
    listsData.forEach(function (list) {
        var member = null;
        if (typeof familyMembers !== 'undefined' && list.assignedTo) {
            member = familyMembers.find(function(m) {
                return String(m.id) === String(list.assignedTo) || m.name === list.assignedTo;
            });
        }
        var color   = member ? member.color : '#667eea';
        var cardBg  = hexToRgbaHp(color, 0.07);
        var cardBdr = hexToRgbaHp(color, 0.2);
        var activeItems = (list.items || []).filter(function(i) { return i.text && !i.completed; });

        html += '<div class="hp-list-card" style="background:' + cardBg + ';border-color:' + cardBdr + ';" onclick="hpOpenList(\'' + list.id + '\')">' +
            '<div class="hp-list-card-header">' +
            '<div class="hp-list-name">' + esc(list.name) + '</div>' +
            '<div class="hp-list-count-badge" style="background:' + color + ';">' + activeItems.length + '</div>' +
            '</div>' +
            '<div class="hp-list-items">';

        if (activeItems.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;">No items</div>';
        } else {
            activeItems.slice(0, 8).forEach(function(item) {
                html += '<div class="hp-list-item-row">' +
                    '<div class="hp-list-item-dot" style="background:' + color + ';"></div>' +
                    '<div class="hp-list-item-text">' + esc(item.text) + '</div>' +
                    '</div>';
            });
        }

        html += '</div>' +
            '<input class="hp-list-add-input" placeholder="Add item..." ' +
            'onclick="event.stopPropagation()" ' +
            'onkeypress="if(event.key===\'Enter\') hpAddListItem(\'' + list.id + '\',this)">' +
            '</div>';
    });

    track.innerHTML = html;

    requestAnimationFrame(function() {
        resizeHpCards(scroller, track, 'hp-list-card');
        var pages = Math.ceil(listsData.length / 2);
        updateHpDots('hpListDots', hpListPage, pages);
        updateHpArrows('hpListPrev', 'hpListNext', hpListPage, pages);
    });
}

window.hpOpenList = function (listId) {
    switchSection('lists');
    setTimeout(function() {
        if (typeof openEditListPanel === 'function') openEditListPanel(listId);
    }, 150);
};

window.hpAddListItem = function (listId, inputEl) {
    var text = inputEl.value.trim();
    if (!text) return;
    var list = (typeof lists !== 'undefined') ? lists.find(function(l) { return String(l.id) === String(listId); }) : null;
    if (!list) return;

    var firstSection = (list.items && list.items.length > 0) ? (list.items[0].section || 'Items') : 'Items';
    list.items = list.items || [];
    list.items.push({ id: Date.now(), text: text, completed: false, section: firstSection });

    if (window.SupabaseSync && typeof window.SupabaseSync.saveList === 'function') {
        window.SupabaseSync.saveList(list);
    }
    inputEl.value = '';
    var savedPage = hpListPage;
    renderHpLists();
    setTimeout(function() { hpGoListPage(savedPage); }, 20);
};

// ─────────────────────────────────────────────────────────────
// SCROLL / PAGINATION — uses scrollLeft, NOT transform
// ─────────────────────────────────────────────────────────────

/*
  resizeHpCards():
  - Measures the scroller's inner width
  - Sets each card's width to (scrollerWidth - padding*2 - gap) / 2
  - Sets the track's total width so scrollLeft has room
*/
function resizeHpCards(scroller, track, cardClass) {
    if (!scroller || !track) return;
    var scrollerW = scroller.clientWidth;
    var padH      = 13;  // padding: 11px 13px → horizontal = 13px each side
    var gap       = 10;
    var usable    = scrollerW - padH * 2;  // total usable width inside padding
    var cardW     = Math.floor((usable - gap) / 2);

    var cards = track.querySelectorAll('.' + cardClass);
    cards.forEach(function(card) {
        card.style.width = cardW + 'px';
        card.style.minWidth = cardW + 'px';
    });

    // Track width = all cards + all gaps + 2× padding
    var n = cards.length;
    if (n > 0) {
        var trackW = padH * 2 + n * cardW + (n - 1) * gap;
        track.style.width = trackW + 'px';
    }
}

window.hpScrollTasks = function (dir) {
    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var pages   = Math.ceil(members.length / 2);
    hpTaskPage  = Math.max(0, Math.min(pages - 1, hpTaskPage + dir));
    hpGoTaskPage(hpTaskPage);
};

window.hpScrollLists = function (dir) {
    var listsData = (typeof lists !== 'undefined') ? lists : [];
    var pages     = Math.ceil(listsData.length / 2);
    hpListPage    = Math.max(0, Math.min(pages - 1, hpListPage + dir));
    hpGoListPage(hpListPage);
};

function hpGoTaskPage(page) {
    hpTaskPage = page;
    var scroller = document.getElementById('hpTasksScroller');
    var track    = document.getElementById('hpTasksTrack');
    if (scroller && track) {
        resizeHpCards(scroller, track, 'hp-task-card');
        var card = track.querySelector('.hp-task-card');
        if (card) {
            var step = (card.offsetWidth + 10) * 2; // 2 cards per page
            scroller.scrollLeft = page * step;
        }
    }
    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var pages = Math.ceil(members.length / 2);
    updateHpDots('hpTaskDots', page, pages);
    updateHpArrows('hpTaskPrev', 'hpTaskNext', page, pages);
}

function hpGoListPage(page) {
    hpListPage = page;
    var scroller = document.getElementById('hpListsScroller');
    var track    = document.getElementById('hpListsTrack');
    if (scroller && track) {
        resizeHpCards(scroller, track, 'hp-list-card');
        var card = track.querySelector('.hp-list-card');
        if (card) {
            var step = (card.offsetWidth + 10) * 2;
            scroller.scrollLeft = page * step;
        }
    }
    var listsData = (typeof lists !== 'undefined') ? lists : [];
    var pages = Math.ceil(listsData.length / 2);
    updateHpDots('hpListDots', page, pages);
    updateHpArrows('hpListPrev', 'hpListNext', page, pages);
}

// ─────────────────────────────────────────────────────────────
// UI helpers
// ─────────────────────────────────────────────────────────────
function updateHpDots(containerId, page, pages) {
    var el = document.getElementById(containerId);
    if (!el) return;
    var html = '';
    for (var i = 0; i < pages; i++) {
        html += '<div class="hp-scroll-dot' + (i === page ? ' active' : '') + '"></div>';
    }
    el.innerHTML = html;
}

function updateHpArrows(prevId, nextId, page, pages) {
    var prev = document.getElementById(prevId);
    var next = document.getElementById(nextId);
    if (prev) prev.style.opacity = page <= 0 ? '0.3' : '1';
    if (next) next.style.opacity = page >= pages - 1 ? '0.3' : '1';
}

// ─────────────────────────────────────────────────────────────
// CUSTOMIZE MODAL
// ─────────────────────────────────────────────────────────────
window.openHpCustomize = function () {
    var modal = document.getElementById('hpCustomizeModal');
    var items = document.getElementById('hpCustomizeItems');
    if (!modal || !items) return;

    var defs = [
        { key: 'calendar', icon: '📅', label: 'Calendar',      sub: 'Weekly calendar view' },
        { key: 'tasks',    icon: '✅', label: "Today's Tasks",  sub: 'Routines & chores by person' },
        { key: 'lists',    icon: '📋', label: 'Lists',          sub: 'Your shared lists & items' }
    ];

    items.innerHTML = defs.map(function(w) {
        var on = hpWidgets[w.key] !== false;
        return '<div class="hp-customize-item" onclick="hpToggleWidget(\'' + w.key + '\')">' +
            '<div class="hp-customize-item-left">' +
            '<div class="hp-customize-item-icon">' + w.icon + '</div>' +
            '<div><div class="hp-customize-item-label">' + w.label + '</div>' +
            '<div class="hp-customize-item-sublabel">' + w.sub + '</div></div>' +
            '</div>' +
            '<div class="hp-toggle-switch' + (on ? ' on' : '') + '" id="hpToggle_' + w.key + '"></div>' +
            '</div>';
    }).join('');

    modal.classList.add('active');
};

window.closeHpCustomize = function () {
    var modal = document.getElementById('hpCustomizeModal');
    if (modal) modal.classList.remove('active');
};

window.hpToggleWidget = function (key) {
    hpWidgets[key] = !hpWidgets[key];
    saveHpWidgets();
    var toggle = document.getElementById('hpToggle_' + key);
    if (toggle) toggle.classList.toggle('on', !!hpWidgets[key]);
};

// ─────────────────────────────────────────────────────────────
// UTILITY
// ─────────────────────────────────────────────────────────────
function hexToRgbaHp(hex, alpha) {
    if (typeof hexToRgba === 'function') return hexToRgba(hex, alpha);
    var r = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!r) return 'rgba(102,126,234,' + alpha + ')';
    return 'rgba(' + parseInt(r[1],16) + ',' + parseInt(r[2],16) + ',' + parseInt(r[3],16) + ',' + alpha + ')';
}

function esc(str) {
    return String(str)
        .replace(/&/g,'&amp;').replace(/</g,'&lt;')
        .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ─────────────────────────────────────────────────────────────
// INIT
// ─────────────────────────────────────────────────────────────
function init() {
    addHomeNavItem();
    if (window.location.hash === '#/home') {
        setTimeout(renderHomepage, 100);
    }
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#/home') renderHomepage();
    });
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 0);
}

})();
