/* ============================================================
   SKYLIGHT HOMEPAGE — homepage.js
   Drop this script tag AFTER script.js in index.html
   ============================================================ */

(function() {
'use strict';

// ── State ──────────────────────────────────────────────────
var hpTaskPage    = 0;   // which "page" of task cards is visible
var hpListPage    = 0;   // which "page" of list cards is visible
var hpTaskCount   = 0;   // total task card count (one per family member)
var hpListCount   = 0;   // total list card count

// Homepage sections the user wants shown (saved to localStorage)
var HP_STORAGE_KEY = 'skylight_homepage_widgets';
var hpWidgets = loadHpWidgets();

function loadHpWidgets() {
    try {
        var raw = localStorage.getItem(HP_STORAGE_KEY);
        if (raw) return JSON.parse(raw);
    } catch(e) {}
    // Defaults: calendar always on, tasks and lists on
    return { calendar: true, tasks: true, lists: true };
}

function saveHpWidgets() {
    try { localStorage.setItem(HP_STORAGE_KEY, JSON.stringify(hpWidgets)); } catch(e) {}
}

// ── Register "Home" as a section ──────────────────────────
// Wrap switchSection so 'home' renders our homepage
var _prevSwitchSection = window.switchSection;
window.switchSection = function(section) {
    if (section === 'home') {
        renderHomepage();
        return;
    }
    if (_prevSwitchSection) _prevSwitchSection.call(this, section);
};

// ── Add Home nav item to sidebar ──────────────────────────
function addHomeNavItem() {
    var sidebar = document.querySelector('.nav-sidebar');
    if (!sidebar) return;
    if (document.querySelector('.nav-item[href="#/home"]')) return; // already added

    var homeItem = document.createElement('a');
    homeItem.href    = '#/home';
    homeItem.className = 'nav-item';
    homeItem.innerHTML =
        '<div class="nav-icon" style="font-size:26px;">🏠</div>' +
        '<div>Home</div>';

    // Insert as the very first item
    sidebar.insertBefore(homeItem, sidebar.firstChild);
}

// ── Main render ───────────────────────────────────────────
function renderHomepage() {
    var currentSection = 'home';
    window._currentSection = 'home';

    // Sync currentSection on the outer scope (script.js uses it)
    if (typeof window.currentSection !== 'undefined') {
        // Can't assign to let in outer scope, but we set a flag
    }

    // Update nav highlighting
    document.querySelectorAll('.nav-item').forEach(function(item) {
        item.classList.remove('active');
        if (item.getAttribute('href') === '#/home') item.classList.add('active');
    });

    // Update URL
    if (window.location.hash !== '#/home') {
        window.history.replaceState(null, null, '#/home');
    }

    // Hide header controls not needed for home
    var monthNav  = document.getElementById('monthNav');
    var todayNav  = document.getElementById('todayNav');
    var weekNav   = document.getElementById('weekNav');
    var viewSel   = document.getElementById('mainViewSelector');
    var filterBtn = document.getElementById('calendarFilterBtn');
    if (monthNav)  monthNav.style.display  = 'none';
    if (todayNav)  todayNav.style.display  = 'none';
    if (weekNav)   weekNav.style.display   = 'none';
    if (viewSel)   viewSel.style.display   = 'none';
    if (filterBtn) filterBtn.style.display = 'none';

    // Hide floating buttons
    var fab1 = document.getElementById('floatingAddBtn');
    var fab2 = document.getElementById('floatingAddTaskBtn');
    if (fab1) fab1.classList.remove('active');
    if (fab2) fab2.classList.remove('active');

    // Reset scroll positions
    hpTaskPage = 0;
    hpListPage = 0;

    var contentArea = document.getElementById('contentArea');
    if (!contentArea) return;

    contentArea.style.padding = '0';
    contentArea.style.overflow = 'hidden';
    contentArea.style.height = '100%';

    contentArea.innerHTML = buildHomepageHTML();
    attachHomepageEvents();
    renderHpCalendar();
    renderHpTasks();
    renderHpLists();
}

// ── HTML skeleton ─────────────────────────────────────────
function buildHomepageHTML() {
    return '' +
    '<div class="homepage-layout">' +

      /* ── LEFT: Calendar ── */
      '<div class="hp-calendar-panel">' +
        '<div class="hp-panel-header">' +
          '<div style="display:flex;align-items:center;gap:10px;">' +
            '<div class="hp-panel-title"><span class="hp-panel-title-icon">📅</span>CALENDAR</div>' +
            '<div class="hp-cal-nav">' +
              '<button class="hp-arrow-btn" id="hpCalPrev" title="Previous">&#8249;</button>' +
              '<span class="hp-cal-nav-label" id="hpCalLabel"></span>' +
              '<button class="hp-arrow-btn" id="hpCalNext" title="Next">&#8250;</button>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex;align-items:center;gap:8px;">' +
            '<a class="hp-goto-link" onclick="switchSection(\'calendar\')">Open →</a>' +
            '<button class="hp-customize-btn" onclick="openHpCustomize()">⚙ Customize</button>' +
          '</div>' +
        '</div>' +
        '<div class="hp-panel-body">' +
          '<div class="hp-calendar-embed" id="hpCalendarEmbed"></div>' +
        '</div>' +
      '</div>' +

      /* ── RIGHT col ── */
      '<div class="hp-right-col">' +

        /* Today's Tasks panel */
        '<div class="hp-right-panel" id="hpTasksPanel">' +
          '<div class="hp-panel-header">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div class="hp-panel-title"><span class="hp-panel-title-icon">✅</span>TODAY\'S TASKS</div>' +
              '<div class="hp-scroll-indicator" id="hpTaskDots"></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<a class="hp-goto-link" onclick="switchSection(\'chores\')">Open →</a>' +
              '<div class="hp-panel-arrows">' +
                '<button class="hp-arrow-btn" id="hpTaskPrev" onclick="hpScrollTasks(-1)">&#8249;</button>' +
                '<button class="hp-arrow-btn" id="hpTaskNext" onclick="hpScrollTasks(1)">&#8250;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hp-cards-viewport">' +
            '<div class="hp-cards-track" id="hpTasksTrack"></div>' +
          '</div>' +
        '</div>' +

        /* Lists panel */
        '<div class="hp-right-panel" id="hpListsPanel">' +
          '<div class="hp-panel-header">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
              '<div class="hp-panel-title"><span class="hp-panel-title-icon">📋</span>LISTS</div>' +
              '<div class="hp-scroll-indicator" id="hpListDots"></div>' +
            '</div>' +
            '<div style="display:flex;align-items:center;gap:6px;">' +
              '<a class="hp-goto-link" onclick="switchSection(\'lists\')">Open →</a>' +
              '<div class="hp-panel-arrows">' +
                '<button class="hp-arrow-btn" id="hpListPrev" onclick="hpScrollLists(-1)">&#8249;</button>' +
                '<button class="hp-arrow-btn" id="hpListNext" onclick="hpScrollLists(1)">&#8250;</button>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<div class="hp-cards-viewport">' +
            '<div class="hp-cards-track" id="hpListsTrack"></div>' +
          '</div>' +
        '</div>' +

      '</div>' + /* end right col */

    '</div>' + /* end homepage-layout */

    /* ── Customize modal ── */
    '<div class="hp-customize-modal" id="hpCustomizeModal">' +
      '<div class="hp-customize-backdrop" onclick="closeHpCustomize()"></div>' +
      '<div class="hp-customize-panel">' +
        '<div class="hp-customize-title">Customize Homepage</div>' +
        '<div class="hp-customize-subtitle">Choose which sections appear on your homepage.</div>' +
        '<div class="hp-customize-items" id="hpCustomizeItems"></div>' +
        '<button class="hp-customize-close-btn" onclick="closeHpCustomize()">Done</button>' +
      '</div>' +
    '</div>';
}

// ── Calendar embed ────────────────────────────────────────
function renderHpCalendar() {
    var embed = document.getElementById('hpCalendarEmbed');
    if (!embed) return;

    // We render a mini month view inline
    embed.innerHTML =
        '<div class="family-pills" id="hpFamilyPills" style="padding:8px 12px 0; flex-shrink:0;"></div>' +
        '<div class="calendar-grid" id="hpCalGrid" style="flex:1; overflow:auto;"></div>' +
        '<div class="week-view" id="hpWeekView" style="display:none; flex:1; overflow:auto;"></div>' +
        '<div class="schedule-view" id="hpScheduleView" style="display:none; flex:1; overflow:auto;">' +
            '<div class="schedule-container" id="hpScheduleContainer"></div>' +
        '</div>' +
        '<div class="day-view" id="hpDayView" style="display:none; flex:1; overflow:auto;"></div>';
    embed.style.display = 'flex';
    embed.style.flexDirection = 'column';
    embed.style.height = '100%';

    // Render family pills using the real function, re-targeted
    if (typeof renderFamilyPills === 'function') {
        // Temporarily redirect familyPills container
        var origPills = document.getElementById('familyPills');
        var hpPills   = document.getElementById('hpFamilyPills');

        // Clone family pills into hp container
        if (typeof familyMembers !== 'undefined' && familyMembers.length) {
            var pillsHtml = '';
            familyMembers.forEach(function(m) {
                var progress = getHpMemberProgress(m);
                var bgRgba = hexToRgbaHp(m.color, 0.15);
                pillsHtml +=
                    '<div class="family-pill" style="background:' + bgRgba + ';color:' + m.color + ';font-size:13px;min-width:unset;padding:8px 14px;" ' +
                    'onclick="toggleCalendarFilterMember && toggleCalendarFilterMember(\'' + m.name + '\')">' +
                    '<div class="family-pill-progress" style="background:' + m.color + ';width:' + progress + '%"></div>' +
                    '<div class="family-pill-content">' +
                    '<div class="family-pill-avatar" style="background:' + m.color + ';width:22px;height:22px;font-size:11px;">' + m.name.charAt(0) + '</div>' +
                    '<div class="family-pill-info">' +
                    '<div class="family-pill-name">' + m.name + '</div>' +
                    '</div></div></div>';
            });
            if (hpPills) hpPills.innerHTML = pillsHtml;
        }
    }

    // Render the month calendar — redirect grid ID
    renderHpMonthView();
    updateHpCalLabel();
}

// Which hp view is showing: 'month' | 'week' | 'schedule' | 'day'
var hpCalView = window.lastCalendarViewFromServer || window.lastCalendarView || 'month';

function renderHpMonthView() {
    // We piggyback on the real renderCalendar / renderWeekView etc.,
    // but those write to fixed IDs. Instead, re-render directly.
    showHpCalView(hpCalView);
}

function showHpCalView(view) {
    hpCalView = view;
    var grid     = document.getElementById('hpCalGrid');
    var weekV    = document.getElementById('hpWeekView');
    var schedV   = document.getElementById('hpScheduleView');
    var dayV     = document.getElementById('hpDayView');
    var schedC   = document.getElementById('hpScheduleContainer');

    if (!grid) return;

    // Hide all
    [grid, weekV, schedV, dayV].forEach(function(el) { if (el) el.style.display = 'none'; });

    // We'll use a trick: temporarily swap element IDs, call the real renderer, swap back
    if (view === 'month' && grid) {
        grid.style.display = '';
        swapIdAndRender('calendarGrid', 'hpCalGrid', function() {
            if (typeof renderCalendar === 'function') renderCalendar();
        });
    } else if (view === 'week' && weekV) {
        weekV.style.display = '';
        swapIdAndRender('weekView', 'hpWeekView', function() {
            if (typeof renderWeekView === 'function') renderWeekView();
        });
    } else if (view === 'schedule' && schedV) {
        schedV.style.display = '';
        // Schedule uses scheduleContainer inside scheduleView
        var realSched  = document.getElementById('scheduleView');
        var realSchedC = document.getElementById('scheduleContainer');
        if (realSched && schedV) {
            var origId  = 'scheduleView';
            var origCId = 'scheduleContainer';
            schedV.id  = origId;
            if (schedC) schedC.id = origCId;
            if (typeof renderScheduleView === 'function') renderScheduleView();
            schedV.id  = 'hpScheduleView';
            if (schedC) schedC.id = 'hpScheduleContainer';
        }
    } else if (view === 'day' && dayV) {
        dayV.style.display = '';
        swapIdAndRender('dayView', 'hpDayView', function() {
            if (typeof renderDayView === 'function') renderDayView();
        });
    }

    updateHpCalLabel();
}

function swapIdAndRender(realId, hpId, renderFn) {
    var realEl = document.getElementById(realId);
    var hpEl   = document.getElementById(hpId);
    if (!hpEl) return;

    // Temporarily give hpEl the real ID so the render function finds it
    if (realEl) realEl.id = realId + '__hidden';
    hpEl.id = realId;

    try { renderFn(); } catch(e) {}

    // Restore
    hpEl.id = hpId;
    if (realEl) realEl.id = realId;
}

function updateHpCalLabel() {
    var label = document.getElementById('hpCalLabel');
    if (!label) return;

    var d = window.currentDate || new Date();
    var months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];

    if (hpCalView === 'month') {
        label.textContent = months[d.getMonth()] + ' ' + d.getFullYear();
    } else if (hpCalView === 'week') {
        // Show week range
        var dayOfWeek = d.getDay();
        var start = new Date(d); start.setDate(d.getDate() - dayOfWeek);
        var end   = new Date(start); end.setDate(start.getDate() + 6);
        var fmt = function(dt) { return months[dt.getMonth()].slice(0,3) + ' ' + dt.getDate(); };
        label.textContent = fmt(start) + ' – ' + fmt(end);
    } else if (hpCalView === 'day') {
        var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
        label.textContent = days[d.getDay()] + ', ' + months[d.getMonth()].slice(0,3) + ' ' + d.getDate();
    } else {
        label.textContent = 'Schedule';
    }
}

function attachHomepageEvents() {
    // Calendar prev/next
    var calPrev = document.getElementById('hpCalPrev');
    var calNext = document.getElementById('hpCalNext');
    if (calPrev) calPrev.addEventListener('click', function() { hpCalNavigate(-1); });
    if (calNext) calNext.addEventListener('click', function() { hpCalNavigate(1); });
}

function hpCalNavigate(dir) {
    // Use the real navigate functions, then re-render into hp elements
    if (typeof navigateView === 'function') {
        navigateView(dir);
    } else {
        // Fallback: manually move currentDate
        var d = window.currentDate || new Date();
        if (hpCalView === 'month') {
            d.setMonth(d.getMonth() + dir);
        } else if (hpCalView === 'week') {
            d.setDate(d.getDate() + dir * 7);
        } else {
            d.setDate(d.getDate() + dir);
        }
    }
    // Re-render into hp elements
    showHpCalView(hpCalView);
}

// ── Tasks panel ───────────────────────────────────────────
function renderHpTasks() {
    var track = document.getElementById('hpTasksTrack');
    if (!track) return;

    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var todayStr = getTodayStr();

    hpTaskCount = members.length;
    var html = '';

    if (members.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">✅</div><div>No family members yet</div></div>';
        return;
    }

    members.forEach(function(member) {
        var routineItems = [];
        var choreItems   = [];

        // Routines for this member
        if (typeof routines !== 'undefined') {
            routineItems = routines.filter(function(r) { return r.member === member.name; });
        }

        // Chores for this member (active today)
        if (typeof chores !== 'undefined') {
            choreItems = chores.filter(function(c) {
                if (c.member !== member.name) return false;
                if (c.completed) return false;
                return true;
            });
        }

        var allItems = routineItems.concat(choreItems);
        var total    = allItems.length;
        var done     = allItems.filter(function(i) { return i.completed; }).length;

        var cardBg = hexToRgbaHp(member.color, 0.08);

        html += '<div class="hp-task-card" style="background:' + cardBg + ';border-color:' + hexToRgbaHp(member.color, 0.18) + ';">' +
            '<div class="hp-task-card-header">' +
            '<div class="hp-task-avatar" style="background:' + member.color + ';">' + member.name.charAt(0) + '</div>' +
            '<div class="hp-task-member-info">' +
            '<div class="hp-task-member-name">' + member.name + '</div>' +
            '<div class="hp-task-meta">✓ ' + done + '/' + total + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="hp-task-items">';

        if (allItems.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;padding:4px 0;">No tasks for today</div>';
        } else {
            allItems.slice(0, 8).forEach(function(item) {
                var isRoutine  = (typeof item.period !== 'undefined');
                var completed  = !!item.completed;
                var itemId     = item.id;
                var itemType   = isRoutine ? 'routine' : 'chore';
                var toggleCall = 'hpToggleTask(\'' + itemType + '\',' + itemId + ')';

                html += '<div class="hp-task-row">' +
                    '<div class="hp-task-row-text' + (completed ? ' completed' : '') + '">' +
                    (item.icon ? item.icon + ' ' : '') + escHtml(item.title || '') +
                    '</div>' +
                    '<button class="hp-task-toggle' + (completed ? ' on' : '') + '" onclick="' + toggleCall + '"></button>' +
                    '</div>';
            });
        }

        html += '</div></div>';
    });

    track.innerHTML = html;
    updateHpTaskDots();
    updateHpTaskArrows();
}

window.hpToggleTask = function(type, id) {
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
    renderHpTasks();
    // Restore scroll position
    hpSetTaskPage(hpTaskPage);
};

// ── Lists panel ───────────────────────────────────────────
function renderHpLists() {
    var track = document.getElementById('hpListsTrack');
    if (!track) return;

    var listsData = (typeof lists !== 'undefined') ? lists : [];
    hpListCount = listsData.length;

    if (listsData.length === 0) {
        track.innerHTML = '<div class="hp-empty-state"><div class="hp-empty-icon">📋</div><div>No lists yet — open Lists to create one</div></div>';
        return;
    }

    var html = '';
    listsData.forEach(function(list) {
        var member = null;
        if (typeof familyMembers !== 'undefined' && list.assignedTo) {
            member = familyMembers.find(function(m) { return String(m.id) === String(list.assignedTo) || m.name === list.assignedTo; });
        }
        var color   = member ? member.color : '#667eea';
        var initial = member ? member.name.charAt(0) : '?';
        var cardBg  = hexToRgbaHp(color, 0.07);
        var borderC = hexToRgbaHp(color, 0.18);

        // Count non-completed items
        var activeItems = (list.items || []).filter(function(i) { return i.text && !i.completed; });
        var totalItems  = (list.items || []).filter(function(i) { return i.text; });

        html += '<div class="hp-list-card" style="background:' + cardBg + ';border-color:' + borderC + ';" onclick="hpOpenList(\'' + list.id + '\')">' +
            '<div class="hp-list-card-header">' +
            '<div class="hp-list-name">' + escHtml(list.name) + '</div>' +
            '<div class="hp-list-count-badge" style="background:' + color + ';">' + activeItems.length + '</div>' +
            '</div>' +
            '<div class="hp-list-items">';

        if (activeItems.length === 0) {
            html += '<div style="font-size:12px;color:#BBBFC8;padding:4px 0;">No items</div>';
        } else {
            activeItems.slice(0, 6).forEach(function(item) {
                html += '<div class="hp-list-item-row">' +
                    '<div class="hp-list-item-dot" style="background:' + color + ';"></div>' +
                    '<div class="hp-list-item-text' + (item.completed ? ' completed' : '') + '">' + escHtml(item.text) + '</div>' +
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
    updateHpListDots();
    updateHpListArrows();
}

window.hpOpenList = function(listId) {
    switchSection('lists');
    // After lists render, try to open the list detail
    setTimeout(function() {
        if (typeof openEditListPanel === 'function') {
            openEditListPanel(listId);
        }
    }, 150);
};

window.hpAddListItem = function(listId, inputEl) {
    var text = inputEl.value.trim();
    if (!text) return;
    var list = (typeof lists !== 'undefined') ? lists.find(function(l) { return String(l.id) === String(listId); }) : null;
    if (!list) return;

    var newItem = {
        id: Date.now(),
        text: text,
        completed: false,
        section: list.items && list.items.length > 0 ? (list.items[0].section || 'Items') : 'Items'
    };
    list.items = list.items || [];
    list.items.push(newItem);

    // Sync
    if (window.SupabaseSync && typeof window.SupabaseSync.saveList === 'function') {
        window.SupabaseSync.saveList(list);
    }

    inputEl.value = '';
    renderHpLists();
    hpSetListPage(hpListPage);
};

// ── Scroll / pagination ───────────────────────────────────
// 2 cards visible at a time (each card is 50% of track width)
// We scroll by moving the track translate-X

window.hpScrollTasks = function(dir) {
    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var pages   = Math.ceil(members.length / 2);
    hpTaskPage  = Math.max(0, Math.min(pages - 1, hpTaskPage + dir));
    hpSetTaskPage(hpTaskPage);
};

window.hpScrollLists = function(dir) {
    var listsData = (typeof lists !== 'undefined') ? lists : [];
    var pages     = Math.ceil(listsData.length / 2);
    hpListPage    = Math.max(0, Math.min(pages - 1, hpListPage + dir));
    hpSetListPage(hpListPage);
};

function hpSetTaskPage(page) {
    hpTaskPage = page;
    var track = document.getElementById('hpTasksTrack');
    if (track) {
        var card = track.querySelector('.hp-task-card');
        if (card) {
            var cardWidth = card.offsetWidth + 12; // gap=12
            track.style.transform = 'translateX(-' + (page * cardWidth * 2) + 'px)';
        }
    }
    updateHpTaskDots();
    updateHpTaskArrows();
}

function hpSetListPage(page) {
    hpListPage = page;
    var track = document.getElementById('hpListsTrack');
    if (track) {
        var card = track.querySelector('.hp-list-card');
        if (card) {
            var cardWidth = card.offsetWidth + 12;
            track.style.transform = 'translateX(-' + (page * cardWidth * 2) + 'px)';
        }
    }
    updateHpListDots();
    updateHpListArrows();
}

function updateHpTaskDots() {
    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var pages   = Math.ceil(members.length / 2);
    var dots    = document.getElementById('hpTaskDots');
    if (!dots) return;
    var html = '';
    for (var i = 0; i < pages; i++) {
        html += '<div class="hp-scroll-dot' + (i === hpTaskPage ? ' active' : '') + '"></div>';
    }
    dots.innerHTML = html;
}

function updateHpListDots() {
    var listsData = (typeof lists !== 'undefined') ? lists : [];
    var pages     = Math.ceil(listsData.length / 2);
    var dots      = document.getElementById('hpListDots');
    if (!dots) return;
    var html = '';
    for (var i = 0; i < pages; i++) {
        html += '<div class="hp-scroll-dot' + (i === hpListPage ? ' active' : '') + '"></div>';
    }
    dots.innerHTML = html;
}

function updateHpTaskArrows() {
    var members = (typeof familyMembers !== 'undefined') ? familyMembers : [];
    var pages   = Math.ceil(members.length / 2);
    var prev = document.getElementById('hpTaskPrev');
    var next = document.getElementById('hpTaskNext');
    if (prev) prev.style.opacity = hpTaskPage === 0 ? '0.35' : '1';
    if (next) next.style.opacity = hpTaskPage >= pages - 1 ? '0.35' : '1';
}

function updateHpListArrows() {
    var listsData = (typeof lists !== 'undefined') ? lists : [];
    var pages     = Math.ceil(listsData.length / 2);
    var prev = document.getElementById('hpListPrev');
    var next = document.getElementById('hpListNext');
    if (prev) prev.style.opacity = hpListPage === 0 ? '0.35' : '1';
    if (next) next.style.opacity = hpListPage >= pages - 1 ? '0.35' : '1';
}

// ── Customize modal ───────────────────────────────────────
window.openHpCustomize = function() {
    var modal = document.getElementById('hpCustomizeModal');
    var items = document.getElementById('hpCustomizeItems');
    if (!modal || !items) return;

    var widgets = [
        { key: 'calendar', icon: '📅', label: 'Calendar',     sub: 'Full-height calendar view' },
        { key: 'tasks',    icon: '✅', label: "Today's Tasks", sub: 'Routines & chores by person' },
        { key: 'lists',    icon: '📋', label: 'Lists',         sub: 'Your shared lists & items' }
    ];

    var html = '';
    widgets.forEach(function(w) {
        var on = hpWidgets[w.key] !== false;
        html += '<div class="hp-customize-item" onclick="hpToggleWidget(\'' + w.key + '\')">' +
            '<div class="hp-customize-item-left">' +
            '<div class="hp-customize-item-icon">' + w.icon + '</div>' +
            '<div>' +
            '<div class="hp-customize-item-label">' + w.label + '</div>' +
            '<div class="hp-customize-item-sublabel">' + w.sub + '</div>' +
            '</div>' +
            '</div>' +
            '<div class="hp-toggle-switch' + (on ? ' on' : '') + '" id="hpToggle_' + w.key + '"></div>' +
            '</div>';
    });
    items.innerHTML = html;
    modal.classList.add('active');
};

window.closeHpCustomize = function() {
    var modal = document.getElementById('hpCustomizeModal');
    if (modal) modal.classList.remove('active');
    // Re-render homepage to reflect changes
    renderHomepage();
};

window.hpToggleWidget = function(key) {
    hpWidgets[key] = !hpWidgets[key];
    saveHpWidgets();
    // Update toggle visual immediately
    var toggle = document.getElementById('hpToggle_' + key);
    if (toggle) toggle.classList.toggle('on', !!hpWidgets[key]);
};

// ── Helpers ───────────────────────────────────────────────
function getTodayStr() {
    var d = new Date();
    return d.toISOString().split('T')[0];
}

function getHpMemberProgress(member) {
    var total = 0, done = 0;
    if (typeof routines !== 'undefined') {
        routines.forEach(function(r) { if (r.member === member.name) { total++; if (r.completed) done++; } });
    }
    if (typeof chores !== 'undefined') {
        chores.forEach(function(c) { if (c.member === member.name) { total++; if (c.completed) done++; } });
    }
    return total > 0 ? Math.round((done / total) * 100) : 0;
}

function hexToRgbaHp(hex, alpha) {
    if (typeof hexToRgba === 'function') return hexToRgba(hex, alpha);
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return 'rgba(102,126,234,' + alpha + ')';
    return 'rgba(' +
        parseInt(result[1], 16) + ',' +
        parseInt(result[2], 16) + ',' +
        parseInt(result[3], 16) + ',' + alpha + ')';
}

function escHtml(str) {
    return String(str)
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/"/g,'&quot;');
}

// ── Init: add Home nav + go to home if hash says so ──────
function init() {
    addHomeNavItem();

    // If hash is #/home, navigate there after scripts fully load
    if (window.location.hash === '#/home') {
        setTimeout(renderHomepage, 80);
    }

    // Listen for hash changes
    window.addEventListener('hashchange', function() {
        if (window.location.hash === '#/home') {
            renderHomepage();
        }
    });
}

// Run after DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    setTimeout(init, 0);
}

})();
