// SENTISCROLL AI - Core Agentic Logic (Age + Gender + Emotion Aware Edition)
// Features: Real-time face detection for emotion, age, and gender
// Content curation: Age-appropriate playlists x Mood-based selection
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

// ---- AGE & GENDER STATE ----
let detectedAge = null;
let detectedGender = null;
let ageGroup = null; // 'kids', 'teen', 'adult'
let faceApiModelsLoaded = false;
let lastAgeGenderCheck = 0;
const AGE_GENDER_INTERVAL = 2000; // Run face-api every 2 seconds to save performance

// ============================================
// VIDEO PLAYLISTS — AGE & MOOD ORGANIZED
// ============================================
const safeIds = [
    'jNQXAC9IVRw', 'M7lc1UVf-VE', 'dQw4w9WgXcQ',
    '9bZkp7q19f0', 'O-idst3Zp8o', 'Mwt35SEeR9w', '7_L7Xh7z7_0'
];

// All content below is age-appropriate:
// Kids: educational, nursery rhymes, kids songs, cartoons
// Teen: pop music, educational, science, vlogs
// Adult: trending, music, documentaries, podcasts

const playlists = {
    // ---- KIDS (0-13) ----
    kidsHappy: [
        ...safeIds,
        'iKqXuCZrdv0','9XKSfuzN1t8','kHSFpZMUIic','N1e3RFLKyqc',
        'pZw9veQ71UI','kffacxfA7G4','P6R6dyP3EJ0','YQHsXMglC9A',
        'rZcEfn6SwQI','CevxZvSJLk8','OPf0YbXqDm0','JGwWNGJdvx8',
        'kJQP7kiw5Fk','nfWlot6h_JM','ru0K8uYEZWw','RgKAFK5djSk',
        'hT_nvWreIhg','450p7goxZqg','IcrbM1l_BoI','YqeW9_5kURI',
        'fJ9rUzIMcZQ','fRh_vgS2dFE','lp-EO5I60KA','60ItHLz5WEA',
        'PT2_F-1esPk','L0MK7qz13bU','JRfuAukYTKg','AJtDXIazrMo'
    ],
    kidsCalm: [
        ...safeIds,
        'lTRiuFIWV54','1ZYbU82GVz4','tw6j_GIfaNY','FQd9z6y_4Ks',
        'LHdiXn_4NhI','ux8hGmkWxlE','rYEDA3JcQqw','k85mRPqvMbE',
        'rtOvBOTryX4','e-ORhEE9VVg','W-TE_Ys4iwM','09R8_2nJtjg',
        'u3VTKvdAu_Y','iLnmTe5Q2Qw','tCXGJQYZ9JA','uO59tfQ6TbA',
        '0J2QdDbelmY','pIOOwhmVHow','QJO3ROT-A4E','YBHQbu5SbsQ',
        'y6Sxv-sUYtM'
    ],
    kidsEnergy: [
        ...safeIds,
        'CevxZvSJLk8','OPf0YbXqDm0','JGwWNGJdvx8','kJQP7kiw5Fk',
        'nfWlot6h_JM','ru0K8uYEZWw','RgKAFK5djSk','hT_nvWreIhg',
        '450p7goxZqg','IcrbM1l_BoI','YqeW9_5kURI','fJ9rUzIMcZQ',
        'fRh_vgS2dFE','lp-EO5I60KA','60ItHLz5WEA','PT2_F-1esPk',
        'L0MK7qz13bU','JRfuAukYTKg','AJtDXIazrMo'
    ],
    kidsTrending: [
        ...safeIds,
        'iKqXuCZrdv0','9XKSfuzN1t8','kHSFpZMUIic','N1e3RFLKyqc',
        'pZw9veQ71UI','kffacxfA7G4','P6R6dyP3EJ0','YQHsXMglC9A',
        'rZcEfn6SwQI','CevxZvSJLk8','OPf0YbXqDm0','JGwWNGJdvx8',
        'kJQP7kiw5Fk','nfWlot6h_JM','ru0K8uYEZWw'
    ],

    // ---- TEEN (13-22) ----
    teenHappy: [
        ...safeIds,
        'JGwWNGJdvx8','OPf0YbXqDm0','CevxZvSJLk8','ru0K8uYEZWw',
        'nfWlot6h_JM','nYh-n7EOtMA','vWaRiD5ylLg','LHCob76kigA',
        'oyEuk8j8imI','2Vv-BfVoq4g','RgKAFK5djSk','hT_nvWreIhg',
        '450p7goxZqg','IcrbM1l_BoI','YqeW9_5kURI','fJ9rUzIMcZQ',
        'fRh_vgS2dFE','YQHsXMglC9A','lp-EO5I60KA','60ItHLz5WEA',
        'PT2_F-1esPk','L0MK7qz13bU','JRfuAukYTKg','AJtDXIazrMo'
    ],
    teenCalm: [
        ...safeIds,
        'iLnmTe5Q2Qw','tCXGJQYZ9JA','uO59tfQ6TbA','0J2QdDbelmY',
        'pIOOwhmVHow','QJO3ROT-A4E','YBHQbu5SbsQ','y6Sxv-sUYtM',
        'rYEDA3JcQqw','k85mRPqvMbE','rtOvBOTryX4','e-ORhEE9VVg',
        'W-TE_Ys4iwM','09R8_2nJtjg','u3VTKvdAu_Y'
    ],
    teenEnergy: [
        ...safeIds,
        '7wtfhZwyrcc','ktvTqknDobU','fKopy74weus','mWRsgZuwf_8',
        'gOsM-DYAEhY','VqSPO8z8Xvk','I-QfPUz1es8','TO-_3tck2PQ',
        'fmI_Ndrxy14','sENM2wA_FTg','Rl3ELqRXzNk','4ht80uzIhNs',
        'j60ClcNYWu4','Y2NkuFIl56o','4_5XJnHf6j8','NXXK47WDCaA',
        'zMBTqV68aKM','25E-MWw1uTg','zKCrSN9GhLI','D9G1VOjN_84'
    ],
    teenTrending: [
        ...safeIds,
        'Zi_XLOBDo_Y','1G4isv_Fylg','4fndeDfaWCg','cfOa1a8hYP8',
        'QcIy9NiNbmo','gdZLi9oWNZg','CuklIb9d3fI','34Na4j8AVgA',
        '1k8craCGpgs','Io0fBr1XBUA','LXO-jKksQkM','rC9lw2YBs7Y',
        'UprcpdwuwGc','lY2yjAdbvdQ','ki0Ocze98U8'
    ],

    // ---- ADULT (22+) ----
    adultHappy: [
        ...safeIds,
        'JGwWNGJdvx8','OPf0YbXqDm0','CevxZvSJLk8','ru0K8uYEZWw',
        'nfWlot6h_JM','nYh-n7EOtMA','vWaRiD5ylLg','LHCob76kigA',
        'oyEuk8j8imI','2Vv-BfVoq4g','RgKAFK5djSk','hT_nvWreIhg',
        '450p7goxZqg','IcrbM1l_BoI','YqeW9_5kURI','fJ9rUzIMcZQ',
        'fRh_vgS2dFE','YQHsXMglC9A','lp-EO5I60KA','60ItHLz5WEA',
        'PT2_F-1esPk','L0MK7qz13bU','JRfuAukYTKg','AJtDXIazrMo'
    ],
    adultCalm: [
        ...safeIds,
        'iLnmTe5Q2Qw','tCXGJQYZ9JA','uO59tfQ6TbA','0J2QdDbelmY',
        'pIOOwhmVHow','QJO3ROT-A4E','YBHQbu5SbsQ','y6Sxv-sUYtM',
        'rYEDA3JcQqw','k85mRPqvMbE','rtOvBOTryX4','e-ORhEE9VVg',
        'W-TE_Ys4iwM','09R8_2nJtjg','u3VTKvdAu_Y'
    ],
    adultEnergy: [
        ...safeIds,
        '7wtfhZwyrcc','ktvTqknDobU','fKopy74weus','mWRsgZuwf_8',
        'gOsM-DYAEhY','VqSPO8z8Xvk','I-QfPUz1es8','TO-_3tck2PQ',
        'fmI_Ndrxy14','sENM2wA_FTg','Rl3ELqRXzNk','4ht80uzIhNs',
        'j60ClcNYWu4','Y2NkuFIl56o','4_5XJnHf6j8','NXXK47WDCaA',
        'zMBTqV68aKM','25E-MWw1uTg','zKCrSN9GhLI','D9G1VOjN_84'
    ],
    adultTrending: [
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
    const list = playlists[mood] || playlists.adultTrending;
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
        
        // Load face-api.js models in parallel for age/gender
        loadFaceApiModels();
        
        await startWebcam();
    } catch (err) {
        logAI("STARTUP_ERROR: " + err.message);
        console.error(err);
    }
}

