# Assets folder

This folder is intentionally mostly empty — the real assets are supplied by Dr Anya Salih / Fluoresci Research.

## Required files

| File | Description | Notes |
|------|-------------|-------|
| `poster-target.mind` | Compiled MindAR image target | Compile from `poster.jpg` using the MindAR compiler tool |
| `poster.jpg` | High-res poster reference image | Must be the same image used for target compilation |
| `stage1.mp4` | Daylight coral video | H.264, 1080p, 2–4 Mbps, `+faststart` |
| `stage2.mp4` | Fluorescence video | Same encoding spec |
| `stage3.mp4` | Polyp close-up / microscopy video | Same encoding spec |
| `stage4.mp4` | Stress + bleaching video | Same encoding spec |

## Target compilation

1. Go to https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Upload `poster.jpg`
3. Download the resulting `.mind` file
4. Place it here as `poster-target.mind`

**Important:** The poster image used for compilation must NOT include the QR code area, or the QR code must be positioned far from the main coral image.

## Video encoding (ffmpeg)

```bash
ffmpeg -i input.mov \
  -c:v libx264 -profile:v main -level 4.0 \
  -b:v 3M -maxrate 4M -bufsize 8M \
  -vf scale=1080:-2 -r 30 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  output.mp4
```

The `-movflags +faststart` flag is critical — it moves the moov atom to the start of the file so the video can begin streaming before fully downloading.

## Development placeholders

For development and testing without the real assets, use:

1. **poster-target.mind** — Use MindAR's built-in card example target:
   In `ar.html`, temporarily change:
   ```
   imageTargetSrc: https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind
   ```
   Print or display on screen: https://hiukim.github.io/mind-ar-js-doc/img/examples/card-example.jpg

2. **Stage videos** — Any short video will work. Even a solid colour MP4 allows testing stage transitions.
   Create simple placeholders with ffmpeg:
   ```bash
   ffmpeg -f lavfi -i color=c=0x003322:size=1920x1080:rate=30 -t 10 -c:v libx264 -movflags +faststart stage1.mp4
   ```
