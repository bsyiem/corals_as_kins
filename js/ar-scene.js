/**
 * ar-scene.js
 *
 * Registers the `target-handler` A-Frame component.
 * This component is placed on the <a-entity mindar-image-target> element
 * and listens for MindAR's targetFound / targetLost events.
 *
 * It coordinates with stage-manager.js and ui-overlay.js via a simple
 * publish/subscribe pattern using custom DOM events on document.
 *
 * Must be loaded BEFORE ar.html finishes parsing the <a-scene>.
 */

(function () {
    'use strict';

    AFRAME.registerComponent('target-handler', {
        init: function () {
            const video          = document.getElementById('coral-video');
            const scanOverlay    = document.getElementById('scanning-overlay');
            const uiOverlay      = document.getElementById('ui-overlay');

            // ── Target found: poster is in view ──────────────────────────
            this.el.addEventListener('targetFound', () => {
                // Hide scanning UI
                scanOverlay.classList.add('hidden');
                // Show AR UI overlay (accessibility: make discoverable)
                uiOverlay.classList.add('active');
                uiOverlay.removeAttribute('aria-hidden');

                // Attempt video playback — must be inside user-gesture chain.
                // The user tapped "Start experience" on index.html which triggered
                // navigation, so we are inside an active user gesture session.
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.catch((err) => {
                        // Autoplay blocked — fire event so stage manager can handle
                        console.warn('[AR] video.play() blocked:', err.message);
                        document.dispatchEvent(new CustomEvent('ar:playbackBlocked'));
                    });
                }

                document.dispatchEvent(new CustomEvent('ar:targetFound'));
            });

            // ── Target lost: poster left the frame ───────────────────────
            this.el.addEventListener('targetLost', () => {
                video.pause();

                scanOverlay.classList.remove('hidden');
                uiOverlay.classList.remove('active');
                uiOverlay.setAttribute('aria-hidden', 'true');

                document.dispatchEvent(new CustomEvent('ar:targetLost'));
            });
        }
    });

    // ── MindAR system events ──────────────────────────────────────────────
    // Update scanning status text as MindAR initialises.
    document.addEventListener('DOMContentLoaded', () => {
        const scene         = document.querySelector('a-scene');
        const statusEl      = document.getElementById('scanning-status');
        if (!scene || !statusEl) return;

        scene.addEventListener('arReady', () => {
            statusEl.textContent = 'Scanning for poster…';
            statusEl.classList.add('ready');
        });

        scene.addEventListener('arError', (e) => {
            console.error('[AR] Scene error:', e.detail);
            statusEl.textContent = 'Camera error — please reload and allow camera access.';
        });

        // A-Frame loaded (assets ready, but AR not yet started)
        scene.addEventListener('loaded', () => {
            if (statusEl.textContent === 'Initialising camera…') {
                statusEl.textContent = 'Starting camera…';
            }
        });
    });

})();
