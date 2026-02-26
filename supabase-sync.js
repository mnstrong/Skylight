// supabase-sync.js
// This file syncs your localStorage data with Supabase for cross-device sync

// ============================================
// INITIALIZATION & DATA LOADING
// ============================================

let isSupabaseReady = false;
let syncEnabled = true;

// Initialize Supabase sync on page load
async function initializeSupabaseSync() {
    console.log('🔄 Initializing Supabase sync...');
    
    // Check if Supabase is configured
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
        console.warn('⚠️ Supabase not configured. Running in offline mode.');
        syncEnabled = false;
        return;
    }
    
    try {
        // Load initial data from Supabase
        await loadAllDataFromSupabase();
        
        // Set up real-time listeners
        setupRealtimeListeners();
        
        // Start periodic refresh to catch changes from other devices
        startPeriodicRefresh();
        
        isSupabaseReady = true;
        console.log('✅ Supabase sync ready!');
    } catch (error) {
        console.error('❌ Supabase initialization failed:', error);
        syncEnabled = false;
    }
}

// ============================================
// LOAD DATA FROM SUPABASE
// ============================================

async function loadAllDataFromSupabase() {
    if (!syncEnabled) return;
    
    // Guard: if supabase-config.js failed to load the library, SupabaseAPI won't be defined
    if (typeof SupabaseAPI === 'undefined' || !SupabaseAPI) {
        console.error('❌ SupabaseAPI not available — Supabase library may not have loaded correctly.');
        syncEnabled = false;
        return;
    }
    
    console.log('📥 Loading data from Supabase...');
    
    try {
        // Load family members FIRST
        let formattedMembers = [];
        const members = await SupabaseAPI.getFamilyMembers();
        if (members && members.length > 0) {
            formattedMembers = members.map(m => ({
                id: m.id,
                name: m.name,
                color: m.color,
                avatar_url: m.avatar_url
            }));
            localStorage.setItem('familyMembers', JSON.stringify(formattedMembers));
            window.familyMembers = formattedMembers;
            console.log('✓ Loaded', members.length, 'family members');
            
            // Re-initialize calendar filter so new members are visible
            if (typeof initCalendarFilter === 'function') {
                initCalendarFilter();
            }
        } else {
            // Try to get from localStorage if Supabase has none
            const localMembers = localStorage.getItem('familyMembers');
            if (localMembers) {
                formattedMembers = JSON.parse(localMembers);
                console.log('✓ Using', formattedMembers.length, 'family members from localStorage');
            }
        }
        
        // Load tasks from Supabase and convert to chores format
        const allTasks = await SupabaseAPI.getTasks();
        if (allTasks && allTasks.length > 0) {
            const choresFromSupabase = allTasks.map(t => {
                // Find member name from ID
                const member = formattedMembers.find(m => m.id === t.assigned_to);
                
                return {
                    id: t.id,
                    member: member ? member.name : 'Unknown',
                    title: t.title,
                    icon: '📋',
                    completed: t.completed || false,
                    stars: t.points || 0,
                    dueDate: t.due_date,
                    time: t.due_time,
                    frequency: t.recurring_pattern ? `Every ${t.recurring_pattern}` : 'Once',
                    repeat: t.recurring_pattern ? {
                        every: 1,
                        unit: 'day',
                        days: t.recurring_days || null,
                        until: null
                    } : null
                };
            });
            
            localStorage.setItem('chores', JSON.stringify(choresFromSupabase));
            window.chores = choresFromSupabase;
            console.log('✓ Loaded', allTasks.length, 'chores from Supabase');
        }
        
        // Load recipes
        const allRecipes = await SupabaseAPI.getRecipes();
        if (allRecipes) {
            localStorage.setItem('recipes', JSON.stringify(allRecipes));
            window.recipes = allRecipes;
            console.log('✓ Loaded', allRecipes.length, 'recipes');
        }
        
        // Load meal plans
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - 7); // Load past week
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 30); // Load next month
        
        const plans = await SupabaseAPI.getMealPlans(
            startDate.toISOString().split('T')[0],
            endDate.toISOString().split('T')[0]
        );
        if (plans) {
            localStorage.setItem('mealPlan', JSON.stringify(plans));
            window.mealPlan = plans;
            console.log('✓ Loaded', plans.length, 'meal plans');
        }
        
        // Load lists
        const allLists = await SupabaseAPI.getLists();
        if (allLists) {
            const formattedLists = allLists.map(list => ({
                id: list.id,
                name: list.name,
                color: list.color,
                icon: list.icon,
                assignedTo: list.assigned_to || null,
                items: list.list_items ? list.list_items.map(item => ({
                    id: item.id,
                    text: item.text,
                    checked: item.checked,
                    completed: item.checked || false,
                    displayOrder: item.display_order,
                    section: item.section || 'Items'
                })).sort((a,b) => (a.displayOrder||0) - (b.displayOrder||0)) : []
            }));
            localStorage.setItem('lists', JSON.stringify(formattedLists));
            window.lists = formattedLists;
            console.log('✓ Loaded', allLists.length, 'lists');
        }
        
        // Load meal categories
        const categories = await SupabaseAPI.getMealCategories();
        if (categories && categories.length > 0) {
            const formattedCategories = categories.map(c => ({
                name: c.name,
                color: c.color,
                visible: true
            }));
            localStorage.setItem('mealCategories', JSON.stringify(formattedCategories));
            window.mealCategories = formattedCategories;
            console.log('✓ Loaded', categories.length, 'meal categories');
        }
        
        // Load calendar events
        const evtStart = new Date();
        evtStart.setMonth(evtStart.getMonth() - 1);
        const evtEnd = new Date();
        evtEnd.setFullYear(evtEnd.getFullYear() + 1);
        const calEvents = await SupabaseAPI.getCalendarEvents(evtStart, evtEnd);
        if (calEvents && calEvents.length > 0) {
            const formattedEvents = calEvents.map(e => {
                const memberInfo = e.family_members;
                // Parse start_time back into date + time fields
                const startDt = e.start_time ? new Date(e.start_time) : null;
                const endDt = e.end_time ? new Date(e.end_time) : null;
                var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
                var localDate = function(dt) {
                    if (!dt) return '';
                    return dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate());
                };
                return {
                    id: e.id,
                    title: e.title,
                    notes: e.description || '',
                    date: startDt ? localDate(startDt) : '',
                    endDate: endDt ? localDate(endDt) : '',
                    time: e.all_day ? '' : (startDt ? pad(startDt.getHours()) + ':' + pad(startDt.getMinutes()) : ''),
                    endTime: e.all_day ? '' : (endDt ? pad(endDt.getHours()) + ':' + pad(endDt.getMinutes()) : ''),
                    isAllDay: e.all_day || false,
                    member: memberInfo ? memberInfo.name : '',
                    googleId: e.google_event_id || null,
                    isGoogle: false
                };
            });
            localStorage.setItem('events', JSON.stringify(formattedEvents));
            window.events = formattedEvents;
            console.log('✓ Loaded', formattedEvents.length, 'calendar events');
        }
        
        console.log('✅ All data loaded from Supabase');
        
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
        throw error;
    }
}

