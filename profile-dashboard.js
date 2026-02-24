// ============================================================
// SKYLIGHT — PROFILE DASHBOARD
// ============================================================

var profileDashboardBgImages = {
    // Illustrated SVG backgrounds per member, generated inline
};

// Greeting based on time
function getDashboardGreeting() {
    var h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

// Get day name
function getDayName() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long' });
}

// Format date nicely
function formatDashDate() {
    return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Format time
function formatTime(timeStr) {
    if (!timeStr) return '';
    var parts = timeStr.split(':');
    var h = parseInt(parts[0]);
    var m = parts[1];
    var ampm = h >= 12 ? 'pm' : 'am';
    h = h % 12 || 12;
    return h + ':' + m + ' ' + ampm;
}


// Check if a member is referenced in an event (by member field or notes)
function eventBelongsToMember(e, memberName) {
    if (!e.member && !e.notes) return false;
    if (e.member === memberName) return true;
    if (e.notes && e.notes.toLowerCase().indexOf(memberName.toLowerCase()) !== -1) return true;
    return false;
}

// Get member's events for today
function getDashboardTodayEvents(memberName) {
    try {
        var todayStr = new Date().toISOString().split('T')[0];
        var allEvents = typeof getAllEvents === 'function' ? getAllEvents() : (window.events || []);
        return allEvents.filter(function(e) {
            var onDate = typeof isEventOnDate === 'function'
                ? isEventOnDate(e, todayStr)
                : (e.date === todayStr);
            return onDate && eventBelongsToMember(e, memberName);
        }).sort(function(a, b) {
            return (a.time || '').localeCompare(b.time || '');
        });
    } catch(err) { return []; }
}

// Get member's upcoming events (next 7 days, not today)
function getDashboardUpcomingEvents(memberName) {
    try {
        var today = new Date();
        var todayStr = today.toISOString().split('T')[0];
        var allEvents = typeof getAllEvents === 'function' ? getAllEvents() : (window.events || []);
        var upcoming = [];
        for (var i = 1; i <= 7; i++) {
            var d = new Date(today);
            d.setDate(today.getDate() + i);
            var ds = d.toISOString().split('T')[0];
            allEvents.forEach(function(e) {
                var onDate = typeof isEventOnDate === 'function'
                    ? isEventOnDate(e, ds)
                    : (e.date === ds);
                if (onDate && eventBelongsToMember(e, memberName)) {
                    upcoming.push(Object.assign({}, e, { _dateStr: ds }));
                }
            });
        }
        return upcoming.slice(0, 5);
    } catch(err) { return []; }
}

// Get member's chores (today/pending)
function getDashboardChores(memberName) {
    try {
        var todayStr = new Date().toISOString().split('T')[0];
        var allChores = JSON.parse(localStorage.getItem('chores')) || [];
        var allRoutines = JSON.parse(localStorage.getItem('routines')) || [];
        var memberChores = allChores.filter(function(c) { return c.member === memberName; });
        var memberRoutines = allRoutines.filter(function(r) { return r.member === memberName; });
        return { chores: memberChores, routines: memberRoutines };
    } catch(err) { return { chores: [], routines: [] }; }
}

// Get member's stars
function getDashboardStars(memberName) {
    try {
        var allChores = JSON.parse(localStorage.getItem('chores')) || [];
        var allRoutines = JSON.parse(localStorage.getItem('routines')) || [];
        var choreStars = allChores.filter(function(c) { return c.member === memberName && c.completed && c.stars; })
            .reduce(function(s, c) { return s + c.stars; }, 0);
        var routineStars = allRoutines.filter(function(r) { return r.member === memberName && r.completed && r.stars; })
            .reduce(function(s, r) { return s + r.stars; }, 0);
        return choreStars + routineStars;
    } catch(err) { return 0; }
}

// Get member's habits
function getDashboardHabits(memberName) {
    try {
        var habits = JSON.parse(localStorage.getItem('skylightHabits')) || [];
        return habits.filter(function(h) { return h.memberId === memberName; });
    } catch(err) { return []; }
}

// Get member's rewards
function getDashboardRewards(memberName) {
    try {
        var rewards = JSON.parse(localStorage.getItem('rewards')) || [];
        return rewards.filter(function(r) { return r.member === memberName && !r.redeemed; }).slice(0, 3);
    } catch(err) { return []; }
}

// Get member's allowance
function getDashboardAllowance(memberName) {
    try {
        var allowances = JSON.parse(localStorage.getItem('allowances')) || [];
        return allowances.find(function(a) { return a.member === memberName; }) || null;
    } catch(err) { return null; }
}

// Weather cache
var _dashWeather = null;
function loadDashWeather(callback) {
    if (_dashWeather) { callback(_dashWeather); return; }
    try {
        fetch('https://api.open-meteo.com/v1/forecast?latitude=33.4484&longitude=-112.0740&current=temperature_2m,weather_code&temperature_unit=fahrenheit&timezone=America/Phoenix')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                var code = data.current.weather_code;
                var emojis = { 0: '☀️', 1: '🌤️', 2: '⛅', 3: '☁️' };
                var emoji = code === 0 ? '☀️' : code <= 3 ? '⛅' : code <= 67 ? '🌧️' : code <= 77 ? '🌨️' : '🌤️';
                _dashWeather = { temp: Math.round(data.current.temperature_2m), emoji: emoji, code: code };
                callback(_dashWeather);
            })
            .catch(function() { callback(null); });
    } catch(e) { callback(null); }
}

