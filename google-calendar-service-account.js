// google-calendar-service-account.js
// Google Calendar Integration using Service Account
// No OAuth needed - works permanently for kiosk displays

// ============================================
// SERVICE ACCOUNT CONFIGURATION
// ============================================

var SERVICE_ACCOUNT = {
    client_email: "skylight-calendar-new@skylight-calendar-484704.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDKXz8SompQXo8i\n3LvpvbVJGbT7rxWdxypjxpY0eRkAPzSIW98CYvaXZ0z20E7qF3XJnok22OmF/lrz\niQNQniomUcjt2iYcgQi2micem6jO97VEZZEkMGW0/4wp3SGyS2u7Wl1G9MKabJPs\neA7+LQi0BcP4wSLVY/495kiKTmFyhjQau7/+HKMKLdmnqYjxK9bjBAMVxlc3IEbC\nyWUW2FYmnW/8+TYQEqAoulM55QQIOgInRYzhB/Yg9F6C0emsjF5cQV0QqRfPYriO\nVUMc3KAb/eeBSAX0GSK2tTeOM56/TcpoRnoXa2M2fhP/r3rqGcWlJraY9q9jN8BN\nuTmWISJDAgMBAAECgf8v9Qz9XX/UNpRfrpouyhuBN0EBuSa7kncj2JZqg51pHDwB\nacQaIgRN3Ne1pae4fIFtRiSThX58QnVLQSzdQ0i5y/0nCzX84JcwBAKWk6IYFJuK\n7zF2DKy4N9b/ahKSLfgEbhBXav6y7wgfAanhPMrTM9/nvd0uCdmLfFxfFN6tmglw\n61dsF6wZQZiJH2HQv6iO+ISS4bteqnTxHPSoC5Vc6J6pUJkKE0cZej8WQCm5RYOy\n+S0UX/+9YWx4Mvbx77TPmI/wFGQsUKsLxps5Y7zqa2+YJ9/Y62UweJvntaVpw+/5\nAxjEwyBg1BCQGdBV9H0f3VpkucioHq0scFADnWECgYEA7UGgWloufmRkpq+OrOd5\noAwrxUHbtvVBNXn0uTPD9K1PT5xgGjGD7xY/u8Trp9/mbF6JSdjRHnyrfA22Ribp\nuZheNMM0+L+uKiEU3osSd+GUzDp4mLRQJ41PAyuksvQDArXYSSb8wvcwemX3hGEN\nnRFBmMm9FtUpkglrL/z2rBsCgYEA2lwa6Gs965PNTSqGG5id7c6QLt7jtbOIlyjj\nK3P0bGkpoMj2QcJl+BIa49gmuRnVZK1bu8aXkNPp8/gbNpsm7ZFhlSvMwSjbNEme\nse6kVsOXcm0az7KWuf/D5AcxKpKyy52Lb8Ez/eV4ve1qatjKygAeLZlxHJFGcfOk\nmfke9PkCgYBTiwlQ53J5tRYwD594yOVt8vsysXcRnJjCoNgIou68aI6F5PV+I7Nm\na/ozPysP6Op1fHBxXXR9fL7Rpu5pE2i3nqyFfbtYX/6O/SkhF+1/4yIHLAutEckr\ntDl/T03mab/po2iukZjteidK4j7fEWG+zgXALEF2GcdSkhh5RGUDwwKBgGC1BBHF\nVTIdToKLf8N/DwrAPikT++OANNFFgX7AJxNQa+hSuIWdNA3u7svT8ipuX4zsHkGG\njZ/NysKLMno3ssDqbz5inJc7ogGBTXBeUZg/nbZGzeYIoSqVNMurx8GkIN1+079V\n4NHkrFnpaQUTKJTYAoWNfIP7byiOkGrE40n5AoGBAIa5aRpMjN+S6PLCD3Tm7jbW\nXCMGS+q1F8T7TO5H195odVfyXZgWAa04OlzXl1FlohbjrOFa1s7jkShKn6HXRmXu\nzGlNnh8+/O1D+Vun0bDmTRkMdL4IcDiTxo6YB+z7L3sN+QjbSroqIwThr+ZoWyiI\nRg4dENnKn02mKWh26vOc\n-----END PRIVATE KEY-----\n"
};

