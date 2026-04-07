/**
 * ui-overlay.js
 *
 * Manages all HTML overlay UI elements:
 *   - Stage indicator dots (top bar)
 *   - Caption bar (stage label + description text)
 *   - Tap-to-continue prompt
 *   - Mute/unmute toggle
 *
 * Listens for:
 *   - 'stage:changed'    emitted by stage-manager.js
 *   - 'stage:videoEnded' emitted by stage-manager.js
 *   - 'ar:targetFound'   emitted by ar-scene.js
 *   - 'ar:targetLost'    emitted by ar-scene.js
 */

(function () {
    'use strict';

    // ── DOM refs ──────────────────────────────────────────────────────────
    let stageIndicators;
    let captionBar;
    let captionLabel;
    let captionText;
    let tapPrompt;
    let btnMute;
    let video;

    // ── State ─────────────────────────────────────────────────────────────
    let totalStages    = 4;
    let currentStage   = 0;
    let isMuted        = true;   // videos start muted (iOS requirement)
    let tapPromptTimer = null;

    // ── Initialise ────────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', () => {
        stageIndicators = document.getElementById('stage-indicators');
        captionBar      = document.getElementById('caption-bar');
        captionLabel    = document.getElementById('caption-stage-label');
        captionText     = document.getElementById('caption-text');
        tapPrompt       = document.getElementById('tap-prompt');
        btnMute         = document.getElementById('btn-mute');
        video           = document.getElementById('coral-video');

        if (!stageIndicators || !captionBar || !btnMute) {
            console.error('[UIOverlay] Required DOM elements not found.');
            return;
        }

        // Mute button
        btnMute.addEventListener('click', (e) => {
            e.stopPropagation();   // don't trigger stage advance
            toggleMute();
        });

        // Stage change events from stage-manager.js
        document.addEventListener('stage:changed',    onStageChanged);
        document.addEventListener('stage:videoEnded', onVideoEnded);

        // Target tracking events
        document.addEventListener('ar:targetFound', onTargetFound);
        document.addEventListener('ar:targetLost',  onTargetLost);
    });

    // ── Stage change handler ──────────────────────────────────────────────
    function onStageChanged(e) {
        const { index, total, label, caption } = e.detail;

        currentStage = index;
        totalStages  = total;

        // Build dots if not yet created (first call), otherwise update
        buildOrUpdateDots(total, index);

        // Update caption with a subtle fade
        updateCaption(label, caption);

        // Hide tap prompt on advance
        hideTapPrompt();
    }

    // ── Dot indicators ────────────────────────────────────────────────────
    function buildOrUpdateDots(total, activeIndex) {
        // Build dots on first render
        if (stageIndicators.children.length !== total) {
            stageIndicators.innerHTML = '';
            for (let i = 0; i < total; i++) {
                const dot = document.createElement('span');
                dot.className    = 'dot';
                dot.setAttribute('role', 'tab');
                dot.setAttribute('aria-label', `Stage ${i + 1}`);
                dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
                if (i === activeIndex) dot.classList.add('active');
                stageIndicators.appendChild(dot);
            }
            return;
        }

        // Update existing dots
        Array.from(stageIndicators.children).forEach((dot, i) => {
            dot.classList.toggle('active', i === activeIndex);
            dot.setAttribute('aria-selected', i === activeIndex ? 'true' : 'false');
        });
    }

    // ── Caption update ────────────────────────────────────────────────────
    function updateCaption(label, text) {
        // Fade out → swap → fade in
        captionBar.classList.add('fading');

        setTimeout(() => {
            captionLabel.textContent = label;
            captionText.textContent  = text;
            captionBar.classList.remove('fading');
        }, 200);
    }

    // ── Tap prompt ────────────────────────────────────────────────────────
    function showTapPrompt() {
        if (tapPromptTimer) clearTimeout(tapPromptTimer);
        tapPrompt.classList.add('visible');

        // Auto-hide after 6 seconds
        tapPromptTimer = setTimeout(hideTapPrompt, 6000);
    }

    function hideTapPrompt() {
        if (tapPromptTimer) {
            clearTimeout(tapPromptTimer);
            tapPromptTimer = null;
        }
        tapPrompt.classList.remove('visible');
    }

    // ── Video ended handler ───────────────────────────────────────────────
    function onVideoEnded() {
        // Only show prompt if we are not on a looping video
        // (loop attribute removed by caller means this event fires)
        showTapPrompt();
    }

    // ── Target tracking ───────────────────────────────────────────────────
    function onTargetFound() {
        hideTapPrompt();
    }

    function onTargetLost() {
        hideTapPrompt();
    }

    // ── Mute toggle ───────────────────────────────────────────────────────
    function toggleMute() {
        isMuted       = !isMuted;
        video.muted   = isMuted;

        const iconMuted   = btnMute.querySelector('.icon-muted');
        const iconUnmuted = btnMute.querySelector('.icon-unmuted');

        if (isMuted) {
            btnMute.setAttribute('aria-label', 'Unmute audio');
            btnMute.classList.remove('unmuted');
            if (iconMuted)   iconMuted.style.display   = '';
            if (iconUnmuted) iconUnmuted.style.display = 'none';
        } else {
            btnMute.setAttribute('aria-label', 'Mute audio');
            btnMute.classList.add('unmuted');
            if (iconMuted)   iconMuted.style.display   = 'none';
            if (iconUnmuted) iconUnmuted.style.display = '';
        }
    }

})();
