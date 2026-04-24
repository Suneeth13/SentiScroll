# SentiScroll Age & Gender Implementation Plan

## Steps
- [x] Analyze existing prototype (index.html, app.js, styles.css)
- [x] Add face-api.js CDN to index.html
- [x] Update index.html: Add Age, Gender, Age_Group HUD elements
- [x] Update app.js:
  - [x] Import/Load face-api.js age & gender models
  - [x] Add state variables: `detectedAge`, `detectedGender`, `ageGroup`
  - [x] Create age-group based playlists (kids, teen, adult) × moods
  - [x] Add `detectAgeGender()` function with throttled detection (every 2s)
  - [x] Add `resolveAgeMood()` helper for age-aware playlist resolution
  - [x] Modify `playForMood()` to select age-aware content
  - [x] Integrate detection into `predictWebcam()` loop
  - [x] Update agent decision loop to use age-aware mood resolution
  - [x] Update HUD with Age, Gender, and Age Group badges
  - [x] Update agent logs for age/gender decisions
- [x] Update styles.css for new age/gender HUD elements
- [x] Test and verify locally

## Implementation Summary

### Age Groups
- **Kids (0-13)**: Displays kid-friendly content (educational, nursery rhymes, kids songs, cartoons)
- **Teen (13-22)**: Displays teen content (pop music, educational, science, vlogs)
- **Adult (22+)**: Displays adult good content (trending, music, documentaries, podcasts)

### Technical Details
- Uses **MediaPipe FaceLandmarker** for real-time emotion detection (happy, sad, stressed, bored, neutral)
- Uses **face-api.js** (`@vladmandic/face-api`) for age and gender detection via `TinyFaceDetector` + `AgeGenderNet`
- Age/gender detection runs throttled at **every 2 seconds** to preserve performance
- All content playlists are organized as `{ageGroup}{Mood}` (e.g., `kidsHappy`, `teenEnergy`, `adultCalm`)
- The agent automatically resolves mood to age-appropriate playlists using `resolveAgeMood()`
- Manual mood override buttons are mapped to age-aware playlists
- All video content is age-appropriate and safe for respective groups

