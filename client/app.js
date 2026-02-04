// Global variables
let socket;
let player;
let isHost = false;
let currentRoomCode = null;
let playerReady = false;

// Sync state for drift correction
let syncState = {
  isPlaying: false,
  syncedTime: 0,
  syncedAt: Date.now()
};

// DOM Elements
const setupSection = document.getElementById('setup-section');
const roomSection = document.getElementById('room-section');
const playerSection = document.getElementById('player-section');
const createRoomBtn = document.getElementById('create-room-btn');
const showJoinBtn = document.getElementById('show-join-btn');
const joinForm = document.getElementById('join-form');
const roomCodeInput = document.getElementById('room-code-input');
const joinRoomBtn = document.getElementById('join-room-btn');
const roomCodeDisplay = document.getElementById('room-code');
const userRoleDisplay = document.getElementById('user-role');
const userCountDisplay = document.getElementById('user-count');
const linkInputSection = document.getElementById('link-input-section');
const videoLinkInput = document.getElementById('video-link-input');
const loadVideoBtn = document.getElementById('load-video-btn');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const seekBackBtn = document.getElementById('seek-back-btn');
const seekForwardBtn = document.getElementById('seek-forward-btn');
const statusMessage = document.getElementById('status-message');
const playerStatus = document.getElementById('player-status');

// Initialize Socket.IO
socket = io();

// YouTube IFrame API ready callback
function onYouTubeIframeAPIReady() {
  console.log('YouTube IFrame API ready');
}

// Create YouTube player
function createPlayer(videoId) {
  if (player) {
    player.loadVideoById(videoId);
    return;
  }

  player = new YT.Player('player', {
    height: '360',
    width: '640',
    videoId: videoId,
    playerVars: {
      'playsinline': 1,
      'controls': 0,
      'disablekb': 1,
      'modestbranding': 1
    },
    events: {
      'onReady': onPlayerReady,
      'onStateChange': onPlayerStateChange
    }
  });
}

function onPlayerReady(event) {
  console.log('Player ready');
  playerReady = true;
  playerSection.classList.remove('hidden');
  updateControlsVisibility();
}

function onPlayerStateChange(event) {
  // Only host should emit state changes
  if (!isHost) return;
  if (!playerReady) return;

  const currentTime = player.getCurrentTime();

  // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3), CUED (5)
  if (event.data === YT.PlayerState.PLAYING) {
    socket.emit('host:play', { roomCode: currentRoomCode, time: currentTime });
    updateSyncState(true, currentTime);
  } else if (event.data === YT.PlayerState.PAUSED) {
    socket.emit('host:pause', { roomCode: currentRoomCode, time: currentTime });
    updateSyncState(false, currentTime);
  }
}

// Update sync state
function updateSyncState(isPlaying, time) {
  syncState.isPlaying = isPlaying;
  syncState.syncedTime = time;
  syncState.syncedAt = Date.now();
}

