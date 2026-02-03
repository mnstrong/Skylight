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
            
            // After loading, render the current section to show updated data
            if (typeof renderSection === 'function' && typeof currentSection !== 'undefined') {
                console.log('🔄 Refreshing UI with Supabase data...');
                renderSection(currentSection);
            }
            
            console.log('✅ Supabase initialization complete!');
        } catch (error) {
            console.error('❌ Supabase initialization error:', error);
            console.log('📴 Continuing in offline mode...');
        }
    }
})();