var CALENDAR_ID = 'family01945926476049559832@group.calendar.google.com';
var SCOPES = 'https://www.googleapis.com/auth/calendar.events';

var googleAccessToken = null;
var isGoogleConnected = false;
var googleCalendarEvents = [];

// ============================================
// JWT TOKEN GENERATION
// ============================================

// Base64 URL encoding
function base64UrlEncode(str) {
    var base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// Create JWT for Service Account
async function createJWT() {
    var now = Math.floor(Date.now() / 1000);
    
    var header = {
        "alg": "RS256",
        "typ": "JWT"
    };
    
    var claimSet = {
        "iss": SERVICE_ACCOUNT.client_email,
        "scope": SCOPES,
        "aud": "https://oauth2.googleapis.com/token",
        "exp": now + 3600,
        "iat": now
    };
    
    var encodedHeader = base64UrlEncode(JSON.stringify(header));
    var encodedClaimSet = base64UrlEncode(JSON.stringify(claimSet));
    var signatureInput = encodedHeader + "." + encodedClaimSet;
    
    // Import the private key
    var privateKey = SERVICE_ACCOUNT.private_key;
    
    // Convert PEM to binary
    var pemHeader = "-----BEGIN PRIVATE KEY-----";
    var pemFooter = "-----END PRIVATE KEY-----";
    var pemContents = privateKey.substring(pemHeader.length, privateKey.lastIndexOf(pemFooter));
    // Remove ALL whitespace including newlines, spaces, tabs
    pemContents = pemContents.replace(/[\s\r\n]/g, '');
    
    var binaryKey = atob(pemContents);
    var binaryKeyArray = new Uint8Array(binaryKey.length);
    for (var i = 0; i < binaryKey.length; i++) {
        binaryKeyArray[i] = binaryKey.charCodeAt(i);
    }
    
    try {
        var cryptoKey = await crypto.subtle.importKey(
            "pkcs8",
            binaryKeyArray,
            {
                name: "RSASSA-PKCS1-v1_5",
                hash: "SHA-256"
            },
            false,
            ["sign"]
        );
        
        var signatureArrayBuffer = await crypto.subtle.sign(
            "RSASSA-PKCS1-v1_5",
            cryptoKey,
            new TextEncoder().encode(signatureInput)
        );
        
        var signatureArray = Array.from(new Uint8Array(signatureArrayBuffer));
        var signatureBase64 = btoa(String.fromCharCode.apply(null, signatureArray));
        var signature = signatureBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
        
        return encodedHeader + "." + encodedClaimSet + "." + signature;
    } catch (error) {
        console.error('Error creating JWT:', error);
        throw error;
    }
}

// Exchange JWT for access token
async function getAccessToken() {
    try {
        var jwt = await createJWT();
        
        var response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=' + jwt
        });
        
        if (!response.ok) {
            throw new Error('Token exchange failed: ' + response.status);
        }
        
        var data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Error getting access token:', error);
        throw error;
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function initGoogleCalendar() {
    console.log('Initializing Google Calendar (Service Account mode)...');
    
    try {
        googleAccessToken = await getAccessToken();
        isGoogleConnected = true;
        console.log('✅ Service Account authenticated');
        
        await loadGoogleCalendarEvents();
    } catch (error) {
        console.error('Failed to initialize Google Calendar:', error);
        isGoogleConnected = false;
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
            'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events?' +
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

            // Extract time directly from the ISO string to avoid Android 8 toTimeString() timezone bugs
            var startTime = '';
            var endTimeStr = '';
            if (event.start.dateTime) {
                // dateTime looks like "2026-02-17T14:00:00-07:00" — grab HH:MM directly
                var startRaw = event.start.dateTime;
                var tIdx = startRaw.indexOf('T');
                if (tIdx !== -1) startTime = startRaw.substring(tIdx + 1, tIdx + 6);
            }
            if (event.end.dateTime) {
                var endRaw = event.end.dateTime;
                var tIdx2 = endRaw.indexOf('T');
                if (tIdx2 !== -1) endTimeStr = endRaw.substring(tIdx2 + 1, tIdx2 + 6);
            }

            var newEvent = {
                id: event.id,
                googleId: event.id,
                title: event.summary || '(No title)',
                date: event.start.dateTime ? event.start.dateTime.split('T')[0] : startDate.toISOString().split('T')[0],
                endDate: finalEndDate,
                time: startTime,
                endTime: endTimeStr,
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
        
        // If token expired, get a new one
        if (error.message && (error.message.indexOf('401') !== -1 || error.message.indexOf('403') !== -1)) {
            console.log('Token expired, getting new token...');
            try {
                googleAccessToken = await getAccessToken();
                await loadGoogleCalendarEvents();
            } catch (refreshError) {
                console.error('Failed to refresh token:', refreshError);
            }
        }
    }
}

// ============================================
// CREATE EVENT
// ============================================

async function createGoogleCalendarEvent(eventData) {
    if (!googleAccessToken) {
        console.error('No Google access token');
        return null;
    }

    try {
        // Compute end separately to avoid parser issues with IIFE in object literals
        var endField;
        if (eventData.time) {
            if (eventData.endTime) {
                endField = { dateTime: (eventData.endDate || eventData.date) + 'T' + eventData.endTime + ':00' };
            } else {
                var startDt = new Date(eventData.date + 'T' + eventData.time + ':00');
                startDt.setHours(startDt.getHours() + 1);
                var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
                endField = { dateTime: eventData.date + 'T' + pad(startDt.getHours()) + ':' + pad(startDt.getMinutes()) + ':00' };
            }
        } else {
            endField = { date: eventData.endDate || eventData.date };
        }

        var event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ?
                { dateTime: eventData.date + 'T' + eventData.time + ':00' } :
                { date: eventData.date },
            end: endField
        };

        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events',
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
        return null;
    }
}

// ============================================
// UPDATE EVENT
// ============================================

async function updateGoogleCalendarEvent(eventId, eventData) {
    if (!googleAccessToken) {
        console.error('No Google access token');
        return null;
    }

    try {
        var endField2;
        if (eventData.time) {
            if (eventData.endTime) {
                endField2 = { dateTime: (eventData.endDate || eventData.date) + 'T' + eventData.endTime + ':00' };
            } else {
                var startDt2 = new Date(eventData.date + 'T' + eventData.time + ':00');
                startDt2.setHours(startDt2.getHours() + 1);
                var pad2 = function(n) { return n < 10 ? '0' + n : '' + n; };
                endField2 = { dateTime: eventData.date + 'T' + pad2(startDt2.getHours()) + ':' + pad2(startDt2.getMinutes()) + ':00' };
            }
        } else {
            endField2 = { date: eventData.endDate || eventData.date };
        }

        var event = {
            summary: eventData.title,
            description: eventData.notes || '',
            start: eventData.time ?
                { dateTime: eventData.date + 'T' + eventData.time + ':00' } :
                { date: eventData.date },
            end: endField2
        };

        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events/' + eventId,
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
        return null;
    }
}

// ============================================
// DELETE EVENT
// ============================================

async function deleteGoogleCalendarEvent(eventId) {
    if (!googleAccessToken) {
        console.error('No Google access token');
        return false;
    }

    try {
        var response = await fetch(
            'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(CALENDAR_ID) + '/events/' + eventId,
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
        return false;
    }
}

// Export functions to window
window.GoogleCalendar = {
    init: initGoogleCalendar,
    load: loadGoogleCalendarEvents,
    loadEvents: loadGoogleCalendarEvents,
    create: createGoogleCalendarEvent,
    update: updateGoogleCalendarEvent,
    delete: deleteGoogleCalendarEvent,
    isConnected: function() { return isGoogleConnected; },
    getEvents: function() { return googleCalendarEvents; }
};