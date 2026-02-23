// ============================================================
// SKYLIGHT HABIT TRACKER — Streaks-style, per-person columns
// ============================================================

// --------------- Data helpers ---------------

function getHabits() {
    try { return JSON.parse(localStorage.getItem('skylightHabits')) || []; }
    catch(e) { return []; }
}
function saveHabits(h) { localStorage.setItem('skylightHabits', JSON.stringify(h)); }

function getHabitCompletions() {
    try { return JSON.parse(localStorage.getItem('skylightHabitCompletions')) || {}; }
    catch(e) { return {}; }
}
function saveHabitCompletions(c) { localStorage.setItem('skylightHabitCompletions', JSON.stringify(c)); }

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getCompletionKey(id, d) { return id + '_' + d; }

function isHabitDoneOn(habitId, dateStr) {
    return !!getHabitCompletions()[getCompletionKey(habitId, dateStr)];
}
function isHabitDoneToday(habitId) { return isHabitDoneOn(habitId, getTodayStr()); }

function toggleHabitCompletion(habitId) {
    var c = getHabitCompletions();
    var key = getCompletionKey(habitId, getTodayStr());
    if (c[key]) { delete c[key]; } else { c[key] = Date.now(); }
    saveHabitCompletions(c);
    renderHabitsView();
}

function getHabitStreak(habitId) {
    var c = getHabitCompletions();
    var streak = 0;
    var d = new Date();
    if (!c[getCompletionKey(habitId, d.toISOString().split('T')[0])]) {
        d.setDate(d.getDate() - 1);
    }
    for (var i = 0; i < 3650; i++) {
        var ds = d.toISOString().split('T')[0];
        if (c[getCompletionKey(habitId, ds)]) { streak++; d.setDate(d.getDate() - 1); }
        else { break; }
    }
    return streak;
}

function getHabitBestStreak(habitId) {
    var c = getHabitCompletions();
    var dates = Object.keys(c)
        .filter(function(k) { return k.indexOf(habitId + '_') === 0; })
        .map(function(k) { return k.replace(habitId + '_', ''); })
        .sort();
    if (dates.length === 0) return 0;
    var best = 1, cur = 1;
    for (var i = 1; i < dates.length; i++) {
        var prev = new Date(dates[i-1]);
        var curr = new Date(dates[i]);
        if ((curr - prev) / 86400000 === 1) { cur++; if (cur > best) best = cur; }
        else { cur = 1; }
    }
    return best;
}

function getTotalCompletions(habitId) {
    var c = getHabitCompletions();
    return Object.keys(c).filter(function(k) { return k.indexOf(habitId + '_') === 0; }).length;
}

function getHabitCompletionRate(habitId) {
    var c = getHabitCompletions();
    var habits = getHabits();
    var habit = habits.filter(function(h) { return h.id === habitId; })[0];
    if (!habit) return 0;
    var today = new Date();
    var created = new Date(habit.createdAt || today);
    var days = Math.max(1, Math.min(30, Math.floor((today - created) / 86400000) + 1));
    var done = 0;
    for (var i = 0; i < days; i++) {
        var d = new Date(today); d.setDate(today.getDate() - i);
        if (c[getCompletionKey(habitId, d.toISOString().split('T')[0])]) done++;
    }
    return Math.round((done / days) * 100);
}

function getLast30Days(habitId) {
    var c = getHabitCompletions();
    var today = new Date();
    var result = [];
    for (var i = 29; i >= 0; i--) {
        var d = new Date(today); d.setDate(today.getDate() - i);
        var ds = d.toISOString().split('T')[0];
        result.push({ dateStr: ds, completed: !!c[getCompletionKey(habitId, ds)], isToday: i === 0 });
    }
    return result;
}

// --------------- SVG ring helper ---------------

function buildStreaksRing(size, stroke, color, trackColor, pct, emoji, done) {
    var r = (size - stroke) / 2;
    var cx = size / 2, cy = size / 2;
    var circ = 2 * Math.PI * r;
    var offset = circ - (pct / 100) * circ;
    var emojiSize = Math.round(size * 0.34);
    var innerFill = done ? color : 'transparent';
    var innerR = r - stroke / 2 - 1;

    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">'
        + '<circle cx="' + cx + '" cy="' + cy + '" r="' + innerR + '" fill="' + innerFill + '" opacity="0.18"/>'
        + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + trackColor + '" stroke-width="' + stroke + '"/>'
        + '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none"'
        + ' stroke="' + color + '" stroke-width="' + stroke + '"'
        + ' stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '"'
        + ' stroke-linecap="round"'
        + ' transform="rotate(-90 ' + cx + ' ' + cy + ')"'
        + ' class="habit-ring-arc"'
        + '/>'
        + '<text x="' + cx + '" y="' + (cy + emojiSize * 0.38) + '" text-anchor="middle" font-size="' + emojiSize + '">' + emoji + '</text>'
        + '</svg>';
}

