var _client = null;
var _call = null;
var _invite = null;

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
  _client = await SignalWire.SignalWire({
    token: _token,
  });

  await _client.connect();

  _client.online({
    incomingCallHandlers: { all: _incomingCallNotification },
  });
  
  console.log('Connected to SignalWire');
}

async function _incomingCallNotification(notification) {
  console.log('Incoming call', notification.invite.details.caller_id_number);
  incomingCallFrom.innerHTML = notification.invite.details.caller_id_number;
  _invite = notification.invite;
  incomingCall.style.display = 'block';
  dialControls.style.display = 'none';
}

async function answerCall() {
  if (_invite) {
    _call = await _invite.accept();
    callControls.style.display = 'block';
    incomingCall.style.display = 'none';
    
    _call.on('destroy', function() {
      console.log('Call ended');
      _call = null;
    });
  }
}

async function hangupCall() {
  if (_call && _call.state !== 'destroy') {
    _call.hangup()
  }
  resetUI();
}

async function rejectCall() {
  if (_invite) {
    _invite.reject();
  }
  resetUI();
}

async function makeCall() {
  _call = await _client.dial({
    to: document.getElementById('destination').value,
    logLevel: 'debug',
    debug: { logWsTraffic: true },
  })

  _call.on('destroy', function() {
    console.log('Call ended');
    _call = null;
    resetUI();
  });

  await _call.start();
  callControls.style.display = 'block';
  dialControls.style.display = 'none';
}

function resetUI() {
  incomingCall.style.display = 'none';
  dialControls.style.display = 'block';
  callControls.style.display = 'none';
}

ready(async function() {
  console.log('ready');
  await connect();
});