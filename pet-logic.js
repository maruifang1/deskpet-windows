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
    walkE: "assets/frame.walkE.png",
    walkF: "assets/frame.walkF.png",
    reactDance: "assets/frame.reactDance.png",
  };

  const ANIMATION_ONLY_MOODS = new Set([
    "idleLookLeft",
    "idleLookRight",
    "walkA",
    "walkB",
    "walkC",
    "walkD",
    "walkE",
    "walkF",
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
      "呼和浩特的早上，想问绥化的你醒了没。",
      "早饭喝点热的，你的胃比代码还娇气。",
      "火鸡面留到中午，早上先好好吃饭。",
      "今天也想给你点一杯奶茶，这次不局促。",
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
      "午饭吃土豆粉还是麻辣烫？我记下来。",
      "少吃点火鸡面，胃会找你算账。",
      "你妈做的饭那么好吃，我以后要多学几道。",
      "干饭别急，胃疼起来我可没法隔屏哄你。",
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
      "下午茶时间到，小甜水可以，胃药不行。",
      "青岛实训的下午，想你想得代码都打歪。",
      "招财和妮妮现在大概又在睡觉。",
      "起来接杯温水，别一直坐着。",
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
      "晚饭时间，你挑食没关系，我按你妈的口味学。",
      "晚上少点外卖，胃经不起天天麻辣烫。",
      "房车旅行下次继续，我负责开车，你负责点奶茶。",
      "今天也辛苦了，老大。",
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
      "别熬夜，胃不舒服更要早点睡。",
      "双床房那次我认了，下次一定订大床房。",
      "晚安，姐姐，梦里见。",
      "你睡着我再睡，假装自己很可靠。",
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
      "电量满了，像你给我的勇气一样足。",
      "充完这格电，继续陪你开黑。",
      "充电中，待会儿陪你去玩 repo。",
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
      "低电量警告，但想你的电量是满的。",
      "快没电了，等我插上再陪你。",
      "最后一句：记得吃胃药，别吃火鸡面。",
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
      "被你摸到，心情值+10086。",
      "和你打游戏输了也开心，真的。",
      "一想到你就想笑，像个傻子一样。",
      "开心，因为你在。",
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
      "吓一跳，还以为你从绥化飞来了。",
      "你手速比我的代码还快。",
      "心脏漏了一拍，因为是你。",
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
      "困了，但想陪你到你睡着。",
      "打完这把就睡，我保证。",
      "胃疼就早点休息，别硬撑。",
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
      "晕了，像第一次见你那天一样。",
      "转晕了，快扶我一下。",
      "晕归晕，想到你心跳还是稳的。",
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
      "哼，气到想给你点十杯奶茶。",
      "生气归生气，晚饭必须好好吃。",
      "哼，除非你下次来内蒙请我吃土豆粉。",
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
      "双床房那次是我的黑历史，别提了。",
      "别笑我，我当时真的只是太紧张。",
      "脸红.jpg，程序员的浪漫就这点水平。",
      "我害羞，但喜欢你这件事从不害羞。",
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
      "伸个懒腰，等你来看我。",
      "活动一下，待会儿继续写代码。",
      "等你等得腰都酸了，姐姐。",
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
      "有点想你了。",
      "呼和浩特到绥化，地图不远，心里很远。",
      "你不在的时候，招财都不怎么理我。",
      "委屈，但忍住了，因为我是大人。",
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
      "你知道吗，认识那天加你微信，是我做过最勇敢的事。",
      "你是我的第一个，也是唯一一个。",
      "你叫我码农，我叫你老大，很配吧。",
      "cosplay的你很好看，素颜的你也很好看。",
      "以后住一起，我做饭你洗碗，或者我全包。",
      "妮妮和招财要一起接过来，猫粮我买。",
      "你的胃归我管，火鸡面限量供应。",
      "巨蟹和摩羯，据说很配，我也这么觉得。",
      "你玩守望我陪玩，你想玩 repo 我也陪你，什么游戏我都学。",
      "做披萨、钓鱼、房车旅行，Steam 里都是我们的回忆。",
      "你那次想给我点奶茶，我其实开心得不行，就是不会接。",
      "下次你来内蒙，我保证不再订双床房……大概。",
      "你妈做的饭我记着呢，等我学成归来做给你吃。",
      "你挑食没关系，我按你爱吃的一家家试。",
      "姐姐这个称呼，现在是并且永远是我的专属。",
      "我在青岛实训，你在绥化，但我每天都在计划我们的以后。",
      "等实训结束，我就想天天跟你住一块。",
      "你身体不太好，我最大的愿望就是你健健康康。",
      "你朋友叫你老大，但在我这儿你只要当个小朋友。",
      "你的生日农历七月十一，我的腊月初三，我都记着。",
    ],
    combo3: [
      "第三次了，手感不错。",
      "够了够了，笑一下行了吧。",
      "再点就不理你了……骗你的。",
      "连点三下，是想让我给你点奶茶吗。",
      "第三次了，再点我就当你是在想我。",
    ],
    combo5: [
      "晕了晕了。",
      "别戳了，我在转。",
      "再戳我要倒了。",
      "晕了，但还能陪你打一把。",
      "别点了，我晕了你也要负责。",
    ],
    combo8: [
      "真生气了。",
      "哄不好的那种。",
      "哼。这次自己看着办。",
      "真生气了，除非你请我吃土豆粉。",
      "生气值爆表，哄不好的那种……除了你。",
    ],
    soothe: ["好吧，原谅你。", "哼，仅此一次。", "这还差不多。", "好吧，原谅你，毕竟是你。", "哼，仅此一次，因为你才破例。"],
    drag: ["别拎我。", "我自己会走。", "放我下来！", "别拎我，我自己会走去找姐姐。", "放我下来，我还要去给你做饭。"],
    drop: ["总算落地了。", "下次轻点。", "还行，没摔着。", "落地了，继续陪你。", "下次轻点，我可是你的专属码农。"],
    fling: ["咻——", "你扔我？！", "晕……", "你扔我？！我晕了但还爱你。", "咻——飞向绥化的方向。"],
    lonely5: [
      "好像没人理我了。",
      "左看看，右看看。",
      "你在忙吗？",
      "我在这边等你半天了。",
      "是不是该主动点个赞提醒你。",
      "一个人待久了，会想自言自语。",
      "屏幕前的你，还在吗？",
      "五分钟了，够你回个消息了。",
      "姐姐是不是在忙。",
      "妮妮和招财都有人陪，我也想。",
      "五分钟了，你是不是把我忘了。",
      "想你，但不想催你。",
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
      "自己去溜达一圈，反正会回来找你。",
      "泡泡吹完，你该来了吧。",
      "一个人逛，心里装的全是你。",
    ],
    wake: ["你回来啦。", "醒了醒了。", "还以为你不要我了。", "你回来啦，我一直在等你。", "醒了，因为听见你的声音。"],
    dance: ["满血复活！", "充饱了，蹦两下。", "电量十足。", "满血复活，这段舞跳给你看。", "电量满格，开心到转圈。"],
    special7: [
      "7月3日，我加了你的微信，那是我做过最勇敢的事。",
      "认识纪念日快乐，老婆。",
      "那天我鼓起勇气点下了添加好友，现在想想还是心跳加速。",
      "从那天起，游戏库、食谱和余生都开始有了你的名字。",
    ],
    special8: [
      "8月12日，你来内蒙找我，我们正式在一起了。",
      "确认关系纪念日快乐，姐姐。",
      "那天双床房是紧张订的，但想和你在一起是真的。",
      "从确认关系那天起，我就想每天跟你住一块。",
    ],
  };

  const WHISPER_FALLBACK = {
    idleLookLeft: "lonely5",
    idleLookRight: "lonely5",
    walkA: "lonely10",
    walkB: "lonely10",
    walkC: "lonely10",
    walkD: "lonely10",
    walkE: "lonely10",
    walkF: "lonely10",
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

  function specialDateKey(date) {
    const month = date.getMonth();
    const day = date.getDate();
    if (month === 6 && day === 3) return "special7";
    if (month === 7 && day === 12) return "special8";
    return null;
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
    specialDateKey,
    classifyGesture,
    comboStep,
    randomTapMood,
    lonelinessStage,
  };
});
