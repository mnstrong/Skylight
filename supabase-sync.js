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
    
    console.log('📥 Loading data from Supabase...');
    
    try {
        // Load family members
        const members = await SupabaseAPI.getFamilyMembers();
        if (members && members.length > 0) {
            const formattedMembers = members.map(m => ({
                id: m.id,
                name: m.name,
                color: m.color,
                avatar_url: m.avatar_url
            }));
            localStorage.setItem('familyMembers', JSON.stringify(formattedMembers));
            window.familyMembers = formattedMembers;
            console.log('✓ Loaded', members.length, 'family members');
        }
        
        // Load tasks
        const allTasks = await SupabaseAPI.getTasks();
        if (allTasks) {
            const formattedTasks = allTasks.map(t => ({
                id: t.id,
                title: t.title,
                description: t.description,
                assignedTo: t.assigned_to,
                dueDate: t.due_date,
                dueTime: t.due_time,
                completed: t.completed,
                completedAt: t.completed_at,
                priority: t.priority,
                recurringPattern: t.recurring_pattern,
                recurringDays: t.recurring_days,
                points: t.points,
                category: t.category
            }));
            localStorage.setItem('tasks', JSON.stringify(formattedTasks));
            window.tasks = formattedTasks;
            console.log('✓ Loaded', allTasks.length, 'tasks');
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
                items: list.list_items ? list.list_items.map(item => ({
                    id: item.id,
                    text: item.text,
                    checked: item.checked,
                    displayOrder: item.display_order
                })) : []
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
                assigned_to: task.assignedTo,
                due_date: task.dueDate,
                due_time: task.dueTime,
                completed: task.completed || false,
                priority: task.priority,
                recurring_pattern: task.recurringPattern,
                recurring_days: task.recurringDays,
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
                assigned_to: task.assignedTo,
                due_date: task.dueDate,
                due_time: task.dueTime,
                completed: task.completed,
                completed_at: task.completedAt,
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
    
    console.log('🎧 Setting up real-time listeners...');
    
    // Listen for task changes
    SupabaseAPI.subscribeToTasks((payload) => {
        console.log('📨 Task changed:', payload);
        handleTaskChange(payload);
    });
    
    // Listen for meal plan changes
    SupabaseAPI.subscribeToMealPlans((payload) => {
        console.log('📨 Meal plan changed:', payload);
        handleMealPlanChange(payload);
    });
    
    // Listen for list changes
    SupabaseAPI.subscribeToLists((payload) => {
        console.log('📨 List changed:', payload);
        handleListChange(payload);
    });
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
    if (allTasks) {
        const formattedTasks = allTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            assignedTo: t.assigned_to,
            dueDate: t.due_date,
            dueTime: t.due_time,
            completed: t.completed,
            completedAt: t.completed_at,
            priority: t.priority,
            recurringPattern: t.recurring_pattern,
            recurringDays: t.recurring_days,
            points: t.points,
            category: t.category
        }));
        localStorage.setItem('tasks', JSON.stringify(formattedTasks));
        window.tasks = formattedTasks;
        
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
            renderSection('lists');
        }
    }
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
    isReady: () => isSupabaseReady,
    isEnabled: () => syncEnabled
};

console.log('✅ Supabase sync layer loaded');