// --------------- Main render ---------------

function renderHabitsView() {
    var container = document.getElementById('habitsContainer');
    if (!container) return;

    var habits = getHabits();

    var members = (typeof familyMembers !== 'undefined' ? familyMembers : [])
        .filter(function(m) { return !m.isGoogleCalendar; });

    if (members.length === 0) {
        container.innerHTML = '<div class="habits-empty"><div class="habits-empty-icon">👥</div><div class="habits-empty-text">No family members found</div></div>';
        return;
    }

    var html = '<div class="habits-columns-wrap">';

    members.forEach(function(member) {
        var memberHabits = habits.filter(function(h) { return h.memberId === member.name; });
        var memberColor = member.color || '#a8d8f0';
        var totalDone = memberHabits.filter(function(h) { return isHabitDoneToday(h.id); }).length;
        var total = memberHabits.length;

        html += '<div class="habits-column">';

        // Column header
        html += '<div class="habits-col-header">';
        html += '<div class="habits-col-avatar" style="background:' + memberColor + '">' + member.name.charAt(0).toUpperCase() + '</div>';
        html += '<div class="habits-col-name">' + member.name + '</div>';
        if (total > 0) {
            html += '<div class="habits-col-badge" style="background:' + memberColor + '">' + totalDone + '/' + total + '</div>';
        }
        html += '</div>';

        if (memberHabits.length === 0) {
            html += '<div class="habits-col-empty">';
            html += '<div class="habits-col-empty-text">No habits yet</div>';
            html += '<button class="habits-col-add-btn" onclick="openAddHabitModal(\'' + member.name + '\')">+ Add habit</button>';
            html += '</div>';
        } else {
            // 2x2 Streaks-style grid
            html += '<div class="habits-grid">';
            memberHabits.forEach(function(habit) {
                var done = isHabitDoneToday(habit.id);
                var streak = getHabitStreak(habit.id);

                html += '<div class="habit-circle-wrap' + (done ? ' habit-circle-done' : '') + '" onclick="toggleHabitCompletion(\'' + habit.id + '\')">';
                html += '<div class="habit-ring-container" style="--mc:' + memberColor + '">';
                html += buildStreaksRing(96, 7, memberColor, '#E8EBF0', done ? 100 : 0, habit.emoji || '⭐', done);
                html += '</div>';
                html += '<div class="habit-circle-label">' + habit.name + '</div>';
                if (streak > 0) {
                    html += '<div class="habit-circle-streak">🔥 ' + streak + '</div>';
                }
                // Info button (stops propagation so it doesn't toggle)
                html += '<button class="habit-info-btn" onclick="event.stopPropagation();openHabitStats(\'' + habit.id + '\')" title="Stats &amp; Edit">•••</button>';
                html += '</div>';
            });

            // Add slot if < 4 habits
            if (memberHabits.length < 4) {
                html += '<div class="habit-circle-wrap habit-circle-add-slot" onclick="openAddHabitModal(\'' + member.name + '\')">';
                html += '<div class="habit-ring-container">';
                html += '<svg width="96" height="96" viewBox="0 0 96 96"><circle cx="48" cy="48" r="44" fill="none" stroke="#E8EBF0" stroke-width="7" stroke-dasharray="5 4"/><text x="48" y="56" text-anchor="middle" font-size="28" fill="#C8CCD4">+</text></svg>';
                html += '</div>';
                html += '<div class="habit-circle-label" style="color:#c0c0cc">Add</div>';
                html += '</div>';
            }

            html += '</div>'; // habits-grid

            // Stats bar
            var allCompletions = memberHabits.reduce(function(s, h) { return s + getTotalCompletions(h.id); }, 0);
            var bestStreak = memberHabits.reduce(function(b, h) { return Math.max(b, getHabitBestStreak(h.id)); }, 0);
            var curStreak = memberHabits.reduce(function(b, h) { return Math.max(b, getHabitStreak(h.id)); }, 0);

            html += '<div class="habits-stats-bar">';
            html += '<div class="hstat"><span class="hstat-val" style="color:' + memberColor + '">' + curStreak + '</span><span class="hstat-lbl">Streak</span></div>';
            html += '<div class="hstat-sep"></div>';
            html += '<div class="hstat"><span class="hstat-val">' + bestStreak + '</span><span class="hstat-lbl">Best</span></div>';
            html += '<div class="hstat-sep"></div>';
            html += '<div class="hstat"><span class="hstat-val">' + allCompletions + '</span><span class="hstat-lbl">Total</span></div>';
            html += '</div>';
        }

        html += '</div>'; // habits-column
    });

    html += '</div>'; // columns-wrap
    container.innerHTML = html;
}

