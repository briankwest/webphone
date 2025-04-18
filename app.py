import os
from flask import Flask, render_template, request, jsonify
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv(override=True)

app = Flask(__name__, template_folder='templates', static_folder='static')

def api_request(endpoint, payload=None, method='POST'):
    """Make an authenticated request to the SignalWire API"""
    if payload is None:
        payload = {}
    
    url = f"https://{os.environ.get('SIGNALWIRE_SPACE')}{endpoint}"
    
    response = requests.post(
        url,
        json=payload,
        auth=(os.environ.get('SIGNALWIRE_PROJECT_KEY'), os.environ.get('SIGNALWIRE_TOKEN'))
    )
    
    if response.status_code >= 400:
        print(f"API Error: {response.status_code} - {response.text}")
    
    return response.json()

@app.route('/')
def index():
    reference = request.args.get('name', 'brian')
    result = api_request('/api/fabric/subscribers/tokens', {'reference': reference})
    subscriber_id = result.get('subscriber_id', '')
    token = result.get('token', '')
    
    if not token:
        print("Failed to get token from SignalWire API:", result)
    
    return render_template('index.html', subscriber_id=subscriber_id, token=token, reference=reference)

@app.route('/status')
def status():
    """Simple API endpoint to check server status"""
    return jsonify({
        "status": "running",
        "service": "SignalWire Call Fabric Client"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True) 