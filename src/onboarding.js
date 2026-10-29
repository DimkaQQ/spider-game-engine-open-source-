/*
 * SPIDER GAME ENGINE (OPEN SOURCE) — first-run tour + Help content
 * One list per platform; both the first-launch tour and Help → Quick Tour read it.
 */
export const TOUR_KEY = "spider-onboarded";

export const tourSeen = () => {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return true;
  }
};
export const markTourSeen = () => {
  try {
    localStorage.setItem(TOUR_KEY, "1");
  } catch {}
};

export const DESKTOP_STEPS = [
  { icon: "play", title: "Welcome to Spider Engine", text: "Build 3D games right in your browser. The starter level is already loaded: a hero on the grass with a few things around. Press Play (top right) to try it." },
  { icon: "move", title: "Walk around", text: "In Play, move with WASD or the arrow keys and jump with Space. Grab the gold coins. Press Stop to go back to editing." },
  { icon: "camera", title: "Look around the scene", text: "While editing, drag in the viewport to orbit, scroll to zoom. The tabs above it switch between Viewport, Cinematic and Game View." },
  { icon: "scene", title: "Select and change things", text: "The Scene panel (left) lists every object. Click one, then use the move / rotate / scale tools on the viewport or the Inspector (right) for exact values, colors and physics." },
  { icon: "add", title: "Add new objects", text: "Open the Content Browser at the bottom and click any shape to drop it into the level. Click again for more." },
  { icon: "ai", title: "Build with words", text: "Ask AI writes a game from a description. It needs a Meta API key: Settings, then AI & Keys. You can also write code yourself in the Scripts tab." },
  { icon: "help", title: "Need this again?", text: "Everything here lives in the Help menu (top bar) under Quick Tour. Hover any icon to see what it does. You can skip now and come back any time." },
];

export const MOBILE_STEPS = [
  { icon: "play", title: "Welcome to Spider Engine", text: "Build 3D games on your phone. A starter level is ready: a hero on the grass with a few things around. Tap Play (top right) to try it." },
  { icon: "move", title: "Walk around", text: "In Play, drag the stick to walk and tap Jump to leap. Collect the gold coins. Tap Stop to go back to editing." },
  { icon: "scene", title: "Select and change things", text: "Tap an object in the viewport, or open the Scene tab. The bar under the viewport opens the Inspector for position, color and physics." },
  { icon: "add", title: "Add new objects", text: "Scene tab, then Library: tap any shape to add it to the level." },
  { icon: "ai", title: "Build with words", text: "The AI tab writes a game from a description. Add your Meta API key in More, then Settings." },
  { icon: "help", title: "Need this again?", text: "Open More, then Help. You can skip now and come back any time." },
];
