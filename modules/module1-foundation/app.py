"""
Module 1: Foundation - Basic WebRTC Phone
A minimal Flask application that demonstrates SignalWire token generation
and basic WebRTC connectivity.
"""

import os
from flask import Flask, render_template, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

def get_signalwire_token():
    """
    Get a SignalWire token for WebRTC authentication.
    In Module 1, we use a fixed reference 'user1' for simplicity.
    """
    # SignalWire API endpoint for token generation
    url = f"https://{os.environ.get('SIGNALWIRE_SPACE')}/api/fabric/subscribers/tokens"
    
    # Fixed user reference for Module 1
    payload = {'reference': 'user1'}
    
    # Make authenticated request to SignalWire
    response = requests.post(
        url,
        json=payload,
        auth=(
            os.environ.get('SIGNALWIRE_PROJECT_KEY'),
            os.environ.get('SIGNALWIRE_TOKEN')
        )
    )
    
    if response.status_code >= 400:
        print(f"API Error: {response.status_code} - {response.text}")
        return None, None
    
    data = response.json()
    return data.get('token', ''), data.get('subscriber_id', '')

@app.route('/')
def index():
    """Main page with WebRTC phone interface"""
    token, subscriber_id = get_signalwire_token()
    
    if not token:
        return "Error: Could not get SignalWire token. Check your credentials.", 500
    
    return render_template('index.html', token=token, subscriber_id=subscriber_id)

@app.route('/health')
def health():
    """Health check endpoint for monitoring"""
    return jsonify({
        "status": "healthy",
        "module": "module1-foundation"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"Module 1 Foundation - Starting on port {port}")
    print("This is the basic WebRTC phone with single user support")
    app.run(host='0.0.0.0', port=port, debug=True)