// ============================================
// SYNC FUNCTIONS - CALL THESE INSTEAD OF localStorage.setItem
// ============================================

// Sync Family Members
async function syncFamilyMembers(members) {
    localStorage.setItem('familyMembers', JSON.stringify(members));
    
    if (!syncEnabled || !isSupabaseReady) return;
    
    // Note: We don't auto-sync family members to avoid conflicts
    // User must manually add/edit through UI which will call Supabase directly
}

// Sync Tasks
async function syncTasks(tasks) {
    localStorage.setItem('tasks', JSON.stringify(tasks));
    
    if (!syncEnabled || !isSupabaseReady) return;
    
    // Tasks are synced individually through addTask, updateTask, etc.
}

// Sync single task
async function syncTask(task, operation = 'update') {
    if (!syncEnabled || !isSupabaseReady) return;
    
    try {
        if (operation === 'add') {
            const supabaseTask = {
                title: task.title,
                description: task.description,
                assigned_to: task.assigned_to || task.assignedTo,  // Support both formats
                due_date: task.due_date || task.dueDate,
                due_time: task.due_time || task.dueTime,
                completed: task.completed || false,
                priority: task.priority,
                recurring_pattern: task.recurring_pattern || task.recurringPattern,
                recurring_days: task.recurring_days || task.recurringDays,
                points: task.points || 0,
                category: task.category
            };
            
            const newTask = await SupabaseAPI.addTask(supabaseTask);
            if (newTask) {
                task.id = newTask.id; // Update local task with Supabase ID
                console.log('✓ Task synced to Supabase:', task.title);
            }
        } else if (operation === 'update') {
            const updates = {
                title: task.title,
                description: task.description,
                assigned_to: task.assigned_to || task.assignedTo,  // Support both formats
                due_date: task.due_date || task.dueDate,
                due_time: task.due_time || task.dueTime,
                completed: task.completed,
                completed_at: task.completed_at || task.completedAt,
                priority: task.priority,
                points: task.points,
                category: task.category
            };
            
            await SupabaseAPI.updateTask(task.id, updates);
            console.log('✓ Task updated in Supabase:', task.title);
        } else if (operation === 'delete') {
            await SupabaseAPI.deleteTask(task.id);
            console.log('✓ Task deleted from Supabase:', task.title);
        }
    } catch (error) {
        console.error('Error syncing task:', error);
    }
}

