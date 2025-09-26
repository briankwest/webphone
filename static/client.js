var _client = null;
var _call = null;
var _invite = null;
var _connected = false;

// Request permissions for audio/video devices
async function requestDevicePermissions(constraints = { audio: true, video: true }) {
  try {
    console.log('Requesting device permissions...');
    await SignalWire.WebRTC.requestPermissions(constraints);
    console.log('Device permissions granted');
    return true;
  } catch (error) {
    console.error('Failed to get device permissions:', error);
    return false;
  }
}

// Check current permission status
async function checkDevicePermissions() {
  try {
    const permissions = await SignalWire.WebRTC.checkPermissions();
    const hasCameraPermission = await SignalWire.WebRTC.checkCameraPermissions();
    const hasMicPermission = await SignalWire.WebRTC.checkMicrophonePermissions();

    console.log('Permission status:', {
      all: permissions,
      camera: hasCameraPermission,
      microphone: hasMicPermission
    });

    return { permissions, hasCameraPermission, hasMicPermission };
  } catch (error) {
    console.error('Error checking permissions:', error);
    return null;
  }
}

// Get available devices with automatic permission request
async function getDevicesWithPermissions() {
  try {
    const cameras = await SignalWire.WebRTC.getCameraDevicesWithPermissions();
    const microphones = await SignalWire.WebRTC.getMicrophoneDevicesWithPermissions();
    const speakers = await SignalWire.WebRTC.getSpeakerDevicesWithPermissions();

    console.log('Available devices:', {
      cameras: cameras.length,
      microphones: microphones.length,
      speakers: speakers.length
    });

    return { cameras, microphones, speakers };
  } catch (error) {
    console.error('Error getting devices:', error);
    return null;
  }
}

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
    // Request permissions before connecting
    const permissionsGranted = await requestDevicePermissions({ audio: true, video: true });

    if (!permissionsGranted) {
      console.warn('Device permissions not granted - connection may have limited functionality');
      // You might want to show a UI warning here
    }

    // Check and log current permissions
    await checkDevicePermissions();

    // Get available devices (this will also ensure permissions if not already granted)
    const devices = await getDevicesWithPermissions();
    if (devices) {
      console.log('Found devices:', devices);
    }

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

// Update UI permission status
async function updatePermissionUI() {
  try {
    const status = await checkDevicePermissions();
    const micStatus = document.getElementById('micStatus');
    const cameraStatus = document.getElementById('cameraStatus');

    if (status) {
      // Update microphone status
      if (micStatus) {
        if (status.hasMicPermission) {
          micStatus.className = 'badge bg-success';
          micStatus.textContent = '🎤 Microphone: Granted';
        } else {
          micStatus.className = 'badge bg-warning';
          micStatus.textContent = '🎤 Microphone: Denied';
        }
      }

      // Update camera status
      if (cameraStatus) {
        if (status.hasCameraPermission) {
          cameraStatus.className = 'badge bg-success';
          cameraStatus.textContent = '📹 Camera: Granted';
        } else {
          cameraStatus.className = 'badge bg-warning';
          cameraStatus.textContent = '📹 Camera: Denied';
        }
      }
    }
  } catch (error) {
    console.error('Error updating permission UI:', error);
  }
}

// Manual permission request from UI button
async function requestAndUpdatePermissions() {
  const granted = await requestDevicePermissions({ audio: true, video: true });
  await updatePermissionUI();

  if (granted) {
    const devices = await getDevicesWithPermissions();
    console.log('Updated device list:', devices);
  }
}

ready(async function() {
  console.log('ready');
  await connect();
  // Update permission UI after connection
  await updatePermissionUI();
}); 