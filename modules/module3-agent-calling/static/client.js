/**
 * Module 3: Agent-to-Agent Calling - Full Bidirectional Communication
 * 
 * This module adds complete incoming call handling:
 * 1. Accept/Reject UI for incoming calls
 * 2. Call state management and indicators
 * 3. Quick call buttons in agent roster
 * 4. Agent status management
 * 5. Visual call flow indicators
 * 
 * Learning Focus: Building production-ready P2P communication
 */

// Global variables
let client = null;
let currentCall = null;
let incomingInvite = null;
let callStartTime = null;
let durationInterval = null;
let callState = 'idle'; // idle, ringing, connecting, connected, ending

// UI Elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const destinationInput = document.getElementById('destination');
const connectionStatus = document.getElementById('connectionStatus');
const connectionIndicator = document.getElementById('connectionIndicator');
const errorMessage = document.getElementById('errorMessage');
const callDuration = document.getElementById('callDuration');
const durationDisplay = document.getElementById('durationDisplay');
const currentCallStateElement = document.getElementById('currentCallState');

// Incoming call modal elements
const incomingCallModal = document.getElementById('incomingCallModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const incomingCallerName = document.getElementById('incomingCallerName');
const incomingCallerAvatar = document.getElementById('incomingCallerAvatar');

// Call state indicator
const callStateIndicator = document.getElementById('callStateIndicator');
const callStateText = document.getElementById('callStateText');

/**
 * Initialize the SignalWire client with full calling capabilities
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Module 3: Initializing full bidirectional calling for:', window.AGENT_NAME);
    console.log('📌 Agent ID:', window.AGENT_ID);
    
    try {
        // Create SignalWire client
        console.log('📝 Creating SignalWire client...');
        client = await SignalWire.SignalWire({
            token: window.SIGNALWIRE_TOKEN,
            rootElement: document.getElementById('videoContainer'),
        });
        
        console.log('✅ Client created successfully');
        
        // Go online with incoming call handlers
        console.log('🌐 Agent going online with call handlers...');
        await client.online({
            incomingCallHandlers: {
                all: handleIncomingCall
            }
        });
        
        // Update UI
        updateConnectionStatus(true);
        updateCallState('idle');
        console.log('✅ Agent', window.AGENT_NAME, 'ready for bidirectional calling!');
        
        // Enable call button
        callButton.disabled = false;
        
        // Initialize agent status handlers
        initializeAgentStatus();
        
        // Update agent roster
        updateAgentRoster();
        setInterval(updateAgentRoster, 30000);
        
    } catch (error) {
        console.error('❌ Failed to connect:', error);
        showError('Failed to connect to SignalWire. Check your credentials.');
        updateConnectionStatus(false);
    }
});

/**
 * Handle incoming calls - Module 3 implements full accept/reject UI
 */
async function handleIncomingCall(notification) {
    console.log('📞 INCOMING CALL!', notification);
    
    // Extract caller information - check multiple possible locations
    let callerId = notification.invite?.details?.caller_id_number ||
                   notification.invite?.details?.caller_id_name ||
                   notification.invite?.userVariables?.caller_name ||
                   notification.invite?.userVariables?.caller_id ||
                   notification.invite?.callerName ||
                   notification.invite?.callerNumber ||
                   notification.invite?.from ||
                   notification.caller_id_name ||
                   notification.caller_id_number ||
                   notification.from ||
                   'Unknown';
    
    // Clean up the caller ID format
    if (typeof callerId === 'string') {
        // Handle "subscriber://alice" format
        if (callerId.startsWith('subscriber://')) {
            callerId = callerId.replace('subscriber://', '');
        }
        // Handle "/private/alice" format
        else if (callerId.startsWith('/private/')) {
            callerId = callerId.replace('/private/', '');
        }
        // Handle "_undef_" case - try to extract from other fields
        else if (callerId === '_undef_' && notification.invite?.details?.caller_id_number) {
            const altCallerId = notification.invite.details.caller_id_number;
            if (altCallerId.startsWith('subscriber://')) {
                callerId = altCallerId.replace('subscriber://', '');
            }
        }
    }
    
    console.log('📥 Incoming call from:', callerId);
    console.log('📋 Full notification object:', JSON.stringify(notification, null, 2));
    
    // Store the invite for accept/reject
    incomingInvite = notification.invite;
    
    if (incomingInvite) {
        // Update call state
        updateCallState('ringing');
        
        // Show incoming call modal
        showIncomingCallModal(callerId);
        
        // Play ringtone (simulated with console log)
        console.log('🔔 Playing ringtone...');
        playRingtone();
    }
}

/**
 * Show the incoming call modal
 */
function showIncomingCallModal(callerId) {
    // Update modal with caller info
    incomingCallerName.textContent = callerId;
    
    // Try to find agent avatar
    const agentItem = document.querySelector(`[data-agent-id="${callerId}"]`);
    if (agentItem) {
        const avatar = agentItem.querySelector('.agent-item-avatar');
        if (avatar) {
            incomingCallerAvatar.textContent = avatar.textContent;
        }
    }
    
    // Show modal with animation
    modalBackdrop.style.display = 'block';
    incomingCallModal.style.display = 'block';
    incomingCallModal.classList.add('ringing');
    
    console.log('📱 Showing incoming call UI for:', callerId);
}

/**
 * Hide the incoming call modal
 */
function hideIncomingCallModal() {
    modalBackdrop.style.display = 'none';
    incomingCallModal.style.display = 'none';
    incomingCallModal.classList.remove('ringing');
    stopRingtone();
}

/**
 * Answer an incoming call
 */
async function answerCall() {
    console.log('✅ Answering call...');
    
    if (!incomingInvite) {
        console.error('No incoming call to answer');
        return;
    }
    
    try {
        // Hide modal
        hideIncomingCallModal();
        
        // Update state
        updateCallState('connecting');
        
        // Accept the call
        currentCall = await incomingInvite.accept({
            rootElement: document.getElementById('videoContainer')
        });
        
        // Set up call event handlers
        setupCallEventHandlers(currentCall);
        
        // Update UI
        callButton.style.display = 'none';
        hangupButton.style.display = 'block';
        destinationInput.disabled = true;
        
        console.log('✅ Call answered successfully');
        
    } catch (error) {
        console.error('❌ Failed to answer call:', error);
        showError('Failed to answer call: ' + error.message);
        updateCallState('idle');
        resetCallUI();
    }
    
    incomingInvite = null;
}

/**
 * Reject an incoming call
 */
async function rejectCall() {
    console.log('❌ Rejecting call...');
    
    if (!incomingInvite) {
        console.error('No incoming call to reject');
        return;
    }
    
    try {
        await incomingInvite.reject();
        console.log('✅ Call rejected');
    } catch (error) {
        console.error('❌ Error rejecting call:', error);
    }
    
    hideIncomingCallModal();
    updateCallState('idle');
    incomingInvite = null;
}

/**
 * Make an outbound call
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
        updateCallState('connecting');
        
        // Determine if this is an agent call or PSTN call
        const isAgentCall = isAgentId(destination);
        
        let callOptions;
        
        if (isAgentCall) {
            console.log('🤝 Making agent-to-agent call to:', destination);
            callOptions = {
                to: `/private/${destination}`, // Use /private/[agent-name] format
                audio: true,
                video: false,
                userVariables: {
                    caller_name: window.AGENT_NAME,
                    caller_id: window.AGENT_ID
                }
            };
        } else {
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
        
        // Initiate the call
        currentCall = await client.dial(callOptions);
        
        // Set up call event handlers
        setupCallEventHandlers(currentCall);
        
        // Start the call
        await currentCall.start();
        
        // Update UI
        callButton.style.display = 'none';
        hangupButton.style.display = 'block';
        destinationInput.disabled = true;
        
        console.log('✅ Call initiated successfully');
        
    } catch (error) {
        console.error('❌ Call failed:', error);
        showError('Failed to start call: ' + error.message);
        updateCallState('idle');
        resetCallUI();
    }
}

/**
 * Quick call function for roster buttons
 */
function callAgent(agentId) {
    console.log('📞 Quick calling agent:', agentId);
    destinationInput.value = agentId;
    
    // Highlight the agent being called
    const agentItem = document.querySelector(`[data-agent-id="${agentId}"]`);
    if (agentItem) {
        agentItem.classList.add('calling');
        setTimeout(() => agentItem.classList.remove('calling'), 3000);
    }
    
    makeCall();
}

/**
 * Check if destination is an agent ID
 */
function isAgentId(destination) {
    const agentIds = ['alice', 'bob', 'charlie', 'diana'];
    return agentIds.includes(destination.toLowerCase());
}

/**
 * Hang up the current call
 */
async function hangupCall() {
    console.log('📴 Hanging up call...');
    
    if (currentCall) {
        try {
            await currentCall.hangup();
            console.log('✅ Call ended');
        } catch (error) {
            console.error('❌ Error hanging up:', error);
        }
    }
    
    updateCallState('idle');
    resetCallUI();
}

/**
 * Set up event handlers for call lifecycle
 */
function setupCallEventHandlers(call) {
    console.log('🎯 Setting up call event handlers...');
    
    call.on('state', (state) => {
        console.log('📊 Call state changed:', state);
        
        switch(state) {
            case 'ringing':
                updateCallState('ringing');
                break;
            case 'answered':
                updateCallState('connected');
                startCallTimer();
                break;
            case 'ending':
                updateCallState('ending');
                break;
        }
    });
    
    call.on('destroy', () => {
        console.log('💀 Call destroyed');
        currentCall = null;
        stopCallTimer();
        updateCallState('idle');
        resetCallUI();
    });
    
    call.on('error', (error) => {
        console.error('❌ Call error:', error);
        showError('Call error: ' + error.message);
        stopCallTimer();
        updateCallState('idle');
        resetCallUI();
    });
}

/**
 * Update the call state throughout the UI
 */
function updateCallState(newState) {
    callState = newState;
    
    // Define state labels
    const stateLabels = {
        'idle': 'Ready',
        'ringing': '🔔 Ringing',
        'connecting': '🔄 Connecting',
        'connected': '✅ Connected',
        'ending': '📴 Ending'
    };
    
    // Update status bar
    if (currentCallStateElement) {
        currentCallStateElement.textContent = stateLabels[newState] || newState;
    }
    
    // Update call state indicator
    if (callStateIndicator && callStateText) {
        if (newState !== 'idle') {
            callStateIndicator.classList.add('active');
            callStateIndicator.className = `call-state-indicator active ${newState}`;
            callStateText.textContent = stateLabels[newState] || newState;
        } else {
            callStateIndicator.classList.remove('active');
        }
    }
    
    console.log('📊 Call state updated to:', newState);
}

/**
 * Initialize agent status handlers
 */
function initializeAgentStatus() {
    const statusOptions = document.querySelectorAll('.status-option');
    statusOptions.forEach(option => {
        option.addEventListener('click', async () => {
            const newStatus = option.getAttribute('data-status');
            
            // Update UI
            statusOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            // Send status update to server
            try {
                await fetch('/api/agent/status', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: newStatus })
                });
                console.log('✅ Status updated to:', newStatus);
            } catch (error) {
                console.error('Failed to update status:', error);
            }
        });
    });
}

