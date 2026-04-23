// SENTISCROLL AI - Core Agentic Logic (Emotion-Mapped Edition)
// Fixed: Removed duplicate functions, completed processEmotions, added agent loop & radar chart.
import { FaceLandmarker, FilesetResolver } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";

// ============================================
// STATE VARIABLES
// ============================================
let faceLandmarker;
let video;
let player;
let isAgentActive = true;
let emotionData = { bored: 0, happy: 0, stressed: 0, sad: 0, neutral: 0 };
let currentMood = 'trending';
let lastVideoId = null;
let failedIds = new Set();
let fpsCounter = 0;
let lastFpsTime = performance.now();
let boredTimer = 0;
let negativeTimer = 0;
const BORED_SKIP_THRESHOLD = 5000;   // ms of boredom before auto-skip
const NEGATIVE_SKIP_THRESHOLD = 8000; // ms of stress/sadness before calming switch

// ============================================
// VIDEO PLAYLISTS
// ============================================
const safeIds = [
    'jNQXAC9IVRw', 'M7lc1UVf-VE', 'dQw4w9WgXcQ',
    '9bZkp7q19f0', 'O-idst3Zp8o', 'Mwt35SEeR9w', '7_L7Xh7z7_0'
];

const playlists = {
    happySongs: [
        ...safeIds,
        'kJQP7kiw5Fk','JGwWNGJdvx8','OPf0YbXqDm0','CevxZvSJLk8',
        'ru0K8uYEZWw','nfWlot6h_JM','nYh-n7EOtMA','vWaRiD5ylLg',
        'LHCob76kigA','oyEuk8j8imI','2Vv-BfVoq4g','RgKAFK5djSk',
        'hT_nvWreIhg','450p7goxZqg','IcrbM1l_BoI','YqeW9_5kURI',
        'fJ9rUzIMcZQ','fRh_vgS2dFE','YQHsXMglC9A','lp-EO5I60KA',
        '60ItHLz5WEA','PT2_F-1esPk','L0MK7qz13bU','JRfuAukYTKg','AJtDXIazrMo'
    ],
    imagineDragons: [
        ...safeIds,
        '7wtfhZwyrcc','ktvTqknDobU','fKopy74weus','mWRsgZuwf_8',
        'gOsM-DYAEhY','VqSPO8z8Xvk','I-QfPUz1es8','TO-_3tck2PQ',
        'fmI_Ndrxy14','sENM2wA_FTg','Rl3ELqRXzNk','4ht80uzIhNs',
        'j60ClcNYWu4','Y2NkuFIl56o','4_5XJnHf6j8','NXXK47WDCaA',
        'zMBTqV68aKM','25E-MWw1uTg','zKCrSN9GhLI','D9G1VOjN_84'
    ],
    calm: [
        ...safeIds,
        'iLnmTe5Q2Qw','tCXGJQYZ9JA','uO59tfQ6TbA','0J2QdDbelmY',
        'pIOOwhmVHow','QJO3ROT-A4E','YBHQbu5SbsQ','y6Sxv-sUYtM',
        'rYEDA3JcQqw','k85mRPqvMbE','rtOvBOTryX4','e-ORhEE9VVg',
        'W-TE_Ys4iwM','09R8_2nJtjg','u3VTKvdAu_Y'
    ],
    trending: [
        ...safeIds,
        'Zi_XLOBDo_Y','1G4isv_Fylg','4fndeDfaWCg','cfOa1a8hYP8',
        'QcIy9NiNbmo','gdZLi9oWNZg','CuklIb9d3fI','34Na4j8AVgA',
        '1k8craCGpgs','Io0fBr1XBUA','LXO-jKksQkM','rC9lw2YBs7Y',
        'UprcpdwuwGc','lY2yjAdbvdQ','ki0Ocze98U8'
    ]
};

