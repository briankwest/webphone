# Module 3: Agent-to-Agent Calling - Full Bidirectional Communication

## 🎯 Learning Objectives

By completing this module, you will:
- ✅ Implement full incoming call handling with Accept/Reject UI
- ✅ Build comprehensive call state management
- ✅ Create visual call flow indicators
- ✅ Add quick-call functionality to agent roster
- ✅ Implement agent status management (Available/Busy/Away)
- ✅ Master bidirectional P2P communication patterns

## 📚 Prerequisites

- ✅ Completed Module 1 & 2
- ✅ Understanding of agent identity and sessions
- ✅ Basic knowledge of WebRTC signaling

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Set up environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your SignalWire credentials
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Test bidirectional calling:**
   - Open two browser windows (use incognito for second)
   - Log in as different agents
   - Call each other!

## 🆕 What's New in Module 3

### Major Features Added

1. **Incoming Call Modal**
   - Beautiful animated modal for incoming calls
   - Shows caller name and avatar
   - Accept/Reject buttons
   - Ringtone simulation

2. **Call State Management**
   ```javascript
   States: idle → connecting → ringing → connected → ending → idle
   ```
   - Visual indicators for each state
   - Persistent state display
   - Smooth transitions

3. **Quick Call Buttons**
   - One-click calling from roster
   - Visual feedback on call initiation
   - Disabled state for offline agents

4. **Agent Status System**
   - Available / Busy / Away states
   - Visual indicators in roster
   - Real-time status updates

5. **Enhanced UI/UX**
   - Call state indicator badge
   - Animated call notifications
   - Keyboard shortcuts (Space to answer, Esc to reject)

## 📂 Module Structure

```
module3-agent-calling/
├── app.py                    # Same as Module 2
├── templates/
│   ├── agent_login.html     # Same as Module 2
│   └── index.html           # ENHANCED: Full call UI
├── static/
│   └── client.js            # ENHANCED: Bidirectional logic
├── data/
│   └── agents.json          # Agent configuration
└── README.md                # This file
```

## 🔑 Key Implementation Details

### Incoming Call Handling

```javascript
// Module 3 implements full accept/reject
async function handleIncomingCall(notification) {
    incomingInvite = notification.invite;
    showIncomingCallModal(callerId);
    // User can now accept or reject
}

async function answerCall() {
    currentCall = await incomingInvite.accept();
    // Call is now active!
}
```

### Call State Flow

```
OUTGOING CALL:
idle → connecting → ringing → connected → ending → idle

INCOMING CALL:
idle → ringing → (accept) → connecting → connected → ending → idle
     ↘ (reject) → idle
```

### Quick Call Integration

```javascript
// One-click calling from roster
function callAgent(agentId) {
    destinationInput.value = agentId;
    makeCall();
}
```

## 💻 Testing Scenarios

### Scenario 1: Basic Agent-to-Agent Call
1. **Alice's Browser**: Log in as Alice
2. **Bob's Browser**: Log in as Bob (use incognito)
3. **Alice**: Click "Call" button next to Bob in roster
4. **Bob**: See incoming call modal, click "Answer"
5. **Both**: See call duration timer
6. **Either**: Click "End Call"

### Scenario 2: Reject Incoming Call
1. **Alice**: Call Bob
2. **Bob**: Click "Reject" on incoming call
3. **Alice**: See call failed message
4. **Both**: Return to idle state

### Scenario 3: Agent Status Changes
1. **Alice**: Set status to "Busy"
2. **Bob**: See Alice's status update in roster
3. **Alice**: Set status to "Away"
4. **Bob**: Call button for Alice shows different state

### Scenario 4: Keyboard Shortcuts
1. **Incoming call**: Press Space to answer, Esc to reject
2. **During call**: Press Esc to hang up
3. **Idle**: Type agent name, press Enter to call

## 🎮 Interactive Features

### Call State Indicators
- **Idle**: "Ready" - Green indicator
- **Connecting**: "🔄 Connecting" - Yellow pulse
- **Ringing**: "🔔 Ringing" - Yellow animation  
- **Connected**: "✅ Connected" - Green solid
- **Ending**: "📴 Ending" - Red fade

### Visual Feedback
- Agent roster highlights during calls
- Modal animation for incoming calls
- Pulse animation for online agents
- Disabled states for offline agents

## 📊 Module Statistics

- **Lines of Code**: ~1,200 total
- **New Concepts**: 6 (Accept/Reject, State management, Quick call, Status, Keyboard shortcuts, Visual indicators)
- **Complexity**: ⭐⭐⭐ (Intermediate-Advanced)

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Modal doesn't appear | Check browser console for errors |
| Can't answer calls | Ensure microphone permissions granted |
| Status doesn't update | Check server is running |
| Call button disabled | Agent might be offline |

## 🎓 Learning Exercises

### Exercise 1: Add Ringtone Audio
1. Add an actual audio file for ringtone
2. Play on incoming call
3. Stop on answer/reject
4. Add volume control

### Exercise 2: Implement Call Hold
1. Add "Hold" button during calls
2. Implement hold/resume logic
3. Show visual indicator when on hold
4. Notify other party

### Exercise 3: Call History
1. Track all calls (incoming/outgoing)
2. Show last 10 calls in UI
3. Include duration and timestamp
4. Add missed call indicator

### Exercise 4: Group Status
1. Add "In Call" auto-status
2. Prevent calls to busy agents
3. Show call participant info
4. Queue calls for busy agents

## 🚦 Module 3 Checklist

Before moving to Module 4, ensure you can:
- ✅ Accept and reject incoming calls
- ✅ See visual call state indicators
- ✅ Use quick call buttons
- ✅ Change agent status
- ✅ Use keyboard shortcuts
- ✅ Handle simultaneous calls (reject if busy)

## 💡 Architecture Insights

### Call Flow Sequence
```
Alice calls Bob:
1. Alice: client.dial({ to: 'bob' })
2. SignalWire: Routes to Bob's subscriber
3. Bob: handleIncomingCall(notification)
4. Bob: Shows modal with Alice's info
5. Bob: User clicks Accept
6. Bob: incomingInvite.accept()
7. Both: Call connected, timers start
8. Either: hangup()
9. Both: Return to idle
```

### State Management Pattern
```javascript
// Centralized state updates
function updateCallState(newState) {
    // Update internal state
    callState = newState;
    
    // Update UI elements
    updateStatusBar(newState);
    updateCallIndicator(newState);
    updateRosterHighlights(newState);
    
    // Log for debugging
    console.log('State:', newState);
}
```

## 🎉 Module 3 Complete!

You've built a production-ready P2P calling system with:
- ✅ Full bidirectional communication
- ✅ Professional call handling UI
- ✅ Comprehensive state management
- ✅ Rich visual feedback
- ✅ Quick-action features

**Next Module**: Two-Agent Demo - Visual side-by-side calling demonstration!

---

## 🏆 Pro Tips

1. **Test with Network Throttling**: Chrome DevTools → Network → Slow 3G
2. **Monitor WebSocket Frames**: Network tab → WS → Frames
3. **Debug State Transitions**: Add console.log to every state change
4. **Test Edge Cases**: Calling yourself, offline agents, rapid calls
5. **Check Memory Leaks**: Use Chrome Performance Monitor

## 📚 Additional Resources

- [WebRTC Perfect Negotiation](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API/Perfect_negotiation)
- [SignalWire Call States](https://developer.signalwire.com/sdks/)
- [Managing Call State in WebRTC](https://webrtc.org/getting-started/peer-connections)