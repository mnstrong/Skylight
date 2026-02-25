// supabase-config.js
// Supabase REST API helpers — no CDN library required.
// Uses direct fetch() calls to the PostgREST / Supabase REST API.
// This eliminates the supabase-js CDN bundle which caused:
//   "Uncaught SyntaxError: identifier starts immediately after numeric literal"
// on older browsers (Android 8 WebView / older Firefox versions).

// ============================================
// CONFIGURATION
// ============================================
var SUPABASE_URL = 'https://ddlnphwpthvcqysscstc.supabase.co';
var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkbG5waHdwdGh2Y3F5c3Njc3RjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwNjUyMDEsImV4cCI6MjA4NTY0MTIwMX0.Bdyz_60mX97oT06F76poUmHTVHcHU0MD-7XGh7rOH0M';

// ============================================
// CORE REST HELPER
// ============================================
// Makes authenticated requests to the Supabase PostgREST endpoint.
// Returns a Promise resolving to { data, error } — same shape as supabase-js.
function _sbRequest(method, table, opts) {
    opts = opts || {};
    var url = SUPABASE_URL + '/rest/v1/' + table;
    var params = [];

    if (opts.select) params.push('select=' + encodeURIComponent(opts.select));
    if (opts.order)  params.push('order=' + encodeURIComponent(opts.order));

    if (opts.filters) {
        opts.filters.forEach(function(f) {
            params.push(encodeURIComponent(f.col) + '=' + f.op + '.' + encodeURIComponent(f.val));
        });
    }

    if (opts.gte) params.push(encodeURIComponent(opts.gte[0]) + '=gte.' + encodeURIComponent(opts.gte[1]));
    if (opts.lte) params.push(encodeURIComponent(opts.lte[0]) + '=lte.' + encodeURIComponent(opts.lte[1]));

    if (params.length) url += '?' + params.join('&');

    var headers = {
        'apikey':        SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
        'Content-Type':  'application/json',
        'Accept':        'application/json'
    };

    if (method === 'POST' || method === 'PATCH') {
        headers['Prefer'] = 'return=representation';
    }

    var fetchOpts = { method: method, headers: headers };
    if (opts.body) fetchOpts.body = JSON.stringify(opts.body);

    return fetch(url, fetchOpts).then(function(res) {
        if (res.status === 204) return { data: null, error: null };
        return res.text().then(function(text) {
            var parsed = null;
            try { parsed = text ? JSON.parse(text) : null; } catch(e) {}
            if (!res.ok) {
                var err = parsed || { message: 'HTTP ' + res.status, details: '', hint: '', code: String(res.status) };
                return { data: null, error: err };
            }
            // Unwrap single-row results when requested
            if (opts.single && Array.isArray(parsed)) parsed = parsed[0] || null;
            return { data: parsed, error: null };
        });
    }).catch(function(err) {
        return { data: null, error: { message: err.message || String(err), details: '', hint: '', code: '' } };
    });
}

// ============================================
// FAMILY MEMBERS
// ============================================
function getFamilyMembers() {
    return _sbRequest('GET', 'family_members', { select: '*', order: 'name.asc' })
        .then(function(r) {
            if (r.error) { console.error('Error fetching family members:', r.error); return []; }
            return r.data || [];
        });
}

function addFamilyMember(name, color, avatarUrl) {
    return _sbRequest('POST', 'family_members', {
        body: { name: name, color: color, avatar_url: avatarUrl || null }, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error adding family member:', r.error); return null; }
        return r.data;
    });
}

function updateFamilyMember(id, updates) {
    return _sbRequest('PATCH', 'family_members', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating family member:', r.error); return null; }
        return r.data;
    });
}

function deleteFamilyMember(id) {
    return _sbRequest('DELETE', 'family_members', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting family member:', r.error); return false; }
        return true;
    });
}

// ============================================
// CALENDAR EVENTS
// ============================================
function getCalendarEvents(startDate, endDate) {
    return _sbRequest('GET', 'calendar_events', {
        select: '*,family_members(name,color)',
        gte: ['start_time', startDate.toISOString()],
        lte: ['start_time', endDate.toISOString()],
        order: 'start_time.asc'
    }).then(function(r) {
        if (r.error) { console.error('Error fetching events:', r.error); return []; }
        return r.data || [];
    });
}

function addCalendarEvent(event) {
    return _sbRequest('POST', 'calendar_events', { body: event, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding event:', r.error); return null; }
            return r.data;
        });
}

function updateCalendarEvent(id, updates) {
    return _sbRequest('PATCH', 'calendar_events', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating event:', r.error); return null; }
        return r.data;
    });
}