// ============================================
// FACE-API.JS: AGE & GENDER MODEL LOADING
// ============================================
async function loadFaceApiModels() {
    try {
        logAI("Loading Age & Gender Detection Models...");
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.13/model';
        
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        
        faceApiModelsLoaded = true;
        logAI("Age & Gender models loaded successfully.");
    } catch (err) {
        logAI("FACEAPI_ERROR: " + err.message);
        console.error("Face-api.js load error:", err);
    }
}

// ============================================
// FACE-API.JS: DETECT AGE & GENDER
// ============================================
async function detectAgeGender() {
    if (!faceApiModelsLoaded || !video) return;
    
    try {
        const detections = await faceapi.detectSingleFace(
            video, 
            new faceapi.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.5 })
        ).withAgeAndGender();
        
        if (detections) {
            detectedAge = Math.round(detections.age);
            detectedGender = detections.gender;
            const genderProb = detections.genderProbability;
            
            // Determine age group
            if (detectedAge <= 13) {
                ageGroup = 'kids';
            } else if (detectedAge <= 22) {
                ageGroup = 'teen';
            } else {
                ageGroup = 'adult';
            }
            
            // Update HUD
            const ageEl = document.getElementById('age-label');
            const genderEl = document.getElementById('gender-label');
            const ageGroupEl = document.getElementById('age-group-label');
            
            if (ageEl) ageEl.textContent = `${detectedAge} yrs`;
            if (genderEl) {
                const genderIcon = detectedGender === 'male' ? '♂' : '♀';
                genderEl.textContent = `${genderIcon} ${detectedGender.toUpperCase()} (${(genderProb*100).toFixed(0)}%)`;
            }
            if (ageGroupEl) {
                const groupLabel = ageGroup === 'kids' ? 'KIDS (0-13)' : ageGroup === 'teen' ? 'TEEN (13-22)' : 'ADULT (22+)';
                ageGroupEl.textContent = groupLabel;
            }
        }
    } catch (err) {
        console.error("Age/Gender detection error:", err);
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
        logAI("Vision Online. Monitoring emotional state & demographics.");
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
        const startId = getRandomId('adultTrending');
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
                    logAI("Player ready. Streaming content.");
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
        logAI(`Init: Starting with default content.`);
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
    // Map old mood names to age-aware mood keys
    const moodMap = {
        'happySongs': 'happy',
        'imagineDragons': 'energy',
        'calm': 'calm',
        'trending': 'trending'
    };
    const baseMood = moodMap[mood] || mood;
    const targetMood = ageGroup ? `${ageGroup}${baseMood.charAt(0).toUpperCase()}${baseMood.slice(1)}` : `adult${baseMood.charAt(0).toUpperCase()}${baseMood.slice(1)}`;
    
    if (playlists[targetMood]) {
        currentMood = targetMood;
        logAI(`Manual override: Forcing ${baseMood.toUpperCase()} mood [${ageGroup || 'adult'}].`);
        playForMood(currentMood);
        const moodLabel = document.getElementById('mood-label');
        if (moodLabel) moodLabel.textContent = baseMood.toUpperCase();
    } else {
        logAI(`Unknown mood override: ${mood}`);
    }
});

