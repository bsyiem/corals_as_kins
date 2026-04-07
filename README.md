# Corals as Kin — AR Poster Experience

Web-based augmented reality experience for the Corals as Kin research project by Dr Anya Salih / Fluoresci Research.

A printed poster of a daylight coral image is displayed in a gallery. Viewers scan a QR code, which opens a webpage that activates the phone camera and overlays video content directly onto the poster — no app install required.

## Tech stack

- **MindAR.js v1.2.5** — browser-based image tracking (TensorFlow.js, works on iOS Safari + Android Chrome without flags)
- **A-Frame v1.6.0** — declarative 3D/AR scene framework
- **Vanilla JavaScript** — no build tools, no bundler
- **Static hosting** — GitHub Pages, Netlify, Vercel, or any static file host

## File structure

```
corals-ar/
├── index.html              Landing page (QR code links here)
├── ar.html                 AR experience
├── assets/
│   ├── poster-target.mind  Compiled MindAR image target
│   ├── poster.jpg          Poster reference image
│   ├── stage1.mp4          Daylight coral video
│   ├── stage2.mp4          Fluorescence video
│   ├── stage3.mp4          Polyp close-up / microscopy video
│   └── stage4.mp4          Stress + bleaching video
├── css/
│   └── styles.css
└── js/
    ├── ar-scene.js         MindAR/A-Frame integration, target tracking events
    ├── stage-manager.js    Stage progression, tap handling, video swapping
    └── ui-overlay.js       Dots, captions, mute button, tap prompt
```

## Experience stages

| # | Label | Description |
|---|-------|-------------|
| 1 | Daylight | Coral colony as seen on the reef |
| 2 | Fluorescence | Fluorescent pigments revealed under blue light |
| 3 | Microscopy | Coral polyps at microscopic scale |
| 4 | Bleaching | Thermal stress — fluorescence before bleaching |

Tap anywhere on screen to advance. Four-stage cycle, wraps back to stage 1.

## Setup

### 1. Prepare assets

See `assets/README-assets.md` for full encoding specifications.

```bash
# Encode a video for web delivery
ffmpeg -i input.mov \
  -c:v libx264 -profile:v main -level 4.0 \
  -b:v 3M -maxrate 4M -bufsize 8M \
  -vf scale=1080:-2 -r 30 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  assets/stage1.mp4
```

### 2. Compile the MindAR target

1. Go to https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload `poster.jpg`
3. Download the `.mind` file → save as `assets/poster-target.mind`

> The QR code area of the poster should be cropped out of the image used for compilation, or positioned so it doesn't interfere with tracking.

### 3. Adjust video plane aspect ratio

In `ar.html`, find `<a-video>` and set `height` to match the poster's aspect ratio:

| Poster ratio | height value |
|---|---|
| 16:9 | `0.5625` (default) |
| 4:3  | `0.75` |
| 3:2  | `0.667` |
| A-series portrait (1:1.414) | `1.414` |

### 4. Local development (HTTPS required)

Camera access requires HTTPS — even on localhost on iOS.

```bash
# Option A: npx serve with SSL
npx serve --ssl

# Option B: ngrok tunnel (for real-device testing on your local network)
npx ngrok http 3000
# → gives you an HTTPS URL accessible from your phone
```

### 5. Deploy

Push to any static host. GitHub Pages works out of the box:

```bash
git init
git add .
git commit -m "Initial commit"
gh repo create corals-as-kin-ar --public --source=. --push
# Enable Pages: repo Settings → Pages → Source: main branch
```

The deployed URL goes on the printed poster as a QR code.

### 6. Generate QR code

```bash
npx qrcode "https://YOUR-DEPLOYED-URL" -o qr.png
```

- Minimum print size: 3cm × 3cm
- Black on white, no embedded logos
- Add label: "Scan to experience in AR"
- Position in a corner that doesn't overlap the main coral image

## iOS / Android compatibility notes

**iOS Safari:**
- Videos must have `playsinline` + `webkit-playsinline` — without these, iOS forces fullscreen
- Videos must start muted — iOS blocks autoplay of unmuted video (unmute button provided)
- Camera access requires HTTPS
- User must tap a button before camera permission is requested (handled by landing page)

**Android Chrome:**
- Works without flags
- Keep `muted` + `playsinline` for consistency

## Performance targets

| Metric | Target |
|--------|--------|
| Landing page first paint | < 1.5s on 4G |
| Time to AR ready | < 5s after tapping Start |
| Total asset bundle | < 20MB |
| Video bitrate | 2–4 Mbps, H.264, 1080p, 30fps |

## Credits

Research: Dr Anya Salih, Fluoresci Research  
AR implementation: Corals as Kin project  
Image tracking: MindAR.js (hiukim)  
3D framework: A-Frame (Mozilla)