// Extract video ID from YouTube URL
function extractVideoId(url) {
  // music.youtube.com/watch?v=VIDEO_ID
  // youtube.com/watch?v=VIDEO_ID
  // youtu.be/VIDEO_ID
  
  const patterns = [
    /(?:music\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]+)/,
    /youtu\.be\/([a-zA-Z0-9_-]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// Show status message
function showStatus(message, type = 'info') {
  statusMessage.textContent = message;
  statusMessage.className = `status-message ${type}`;
  statusMessage.style.display = 'block';
  
  setTimeout(() => {
    statusMessage.style.display = 'none';
  }, 3000);
}

// Update controls visibility based on role
function updateControlsVisibility() {
  const controls = document.querySelectorAll('#controls .btn');
  controls.forEach(btn => {
    btn.disabled = !isHost;
    btn.style.opacity = isHost ? '1' : '0.5';
  });
}

// Event Listeners
createRoomBtn.addEventListener('click', () => {
  socket.emit('create-room', (response) => {
    if (response.success) {
      currentRoomCode = response.roomCode;
      isHost = response.isHost;
      
      setupSection.classList.add('hidden');
      roomSection.classList.remove('hidden');
      
      roomCodeDisplay.textContent = response.roomCode;
      userRoleDisplay.textContent = isHost ? '👑 Host' : '👤 Guest';
      userCountDisplay.textContent = response.userCount;
      
      if (isHost) {
        linkInputSection.classList.remove('hidden');
      }
      
      showStatus('Room created successfully!', 'success');
    }
  });
});

showJoinBtn.addEventListener('click', () => {
  joinForm.classList.toggle('hidden');
});

joinRoomBtn.addEventListener('click', () => {
  const roomCode = roomCodeInput.value.trim().toUpperCase();
  
  if (roomCode.length !== 6) {
    showStatus('Room code must be 6 characters', 'error');
    return;
  }
  
  socket.emit('join-room', roomCode, (response) => {
    if (response.success) {
      currentRoomCode = response.roomCode;
      isHost = response.isHost;
      
      setupSection.classList.add('hidden');
      roomSection.classList.remove('hidden');
      
      roomCodeDisplay.textContent = response.roomCode;
      userRoleDisplay.textContent = isHost ? '👑 Host' : '👤 Guest';
      userCountDisplay.textContent = response.userCount;
      
      if (isHost) {
        linkInputSection.classList.remove('hidden');
      }
      
      showStatus('Joined room successfully!', 'success');
    } else {
      showStatus(response.message || 'Failed to join room', 'error');
    }
  });
});

loadVideoBtn.addEventListener('click', () => {
  const url = videoLinkInput.value.trim();
  
  if (!url) {
    showStatus('Please enter a YouTube link', 'error');
    return;
  }
  
  const videoId = extractVideoId(url);
  
  if (!videoId) {
    showStatus('Invalid YouTube link', 'error');
    return;
  }
  
  socket.emit('host:loadVideo', { roomCode: currentRoomCode, videoId });
  showStatus('Loading video...', 'info');
  videoLinkInput.value = '';
});

playBtn.addEventListener('click', () => {
  if (!isHost || !player) return;
  player.playVideo();
});

pauseBtn.addEventListener('click', () => {
  if (!isHost || !player) return;
  player.pauseVideo();
});

seekBackBtn.addEventListener('click', () => {
  if (!isHost || !player) return;
  const currentTime = player.getCurrentTime();
  const newTime = Math.max(0, currentTime - 10);
  player.seekTo(newTime, true);
  socket.emit('host:seek', { roomCode: currentRoomCode, time: newTime });
  updateSyncState(syncState.isPlaying, newTime);
});

seekForwardBtn.addEventListener('click', () => {
  if (!isHost || !player) return;
  const currentTime = player.getCurrentTime();
  const newTime = currentTime + 10;
  player.seekTo(newTime, true);
  socket.emit('host:seek', { roomCode: currentRoomCode, time: newTime });
  updateSyncState(syncState.isPlaying, newTime);
});

// Socket event handlers
socket.on('state:sync', (data) => {
  console.log('State sync:', data);
  
  if (!player || !playerReady) {
    createPlayer(data.videoId);
    // Wait for player to be ready, then sync
    const checkReady = setInterval(() => {
      if (playerReady) {
        clearInterval(checkReady);
        syncPlayer(data);
      }
    }, 100);
  } else {
    if (player.getVideoData().video_id !== data.videoId) {
      player.loadVideoById(data.videoId);
    }
    syncPlayer(data);
  }
});

function syncPlayer(data) {
  player.seekTo(data.time, true);
  
  if (data.isPlaying) {
    player.playVideo();
  } else {
    player.pauseVideo();
  }
  
  updateSyncState(data.isPlaying, data.time);
  showStatus('Synced with host', 'success');
}

socket.on('state:play', (data) => {
  if (!player || !playerReady || isHost) return;
  console.log('Play at:', data.time);
  
  player.seekTo(data.time, true);
  player.playVideo();
  updateSyncState(true, data.time);
});

socket.on('state:pause', (data) => {
  if (!player || !playerReady || isHost) return;
  console.log('Pause at:', data.time);
  
  player.seekTo(data.time, true);
  player.pauseVideo();
  updateSyncState(false, data.time);
});

socket.on('state:seek', (data) => {
  if (!player || !playerReady || isHost) return;
  console.log('Seek to:', data.time);
  
  player.seekTo(data.time, true);
  updateSyncState(syncState.isPlaying, data.time);
});

socket.on('user-count', (count) => {
  userCountDisplay.textContent = count;
});

socket.on('room-closed', (data) => {
  showStatus(data.message, 'error');
  setTimeout(() => {
    location.reload();
  }, 2000);
});

// Drift correction for guests
setInterval(() => {
  if (isHost || !player || !playerReady) return;
  
  const now = Date.now();
  const timeSinceSync = (now - syncState.syncedAt) / 1000;
  
  let expectedTime = syncState.syncedTime;
  if (syncState.isPlaying) {
    expectedTime += timeSinceSync;
  }
  
  const currentTime = player.getCurrentTime();
  const drift = currentTime - expectedTime;
  
  if (Math.abs(drift) > 0.25) {
    console.log(`Drift detected: ${drift.toFixed(2)}s. Correcting...`);
    player.seekTo(expectedTime, true);
    playerStatus.textContent = `Drift corrected: ${drift.toFixed(2)}s`;
    setTimeout(() => {
      playerStatus.textContent = '';
    }, 2000);
  }
}, 2000);

// Update player status every second
setInterval(() => {
  if (!player || !playerReady) return;
  
  const currentTime = player.getCurrentTime();
  const duration = player.getDuration();
  
  if (currentTime && duration) {
    const current = formatTime(currentTime);
    const total = formatTime(duration);
    if (!playerStatus.textContent.includes('Drift')) {
      playerStatus.textContent = `${current} / ${total}`;
    }
  }
}, 1000);

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