function deleteCalendarEvent(id) {
    return _sbRequest('DELETE', 'calendar_events', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting event:', r.error); return false; }
        return true;
    });
}

// ============================================
// TASKS / CHORES
// ============================================
function getTasks(filters) {
    filters = filters || {};
    var qFilters = [];
    if (filters.completed !== undefined) qFilters.push({ col: 'completed',   op: 'eq', val: filters.completed });
    if (filters.assignedTo)              qFilters.push({ col: 'assigned_to', op: 'eq', val: filters.assignedTo });
    if (filters.dueDate)                 qFilters.push({ col: 'due_date',    op: 'eq', val: filters.dueDate });
    return _sbRequest('GET', 'tasks', {
        select: '*,family_members(name,color)',
        filters: qFilters,
        order: 'due_date.asc.nullslast'
    }).then(function(r) {
        if (r.error) { console.error('Error fetching tasks:', r.error); return []; }
        return r.data || [];
    });
}

function addTask(task) {
    return _sbRequest('POST', 'tasks', { body: task, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding task:', r.error); return null; }
            return r.data;
        });
}

function updateTask(id, updates) {
    return _sbRequest('PATCH', 'tasks', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating task:', r.error); return null; }
        return r.data;
    });
}

function completeTask(id) {
    return updateTask(id, { completed: true, completed_at: new Date().toISOString() });
}

function deleteTask(id) {
    return _sbRequest('DELETE', 'tasks', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting task:', r.error); return false; }
        return true;
    });
}

// ============================================
// RECIPES
// ============================================
function getRecipes(filters) {
    filters = filters || {};
    var qFilters = [];
    if (filters.category) qFilters.push({ col: 'category', op: 'eq', val: filters.category });
    if (filters.favorite) qFilters.push({ col: 'favorite', op: 'eq', val: 'true' });
    return _sbRequest('GET', 'recipes', { select: '*', filters: qFilters, order: 'title.asc' })
        .then(function(r) {
            if (r.error) { console.error('Error fetching recipes:', r.error); return []; }
            return r.data || [];
        });
}

function addRecipe(recipe) {
    return _sbRequest('POST', 'recipes', { body: recipe, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding recipe:', r.error); return null; }
            return r.data;
        });
}

function updateRecipe(id, updates) {
    return _sbRequest('PATCH', 'recipes', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating recipe:', r.error); return null; }
        return r.data;
    });
}

function deleteRecipe(id) {
    return _sbRequest('DELETE', 'recipes', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting recipe:', r.error); return false; }
        return true;
    });
}

// ============================================
// MEAL CATEGORIES
// ============================================
function getMealCategories() {
    return _sbRequest('GET', 'meal_categories', { select: '*', order: 'display_order.asc' })
        .then(function(r) {
            if (r.error) { console.error('Error fetching meal categories:', r.error); return []; }
            return r.data || [];
        });
}

// ============================================
// MEAL PLANS
// ============================================
function getMealPlans(startDate, endDate) {
    return _sbRequest('GET', 'meal_plans', {
        select: '*,recipes(title,image_url)',
        gte: ['meal_date', startDate],
        lte: ['meal_date', endDate],
        order: 'meal_date.asc'
    }).then(function(r) {
        if (r.error) { console.error('Error fetching meal plans:', r.error); return []; }
        return r.data || [];
    });
}

function addMealPlan(mealPlan) {
    return _sbRequest('POST', 'meal_plans', { body: mealPlan, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding meal plan:', r.error); return null; }
            return r.data;
        });
}

function updateMealPlan(id, updates) {
    return _sbRequest('PATCH', 'meal_plans', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating meal plan:', r.error); return null; }
        return r.data;
    });
}

function deleteMealPlan(id) {
    return _sbRequest('DELETE', 'meal_plans', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting meal plan:', r.error); return false; }
        return true;
    });
}

// ============================================
// LISTS
// ============================================
function getLists() {
    return _sbRequest('GET', 'lists', { select: '*,list_items(*)', order: 'name.asc' })
        .then(function(r) {
            if (r.error) { console.error('Error fetching lists:', r.error); return []; }
            return r.data || [];
        });
}

function addList(list) {
    return _sbRequest('POST', 'lists', { body: list, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding list:', r.error); return null; }
            return r.data;
        });
}

function updateList(id, updates) {
    return _sbRequest('PATCH', 'lists', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating list:', r.error); return null; }
        return r.data;
    });
}

function deleteList(id) {
    return _sbRequest('DELETE', 'lists', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting list:', r.error); return false; }
        return true;
    });
}

