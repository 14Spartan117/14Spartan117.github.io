# Brandon De La Rosa — GitHub Pages Portfolio

This is a static, no-build portfolio package. It includes:

- A compact profile masthead and an About-first biography with an authentic portrait and family photo
- Starfall Defender with the current Vercel link
- JRTC Wargame for Apple Vision Pro with current full-frame Simulator captures
- Drone Delivery Simulator with its Army Vantage browser-twin link and access note
- Global Logistics Drone Simulator as a distinct locally run application with an Apple Vision Pro spatial view
- Retirement Hunter with the current Vercel link
- USNS Montford Point: an on-demand 60-second notional food-logistics film and interactive 3D model delivery
- Responsive navigation, dark/light themes, reduced-motion support, and keyboard-accessible controls

Legacy project entries are not included.

## Preview locally

From this directory:

```bash
python3 -m http.server 4173
```

Then open `http://127.0.0.1:4173/`.

## Publish on GitHub Pages

Copy the contents of this directory to the root of the GitHub Pages repository, then publish through the repository's normal Pages workflow. No compilation step is required.

## Media note

The JRTC gallery uses current, full-frame captures made from the running Apple Vision Pro Simulator. They preserve the complete simulated room and spatial interface rather than replacing the environment or tightly cropping the application. The local-recon source imagery is included separately and labeled as terrain data.

The profile masthead uses the existing Faces of NPS Army portrait. The full-frame Apple Vision Pro Simulator globe capture appears with the Global Logistics Drone Simulator project. No generated or replacement environment is used.

The page defaults to a light reading surface, with a dark masthead and a dark/light theme control that retains a saved preference. The About, Selected work, and Contact anchors remain available, along with the JRTC gallery and on-demand Montford media.

## Checks

```bash
node --test tests/*.test.mjs
git diff --check
```

The profile layout checks cover reading order, navigation targets, saved theme initialization, preserved biography and project order, and on-demand media markup. Browser verification is still needed for responsive layout and interactive playback.

The visual concepts used for implementation are retained under `design/`.
