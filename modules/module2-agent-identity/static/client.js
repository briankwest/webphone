/**
 * Module 2: Agent Identity - Enhanced WebRTC Client
 * 
 * This enhanced client adds:
 * 1. Agent-aware connections (each agent has unique identity)
 * 2. Agent-to-agent calling support
 * 3. Presence tracking
 * 4. Smart call routing (agent vs PSTN)
 * 
 * Learning Focus: Multi-user identity management in WebRTC
 */

// Global variables
let client = null;
let currentCall = null;
let callStartTime = null;
let durationInterval = null;

// UI Elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const destinationInput = document.getElementById('destination');
const connectionStatus = document.getElementById('connectionStatus');
const connectionIndicator = document.getElementById('connectionIndicator');
const errorMessage = document.getElementById('errorMessage');
const callDuration = document.getElementById('callDuration');
const durationDisplay = document.getElementById('durationDisplay');

/**
 * Initialize the SignalWire client with agent identity
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Module 2: Initializing WebRTC client for agent:', window.AGENT_NAME);
    console.log('📌 Agent ID:', window.AGENT_ID);
    
    try {
        // Create SignalWire client with agent-specific token
        console.log('📝 Creating SignalWire client with agent token...');
        client = await SignalWire.SignalWire({
            token: window.SIGNALWIRE_TOKEN,
            rootElement: document.getElementById('videoContainer'),
        });
        
        console.log('✅ Client created successfully');
        
        // Go online with incoming call handlers
        console.log('🌐 Agent going online...');
        await client.online({
            incomingCallHandlers: {
                all: handleIncomingCall
            }
        });
        
        // Update UI to show we're connected
        updateConnectionStatus(true);
        console.log('✅ Agent', window.AGENT_NAME, 'connected to SignalWire!');
        
        // Enable the call button
        callButton.disabled = false;
        
        // Log connection info
        console.log('📊 Agent Connection Info:', {
            agentId: window.AGENT_ID,
            agentName: window.AGENT_NAME,
            subscriberId: window.SUBSCRIBER_ID,
            status: 'online'
        });
        
        // Update agent roster periodically
        updateAgentRoster();
        setInterval(updateAgentRoster, 30000); // Every 30 seconds
        
    } catch (error) {
        console.error('❌ Failed to connect:', error);
        showError('Failed to connect to SignalWire. Check your credentials.');
        updateConnectionStatus(false);
    }
});

/**
 * Handle incoming calls - Module 2 shows caller agent identity
 */
async function handleIncomingCall(notification) {
    console.log('📞 Incoming call notification:', notification);
    
    // Extract caller information
    const callerId = notification.invite?.details?.caller_id_name || 
                    notification.invite?.details?.caller_id_number || 
                    'Unknown';
    
    console.log('📥 Incoming call from:', callerId);
    
    // In Module 2, we'll show the notification UI but auto-reject
    // Module 3 will add actual Accept/Reject functionality
    if (notification.invite) {
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('📞 INCOMING CALL FROM:', callerId);
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('ℹ️  Module 2 Learning Focus: Agent Identity & Outbound Calls');
        console.log('🔜 Module 3 will add: Accept/Reject UI for incoming calls');
        console.log('🚫 Auto-rejecting in 5 seconds...');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        // Show the incoming call notification UI
        const notificationElement = document.getElementById('incomingCallNotification');
        const callerNameElement = document.getElementById('incomingCallerName');
        
        if (notificationElement && callerNameElement) {
            callerNameElement.textContent = callerId;
            notificationElement.style.display = 'block';
            
            // Auto-hide and reject after 5 seconds
            setTimeout(async () => {
                notificationElement.style.display = 'none';
                await notification.invite.reject();
                console.log('✅ Call auto-rejected (Module 3 will allow accepting)');
            }, 5000);
        } else {
            // Fallback if UI elements don't exist
            await notification.invite.reject();
            showError(`📞 Incoming call from ${callerId} - Feature coming in Module 3!`, 5000);
        }
    }
}

/**
 * Make an outbound call - Module 2 supports agent-to-agent calling
 */
async function makeCall() {
    const destination = destinationInput.value.trim();
    
    if (!destination) {
        showError('Please enter an agent ID or phone number');
        return;
    }
    
    console.log('📞 Starting call from', window.AGENT_NAME, 'to:', destination);
    
    try {
        hideError();
        
        // Determine if this is an agent call or PSTN call
        const isAgentCall = isAgentId(destination);
        
        let callOptions;
        
        if (isAgentCall) {
            // Agent-to-agent call
            console.log('🤝 Making agent-to-agent call to:', destination);
            callOptions = {
                to: destination, // Direct agent reference
                audio: true,
                video: false,
                caller_id_name: window.AGENT_NAME, // Identify ourselves
            };
        } else {
            // PSTN call (phone number)
            console.log('📱 Making PSTN call to:', destination);
            callOptions = {
                to: '/private/call-pstn',
                userVariables: {
                    destination_number: destination
                },
                audio: true,
                video: false,
                caller_id_name: window.AGENT_NAME,
            };
        }
        
        console.log('📤 Call options:', callOptions);
        
        // Initiate the call
        currentCall = await client.dial(callOptions);
        
        // Set up call event handlers
        setupCallEventHandlers(currentCall);
        
        // Start the call
        await currentCall.start();
        
        // Update UI for active call
        callButton.style.display = 'none';
        hangupButton.style.display = 'block';
        destinationInput.disabled = true;
        
        console.log('✅ Call started successfully');
        
    } catch (error) {
        console.error('❌ Call failed:', error);
        showError('Failed to start call: ' + error.message);
        resetCallUI();
    }
}