// ============================================
// LIST ITEMS
// ============================================
function addListItem(listId, text) {
    return _sbRequest('POST', 'list_items', {
        body: { list_id: listId, text: text }, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error adding list item:', r.error); return null; }
        return r.data;
    });
}

function updateListItem(id, updates) {
    return _sbRequest('PATCH', 'list_items', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating list item:', r.error); return null; }
        return r.data;
    });
}

function deleteListItem(id) {
    return _sbRequest('DELETE', 'list_items', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting list item:', r.error); return false; }
        return true;
    });
}

// ============================================
// REWARDS
// ============================================
function getRewards() {
    return _sbRequest('GET', 'rewards', { select: '*', order: 'points_cost.asc' })
        .then(function(r) {
            if (r.error) { console.error('Error fetching rewards:', r.error); return []; }
            return r.data || [];
        });
}

function addReward(reward) {
    return _sbRequest('POST', 'rewards', { body: reward, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding reward:', r.error); return null; }
            return r.data;
        });
}

function updateReward(id, updates) {
    return _sbRequest('PATCH', 'rewards', {
        filters: [{ col: 'id', op: 'eq', val: id }], body: updates, single: true
    }).then(function(r) {
        if (r.error) { console.error('Error updating reward:', r.error); return null; }
        return r.data;
    });
}

function deleteReward(id) {
    return _sbRequest('DELETE', 'rewards', {
        filters: [{ col: 'id', op: 'eq', val: id }]
    }).then(function(r) {
        if (r.error) { console.error('Error deleting reward:', r.error); return false; }
        return true;
    });
}

// ============================================
// ALLOWANCE / MONEY TRACKING
// ============================================
function getAllowanceBalance(memberId) {
    return _sbRequest('GET', 'allowance_transactions', {
        select: 'amount,transaction_type',
        filters: [{ col: 'member_id', op: 'eq', val: memberId }]
    }).then(function(r) {
        if (r.error) { console.error('Error fetching allowance:', r.error); return 0; }
        return (r.data || []).reduce(function(acc, t) {
            return t.transaction_type === 'save'
                ? acc + parseFloat(t.amount)
                : acc - parseFloat(t.amount);
        }, 0);
    });
}

function addAllowanceTransaction(transaction) {
    return _sbRequest('POST', 'allowance_transactions', { body: transaction, single: true })
        .then(function(r) {
            if (r.error) { console.error('Error adding transaction:', r.error); return null; }
            return r.data;
        });
}

// ============================================
// REAL-TIME SUBSCRIPTIONS (stubs)
// ============================================
// Realtime requires WebSockets — not supported on Android 8.
// Cross-device sync is handled by periodic polling instead.
function subscribeToCalendarEvents() { return null; }
function subscribeToTasks()          { return null; }
function subscribeToMealPlans()      { return null; }
function subscribeToLists()          { return null; }

// ============================================
// EXPORT
// ============================================
window.SupabaseAPI = {
    getFamilyMembers:          getFamilyMembers,
    addFamilyMember:           addFamilyMember,
    updateFamilyMember:        updateFamilyMember,
    deleteFamilyMember:        deleteFamilyMember,

    getCalendarEvents:         getCalendarEvents,
    addCalendarEvent:          addCalendarEvent,
    updateCalendarEvent:       updateCalendarEvent,
    deleteCalendarEvent:       deleteCalendarEvent,

    getTasks:                  getTasks,
    addTask:                   addTask,
    updateTask:                updateTask,
    completeTask:              completeTask,
    deleteTask:                deleteTask,

    getRecipes:                getRecipes,
    addRecipe:                 addRecipe,
    updateRecipe:              updateRecipe,
    deleteRecipe:              deleteRecipe,

    getMealPlans:              getMealPlans,
    addMealPlan:               addMealPlan,
    updateMealPlan:            updateMealPlan,
    deleteMealPlan:            deleteMealPlan,
    getMealCategories:         getMealCategories,

    getLists:                  getLists,
    addList:                   addList,
    updateList:                updateList,
    deleteList:                deleteList,

    addListItem:               addListItem,
    updateListItem:            updateListItem,
    deleteListItem:            deleteListItem,

    getRewards:                getRewards,
    addReward:                 addReward,
    updateReward:              updateReward,
    deleteReward:              deleteReward,

    getAllowanceBalance:        getAllowanceBalance,
    addAllowanceTransaction:   addAllowanceTransaction,

    subscribeToCalendarEvents: subscribeToCalendarEvents,
    subscribeToTasks:          subscribeToTasks,
    subscribeToMealPlans:      subscribeToMealPlans,
    subscribeToLists:          subscribeToLists
};
