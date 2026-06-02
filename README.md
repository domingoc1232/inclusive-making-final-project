# Hue - Color Vision Correction for the Web

Hue is a Chrome extension that makes websites more accessible for people with color vision deficiencies. It scans the active page, identifies text/background color pairs that fail WCAG AA contrast thresholds when viewed through a simulated color vision filter, and injects corrected colors in real time. Supports protanopia (red-blind), deuteranopia (green-blind), and tritanopia (blue-blind) simulation using the Brettel/Viénot/Mollon 1997 matrices.

---

## Loading the extension

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (toggle, top-right)
3. Click **Load unpacked** and select the `hue/` folder
4. The Hue icon appears in the toolbar

## Testing with the demo pages

Open any of the standalone demo pages directly in Chrome (File → Open, or drag into a tab):

| File | Demonstrates |
|---|---|
| `hue/demo/protanopia-demo.html` | Red `#CC0000` alert with white text — bg darkens to pass contrast |
| `hue/demo/deuteranopia-demo.html` | Red `#D63B2F` error card with white text — bg darkens to pass contrast |
| `hue/demo/tritanopia-demo.html` | Blue `#0000EE` link on yellow `#FFFF00` — text darkens to pass contrast |

For each demo page:

1. Click the Hue toolbar icon to open the popup
2. Select the matching vision type (e.g. "Protanopia" for the protanopia demo)
3. Toggle **Correction** on — the count of corrected elements appears
4. Observe that previously indistinguishable colors now have sufficient contrast
5. Toggle correction off to compare before/after

## General testing on any page

1. Navigate to any website
2. Open the Hue popup, pick a vision type, and turn correction on
3. The extension injects corrected colors — it adjusts the background when that is the chromatic "meaning carrier" (e.g. a colored badge with white text), or the foreground text color otherwise
4. Switching vision types while correction is on immediately re-scans the page
5. The light/dark toggle in the popup header is cosmetic only (no page interaction)
