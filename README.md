# SignalWire Call Fabric Minimal Client (Python Version)

A minimal Python-based client application for SignalWire Call Fabric. This project implements a browser-based WebRTC phone using the latest SignalWire JavaScript SDK.

## Features

- Make outbound calls to other SignalWire subscribers
- Receive incoming calls
- Basic call controls (answer, reject, hangup)
- Video and audio calling

## Requirements

- Python 3.7+
- SignalWire account with a Call Fabric project
- Web browser with WebRTC support

## Setup

1. Clone this repository
2. Create a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```
4. Copy `.env.example` to `.env` and fill in your SignalWire credentials:
   ```
   cp .env.example .env
   ```
5. Edit the `.env` file with your SignalWire space, project key, and token.

## Running the Application

Start the Flask development server:
```
python app.py
```

The application will be available at http://localhost:3000.

## How It Works

This application uses:
- Flask as the backend web server
- SignalWire's JavaScript SDK (@signalwire/js) for WebRTC calling
- Bootstrap for the user interface

When a user accesses the application:
1. The server requests a token from SignalWire for the subscriber
2. The browser initializes the SignalWire client with that token
3. The client can then make or receive calls using WebRTC

## SignalWire Integration

The application integrates with SignalWire using:
- The latest SignalWire JavaScript SDK (v2023+)
- The SignalWire Call Fabric API for subscriber authentication
- WebRTC for real-time communication

## File Structure

- `app.py` - Main Flask application
- `static/client.js` - Browser-side SignalWire client code
- `templates/index.html` - HTML template for the web interface
- `.env` - Environment variables for SignalWire credentials

## Resources

- [SignalWire Client Documentation](https://developer.signalwire.com/sdks/reference/browser-sdk/SignalWire%20Client/client/)
- [Flask Documentation](https://flask.palletsprojects.com/)
- [Bootstrap Documentation](https://getbootstrap.com/docs/) 