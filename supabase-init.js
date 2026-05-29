// supabase-init.js
// Initialize Supabase sync when page loads

(function() {
    console.log('🚀 Starting Supabase initialization...');
    
    // Wait for DOM and other scripts to load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSupabase);
    } else {
        initSupabase();
    }
    
    async function initSupabase() {
        // Make sure SupabaseSync is available
        if (typeof SupabaseSync === 'undefined') {
            console.warn('⚠️ SupabaseSync not loaded. Skipping initialization.');
            return;
        }
        
        try {
            // Initialize Supabase sync (loads all data from cloud)
            await SupabaseSync.initialize();
            
            // Sync Supabase-loaded window globals back into script.js closures via events
            document.dispatchEvent(new CustomEvent('supabaseChoresLoaded'));
            document.dispatchEvent(new CustomEvent('supabaseDataLoaded', {
                detail: {
                    familyMembers: window.familyMembers,
                    chores: window.chores,
                    routines: window.routines,
                    tasks: window.tasks,
                    lists: window.lists,
                    recipes: window.recipes,
                    mealPlan: window.mealPlan,
                    rewards: window.rewards,
                    allowances: window.allowances,
                    mealCategories: window.mealCategories,
                    hiddenChoreMembers: window.hiddenChoreMembers,
                    showUpForGrabs: window.showUpForGrabs,
                    bonusStars: window.bonusStars
                }
            }));
            
            // After loading, render the current section to show updated data
            if (typeof currentSection !== 'undefined') {
                console.log('🔄 Refreshing UI for section:', currentSection);
                try {
                    if (currentSection === 'chores' && typeof renderChoresView === 'function') renderChoresView();
                    else if (currentSection === 'rewards' && typeof renderRewardsView === 'function') renderRewardsView();
                    else if (currentSection === 'allowance' && typeof renderAllowanceGrid === 'function') renderAllowanceGrid();
                    else if (currentSection === 'meals' && typeof renderMeals === 'function') renderMeals();
                    else if (currentSection === 'recipes' && typeof renderRecipes === 'function') renderRecipes();
                    else if (currentSection === 'calendar') {
                        if (typeof currentView !== 'undefined') {
                            if (currentView === 'month' && typeof renderCalendar === 'function') renderCalendar();
                            else if (currentView === 'week' && typeof renderWeekView === 'function') renderWeekView();
                        }
                    }
                } catch (e) {
                    console.log('⚠️ Could not render section:', e);
                }
            }
            
            console.log('✅ Supabase initialization complete!');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            console.log('📴 Continuing in offline mode...');
        }
    }
})();