/**
 * Check if destination is an agent ID
 */
function isAgentId(destination) {
    // Simple check: agent IDs don't start with + or digits
    // In production, you'd check against the actual agent roster
    const agentIds = ['alice', 'bob', 'charlie', 'diana'];
    return agentIds.includes(destination.toLowerCase());
}

/**
 * Hang up the current call
 */
async function hangupCall() {
    console.log('📴 Agent', window.AGENT_NAME, 'hanging up call...');
    
    if (currentCall) {
        try {
            await currentCall.hangup();
            console.log('✅ Call ended');
        } catch (error) {
            console.error('❌ Error hanging up:', error);
        }
    }
    
    resetCallUI();
}

/**
 * Set up event handlers for call lifecycle events
 */
function setupCallEventHandlers(call) {
    console.log('🎯 Setting up call event handlers...');
    
    // Call state changes
    call.on('state', (state) => {
        console.log('📊 Call state changed:', state);
        
        switch(state) {
            case 'ringing':
                console.log('🔔 Call is ringing...');
                break;
            case 'answered':
                console.log('✅ Call was answered!');
                startCallTimer();
                break;
            case 'ending':
                console.log('📴 Call is ending...');
                break;
        }
    });
    
    // Call ended
    call.on('destroy', () => {
        console.log('💀 Call destroyed - cleaning up');
        currentCall = null;
        stopCallTimer();
        resetCallUI();
    });
    
    // Call errors
    call.on('error', (error) => {
        console.error('❌ Call error:', error);
        showError('Call error: ' + error.message);
        stopCallTimer();
        resetCallUI();
    });
}

/**
 * Start the call duration timer
 */
function startCallTimer() {
    callStartTime = Date.now();
    callDuration.style.display = 'block';
    durationInterval = setInterval(updateDuration, 1000);
}

/**
 * Stop the call duration timer
 */
function stopCallTimer() {
    if (durationInterval) {
        clearInterval(durationInterval);
        durationInterval = null;
    }
    callStartTime = null;
    callDuration.style.display = 'none';
    durationDisplay.textContent = '00:00';
}

/**
 * Update the call duration display
 */
function updateDuration() {
    if (!callStartTime) return;
    
    const elapsed = Math.floor((Date.now() - callStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    durationDisplay.textContent = display;
}

/**
 * Update the connection status indicator
 */
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionIndicator.classList.remove('disconnected');
        connectionIndicator.classList.add('connected');
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionIndicator.classList.remove('connected');
        connectionIndicator.classList.add('disconnected');
    }
}

/**
 * Reset the UI after a call ends
 */
function resetCallUI() {
    callButton.style.display = 'block';
    hangupButton.style.display = 'none';
    destinationInput.disabled = false;
    currentCall = null;
}

/**
 * Show an error message to the user
 */
function showError(message, duration = 0) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    if (duration > 0) {
        setTimeout(hideError, duration);
    }
}

/**
 * Hide the error message
 */
function hideError() {
    errorMessage.style.display = 'none';
}

/**
 * Update the agent roster with current status
 */
async function updateAgentRoster() {
    try {
        const response = await fetch('/api/agents');
        const agents = await response.json();
        
        console.log('📋 Updating agent roster:', agents);
        
        // Update roster UI (if elements exist)
        agents.forEach(agent => {
            if (agent.id === window.AGENT_ID) return; // Skip self
            
            const agentElement = document.querySelector(`[data-agent-id="${agent.id}"]`);
            if (agentElement) {
                const statusDot = agentElement.querySelector('.status-dot');
                const statusText = agentElement.querySelector('.agent-item-status span:last-child');
                
                if (statusDot) {
                    statusDot.className = `status-dot ${agent.status}`;
                }
                if (statusText) {
                    statusText.textContent = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
                }
            }
        });
    } catch (error) {
        console.error('Failed to update agent roster:', error);
    }
}

// Make agent items clickable to dial
document.addEventListener('DOMContentLoaded', () => {
    const agentItems = document.querySelectorAll('.agent-item');
    agentItems.forEach(item => {
        item.style.cursor = 'pointer';
        item.addEventListener('click', () => {
            const agentId = item.getAttribute('data-agent-id');
            destinationInput.value = agentId;
            console.log('📝 Selected agent:', agentId);
        });
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter key to make call
    if (e.key === 'Enter' && document.activeElement === destinationInput) {
        if (callButton.style.display !== 'none' && !callButton.disabled) {
            makeCall();
        }
    }
    
    // Escape key to hang up
    if (e.key === 'Escape' && currentCall) {
        hangupCall();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    console.log('👋 Agent', window.AGENT_NAME, 'disconnecting...');
    if (client) {
        client.disconnect();
    }
});