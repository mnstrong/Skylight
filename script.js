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
                    case 'routines':
                        await syncRoutines(data);
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
                    case 'events':
                        await syncCalendarEvents(data);
                        break;
                    case 'rewards':
                        await syncRewards(data);
                        break;
                    case 'allowances':
                        await syncAllowanceTransactions(data);
                        break;
                    case 'familyMembers':
                        await syncFamilyMembers(data);
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
    
    // ============================================
    // NEW SYNC FUNCTIONS
    // ============================================
    
    let syncedRoutines = new Set();
    let syncedEvents = new Set();
    let syncedRewards = new Set();
    let syncedAllowances = new Set();
    let syncedMembers = new Set();
    
    async function syncRoutines(routines) {
        if (!Array.isArray(routines)) return;
        
        for (const routine of routines) {
            if (syncedRoutines.has(routine.id)) continue;
            if (typeof routine.id === 'string' && routine.id.includes('-')) {
                syncedRoutines.add(routine.id);
                continue;
            }
            
            const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
            const memberObj = familyMembers.find(m => m.name === routine.member);
            
            // Convert routine to task format for Supabase
            const supabaseTask = {
                title: routine.title,
                description: `${routine.period} routine`,
                assigned_to: memberObj ? memberObj.id : null,
                due_date: null,
                due_time: null,
                completed: routine.completed || false,
                points: routine.stars || 0,
                recurring_pattern: routine.repeat ? `every_${routine.repeat.every}_${routine.repeat.unit}` : null,
                recurring_days: routine.repeat && routine.repeat.days ? routine.repeat.days.map(d => {
                    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                    return days[d];
                }) : null,
                category: 'routine'
            };
            
            try {
                await window.SupabaseSync.syncTask(supabaseTask, 'add');
                syncedRoutines.add(routine.id);
                console.log('✓ Synced routine:', routine.title);
            } catch (error) {
                console.error('Error syncing routine:', error);
            }
        }
    }
    
    async function syncCalendarEvents(events) {
        if (!Array.isArray(events)) return;
        
        for (const event of events) {
            if (syncedEvents.has(event.id)) continue;
            // Skip Google events (they have string IDs with no dashes being numeric-ish, 
            // but Google IDs are long alphanumeric - skip events that are already from Google)
            if (event.isGoogle) continue;
            // Skip if already has a Supabase UUID
            if (typeof event.id === 'string' && event.id.includes('-')) {
                syncedEvents.add(event.id);
                continue;
            }
            
            const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
            const memberObj = familyMembers.find(m => m.name === event.member);
            
            // Build ISO start_time from date + time fields
            const startTime = event.time
                ? event.date + 'T' + event.time + ':00'
                : event.date + 'T00:00:00';
            
            // Build ISO end_time from endDate + endTime fields
            const endDate = event.endDate || event.date;
            const endTime = event.endTime
                ? endDate + 'T' + event.endTime + ':00'
                : event.time
                    ? endDate + 'T' + event.time + ':00'  // fallback: same as start
                    : endDate + 'T00:00:00';
            
            const supabaseEvent = {
                title: event.title,
                description: event.notes || null,
                start_time: startTime,
                end_time: endTime,
                all_day: event.isAllDay || !event.time || false,
                member_id: memberObj ? memberObj.id : null,
                location: event.location || null,
                google_event_id: event.googleId || null,
                calendar_id: null
            };
            
            try {
                await window.SupabaseAPI.addCalendarEvent(supabaseEvent);
                syncedEvents.add(event.id);
                console.log('✓ Synced calendar event:', event.title);
            } catch (error) {
                console.error('Error syncing event:', error);
            }
        }
    }
    
    async function syncRewards(rewards) {
        if (!Array.isArray(rewards)) return;
        
        for (const reward of rewards) {
            if (syncedRewards.has(reward.id)) continue;
            if (typeof reward.id === 'string' && reward.id.includes('-')) {
                syncedRewards.add(reward.id);
                continue;
            }
            
            const supabaseReward = {
                name: reward.name,
                description: reward.description,
                points_cost: reward.cost || reward.pointsCost || 0,
                icon: reward.icon,
                available: reward.available !== false
            };
            
            try {
                await window.SupabaseAPI.addReward(supabaseReward);
                syncedRewards.add(reward.id);
                console.log('✓ Synced reward:', reward.name);
            } catch (error) {
                console.error('Error syncing reward:', error);
            }
        }
    }
    
    async function syncAllowanceTransactions(allowances) {
        if (!Array.isArray(allowances)) return;
        
        for (const allowance of allowances) {
            if (syncedAllowances.has(allowance.id)) continue;
            if (typeof allowance.id === 'string' && allowance.id.includes('-')) {
                syncedAllowances.add(allowance.id);
                continue;
            }
            
            const familyMembers = JSON.parse(localStorage.getItem('familyMembers') || '[]');
            const memberObj = familyMembers.find(m => m.name === allowance.member);
            
            const supabaseTransaction = {
                member_id: memberObj ? memberObj.id : null,
                amount: allowance.amount,
                transaction_type: allowance.type || 'save',
                description: allowance.description,
                date: allowance.date || new Date().toISOString()
            };
            
            try {
                await window.SupabaseAPI.addAllowanceTransaction(supabaseTransaction);
                syncedAllowances.add(allowance.id);
                console.log('✓ Synced allowance transaction');
            } catch (error) {
                console.error('Error syncing allowance:', error);
            }
        }
    }
    
    async function syncFamilyMembers(members) {
        if (!Array.isArray(members)) return;
        
        for (const member of members) {
            if (syncedMembers.has(member.id)) continue;
            if (typeof member.id === 'string' && member.id.includes('-')) {
                syncedMembers.add(member.id);
                continue;
            }
            
            try {
                const newMember = await window.SupabaseAPI.addFamilyMember(
                    member.name,
                    member.color,
                    member.avatar_url || member.avatarUrl
                );
                if (newMember) {
                    member.id = newMember.id; // Update local with Supabase ID
                    syncedMembers.add(newMember.id);
                    console.log('✓ Synced family member:', member.name);
                }
            } catch (error) {
                console.error('Error syncing family member:', error);
            }
        }
    }
    
    console.log('✅ Auto-sync wrapper ready!');
})();