// ---- Decorative SVG blobs for card backgrounds ----
function blobBg(color, opacity) {
    var c = color || '#a8d8f0';
    var op = opacity || 0.13;
    return 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 200 200\'%3E%3Cpath fill=\'' + encodeURIComponent(c) + '\' fill-opacity=\'' + op + '\' d=\'M42.8,-62.3C54.2,-53.6,61.5,-39.2,66.4,-24.1C71.3,-9,73.7,6.8,69.2,20.5C64.7,34.2,53.3,45.8,40.2,54.7C27.1,63.6,12.4,69.8,-2.7,73.1C-17.8,76.5,-33.4,77,-46.5,69.5C-59.6,62,-70.1,46.5,-74.4,29.7C-78.7,12.9,-76.8,-5.2,-70.2,-20.4C-63.6,-35.6,-52.3,-47.9,-39.3,-56.3C-26.3,-64.7,-11.6,-69.2,2.4,-72.5C16.4,-75.8,31.3,-71,42.8,-62.3Z\' transform=\'translate(100 100)\'/%3E%3C/svg%3E")';
}

// ---- Main render ----
function openProfileDashboard(memberName) {
    var members = window.familyMembers || JSON.parse(localStorage.getItem('familyMembers') || '[]');
    var member = members.find(function(m) { return m.name === memberName; });
    // If member not found in cache, create a minimal placeholder so the modal still opens
    if (!member) {
        member = { name: memberName, color: '#a8d8f0' };
    }

    var mc = member.color || '#a8d8f0';
    var mcLight = mc + '22';
    var mcMid = mc + '55';

    var todayEvents = getDashboardTodayEvents(memberName);
    var upcomingEvents = getDashboardUpcomingEvents(memberName);
    var choreData = getDashboardChores(memberName);
    var stars = getDashboardStars(memberName);
    var habits = getDashboardHabits(memberName);
    var rewards = getDashboardRewards(memberName);
    var allowance = getDashboardAllowance(memberName);

    var pendingChores = choreData.chores.filter(function(c) { return !c.completed; });
    var doneChores = choreData.chores.filter(function(c) { return c.completed; });
    var pendingRoutines = choreData.routines.filter(function(r) { return !r.completed; });
    var doneHabits = habits.filter(function(h) { return typeof isHabitDoneToday === 'function' ? isHabitDoneToday(h.id) : false; });

    // ---- Build HTML ----
    var html = '<div class="pdb-overlay" id="profileDashOverlay">';
    html += '<div class="pdb-container" id="profileDashContainer">';

    // ---- HERO HEADER ----
    html += '<div class="pdb-hero" style="background: linear-gradient(135deg, ' + mc + 'dd 0%, ' + mc + '88 50%, ' + mc + '33 100%)">';
    html += '<div class="pdb-hero-deco"></div>';
    html += '<button class="pdb-close" onclick="closeProfileDashboard()">×</button>';
    html += '<div class="pdb-hero-content">';
    html += '<div class="pdb-avatar">' + memberName.charAt(0).toUpperCase() + '</div>';
    html += '<div class="pdb-hero-text">';
    html += '<div class="pdb-greeting">' + getDashboardGreeting() + ',</div>';
    html += '<div class="pdb-hero-name">' + memberName + ' 👋</div>';
    html += '<div class="pdb-hero-date" id="pdbHeroDate">' + formatDashDate() + '</div>';
    html += '</div>';
    html += '</div>';

    // Quick stat pills in hero
    html += '<div class="pdb-hero-pills">';
    if (stars > 0) html += '<div class="pdb-pill">⭐ ' + stars + ' stars</div>';
    if (doneHabits.length > 0) html += '<div class="pdb-pill">✓ ' + doneHabits.length + '/' + habits.length + ' habits</div>';
    if (doneChores.length > 0) html += '<div class="pdb-pill">🏠 ' + doneChores.length + ' chores done</div>';
    html += '</div>';

    html += '</div>'; // hero

    // ---- GRID ----
    html += '<div class="pdb-grid">';

    // ---- TODAY'S SCHEDULE card ----
    html += '<div class="pdb-card pdb-card-wide pdb-card-schedule">';
    html += '<div class="pdb-card-deco" style="background:' + blobBg(mc, 0.12) + ';background-size:cover;background-position:center"></div>';
    html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:' + mc + '">📅</div><div class="pdb-card-title">Today\'s Schedule</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'calendar\')">View all →</button></div>';

    if (todayEvents.length === 0) {
        html += '<div class="pdb-empty-mini">🌿 Nothing scheduled today — enjoy the free time!</div>';
    } else {
        html += '<div class="pdb-event-list">';
        todayEvents.slice(0, 5).forEach(function(ev) {
            var evMember = members.find(function(m) { return m.name === ev.member; });
            var evColor = evMember ? evMember.color : mc;
            html += '<div class="pdb-event-row">';
            html += '<div class="pdb-event-dot" style="background:' + evColor + '"></div>';
            html += '<div class="pdb-event-info">';
            html += '<div class="pdb-event-title">' + (ev.emoji || '') + ' ' + ev.title + '</div>';
            if (ev.time) html += '<div class="pdb-event-time">🕐 ' + formatTime(ev.time) + '</div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>'; // schedule card

    // ---- WEATHER card ----
    html += '<div class="pdb-card pdb-card-weather" id="pdbWeatherCard" style="background: linear-gradient(135deg, #fff8e8, #ffecc0)">';
    html += '<div class="pdb-weather-icon">⛅</div>';
    html += '<div class="pdb-weather-temp" id="pdbWeatherTemp">--°F</div>';
    html += '<div class="pdb-weather-label">Phoenix, AZ</div>';
    html += '</div>';

    // ---- CHORES card ----
    html += '<div class="pdb-card pdb-card-chores">';
    html += '<div class="pdb-card-deco" style="background:' + blobBg('#f0c4a8', 0.2) + ';background-size:cover;background-position:center"></div>';
    html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:#f0b870">✓</div><div class="pdb-card-title">Tasks & Chores</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'chores\')">See all →</button></div>';

    if (pendingChores.length === 0 && pendingRoutines.length === 0) {
        html += '<div class="pdb-empty-mini">🎉 All caught up!</div>';
    } else {
        html += '<div class="pdb-chore-list">';
        pendingRoutines.slice(0, 3).forEach(function(r) {
            html += '<div class="pdb-chore-row">';
            html += '<div class="pdb-chore-icon">' + (r.icon || '🔄') + '</div>';
            html += '<div class="pdb-chore-name">' + r.title + '</div>';
            html += '<div class="pdb-chore-freq">' + (r.frequency || 'Daily') + '</div>';
            html += '</div>';
        });
        pendingChores.slice(0, 3).forEach(function(c) {
            var isLate = c.dueDate && new Date(c.dueDate) < new Date() && !c.completed;
            html += '<div class="pdb-chore-row' + (isLate ? ' pdb-chore-late' : '') + '">';
            html += '<div class="pdb-chore-icon">' + (c.icon || '📋') + '</div>';
            html += '<div class="pdb-chore-name">' + c.title + (isLate ? ' ⚠️' : '') + '</div>';
            if (c.stars) html += '<div class="pdb-chore-stars">⭐ ' + c.stars + '</div>';
            html += '</div>';
        });
        html += '</div>';
        var totalPending = pendingChores.length + pendingRoutines.length;
        if (totalPending > 6) html += '<div class="pdb-more">+' + (totalPending - 6) + ' more</div>';
    }
    html += '</div>'; // chores card

    // ---- HABITS card ----
    html += '<div class="pdb-card pdb-card-habits">';
    html += '<div class="pdb-card-deco" style="background:' + blobBg('#b8f0c4', 0.2) + ';background-size:cover;background-position:center"></div>';
    html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:#7cbb7c">🌱</div><div class="pdb-card-title">Habits</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'habits\')">See all →</button></div>';

    if (habits.length === 0) {
        html += '<div class="pdb-empty-mini">No habits yet — add some in Habits!</div>';
    } else {
        html += '<div class="pdb-habits-grid">';
        habits.forEach(function(habit) {
            var done = typeof isHabitDoneToday === 'function' ? isHabitDoneToday(habit.id) : false;
            var streak = typeof getHabitStreak === 'function' ? getHabitStreak(habit.id) : 0;
            // Mini ring SVG
            var r = 18, stroke = 3, size = 44;
            var circ = 2 * Math.PI * r;
            var offset = done ? 0 : circ;
            html += '<div class="pdb-habit-item' + (done ? ' pdb-habit-done' : '') + '" onclick="closeProfileDashboard();switchSection(\'habits\')">';
            html += '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '">';
            html += '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="#E8EBF0" stroke-width="' + stroke + '"/>';
            html += '<circle cx="22" cy="22" r="' + r + '" fill="none" stroke="' + mc + '" stroke-width="' + stroke + '" stroke-dasharray="' + circ + '" stroke-dashoffset="' + offset + '" stroke-linecap="round" transform="rotate(-90 22 22)"/>';
            html += '<text x="22" y="26" text-anchor="middle" font-size="14">' + (habit.emoji || '⭐') + '</text>';
            html += '</svg>';
            html += '<div class="pdb-habit-name">' + habit.name + '</div>';
            if (streak > 0) html += '<div class="pdb-habit-streak">🔥' + streak + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>'; // habits card

    // ---- STARS / REWARDS card ----
    html += '<div class="pdb-card pdb-card-stars" style="background: linear-gradient(135deg, #fffbe8, #fff3c0)">';
    html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:#f5c842">⭐</div><div class="pdb-card-title">Stars & Rewards</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'rewards\')">See all →</button></div>';
    html += '<div class="pdb-stars-big">' + stars + ' ⭐</div>';
    html += '<div class="pdb-stars-label">earned</div>';
    if (rewards.length > 0) {
        html += '<div class="pdb-rewards-list">';
        rewards.forEach(function(rw) {
            var needed = rw.starsNeeded || rw.stars || 25;
            var pct = Math.min(100, Math.round((stars / needed) * 100));
            html += '<div class="pdb-reward-row">';
            html += '<span class="pdb-reward-emoji">' + (rw.emoji || rw.icon || '🎁') + '</span>';
            html += '<div class="pdb-reward-info">';
            html += '<div class="pdb-reward-name">' + rw.title + '</div>';
            html += '<div class="pdb-reward-bar-wrap"><div class="pdb-reward-bar"><div class="pdb-reward-fill" style="width:' + pct + '%;background:' + mc + '"></div></div><span class="pdb-reward-pct">' + pct + '%</span></div>';
            html += '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>'; // stars card

    // ---- UPCOMING EVENTS card ----
    html += '<div class="pdb-card pdb-card-upcoming">';
    html += '<div class="pdb-card-deco" style="background:' + blobBg('#c4b8f0', 0.15) + ';background-size:cover;background-position:center"></div>';
    html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:#a090e0">🗓️</div><div class="pdb-card-title">Coming Up</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'calendar\')">Calendar →</button></div>';

    if (upcomingEvents.length === 0) {
        html += '<div class="pdb-empty-mini">Nothing on the horizon — clear skies!</div>';
    } else {
        html += '<div class="pdb-upcoming-list">';
        upcomingEvents.forEach(function(ev) {
            var d = new Date(ev._dateStr);
            var dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            html += '<div class="pdb-upcoming-row">';
            html += '<div class="pdb-upcoming-date" style="color:' + mc + '">' + dayLabel + '</div>';
            html += '<div class="pdb-upcoming-title">' + (ev.emoji || '') + ' ' + ev.title + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    html += '</div>'; // upcoming card

    // ---- ALLOWANCE card (only if data exists) ----
    if (allowance) {
        var spending = allowance.spending || 0;
        var saving = allowance.saving || 0;
        var total = spending + saving;
        var savePct = total > 0 ? Math.round((saving / total) * 100) : 0;
        html += '<div class="pdb-card pdb-card-allowance" style="background: linear-gradient(135deg, #f0fff8, #d8f5e8)">';
        html += '<div class="pdb-card-header"><div class="pdb-card-icon" style="background:#4cbb8a">💰</div><div class="pdb-card-title">Allowance</div><button class="pdb-card-link" onclick="closeProfileDashboard();switchSection(\'allowance\')">Details →</button></div>';
        html += '<div class="pdb-allowance-row">';
        html += '<div class="pdb-allowance-stat"><div class="pdb-allowance-val">$' + spending.toFixed(2) + '</div><div class="pdb-allowance-lbl">Spending</div></div>';
        html += '<div class="pdb-allowance-stat"><div class="pdb-allowance-val" style="color:#4cbb8a">$' + saving.toFixed(2) + '</div><div class="pdb-allowance-lbl">Saving</div></div>';
        html += '</div>';
        html += '<div class="pdb-allowance-bar-wrap">';
        html += '<div class="pdb-allowance-bar"><div class="pdb-allowance-fill" style="width:' + savePct + '%;background:#4cbb8a"></div></div>';
        html += '<span class="pdb-allowance-pct">' + savePct + '% saved</span>';
        html += '</div>';
        html += '</div>'; // allowance card
    }

    // ---- MOTIVATIONAL card ----
    var motivations = [
        { emoji: '🚀', msg: 'You\'ve got this!', sub: 'Every small step counts.' },
        { emoji: '🌟', msg: 'Keep shining!', sub: 'Consistency builds greatness.' },
        { emoji: '💪', msg: 'Stay strong!', sub: 'Progress, not perfection.' },
        { emoji: '🌱', msg: 'Keep growing!', sub: 'Small habits, big results.' },
        { emoji: '🎯', msg: 'On target!', sub: 'Focus makes the difference.' }
    ];
    var mot = motivations[Math.floor(Math.random() * motivations.length)];
    html += '<div class="pdb-card pdb-card-motive" style="background: linear-gradient(135deg, ' + mc + '22, ' + mc + '44)">';
    html += '<div class="pdb-motive-emoji">' + mot.emoji + '</div>';
    html += '<div class="pdb-motive-msg">' + mot.msg + '</div>';
    html += '<div class="pdb-motive-sub">' + mot.sub + '</div>';
    html += '</div>';

    html += '</div>'; // pdb-grid
    html += '</div>'; // pdb-container
    html += '</div>'; // pdb-overlay

    var el = document.createElement('div');
    el.id = 'profileDashboardMount';
    el.innerHTML = html;
    document.body.appendChild(el);

    // Animate in
    setTimeout(function() {
        var overlay = document.getElementById('profileDashOverlay');
        if (overlay) overlay.classList.add('pdb-visible');
    }, 10);

    // Load weather async
    loadDashWeather(function(w) {
        var tempEl = document.getElementById('pdbWeatherTemp');
        var card = document.getElementById('pdbWeatherCard');
        if (w && tempEl) {
            tempEl.textContent = w.temp + '°F';
            // Update weather emoji on card
            var iconEl = card ? card.querySelector('.pdb-weather-icon') : null;
            if (iconEl) iconEl.textContent = w.emoji;
        }
    });
}

function closeProfileDashboard() {
    var overlay = document.getElementById('profileDashOverlay');
    if (overlay) {
        overlay.classList.remove('pdb-visible');
        overlay.classList.add('pdb-hiding');
        setTimeout(function() {
            var mount = document.getElementById('profileDashboardMount');
            if (mount) mount.remove();
        }, 320);
    }
}

// ---- Hook into chores column headers ----
// Call this after chores view renders to make member headers clickable
function attachProfileDashboardTriggers() {
    // Attach to chore column headers
    document.querySelectorAll('.chore-column-header, .chore-person-name, .rewards-person-name').forEach(function(el) {
        if (el.dataset.pdbAttached) return;
        el.style.cursor = 'pointer';
        el.dataset.pdbAttached = '1';
        el.addEventListener('click', function() {
            var name = el.textContent.trim();
            var members = window.familyMembers || JSON.parse(localStorage.getItem('familyMembers') || '[]');
            var match = members.find(function(m) { return name.indexOf(m.name) !== -1; });
            if (match) openProfileDashboard(match.name);
        });
    });
}

// Patch switchSection to re-attach triggers after render
(function() {
    var _orig = window.switchSection;
    if (typeof _orig === 'function') {
        // We'll try patching after load
    }
    // Use MutationObserver to auto-attach on DOM changes
    var observer = new MutationObserver(function() {
        if (document.querySelector('.chore-column-header, .rewards-person-name, .chore-person-name')) {
            attachProfileDashboardTriggers();
        }
    });
    document.addEventListener('DOMContentLoaded', function() {
        observer.observe(document.getElementById('contentArea') || document.body, { childList: true, subtree: true });
    });
})();

// Expose functions to window for inline onclick handlers (required on Android 8)
window.openProfileDashboard = openProfileDashboard;
window.closeProfileDashboard = closeProfileDashboard;
window.attachProfileDashboardTriggers = attachProfileDashboardTriggers;
