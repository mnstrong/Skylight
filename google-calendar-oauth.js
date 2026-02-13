// google-calendar-oauth.js
// Google Calendar OAuth Integration with Read/Write Access
// Uses REDIRECT flow (no popups) for tablet/kiosk compatibility

// ============================================
// INITIALIZATION
// ============================================

var GOOGLE_CLIENT_ID = CONFIG.GOOGLE_CLIENT_ID;
var CALENDAR_ID = 'primary';
var SCOPES = 'https://www.googleapis.com/auth/calendar.events';

var googleAccessToken = null;
var isGoogleConnected = false;
var googleCalendarEvents = [];

// Build the redirect URI from current page location (strip hash/query)
function getRedirectUri() {
    var loc = window.location;
    // For GitHub Pages with hash routing, use the base path without index.html
    // This ensures OAuth callback doesn't conflict with app routing
    var path = loc.pathname;
    if (path.endsWith('index.html')) {
        path = path.substring(0, path.lastIndexOf('/') + 1);
    }
    return loc.origin + path + 'oauth-callback.html';
}

// ============================================
// REDIRECT-BASED OAUTH FLOW
// ============================================

// Check if we're returning from a Google OAuth redirect.
// Google sends the token back in the URL hash fragment:
//   #access_token=TOKEN&token_type=Bearer&expires_in=3600&scope=...
function checkOAuthRedirect() {
    var hash = window.location.hash;

    // Look for access_token in the hash
    if (hash && hash.indexOf('access_token=') !== -1) {
        console.log('Found OAuth redirect with access token');

        // Parse the hash fragment
        var params = {};
        var hashStr = hash.substring(1); // Remove the '#'
        var pairs = hashStr.split('&');
        for (var i = 0; i < pairs.length; i++) {
            var pair = pairs[i].split('=');
            if (pair.length === 2) {
                params[decodeURIComponent(pair[0])] = decodeURIComponent(pair[1]);
            }
        }

        if (params.access_token) {
            googleAccessToken = params.access_token;
            isGoogleConnected = true;

            // Calculate expiry time
            var expiresIn = parseInt(params.expires_in) || 3600;
            var expiryTime = Date.now() + (expiresIn * 1000);

            // Save token to localStorage (survives page reloads)
            localStorage.setItem('google_access_token', googleAccessToken);
            localStorage.setItem('google_token_expiry', expiryTime.toString());

            console.log('Google Calendar connected via redirect! Token expires in ' + expiresIn + 's');

            // Restore the app's normal hash route
            var savedRoute = localStorage.getItem('google_auth_return_route') || '#/calendar';
            localStorage.removeItem('google_auth_return_route');

            // Replace the OAuth hash with the app route
            window.history.replaceState(null, null, savedRoute);

            return true;
        }
    }

    return false;
}

// Initialize Google Calendar (call on page load)
function initGoogleCalendar() {
    console.log('Initializing Google Calendar OAuth (redirect mode)...');

    // FIRST: Check if we're returning from an OAuth redirect
    if (checkOAuthRedirect()) {
        console.log('Returned from OAuth redirect, loading events...');
        setTimeout(function() {
            loadGoogleCalendarEvents();
        }, 500);
        return;
    }

    // Check for a saved token that hasn't expired
    var savedToken = localStorage.getItem('google_access_token');
    var savedExpiry = localStorage.getItem('google_token_expiry');

    if (savedToken && savedExpiry) {
        var expiryTime = parseInt(savedExpiry);
        var now = Date.now();

        // Check if token is still valid (with 5 minute buffer)
        if (expiryTime > now + (5 * 60 * 1000)) {
            console.log('Found valid saved Google token');
            googleAccessToken = savedToken;
            isGoogleConnected = true;
            loadGoogleCalendarEvents();
            return;
        } else {
            console.log('Saved Google token expired, clearing...');
            localStorage.removeItem('google_access_token');
            localStorage.removeItem('google_token_expiry');
            // Token expired - fall through to auto-connect below
        }
    }

    // No valid token found (either missing or expired)
    console.log('No valid Google token found.');
    console.log('Auto-connecting in 2 seconds...');
    setTimeout(function() {
        console.log('Starting auto-connect to Google Calendar...');
        connectGoogleCalendar();
    }, 2000);
}

