"""
Module 4: Two-Agent Demo - Cross-Browser Coordination
Demonstrates agent-to-agent calling using separate browser instances
to work around SignalWire SDK limitations.
"""

import os
from flask import Flask, render_template, jsonify, request, redirect, url_for, session
import requests
from dotenv import load_dotenv
from datetime import datetime

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'module4-demo-secret-key-change-in-production')

# Simple Flask app for Module 4 demo

# Default agents for Module 4
AGENTS = [
    {'id': 'alice', 'name': 'Alice Johnson', 'avatar': '👩‍💼', 'role': 'Sales', 'extension': '1001'},
    {'id': 'bob', 'name': 'Bob Smith', 'avatar': '👨‍💻', 'role': 'Support', 'extension': '1002'},
    {'id': 'charlie', 'name': 'Charlie Davis', 'avatar': '👨‍🔬', 'role': 'Engineering', 'extension': '1003'},
    {'id': 'diana', 'name': 'Diana Wilson', 'avatar': '👩‍🎨', 'role': 'Design', 'extension': '1004'}
]

def get_signalwire_token(reference_id):
    """Get a SignalWire token from the API"""
    space = os.environ.get('SIGNALWIRE_SPACE')
    project_key = os.environ.get('SIGNALWIRE_PROJECT_KEY')
    auth_token = os.environ.get('SIGNALWIRE_TOKEN')
    
    if not all([space, project_key, auth_token]):
        print("Error: Missing SignalWire credentials")
        print("Please set: SIGNALWIRE_PROJECT_KEY, SIGNALWIRE_TOKEN, and SIGNALWIRE_SPACE")
        return None
    
    # Request token from SignalWire API
    url = f"https://{space}/api/fabric/subscribers/tokens"
    
    headers = {
        'Content-Type': 'application/json'
    }
    
    auth = (project_key, auth_token)
    
    data = {
        'reference': reference_id
    }
    
    try:
        response = requests.post(url, json=data, auth=auth, headers=headers)
        if response.status_code == 200:
            return response.json().get('token')
        else:
            print(f"SignalWire API error: {response.status_code}")
            return None
    except Exception as e:
        print(f"Error getting token: {e}")
        return None

@app.route('/')
def index():
    """Root route - redirect to login picker"""
    return redirect(url_for('login'))

@app.route('/agent')
def agent():
    """Agent phone interface for logged-in agent"""
    if 'agent_id' not in session:
        return redirect(url_for('login'))
    
    agent_id = session['agent_id']
    agent_obj = next((a for a in AGENTS if a['id'] == agent_id), None)
    
    if not agent_obj:
        return redirect(url_for('login'))
    
    # Get token for this agent
    token = get_signalwire_token(agent_id)
    
    if token is None:
        return """
        <h1>Configuration Error</h1>
        <p>SignalWire credentials are not configured.</p>
        <p>Please set the following environment variables in your .env file:</p>
        <ul>
            <li>SIGNALWIRE_SPACE</li>
            <li>SIGNALWIRE_PROJECT_KEY</li>
            <li>SIGNALWIRE_TOKEN</li>
        </ul>
        <p>See .env.example for details.</p>
        """, 500
    
    return render_template('agent_frame.html',
                         agent=agent_obj,
                         agents=AGENTS,
                         token=token,
                         subscriber_id=agent_id)

@app.route('/demo')
def demo():
    """Two-agent demo coordinator interface"""
    return render_template('two_agents_demo.html', agents=AGENTS)

@app.route('/agent-frame/<agent_id>')
def agent_frame(agent_id):
    """Agent interface for iframe embedding in demo"""
    agent = next((a for a in AGENTS if a['id'] == agent_id), None)
    if not agent:
        return "Agent not found", 404
    
    # Get token for this agent
    token = get_signalwire_token(agent_id)
    
    if token is None:
        return "SignalWire configuration error", 500
    
    # Note: Using agent_frame.html which is designed for iframe embedding
    return render_template('agent_frame.html',
                         agent=agent,
                         agents=AGENTS,
                         token=token,
                         subscriber_id=agent_id,
                         is_demo_frame=True)


