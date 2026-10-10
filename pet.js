const pet = document.getElementById("pet");
const petImage = document.getElementById("pet-image");
const bubble = document.getElementById("bubble");
const soap = document.getElementById("soap");
const menu = document.getElementById("menu");
const LOGIC = window.PetLogic;
const WALK_FRAMES = ["walkA", "walkB", "walkC", "walkD", "walkE", "walkF"];
const BUBBLE_MOODS = {
  reactHappy: "bubble-happy",
  reactSurprised: "bubble-surprised",
  reactSleepy: "bubble-sleepy",
  reactDizzy: "bubble-dizzy",
  reactAngry: "bubble-angry",
  reactEmbarrassed: "bubble-embarrassed",
  reactStretch: "bubble-stretch",
  reactSad: "bubble-sad",
};

const state = {
  battery: { isCharging: false, level: -1 },
  reaction: null,
  reactionUntil: 0,
  angryUntil: 0,
  lastInteractionAt: Date.now(),
  lastTapAt: 0,
  comboCount: 0,
  comboAt: 0,
  dailyDay: null,
  lastDaily: {},
  lastRandom: {},
};

let currentMood = null;
let press = null;
let activePointerId = null;
let longTimer = null;
let longFired = false;
let dragFaceShown = false;
let moveRaf = 0;
let moveSamples = [];
let flinging = false;
let lastWinPos = { x: 0, y: 0 };

function showBubble(text) {
  bubble.textContent = text;
  bubble.classList.remove("hidden");
  for (const cls of Object.values(BUBBLE_MOODS)) bubble.classList.remove(cls);
  const variant = BUBBLE_MOODS[currentMood];
  if (variant) bubble.classList.add(variant);
  clearTimeout(showBubble._timer);
  showBubble._timer = setTimeout(() => bubble.classList.add("hidden"), 4200);
}

function randomLine(mood) {
  const result = LOGIC.pickRandomLine(LOGIC.poolFor(mood), state.lastRandom[mood]);
  state.lastRandom[mood] = result.index;
  return result.text;
}

function specialLine(key) {
  const pool = LOGIC.WHISPERS[key] || LOGIC.WHISPERS.chat;
  const result = LOGIC.pickRandomLine(pool, state.lastRandom[key]);
  state.lastRandom[key] = result.index;
  return result.text;
}

function dailyLine(mood, now) {
  const special = LOGIC.specialDateKey(now);
  if (special) {
    const result = LOGIC.pickRandomLine(LOGIC.WHISPERS[special], state.lastRandom[special]);
    state.lastRandom[special] = result.index;
    return result.text;
  }
  const seed = LOGIC.dayOfYear(now);
  if (seed !== state.dailyDay) {
    state.dailyDay = seed;
    state.lastDaily = {};
  }
  const result = LOGIC.pickDailyLine(LOGIC.poolFor(mood), seed, state.lastDaily[mood]);
  state.lastDaily[mood] = result.index;
  return result.text;
}

function clearPetAnimations() {
  petImage.classList.remove(
    "pet-jump",
    "pet-shake",
    "pet-sway",
    "pet-walk",
    "pet-dance",
    "pet-embarrassed",
    "pet-look-left",
    "pet-look-right"
  );
}

function playAnimation(mood) {
  clearPetAnimations();
  if (mood === "idleLookLeft") {
    petImage.classList.add("pet-look-left");
    return;
  }
  if (mood === "idleLookRight") {
    petImage.classList.add("pet-look-right");
    return;
  }
  if (mood.startsWith("walk")) {
    petImage.classList.add("pet-walk");
    return;
  }
  if (mood === "reactDance") {
    petImage.classList.add("pet-dance");
    return;
  }
  void petImage.offsetWidth;
  if (mood === "reactSurprised" || mood === "reactAngry") {
    petImage.classList.add("pet-shake");
  } else if (mood === "reactDizzy") {
    petImage.classList.add("pet-sway");
  } else if (mood === "reactEmbarrassed") {
    petImage.classList.add("pet-embarrassed");
  } else {
    petImage.classList.add("pet-jump");
  }
  setTimeout(() => petImage.classList.remove("pet-jump", "pet-shake", "pet-sway", "pet-embarrassed"), 900);
}

