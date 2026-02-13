// google-calendar-oauth.js
// Google Calendar OAuth Integration with Read/Write Access

// ============================================
// INITIALIZATION
// ============================================

const GOOGLE_CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
const CALENDAR_ID = 'primary'; // User's primary calendar
const SCOPES = 'https://www.googleapis.com/auth/calendar.events';

let googleAccessToken = null;
let googleTokenClient = null;
let isGoogleConnected = false;
let googleCalendarEvents = [];

// Initialize Google Identity Services (call this on page load)
function initGoogleCalendar() {
    console.log('Initializing Google Calendar OAuth...');
    
    // Check if already have token
    const savedToken = sessionStorage.getItem('google_access_token');
    if (savedToken) {
        console.log('📝 Found saved Google token');
        googleAccessToken = savedToken;
        isGoogleConnected = true;
        loadGoogleCalendarEvents();
        return;
    }
    
    // Initialize token client
    googleTokenClient = google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.access_token) {
                googleAccessToken = response.access_token;
                sessionStorage.setItem('google_access_token', googleAccessToken);
                isGoogleConnected = true;
                console.log('✅ Google Calendar connected!');
                loadGoogleCalendarEvents();
            }
        },
    });
}

// Connect to Google Calendar (shows popup)
function connectGoogleCalendar() {
    if (!googleTokenClient) {
        console.error('Google token client not initialized');
        return;
    }
    googleTokenClient.requestAccessToken({ prompt: '' });
}

// Disconnect
function disconnectGoogleCalendar() {
    if (googleAccessToken) {
        google.accounts.oauth2.revoke(googleAccessToken);
    }
    googleAccessToken = null;
    isGoogleConnected = false;
    googleCalendarEvents = [];
    sessionStorage.removeItem('google_access_token');
}

// ============================================
// READ EVENTS
// ============================================

async function loadGoogleCalendarEvents() {
    if (!googleAccessToken) {
        console.warn('No Google access token');
        return;
    }
    
    try {
        console.log('📅 Loading Google Calendar events...');
        
        // Use currentDate from script.js if available, otherwise use current date
        const refDate = window.currentDate || new Date();
        const timeMin = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1).toISOString();
        const timeMax = new Date(refDate.getFullYear(), refDate.getMonth() + 2, 0, 23, 59, 59).toISOString();
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events?` +
            `timeMin=${encodeURIComponent(timeMin)}&` +
            `timeMax=${encodeURIComponent(timeMax)}&` +
            `singleEvents=true&` +
            `orderBy=startTime`,
            {
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }
        
        const data = await response.json();
        googleCalendarEvents = [];
        
        (data.items || []).forEach(event => {
            const start = event.start.dateTime || event.start.date;
            const startDate = new Date(start);
            const end = event.end.dateTime || event.end.date;
            const endDate = new Date(end);
            
            // Adjust all-day event end date (Google uses exclusive end date)
            let finalEndDate = endDate.toISOString().split('T')[0];
            if (event.end.date && !event.end.dateTime) {
                const adjustedEnd = new Date(endDate);
                adjustedEnd.setDate(adjustedEnd.getDate() - 1);
                finalEndDate = adjustedEnd.toISOString().split('T')[0];
            }
            
            const newEvent = {
                id: event.id,
                googleId: event.id,
                title: event.summary || '(No title)',
                date: startDate.toISOString().split('T')[0],
                endDate: finalEndDate,
                time: event.start.dateTime ? startDate.toTimeString().substring(0, 5) : '',
                endTime: event.end.dateTime ? endDate.toTimeString().substring(0, 5) : '',
                notes: event.description || '',
                member: autoAssignEventMember(event.summary || '') || '',
                isGoogle: true
            };
            
            googleCalendarEvents.push(newEvent);
        });
        
        console.log(`✅ Loaded ${googleCalendarEvents.length} events`);
        
        // Re-render
        if (typeof renderCalendar === 'function' && currentView === 'month') renderCalendar();
        else if (typeof renderWeekView === 'function' && currentView === 'week') renderWeekView();
        else if (typeof renderScheduleView === 'function' && currentView === 'schedule') renderScheduleView();
        else if (typeof renderDayView === 'function' && currentView === 'day') renderDayView();
        
    } catch (error) {
        console.error('Error loading events:', error);
        if (error.message.includes('401')) {
            console.log('Token expired, please reconnect');
            disconnectGoogleCalendar();
        }
    }
}

// ============================================
// CREATE EVENT
// ============================================

async function createGoogleCalendarEvent(eventData) {
    if (!googleAccessToken) {
        alert('Please connect to Google Calendar first');
        return null;
    }
    
    try {
        const event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ? 
                { dateTime: `${eventData.date}T${eventData.time}:00` } :
                { date: eventData.date },
            end: eventData.endTime ?
                { dateTime: `${eventData.endDate || eventData.date}T${eventData.endTime}:00` } :
                { date: eventData.endDate || eventData.date }
        };
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Create failed: ${response.status}`);
        }
        
        const created = await response.json();
        console.log('✅ Event created:', created.summary);
        
        // Reload events
        await loadGoogleCalendarEvents();
        return created;
        
    } catch (error) {
        console.error('Error creating event:', error);
        alert('Failed to create event');
        return null;
    }
}

// ============================================
// UPDATE EVENT
// ============================================

async function updateGoogleCalendarEvent(eventId, eventData) {
    if (!googleAccessToken) {
        alert('Please connect to Google Calendar first');
        return null;
    }
    
    try {
        const event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ? 
                { dateTime: `${eventData.date}T${eventData.time}:00` } :
                { date: eventData.date },
            end: eventData.endTime ?
                { dateTime: `${eventData.endDate || eventData.date}T${eventData.endTime}:00` } :
                { date: eventData.endDate || eventData.date }
        };
        
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
        );
        
        if (!response.ok) {
            throw new Error(`Update failed: ${response.status}`);
        }
        
        const updated = await response.json();
        console.log('✅ Event updated:', updated.summary);
        
        // Reload events
        await loadGoogleCalendarEvents();
        return updated;
        
    } catch (error) {
        console.error('Error updating event:', error);
        alert('Failed to update event');
        return null;
    }
}

// ============================================
// DELETE EVENT
// ============================================

async function deleteGoogleCalendarEvent(eventId) {
    if (!googleAccessToken) {
        alert('Please connect to Google Calendar first');
        return false;
    }
    
    try {
        const response = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events/${eventId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${googleAccessToken}`
                }
            }
        );
        
        if (!response.ok) {
            throw new Error(`Delete failed: ${response.status}`);
        }
        
        console.log('✅ Event deleted');
        
        // Reload events
        await loadGoogleCalendarEvents();
        return true;
        
    } catch (error) {
        console.error('Error deleting event:', error);
        alert('Failed to delete event');
        return false;
    }
}

// Export functions to window
window.GoogleCalendar = {
    init: initGoogleCalendar,
    connect: connectGoogleCalendar,
    disconnect: disconnectGoogleCalendar,
    load: loadGoogleCalendarEvents,
    loadEvents: loadGoogleCalendarEvents,
    create: createGoogleCalendarEvent,
    update: updateGoogleCalendarEvent,
    delete: deleteGoogleCalendarEvent,
    isConnected: () => isGoogleConnected,
    getEvents: () => googleCalendarEvents
};