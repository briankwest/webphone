# Module 1 Lab: Hands-On with WebRTC

## 🎯 Lab Objectives

Complete these exercises to reinforce your understanding of:
- Token generation and authentication
- WebRTC connection management
- Call lifecycle handling
- Error recovery

## 🛠️ Setup

1. Ensure your Module 1 app is running:
   ```bash
   cd modules/module1-foundation
   python app.py
   ```

2. Open http://localhost:3000 in your browser

3. Open browser developer tools (F12)

---

## 📝 Exercise 1: Observe the Authentication Flow

**Goal**: Understand how tokens flow from server to client

### Steps:
1. Open Network tab in DevTools
2. Clear the network log
3. Refresh the page
4. Find the request to `localhost:3000`
5. Click on it and view the Response tab

### Questions to Answer:
- [ ] Can you find where the token is embedded in the HTML?
- [ ] What is the subscriber_id for user1?
- [ ] How many characters long is the token?

### Your Observations:
```
Token location in HTML: _______________
Subscriber ID: _______________________
Token length: ________________________
```

---

## 📝 Exercise 2: Monitor WebRTC Connection

**Goal**: See WebRTC connection establishment in real-time

### Steps:
1. Open Console tab
2. Refresh the page
3. Watch the connection logs

### Tasks:
- [ ] Find the "✅ Connected to SignalWire!" message
- [ ] Note the Connection Info object
- [ ] Look for any WebSocket connections in Network tab

### Record These Events:
```
1. Client creation timestamp: __________
2. Online status timestamp: ____________
3. Total connection time: ______________
```

---

## 💻 Exercise 3: Add Call Duration Timer

**Goal**: Enhance the UI with a call duration display

### Step 1: Modify HTML
Add a duration display to `templates/index.html`:

```html
<!-- Add this after the phone number input -->
<div id="callDuration" style="display: none; margin-top: 10px;">
    Call Duration: <span id="durationDisplay">00:00</span>
</div>
```

### Step 2: Modify JavaScript
Update `static/client.js`:

```javascript
// Add these variables at the top
let callStartTime = null;
let durationInterval = null;

// Add this function
function updateDuration() {
    if (!callStartTime) return;
    
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    document.getElementById('durationDisplay').textContent = display;
}

// Modify setupCallEventHandlers to start timer on answer
function setupCallEventHandlers(call) {
    // ... existing code ...
    
    call.on('state', (state) => {
        console.log('📊 Call state changed:', state);
        
        if (state === 'answered') {
            console.log('✅ Call was answered!');
            // START TIMER HERE
            callStartTime = Date.now();
            document.getElementById('callDuration').style.display = 'block';
            durationInterval = setInterval(updateDuration, 1000);
        }
    });
    
    // ... rest of existing code ...
}

// Modify resetCallUI to stop timer
function resetCallUI() {
    // ... existing code ...
    
    // STOP TIMER HERE
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
    callStartTime = null;
    document.getElementById('callDuration').style.display = 'none';
    document.getElementById('durationDisplay').textContent = '00:00';
}
```

### Test Your Implementation:
- [ ] Make a call
- [ ] Verify timer starts when call is answered
- [ ] Verify timer stops when call ends
- [ ] Check timer resets for new calls

---

## 💻 Exercise 4: Add Connection Retry Logic

**Goal**: Handle connection failures gracefully

### Add Auto-Reconnect Feature:

```javascript
// Add this to client.js
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 3;

async function connectWithRetry() {
    while (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        try {
            console.log(`🔄 Connection attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS}`);
            
            client = await SignalWire.SignalWire({
                token: window.SIGNALWIRE_TOKEN,
                rootElement: document.getElementById('videoContainer'),
            });
            
            await client.online();
            
            updateConnectionStatus(true);
            console.log('✅ Connected successfully!');
            callButton.disabled = false;
            reconnectAttempts = 0; // Reset on success
            return true;
            
        } catch (error) {
            reconnectAttempts++;
            console.error(`❌ Connection attempt ${reconnectAttempts} failed:`, error);
            
            if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
                const delay = reconnectAttempts * 2000; // Exponential backoff
                console.log(`⏳ Retrying in ${delay/1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            } else {
                showError('Failed to connect after multiple attempts. Please refresh the page.');
                updateConnectionStatus(false);
                return false;
            }
        }
    }
}