// ============================================
// VIDEO PLAYBACK CONTROL — AGE-AWARE
// ============================================
function playForMood(mood) {
    // If mood is not age-prefixed, resolve to age-appropriate version
    let resolvedMood = mood;
    if (!mood.startsWith('kids') && !mood.startsWith('teen') && !mood.startsWith('adult')) {
        const baseMood = mood.replace(/^(kids|teen|adult)/, '');
        const group = ageGroup || 'adult';
        resolvedMood = `${group}${baseMood.charAt(0).toUpperCase()}${baseMood.slice(1)}`;
    }
    
    // Fallback chain: age-specific → adult → any
    if (!playlists[resolvedMood]) {
        const fallbackMoods = ['adultTrending', 'teenTrending', 'kidsTrending'];
        for (const fm of fallbackMoods) {
            if (playlists[fm]) {
                resolvedMood = fm;
                break;
            }
        }
    }
    
    const vid = getRandomId(resolvedMood);
    if (player && typeof player.loadVideoById === 'function') {
        player.loadVideoById(vid);
        const baseName = resolvedMood.replace(/^(kids|teen|adult)/, '').toUpperCase();
        const groupName = ageGroup ? ageGroup.toUpperCase() : 'ADULT';
        logAI(`Now playing: ${baseName} content [${groupName}].`);
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

        // Age & Gender detection (throttled)
        if (now - lastAgeGenderCheck >= AGE_GENDER_INTERVAL) {
            lastAgeGenderCheck = now;
            detectAgeGender();
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
            const newMood = 'energy';
            const resolvedMood = resolveAgeMood(newMood);
            if (currentMood !== resolvedMood) {
                currentMood = resolvedMood;
                logAI(`Agent: Boredom detected for ${(boredDuration/1000).toFixed(1)}s -> Switching to ENERGY BOOST content [${(ageGroup || 'adult').toUpperCase()}].`);
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
            const resolvedMood = resolveAgeMood(newMood);
            if (currentMood !== resolvedMood) {
                currentMood = resolvedMood;
                logAI(`Agent: Negative state (${dominant}) for ${(negativeDuration/1000).toFixed(1)}s -> Switching to CALM content [${(ageGroup || 'adult').toUpperCase()}].`);
                playForMood(currentMood);
                showAiAction('AUTO_PIVOT: CALMING MODE');
            }
            negativeTimer = 0;
        }
    } else {
        negativeTimer = 0;
    }

    if (dominant === 'happy') {
        const happyMood = resolveAgeMood('happy');
        if (currentMood !== happyMood) {
            currentMood = happyMood;
            logAI(`Agent: Joy detected! Serving HAPPY content [${(ageGroup || 'adult').toUpperCase()}].`);
            playForMood(currentMood);
        }
    }
}

// ============================================
// HELPER: RESOLVE MOOD TO AGE-SPECIFIC PLAYLIST
// ============================================
function resolveAgeMood(baseMood) {
    const group = ageGroup || 'adult';
    const capitalized = baseMood.charAt(0).toUpperCase() + baseMood.slice(1);
    const resolved = `${group}${capitalized}`;
    return playlists[resolved] ? resolved : `adult${capitalized}`;
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
