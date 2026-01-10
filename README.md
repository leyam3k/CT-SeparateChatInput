# CT-SeparateChatInput

A SillyTavern/CozyTavern extension that separates the chat input area from the control buttons, placing the text input above a dedicated, customizable button row. This layout is designed to provide a cleaner typing experience and more organized controls, working consistently across both desktop and mobile views.

## Features

- **Dedicated Input Row:** Moves the chat textarea to its own row above the controls, ensuring full width for typing.
- **Organized Control Bar:**
  - **Fixed Positions:** Keeps the "Options" menu on the far left and the "Send" button (including Stop, Impersonate, Continue, etc.) on the far right.
  - **Centered Controls:** Dynamically gathers other buttons (like Extensions, or buttons added by other extensions) and centers them in the middle.
- **Customizable Order:** Includes a settings panel to reorder the centered buttons to your preference.
- **Mobile Friendly:** Designed to work seamlessly on smaller screens.

## Installation

1.  Open SillyTavern.
2.  Navigate to the **Extensions** menu (plug icon).
3.  Select **Install Extension**.
4.  Paste the repository URL: `https://github.com/leyam3k/CT-SeparateChatInput`
5.  Click **Install**.
6.  Reload SillyTavern.

## Usage

Once installed, the layout changes are applied automatically.

### Customizing Button Order

1.  Open the **Extensions** menu.
2.  Find the **Separate Chat Input** settings drawer.
3.  You will see a list of detected buttons (excluding the fixed Options and Send buttons).
4.  Change the "Order" number for any button.
    - **Lower numbers** move the button to the **left**.
    - **Higher numbers** move the button to the **right**.
5.  Changes are applied immediately.

## Compatibility

- Compatible with the latest version of SillyTavern.
- Should work with most third-party extensions that add buttons to the chat form.

## License

This project is licensed under the AGPLv3 License.