/**
 * Simulated ringtone functions
 */
function playRingtone() {
    // In production, you'd play an actual audio file
    console.log('🔊 Ringtone: Ring ring... Ring ring...');
}

function stopRingtone() {
    console.log('🔇 Ringtone stopped');
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
    incomingInvite = null;
    
    // Remove any agent highlighting
    document.querySelectorAll('.agent-item').forEach(item => {
        item.classList.remove('calling', 'in-call');
    });
}

/**
 * Show an error message
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
 * Update the agent roster
 */
async function updateAgentRoster() {
    try {
        const response = await fetch('/api/agents');
        const agents = await response.json();
        
        agents.forEach(agent => {
            if (agent.id === window.AGENT_ID) return;
            
            const agentElement = document.querySelector(`[data-agent-id="${agent.id}"]`);
            if (agentElement) {
                const statusDot = agentElement.querySelector('.status-dot');
                const statusText = agentElement.querySelector('.status-text');
                const callBtn = agentElement.querySelector('.call-agent-btn');
                
                if (statusDot) {
                    statusDot.className = `status-dot ${agent.status}`;
                }
                if (statusText) {
                    statusText.textContent = agent.status.charAt(0).toUpperCase() + agent.status.slice(1);
                }
                if (callBtn) {
                    callBtn.disabled = agent.status === 'offline';
                }
            }
        });
    } catch (error) {
        console.error('Failed to update agent roster:', error);
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Enter to make call
    if (e.key === 'Enter' && document.activeElement === destinationInput) {
        if (callButton.style.display !== 'none' && !callButton.disabled) {
            makeCall();
        }
    }
    
    // Escape to hang up or reject
    if (e.key === 'Escape') {
        if (currentCall) {
            hangupCall();
        } else if (incomingInvite) {
            rejectCall();
        }
    }
    
    // Space to answer incoming call
    if (e.key === ' ' && incomingInvite) {
        e.preventDefault();
        answerCall();
    }
});

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    console.log('👋 Agent', window.AGENT_NAME, 'going offline...');
    if (client) {
        client.disconnect();
    }
});