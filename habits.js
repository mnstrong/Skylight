// habits.js — Supabase-backed habits (no localStorage)

function getHabits() {
    return window.skylightHabits || [];
}

function saveHabits(h) {
    window.skylightHabits = h;
    // No localStorage write — Supabase is source of truth
}

function getHabitCompletions() {
    return window.skylightHabitCompletions || {};
}

function saveHabitCompletions(c) {
    window.skylightHabitCompletions = c;
}

function getTodayStr() { return new Date().toISOString().split('T')[0]; }
function getCompletionKey(id, d) { return id + '_' + d; }

function isHabitDoneOn(habitId, dateStr) {
    return !!getHabitCompletions()[getCompletionKey(habitId, dateStr)];
}
function isHabitDoneToday(habitId) { return isHabitDoneOn(habitId, getTodayStr()); }

function toggleHabitCompletion(habitId) {
    var c = getHabitCompletions();
    var key = getCompletionKey(habitId, getTodayStr());
    var dateStr = getTodayStr();
    if (c[key]) {
        delete c[key];
        saveHabitCompletions(c);
        // Delete from Supabase
        if (window.SupabaseAPI && typeof window.SupabaseAPI.deleteHabitCompletion === 'function') {
            window.SupabaseAPI.deleteHabitCompletion(habitId, dateStr).catch(console.error);
        }
    } else {
        c[key] = Date.now();
        saveHabitCompletions(c);
        // Add to Supabase
        if (window.SupabaseAPI && typeof window.SupabaseAPI.addHabitCompletion === 'function') {
            window.SupabaseAPI.addHabitCompletion(habitId, dateStr).catch(console.error);
        }
    }
    renderHabitsView();
}

function getHabitStreak(habitId) {
    var c = getHabitCompletions();
    var streak = 0;
    var d = new Date();
    // Don't count today if not done
    if (!isHabitDoneToday(habitId)) d.setDate(d.getDate() - 1);
    for (var i = 0; i < 365; i++) {
        var ds = d.toISOString().split('T')[0];
        if (c[getCompletionKey(habitId, ds)]) {
            streak++;
            d.setDate(d.getDate() - 1);
        } else {
            break;
        }
    }
    return streak;
}

function renderHabitsView() {
    var container = document.getElementById('habitsContainer');
    if (!container) return;

    var habits = getHabits();

    var members = (typeof familyMembers !== 'undefined' ? familyMembers : [])
        .filter(function(m) {
            if (m.isGoogleCalendar) return false;
            if (typeof memberHasSection === 'function') return memberHasSection(m, 'habits');
            return true;
        });

    if (members.length === 0) {
        container.innerHTML = '<div class="habits-empty"><div class="habits-empty-icon">👥</div><div class="habits-empty-text">No family members found</div></div>';
        return;
    }

    var html = '<div class="habits-columns-wrap">';

    members.forEach(function(member) {
        var memberHabits = habits.filter(function(h) { return h.memberId === member.name; });
        var memberColor = member.color || '#a8d8f0';

        html += '<div class="habits-column">';
        html += '<div class="habits-col-header" style="background:' + memberColor + '">';
        html += '<span class="habits-col-avatar">' + member.name.charAt(0).toUpperCase() + '</span>';
        html += '<span class="habits-col-name">' + member.name + '</span>';
        html += '<button class="habits-add-btn" onclick="openHabitModal(null,\'' + member.name + '\')" style="background:' + memberColor + '">+</button>';
        html += '</div>';

        if (memberHabits.length === 0) {
            html += '<div class="habits-empty-col">No habits yet</div>';
        } else {
            memberHabits.forEach(function(habit) {
                var done = isHabitDoneToday(habit.id);
                var streak = getHabitStreak(habit.id);
                html += '<div class="habit-row' + (done ? ' habit-row-done' : '') + '">';
                html += '<div class="habit-circle-wrap' + (done ? ' habit-circle-done' : '') + '" onclick="toggleHabitCompletion(\'' + habit.id + '\')">';
                html += '<div class="habit-circle" style="border-color:' + memberColor + (done ? ';background:' + memberColor : '') + '">';
                html += '<span class="habit-emoji">' + (habit.emoji || '⭐') + '</span>';
                html += '</div></div>';
                html += '<div class="habit-info" onclick="openHabitStats(\'' + habit.id + '\')">';
                html += '<div class="habit-name">' + habit.name + '</div>';
                if (streak > 0) html += '<div class="habit-streak">🔥 ' + streak + ' day streak</div>';
                html += '</div>';
                html += '<button class="habit-edit-btn" onclick="openHabitModal(\'' + habit.id + '\',\'' + member.name + '\')">✏️</button>';
                html += '</div>';
            });
        }
        html += '</div>';
    });

    html += '</div>';
    container.innerHTML = html;
}

var _habitModalCurrentId = null;
var _habitModalMember = null;