// Connect to Google Calendar — REDIRECTS the full page (no popup)
function connectGoogleCalendar() {
    console.log('Starting Google Calendar OAuth redirect...');

    // Save the current hash route so we can restore it after auth
    var currentRoute = window.location.hash || '#/calendar';
    localStorage.setItem('google_auth_return_route', currentRoute);

    // Build the OAuth authorization URL for implicit grant (token) flow
    var authUrl = 'https://accounts.google.com/o/oauth2/v2/auth' +
        '?client_id=' + encodeURIComponent(GOOGLE_CLIENT_ID) +
        '&redirect_uri=' + encodeURIComponent(getRedirectUri()) +
        '&response_type=token' +
        '&scope=' + encodeURIComponent(SCOPES) +
        '&include_granted_scopes=true' +
        '&prompt=consent';

    // Detect if we're in a WebView (which Google blocks)
    var isWebView = /(wv|WebView|; wv)/.test(navigator.userAgent);
    
    if (isWebView) {
        // WebView detected - show manual auth instructions
        showManualAuthDialog(authUrl);
    } else {
        // Regular browser - redirect normally
        window.location.href = authUrl;
    }
}

// Show dialog with manual auth instructions for WebView users
function showManualAuthDialog(authUrl) {
    var dialog = document.createElement('div');
    dialog.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center; padding: 20px;';
    
    dialog.innerHTML = '<div style="background: white; padding: 30px; border-radius: 12px; max-width: 500px; max-height: 80vh; overflow-y: auto;">' +
        '<h2 style="margin-top: 0; color: #333;">Google Auth Required</h2>' +
        '<p style="color: #666; line-height: 1.6;">Your device browser does not support Google authentication directly. Please follow these steps:</p>' +
        '<ol style="color: #666; line-height: 1.8; padding-left: 20px;">' +
        '<li>Copy the link below</li>' +
        '<li>Open Chrome browser on this tablet</li>' +
        '<li>Paste and visit the link</li>' +
        '<li>Sign in with Google</li>' +
        '<li>You will be redirected back automatically</li>' +
        '</ol>' +
        '<div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; word-wrap: break-word; font-size: 12px; font-family: monospace;">' +
        authUrl +
        '</div>' +
        '<button onclick="copyAuthUrl(\'' + authUrl.replace(/'/g, "\\'") + '\'); return false;" ' +
        'style="background: #4285f4; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 10px;">' +
        '📋 Copy Link</button>' +
        '<button onclick="tryOpenInExternalBrowser(\'' + authUrl.replace(/'/g, "\\'") + '\'); return false;" ' +
        'style="background: #34a853; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 10px;">' +
        '🌐 Try Opening in Browser</button>' +
        '<button onclick="closeManualAuthDialog(); return false;" ' +
        'style="background: #999; color: white; border: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; cursor: pointer; width: 100%;">' +
        'Cancel</button>' +
        '</div>';
    
    dialog.id = 'manualAuthDialog';
    document.body.appendChild(dialog);
}

function copyAuthUrl(url) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(function() {
            alert('✅ Link copied! Now paste it in Chrome browser.');
        }).catch(function() {
            fallbackCopyAuthUrl(url);
        });
    } else {
        fallbackCopyAuthUrl(url);
    }
}

function fallbackCopyAuthUrl(url) {
    var textArea = document.createElement('textarea');
    textArea.value = url;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.select();
    try {
        document.execCommand('copy');
        alert('✅ Link copied! Now paste it in Chrome browser.');
    } catch (err) {
        alert('Could not copy. Please manually copy the link shown above.');
    }
    document.body.removeChild(textArea);
}

function tryOpenInExternalBrowser(url) {
    window.open(url, '_system') || window.open(url, '_blank');
    startPollingForToken();
}

function closeManualAuthDialog() {
    var dialog = document.getElementById('manualAuthDialog');
    if (dialog) {
        dialog.remove();
    }
}

function startPollingForToken() {
    console.log('Starting to poll for auth token...');
    var pollInterval = setInterval(function() {
        var token = localStorage.getItem('google_access_token');
        if (token) {
            clearInterval(pollInterval);
            console.log('✅ Token found! Reloading...');
            closeManualAuthDialog();
            window.location.reload();
        }
    }, 2000);
    setTimeout(function() {
        clearInterval(pollInterval);
        console.log('Stopped polling for token');
    }, 10 * 60 * 1000);
}

