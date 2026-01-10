(function () {
    // Wait for the DOM to be fully loaded before running the script
    jQuery(async () => {

        // --- MOBILE DETECTION ---
        // This check runs once on startup. We check for touch capability, which is the
        // most reliable way to identify a mobile or tablet device in a web browser.
        const isMobile = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

        // If the device is not mobile, log a message and stop the extension from initializing.
        if (!isMobile) {
            console.log('Focus Input Mode: Desktop device detected. Extension will not activate.');
            return; // Exit the script.
        }

        // If the script continues past this point, it's running on a mobile device.
        console.log('Focus Input Mode: Mobile device detected. Initializing extension.');

        const $textarea = $('#send_textarea');
        let $placeholder = null;
        let isBeingMoved = false;

        const baseTextareaHeight = $textarea.outerHeight();

        function activateRelocatedMode() {
            if ($textarea.hasClass('relocated-input-mode')) {
                return;
            }
            console.log('Focus Input Mode: Relocating textarea');
            isBeingMoved = true;
            $placeholder = $('<div class="textarea-placeholder"></div>');
            $placeholder.css('height', `${baseTextareaHeight}px`);
            $textarea.before($placeholder);
            $textarea.insertAfter('#qr--bar');
            $textarea.addClass('relocated-input-mode');
            $textarea.focus();
            setTimeout(() => { isBeingMoved = false; }, 50);
        }

        function deactivateRelocatedMode() {
            if (!$textarea.hasClass('relocated-input-mode')) {
                return;
            }
            console.log('Focus Input Mode: Returning textarea');
            $textarea.removeClass('relocated-input-mode');
            if ($placeholder) {
                $placeholder.replaceWith($textarea);
                $placeholder = null;
            }
        }

        // The input event activates the mode.
        $textarea.on('input', () => {
            activateRelocatedMode();
        });

        // The blur event handles deactivation.
        $textarea.on('blur', () => {
            if (isBeingMoved) {
                return;
            }
            if ($textarea.data('ignore-blur')) {
                $textarea.data('ignore-blur', false);
                return;
            }
            setTimeout(deactivateRelocatedMode, 150);
        });

        // Compatibility fix for Input History extension.
        const attachHistoryButtonListeners = () => {
            const $historyButtons = $('.stih--button, .stih--arrows');
            if ($historyButtons.length > 0 && !$historyButtons.data('focus-mode-listener-attached')) {
                $historyButtons.data('focus-mode-listener-attached', true);
                $historyButtons.on('mousedown', () => {
                    $textarea.data('ignore-blur', true);
                });
                return true;
            }
            return false;
        };

        const formContainer = document.getElementById('nonQRFormItems');
        if (formContainer) {
            const observer = new MutationObserver(() => {
                attachHistoryButtonListeners();
            });
            observer.observe(formContainer, { childList: true, subtree: true });
            attachHistoryButtonListeners();
        }
        
    });
})();