// ============================================
// HELPER: PICK A RANDOM VIDEO ID
// ============================================
function getRandomId(mood) {
    const list = playlists[mood] || playlists.trending;
    const available = list.filter(id => !failedIds.has(id));
    if (available.length === 0) {
        failedIds.clear();
        const fallbackId = list[Math.floor(Math.random() * list.length)];
        lastVideoId = fallbackId;
        return fallbackId;
    }
    let id;
    let attempts = 0;
    do {
        id = available[Math.floor(Math.random() * available.length)];
        attempts++;
    } while (id === lastVideoId && available.length > 1 && attempts < 5);
    lastVideoId = id;
    return id;
}

// ============================================
// APP LIFECYCLE
// ============================================
window.startSentiScroll = async function() {
    logAI("System startup initiated...");
    document.getElementById('start-panel').style.display = 'none';
    document.getElementById('active-controls').style.display = 'grid';

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        logAI("ERROR: Browser blocks camera. USE LOCALHOST:8000!");
        return;
    }

    await initVision();
};

// ============================================
// MEDIAPIPE FACE LANDMARKER INIT
// ============================================
async function initVision() {
    try {
        logAI("Loading Neural Engine (MediaPipe)...");

        const vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
            baseOptions: {
                modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
                delegate: "GPU"
            },
            outputFaceBlendshapes: true,
            runningMode: "VIDEO",
            numFaces: 1
        });

        logAI("Neural Engine Active. Connecting Vision Sensor...");
        await startWebcam();
    } catch (err) {
        logAI("STARTUP_ERROR: " + err.message);
        console.error(err);
    }
}

// ============================================
// WEBCAM STREAM
// ============================================
async function startWebcam() {
    try {
        video = document.getElementById("webcam");
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        video.addEventListener("loadeddata", predictWebcam);
        logAI("Vision Online. Monitoring emotional state.");
        document.getElementById('bio-status').textContent = 'LIVE';
    } catch (err) {
        logAI("CAMERA_ERROR: " + err.message);
    }
}

// ============================================
// YOUTUBE PLAYER SETUP
// ============================================
function initYouTube() {
    if (window.YT && window.YT.Player) {
        const startId = getRandomId('trending');
        player = new YT.Player('player', {
            height: '100%',
            width: '100%',
            videoId: startId,
            playerVars: {
                'autoplay': 1,
                'controls': 0,
                'modestbranding': 1,
                'rel': 0,
                'enablejsapi': 1,
                'playsinline': 1
            },
            events: {
                'onReady': (e) => {
                    e.target.playVideo();
                    logAI("Player ready. Streaming TRENDING content.");
                },
                'onError': (e) => {
                    if (lastVideoId) failedIds.add(lastVideoId);
                    logAI(`VIDEO_ERROR ${e.data}: Blocked. Blacklisted ${failedIds.size} IDs. Fetching next...`);
                    setTimeout(() => playForMood(currentMood), 1200);
                },
                'onStateChange': (e) => {
                    if (window.YT && window.YT.PlayerState && e.data === window.YT.PlayerState.ENDED) {
                        logAI('Content ended. Loading next...');
                        playForMood(currentMood);
                    }
                }
            }
        });
        logAI(`Init: Starting with TRENDING content.`);
    }
}

window.onYouTubeIframeAPIReady = function() {
    initYouTube();
};

if (window.YT && window.YT.Player) {
    initYouTube();
}

// Listen for manual mood overrides from the sidebar buttons
window.addEventListener('sentiscroll:forcemood', (e) => {
    const mood = e.detail && e.detail.mood;
    if (mood && playlists[mood]) {
        currentMood = mood;
        logAI(`Manual override: Forcing ${mood.toUpperCase()} mood.`);
        playForMood(currentMood);
        const moodLabel = document.getElementById('mood-label');
        if (moodLabel) moodLabel.textContent = mood.toUpperCase();
    } else {
        logAI(`Unknown mood override: ${mood}`);
    }
});

// ============================================
// VIDEO PLAYBACK CONTROL
// ============================================
function playForMood(mood) {
    const vid = getRandomId(mood);
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(vid);
        logAI(`Now playing: ${mood.toUpperCase()} content.`);
    } else {
        logAI('Player not ready. Retrying...');
        setTimeout(() => playForMood(mood), 1000);
    }
}

window.nextVideo = function() {
    playForMood(currentMood);
    logAI(`Manual skip triggered.`);
};