function triggerReaction(mood) {
  state.reaction = mood;
  state.reactionUntil = Date.now() + LOGIC.REACTION_MS;
  playAnimation(mood);
  render(new Date());
  showBubble(randomLine(mood));
}

function render(now = new Date()) {
  const mood = LOGIC.effectiveMood(state, now);
  if (mood !== currentMood) {
    const previous = currentMood;
    currentMood = mood;
    const frame = LOGIC.FRAMES[mood];
    if (frame) petImage.src = frame;
    if (LOGIC.ANIMATION_ONLY_MOODS.has(mood)) playAnimation(mood);
    else clearPetAnimations();
    toggleSoap(mood);
    const active = LOGIC.reactionActive(state, now) || LOGIC.angryActive(state, now);
    const quietTransition =
      previous !== null && LOGIC.isReactionMood(previous) && !LOGIC.isReactionMood(mood) && !active;
    if (!quietTransition) {
      showBubble(active ? randomLine(mood) : dailyLine(mood, now));
    }
  }
}

function toggleSoap(mood) {
  if (mood.startsWith("walk")) soap.classList.remove("hidden");
  else soap.classList.add("hidden");
}

function setupBattery() {
  if (!navigator.getBattery) return;
  navigator
    .getBattery()
    .then((manager) => {
      const update = () => {
        const wasCharging = state.battery.isCharging;
        state.battery.isCharging = manager.charging;
        state.battery.level = manager.level;
        if (wasCharging && !manager.charging && manager.level >= 0.99) {
          triggerReaction("reactDance");
          showBubble(specialLine("dance"));
        }
        render(new Date());
      };
      manager.addEventListener("chargingchange", update);
      manager.addEventListener("levelchange", update);
      update();
    })
    .catch(() => {});
}

function wakeIfNeeded() {
  const now = new Date();
  const stage = LOGIC.lonelinessStage((now.getTime() - state.lastInteractionAt) / 60000);
  state.lastInteractionAt = now.getTime();
  if (stage && stage.minutes >= 20) {
    triggerReaction("reactHappy");
    showBubble(specialLine("wake"));
    return true;
  }
  return false;
}

function moveWindowTo(x, y) {
  if (!window.deskpet) return;
  window.deskpet.moveWindowTo(x, y);
  lastWinPos = { x, y };
}

async function refreshWindowPosition() {
  if (!window.deskpet) return;
  try {
    const [x, y] = await window.deskpet.getWindowPosition();
    lastWinPos = { x, y };
  } catch {}
}

function animateWindow(from, to, duration, onDone) {
  const start = performance.now();
  const step = (time) => {
    const progress = Math.min(1, (time - start) / duration);
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    moveWindowTo(from.x + (to.x - from.x) * eased, from.y + (to.y - from.y) * eased);
    if (progress < 1) requestAnimationFrame(step);
    else if (onDone) onDone();
  };
  requestAnimationFrame(step);
}

function pointerSpeed() {
  if (moveSamples.length < 2) return 0;
  const first = moveSamples[0];
  const last = moveSamples[moveSamples.length - 1];
  const dt = last.t - first.t;
  if (dt <= 0) return 0;
  return Math.hypot(last.x - first.x, last.y - first.y) / dt;
}

function pointerDirection() {
  if (moveSamples.length < 2) return { x: 0, y: 1 };
  const first = moveSamples[0];
  const last = moveSamples[moveSamples.length - 1];
  const dist = Math.hypot(last.x - first.x, last.y - first.y);
  if (!dist) return { x: 0, y: 1 };
  return { x: (last.x - first.x) / dist, y: (last.y - first.y) / dist };
}

async function flingAway(origin) {
  flinging = true;
  await refreshWindowPosition();
  const direction = pointerDirection();
  const speed = pointerSpeed();
  const distance = Math.min(170, 70 + speed * 90);
  const from = { x: lastWinPos.x, y: lastWinPos.y };
  const to = {
    x: from.x + direction.x * distance,
    y: from.y + direction.y * distance,
  };
  animateWindow(from, to, 420, () => {
    triggerReaction("reactDizzy");
    showBubble(specialLine("fling"));
    petImage.classList.add("pet-walk");
    let walkIndex = 0;
    const walkTimer = setInterval(() => {
      walkIndex = (walkIndex + 1) % WALK_FRAMES.length;
      petImage.src = LOGIC.FRAMES[WALK_FRAMES[walkIndex]];
    }, 160);
    animateWindow(to, origin, 950, () => {
      clearInterval(walkTimer);
      petImage.classList.remove("pet-walk");
      petImage.src = LOGIC.FRAMES.reactDizzy;
      flinging = false;
      render(new Date());
    });
  });
}