// --------------- Stats + Edit panel ---------------

function openHabitStats(habitId) {
    var habit = getHabits().filter(function(h) { return h.id === habitId; })[0];
    if (!habit) return;

    var members = (typeof familyMembers !== 'undefined' ? familyMembers : []);
    var member = members.filter(function(m) { return m.name === habit.memberId; })[0];
    var mc = member ? (member.color || '#a8d8f0') : '#a8d8f0';

    var streak = getHabitStreak(habitId);
    var best = getHabitBestStreak(habitId);
    var total = getTotalCompletions(habitId);
    var rate = getHabitCompletionRate(habitId);
    var days30 = getLast30Days(habitId);
    var done = isHabitDoneToday(habitId);
    var createdStr = habit.createdAt ? new Date(habit.createdAt).toLocaleDateString('en-US', {month:'short', day:'numeric', year:'numeric'}) : '';

    // 30-day dot grid
    var dots = '<div class="hstats-dot-grid">';
    days30.forEach(function(day) {
        dots += '<div class="hstats-dot' + (day.completed ? ' hstats-dot-done' : '') + (day.isToday ? ' hstats-dot-today' : '') + '" style="' + (day.completed ? 'background:' + mc : '') + '" title="' + day.dateStr + '"></div>';
    });
    dots += '</div>';

    var html = '<div class="hstats-overlay" onclick="closeHabitStats()">'
        + '<div class="hstats-panel" onclick="event.stopPropagation()">'

        // Colored header
        + '<div class="hstats-header" style="--mc:' + mc + '">'
        + '<button class="hstats-close" onclick="closeHabitStats()">×</button>'
        + '<div class="hstats-hero-ring">' + buildStreaksRing(80, 7, '#fff', 'rgba(255,255,255,0.3)', done ? 100 : 0, habit.emoji || '⭐', done) + '</div>'
        + '<div class="hstats-hero-name">' + habit.name + '</div>'
        + '<div class="hstats-hero-sub">' + (habit.memberId || '') + (createdStr ? ' · Since ' + createdStr : '') + '</div>'
        + '</div>'

        + '<div class="hstats-body">'

        // Stats row
        + '<div class="hstats-row">'
        + '<div class="hstats-stat"><div class="hstats-stat-val" style="color:' + mc + '">' + streak + '</div><div class="hstats-stat-lbl">Current<br>Streak</div></div>'
        + '<div class="hstats-stat"><div class="hstats-stat-val">' + best + '</div><div class="hstats-stat-lbl">Best<br>Streak</div></div>'
        + '<div class="hstats-stat"><div class="hstats-stat-val">' + rate + '%</div><div class="hstats-stat-lbl">30-Day<br>Rate</div></div>'
        + '<div class="hstats-stat"><div class="hstats-stat-val">' + total + '</div><div class="hstats-stat-lbl">All Time</div></div>'
        + '</div>'

        + '<div class="hstats-section-label">Last 30 Days</div>'
        + dots

        + '<div class="hstats-btns">'
        + '<button class="hstats-toggle-btn' + (done ? ' hstats-toggle-done' : '') + '" style="--mc:' + mc + '" onclick="toggleHabitCompletion(\'' + habitId + '\');closeHabitStats();">'
        + (done ? '✓ Done Today' : 'Mark Done Today') + '</button>'
        + '</div>'

        + '<div class="hstats-edit-row">'
        + '<button class="hstats-edit-btn" onclick="closeHabitStats();openEditHabitModal(\'' + habitId + '\')">✏️ Edit Habit</button>'
        + '<button class="hstats-delete-btn" onclick="deleteHabit(\'' + habitId + '\');closeHabitStats();">🗑️ Delete</button>'
        + '</div>'

        + '</div>'
        + '</div>'
        + '</div>';

    var el = document.createElement('div');
    el.id = 'habitStatsContainer';
    el.innerHTML = html;
    document.body.appendChild(el);
}

function closeHabitStats() {
    var el = document.getElementById('habitStatsContainer');
    if (el) el.remove();
}

// --------------- Add / Edit Modal ---------------

function openAddHabitModal(memberName) {
    openHabitModal(null, memberName || null);
}

function openEditHabitModal(habitId) {
    var habit = getHabits().filter(function(h) { return h.id === habitId; })[0];
    openHabitModal(habitId, habit ? habit.memberId : null);
}