window.toggleAgent = function() {
    isAgentActive = !isAgentActive;
    logAI(`Agent status: ${isAgentActive ? 'RESUMED' : 'PAUSED'}`);
};

// ============================================
// AI LOG PANEL
// ============================================
function logAI(msg) {
    const logs = document.getElementById('ai-logs');
    const p = document.createElement('p');
    p.style.marginBottom = '5px';
    const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
    p.innerHTML = `<span style="color:var(--primary);opacity:0.5;">[${ts}]</span> <span style="color:#ccc;">${msg}</span>`;
    logs.prepend(p);
    // Keep logs trimmed to 50 entries
    while (logs.children.length > 50) {
        logs.removeChild(logs.lastChild);
    }
}

// ============================================
// EMOTION DETECTION LOOP
// ============================================
let lastTime = -1;

async function predictWebcam() {
    if (video && lastTime !== video.currentTime) {
        lastTime = video.currentTime;

        const now = performance.now();
        const results = faceLandmarker.detectForVideo(video, now);

        // FPS calculation
        fpsCounter++;
        if (now - lastFpsTime >= 1000) {
            const fpsEl = document.getElementById('fps');
            if (fpsEl) fpsEl.textContent = fpsCounter.toFixed(1);
            fpsCounter = 0;
            lastFpsTime = now;
        }

        if (results.faceBlendshapes && results.faceBlendshapes.length > 0) {
            processEmotions(results.faceBlendshapes[0].categories);
        } else {
            // No face detected
            document.getElementById('bio-status').textContent = 'NO FACE';
        }
    }
    window.requestAnimationFrame(predictWebcam);
}

// ============================================
// EMOTION PROCESSING & AGENT DECISION LOOP
// ============================================
function processEmotions(blendshapes) {
    // --- Extract key blendshape scores ---
    const get = (name) => {
        const found = blendshapes.find(b => b.categoryName === name);
        return found ? found.score : 0;
    };

    // Blink rate (low blink = zoned out / bored)
    const eyeBlinkLeft  = get('eyeBlinkLeft');
    const eyeBlinkRight = get('eyeBlinkRight');
    const avgBlink = (eyeBlinkLeft + eyeBlinkRight) / 2;

    // Smile / happiness
    const mouthSmileLeft  = get('mouthSmileLeft');
    const mouthSmileRight = get('mouthSmileRight');
    const smileScore = (mouthSmileLeft + mouthSmileRight) / 2;

    // Brow furrow (stress / confusion)
    const browDownLeft  = get('browDownLeft');
    const browDownRight = get('browDownRight');
    const browFurrow = (browDownLeft + browDownRight) / 2;

    // Sadness indicators
    const mouthFrownLeft  = get('mouthFrownLeft');
    const mouthFrownRight = get('mouthFrownRight');
    const frownScore = (mouthFrownLeft + mouthFrownRight) / 2;

    // Inner brow raise (sadness / distress)
    const browInnerUp = get('browInnerUp');

    // Jaw open (surprise / excitement)
    const jawOpen = get('jawOpen');

    // --- Map to emotional state scores (0-1) ---
    emotionData.happy    = Math.min(1, smileScore * 2.5 + jawOpen * 0.4);
    emotionData.bored    = Math.min(1, (1 - smileScore) * (1 - browFurrow) * (avgBlink < 0.15 ? 1.5 : 0.8));
    emotionData.stressed = Math.min(1, browFurrow * 2.2 + jawOpen * 0.3);
    emotionData.sad      = Math.min(1, frownScore * 2.8 + browInnerUp * 1.5 + (1 - smileScore) * 0.3);
    emotionData.neutral  = Math.max(0, 1 - emotionData.happy - emotionData.bored - emotionData.stressed - emotionData.sad);

    // Clamp neutral
    emotionData.neutral = Math.min(1, Math.max(0, emotionData.neutral));

    // Update UI
    updateBioStatus();
    updateEmotionRadar();

    if (!isAgentActive) return;

    // --- Agent Decision Loop ---
    const dominant = getDominantEmotion();
    const now = performance.now();

    if (dominant === 'bored' || dominant === 'neutral') {
        // Accumulate boredom timer
        if (boredTimer === 0) boredTimer = now;
        const boredDuration = now - boredTimer;

        if (boredDuration > BORED_SKIP_THRESHOLD) {
            const newMood = 'imagineDragons'; // Energetic pick-me-up
            if (currentMood !== newMood) {
                currentMood = newMood;
                logAI(`Agent: Boredom detected for ${(boredDuration/1000).toFixed(1)}s → Switching to ENERGY BOOST content.`);
                playForMood(currentMood);
                showAiAction('AUTO_SKIPPING: ENERGY MODE');
            }
            boredTimer = 0;
        }
    } else {
        boredTimer = 0; // Reset if not bored
    }

    if (dominant === 'stressed' || dominant === 'sad') {
        if (negativeTimer === 0) negativeTimer = now;
        const negativeDuration = now - negativeTimer;

        if (negativeDuration > NEGATIVE_SKIP_THRESHOLD) {
            const newMood = 'calm';
            if (currentMood !== newMood) {
                currentMood = newMood;
                logAI(`Agent: Negative state (${dominant}) for ${(negativeDuration/1000).toFixed(1)}s → Switching to CALM content.`);
                playForMood(currentMood);
                showAiAction('AUTO_PIVOT: CALMING MODE');
            }
            negativeTimer = 0;
        }
    } else {
        negativeTimer = 0;
    }

    if (dominant === 'happy') {
        if (currentMood !== 'happySongs') {
            currentMood = 'happySongs';
            logAI(`Agent: Joy detected! Serving HAPPY content.`);
            playForMood(currentMood);
        }
    }
}

