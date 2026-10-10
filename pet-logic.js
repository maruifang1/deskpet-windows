(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.PetLogic = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  const LONG_PRESS_MS = 700;
  const DOUBLE_TAP_MS = 500;
  const COMBO_WINDOW_MS = 2000;
  const DRAG_THRESHOLD = 4;
  const FLING_VELOCITY = 1.1;
  const FLING_MAX_HOLD_MS = 400;
  const REACTION_MS = 18000;
  const ANGRY_MS = 30000;

  const FRAMES = {
    morning: "assets/frame.morning.png",
    noon: "assets/frame.noon.png",
    afternoon: "assets/frame.afternoon.png",
    evening: "assets/frame.evening.png",
    night: "assets/frame.night.png",
    charging: "assets/frame.charging.png",
    lowBattery: "assets/frame.lowBattery.png",
    reactHappy: "assets/frame.reactHappy.png",
    reactSurprised: "assets/frame.reactSurprised.png",
    reactSleepy: "assets/frame.reactSleepy.png",
    reactDizzy: "assets/frame.reactDizzy.png",
    reactAngry: "assets/frame.reactAngry.png",
    reactEmbarrassed: "assets/frame.reactEmbarrassed.png",
    reactStretch: "assets/frame.reactStretch.png",
    reactSad: "assets/frame.reactSad.png",
    idleLookLeft: "assets/frame.idleLookLeft.png",
    idleLookRight: "assets/frame.idleLookRight.png",
    walkA: "assets/frame.walkA.png",
    walkB: "assets/frame.walkB.png",
    walkC: "assets/frame.walkC.png",
    walkD: "assets/frame.walkD.png",
    reactDance: "assets/frame.reactDance.png",
  };

  const ANIMATION_ONLY_MOODS = new Set([
    "idleLookLeft",
    "idleLookRight",
    "walkA",
    "walkB",
    "walkC",
    "walkD",
    "reactDance",
  ]);

  const WHISPERS = {
    morning: [
      "早。",
      "起床了，太阳都在看你。",
      "今天又要做人了。",
      "咖啡，快点。",
      "睡够了吗？没睡够也没办法。",
      "早安三件套：睁眼、叹气、开机。",
      "闹钟响了吗？哦，是我在催。",
      "早餐吃了没，别空腹上班。",
      "今天也要好好活着，别太认真。",
      "天气不错，适合假装很有精神。",
      "一杯水，一杯咖啡，一天开始了。",
      "你昨晚几点睡的？我不问，但我知道。",
      "早上好，虽然我的脸不这么写。",
    ],
    noon: [
      "午饭。",
      "吃饭时间，别让胃抗议。",
      "下午的班，想想就烦。",
      "吃点好的，不然没力气摆烂。",
      "午饭吃啥？选择困难自己受。",
      "碳水补上，电量才能撑住。",
      "别点外卖了，出去晒两分钟太阳。",
      "吃完记得歇会儿，胃和眼睛都谢谢你了。",
      "下午还有一堆事，先吃饱再烦。",
      "十二点了，你的胃在敲门。",
      "摸鱼前先干饭，这是原则问题。",
      "吃慢点，别跟世界抢时间。",
      "今天中午允许你奖励自己。",
    ],
    afternoon: [
      "下午了，撑住。",
      "水。眼睛。休息。",
      "又到犯困的时候。",
      "摸会儿鱼也没什么不对。",
      "下午三点的太阳，和你的困意一样准时。",
      "站起来伸个懒腰，我帮你数秒。",
      "还有三小时下班，数学不好的人别算。",
      "咖啡因下去后的下午，全靠意志力。",
      "今天过得怎么样？不好也没关系。",
      "看看窗外，眼睛需要五米以外的远方。",
      "下午茶时间到了，糖分是合法的。",
      "撑住，下班在向你招手。",
      "累了就承认，没人会扣你工资。",
    ],
    evening: [
      "晚上了。",
      "今天辛苦了，世界也是。",
      "晚饭吃什么，给个决定。",
      "夜还长，先歇口气。",
      "下班快乐，这句话免费送你。",
      "晚饭别糊弄，你的胃记着呢。",
      "把工作留在公司，把今天留给自己。",
      "晚上适合散步、发呆、假装没烦恼。",
      "天黑了，该给自己充个电了。",
      "晚饭时间，禁止继续卷。",
      "今天也活着挺过来了，奖励一下。",
      "夜风不错，出去走走再回来。",
      "晚饭好了记得叫我，虽然我不能吃。",
    ],
    night: [
      "夜深了，睡吧。",
      "再不睡，明天会更累。",
      "关灯，闭嘴，睡觉。",
      "晚安。别熬了。",
      "凌晨的脑子只适合睡觉，不适合胡思乱想。",
      "手机放下，被子盖好。",
      "明天的事，明天再说。",
      "你熬的不是夜，是明天的精神。",
      "夜深了，我陪你到睡着为止。",
      "别看了，看完这一条就睡。",
      "晚安，世界也需要你休息。",
      "灯关了，梦才开始。",
      "睡吧，明天我叫你，虽然我做不到。",
    ],
    charging: [
      "在充电。",
      "电量补满中，等会儿见。",
      "谢谢，续一下命。",
      "满电之前别叫我。",
      "插上电，元气加载中。",
      "电来了，我又能行了。",
      "充电中，请勿打扰。",
      "百分之十的快乐正在往回走。",
      "输电线是世界上最温柔的连接。",
      "充着充着，灵魂就回来了。",
      "别拔，再充一会儿。",
      "能量条在涨，别急。",
      "充满之后，给你跳个舞。",
    ],
    lowBattery: [
      "快没电了。",
      "电不够了，找个插座。",
      "要关机了，真的。",
      "最后一句：记得充电。",
      "红血条警告，我撑不了多久了。",
      "电量见底，先把我插上再说。",
      "再聊下去我就黑屏了。",
      "省电模式启动，废话省着说。",
      "快找电源，我不想当场睡着。",
      "剩余电量只够说一句：救救我。",
      "低电量，低电量，听到没。",
      "别等关机了才后悔。",
      "这是我在关机前最后的倔强。",
    ],
    reactHappy: [
      "嗯。还行。",
      "被你摸到，心情+1。",
      "勉强开心一下。",
      "行吧，开心。",
      "这一下，心情值拉满。",
      "被你哄到了，算你厉害。",
      "嘴角已经努力上扬了。",
      "开心到冒泡，就一点点。",
      "这个反应，值一个五星好评。",
      "被你摸出好心情了。",
      "今天的快乐份额到账。",
      "勉强原谅这个世界三秒钟。",
      "行，笑了，满意了吧。",
    ],
    reactSurprised: [
      "……吓我一跳。",
      "干嘛突然。",
      "手怎么这么突然。",
      "啧，被你吓到了。",
      "你手速也太快了。",
      "等一下，我还没准备好。",
      "心脏刚才漏了一拍。",
      "突然袭击，扣分。",
      "吓出残影了。",
      "你按的是我，不是启动键。",
      "这招叫出其不意？学到了。",
      "反应慢是装的，其实被你惊到了。",
      "下次提前打个招呼。",
    ],
    reactSleepy: [
      "困了。",
      "哈欠。别吵。",
      "想睡了……",
      "Zzz。别闹。",
      "眼皮在打架，裁判是我。",
      "再按下去我就当场关机。",
      "困到灵魂出窍。",
      "现在适合盖被子，不适合互动。",
      "哈欠会传染，你也小心。",
      "电量还有，睡意已满。",
      "别戳了，梦里见。",
      "困，但不承认。",
      "晚安……啊不是，现在别睡。",
    ],
    reactDizzy: [
      "晕了晕了。",
      "别戳了，我在转。",
      "再戳我要倒了。",
      "天旋地转，你先停手。",
      "这颗脑袋不是陀螺。",
      "晕到想吐，字面意思。",
      "转多了会坏掉的，真的。",
      "世界在转，我也在转。",
      "晕……谁扶我一下。",
      "再摇下去就散架了。",
    ],
    reactAngry: [
      "真生气了。",
      "哄不好的那种。",
      "哼。这次自己看着办。",
      "你戳得太多了。",
      "再一下，友谊的小船说翻就翻。",
      "生气值已经爆表。",
      "现在哄还来得及，考虑一下。",
      "哼，不理你三秒。",
      "怒气加载中，别火上浇油。",
      "我的忍耐不是无限续杯的。",
    ],
    reactEmbarrassed: [
      "……",
      "别这样看我。",
      "你干嘛盯着我。",
      "脸有点热。",
      "这这这……",
      "再看就收费了。",
      "假装很镇定，其实慌得很。",
      "耳朵是不是红了，你别问。",
      "摸一下就够了，别摸第二下。",
      "咳，换个话题。",
    ],
    reactStretch: [
      "伸个懒腰，继续等。",
      "等你等到腰酸。",
      "好无聊啊……",
      "伸——啊，舒服多了。",
      "等得骨头都响了。",
      "伸个懒腰，假装很忙。",
      "腰说它想下班。",
      "活动一下，不然要长蘑菇了。",
      "拉伸完毕，继续发呆。",
      "这么久了，你都不来看我。",
    ],
    reactSad: [
      "有点委屈了。",
      "你是不是忘了我在。",
      "哼。",
      "蹲在角落画圈圈。",
      "没人理我，我就自己难过一会儿。",
      "眼睛有点酸，风太大。",
      "你忙你的吧，我没事。",
      "我好像被世界遗忘了。",
      "委屈到变形，但还能忍。",
      "再不来，眼泪就要掉下来了。",
    ],
    chat: [
      "在看什么。",
      "屏幕盯太久会瞎。",
      "今天也要好好吃饭。",
      "你知道吗，我其实没有腿。",
      "无聊。陪我聊两句。",
      "休息一下。",
      "别卷了。",
      "窗外的云不错，虽然我出不去。",
      "你今天话好少，是不是累了。",
      "我建议你喝口水，对，现在。",
      "工作没做完不要紧，先喘口气。",
      "你开心我就开心，假的也信。",
      "偷偷告诉你，我现在在想晚饭。",
      "人生难题：中午吃什么，晚上吃什么。",
      "你打字的样子，看起来很忙。",
      "要不要听我讲一个没有腿的冷笑话。",
      "我是黑银配色，不是黑白滤镜。",
      "桌面太乱的话，我不介意帮你盯着。",
      "再不出声，我就要自己哼歌了。",
      "今天过得怎么样，随便说说也行。",
      "别一直盯着我，眼睛会累。",
      "陪你坐一会儿，我哪儿也不去。",
    ],
    combo3: ["第三次了，手感不错。", "够了够了，笑一下行了吧。", "再点就不理你了……骗你的。"],
    combo5: ["晕了晕了。", "别戳了，我在转。", "再戳我要倒了。"],
    combo8: ["真生气了。", "哄不好的那种。", "哼。这次自己看着办。"],
    soothe: ["好吧，原谅你。", "哼，仅此一次。", "这还差不多。"],
    drag: ["别拎我。", "我自己会走。", "放我下来！"],
    drop: ["总算落地了。", "下次轻点。", "还行，没摔着。"],
    fling: ["咻——", "你扔我？！", "晕……"],
    lonely5: [
      "好像没人理我了。",
      "左看看，右看看。",
      "你在忙吗？",
      "我在这边等你半天了。",
      "是不是该主动点个赞提醒你。",
      "一个人待久了，会想自言自语。",
      "屏幕前的你，还在吗？",
      "五分钟了，够你回个消息了。",
    ],
    lonely10: [
      "自己去溜达一下。",
      "一个人也能逛。",
      "吹个泡泡等会儿。",
      "散步去了，有事呼我。",
      "转一圈再回来，希望你在。",
      "泡泡吹完你就来了，我猜的。",
      "溜达使我快乐，一点点。",
      "自己找点乐子，比如数空气。",
    ],
    wake: ["你回来啦。", "醒了醒了。", "还以为你不要我了。"],
    dance: ["满血复活！", "充饱了，蹦两下。", "电量十足。"],
  };

  const WHISPER_FALLBACK = {
    idleLookLeft: "lonely5",
    idleLookRight: "lonely5",
    walkA: "lonely10",
    walkB: "lonely10",
    walkC: "lonely10",
    walkD: "lonely10",
    reactDance: "dance",
  };

  const COMBO_THRESHOLDS = [
    { count: 8, mood: "reactAngry", lineKey: "combo8" },
    { count: 5, mood: "reactDizzy", lineKey: "combo5" },
    { count: 3, mood: "reactHappy", lineKey: "combo3" },
  ];

  const LONELINESS_STAGES = [
    { minutes: 5, mood: "idleLookLeft" },
    { minutes: 10, mood: "walkA" },
    { minutes: 15, mood: "reactSad" },
    { minutes: 20, mood: "reactStretch" },
    { minutes: 30, mood: "reactSleepy" },
  ];

  function moodFor(date, isCharging, batteryLevel) {
    if (isCharging) return "charging";
    if (batteryLevel >= 0 && batteryLevel < 0.2) return "lowBattery";
    const hour = date.getHours();
    if (hour >= 6 && hour < 11) return "morning";
    if (hour >= 11 && hour < 14) return "noon";
    if (hour >= 14 && hour < 18) return "afternoon";
    if (hour >= 18 && hour < 23) return "evening";
    return "night";
  }

  function baseMood(state, now) {
    return moodFor(now, state.battery.isCharging, state.battery.level);
  }

  function reactionActive(state, now) {
    return state.reaction !== null && now.getTime() < state.reactionUntil;
  }

  function angryActive(state, now) {
    return now.getTime() < state.angryUntil;
  }

  function clearAngry(state) {
    state.angryUntil = 0;
  }

  function lonelinessStage(minutes) {
    let current = null;
    for (const stage of LONELINESS_STAGES) {
      if (minutes >= stage.minutes) current = stage;
    }
    return current;
  }

  function effectiveMood(state, now) {
    if (angryActive(state, now)) return "reactAngry";
    if (reactionActive(state, now)) return state.reaction;
    const lonely = lonelinessStage((now.getTime() - state.lastInteractionAt) / 60000);
    if (lonely) return lonely.mood;
    return baseMood(state, now);
  }

  function isReactionMood(mood) {
    return mood.startsWith("react") || ANIMATION_ONLY_MOODS.has(mood);
  }

  function poolFor(mood) {
    if (WHISPERS[mood]) return WHISPERS[mood];
    const key = WHISPER_FALLBACK[mood];
    return (key && WHISPERS[key]) || WHISPERS.morning;
  }

  function pickRandomLine(pool, lastIndex, random) {
    const len = pool.length;
    if (!len) return { text: "", index: -1 };
    const rng = random || Math.random;
    let index = Math.floor(rng() * len);
    if (len > 1 && index === lastIndex) index = (index + 1) % len;
    return { text: pool[index], index };
  }

  function pickDailyLine(pool, daySeed, lastIndex) {
    const len = pool.length;
    if (!len) return { text: "", index: -1 };
    const base = daySeed % len;
    let index = base;
    if (lastIndex !== null && lastIndex !== undefined) {
      const used = (lastIndex - base + len) % len;
      index = (base + ((used + 1) % len)) % len;
    }
    return { text: pool[index], index };
  }

  function dayOfYear(date) {
    const start = new Date(date.getFullYear(), 0, 1);
    return Math.floor((date - start) / 86400000) + 1;
  }

  function classifyGesture({ moved, held, velocity, secondTap }) {
    if (moved) {
      return held < FLING_MAX_HOLD_MS && velocity > FLING_VELOCITY ? "fling" : "drag";
    }
    if (held > LONG_PRESS_MS) return "long";
    if (secondTap) return "double";
    return "tap";
  }

  function comboStep(count) {
    for (const threshold of COMBO_THRESHOLDS) {
      if (count >= threshold.count) {
        return { mood: threshold.mood, lineKey: threshold.lineKey };
      }
    }
    return null;
  }

  function randomTapMood(roll) {
    if (roll < 0.5) return "reactHappy";
    if (roll < 5 / 6) return "reactSurprised";
    return "reactSleepy";
  }

  return {
    FRAMES,
    WHISPERS,
    ANIMATION_ONLY_MOODS,
    LONG_PRESS_MS,
    DOUBLE_TAP_MS,
    COMBO_WINDOW_MS,
    DRAG_THRESHOLD,
    FLING_VELOCITY,
    FLING_MAX_HOLD_MS,
    REACTION_MS,
    ANGRY_MS,
    moodFor,
    baseMood,
    reactionActive,
    angryActive,
    clearAngry,
    effectiveMood,
    isReactionMood,
    poolFor,
    pickRandomLine,
    pickDailyLine,
    dayOfYear,
    classifyGesture,
    comboStep,
    randomTapMood,
    lonelinessStage,
  };
});