function handleTap(now) {
  const isDouble = now - state.lastTapAt < LOGIC.DOUBLE_TAP_MS;
  state.lastTapAt = now;
  if (now - state.comboAt > LOGIC.COMBO_WINDOW_MS) state.comboCount = 0;
  state.comboAt = now;
  state.comboCount += 1;
  const step = LOGIC.comboStep(state.comboCount);
  if (step) {
    if (step.mood === "reactAngry") {
      state.comboCount = 0;
      state.angryUntil = Date.now() + LOGIC.ANGRY_MS;
    }
    triggerReaction(step.mood);
    showBubble(specialLine(step.lineKey));
    return;
  }
  if (isDouble) {
    if (LOGIC.angryActive(state, new Date())) {
      LOGIC.clearAngry(state);
      triggerReaction("reactEmbarrassed");
      showBubble(specialLine("soothe"));
    } else {
      triggerReaction("reactEmbarrassed");
    }
    return;
  } else {
    triggerReaction(LOGIC.randomTapMood(Math.random()));
  }
}

function onPointerDown(event) {
  if (activePointerId !== null || flinging) return;
  activePointerId = event.pointerId;
  try {
    pet.setPointerCapture(event.pointerId);
  } catch {}
  press = {
    startX: event.screenX,
    startY: event.screenY,
    winX: lastWinPos.x,
    winY: lastWinPos.y,
    moved: false,
    at: Date.now(),
  };
  moveSamples = [{ x: event.screenX, y: event.screenY, t: event.timeStamp }];
  longFired = false;
  dragFaceShown = false;
  pet.classList.add("grabbing");
  if (window.deskpet) {
    window.deskpet
      .getWindowPosition()
      .then(([x, y]) => {
        lastWinPos = { x, y };
        if (press && !press.moved) {
          press.winX = x;
          press.winY = y;
        }
      })
      .catch(() => {});
  }
  longTimer = setTimeout(() => {
    if (press && !press.moved && !longFired) {
      longFired = true;
      if (!wakeIfNeeded()) triggerReaction("reactSleepy");
    }
  }, LOGIC.LONG_PRESS_MS);
}

function onPointerMove(event) {
  if (!press || event.pointerId !== activePointerId) return;
  const dx = event.screenX - press.startX;
  const dy = event.screenY - press.startY;
  moveSamples.push({ x: event.screenX, y: event.screenY, t: event.timeStamp });
  moveSamples = moveSamples.filter((sample) => event.timeStamp - sample.t <= 120);
  if (!press.moved && (Math.abs(dx) > LOGIC.DRAG_THRESHOLD || Math.abs(dy) > LOGIC.DRAG_THRESHOLD)) {
    press.moved = true;
    clearTimeout(longTimer);
    wakeIfNeeded();
    if (!dragFaceShown) {
      dragFaceShown = true;
      triggerReaction("reactEmbarrassed");
      showBubble(specialLine("drag"));
    }
  }
  if (press.moved && !moveRaf) {
    moveRaf = requestAnimationFrame(() => {
      moveRaf = 0;
      if (press) moveWindowTo(press.winX + dx, press.winY + dy);
    });
  }
}

function releasePointer(event) {
  try {
    if (pet.hasPointerCapture && pet.hasPointerCapture(event.pointerId)) {
      pet.releasePointerCapture(event.pointerId);
    }
  } catch {}
}

