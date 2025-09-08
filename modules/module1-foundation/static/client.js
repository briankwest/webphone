/**
 * Module 1: Foundation - Basic WebRTC Client
 * 
 * This is a minimal SignalWire WebRTC client that demonstrates:
 * 1. Connecting to SignalWire with a token
 * 2. Making outbound calls to phone numbers
 * 3. Handling call lifecycle events
 * 
 * Learning Focus: Understanding the basic WebRTC connection flow
 */

// Global variables for our SignalWire client and active call
let client = null;
let currentCall = null;

// UI Elements
const callButton = document.getElementById('callButton');
const hangupButton = document.getElementById('hangupButton');
const phoneNumberInput = document.getElementById('phoneNumber');
const connectionStatus = document.getElementById('connectionStatus');
const connectionIndicator = document.getElementById('connectionIndicator');
const errorMessage = document.getElementById('errorMessage');

/**
 * Initialize the SignalWire client when the page loads
 */
window.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Module 1: Initializing WebRTC client...');
    
    try {
        // Step 1: Create SignalWire client with our token
        console.log('📝 Creating SignalWire client with token...');
        client = await SignalWire.SignalWire({
            token: window.SIGNALWIRE_TOKEN,
            rootElement: document.getElementById('videoContainer'), // For video display
        });
        
        console.log('✅ Client created successfully');
        
        // Step 2: Go online to establish connection
        console.log('🌐 Going online...');
        // Pass options with basic incoming call handler (required by SDK)
        await client.online({
            incomingCallHandlers: {
                all: async (notification) => {
                    console.log('📞 Incoming call detected (Module 1 auto-rejects):', notification);
                    // Module 1 doesn't support incoming calls, so we auto-reject
                    if (notification.invite) {
                        await notification.invite.reject();
                    }
                }
            }
        });
        
        // Step 3: Update UI to show we're connected
        updateConnectionStatus(true);
        console.log('✅ Connected to SignalWire!');
        
        // Enable the call button now that we're connected
        callButton.disabled = false;
        
        // Log some helpful info for learning
        console.log('📊 Connection Info:', {
            subscriberId: window.SUBSCRIBER_ID,
            token: window.SIGNALWIRE_TOKEN.substring(0, 20) + '...',
            status: 'online'
        });
        
    } catch (error) {
        console.error('❌ Failed to connect:', error);
        showError('Failed to connect to SignalWire. Check your credentials.');
        updateConnectionStatus(false);
    }
});

/**
 * Make an outbound call to a phone number
 */
async function makeCall() {
    const phoneNumber = phoneNumberInput.value.trim();
    
    // Validate phone number
    if (!phoneNumber) {
        showError('Please enter a phone number');
        return;
    }
    
    console.log('📞 Starting call to:', phoneNumber);
    
    try {
        // Clear any previous errors
        hideError();
        
        // Create call options
        const callOptions = {
            to: '/private/call-pstn',  // SignalWire PSTN endpoint
            userVariables: {
                destination_number: phoneNumber
            },
            audio: true,
            video: false  // Module 1 focuses on audio calls
        };
        
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
        phoneNumberInput.disabled = true;
        
        console.log('✅ Call started successfully');
        
    } catch (error) {
        console.error('❌ Call failed:', error);
        showError('Failed to start call: ' + error.message);
        resetCallUI();
    }
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
        
        // Log state transitions for learning
        switch(state) {
            case 'ringing':
                console.log('🔔 Call is ringing...');
                break;
            case 'answered':
                console.log('✅ Call was answered!');
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
        resetCallUI();
    });
    
    // Call errors
    call.on('error', (error) => {
        console.error('❌ Call error:', error);
        showError('Call error: ' + error.message);
        resetCallUI();
    });
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
    phoneNumberInput.disabled = false;
    currentCall = null;
}

/**
 * Show an error message to the user
 */
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
}

/**
 * Hide the error message
 */
function hideError() {
    errorMessage.style.display = 'none';
}

// Add keyboard shortcuts for convenience
document.addEventListener('keydown', (e) => {
    // Enter key to make call when phone number is focused
    if (e.key === 'Enter' && document.activeElement === phoneNumberInput) {
        if (callButton.style.display !== 'none' && !callButton.disabled) {
            makeCall();
        }
    }
    
    // Escape key to hang up
    if (e.key === 'Escape' && currentCall) {
        hangupCall();
    }
});

// Log when user leaves the page (for debugging)
window.addEventListener('beforeunload', () => {
    console.log('👋 Page unloading - cleaning up...');
    if (client) {
        client.disconnect();
    }
});