@app.route('/login')
def login():
    """Agent selection screen with auto-login support"""
    # Check if agent specified in query params
    agent_id = request.args.get('agent')
    if agent_id:
        agent = next((a for a in AGENTS if a['id'] == agent_id), None)
        if agent:
            # Auto-login as this agent
            session['agent_id'] = agent_id
            session['agent_name'] = agent['name']
            session['login_time'] = datetime.now().isoformat()
            
            return redirect(url_for('agent'))
    
    return render_template('agent_login.html', agents=AGENTS)

@app.route('/login/<agent_id>')
def login_as_agent(agent_id):
    """Log in as a specific agent"""
    agent = next((a for a in AGENTS if a['id'] == agent_id), None)
    if not agent:
        return "Agent not found", 404
    
    # Store agent in session
    session['agent_id'] = agent_id
    session['agent_name'] = agent['name']
    session['login_time'] = datetime.now().isoformat()
    
    print(f"Agent {agent['name']} ({agent_id}) logged in")
    
    return redirect(url_for('agent'))

@app.route('/logout')
def logout():
    """Log out the current agent"""
    if 'agent_id' in session:
        print(f"Agent {session.get('agent_name', 'Unknown')} logged out")
    
    session.clear()
    return redirect(url_for('login'))

@app.route('/api/token/<agent_id>')
def api_token(agent_id):
    """API endpoint to get token for an agent"""
    if agent_id not in [a['id'] for a in AGENTS]:
        return jsonify({'error': 'Invalid agent'}), 400
    
    token = get_signalwire_token(agent_id)
    
    if token is None:
        return jsonify({'error': 'Failed to get token from SignalWire'}), 500
    
    return jsonify({'token': token, 'agent_id': agent_id})

@app.route('/api/agents')
def api_agents():
    """API endpoint to get list of available agents"""
    return jsonify(AGENTS)

@app.route('/health')
def health():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "module": "module4-two-agent-demo",
        "features": ["multi-browser-coordination", "demo-interface", "agent-calling"],
        "agents_available": len(AGENTS),
        "endpoints": {
            "/": "Root - redirects to login",
            "/login": "Agent selection screen",
            "/agent": "Agent phone interface",
            "/demo": "Two-agent demo coordinator",
            "/agent-frame/<id>": "Agent iframe for demo",
            "/api/token/<id>": "Get token for agent",
            "/api/agents": "List all agents"
        }
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5004))
    
    print("\n" + "="*60)
    print(f"MODULE 4: TWO-AGENT DEMO - COMPLETE SOLUTION")
    print("="*60)
    
    print(f"\n📍 Starting on port {port}")
    
    print("\n⚠️  IMPORTANT NOTES:")
    print("   • SignalWire SDK requires browser isolation for multiple agents")
    print("   • Use different browsers or incognito mode for each agent")
    print("   • Ensure .env file has SignalWire credentials")
    
    print(f"\n👥 Available Agents:")
    for agent in AGENTS:
        print(f"   • {agent['avatar']} {agent['name']} ({agent['id']}) - {agent['role']}")
    
    print(f"\n🔗 Available Endpoints:")
    print(f"   Main Application:")
    print(f"   • http://localhost:{port}/          - Root (redirects to login)")
    print(f"   • http://localhost:{port}/login     - Agent selection screen")
    print(f"   • http://localhost:{port}/agent     - Agent phone interface")
    print(f"   • http://localhost:{port}/logout    - Logout current agent")
    print(f"   ")
    print(f"   Demo Interface:")
    print(f"   • http://localhost:{port}/demo      - Two-agent demo coordinator")
    print(f"   ")
    print(f"   API Endpoints:")
    print(f"   • http://localhost:{port}/api/token/<agent_id> - Get token for agent")
    print(f"   • http://localhost:{port}/api/agents           - List all agents")
    print(f"   • http://localhost:{port}/health               - Health check")
    
    print(f"\n🚀 Quick Start:")
    print(f"   1. Open http://localhost:{port}/ in Chrome")
    print(f"   2. Login as Alice")
    print(f"   3. Open http://localhost:{port}/ in Chrome Incognito")
    print(f"   4. Login as Bob")
    print(f"   5. Make calls between agents!")
    
    print(f"\n   OR use the demo coordinator:")
    print(f"   • Open http://localhost:{port}/demo")
    
    print("\n" + "="*60 + "\n")
    
    app.run(host='0.0.0.0', port=port, debug=True)