async function onPointerUp(event) {
  if (!press || event.pointerId !== activePointerId) return;
  const held = Date.now() - press.at;
  const moved = press.moved;
  const velocity = pointerSpeed();
  const secondTap = Date.now() - state.lastTapAt < LOGIC.DOUBLE_TAP_MS;
  const gesture = LOGIC.classifyGesture({ moved, held, velocity, secondTap });
  releasePointer(event);
  activePointerId = null;
  clearTimeout(longTimer);
  const dragOrigin = press ? { x: press.winX, y: press.winY } : { x: lastWinPos.x, y: lastWinPos.y };
  press = null;
  pet.classList.remove("grabbing");
  if (flinging) return;
  if (moved) {
    wakeIfNeeded();
    if (gesture === "fling") flingAway(dragOrigin);
    else {
      await refreshWindowPosition();
      triggerReaction("reactHappy");
      showBubble(specialLine("drop"));
    }
    return;
  }
  if (wakeIfNeeded()) return;
  if (longFired) {
    longFired = false;
    return;
  }
  if (gesture === "double" || gesture === "tap") handleTap(Date.now());
}

function onPointerCancel(event) {
  if (!press || event.pointerId !== activePointerId) return;
  releasePointer(event);
  activePointerId = null;
  clearTimeout(longTimer);
  press = null;
  pet.classList.remove("grabbing");
}

pet.addEventListener("pointerdown", onPointerDown);
window.addEventListener("pointermove", onPointerMove);
window.addEventListener("pointerup", onPointerUp);
pet.addEventListener("pointercancel", onPointerCancel);

document.querySelectorAll(".icon-btn").forEach((button) => {
  button.addEventListener("click", () => {
    const mood = button.dataset.reaction;
    if (wakeIfNeeded()) return;
    if (mood === "chat") {
      showBubble(randomLine("chat"));
    } else {
      triggerReaction(mood);
    }
  });
});

function idleAct() {
  const now = new Date();
  if (LOGIC.reactionActive(state, now) || LOGIC.angryActive(state, now) || flinging || !bubble.classList.contains("hidden")) return;
  const roll = Math.random();
  if (roll < 0.4) {
    showBubble(dailyLine(Math.random() < 0.5 ? "chat" : LOGIC.baseMood(state, now), now));
  } else if (roll < 0.7) {
    petImage.classList.remove("pet-jump");
    void petImage.offsetWidth;
    petImage.classList.add("pet-jump");
    setTimeout(() => petImage.classList.remove("pet-jump"), 750);
  }
}

window.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  menu.classList.toggle("hidden");
});
document.getElementById("menu-quit").addEventListener("click", () => {
  window.close();
});
document.body.addEventListener("click", (event) => {
  if (!menu.contains(event.target)) menu.classList.add("hidden");
});

setupBattery();
render(new Date());

setInterval(() => render(new Date()), 30000);
setInterval(() => {
  const now = new Date();
  if (state.reaction !== null && now.getTime() >= state.reactionUntil) {
    state.reaction = null;
    render(now);
  }
  if (state.angryUntil && now.getTime() >= state.angryUntil) {
    state.angryUntil = 0;
    render(now);
  }
}, 5000);
setInterval(idleAct, 45000);
setInterval(() => {
  const now = new Date();
  if (LOGIC.reactionActive(state, now) || LOGIC.angryActive(state, now) || flinging) return;
  const stage = LOGIC.lonelinessStage((now.getTime() - state.lastInteractionAt) / 60000);
  if (!stage || stage.minutes < 5 || stage.minutes >= 10) return;
  const next = currentMood === "idleLookLeft" ? "idleLookRight" : "idleLookLeft";
  currentMood = next;
  petImage.src = LOGIC.FRAMES[next];
  playAnimation(next);
}, 6000);
setInterval(() => {
  const now = new Date();
  if (LOGIC.reactionActive(state, now) || LOGIC.angryActive(state, now) || flinging) return;
  const mood = LOGIC.effectiveMood(state, now);
  if (!LOGIC.FRAMES[mood]) return;
  petImage.classList.add("pet-blink");
  setTimeout(() => petImage.classList.remove("pet-blink"), 150);
}, 4500);
let walkIndex = 0;
setInterval(() => {
  const now = new Date();
  if (LOGIC.reactionActive(state, now) || LOGIC.angryActive(state, now) || flinging) return;
  const stage = LOGIC.lonelinessStage((now.getTime() - state.lastInteractionAt) / 60000);
  if (!stage || stage.minutes < 10 || stage.minutes >= 15) return;
  walkIndex = (walkIndex + 1) % WALK_FRAMES.length;
  petImage.src = LOGIC.FRAMES[WALK_FRAMES[walkIndex]];
}, 160);
