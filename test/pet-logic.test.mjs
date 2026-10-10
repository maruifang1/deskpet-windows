import test from "node:test";
import assert from "node:assert/strict";
import PetLogic from "../pet-logic.js";

const {
  moodFor,
  effectiveMood,
  classifyGesture,
  comboStep,
  pickRandomLine,
  pickDailyLine,
  dayOfYear,
  specialDateKey,
  lonelinessStage,
  clearAngry,
  randomTapMood,
  poolFor,
  classifyWindow,
  windowReminderDue,
  classifyWeather,
  weatherReminderDue,
  morningWeatherDue,
  reminderDue,
  classifyTapZone,
  eventKeyFor,
  upcomingEventKey,
  pickCountdownLine,
  pickWanderTarget,
  pickWakeKey,
  classifyDockEdge,
} = PetLogic;

test("moodFor time boundaries", () => {
  assert.equal(moodFor(new Date(2026, 0, 1, 5, 59), false, 0.8), "night");
  assert.equal(moodFor(new Date(2026, 0, 1, 6, 0), false, 0.8), "morning");
  assert.equal(moodFor(new Date(2026, 0, 1, 10, 59), false, 0.8), "morning");
  assert.equal(moodFor(new Date(2026, 0, 1, 11, 0), false, 0.8), "noon");
  assert.equal(moodFor(new Date(2026, 0, 1, 13, 59), false, 0.8), "noon");
  assert.equal(moodFor(new Date(2026, 0, 1, 14, 0), false, 0.8), "afternoon");
  assert.equal(moodFor(new Date(2026, 0, 1, 17, 59), false, 0.8), "afternoon");
  assert.equal(moodFor(new Date(2026, 0, 1, 18, 0), false, 0.8), "evening");
  assert.equal(moodFor(new Date(2026, 0, 1, 22, 59), false, 0.8), "evening");
  assert.equal(moodFor(new Date(2026, 0, 1, 23, 0), false, 0.8), "night");
});

test("moodFor battery priority", () => {
  assert.equal(moodFor(new Date(2026, 0, 1, 8, 0), true, 0.1), "charging");
  assert.equal(moodFor(new Date(2026, 0, 1, 8, 0), false, 0.19), "lowBattery");
  assert.equal(moodFor(new Date(2026, 0, 1, 8, 0), true, 0.5), "charging");
});

test("effectiveMood precedence and expiry", () => {
  const now = new Date(2026, 0, 1, 8, 0);
  const state = {
    battery: { isCharging: false, level: 0.9 },
    reaction: "reactHappy",
    reactionUntil: now.getTime() + 1000,
    angryUntil: 0,
    lastInteractionAt: now.getTime(),
  };
  assert.equal(effectiveMood(state, now), "reactHappy");
  state.angryUntil = now.getTime() + 1000;
  assert.equal(effectiveMood(state, now), "reactAngry");
  clearAngry(state);
  assert.equal(effectiveMood(state, now), "reactHappy");
  state.reactionUntil = now.getTime() - 1;
  assert.equal(effectiveMood(state, now), "morning");
});

test("effectiveMood loneliness overrides time mood", () => {
  const now = new Date(2026, 0, 1, 8, 0);
  const state = {
    battery: { isCharging: false, level: 0.9 },
    reaction: null,
    reactionUntil: 0,
    angryUntil: 0,
    lastInteractionAt: now.getTime() - 6 * 60000,
  };
  assert.equal(effectiveMood(state, now), "idleLookLeft");
});

test("gesture classification", () => {
  assert.equal(classifyGesture({ moved: false, held: 100, velocity: 0, secondTap: false }), "tap");
  assert.equal(classifyGesture({ moved: false, held: 100, velocity: 0, secondTap: true }), "double");
  assert.equal(classifyGesture({ moved: false, held: 800, velocity: 0, secondTap: false }), "long");
  assert.equal(classifyGesture({ moved: true, held: 500, velocity: 0.2, secondTap: false }), "drag");
  assert.equal(classifyGesture({ moved: true, held: 200, velocity: 1.5, secondTap: false }), "fling");
});