function openHabitModal(habitId, preselectedMember) {
    var habits = getHabits();
    var habit = habitId ? habits.filter(function(h) { return h.id === habitId; })[0] : null;

    var members = (typeof familyMembers !== 'undefined' ? familyMembers : [])
        .filter(function(m) { return !m.isGoogleCalendar; });

    var defaultEmojis = ['💧','🏃','📚','🧘','🥗','😴','💊','🎯','🎨','🎵','✍️','🧹','🚶','🏋️','🛁','🌿','☀️','🍎','🧸','🎮'];
    var selMember = habit ? habit.memberId : (preselectedMember || (members[0] ? members[0].name : ''));
    var selEmoji = habit ? (habit.emoji || '⭐') : '⭐';

    var memberBtns = members.map(function(m) {
        return '<button class="hmodal-member-btn' + (m.name === selMember ? ' selected' : '') + '" style="--mc:' + (m.color || '#aaa') + '" onclick="selectHabitMember(\'' + m.name + '\')" data-member="' + m.name + '">'
            + '<span class="hmodal-avatar">' + m.name.charAt(0) + '</span>' + m.name + '</button>';
    }).join('');

    var emojiBtns = defaultEmojis.map(function(e) {
        return '<button class="hmodal-emoji-btn' + (e === selEmoji ? ' selected' : '') + '" onclick="selectHabitEmoji(\'' + e + '\')" data-emoji="' + e + '">' + e + '</button>';
    }).join('');

    var html = '<div class="hmodal-overlay" onclick="closeHabitModal()">'
        + '<div class="hmodal" onclick="event.stopPropagation()">'
        + '<div class="hmodal-header"><h3>' + (habit ? 'Edit Habit' : 'Add Habit') + '</h3>'
        + '<button class="hmodal-close" onclick="closeHabitModal()">×</button></div>'
        + '<div class="hmodal-body">'
        + '<label class="hmodal-label">For</label>'
        + '<div class="hmodal-member-row" id="hmodalMemberGrid">' + memberBtns + '</div>'
        + '<label class="hmodal-label">Habit Name</label>'
        + '<input type="text" class="hmodal-input" id="habitNameInput" placeholder="e.g. Drink water, Read, Exercise..." value="' + (habit ? habit.name : '') + '">'
        + '<label class="hmodal-label">Icon</label>'
        + '<div class="hmodal-emoji-grid">' + emojiBtns + '</div>'
        + '<input type="text" class="hmodal-input hmodal-emoji-input" id="habitEmojiInput" placeholder="Or paste any emoji" value="' + selEmoji + '" oninput="updateHabitEmojiFromInput(this)">'
        + '</div>'
        + '<div class="hmodal-footer">'
        + '<button class="hmodal-cancel" onclick="closeHabitModal()">Cancel</button>'
        + '<button class="hmodal-save" onclick="saveHabitFromModal(' + (habit ? '"' + habit.id + '"' : 'null') + ')">' + (habit ? 'Save' : 'Add Habit') + '</button>'
        + '</div>'
        + '</div>'
        + '</div>';

    var el = document.createElement('div');
    el.id = 'habitModalContainer';
    el.innerHTML = html;
    document.body.appendChild(el);
    setTimeout(function() { var i = document.getElementById('habitNameInput'); if (i) i.focus(); }, 60);
}

function closeHabitModal() {
    var el = document.getElementById('habitModalContainer');
    if (el) el.remove();
}

function selectHabitMember(name) {
    document.querySelectorAll('.hmodal-member-btn').forEach(function(b) {
        b.classList.toggle('selected', b.dataset.member === name);
    });
}

function selectHabitEmoji(emoji) {
    document.querySelectorAll('.hmodal-emoji-btn').forEach(function(b) {
        b.classList.toggle('selected', b.dataset.emoji === emoji);
    });
    var i = document.getElementById('habitEmojiInput');
    if (i) i.value = emoji;
}

function updateHabitEmojiFromInput(input) {
    var val = input.value.trim();
    document.querySelectorAll('.hmodal-emoji-btn').forEach(function(b) {
        b.classList.toggle('selected', b.dataset.emoji === val);
    });
}

function saveHabitFromModal(habitId) {
    var name = document.getElementById('habitNameInput').value.trim();
    if (!name) { document.getElementById('habitNameInput').focus(); return; }
    var emoji = (document.getElementById('habitEmojiInput').value.trim()) || '⭐';
    var selEl = document.querySelector('.hmodal-member-btn.selected');
    var memberId = selEl ? selEl.dataset.member : '';
    if (!memberId) { alert('Please select a person'); return; }

    var habits = getHabits();
    if (habitId) {
        habits = habits.map(function(h) {
            return h.id === habitId ? Object.assign({}, h, { name: name, emoji: emoji, memberId: memberId }) : h;
        });
    } else {
        habits.push({ id: 'habit_' + Date.now(), name: name, emoji: emoji, memberId: memberId, createdAt: new Date().toISOString() });
    }
    saveHabits(habits);
    closeHabitModal();
    renderHabitsView();
}

function deleteHabit(habitId) {
    if (!confirm('Delete this habit? All history will be lost.')) return;
    saveHabits(getHabits().filter(function(h) { return h.id !== habitId; }));
    renderHabitsView();
}
