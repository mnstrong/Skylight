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
            
            // Reload all data arrays from Supabase-populated window globals
            if (window.chores !== undefined) {
                chores = window.chores || [];
                console.log('✅ Reloaded', chores.length, 'chores');
                document.dispatchEvent(new CustomEvent('supabaseChoresLoaded'));
            }
            if (window.routines !== undefined) routines = window.routines || [];
            if (window.tasks !== undefined) tasks = window.tasks || [];
            if (window.lists !== undefined) lists = window.lists || [];
            if (window.recipes !== undefined) recipes = window.recipes || [];
            if (window.mealPlan !== undefined) mealPlan = window.mealPlan || [];
            if (window.rewards !== undefined) rewards = window.rewards || [];
            if (window.allowances !== undefined) allowances = window.allowances || [];
            if (window.mealCategories !== undefined) mealCategories = window.mealCategories;
            if (window.hiddenChoreMembers !== undefined) hiddenChoreMembers = window.hiddenChoreMembers;
            if (window.showUpForGrabs !== undefined) showUpForGrabs = window.showUpForGrabs;
            
            // After loading, render the current section to show updated data
            // Only render if we're actually on that page
            if (typeof renderSection === 'function' && typeof currentSection !== 'undefined') {
                console.log('🔄 Refreshing UI for section:', currentSection);
                try {
                    renderSection(currentSection);
                } catch (e) {
                    console.log('⚠️ Could not render section (page may not be ready yet)');
                }
            }
            
            console.log('✅ Supabase initialization complete!');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            console.log('📴 Continuing in offline mode...');
        }
    }
})();