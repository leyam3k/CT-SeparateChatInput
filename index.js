import { extension_settings } from "../../../extensions.js";
import { saveSettingsDebounced } from "../../../../script.js";

const extensionName = "CT-SeparateChatInput";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// Default Settings
const defaultSettings = {
  buttonOrder: {}, // Map of elementID -> order (number)
  topBarHidden: false,
};

// Initialize Settings
function loadSettings() {
  extension_settings[extensionName] = extension_settings[extensionName] || {};
  // Merge defaults
  for (const key in defaultSettings) {
    if (!Object.hasOwn(extension_settings[extensionName], key)) {
      extension_settings[extensionName][key] = defaultSettings[key];
    }
  }
}

// Save Settings
function saveSettings() {
  saveSettingsDebounced();
}

/**
 * Main Logic
 */
jQuery(async () => {
  // 1. Load Settings
  loadSettings();

  // 2. Load Settings HTML
  const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
  $("#extensions_settings").append(settingsHtml);

  // 3. Setup Layout
  const $form = $("#send_form");
  const $textarea = $("#send_textarea");

  // Ensure Placeholder exists for Hider Button
  if ($("#ct-sci-placeholder").length === 0) {
    $("#nonQRFormItems").append(
      '<div id="ct-sci-placeholder" class="interactable" title="TopBar Hider Placeholder"></div>',
    );
  }

  if ($form.length === 0 || $textarea.length === 0) {
    console.error(`${extensionName}: Required elements not found.`);
    return;
  }

  console.log(`${extensionName}: Initializing layout...`);

  // Apply main class
  $form.addClass("ct-separate-chat-input");

  // Create the Control Bar container
  let $controlBar = $("#ct-sci-control-bar");
  if ($controlBar.length === 0) {
    $controlBar = $('<div id="ct-sci-control-bar"></div>');
    $form.append($controlBar);
  }

  // Move Textarea to top (Prepend to form)
  // Note: CSS handles the visual ordering, but moving it in DOM ensures width behavior is consistent
  $form.prepend($textarea);

  /**
   * Function to identify and relocate buttons
   */
  const relocateButtons = () => {
    const settings = extension_settings[extensionName];
    const buttonOrder = settings.buttonOrder || {};

    // 1. Setup Groups
    // We create a "Right Group" to hold the Send button and its alternates (Stop, Impersonate, etc.)
    // This ensures they stay together and push to the right as a unit.
    let $rightGroup = $("#ct-sci-right-group");
    if ($rightGroup.length === 0) {
      $rightGroup = $('<div id="ct-sci-right-group"></div>');
      $controlBar.append($rightGroup);
    }

    // 2. Identify and Move Fixed/Grouped Buttons
    const $optionsBtn = $("#options_button");

    // List of buttons that belong in the Right Group (Send area)
    const rightGroupIds = [
      "send_but",
      "mes_stop",
      "mes_impersonate",
      "mes_continue",
      "stscript_continue",
      "stscript_pause",
      "stscript_stop",
    ];

    // Move Options Button (Left)
    if ($optionsBtn.parent().attr("id") !== "ct-sci-control-bar") {
      $controlBar.append($optionsBtn);
    }

    // Move Right Group Buttons
    rightGroupIds.forEach((btnId) => {
      const $btn = $(`#${btnId}`);
      if (
        $btn.length > 0 &&
        $btn.parent().attr("id") !== "ct-sci-right-group"
      ) {
        $rightGroup.append($btn);
      }
    });

    // 3. Identify and Move Dynamic Buttons
    // We look for interactable elements in the original containers or loosely attached to form
    // Exclude the fixed buttons we just moved, and specific functional divs like nonQRFormItems if they are empty

    // Common containers in default ST
    const searchSelectors = [
      "#leftSendForm > .interactable",
      "#rightSendForm > .interactable",
      "#extensionsMenuButton", // Often outside or specific
      "#form_sheld .menu_button", // Sometimes extensions drop here
    ];

    // Helper to process a candidate button
    const processButton = (el) => {
      const $el = $(el);
      const id = $el.attr("id");

      // Skip invalid or already processed
      if (!id) return;
      if (id === "options_button") return; // Handled separately
      if (rightGroupIds.includes(id)) return; // Handled separately
      if (id === "send_textarea") return;
      if ($el.parent().attr("id") === "ct-sci-control-bar") return; // Already moved

      // Skip unwanted specific buttons
      const unwantedIds = [
        "dialogue_del_mes_ok",
        "dialogue_del_mes_cancel",
        "file_form_reset",
      ];
      if (unwantedIds.includes(id)) return;

      // Skip hidden functional elements that shouldn't be buttons (like file inputs)
      if ($el.is('input[type="file"]')) return;

      // Determine Order
      let order = 50; // Default middle
      if (Object.hasOwn(buttonOrder, id)) {
        order = buttonOrder[id];
      } else {
        // Assign a new default order if new
        buttonOrder[id] = 50;
        settings.buttonOrder = buttonOrder; // Update ref just in case
        // We don't save immediately to avoid spam, wait for user interaction or save periodically?
        // Actually, let's not save "discovered" buttons automatically to settings unless user modifies them,
        // but we use the temp value.
      }

      // Move to control bar
      $controlBar.append($el);

      // Set Order (using flex order css)
      $el.css("order", order);
      $el.addClass("ct-sci-dynamic-button");
    };

    // Scan selectors
    searchSelectors.forEach((sel) => {
      $(sel).each((i, el) => processButton(el));
    });

    // Scan for loose buttons in nonQRFormItems that might have been missed
    $("#nonQRFormItems")
      .find(".interactable")
      .each((i, el) => processButton(el));

    // Re-apply styles/orders for fixed buttons
    $optionsBtn.css("order", -9999); // Always Left
    $rightGroup.css("order", 9999); // Always Right
    $optionsBtn.addClass("ct-sci-fixed-button");
    $rightGroup.addClass("ct-sci-right-group");

    // Update Settings UI List
    updateSettingsUI();
  };

  /**
   * Settings UI Population
   */
  const updateSettingsUI = () => {
    const $list = $("#ct-sci-button-list");
    if ($list.length === 0) return;

    $list.empty();
    const settings = extension_settings[extensionName];
    const buttonOrder = settings.buttonOrder;

    // Find all buttons currently in the bar to list them (excluding fixed groups)
    const $buttons = $controlBar
      .children()
      .not("#options_button, #ct-sci-right-group");

    if ($buttons.length === 0) {
      $list.append(
        '<div class="text-muted">No custom buttons detected yet.</div>',
      );
      return;
    }

    $buttons.each((i, el) => {
      const id = $(el).attr("id");
      const title = $(el).attr("title") || id;
      const currentOrder = buttonOrder[id] !== undefined ? buttonOrder[id] : 50;

      const $row = $(`
                <div class="ct-sci-settings-row" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 5px; padding: 5px; border: 1px solid var(--SmartThemeBorderColor); border-radius: 5px;">
                    <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 60%;" title="${id}">${title}</span>
                    <input type="number" class="text_pole" data-id="${id}" value="${currentOrder}" style="width: 60px; text-align: center;">
                </div>
            `);

      // Event listener for order change
      $row.find("input").on("change", function () {
        const newOrder = parseInt($(this).val());
        const btnId = $(this).data("id");

        // Update Settings
        extension_settings[extensionName].buttonOrder[btnId] = newOrder;
        saveSettings();

        // Apply immediately
        $(`#${btnId}`).css("order", newOrder);
      });

      $list.append($row);
    });
  };

  // Run relocation logic
  relocateButtons();

  // --- Top Bar Hider Logic ---

  /**
   * Toggles a CSS class on the body to show/hide the top bar.
   * @param {boolean} hidden - The desired hidden state.
   */
  function setHiddenState(hidden) {
    if (hidden) {
      $("body").addClass("st-top-bar-hidden");
    } else {
      $("body").removeClass("st-top-bar-hidden");
    }
  }

  // Create the button and add it to the page.
  // The ID 'topBarHiderButton' is kept for CSS styling consistency.
  let $toggleButton = $("#topBarHiderButton");
  if ($toggleButton.length === 0) {
    $toggleButton = $('<button id="topBarHiderButton"></button>');
    $("body").append($toggleButton);
  }

  /**
   * Updates the button's icon and title based on the current state.
   */
  function updateButtonUI() {
    const hidden = extension_settings[extensionName].topBarHidden;
    if (hidden) {
      $toggleButton.text("Show");
      $toggleButton.attr("title", "Show Top Bar");
      $toggleButton.html('<i class="fa-solid fa-eye"></i>'); // Use FontAwesome icon
    } else {
      $toggleButton.text("Hide");
      $toggleButton.attr("title", "Hide Top Bar");
      $toggleButton.html('<i class="fa-solid fa-eye-slash"></i>');
    }
  }

  // --- Click Handler ---
  // A simple click now toggles the top bar's visibility.
  $toggleButton.off("click").on("click", function () {
    const currentHidden = extension_settings[extensionName].topBarHidden;
    const newHidden = !currentHidden;

    extension_settings[extensionName].topBarHidden = newHidden;
    setHiddenState(newHidden);
    updateButtonUI();
    // State is not saved to ensure it resets on reload
  });

  // --- Initial Setup for Top Bar Hider ---
  // Always start unhidden on reload
  extension_settings[extensionName].topBarHidden = false;
  setHiddenState(false);
  updateButtonUI();

  // Observer to handle late-loading extensions adding buttons
  const observer = new MutationObserver((mutations) => {
    let needsRelocation = false;
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        needsRelocation = true;
        break;
      }
    }
    if (needsRelocation) {
      relocateButtons();
    }
  });

  // Observe potential sources of new buttons
  const obsConfig = { childList: true, subtree: true };
  const nonQr = document.getElementById("nonQRFormItems");
  if (nonQr) observer.observe(nonQr, obsConfig);

  // Also observe the main form sheld just in case
  const sheld = document.getElementById("form_sheld");
  if (sheld) observer.observe(sheld, { childList: true }); // Shallow check for direct appends

  // Open listener for the settings drawer to refresh list when opened
  $(".inline-drawer-toggle").on("click", function () {
    if ($(this).closest(".ct-separate-chat-input-settings").length > 0) {
      updateSettingsUI();
    }
  });
});
