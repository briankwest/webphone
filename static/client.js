var _client = null;
var _call = null;
var _invite = null;
var _connected = false;

function ready(callback) {
  if (document.readyState != 'loading') {
    callback();
  } else if (document.addEventListener) {
    document.addEventListener('DOMContentLoaded', callback);
  } else {
    document.attachEvent('onreadystatechange', function() {
      if (document.readyState != 'loading') {
        callback();
      }
    });
  }
}

async function connect() {
  try {
    // Get the root element for video display
    const rootElement = document.getElementById('rootElement');
    
    // Initialize the SignalWire client with the token
    const options = {
      token: _token
    };
    
    // Only add rootElement if it exists
    if (rootElement) {
      options.rootElement = rootElement;
    }
    
    _client = await SignalWire.SignalWire(options);

    // Set client to online to receive calls
    await _client.online({
      incomingCallHandlers: { all: _incomingCallNotification }
    });
    
    _connected = true;
    console.log('Connected to SignalWire');
  } catch (error) {
    console.error('Error connecting to SignalWire:', error);
  }
}

async function _incomingCallNotification(notification) {
  console.log('Incoming call notification:', notification);
  
  // Store the invite for later use (accept/reject)
  _invite = notification.invite;
  
  // Update UI to show incoming call
  const callerId = notification.invite?.details?.caller_id_number || 'Unknown';
  console.log('Incoming call from', callerId);
  
  // Check if elements exist before updating them
  const incomingCallFrom = document.getElementById('incomingCallFrom');
  const incomingCall = document.getElementById('incomingCall');
  const callButton = document.getElementById('callButton');
  
  if (incomingCallFrom) {
    incomingCallFrom.innerHTML = callerId;
  }
  
  if (incomingCall) {
    incomingCall.style.display = 'block';
  }
  
  if (callButton) {
    callButton.style.display = 'none';
  }
}

async function answerCall() {
  if (_invite) {
    try {
      // Get the root element
      const rootElement = document.getElementById('rootElement');
      
      // Options for accepting the call
      const options = {};
      if (rootElement) {
        options.rootElement = rootElement;
      }
      
      // Accept the call and get the call object
      _call = await _invite.accept(options);
      
      // Get UI elements
      const incomingCall = document.getElementById('incomingCall');
      const callButton = document.getElementById('callButton');
      const hangupButton = document.getElementById('hangupButton');
      
      // Update UI for active call (with null checks)
      if (incomingCall) incomingCall.style.display = 'none';
      if (callButton) callButton.style.display = 'none';
      if (hangupButton) hangupButton.style.display = 'inline-block';
      
      // Set up event handlers for call state changes
      _call.on('destroy', function() {
        console.log('Call ended');
        _call = null;
        resetUI();
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      resetUI();
    }
  }
}

async function hangupCall() {
  if (_call && _call.state !== 'destroy') {
    try {
      await _call.hangup();
    } catch (error) {
      console.error('Error hanging up call:', error);
    }
  }
  resetUI();
}

async function rejectCall() {
  if (_invite) {
    try {
      await _invite.reject();
    } catch (error) {
      console.error('Error rejecting call:', error);
    }
  }
  resetUI();
}

async function makeCall() {
  if (!_connected || !_client) {
    console.error('Not connected to SignalWire');
    return;
  }
  
  try {
    // Get destination and root element
    const destination = document.getElementById('destination')?.value || '/private/call-pstn';
    const destination_number = document.getElementById('destination_number')?.value || '+19184238080';
    const rootElement = document.getElementById('rootElement');
    
    // Create call options
    const options = {
      to: destination,
      audio: true,
      video: true,
      userVariables: {
        destination_number: destination_number
      }
    };
    
    // Only add rootElement if it exists
    if (rootElement) {
      options.rootElement = rootElement;
    }
    
    // Create a call to the destination
    _call = await _client.dial(options);

    // Set up event handlers for call state changes
    _call.on('destroy', function() {
      console.log('Call ended');
      _call = null;
      resetUI();
    });

    // Start the call (required per updated docs)
    await _call.start();
    
    // Get UI elements
    const callButton = document.getElementById('callButton');
    const hangupButton = document.getElementById('hangupButton');
    
    // Switch the Call button to Hangup button (with null checks)
    if (callButton) callButton.style.display = 'none';
    if (hangupButton) hangupButton.style.display = 'inline-block';
  } catch (error) {
    console.error('Error making call:', error);
    resetUI();
  }
}

function resetUI() {
  // Get UI elements
  const incomingCall = document.getElementById('incomingCall');
  const callButton = document.getElementById('callButton');
  const hangupButton = document.getElementById('hangupButton');
  
  // Reset UI with null checks
  if (incomingCall) incomingCall.style.display = 'none';
  if (callButton) callButton.style.display = 'inline-block';
  if (hangupButton) hangupButton.style.display = 'none';
}

ready(async function() {
  console.log('ready');
  await connect();
}); 