function openHabitModal(habitId, memberName) {
    _habitModalCurrentId = habitId || null;
    _habitModalMember = memberName;

    var overlay = document.getElementById('habitModalOverlay');
    var modal = document.getElementById('habitModal');
    if (!overlay || !modal) return;

    document.getElementById('habitModalTitle').textContent = habitId ? 'Edit Habit' : 'Add Habit';
    document.getElementById('habitNameInput').value = '';
    document.getElementById('habitEmojiInput').value = '';

    if (habitId) {
        var h = getHabits().find(function(x) { return x.id === habitId; });
        if (h) {
            document.getElementById('habitNameInput').value = h.name;
            document.getElementById('habitEmojiInput').value = h.emoji || '';
        }
    }

    // Populate member buttons
    var fm = (typeof familyMembers !== 'undefined' ? familyMembers : []).filter(function(m) { return !m.isGoogleCalendar; });
    var btnHtml = fm.map(function(m) {
        var sel = m.name === memberName ? ' selected' : '';
        return '<button class="hmodal-member-btn' + sel + '" data-member="' + m.name + '" style="background:' + m.color + '" onclick="hmodalSelectMember(this)">' + m.name.charAt(0).toUpperCase() + '</button>';
    }).join('');
    var btnContainer = document.getElementById('habitMemberBtns');
    if (btnContainer) btnContainer.innerHTML = btnHtml;

    overlay.classList.add('active');
    modal.classList.add('active');
}

function hmodalSelectMember(btn) {
    document.querySelectorAll('.hmodal-member-btn').forEach(function(b) { b.classList.remove('selected'); });
    btn.classList.add('selected');
}

function closeHabitModal() {
    var overlay = document.getElementById('habitModalOverlay');
    var modal = document.getElementById('habitModal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
}

function saveHabitFromModal(habitId) {
    var name = document.getElementById('habitNameInput').value.trim();
    if (!name) { document.getElementById('habitNameInput').focus(); return; }
    var emoji = (document.getElementById('habitEmojiInput').value.trim()) || '⭐';
    var selEl = document.querySelector('.hmodal-member-btn.selected');
    var memberId = selEl ? selEl.dataset.member : '';
    if (!memberId) { alert('Please select a person'); return; }

    var habits = getHabits();
    var fm = (typeof familyMembers !== 'undefined' ? familyMembers : []);
    var memberObj = fm.find(function(m) { return m.name === memberId; });

    if (habitId) {
        // Update existing
        habits = habits.map(function(h) {
            return h.id === habitId ? Object.assign({}, h, { name: name, emoji: emoji, memberId: memberId }) : h;
        });
        saveHabits(habits);
        // Sync to Supabase
        if (window.SupabaseAPI) {
            window.SupabaseAPI.updateHabit(habitId, {
                name: name, emoji: emoji,
                member_name: memberId,
                member_id: memberObj ? memberObj.id : null
            }).catch(console.error);
        }
    } else {
        // Add new
        var newHabit = { id: 'habit_' + Date.now(), name: name, emoji: emoji, memberId: memberId, createdAt: new Date().toISOString() };
        habits.push(newHabit);
        saveHabits(habits);
        // Sync to Supabase
        if (window.SupabaseAPI) {
            window.SupabaseAPI.addHabit({
                id: newHabit.id,
                name: name,
                emoji: emoji,
                member_name: memberId,
                member_id: memberObj ? memberObj.id : null,
                created_at: newHabit.createdAt
            }).catch(console.error);
        }
    }

    closeHabitModal();
    renderHabitsView();
}

function deleteHabit(habitId) {
    if (!confirm('Delete this habit?')) return;
    var habits = getHabits().filter(function(h) { return h.id !== habitId; });
    saveHabits(habits);
    // Sync to Supabase
    if (window.SupabaseAPI) {
        window.SupabaseAPI.deleteHabit(habitId).catch(console.error);
    }
    closeHabitModal();
    renderHabitsView();
}

var _habitStatsId = null;

function openHabitStats(habitId) {
    _habitStatsId = habitId;
    var habit = getHabits().find(function(h) { return h.id === habitId; });
    if (!habit) return;

    var overlay = document.getElementById('habitStatsOverlay');
    var modal = document.getElementById('habitStatsModal');
    if (!overlay || !modal) return;

    var streak = getHabitStreak(habitId);
    var done = isHabitDoneToday(habitId);
    var fm = (typeof familyMembers !== 'undefined' ? familyMembers : []);
    var memberObj = fm.find(function(m) { return m.name === habit.memberId; });
    var mc = memberObj ? memberObj.color : '#888';

    var html = '<div class="hstats-header">';
    html += '<div class="hstats-emoji">' + (habit.emoji || '⭐') + '</div>';
    html += '<div class="hstats-name">' + habit.name + '</div>';
    html += '</div>';
    html += '<div class="hstats-streak">🔥 ' + streak + ' day streak</div>';
    html += '<button class="hstats-toggle-btn' + (done ? ' hstats-toggle-done' : '') + '" style="--mc:' + mc + '" onclick="toggleHabitCompletion(\'' + habitId + '\');closeHabitStats();">';
    html += done ? '✓ Done today' : 'Mark done today';
    html += '</button>';
    html += '<div class="hstats-actions">';
    html += '<button onclick="openHabitModal(\'' + habitId + '\',\'' + habit.memberId + '\');closeHabitStats();">Edit</button>';
    html += '<button class="hstats-delete" onclick="deleteHabit(\'' + habitId + '\');closeHabitStats();">Delete</button>';
    html += '</div>';

    modal.innerHTML = html;
    overlay.classList.add('active');
    modal.classList.add('active');
}

function closeHabitStats() {
    var overlay = document.getElementById('habitStatsOverlay');
    var modal = document.getElementById('habitStatsModal');
    if (overlay) overlay.classList.remove('active');
    if (modal) modal.classList.remove('active');
}
