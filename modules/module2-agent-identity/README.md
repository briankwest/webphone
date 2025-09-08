# Module 2: Agent Identity - Multi-User WebRTC System

## 🎯 Learning Objectives

By completing this module, you will:
- ✅ Implement multi-user authentication with sessions
- ✅ Create agent login and identity management
- ✅ Build an agent roster with presence indicators
- ✅ Enable agent-to-agent calling by ID
- ✅ Understand session management in WebRTC apps

## 📚 Prerequisites

- ✅ Completed Module 1: Foundation
- ✅ Understanding of WebRTC basics and SignalWire tokens
- ✅ Basic knowledge of Flask sessions

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

4. **Open in browser:**
   ```
   http://localhost:3000
   ```

5. **Select an agent to log in as!**

## 🆕 What's New in Module 2

### Features Added
1. **Agent Login System**
   - Beautiful agent selection screen
   - Session-based authentication
   - Persistent agent identity

2. **Agent Roster**
   - See all agents in the system
   - Real-time status indicators
   - Click to select for calling

3. **Smart Dialing**
   - Call agents by ID (e.g., "alice", "bob")
   - Automatic routing detection
   - Caller ID shows agent name

4. **Enhanced UI**
   - Sidebar with agent profile
   - Agent directory view
   - Visual identity throughout

## 📂 Module Structure

```
module2-agent-identity/
├── app.py                    # Enhanced Flask with sessions (150 lines)
├── templates/
│   ├── agent_login.html     # NEW: Agent selection UI
│   └── index.html           # Enhanced with agent identity
├── static/
│   └── client.js            # Enhanced with agent awareness
├── data/
│   └── agents.json          # NEW: Agent configuration
├── lessons/                 # Learning materials
│   ├── 2.1-agent-architecture.md
│   └── 2.2-session-management.md
└── lab/                     # Hands-on exercises
    └── instructions.md
```

## 🔑 Key Concepts Covered

### 1. Agent Identity Model
```python
# Each agent has:
{
    "id": "alice",           # Unique identifier
    "name": "Alice Johnson",  # Display name
    "role": "Customer Service", # Job role
    "avatar": "👩‍💼",         # Visual identifier
    "extension": "101"        # Extension number
}
```

### 2. Session Management
```python
# Flask sessions store agent identity
session['agent_id'] = 'alice'
session['agent_name'] = 'Alice Johnson'

# Token generation per agent
token = get_signalwire_token(agent_id)
```

### 3. Agent-to-Agent Calling
```javascript
// Smart routing based on destination
if (isAgentId(destination)) {
    // Direct agent call
    call = await client.dial({ to: 'alice' });
} else {
    // PSTN call
    call = await client.dial({ to: '/private/call-pstn' });
}
```

## 💻 Code Highlights

### Server Side Enhancements

**Agent-Specific Tokens:**
```python
def get_signalwire_token(agent_reference):
    payload = {'reference': agent_reference}  # Dynamic agent ID
    # Each agent gets unique token
```

**Session Management:**
```python
@app.route('/login/<agent_id>')
def login_as_agent(agent_id):
    session['agent_id'] = agent_id
    # Agent identity persists across requests
```

### Client Side Enhancements

**Agent-Aware Connection:**
```javascript
// Client knows who they are
window.AGENT_ID = "alice";
window.AGENT_NAME = "Alice Johnson";

// Identify ourselves in calls
callOptions = {
    to: destination,
    caller_id_name: window.AGENT_NAME
};
```

## 🧪 Testing Scenarios

### Scenario 1: Single Agent Login
1. Open browser
2. Select "Alice" from login screen
3. Note the agent identity in UI
4. Make a call to a phone number
5. Verify agent name appears in logs

### Scenario 2: Agent-to-Agent Calling
1. Open two browser windows (use incognito for second)
2. Log in as "Alice" in window 1
3. Log in as "Bob" in window 2
4. In Alice's window, type "bob" and call
5. See the incoming call notification in Bob's console

### Scenario 3: Session Persistence
1. Log in as any agent
2. Refresh the page
3. Verify you're still logged in
4. Click logout and verify redirect to login

## 🐛 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "Agent not found" | Check agents.json file exists |
| Session not persisting | Check SECRET_KEY is set |
| Can't call other agents | Verify both agents are online |
| No agent in roster | Ensure data/agents.json is loaded |

## 📊 Module Statistics

- **Lines of Code**: ~850 total
- **New Concepts**: 5 (Sessions, Multi-user, Roster, Smart routing, Agent calling)
- **Files Added**: 3 (agent_login.html, agents.json, enhanced app.py)
- **Complexity**: ⭐⭐ (Intermediate)

## 🎓 Learning Exercises

### Exercise 1: Add More Agents
1. Edit `data/agents.json`
2. Add two new agents (Eve and Frank)
3. Restart the server
4. Verify they appear in login screen

### Exercise 2: Implement Agent Status
1. Add status change endpoint
2. Create UI for changing status (Available/Busy/Away)
3. Update roster to show real status

### Exercise 3: Add Call History
1. Track calls made by each agent
2. Display last 5 calls in the UI
3. Show caller/callee for each call

## 🚦 Module 2 Checklist

Before moving to Module 3, ensure you can:
- ✅ Log in as different agents
- ✅ See agent identity throughout the UI
- ✅ View other agents in the roster
- ✅ Make calls using agent IDs
- ✅ Understand session management

## 📖 Additional Resources

- [Flask Sessions Documentation](https://flask.palletsprojects.com/en/2.0.x/quickstart/#sessions)
- [SignalWire Subscriber Model](https://developer.signalwire.com/sdks/)
- [WebRTC Peer Identity](https://www.w3.org/TR/webrtc-identity/)

## 💡 Pro Tips

1. **Test with Multiple Browsers**: Use Chrome + Firefox or regular + incognito
2. **Watch the Console**: Agent-specific logs help understand the flow
3. **Check Network Tab**: See how sessions are maintained with cookies
4. **Try Edge Cases**: What happens if you call yourself?

## 🎉 Module 2 Complete!

You've successfully built a multi-user WebRTC system with:
- Agent authentication and sessions
- Dynamic token generation per user
- Agent roster and presence
- Smart call routing

**Next Module**: Agent-to-Agent Calling - Full bidirectional communication!

---

## 🏗️ Architecture Diagram

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Browser   │     │   Browser   │     │   Browser   │
│   (Alice)   │     │    (Bob)    │     │  (Charlie)  │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                    │                    │
       │     Login/Token    │                    │
       ▼                    ▼                    ▼
┌────────────────────────────────────────────────────┐
│                   Flask Server                      │
│  • Session Management                               │
│  • Agent Authentication                             │
│  • Token Generation per Agent                       │
└──────────────────────┬──────────────────────────┘
                       │
                       ▼
            ┌──────────────────┐
            │   SignalWire      │
            │  Call Fabric      │
            └──────────────────┘
```