test("combo thresholds escalate", () => {
  assert.equal(comboStep(2), null);
  assert.equal(comboStep(3).mood, "reactHappy");
  assert.equal(comboStep(5).mood, "reactDizzy");
  assert.equal(comboStep(8).mood, "reactAngry");
  assert.equal(comboStep(9).mood, "reactAngry");
});

test("random tap mood weights", () => {
  assert.equal(randomTapMood(0.1), "reactHappy");
  assert.equal(randomTapMood(0.5), "reactSurprised");
  assert.equal(randomTapMood(0.9), "reactSleepy");
});

test("random line never repeats immediately", () => {
  const pool = ["a", "b", "c"];
  let last = null;
  for (let i = 0; i < 20; i++) {
    const result = pickRandomLine(pool, last, () => 0.9);
    assert.notEqual(result.index, last);
    assert.ok(pool.includes(result.text));
    last = result.index;
  }
});

test("daily line rotates deterministically through the pool", () => {
  const pool = ["a", "b", "c", "d", "e"];
  const sequence = [];
  let last = null;
  for (let i = 0; i < 5; i++) {
    const result = pickDailyLine(pool, 2, last);
    sequence.push(result.index);
    last = result.index;
  }
  assert.deepEqual(sequence, [2, 3, 4, 0, 1]);
});

test("dayOfYear", () => {
  assert.equal(dayOfYear(new Date(2026, 0, 1)), 1);
  assert.equal(dayOfYear(new Date(2026, 11, 31)), 365);
});

test("special date keys", () => {
  assert.equal(specialDateKey(new Date(2026, 6, 3)), "special7");
  assert.equal(specialDateKey(new Date(2026, 7, 12)), "special8");
  assert.equal(specialDateKey(new Date(2026, 9, 10)), null);
});

test("loneliness stages escalate and cap", () => {
  assert.equal(lonelinessStage(4.9), null);
  assert.equal(lonelinessStage(5).mood, "idleLookLeft");
  assert.equal(lonelinessStage(10).mood, "walkA");
  assert.equal(lonelinessStage(15).mood, "reactSad");
  assert.equal(lonelinessStage(20).mood, "reactStretch");
  assert.equal(lonelinessStage(30).mood, "reactSleepy");
  assert.equal(lonelinessStage(180).mood, "reactSleepy");
});

test("phrase pools meet Phase 2 volume targets", () => {
  const bigMoods = [
    "morning",
    "noon",
    "afternoon",
    "evening",
    "night",
    "charging",
    "lowBattery",
    "reactHappy",
    "reactSurprised",
    "reactSleepy",
  ];
  for (const mood of bigMoods) {
    assert.ok(PetLogic.WHISPERS[mood].length >= 12, `${mood} should have at least 12 lines`);
  }
  assert.ok(PetLogic.WHISPERS.chat.length >= 20, "chat should have at least 20 lines");
  for (const mood of ["reactDizzy", "reactAngry", "reactEmbarrassed", "reactStretch", "reactSad"]) {
    assert.ok(PetLogic.WHISPERS[mood].length >= 8, `${mood} should have at least 8 lines`);
  }
  assert.ok(PetLogic.WHISPERS.lonely5.length >= 8);
  assert.ok(PetLogic.WHISPERS.lonely10.length >= 8);
  assert.ok(PetLogic.WHISPERS.special7.length >= 4);
  assert.ok(PetLogic.WHISPERS.special8.length >= 4);
  const scenePools = [
    "windowCode",
    "windowVideo",
    "windowMeeting",
    "windowGame",
    "windowBrowsing",
    "weatherSunny",
    "weatherCloudy",
    "weatherRain",
    "weatherSnow",
    "weatherStorm",
    "weatherHot",
    "weatherCold",
    "remind",
    "countdown",
    "holidayNewYear",
    "holidaySpring",
    "holidayQingming",
    "holidayDragon",
    "holidayMidAutumn",
    "holidayNational",
    "tapHead",
    "tapBody",
    "tapFeet",
    "wander",
    "slackVideo",
    "slackGame",
    "wakeMorning",
    "wakeGrumpy",
    "dock",
  ];
  for (const key of scenePools) {
    assert.ok(PetLogic.WHISPERS[key].length >= 4, `${key} should have at least 4 lines`);
  }
});

