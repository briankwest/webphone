/**
 * Module 4: Simple Two-Agent Client
 * Basic WebRTC client for teaching agent-to-agent calling
 */

let client = null;
let currentCall = null;
let token = null;

// UI Elements
const statusDiv = document.getElementById('status');
const callBtn = document.getElementById('call-btn');
const hangupBtn = document.getElementById('hangup-btn');
const answerBtn = document.getElementById('answer-btn');
const rejectBtn = document.getElementById('reject-btn');
const incomingCallDiv = document.getElementById('incoming-call');
const callerNameSpan = document.getElementById('caller-name');
const videoContainer = document.getElementById('video-container');

// Initialize when page loads
window.addEventListener('DOMContentLoaded', init);

async function init() {
    console.log(`Initializing ${window.AGENT_NAME}'s phone...`);
    updateStatus('Connecting...', 'disconnected');
    
    try {
        // Step 1: Get token from server
        const response = await fetch(`/api/token/${window.AGENT_ID}`);
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        token = data.token;
        console.log('Got token from server');
        
        // Step 2: Create SignalWire client
        client = await SignalWire.SignalWire({ token });
        console.log('Created SignalWire client');
        
        // Step 3: Set up call handlers and go online
        await client.online({
            incomingCallHandlers: {
                all: handleIncomingCall
            }
        });
        
        console.log(`${window.AGENT_NAME} is online!`);
        updateStatus('Connected - Ready for calls', 'connected');
        callBtn.disabled = false;
        
    } catch (error) {
        console.error('Failed to connect:', error);
        updateStatus('Connection failed', 'disconnected');
    }
}

// Handle incoming calls
async function handleIncomingCall(notification) {
    console.log('Incoming call:', notification);
    
    // Show incoming call UI
    const callerName = notification.from === 'alice' ? 'Alice' : 'Bob';
    callerNameSpan.textContent = callerName;
    incomingCallDiv.classList.add('show');
    updateStatus(`Incoming call from ${callerName}`, 'calling');
    
    // Store the call object
    currentCall = notification;
    
    // Set up answer/reject handlers
    answerBtn.onclick = async () => {
        console.log('Answering call...');
        incomingCallDiv.classList.remove('show');
        
        try {
            await currentCall.answer();
            updateStatus(`In call with ${callerName}`, 'incall');
            
            // Attach video if available
            currentCall.on('media.connected', (media) => {
                videoContainer.innerHTML = '';
                videoContainer.appendChild(media.element);
                videoContainer.classList.add('show');
            });
            
            // Handle call ending
            currentCall.on('destroy', () => {
                console.log('Call ended');
                endCall();
            });
            
            // Enable hangup button
            hangupBtn.disabled = false;
            callBtn.disabled = true;
            
        } catch (error) {
            console.error('Failed to answer:', error);
            updateStatus('Failed to answer call', 'connected');
        }
    };
    
    rejectBtn.onclick = () => {
        console.log('Rejecting call...');
        currentCall.reject();
        incomingCallDiv.classList.remove('show');
        updateStatus('Connected - Ready for calls', 'connected');
        currentCall = null;
    };
}

// Make an outgoing call
callBtn.onclick = async () => {
    console.log(`Calling ${window.OTHER_AGENT}...`);
    updateStatus(`Calling ${window.OTHER_AGENT}...`, 'calling');
    
    try {
        // Make call to the other agent
        currentCall = await client.dial({
            to: `/private/${window.OTHER_AGENT}`,
            audio: true,
            video: false
        });
        
        console.log('Call initiated');
        
        // Handle call events
        currentCall.on('answer', () => {
            console.log('Call answered');
            updateStatus(`In call with ${window.OTHER_AGENT}`, 'incall');
            hangupBtn.disabled = false;
            callBtn.disabled = true;
        });
        
        currentCall.on('media.connected', (media) => {
            videoContainer.innerHTML = '';
            videoContainer.appendChild(media.element);
            videoContainer.classList.add('show');
        });
        
        currentCall.on('destroy', () => {
            console.log('Call ended');
            endCall();
        });
        
    } catch (error) {
        console.error('Failed to make call:', error);
        updateStatus('Call failed', 'connected');
        currentCall = null;
    }
};

// Hang up the current call
hangupBtn.onclick = () => {
    if (currentCall) {
        console.log('Hanging up...');
        currentCall.hangup();
    }
};

// Clean up after call ends
function endCall() {
    currentCall = null;
    videoContainer.classList.remove('show');
    videoContainer.innerHTML = '';
    updateStatus('Connected - Ready for calls', 'connected');
    callBtn.disabled = false;
    hangupBtn.disabled = true;
    incomingCallDiv.classList.remove('show');
}

// Update status display
function updateStatus(text, className) {
    statusDiv.textContent = text;
    statusDiv.className = `status ${className}`;
}