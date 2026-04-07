/**
 * stage-manager.js
 *
 * Controls the four-stage progression of the AR experience.
 *
 * Responsibilities:
 *   - Maintain currentStage index
 *   - Handle tap-to-advance anywhere on screen (outside interactive buttons)
 *   - Swap video source with a crossfade transition
 *   - Fire 'stage:changed' event so ui-overlay.js can update captions / dots
 *   - Expose StageManager on window for debugging
 */

(function () {
    'use strict';

    // ── Stage definitions ─────────────────────────────────────────────────
    const STAGES = [
        {
            video:   'assets/stage1.mp4',
            label:   'Daylight',
            caption: 'A coral colony in daylight — as we might see it on the reef.'
        },
        {
            video:   'assets/stage2.mp4',
            label:   'Fluorescence',
            caption: 'The same coral fluorescing — pigments invisible to the naked eye revealed under blue light.'
        },
        {
            video:   'assets/stage3.mp4',
            label:   'Microscopy',
            caption: 'Coral polyps at microscopic scale — each one a living animal, feeding and breathing.'
        },
        {
            video:   'assets/stage4.mp4',
            label:   'Bleaching',
            caption: 'Under thermal stress, fluorescence intensifies before bleaching begins — a last signal before silence.'
        }
    ];

    // Duration of the fade-out/in transition in ms.
    // Must match CSS --stage-fade-ms (or override it here).
    const TRANSITION_MS = 300;

    // ── State ─────────────────────────────────────────────────────────────
    let currentStage       = 0;
    let isTransitioning    = false;
    let isTargetVisible    = false;

    // ── DOM refs (resolved after DOMContentLoaded) ────────────────────────
    let video;
    let transitionOverlay;

    // ── Initialise ────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        video             = document.getElementById('coral-video');
        transitionOverlay = document.getElementById('transition-overlay');

        if (!video || !transitionOverlay) {
            console.error('[StageManager] Required DOM elements not found.');
            return;
        }

        // Bind tap / click on the document (not on specific elements,
        // so the entire screen is a tap target while AR is active).
        document.addEventListener('click',     onScreenTap);
        document.addEventListener('touchend',  onScreenTap, { passive: true });

        // Listen for AR tracking events from ar-scene.js
        document.addEventListener('ar:targetFound', () => { isTargetVisible = true;  });
        document.addEventListener('ar:targetLost',  () => { isTargetVisible = false; });

        // Listen for video-ended event (in case loop is removed in future)
        video.addEventListener('ended', onVideoEnded);

        // Emit initial stage so UI is seeded correctly
        emitStageChanged();
    });

    // ── Tap handler ───────────────────────────────────────────────────────
    function onScreenTap(e) {
        if (!isTargetVisible) return;
        if (isTransitioning)  return;

        // Ignore taps on interactive UI elements
        const target = e.target;
        if (target.closest('#btn-mute') ||
            target.closest('.btn-back') ||
            target.closest('.btn-start')) {
            return;
        }

        advanceStage();
    }

    // ── Stage advancement ─────────────────────────────────────────────────
    function advanceStage() {
        const nextStage = (currentStage + 1) % STAGES.length;
        goToStage(nextStage);
    }

    function goToStage(index) {
        if (isTransitioning) return;
        if (index === currentStage) return;
        if (index < 0 || index >= STAGES.length) return;

        isTransitioning = true;
        currentStage    = index;

        // 1. Fade to black
        transitionOverlay.classList.add('fading-out');

        setTimeout(() => {
            // 2. Swap video source
            swapVideo(STAGES[currentStage].video, () => {
                // 3. Notify UI layer
                emitStageChanged();

                // 4. Fade back in
                transitionOverlay.classList.remove('fading-out');

                setTimeout(() => {
                    isTransitioning = false;
                }, TRANSITION_MS);
            });
        }, TRANSITION_MS);
    }

    // ── Video swap ────────────────────────────────────────────────────────
    /**
     * Replaces the video src and begins playback, then calls callback.
     * We reassign .src directly (faster than removing/adding a <source>)
     * and call .load() to reset the media element's network state.
     */
    function swapVideo(src, callback) {
        const wasMuted = video.muted;
        video.pause();
        video.src     = src;
        video.muted   = wasMuted;    // preserve user's mute choice
        video.load();

        const onCanPlay = () => {
            video.removeEventListener('canplay', onCanPlay);
            const playPromise = video.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(callback)
                    .catch((err) => {
                        console.warn('[StageManager] Playback blocked after swap:', err.message);
                        callback();   // still advance UI even if autoplay fails
                    });
            } else {
                callback();
            }
        };

        video.addEventListener('canplay', onCanPlay);

        // Timeout fallback: if canplay never fires (e.g. 404 asset),
        // advance the UI anyway so experience doesn't get stuck.
        setTimeout(() => {
            video.removeEventListener('canplay', onCanPlay);
            callback();
        }, 4000);
    }

    // ── Video ended ───────────────────────────────────────────────────────
    function onVideoEnded() {
        // Videos loop by default (loop attribute on <video>).
        // This fires only if loop is removed.
        document.dispatchEvent(new CustomEvent('stage:videoEnded', {
            detail: { stage: currentStage }
        }));
    }

    // ── Event emission ────────────────────────────────────────────────────
    function emitStageChanged() {
        document.dispatchEvent(new CustomEvent('stage:changed', {
            detail: {
                index:    currentStage,
                total:    STAGES.length,
                label:    STAGES[currentStage].label,
                caption:  STAGES[currentStage].caption,
                isLast:   currentStage === STAGES.length - 1
            }
        }));
    }

    // ── Public API (for debugging / future external control) ─────────────
    window.StageManager = {
        goToStage,
        advanceStage,
        getCurrentStage: () => currentStage,
        getStages:       () => STAGES,
        getTotalStages:  () => STAGES.length
    };

})();
