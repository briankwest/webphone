/**
 * Module 4: Two-Agent Demo Client
 * Simplified WebRTC client for the demo frames with cross-frame communication
 */

// Global variables
let client = null;
let currentCall = null;
let incomingInvite = null;
let callStartTime = null;
let durationInterval = null;
let callState = 'idle';

// UI Elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const destinationInput = document.getElementById('destination');
const connectionStatus = document.getElementById('connectionStatus');
const connectionDot = document.getElementById('connectionDot');
const callStatusPanel = document.getElementById('callStatusPanel');
const callStatusText = document.getElementById('callStatusText');
const callDuration = document.getElementById('callDuration');
const durationDisplay = document.getElementById('durationDisplay');

// Incoming call modal
const incomingCallModal = document.getElementById('incomingCallModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const incomingCallerName = document.getElementById('incomingCallerName');

/**
 * Initialize the SignalWire client
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log(`🚀 Demo Frame: Initializing ${window.AGENT_NAME}`);
    
    try {
        // Create SignalWire client
        client = await SignalWire.SignalWire({
            token: window.SIGNALWIRE_TOKEN
        });
        
        console.log('✅ Client created');
        
        // Go online with incoming call handlers
        await client.online({
            incomingCallHandlers: {
                all: handleIncomingCall
            }
        });
        
        // Update UI
        updateConnectionStatus(true);
        updateCallState('idle');
        console.log(`✅ ${window.AGENT_NAME} is online!`);
        
        // Notify via localStorage for cross-tab communication
        if (window.AGENT_ID) {
            localStorage.setItem('agentActivity', JSON.stringify({
                message: `${window.AGENT_NAME} is online`,
                agent: window.AGENT_ID,
                timestamp: Date.now()
            }));
        }
        
        // Enable call button
        callButton.disabled = false;
        
        // Notify parent frame that we're ready
        if (window.IS_DEMO_FRAME && window.parent) {
            window.parent.postMessage({
                type: 'agentReady',
                agentId: window.AGENT_ID,
                agentName: window.AGENT_NAME
            }, '*');
        }
        
    } catch (error) {
        console.error('❌ Failed to connect:', error);
        updateConnectionStatus(false);
    }
});

/**
 * Handle incoming calls
 */
async function handleIncomingCall(notification) {
    console.log('📞 Incoming call!', notification);
    
    // Extract caller information
    let callerId = notification.invite?.details?.caller_id_number ||
                   notification.invite?.details?.caller_id_name ||
                   'Unknown';
    
    // Clean up caller ID format
    if (typeof callerId === 'string') {
        if (callerId.startsWith('subscriber://')) {
            callerId = callerId.replace('subscriber://', '');
        } else if (callerId.startsWith('/private/')) {
            callerId = callerId.replace('/private/', '');
        }
    }
    
    console.log('📥 Call from:', callerId);
    
    // Store the invite
    incomingInvite = notification.invite;
    
    if (incomingInvite) {
        updateCallState('ringing');
        showIncomingCallModal(callerId);
        
        // Notify parent frame
        notifyParent('incomingCall', { from: callerId });
    }
}

/**
 * Show incoming call modal
 */
function showIncomingCallModal(callerId) {
    incomingCallerName.textContent = callerId;
    modalBackdrop.classList.add('show');
    incomingCallModal.classList.add('show');
}

/**
 * Hide incoming call modal
 */
function hideIncomingCallModal() {
    modalBackdrop.classList.remove('show');
    incomingCallModal.classList.remove('show');
}

/**
 * Answer incoming call
 */
async function answerCall() {
    console.log('✅ Answering call...');
    
    if (!incomingInvite) return;
    
    try {
        hideIncomingCallModal();
        updateCallState('connecting');
        
        currentCall = await incomingInvite.accept({});
        setupCallEventHandlers(currentCall);
        
        callButton.style.display = 'none';
        hangupButton.style.display = 'block';
        destinationInput.disabled = true;
        
        console.log('✅ Call answered');
        notifyParent('callAnswered', {});
        
    } catch (error) {
        console.error('❌ Failed to answer:', error);
        updateCallState('idle');
        resetCallUI();
    }
    
    incomingInvite = null;
}

/**
 * Reject incoming call
 */
async function rejectCall() {
    console.log('❌ Rejecting call...');
    
    if (!incomingInvite) return;
    
    try {
        await incomingInvite.reject();
        console.log('✅ Call rejected');
        notifyParent('callRejected', {});
    } catch (error) {
        console.error('❌ Error rejecting:', error);
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
    
    if (!destination) return;
    
    console.log(`📞 ${window.AGENT_NAME} calling ${destination}...`);
    
    try {
        updateCallState('connecting');
        
        // Determine call type
        const isAgentCall = ['alice', 'bob', 'charlie', 'diana'].includes(destination.toLowerCase());
        
        let callOptions;
        if (isAgentCall) {
            callOptions = {
                to: `/private/${destination}`,
                audio: true,
                video: false
            };
        } else {
            callOptions = {
                to: '/private/call-pstn',
                userVariables: {
                    destination_number: destination
                },
                audio: true,
                video: false
            };
        }
        
        currentCall = await client.dial(callOptions);
        setupCallEventHandlers(currentCall);
        await currentCall.start();
        
        callButton.style.display = 'none';
        hangupButton.style.display = 'block';
        destinationInput.disabled = true;
        
        console.log('✅ Call initiated');
        notifyParent('callStarted', { to: destination });
        
    } catch (error) {
        console.error('❌ Call failed:', error);
        updateCallState('idle');
        resetCallUI();
    }
}

/**
 * Quick dial function
 */
function quickDial(agentId) {
    destinationInput.value = agentId;
    makeCall();
}

/**
 * Hang up current call
 */
async function hangupCall() {
    console.log('📴 Hanging up...');
    
    if (currentCall) {
        try {
            await currentCall.hangup();
            console.log('✅ Call ended');
            notifyParent('callEnded', {});
        } catch (error) {
            console.error('❌ Error hanging up:', error);
        }
    }
    
    updateCallState('idle');
    resetCallUI();
}

/**
 * Set up call event handlers
 */
function setupCallEventHandlers(call) {
    call.on('state', (state) => {
        console.log('📊 Call state:', state);
        
        if (state === 'answered') {
            updateCallState('connected');
            startCallTimer();
            notifyParent('callConnected', {});
        } else if (state === 'ringing') {
            updateCallState('ringing');
        } else if (state === 'ending') {
            updateCallState('ending');
        }
    });
    
    call.on('destroy', () => {
        console.log('💀 Call destroyed');
        currentCall = null;
        stopCallTimer();
        updateCallState('idle');
        resetCallUI();
        notifyParent('callDestroyed', {});
    });
    
    call.on('error', (error) => {
        console.error('❌ Call error:', error);
        stopCallTimer();
        updateCallState('idle');
        resetCallUI();
    });
}

/**
 * Update call state
 */
function updateCallState(newState) {
    callState = newState;
    
    const stateLabels = {
        'idle': 'Ready',
        'ringing': '🔔 Ringing',
        'connecting': '🔄 Connecting',
        'connected': '✅ Connected',
        'ending': '📴 Ending'
    };
    
    callStatusText.textContent = stateLabels[newState] || newState;
    callStatusPanel.className = `call-status ${newState}`;
    
    // Notify parent frame
    notifyParent('callState', { state: newState });
    
    // Cross-tab notification
    if (window.AGENT_ID) {
        const messages = {
            'ringing': `${window.AGENT_NAME} has incoming call`,
            'connecting': `${window.AGENT_NAME} is connecting`,
            'connected': `${window.AGENT_NAME} is on a call`,
            'idle': `${window.AGENT_NAME} is available`
        };
        
        if (messages[newState]) {
            localStorage.setItem('agentActivity', JSON.stringify({
                message: messages[newState],
                agent: window.AGENT_ID,
                timestamp: Date.now()
            }));
        }
    }
}

/**
 * Start call timer
 */
function startCallTimer() {
    callStartTime = Date.now();
    callDuration.style.display = 'block';
    durationInterval = setInterval(updateDuration, 1000);
}

/**
 * Stop call timer
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
 * Update duration display
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
 * Update connection status
 */
function updateConnectionStatus(connected) {
    if (connected) {
        connectionStatus.textContent = 'Connected';
        connectionDot.classList.add('connected');
    } else {
        connectionStatus.textContent = 'Disconnected';
        connectionDot.classList.remove('connected');
    }
}

/**
 * Reset call UI
 */
function resetCallUI() {
    callButton.style.display = 'block';
    hangupButton.style.display = 'none';
    destinationInput.disabled = false;
    currentCall = null;
    incomingInvite = null;
}

/**
 * Notify parent frame of events
 */
function notifyParent(eventType, data) {
    if (window.IS_DEMO_FRAME && window.parent) {
        window.parent.postMessage({
            type: eventType,
            agentId: window.AGENT_ID,
            agentName: window.AGENT_NAME,
            ...data
        }, '*');
    }
}

/**
 * Listen for messages from parent frame
 */
window.addEventListener('message', (event) => {
    if (!window.IS_DEMO_FRAME) return;
    
    const { action, target } = event.data;
    
    console.log('📨 Received command:', action);
    
    switch (action) {
        case 'makeCall':
            if (target) {
                destinationInput.value = target;
            }
            makeCall();
            break;
            
        case 'answerCall':
            if (incomingInvite) {
                answerCall();
            }
            break;
            
        case 'rejectCall':
            if (incomingInvite) {
                rejectCall();
            }
            break;
            
        case 'hangupCall':
            hangupCall();
            break;
    }
});

// Clean up on unload
window.addEventListener('beforeunload', () => {
    if (client) {
        client.disconnect();
    }
    
    // Clean up any active calls
    if (currentCall) {
        currentCall.hangup();
    }
});