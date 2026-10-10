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