test("poolFor prefers dedicated pools over fallbacks", () => {
  assert.equal(poolFor("reactEmbarrassed"), PetLogic.WHISPERS.reactEmbarrassed);
  assert.equal(poolFor("idleLookLeft"), PetLogic.WHISPERS.lonely5);
  assert.equal(poolFor("walkA"), PetLogic.WHISPERS.lonely10);
  assert.equal(poolFor("reactDance"), PetLogic.WHISPERS.dance);
});

test("walk frame set exposes the walking frames", () => {
  for (const mood of ["walkA", "walkB", "walkC", "walkD", "walkE", "walkF"]) {
    assert.ok(PetLogic.FRAMES[mood], `${mood} should have a frame`);
    assert.ok(PetLogic.ANIMATION_ONLY_MOODS.has(mood), `${mood} should be animation-only`);
  }
});

test("window classification", () => {
  assert.equal(classifyWindow({ process: "Code", title: "app.py - Visual Studio Code", isFullscreen: false }), "code");
  assert.equal(classifyWindow({ process: "WeMeet", title: "腾讯会议", isFullscreen: false }), "meeting");
  assert.equal(classifyWindow({ process: "msedge", title: "哔哩哔哩 - 视频", isFullscreen: false }), "video");
  assert.equal(classifyWindow({ process: "chrome", title: "Game", isFullscreen: true }), "game");
  assert.equal(classifyWindow({ process: "msedge", title: "news", isFullscreen: false }), "browsing");
  assert.equal(classifyWindow({ process: "electron", title: "DeskPet", isFullscreen: false }), "pet");
  assert.equal(classifyWindow({ process: "explorer", title: "Documents", isFullscreen: false }), "other");
});

test("window reminder respects cooldown and category", () => {
  const now = new Date(2026, 0, 1, 8, 0);
  const cooldown = 15 * 60 * 1000;
  assert.equal(windowReminderDue("code", "video", now, now.getTime() - cooldown, cooldown), true);
  assert.equal(windowReminderDue("code", "video", now, now.getTime() - cooldown + 1, cooldown), false);
  assert.equal(windowReminderDue("video", "video", now, 0, cooldown), false);
  assert.equal(windowReminderDue("code", "other", now, 0, cooldown), false);
});

test("weather classification", () => {
  assert.equal(classifyWeather({ weatherCode: 113, tempC: 22 }), "sunny");
  assert.equal(classifyWeather({ weatherCode: 296, tempC: 22 }), "rain");
  assert.equal(classifyWeather({ weatherCode: 200, tempC: 25 }), "storm");
  assert.equal(classifyWeather({ weatherCode: 395, tempC: 0 }), "storm");
  assert.equal(classifyWeather({ weatherCode: 326, tempC: 0 }), "snow");
  assert.equal(classifyWeather({ weatherCode: 113, tempC: 34 }), "hot");
  assert.equal(classifyWeather({ weatherCode: 116, tempC: 2 }), "cold");
  assert.equal(classifyWeather({ weatherCode: 999, tempC: 20 }), "unknown");
});

test("weather reminder and morning reminder", () => {
  const now = new Date(2026, 0, 1, 8, 0);
  const cooldown = 4 * 60 * 60 * 1000;
  assert.equal(weatherReminderDue("sunny", "rain", now, now.getTime() - cooldown, cooldown), true);
  assert.equal(weatherReminderDue("rain", "rain", now, 0, cooldown), false);
  assert.equal(weatherReminderDue("sunny", "unknown", now, 0, cooldown), false);
  const yesterday = now.getTime() - 24 * 60 * 60 * 1000;
  assert.equal(morningWeatherDue("rain", now, yesterday), true);
  assert.equal(morningWeatherDue("rain", new Date(2026, 0, 1, 11, 0), yesterday), false);
  assert.equal(morningWeatherDue("sunny", now, yesterday), false);
});