// Replace the DOMContentLoaded event listener with:
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Module 1: Initializing WebRTC client...');
    await connectWithRetry();
});
```

### Test Scenarios:
- [ ] Temporarily break your token in the HTML and verify retry logic
- [ ] Watch the exponential backoff in action
- [ ] Verify it stops after 3 attempts

---

## 💻 Exercise 5: Add Incoming Call Support

**Goal**: Prepare for Module 2 by adding incoming call detection

### Add Incoming Call Handler:

```javascript
// Modify the client initialization in client.js
async function initializeClient() {
    client = await SignalWire.SignalWire({
        token: window.SIGNALWIRE_TOKEN,
        rootElement: document.getElementById('videoContainer'),
    });
    
    // Add incoming call handler
    await client.online({
        incomingCallHandlers: {
            all: handleIncomingCall
        }
    });
}

// Add new function
async function handleIncomingCall(notification) {
    console.log('📞 Incoming call detected!', notification);
    
    // For now, just log it
    // In Module 2, we'll add UI for accepting/rejecting
    const callerId = notification.invite?.details?.caller_id_number || 'Unknown';
    console.log(`Incoming call from: ${callerId}`);
    
    // Auto-reject for now (remove in Module 2)
    if (notification.invite) {
        console.log('🚫 Auto-rejecting call (Module 1 doesn\'t support incoming calls yet)');
        await notification.invite.reject();
    }
}
```

---

## 🎯 Challenge Exercise: Call History Log

**Goal**: Create a simple call history

### Requirements:
1. Track all outgoing calls
2. Show timestamp, number, and duration
3. Display last 5 calls
4. Persist across page refreshes (use localStorage)

### Starter Structure:
```javascript
const callHistory = {
    calls: JSON.parse(localStorage.getItem('callHistory') || '[]'),
    
    addCall(phoneNumber, duration) {
        this.calls.unshift({
            number: phoneNumber,
            duration: duration,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 5
        this.calls = this.calls.slice(0, 5);
        
        // Save to localStorage
        localStorage.setItem('callHistory', JSON.stringify(this.calls));
        
        this.updateDisplay();
    },
    
    updateDisplay() {
        // TODO: Update UI with call history
    }
};
```

---

## 📊 Lab Completion Checklist

### Core Exercises:
- [ ] Exercise 1: Observed authentication flow
- [ ] Exercise 2: Monitored WebRTC connection
- [ ] Exercise 3: Added call duration timer
- [ ] Exercise 4: Implemented connection retry
- [ ] Exercise 5: Added incoming call detection

### Bonus Challenges:
- [ ] Call history implementation
- [ ] Custom ringtone for outgoing calls
- [ ] Mute button during calls
- [ ] Network quality indicator

## 🎓 What You've Learned

After completing this lab, you can:
- ✅ Inspect and understand token flow
- ✅ Monitor WebRTC connections in DevTools
- ✅ Enhance UI with real-time call information
- ✅ Implement error recovery mechanisms
- ✅ Prepare for multi-user features

## 🚀 Ready for Module 2?

If you've completed all exercises, you're ready to move on to Module 2: Agent Identity, where we'll add:
- Multiple users with login
- Agent presence tracking
- User-specific tokens
- Agent roster display

---

## 💡 Troubleshooting Tips

| Problem | Solution |
|---------|----------|
| Timer doesn't start | Check if call state becomes 'answered' |
| Reconnect loops forever | Verify MAX_RECONNECT_ATTEMPTS is set |
| No incoming calls | This is expected in Module 1 |
| localStorage not working | Check browser privacy settings |

## 📚 Additional Resources

- [MDN: localStorage](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [JavaScript Timers](https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Asynchronous/Timeouts_and_intervals)
- [Promise Error Handling](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Using_promises#error_handling)