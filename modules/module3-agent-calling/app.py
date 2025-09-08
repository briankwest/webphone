"""
Module 3: Agent-to-Agent Calling - Bidirectional WebRTC Phone
Enhanced Flask application with bidirectional calling, call state management,
and incoming call handling.
"""

import os
import json
from flask import Flask, render_template, jsonify, request, redirect, url_for, session
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'module2-dev-secret-key-change-in-production')

# Load agent data
def load_agents():
    """Load agent configuration from JSON file"""
    with open('data/agents.json', 'r') as f:
        return json.load(f)['agents']

def get_agent_by_id(agent_id):
    """Get a specific agent by their ID"""
    agents = load_agents()
    return next((agent for agent in agents if agent['id'] == agent_id), None)

def get_signalwire_token(agent_reference):
    """
    Get a SignalWire token for a specific agent.
    Module 3 enables bidirectional agent-to-agent calling with call state management.
    """
    url = f"https://{os.environ.get('SIGNALWIRE_SPACE')}/api/fabric/subscribers/tokens"
    
    # Use agent ID as the reference
    payload = {'reference': agent_reference}
    
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
    """Redirect to login if not authenticated, otherwise show main interface"""
    if 'agent_id' not in session:
        return redirect(url_for('login'))
    
    agent = get_agent_by_id(session['agent_id'])
    if not agent:
        session.clear()
        return redirect(url_for('login'))
    
    # Get token for this agent
    token, subscriber_id = get_signalwire_token(agent['id'])
    
    if not token:
        return "Error: Could not get SignalWire token. Check your credentials.", 500
    
    # Get all agents for the roster
    all_agents = load_agents()
    
    return render_template('index.html', 
                         agent=agent,
                         token=token,
                         subscriber_id=subscriber_id,
                         agents=all_agents)

@app.route('/login')
def login():
    """Agent selection/login page"""
    agents = load_agents()
    return render_template('agent_login.html', agents=agents)

@app.route('/login/<agent_id>')
def login_as_agent(agent_id):
    """Log in as a specific agent"""
    agent = get_agent_by_id(agent_id)
    if not agent:
        return "Agent not found", 404
    
    # Store agent in session
    session['agent_id'] = agent_id
    session['agent_name'] = agent['name']
    session['login_time'] = datetime.now().isoformat()
    
    print(f"Agent {agent['name']} ({agent_id}) logged in")
    
    return redirect(url_for('index'))

@app.route('/logout')
def logout():
    """Log out the current agent"""
    if 'agent_name' in session:
        print(f"Agent {session['agent_name']} logged out")
    
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/agents')
def api_agents():
    """API endpoint to get all agents with their current status"""
    agents = load_agents()
    
    # In a real app, we'd check actual online status
    # For now, mark logged-in agent as online
    if 'agent_id' in session:
        for agent in agents:
            if agent['id'] == session['agent_id']:
                agent['status'] = 'online'
            else:
                # Simulate some agents being online
                agent['status'] = 'available' if agent['id'] in ['alice', 'bob'] else 'offline'
    
    return jsonify(agents)

@app.route('/api/agent/status', methods=['POST'])
def update_agent_status():
    """Update an agent's status"""
    if 'agent_id' not in session:
        return jsonify({'error': 'Not authenticated'}), 401
    
    new_status = request.json.get('status', 'available')
    
    # In a real app, this would update a database
    # For demo, we just acknowledge the change
    print(f"Agent {session['agent_id']} status changed to: {new_status}")
    
    return jsonify({
        'agent_id': session['agent_id'],
        'status': new_status,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "module": "module2-agent-identity",
        "features": ["multi-agent", "agent-login", "agent-roster"],
        "agents_loaded": len(load_agents())
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 3000))
    print(f"Module 3: Agent-to-Agent Calling - Starting on port {port}")
    print("Features: Multi-agent support, login system, agent roster")
    print(f"Available agents: {', '.join([a['id'] for a in load_agents()])}")
    app.run(host='0.0.0.0', port=port, debug=True)