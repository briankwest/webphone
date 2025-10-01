import os
import json
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
    
    if method.upper() == 'GET':
        response = requests.get(
            url,
            auth=(os.environ.get('SIGNALWIRE_PROJECT_KEY'), os.environ.get('SIGNALWIRE_TOKEN'))
        )
    else:
        response = requests.post(
            url,
            json=payload,
            auth=(os.environ.get('SIGNALWIRE_PROJECT_KEY'), os.environ.get('SIGNALWIRE_TOKEN'))
        )
    
    if response.status_code >= 400:
        print(f"API Error: {response.status_code} - {response.text}")
    
    return response.json()

def list_swml_scripts():
    """List all SWML scripts"""
    try:
        return api_request('/api/fabric/resources/swml_scripts', method='GET')
    except Exception as e:
        print(f"Error listing SWML scripts: {e}")
        return None

def check_swml_script_exists(display_name):
    """Check if a SWML script with the given display_name exists"""
    scripts = list_swml_scripts()
    if not scripts or 'data' not in scripts:
        return False
    
    for script in scripts['data']:
        if script.get('display_name') == display_name:
            return True
    return False

def create_swml_script(name, content):
    """Create a new SWML script"""
    payload = {
        'name': name,
        'contents': content
    }
    try:
        return api_request('/api/fabric/resources/swml_scripts', payload)
    except Exception as e:
        print(f"Error creating SWML script: {e}")
        return None

def ensure_call_pstn_script():
    """Ensure 'call pstn' SWML script exists, create if it doesn't"""
    script_name = "call pstn"
    
    if check_swml_script_exists(script_name):
        print(f"SWML script '{script_name}' already exists")
        return True
    
    try:
        with open('example_outbound_swml.json', 'r') as f:
            swml_content = json.load(f)
        
        result = create_swml_script(script_name, swml_content)
        if result:
            print(f"Successfully created SWML script '{script_name}'")
            return True
        else:
            print(f"Failed to create SWML script '{script_name}'")
            return False
    except FileNotFoundError:
        print("Error: example_outbound_swml.json file not found")
        return False
    except json.JSONDecodeError:
        print("Error: Invalid JSON in example_outbound_swml.json")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False

@app.route('/')
def index():
    ensure_call_pstn_script()
    
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

@app.route('/ensure-swml-script')
def ensure_swml_script_endpoint():
    """API endpoint to manually trigger SWML script creation check"""
    success = ensure_call_pstn_script()
    return jsonify({
        "success": success,
        "message": "SWML script check completed"
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    app.run(host='0.0.0.0', port=port, debug=True) 