test("reminder due boundary", () => {
  const now = new Date(2026, 0, 1, 8, 0);
  const interval = 45 * 60 * 1000;
  assert.equal(reminderDue(now.getTime() - interval, now, interval), true);
  assert.equal(reminderDue(now.getTime() - interval + 1, now, interval), false);
});

test("tap zones", () => {
  assert.equal(classifyTapZone(10, 0, 300, 300), "head");
  assert.equal(classifyTapZone(10, 99, 300, 300), "head");
  assert.equal(classifyTapZone(10, 100, 300, 300), "body");
  assert.equal(classifyTapZone(10, 199, 300, 300), "body");
  assert.equal(classifyTapZone(10, 200, 300, 300), "feet");
  assert.equal(classifyTapZone(10, 20, 0, 0), "body");
});

test("holiday table and countdown", () => {
  assert.equal(eventKeyFor(new Date(2026, 0, 1)), "holidayNewYear");
  assert.equal(eventKeyFor(new Date(2026, 1, 17)), "holidaySpring");
  assert.equal(eventKeyFor(new Date(2028, 4, 28)), "holidayDragon");
  assert.equal(eventKeyFor(new Date(2026, 6, 3)), "special7");
  const upcoming = upcomingEventKey(new Date(2026, 1, 15), 3);
  assert.ok(upcoming);
  assert.equal(upcoming.key, "holidaySpring");
  assert.equal(upcoming.days, 2);
  assert.equal(upcoming.name, "春节");
  const midAutumn = upcomingEventKey(new Date(2026, 8, 23), 3);
  assert.equal(midAutumn.key, "holidayMidAutumn");
  assert.equal(midAutumn.days, 2);
  assert.equal(upcomingEventKey(new Date(2026, 5, 1), 3), null);
});

test("countdown line interpolation", () => {
  const pool = ["还有 {n} 天就是{name}了。"];
  const result = pickCountdownLine(pool, { days: 2, name: "春节" }, null);
  assert.equal(result.text, "还有 2 天就是春节了。");
});

test("wander target stays inside work area", () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  const windowSize = { width: 260, height: 320 };
  const target = pickWanderTarget({ x: 800, y: 800 }, workArea, windowSize, () => 0);
  assert.ok(target.x >= workArea.x && target.x + windowSize.width <= workArea.x + workArea.width);
  assert.ok(target.y >= workArea.y && target.y + windowSize.height <= workArea.y + workArea.height);
  assert.ok(Math.abs(target.x - 800) >= 200 && Math.abs(target.x - 800) <= 450);
});

test("wander target clamps at work area edges", () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  const windowSize = { width: 260, height: 320 };
  const target = pickWanderTarget({ x: 0, y: 0 }, workArea, windowSize, () => 0);
  assert.equal(target.x, 0);
  assert.equal(target.y, 0);
});

test("wake key picks morning or grumpy mood", () => {
  assert.equal(pickWakeKey(() => 0), "wakeMorning");
  assert.equal(pickWakeKey(() => 0.9), "wakeGrumpy");
});

test("dock edge classification", () => {
  const workArea = { x: 0, y: 0, width: 1920, height: 1040 };
  const windowSize = { width: 260, height: 320 };
  assert.equal(classifyDockEdge({ x: 10, y: 800 }, workArea, windowSize, 24), "left");
  assert.equal(classifyDockEdge({ x: 1700, y: 800 }, workArea, windowSize, 24), "right");
  assert.equal(classifyDockEdge({ x: 800, y: 700 }, workArea, windowSize, 24), "bottom");
  assert.equal(classifyDockEdge({ x: 800, y: 500 }, workArea, windowSize, 24), null);
  assert.equal(classifyDockEdge({ x: 0, y: 700 }, workArea, windowSize, 24), "left");
});

test("dock frames exposed", () => {
  assert.ok(PetLogic.FRAMES.dockLeft);
  assert.ok(PetLogic.FRAMES.dockRight);
});