// Sync Recipes
async function syncRecipes(recipes) {
    localStorage.setItem('recipes', JSON.stringify(recipes));
    
    if (!syncEnabled || !isSupabaseReady) return;
    
    // Recipes are synced individually
}

// Sync single recipe
async function syncRecipe(recipe, operation = 'update') {
    if (!syncEnabled || !isSupabaseReady) return;
    
    try {
        if (operation === 'add') {
            const newRecipe = await SupabaseAPI.addRecipe(recipe);
            if (newRecipe) {
                recipe.id = newRecipe.id;
                console.log('✓ Recipe synced to Supabase:', recipe.title);
            }
        } else if (operation === 'update') {
            await SupabaseAPI.updateRecipe(recipe.id, recipe);
            console.log('✓ Recipe updated in Supabase:', recipe.title);
        } else if (operation === 'delete') {
            await SupabaseAPI.deleteRecipe(recipe.id);
            console.log('✓ Recipe deleted from Supabase:', recipe.title);
        }
    } catch (error) {
        console.error('Error syncing recipe:', error);
    }
}

// Sync Meal Plans
async function syncMealPlan(mealPlan) {
    localStorage.setItem('mealPlan', JSON.stringify(mealPlan));
    
    if (!syncEnabled || !isSupabaseReady) return;
    
    // Meal plans are synced individually
}

// Sync single meal plan entry
async function syncMealPlanEntry(entry, operation = 'update') {
    if (!syncEnabled || !isSupabaseReady) return;
    
    try {
        if (operation === 'add') {
            const newEntry = await SupabaseAPI.addMealPlan(entry);
            if (newEntry) {
                entry.id = newEntry.id;
                console.log('✓ Meal plan synced to Supabase');
            }
        } else if (operation === 'update') {
            await SupabaseAPI.updateMealPlan(entry.id, entry);
            console.log('✓ Meal plan updated in Supabase');
        } else if (operation === 'delete') {
            await SupabaseAPI.deleteMealPlan(entry.id);
            console.log('✓ Meal plan deleted from Supabase');
        }
    } catch (error) {
        console.error('Error syncing meal plan:', error);
    }
}

// Sync Lists
async function syncLists(lists) {
    localStorage.setItem('lists', JSON.stringify(lists));
    
    if (!syncEnabled || !isSupabaseReady) return;
    
    // Lists are synced individually
}

// Sync single list
async function syncList(list, operation = 'update') {
    if (!syncEnabled || !isSupabaseReady) return;
    
    try {
        if (operation === 'add') {
            const listData = {
                name: list.name,
                color: list.color,
                icon: list.icon
            };
            const newList = await SupabaseAPI.addList(listData);
            if (newList) {
                list.id = newList.id;
                console.log('✓ List synced to Supabase:', list.name);
            }
        } else if (operation === 'update') {
            await SupabaseAPI.updateList(list.id, {
                name: list.name,
                color: list.color,
                icon: list.icon
            });
            console.log('✓ List updated in Supabase:', list.name);
        } else if (operation === 'delete') {
            await SupabaseAPI.deleteList(list.id);
            console.log('✓ List deleted from Supabase:', list.name);
        }
    } catch (error) {
        console.error('Error syncing list:', error);
    }
}

