# 🎵 YouTube Music Sync

Real-time YouTube Music synchronization app that allows you to watch YouTube videos with friends in perfect sync over a local network.

## Features

- **Room System**: Create or join rooms with 6-character codes
- **Host Controls**: Host can control playback for all users
- **Real-time Sync**: All users stay in sync via Socket.IO
- **Drift Correction**: Automatic correction for playback drift on guest devices
- **Multiple Link Formats**: Supports YouTube, YouTube Music, and youtu.be links

## Windows Setup Instructions

### 1. Install Node.js

Download and install Node.js from [nodejs.org](https://nodejs.org/) (LTS version recommended)

### 2. Setup Project

Open PowerShell or Command Prompt in the project directory and run:

```powershell
npm install
```

This will install the required dependencies:
- `express` - Web server framework
- `socket.io` - Real-time communication

### 3. Start the Server

```powershell
npm start
```

Or directly:

```powershell
node server/server.js
```

You should see:
```
Server running on http://localhost:3000
Allow connections from other devices on your network at http://<your-ip>:3000
```

### 4. Find Your Local IP Address

Open PowerShell and run:

```powershell
ipconfig
```

Look for "IPv4 Address" under your active network adapter (usually something like `192.168.1.x`)

### 5. Windows Firewall Setup

**Important**: Allow Node.js through Windows Firewall so friends can connect.

#### Method 1: Automatic (when prompted)
- When you first run the server, Windows will show a firewall prompt
- Check "Private networks" (for home/work networks)
- Click "Allow access"

#### Method 2: Manual Setup
1. Open **Windows Defender Firewall with Advanced Security**
2. Click **Inbound Rules** → **New Rule**
3. Choose **Program** → Next
4. Browse to your Node.js executable (usually `C:\Program Files\nodejs\node.exe`)
5. Select **Allow the connection** → Next
6. Check only **Private** → Next
7. Name it "Node.js Server" → Finish

### 6. Connect with Friends

**On Host Computer:**
1. Open browser: `http://localhost:3000`
2. Click "Create Room"
3. Share the 6-character room code with friends

**On Friend Computers (same Wi-Fi):**
1. Open browser: `http://<host-ip>:3000` (e.g., `http://192.168.1.5:3000`)
2. Click "Join Room"
3. Enter the room code

## How to Use

### As Host:
1. Create a room
2. Share the room code with friends
3. Paste a YouTube or YouTube Music link
4. Click "Load Video"
5. Use play/pause/seek controls to control playback for everyone

### As Guest:
1. Join a room with the code
2. Wait for the host to load a video
3. Playback is automatically controlled by the host
4. Your video stays in sync with automatic drift correction

## Supported Link Formats

- `https://music.youtube.com/watch?v=VIDEO_ID`
- `https://www.youtube.com/watch?v=VIDEO_ID`
- `https://youtu.be/VIDEO_ID`

## Technical Details

### Architecture
- **Backend**: Node.js + Express + Socket.IO
- **Frontend**: Vanilla JavaScript + YouTube IFrame Player API
- **Port**: 3000 (default)

### Key Features
- **Room Management**: Automatic 6-character room code generation
- **State Synchronization**: Server maintains authoritative state per room
- **Drift Correction**: Guests check for drift every 2 seconds and correct if |drift| > 0.25s
- **Computed Time**: Server calculates current time based on last update and playback state

### File Structure
```
musiccolab/
├── server/
│   └── server.js          # Express + Socket.IO server
├── client/
│   ├── index.html         # HTML structure
│   ├── app.js            # Client-side logic
│   └── styles.css        # Styling
├── package.json          # Dependencies
└── README.md            # This file
```

## Troubleshooting

### Friends Can't Connect
- Ensure all devices are on the same Wi-Fi network
- Check Windows Firewall settings (see step 5)
- Verify you're using the correct IP address
- Try temporarily disabling antivirus software

### Video Not Loading
- Check your internet connection
- Try a different YouTube link
- Ensure the video is not region-restricted
- Check browser console for errors (F12)

### Playback Out of Sync
- Drift correction runs automatically every 2 seconds
- If persistent, try refreshing the page
- Check network stability
- Ensure all users have good internet connection

### Room Code Not Working
- Room codes are case-insensitive but must be exactly 6 characters
- Room codes expire when the host leaves
- Try creating a new room if issues persist

## Development Notes

- The server runs on port 3000 by default (can be changed in `server/server.js`)
- Player controls are disabled for guests (visual feedback with opacity)
- Host disconnection closes the room automatically
- All Socket.IO events are namespaced with `host:` prefix for host actions

## License

MIT License - Feel free to modify and use for your own purposes!

## Credits

Built with:
- [Express.js](https://expressjs.com/)
- [Socket.IO](https://socket.io/)
- [YouTube IFrame Player API](https://developers.google.com/youtube/iframe_api_reference)