// ============================================
// DOMINANT EMOTION HELPER
// ============================================
function getDominantEmotion() {
    let max = -1;
    let dominant = 'neutral';
    for (const [key, val] of Object.entries(emotionData)) {
        if (val > max) {
            max = val;
            dominant = key;
        }
    }
    return dominant;
}

// ============================================
// BIO STATUS UPDATE
// ============================================
function updateBioStatus() {
    const dominant = getDominantEmotion();
    const emojiMap = { happy: '😊 JOYFUL', bored: '😐 BORED', stressed: '😠 STRESSED', sad: '😢 SAD', neutral: '😶 NEUTRAL' };
    const bioEl = document.getElementById('bio-status');
    if (bioEl) bioEl.textContent = emojiMap[dominant] || 'ACTIVE';
}

// ============================================
// EMOTION RADAR (BAR CHART IN SIDEBAR)
// ============================================
function updateEmotionRadar() {
    const radar = document.getElementById('emotion-radar');
    if (!radar) return;

    const colorMap = {
        happy:    'var(--primary)',
        bored:    '#888',
        stressed: 'var(--accent)',
        sad:      'var(--secondary)',
        neutral:  '#aaa'
    };

    let html = '<div style="width:100%;padding:8px 0;">';
    for (const [emotion, score] of Object.entries(emotionData)) {
        const pct = (score * 100).toFixed(0);
        const color = colorMap[emotion] || 'white';
        html += `
            <div style="margin-bottom:8px;">
                <div style="display:flex;justify-content:space-between;font-size:0.7rem;text-transform:uppercase;letter-spacing:1px;margin-bottom:3px;">
                    <span style="color:${color};">${emotion}</span>
                    <span style="color:#aaa;">${pct}%</span>
                </div>
                <div style="width:100%;height:6px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;">
                    <div style="width:${pct}%;height:100%;background:${color};border-radius:4px;transition:width 0.3s ease;"></div>
                </div>
            </div>`;
    }
    html += '</div>';
    radar.innerHTML = html;
}

// ============================================
// AI ACTION INDICATOR (HUD OVERLAY)
// ============================================
function showAiAction(msg) {
    const el = document.getElementById('ai-action-indicator');
    if (!el) return;
    el.textContent = `AI_ACTION: ${msg}`;
    el.style.display = 'block';
    setTimeout(() => { el.style.display = 'none'; }, 4000);
}