// Sync list item
async function syncListItem(listId, item, operation = 'update') {
    if (!syncEnabled || !isSupabaseReady) return;
    
    try {
        if (operation === 'add') {
            const newItem = await SupabaseAPI.addListItem(listId, item.text);
            if (newItem) {
                item.id = newItem.id;
                console.log('✓ List item synced to Supabase');
            }
        } else if (operation === 'update') {
            await SupabaseAPI.updateListItem(item.id, {
                text: item.text,
                checked: item.checked,
                display_order: item.displayOrder
            });
            console.log('✓ List item updated in Supabase');
        } else if (operation === 'delete') {
            await SupabaseAPI.deleteListItem(item.id);
            console.log('✓ List item deleted from Supabase');
        }
    } catch (error) {
        console.error('Error syncing list item:', error);
    }
}

// ============================================
// REAL-TIME LISTENERS
// ============================================

function setupRealtimeListeners() {
    if (!syncEnabled) return;
    // Realtime uses WebSockets which can fail on older WebViews (Android 8).
    // The periodic refresh handles cross-device sync as a fallback.
    try {
        console.log('Setting up real-time listeners...');
        SupabaseAPI.subscribeToTasks(function(payload) {
            handleTaskChange(payload);
        });
        SupabaseAPI.subscribeToMealPlans(function(payload) {
            handleMealPlanChange(payload);
        });
        SupabaseAPI.subscribeToLists(function(payload) {
            handleListChange(payload);
        });
    } catch (e) {
        console.warn('Real-time listeners unavailable. Falling back to polling.');
    }
}

function handleTaskChange(payload) {
    // Reload tasks from Supabase and update UI
    loadTasksFromSupabase();
}

function handleMealPlanChange(payload) {
    // Reload meal plans from Supabase and update UI
    loadMealPlansFromSupabase();
}

function handleListChange(payload) {
    // Reload lists from Supabase and update UI
    loadListsFromSupabase();
}

async function loadTasksFromSupabase() {
    const allTasks = await SupabaseAPI.getTasks();
    if (allTasks && allTasks.length > 0) {
        // Get family members for name lookup
        const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
        
        const choresFromSupabase = allTasks.map(t => {
            const member = familyMembers.find(m => m.id === t.assigned_to);
            
            return {
                id: t.id,
                member: member ? member.name : 'Unknown',
                title: t.title,
                icon: '📋',
                completed: t.completed || false,
                stars: t.points || 0,
                dueDate: t.due_date,
                time: t.due_time,
                frequency: t.recurring_pattern ? `Every ${t.recurring_pattern}` : 'Once',
                repeat: t.recurring_pattern ? {
                    every: 1,
                    unit: 'day',
                    days: t.recurring_days || null,
                    until: null
                } : null
            };
        });
        
        localStorage.setItem('chores', JSON.stringify(choresFromSupabase));
        window.chores = choresFromSupabase;
        
        // Refresh UI if on tasks/chores section
        if (typeof renderSection === 'function' && currentSection === 'chores') {
            renderSection('chores');
        }
    }
}

async function loadMealPlansFromSupabase() {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);
    
    const plans = await SupabaseAPI.getMealPlans(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
    );
    if (plans) {
        localStorage.setItem('mealPlan', JSON.stringify(plans));
        window.mealPlan = plans;
        
        // Refresh UI if on meals section
        if (typeof renderSection === 'function' && currentSection === 'meals') {
            renderSection('meals');
        }
    }
}

