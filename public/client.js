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

  _client.online({
    incomingCallHandlers: { all: _incomingCallNotification },
  });

  await _client.connect();
  console.log('Connected to SignalWire');
}

async function _incomingCallNotification(notification) {
  console.log('Incoming call');
  _invite = notification.invite;
}

async function answerCall() {
  if (_invite) {
    _call = await _invite.accept({
      rootElement: document.getElementById('rootElement'),
    });
    
    _call.on('destroy', function() {
      console.log('Call ended');
      _call = null;
    });
  }
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
  });

  await _call.start();
}

ready(async function() {
  console.log('ready');
  await connect();
});