// Disconnect
function disconnectGoogleCalendar() {
    if (googleAccessToken) {
        // Revoke via image request (avoids CORS)
        var img = new Image();
        img.src = 'https://oauth2.googleapis.com/revoke?token=' + googleAccessToken;
    }

    googleAccessToken = null;
    isGoogleConnected = false;
    googleCalendarEvents = [];
    localStorage.removeItem('google_access_token');
    localStorage.removeItem('google_token_expiry');
    localStorage.removeItem('google_auth_return_route');

    console.log('Google Calendar disconnected');

    // Re-render to remove Google events
    try {
        if (typeof currentView !== 'undefined') {
            if (currentView === 'month' && typeof renderCalendar === 'function') renderCalendar();
            else if (currentView === 'week' && typeof renderWeekView === 'function') renderWeekView();
            else if (currentView === 'schedule' && typeof renderScheduleView === 'function') renderScheduleView();
            else if (currentView === 'day' && typeof renderDayView === 'function') renderDayView();
        }
    } catch (e) {
        console.log('Could not re-render after disconnect');
    }
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
        console.log('Loading Google Calendar events...');

        var refDate = window.currentDate || new Date();
        var timeMin = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1).toISOString();
        var timeMax = new Date(refDate.getFullYear(), refDate.getMonth() + 2, 0, 23, 59, 59).toISOString();

        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + CALENDAR_ID + '/events?' +
            'timeMin=' + encodeURIComponent(timeMin) + '&' +
            'timeMax=' + encodeURIComponent(timeMax) + '&' +
            'singleEvents=true&' +
            'orderBy=startTime',
            {
                headers: {
                    'Authorization': 'Bearer ' + googleAccessToken
                }
            }
        );

        if (!response.ok) {
            throw new Error('API error: ' + response.status);
        }

        var data = await response.json();
        googleCalendarEvents = [];

        (data.items || []).forEach(function(event) {
            var start = event.start.dateTime || event.start.date;
            var startDate = new Date(start);
            var end = event.end.dateTime || event.end.date;
            var endDate = new Date(end);

            // Adjust all-day event end date (Google uses exclusive end date)
            var finalEndDate = endDate.toISOString().split('T')[0];
            if (event.end.date && !event.end.dateTime) {
                var adjustedEnd = new Date(endDate);
                adjustedEnd.setDate(adjustedEnd.getDate() - 1);
                finalEndDate = adjustedEnd.toISOString().split('T')[0];
            }

            // Auto-assign member if the function exists
            var memberName = '';
            if (typeof autoAssignEventMember === 'function') {
                memberName = autoAssignEventMember(event.summary || '') || '';
            } else if (typeof window.autoAssignEventMember === 'function') {
                memberName = window.autoAssignEventMember(event.summary || '') || '';
            }

            var newEvent = {
                id: event.id,
                googleId: event.id,
                title: event.summary || '(No title)',
                date: startDate.toISOString().split('T')[0],
                endDate: finalEndDate,
                time: event.start.dateTime ? startDate.toTimeString().substring(0, 5) : '',
                endTime: event.end.dateTime ? endDate.toTimeString().substring(0, 5) : '',
                notes: event.description || '',
                member: memberName,
                isGoogle: true
            };

            googleCalendarEvents.push(newEvent);
        });

        console.log('Loaded ' + googleCalendarEvents.length + ' Google Calendar events');

        // Re-render the current view
        try {
            if (typeof currentView !== 'undefined') {
                if (currentView === 'month' && typeof renderCalendar === 'function') renderCalendar();
                else if (currentView === 'week' && typeof renderWeekView === 'function') renderWeekView();
                else if (currentView === 'schedule' && typeof renderScheduleView === 'function') renderScheduleView();
                else if (currentView === 'day' && typeof renderDayView === 'function') renderDayView();
            }
        } catch (e) {
            console.log('Could not re-render calendar view:', e);
        }

    } catch (error) {
        console.error('Error loading Google Calendar events:', error);
        if (error.message && (error.message.indexOf('401') !== -1 || error.message.indexOf('403') !== -1)) {
            console.log('Token expired or invalid, clearing...');
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
        var event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ?
                { dateTime: eventData.date + 'T' + eventData.time + ':00' } :
                { date: eventData.date },
            end: eventData.endTime ?
                { dateTime: (eventData.endDate || eventData.date) + 'T' + eventData.endTime + ':00' } :
                { date: eventData.endDate || eventData.date }
        };

        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + CALENDAR_ID + '/events',
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + googleAccessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            throw new Error('Create failed: ' + response.status);
        }

        var created = await response.json();
        console.log('Event created:', created.summary);

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
        var event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ?
                { dateTime: eventData.date + 'T' + eventData.time + ':00' } :
                { date: eventData.date },
            end: eventData.endTime ?
                { dateTime: (eventData.endDate || eventData.date) + 'T' + eventData.endTime + ':00' } :
                { date: eventData.endDate || eventData.date }
        };

        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + CALENDAR_ID + '/events/' + eventId,
            {
                method: 'PUT',
                headers: {
                    'Authorization': 'Bearer ' + googleAccessToken,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(event)
            }
        );

        if (!response.ok) {
            throw new Error('Update failed: ' + response.status);
        }

        var updated = await response.json();
        console.log('Event updated:', updated.summary);

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
        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + CALENDAR_ID + '/events/' + eventId,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': 'Bearer ' + googleAccessToken
                }
            }
        );

        if (!response.ok) {
            throw new Error('Delete failed: ' + response.status);
        }

        console.log('Event deleted');

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
    isConnected: function() { return isGoogleConnected; },
    getEvents: function() { return googleCalendarEvents; }
};