async function loadListsFromSupabase() {
    const allLists = await SupabaseAPI.getLists();
    if (allLists) {
        const formattedLists = allLists.map(list => ({
            id: list.id,
            name: list.name,
            color: list.color,
            icon: list.icon,
            assignedTo: list.assigned_to || null,
            items: list.list_items ? list.list_items.map(item => ({
                id: item.id,
                text: item.text,
                checked: item.checked,
                displayOrder: item.display_order
            })) : []
        }));
        localStorage.setItem('lists', JSON.stringify(formattedLists));
        window.lists = formattedLists;
        
        // Refresh UI if on lists section
        if (typeof renderSection === 'function' && currentSection === 'lists') {
            if (window.innerWidth <= 768 && typeof listsLoadLists === 'function') {
                // Mobile: refresh the mobile overlay
                listsLoadLists();
            } else {
                renderSection('lists');
            }
        }
    }
}

// ============================================
// PERIODIC REFRESH
// ============================================

// Check for updates every 10 seconds
let refreshInterval = null;

function startPeriodicRefresh() {
    if (!syncEnabled) return;
    
    // Clear any existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Refresh every 10 seconds
    refreshInterval = setInterval(async function() {
        console.log('🔄 Checking for updates from other devices...');
        try {
            await loadTasksFromSupabase();
            await loadListsFromSupabase();
            await loadMealPlansFromSupabase();
            
            // Refresh calendar events
            const evtStart = new Date();
            evtStart.setMonth(evtStart.getMonth() - 1);
            const evtEnd = new Date();
            evtEnd.setFullYear(evtEnd.getFullYear() + 1);
            const calEvents = await SupabaseAPI.getCalendarEvents(evtStart, evtEnd);
            if (calEvents && calEvents.length > 0) {
                const formattedEvents = calEvents.map(e => {
                    const memberInfo = e.family_members;
                    const startDt = e.start_time ? new Date(e.start_time) : null;
                    const endDt = e.end_time ? new Date(e.end_time) : null;
                    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
                    var localDateStr = function(dt) {
                        if (!dt) return '';
                        return dt.getFullYear() + '-' + pad(dt.getMonth()+1) + '-' + pad(dt.getDate());
                    };
                    return {
                        id: e.id,
                        title: e.title,
                        notes: e.description || '',
                        date: startDt ? localDateStr(startDt) : '',
                        endDate: endDt ? localDateStr(endDt) : '',
                        time: e.all_day ? '' : (startDt ? pad(startDt.getHours()) + ':' + pad(startDt.getMinutes()) : ''),
                        endTime: e.all_day ? '' : (endDt ? pad(endDt.getHours()) + ':' + pad(endDt.getMinutes()) : ''),
                        isAllDay: e.all_day || false,
                        member: memberInfo ? memberInfo.name : '',
                        googleId: e.google_event_id || null,
                        isGoogle: false
                    };
                });
                localStorage.setItem('events', JSON.stringify(formattedEvents));
                window.events = formattedEvents;
                
                // Re-render the calendar view with the updated events
                try {
                    if (typeof currentView !== 'undefined' && typeof currentSection !== 'undefined' && currentSection === 'calendar') {
                        if (currentView === 'month' && typeof renderCalendar === 'function') renderCalendar();
                        else if (currentView === 'week' && typeof renderWeekView === 'function') renderWeekView();
                        else if (currentView === 'schedule' && typeof renderScheduleView === 'function') renderScheduleView();
                        else if (currentView === 'day' && typeof renderDayView === 'function') renderDayView();
                    }
                } catch(e) {}
            }
            
            // Also refresh Google Calendar events from the API
            // (GoogleCalendar.load() handles its own re-render internally)
            if (typeof GoogleCalendar !== 'undefined' && GoogleCalendar.isConnected()) {
                await GoogleCalendar.load();
            }
            
            console.log('✅ Data refreshed from Supabase + Google Calendar');
        } catch (error) {
            console.error('Error refreshing data:', error);
        }
    }, 30000); // 30 seconds (was 10s - reduced frequency to avoid hammering Google API)
    
    console.log('✅ Periodic refresh started (every 10 seconds)');
}

// ============================================
// EXPORT FUNCTIONS
// ============================================

window.SupabaseSync = {
    initialize: initializeSupabaseSync,
    syncTask,
    syncRecipe,
    syncMealPlanEntry,
    syncList,
    syncListItem,
    isReady: function() { return isSupabaseReady; },
    isEnabled: function() { return syncEnabled; }
};

console.log('✅ Supabase sync layer loaded');
