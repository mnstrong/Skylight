// auto-sync-wrapper.js
// This file automatically syncs localStorage changes to Supabase
// Just include this BEFORE script.js and it will handle syncing automatically!

(function() {
    console.log('🔄 Auto-sync wrapper loading...');
    
    // Store the original localStorage.setItem
    const originalSetItem = localStorage.setItem.bind(localStorage);
    
    // Track what we're currently syncing to avoid infinite loops
    let isSyncing = false;
    
    // Override localStorage.setItem to auto-sync
    localStorage.setItem = function(key, value) {
        // Call original function first (synchronous)
        originalSetItem(key, value);
        
        // Don't sync if we're already in a sync operation
        if (isSyncing) return;
        
        // Don't sync if SupabaseSync isn't loaded yet
        if (!window.SupabaseSync) {
            console.log('⚠️ SupabaseSync not ready yet, skipping sync');
            return;
        }
        
        // Parse the data
        let data;
        try {
            data = JSON.parse(value);
        } catch (e) {
            // Not JSON, skip syncing
            return;
        }
        
        // Sync in background (don't await, let it run async)
        isSyncing = true;
        
        // Run sync in background
        (async function() {
            try {
                // Sync based on what key was saved
                switch(key) {
                    case 'chores':
                        await syncChores(data);
                        break;
                    case 'tasks':
                        await syncTasks(data);
                        break;
                    case 'lists':
                        await syncLists(data);
                        break;
                    case 'recipes':
                        await syncRecipes(data);
                        break;
                    case 'mealPlan':
                        await syncMealPlan(data);
                        break;
                }
            } catch (error) {
                console.error('Sync error for', key, ':', error);
            } finally {
                isSyncing = false;
            }
        })();
    };
    
    // ============================================
    // SYNC FUNCTIONS
    // ============================================
    
    // Track what we've already synced to avoid duplicates
    let syncedChores = new Set();
    let syncedTasks = new Set();
    let syncedLists = new Set();
    let syncedRecipes = new Set();
    let syncedMeals = new Set();
    
    async function syncChores(chores) {
        if (!Array.isArray(chores)) return;
        
        for (const chore of chores) {
            // Skip if we've already synced this chore
            if (syncedChores.has(chore.id)) continue;
            
            // Skip if this chore already has a Supabase UUID
            if (typeof chore.id === 'string' && chore.id.includes('-')) {
                syncedChores.add(chore.id);
                continue;
            }
            
            // Find the member
            const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
            const memberObj = familyMembers.find(m => m.name === chore.member);
            
            // Convert to Supabase format
            const supabaseTask = {
                title: chore.title,
                description: null,
                assigned_to: memberObj ? memberObj.id : null,
                due_date: chore.dueDate,
                due_time: chore.time,
                completed: chore.completed || false,
                points: chore.stars || 0,
                category: 'chore'
            };
            
            // Add repeat pattern if exists
            if (chore.repeat) {
                supabaseTask.recurring_pattern = `every_${chore.repeat.every}_${chore.repeat.unit}`;
                if (chore.repeat.days) {
                    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    supabaseTask.recurring_days = chore.repeat.days.map(d => dayNames[d]);
                }
            }
            
            try {
                await window.SupabaseSync.syncTask(supabaseTask, 'add');
                syncedChores.add(chore.id);
                console.log('✓ Synced chore:', chore.title);
            } catch (error) {
                console.error('Error syncing chore:', error);
            }
        }
    }
    
    async function syncTasks(tasks) {
        if (!Array.isArray(tasks)) return;
        
        for (const task of tasks) {
            if (syncedTasks.has(task.id)) continue;
            if (typeof task.id === 'string' && task.id.includes('-')) {
                syncedTasks.add(task.id);
                continue;
            }
            
            try {
                await window.SupabaseSync.syncTask(task, 'add');
                syncedTasks.add(task.id);
                console.log('✓ Synced task:', task.title);
            } catch (error) {
                console.error('Error syncing task:', error);
            }
        }
    }
    
    async function syncLists(lists) {
        if (!Array.isArray(lists)) return;
        
        for (const list of lists) {
            if (syncedLists.has(list.id)) continue;
            if (typeof list.id === 'string' && list.id.includes('-')) {
                syncedLists.add(list.id);
                continue;
            }
            
            try {
                await window.SupabaseSync.syncList(list, 'add');
                
                // Sync all items in the list
                if (list.items && list.items.length > 0) {
                    for (const item of list.items) {
                        await window.SupabaseSync.syncListItem(list.id, item, 'add');
                    }
                }
                
                syncedLists.add(list.id);
                console.log('✓ Synced list:', list.name);
            } catch (error) {
                console.error('Error syncing list:', error);
            }
        }
    }
    
    async function syncRecipes(recipes) {
        if (!Array.isArray(recipes)) return;
        
        for (const recipe of recipes) {
            if (syncedRecipes.has(recipe.id)) continue;
            if (typeof recipe.id === 'string' && recipe.id.includes('-')) {
                syncedRecipes.add(recipe.id);
                continue;
            }
            
            try {
                await window.SupabaseSync.syncRecipe(recipe, 'add');
                syncedRecipes.add(recipe.id);
                console.log('✓ Synced recipe:', recipe.title);
            } catch (error) {
                console.error('Error syncing recipe:', error);
            }
        }
    }
    
    async function syncMealPlan(mealPlan) {
        if (!Array.isArray(mealPlan)) return;
        
        for (const meal of mealPlan) {
            if (syncedMeals.has(meal.id)) continue;
            if (typeof meal.id === 'string' && meal.id.includes('-')) {
                syncedMeals.add(meal.id);
                continue;
            }
            
            try {
                await window.SupabaseSync.syncMealPlanEntry(meal, 'add');
                syncedMeals.add(meal.id);
                console.log('✓ Synced meal plan entry');
            } catch (error) {
                console.error('Error syncing meal:', error);
            }
        }
    }
    
    console.log('✅ Auto-sync wrapper ready!');
})();
