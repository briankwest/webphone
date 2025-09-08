# Module 4: Two-Agent Calling (Simplified)

## 🎯 Learning Objective
Learn how two WebRTC agents can call each other using SignalWire.

## 🚀 Quick Start

### 1. Set Environment Variables
```bash
export SIGNALWIRE_SPACE_NAME="your-space"
export SIGNALWIRE_PROJECT_KEY="your-project-key"
export SIGNALWIRE_TOKEN="your-token"
```

### 2. Install & Run
```bash
cd modules/module4-two-agent-demo
pip install -r requirements.txt
python app_simple.py
```

### 3. Open Two Browsers
⚠️ **IMPORTANT**: You MUST use two different browser contexts:

**Option A: Chrome + Incognito**
- Regular Chrome: http://localhost:5004/alice
- Incognito Chrome: http://localhost:5004/bob

**Option B: Chrome + Firefox**
- Chrome: http://localhost:5004/alice
- Firefox: http://localhost:5004/bob

### 4. Make a Call
1. Wait for both agents to show "Connected"
2. From Alice: Click "Call Bob"
3. From Bob: Click "Answer" when the call comes in
4. Either side: Click "Hang Up" to end the call

## 📚 How It Works

### Backend (app_simple.py)
```python
@app.route('/alice')  # Alice's phone endpoint
@app.route('/bob')    # Bob's phone endpoint
@app.route('/api/token/<agent_id>')  # Get SignalWire tokens
```

### Frontend Flow
1. **Get Token**: Fetch SignalWire token from server
2. **Connect**: Create SignalWire client and go online
3. **Make Call**: `client.dial({ to: '/private/bob' })`
4. **Receive Call**: Handle incoming call notification
5. **Answer/Reject**: User interaction
6. **End Call**: Hangup and cleanup

### Key Code Snippets

**Making a Call:**
```javascript
currentCall = await client.dial({
    to: `/private/${window.OTHER_AGENT}`,
    audio: true,
    video: false
});
```

**Handling Incoming Calls:**
```javascript
await client.online({
    incomingCallHandlers: {
        all: handleIncomingCall
    }
});
```

## 🔍 What to Observe

1. **Connection Status**: Watch status change from "Connecting" to "Connected"
2. **Call Flow**: See the progression: Calling → Ringing → In Call
3. **Two-Way Audio**: Both agents can hear each other
4. **Clean Disconnect**: Call ends properly on hangup

## ❓ Common Issues

**"Connection failed"**
- Check your SignalWire credentials
- Verify environment variables are set

**"Can't see incoming call"**
- Make sure you're using different browsers/contexts
- Check browser console for errors

**"No audio"**
- Allow microphone permissions when prompted
- Check system audio settings

## 🧪 Exercises

1. **Add Video**: Change `video: false` to `true` in the dial options
2. **Custom Status**: Add more detailed status messages during call setup
3. **Call Timer**: Add a duration timer that shows how long the call has been active
4. **Busy Signal**: Handle the case when Bob is already on a call

## 📖 Key Concepts

- **Agent IDs**: Each agent needs a unique identifier (alice, bob)
- **Token Authentication**: Server gets tokens from SignalWire API
- **Call Routing**: `/private/[agent_id]` routes calls between agents
- **Event Handlers**: Listen for answer, destroy, media events

## 🎓 What You Learned

✅ How to set up two WebRTC clients
✅ Making calls between agents
✅ Handling incoming call notifications
✅ Managing call lifecycle (dial, answer, hangup)
✅ Why browser isolation is needed (cookies/storage)

---

**Next Module**: Add features like call transfer, hold, and conference calling.