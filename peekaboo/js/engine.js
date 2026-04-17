/**
 * 🎮 玩出来 - Peekaboo Engine
 * 婴儿亲子游戏核心引擎
 */

const Peekaboo = {
  // === 基础档案 ===
  baby: {
    name: "小宝",
    birthDate: new Date(2025, 8, 21), // 2025-09-21
    gestationalWeeks: 36,
    gestationalDays: 6,
    // 早产提前量：40周0天 - 36周6天 = 3周1天 = 22天
    prematurityDays: 22,
  },

  // === 发展领域 ===
  domains: {
    GM:   { code: "GM",   emoji: "🏃", name: "大运动",     color: "#FF6B6B" },
    FM:   { code: "FM",   emoji: "✋", name: "精细运动",   color: "#4ECDC4" },
    COG:  { code: "COG",  emoji: "🧠", name: "认知发展",   color: "#45B7D1" },
    LANG: { code: "LANG", emoji: "🗣️", name: "语言发展",   color: "#96CEB4" },
    SE:   { code: "SE",   emoji: "💛", name: "社会情感",   color: "#FFEAA7" },
    SI:   { code: "SI",   emoji: "🌀", name: "感知觉整合", color: "#DDA0DD" },
  },

  // === 月龄计算 ===
  calcAge(referenceDate = new Date()) {
    const birth = this.baby.birthDate;
    const diffMs = referenceDate - birth;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    // 实际月龄
    let actualMonths = (referenceDate.getFullYear() - birth.getFullYear()) * 12 +
                       (referenceDate.getMonth() - birth.getMonth());
    if (referenceDate.getDate() < birth.getDate()) actualMonths--;
    const actualDaysRemain = Math.floor((diffMs - this._monthsToMs(actualMonths, birth)) / (1000 * 60 * 60 * 24));

    // 校正月龄 = 实际月龄 - 早产天数
    const correctedDiffMs = diffMs - (this.baby.prematurityDays * 24 * 60 * 60 * 1000);
    const correctedDate = new Date(birth.getTime() + correctedDiffMs);
    let correctedMonths = (correctedDate.getFullYear() - birth.getFullYear()) * 12 +
                          (correctedDate.getMonth() - birth.getMonth());
    if (correctedDate.getDate() < birth.getDate()) correctedMonths--;
    const correctedTotalDays = Math.floor(correctedDiffMs / (1000 * 60 * 60 * 24));
    const correctedWeeks = Math.floor(correctedTotalDays / 7);
    const correctedDaysRemain2 = correctedTotalDays - (correctedMonths * 30);

    return {
      actualDays: diffDays,
      actualMonths: actualMonths,
      actualDaysRemainder: actualDaysRemain,
      actualWeeks: Math.floor(diffDays / 7),
      correctedDays: Math.max(0, correctedTotalDays),
      correctedMonths: Math.max(0, correctedMonths),
      correctedWeeks: correctedWeeks,
      correctedDaysRemainder: Math.max(0, correctedDaysRemain2),
      displayActual: `${actualMonths}个月${actualDaysRemain}天`,
      displayCorrected: `${Math.max(0, correctedMonths)}个月${Math.max(0, correctedTotalDays - correctedMonths * 30)}天`,
      stage: this._getStage(Math.max(0, correctedMonths)),
    };
  },

  _monthsToMs(months, birth) {
    const d = new Date(birth);
    d.setMonth(d.getMonth() + months);
    return d - birth;
  },

  // === 发展阶段判断 ===
  _getStage(correctedMonths) {
    if (correctedMonths < 4) return { id: 0, name: "早期感知觉建立期", range: "校正0-4月", focus: "建立基本感知通道、视听追踪、安全依恋萌芽" };
    if (correctedMonths < 6) return { id: 1, name: "感知觉觉醒期", range: "校正4-6月", focus: "建立安全依恋、激活感官通道、发展视听追踪" };
    if (correctedMonths < 8) return { id: 2, name: "主动探索期", range: "校正6-8月", focus: "发展抓握、因果认知、坐立稳定、开始爬行预备" };
    if (correctedMonths < 10) return { id: 3, name: "社会认知爆发期", range: "校正8-10月", focus: "爬行、扶站、共同注意力、陌生人焦虑应对" };
    return { id: 4, name: "语言与自主性萌芽期", range: "校正10-12月", focus: "扶走、捏取、理解简单指令、语言爆发前期" };
  },

  // === 周次计算 ===
  getWeekNumber(date = new Date()) {
    const birth = this.baby.birthDate;
    const diffDays = Math.floor((date - birth) / (1000 * 60 * 60 * 24));
    return Math.floor(diffDays / 7) + 1;
  },

  // === 获取本周日期范围 ===
  getWeekRange(date = new Date()) {
    const day = date.getDay();
    const monday = new Date(date);
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      monday: monday,
      sunday: sunday,
      display: `${this._formatDate(monday)} ~ ${this._formatDate(sunday)}`
    };
  },

  _formatDate(d) {
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  },

  _formatDateFull(d) {
    return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  },
};

// === Serve & Return 脚本库 ===
Peekaboo.serveReturnScripts = {
  // 按校正月龄段索引
  "0-4": [
    { serve: "宝宝盯着你的脸，嘴巴微微张开", ret: "凑近面对面，慢慢张大嘴巴模仿她，等待3秒看她是否回应", principle: "镜像模仿是最早的社会学习" },
    { serve: "宝宝发出\"啊~\"或\"哦~\"的声音", ret: "用相同的音调回应她，然后暂停，给她\"轮到你了\"的空间", principle: "轮流对话从婴儿期就开始了" },
    { serve: "宝宝踢腿或挥手", ret: "轻轻握住她的小脚/小手，说\"哇，你在运动呀！\"", principle: "命名动作帮助建立身体意识" },
  ],
  "4-6": [
    { serve: "宝宝伸手去够桌上的物品", ret: "把物品移到她刚好够得到的位置，说\"你想要这个？来，试试看！\"", principle: "在最近发展区内提供支架" },
    { serve: "宝宝对着镜子微笑或拍打", ret: "指着镜中的她说\"这是谁呀？是宝宝！\"，然后指自己\"这是爸爸！\"", principle: "镜像阶段是自我意识的起点" },
    { serve: "宝宝反复把玩具扔到地上", ret: "每次捡起来递给她，说\"掉了！爸爸帮你捡~给你！\"（至少配合5次）", principle: "\"扔-捡\"是因果关系学习，不是捣乱" },
  ],
  "6-8": [
    { serve: "宝宝在你离开房间时哭泣或张望", ret: "先用声音回应\"爸爸在这里！\"再出现，微笑说\"看，爸爸回来了！\"", principle: "客体永久性正在建立，分离焦虑是健康的依恋信号" },
    { serve: "宝宝指向或注视某个方向", ret: "顺着她的目光看过去，说\"你看到了什么？哦，是小狗狗！\"", principle: "共同注意力是语言发展的关键前提" },
    { serve: "宝宝模仿你拍手", ret: "热情地说\"太棒了！拍拍拍！\"然后换一个新动作（如挥手），看她是否跟学", principle: "模仿能力是社会学习的核心引擎" },
  ],
  "8-10": [
    { serve: "宝宝爬向一个新物品，回头看你", ret: "微笑点头说\"去吧，没关系！\"——她在做社会参照，你的表情就是安全信号", principle: "社会参照：宝宝用你的表情判断环境安全性" },
    { serve: "宝宝对陌生人表现出警惕", ret: "把她抱在怀里，平静地说\"没事的，爸爸在这里\"，不强迫她接近陌生人", principle: "陌生人焦虑是认知成熟的标志" },
  ],
  "10-12": [
    { serve: "宝宝把东西递给你", ret: "双手接过，真诚地说\"谢谢宝宝！\"然后递回一个东西\"给你！\"", principle: "\"给予-接受\"是最早的社交互惠" },
    { serve: "宝宝指着某样东西发出声音", ret: "命名它：\"对，那是灯！灯！亮亮的灯！\"重复3次", principle: "在兴趣点上命名，比随机教词有效10倍" },
  ],
};

// === 游戏数据库 ===
Peekaboo.gameDB = {
  // 阶段1: 校正4-6月 - 感知觉觉醒期
  1: {
    weekday: {
      // 周一：感知觉整合 SI
      MON: [
        {
          name: "彩虹光影追踪",
          domains: ["SI", "COG"],
          duration: "15-20分钟",
          materials: ["手机手电筒", "彩色玻璃纸或彩色围巾", "白色墙壁或天花板"],
          scene: "光线较暗的房间，宝宝仰卧或靠坐",
          steps: [
            "用手电筒透过彩色围巾在天花板投射彩色光斑，缓慢移动。",
            "观察宝宝目光追踪方向，从左到右、上到下，速度由慢到快。",
            "当宝宝注视光斑3秒以上，暂停并说\"哇，你看到了！\"等她回应。",
            "让宝宝伸手\"抓\"投影在手上的光斑，体验\"抓不住\"的新奇感。"
          ],
          interaction: "当宝宝转头或烦躁时，立刻减少刺激强度或暂停。追踪30秒后给10秒休息。",
          upgrade: "如果宝宝兴趣浓厚，尝试两个光斑交替出现，观察她是否能在两个之间转移注意力。",
          prematureNote: "光线不要直射眼睛，投射到天花板或墙壁上。早产儿视觉系统更敏感，观察是否频繁眨眼。"
        },
        {
          name: "声音寻宝游戏",
          domains: ["SI", "LANG"],
          duration: "15分钟",
          materials: ["装了少量米的密封瓶", "钥匙串", "轻柔铃铛"],
          scene: "安静房间，宝宝坐在你腿上或躺着",
          steps: [
            "在宝宝右耳侧15cm处轻摇米瓶，等待她转头寻找声源。",
            "换到左耳侧重复，观察她两侧转头的对称性。",
            "在她面前展示声源，让她看到\"声音是从这里来的\"。",
            "把米瓶递给她，鼓励她自己摇——体验\"我能制造声音\"。"
          ],
          interaction: "每次声音后暂停3秒，给她处理信息的时间。她转头了就热情说\"对了，在这里！\"",
          upgrade: "增加第三种不同音色的声源，观察她是否对新声音表现出更大兴趣（新奇偏好）。",
          prematureNote: "声音轻柔开始，逐渐增加。如果宝宝出现惊吓反射（双臂展开），说明声音过大。"
        }
      ],
      // 周二：大运动 GM
      TUE: [
        {
          name: "超级俯卧飞行员",
          domains: ["GM", "SI"],
          duration: "15-20分钟",
          materials: ["柔软浴巾卷成长条", "小镜子", "色彩鲜艳的玩具"],
          scene: "铺好的地垫/床上",
          steps: [
            "浴巾卷放在宝宝胸下做支撑，让她处于舒适的俯卧位，双手可以自由触地。",
            "在她面前20cm放置镜子，让她看到自己的脸——\"哇，谁在那里？\"",
            "缓慢移动玩具从正前方到左右两侧，鼓励她抬头追踪，加强颈背肌肉。",
            "当她撑起上身时，轻轻在她背部画圈抚摸，说\"你好棒，好有力气！\""
          ],
          interaction: "Tummy Time 对这个月龄宝宝可能2-3分钟就会烦躁，没关系！翻回来休息，再试。累计达到10分钟就很好。",
          upgrade: "如果她能撑起较长时间，把玩具放远一点点，激发她前臂爬行的欲望。",
          prematureNote: "早产儿核心肌群发育偏弱，浴巾支撑高度要让她不费力就能抬头。"
        },
        {
          name: "爸爸人体秋千",
          domains: ["GM", "SE"],
          duration: "15分钟",
          materials: ["爸爸的身体", "安全的沙发/床"],
          scene: "客厅沙发或大床",
          steps: [
            "半躺在沙发上，把宝宝放在你的小腿上（面对你），扶稳她的身体。",
            "缓慢抬起小腿做\"秋千\"摆动，嘴里唱\"摇啊摇，摇到外婆桥~\"",
            "在最高点停住，和她对视，说\"飞高高！\"——等她的表情回应。",
            "慢慢放下来，在最低点时脸贴脸，说\"下来啦~亲一个！\""
          ],
          interaction: "摆动幅度从5cm开始，观察她是否开心（笑/手舞足蹈）。如果紧绷或哭，立刻停下抱紧。",
          upgrade: "加入左右方向的轻微摆动，丰富前庭觉刺激维度。",
          prematureNote: "前庭刺激要非常轻柔缓慢，每次摆动后观察2-3秒。"
        }
      ],
      // 周三：认知发展 COG
      WED: [
        {
          name: "魔法消失术",
          domains: ["COG", "SE"],
          duration: "15-20分钟",
          materials: ["轻薄的丝巾或小手帕", "宝宝喜欢的玩具"],
          scene: "宝宝坐在你面前或坐在高脚椅上",
          steps: [
            "拿一个宝宝喜欢的玩具，确保她在注视，然后用丝巾慢慢盖住。",
            "夸张地说\"哎呀，玩具去哪了？\"停顿2秒，观察她的反应。",
            "如果她试图拉开丝巾，热情回应\"你找到了！太聪明了！\"",
            "如果她没反应，你来揭开：\"Peekaboo！在这里！\"表情要惊喜。"
          ],
          interaction: "4-6月龄客体永久性刚萌芽，她可能还不会主动寻找——完全正常！重要的是重复体验\"消失→出现\"。",
          upgrade: "盖住后等待更长时间，或只盖住玩具的一半，降低难度建立成功感。",
          prematureNote: "用半透明丝巾开始，让她隐约能看到玩具轮廓，减少焦虑感。"
        },
        {
          name: "纸杯叠叠乐",
          domains: ["COG", "FM"],
          duration: "15分钟",
          materials: ["3-5个纸杯", "小球或小玩具"],
          scene: "地板或桌面",
          steps: [
            "在她面前把纸杯叠成小塔，说\"叠叠叠~高高的！\"",
            "引导她伸手推倒——\"哗啦！倒了！\"反复建造-推倒3-4次。",
            "把小球放在一个杯子下，翻过来给她看\"球球在哪里？\"",
            "鼓励她翻杯子找球——成功找到就欢呼庆祝。"
          ],
          interaction: "\"建造-推倒\"循环建立因果认知。宝宝推倒时你的惊喜反应是最好的强化。",
          upgrade: "用两个杯子，让她猜球在哪个下面（简化版壳子游戏）。",
          prematureNote: ""
        }
      ],
      // 周四：语言发展 LANG
      THU: [
        {
          name: "爸爸的播音室",
          domains: ["LANG", "SE"],
          duration: "15-20分钟",
          materials: ["无——只需要爸爸的声音"],
          scene: "安静房间，面对面，距离30cm",
          steps: [
            "面对面，用夸张的口型慢慢说\"爸~爸~\"，重复5次，每次间隔3秒。",
            "当她发出任何声音，立刻用同样的声音回应，然后加一个新音节。",
            "用不同语气说同一个词：开心的\"爸爸！\"惊讶的\"爸爸？\"悄悄话\"爸爸~\"",
            "在她\"说话\"时，做出认真倾听的样子，点头说\"嗯嗯，然后呢？\""
          ],
          interaction: "轮流对话的关键：她\"说\"的时候你闭嘴听，她停了你再\"回应\"。像真正的对话一样。",
          upgrade: "引入简单的手势配合语言（挥手=再见，拍手=好棒），多模态强化。",
          prematureNote: "早产儿发声可能偏少，不要急。你的低频声音对她有特殊的镇静和激活效果。"
        },
        {
          name: "身体部位点名游戏",
          domains: ["LANG", "GM"],
          duration: "15分钟",
          materials: ["无"],
          scene: "换尿布时或洗澡后",
          steps: [
            "摸她的鼻子说\"鼻~子~\"，停顿，再摸你自己的鼻子\"爸爸的鼻子！\"",
            "依次进行：眼睛、耳朵、嘴巴、手手、脚脚——每个部位重复2次。",
            "加入触觉变化：轻轻点、画圈摸、呼气吹，配合不同的语调。",
            "当她试图抓你的手或转向你，说\"你知道了！这是XX！\""
          ],
          interaction: "命名身体部位是语言启蒙和身体意识的双重练习。节奏要慢，给她处理的时间。",
          upgrade: "开始用\"你的XX在哪里？\"的问句，看她是否开始有定向反应。",
          prematureNote: ""
        }
      ],
      // 周五：社会情感 SE
      FRI: [
        {
          name: "镜中的我和爸爸",
          domains: ["SE", "COG"],
          duration: "15-20分钟",
          materials: ["安全镜子（不碎的）", "贴纸或小红点（可选）"],
          scene: "镜子前，地板上",
          steps: [
            "抱着她坐在镜子前，指着镜中的她说\"看！宝宝！\"再指自己\"还有爸爸！\"",
            "在镜子前做夸张的表情：大笑、惊讶、眨眼——观察她是否模仿或回应。",
            "玩Peekaboo：用手挡住镜中的脸，再放开——\"爸爸在这里！\"",
            "如果她想摸镜子，让她触碰，感受\"那个宝宝\"的硬冷和真实世界的不同。"
          ],
          interaction: "镜像阶段（约4-6个月开始）她可能把镜中人当成另一个宝宝——这完全正常。你的解说帮助她逐渐建立自我意识。",
          upgrade: "在她鼻子上贴个小贴纸，看她照镜子时是摸镜子还是摸自己的鼻子（标记测试，通常18月后才通过）。",
          prematureNote: ""
        },
        {
          name: "情绪表情秀",
          domains: ["SE", "LANG"],
          duration: "15分钟",
          materials: ["无"],
          scene: "安静房间，面对面",
          steps: [
            "做出大大的微笑，说\"爸爸好开心！\"保持3秒，观察她的表情变化。",
            "做出夸张的惊讶脸，嘴巴张大\"哇！\"看她是否会回应惊讶表情。",
            "假装伤心（嘴角下撇），轻声说\"爸爸有点伤心~\"观察她的社会参照反应。",
            "回到微笑，拥抱她\"不伤心了！因为有宝宝呀！\"强化积极情绪。"
          ],
          interaction: "你是她的情绪镜子。夸张但不吓人。她开始学习\"读\"人脸，这是社会情感的地基。",
          upgrade: "加入肢体语言：开心=拍手，惊讶=双手捂脸，伤心=抱抱。",
          prematureNote: "如果宝宝对伤心表情反应强烈（哭泣），跳过这步，专注正面表情。早产儿情绪调节能力发展较晚。"
        }
      ]
    },
    weekend: {
      saturday: {
        morning: {
          main: {
            name: "感统探索箱",
            domains: ["SI", "FM", "COG"],
            duration: "30分钟",
            materials: ["毛巾", "丝巾", "粗麻布", "冰凉勺子", "温热毛巾", "砂纸（细目）"],
            scene: "地板，铺好的游戏垫上",
            steps: [
              "准备4-5种不同材质的物品，放在宝宝面前的浅篮子里。",
              "让她自由选择触摸，不主导——RIE理念：观察她的自发兴趣。",
              "当她拿起一样东西，你来命名：\"这是毛茸茸的毛巾！摸摸看~\"",
              "引导她用双手同时触摸两种不同材质，体验对比。",
              "如果她把东西放进嘴里（口腔探索期），确保安全后允许——嘴巴也是感官通道。"
            ],
            interaction: "自由探索时间不打扰她。只在她看向你时回应，不在她专注时插话。",
            upgrade: "蒙住她的眼睛（轻轻），只用触觉感受物品，然后揭开看是什么。",
            prematureNote: "一次呈现2-3种即可，过多选择会让早产儿过度刺激。"
          },
          aux: {
            name: "气球慢舞",
            domains: ["SI", "GM"],
            duration: "10分钟",
            materials: ["气球1个（充气不要太满）"],
            scene: "客厅，远离尖锐物品",
            steps: [
              "把气球轻轻拍向空中，它会缓慢下落——完美的视觉追踪速度。",
              "让气球落在宝宝身上，说\"碰！轻轻的~\"",
              "引导她伸手拍打气球，体验\"我的动作→气球飞走\"的因果关系。"
            ],
            interaction: "气球的慢速和不可预测路径是天然的注意力训练器。",
            prematureNote: "气球不要充太满，万一炸了声音小一些。"
          }
        },
        afternoon: {
          outdoor: {
            name: "公园感官漫步",
            domains: ["SI", "LANG", "SE"],
            duration: "30-40分钟",
            materials: ["婴儿推车或背带", "小毯子"],
            steps: [
              "抱着/背着她在小区花园慢走，解说看到的一切：\"看，树！叶子在动~\"",
              "停下来让她摸摸树叶（安全的）、花瓣——\"滑滑的叶子，你摸到了！\"",
              "找一块草地坐下，让她光脚踩草（如果天气暖和）——脚底触觉刺激。",
              "听自然声音：鸟叫、风声、水声——指着声音方向\"听！小鸟在唱歌！\""
            ],
            interaction: "户外是天然的多感官教室。关键是你的解说——把体验转化为语言输入。",
            prematureNote: "避开人多嘈杂的地方，控制在30分钟内。观察是否疲倦（打哈欠、烦躁）。"
          },
          indoor: {
            name: "厨房乐器交响曲",
            domains: ["SI", "COG", "FM"],
            duration: "30分钟",
            materials: ["木勺", "不锈钢碗", "塑料盆", "纸盒"],
            steps: [
              "在她面前摆放不同材质的\"鼓面\"：金属碗、塑料盆、纸盒。",
              "用木勺轮流敲击，夸张地说\"听！当当当！这个声音不一样！\"",
              "把木勺递给她，鼓励她自己敲——任何\"打击\"都给予欢呼。",
              "和她一起\"演奏\"：你敲一下，等她敲一下——\"轮到你了！\""
            ],
            interaction: "不同材质的声音差异训练听觉辨别。\"我敲→声音出现\"是因果认知。",
            prematureNote: ""
          }
        },
        reading: {
          book: "《猜猜我有多爱你》(山姆·麦克布雷尼 著)",
          why: "经典亲子绘本，画面简洁温暖，特别适合爸爸和宝宝的亲密互动时刻。当当/京东均有售。",
          howTo: "0-1岁不是\"读字\"，是\"共享注意力仪式\"——你指着画面，她看你指的方向，你用夸张语调描述，她感受你的声音和情绪。",
          script: [
            "打开书，指着小兔子：\"看！小兔子！\"（等她视线移过来）",
            "\"小兔子说：猜猜我有多爱你？\"（用温柔但夸张的语调）",
            "\"这~~~~么多！\"（把手张到最大，然后拥抱她）",
            "每翻一页都说\"翻！\"让她期待翻页的动作和声音"
          ]
        }
      },
      sunday: {
        morning: {
          name: "周六精选重玩 + 微创新",
          note: "选择周六宝宝最感兴趣的那个游戏重复，但加入一个微小变化。重复是学习的核心机制——宝宝每次重复都在巩固新的神经连接。",
          variations: [
            "材质变化：如果昨天用毛巾，今天换丝巾",
            "颜色变化：如果昨天是红色物品，今天换蓝色",
            "节奏变化：如果昨天节奏慢，今天稍微加快，观察她的适应性"
          ]
        },
        afternoon: {
          name: "日常照料变游戏",
          scenes: [
            {
              scene: "换尿布时",
              script: "每次换尿布时进行\"身体点名\"——摸脚趾说\"1、2、3、4、5！五个小脚趾！\"摸肚子画圈说\"圆圆的肚子！\"把无聊的照料变成期待的游戏时刻。",
              domain: "LANG + GM"
            },
            {
              scene: "洗澡时",
              script: "准备不同温度的小方巾（温水/微凉水各一），轮流放在她手背上——\"暖暖的~\" \"凉凉的~\"。水中放一个浮球和一个沉底的勺子——\"浮上来了！\" \"沉下去了！\"",
              domain: "SI + COG"
            },
            {
              scene: "喂奶/喂辅食时",
              script: "喂辅食前，让她先看看、闻闻食物——\"这是胡萝卜，橙色的！闻闻看~\"每一口之间暂停，等她用动作或声音告诉你\"还要\"——尊重她的节奏就是尊重她的自主性。",
              domain: "COG + SE"
            }
          ]
        }
      }
    },
    // 晨间仪式
    morningRitual: {
      greeting: "每天到床边，用相同的语调说：\"早安，小宝贝~爸爸来啦！\"（保持语调、节奏、用词完全一致）",
      bodyGame: "\"早安操\"——轻轻握住她的双手，做3次开合（\"打~开~合上~\"），然后亲亲她的小手心",
      farewell: "固定告别动作：用食指轻点她的鼻尖，说\"爸爸去上班啦，晚上回来找你玩哦！\"然后挥手\"拜拜~\"",
      whyRepeat: "对早产儿而言，可预测的重复仪式格外重要——它帮助建立神经系统的节律感和安全预期。当\"同样的声音+同样的触碰+同样的词\"每天出现，大脑会形成\"这是安全的\"快速通道，减少对新一天的应激反应。同时，每天的\"离开→回来\"模式是客体永久性的日常训练——爸爸消失了，但爸爸会回来。"
    },
    // 观察记录提示
    observationPrompts: [
      "观察她的视觉追踪：在她面前缓慢移动物品，看她的眼球能否平滑追踪超过90度弧度",
      "观察双手使用：她是否开始用双手同时抓握物品？手是否能在中线（胸前）交汇？",
      "观察发声模式：这周她的\"语言\"有没有新的音节出现？（记录下具体的声音）"
    ]
  },

  // 阶段2: 校正6-8月 - 主动探索期
  2: {
    weekday: {
      MON: [
        {
          name: "彩色光影地垫",
          domains: ["SI", "GM"],
          duration: "15-20分钟",
          materials: ["手电筒", "彩色玻璃纸或彩色围巾", "不同材质的布料（毛巾、丝巾、粗棉布）"],
          scene: "光线较暗的房间，宝宝趴在地垫上",
          steps: [
            "让宝宝趴在游戏垫上（胸下可垫浴巾卷辅助）。用手电筒透过彩色玻璃纸在她面前的地垫上投射彩色光斑。",
            "缓慢移动光斑从左到右，鼓励她抬头并转头追踪——\"哇，彩虹在跑！\"",
            "把不同材质的布料铺在她面前：毛巾→丝巾→粗棉布，让她趴着时双手自由触摸——\"滑滑的！\" \"粗粗的！\"",
            "在她不熟练翻身的那侧放一块特别有趣的布，用声音引导她尝试翻身去够——\"这个好软呀，你要不要摸摸？\""
          ],
          interaction: "趴姿+视觉追踪+触觉探索=多感官整合训练。光斑移动还能自然地引导她抬头和转头，强化颈背肌肉。第4步的翻身引导是温柔的——她尝试就好，不必成功。",
          upgrade: "如果她趴姿很稳了，尝试在她身体两侧交替放置有趣物品，引导她进行连续翻滚（仰→趴→仰）。",
          prematureNote: "光线不要直射眼睛，投射到地面上。趴姿时间根据她的耐受调整——烦躁就翻回来休息。"
        }
      ],
      TUE: [
        {
          name: "爸爸飞机起飞",
          domains: ["GM", "SI"],
          duration: "15-20分钟",
          materials: ["浴巾卷", "小镜子", "色彩鲜艳的玩具"],
          scene: "铺好的地垫或大床上",
          steps: [
            "半躺在沙发/床上，把宝宝趴在你的胸口——面对面。她的手臂搭在你身上，你扶稳她。",
            "慢慢抬起上身15-20度，让她体验\"飞\"的感觉——\"飞机起飞啦~\" 然后慢慢放平。",
            "把她放到地垫上趴好（浴巾卷支撑胸部），在面前放小镜子：\"谁在那里？是宝宝！\"",
            "缓慢移动玩具从正前方到两侧，鼓励她抬头转头追踪。然后把玩具放在她不熟练翻身的那侧，轻声鼓励。",
            "累了就翻回仰卧，你把她轻轻举高\"飞高高~\"放低\"下来啦~亲一个！\"重复3次。"
          ],
          interaction: "爸爸身体上的Tummy Time比地板上有趣得多——有你的面孔、你的声音、你的体温。趴姿+抬头=颈背肌群训练，是翻身和未来爬行的基础。",
          upgrade: "趴在你胸口时，你慢慢左右轻微侧身，让她体验重心微妙变化——温柔的核心训练。",
          prematureNote: "\"飞高高\"幅度从很小开始（10cm），观察她是否开心。前庭刺激要轻柔，每次摆动后观察2-3秒。"
        }
      ],
      WED: [
        {
          name: "双杯魔术秀",
          domains: ["COG", "FM"],
          duration: "15-20分钟",
          materials: ["2个不透明杯子", "宝宝喜欢的小玩具"],
          scene: "桌面或高脚椅前",
          steps: [
            "在宝宝面前，把玩具放在一个杯子下面——动作要慢，确保她全程看到。",
            "问\"宝宝，玩具在哪里？\"等待她的反应（可能盯着正确的杯子或伸手）。",
            "揭开杯子：\"在这里！你好聪明！\"热烈庆祝。",
            "重复5-6次后，尝试交换两个杯子的位置（很慢地），观察她是否跟踪。"
          ],
          interaction: "这是经典的客体永久性(A-not-B)游戏。6-8月她应该能找到单杯隐藏的物品了。",
          upgrade: "增加第三个杯子，或者在她面前把玩具放进杯子后盖上布——双重隐藏。",
          prematureNote: ""
        }
      ],
      THU: [
        {
          name: "动物叫声对话",
          domains: ["LANG", "COG"],
          duration: "15-20分钟",
          materials: ["动物图片或毛绒玩具2-3个"],
          scene: "安静房间，面对面",
          steps: [
            "拿起小猫玩偶：\"小猫！喵~喵~\"用不同节奏说3次。",
            "拿起小狗：\"小狗！汪~汪~\"对比不同动物的声音。",
            "举起两个都让她选：\"你想和谁说话？\"观察她伸手的方向。",
            "模仿她的任何声音，然后加一个动物叫声\"你说了啊~，像小猫的喵~！\""
          ],
          interaction: "动物叫声的拟声词（喵、汪）是最容易的早期词汇。你的声音变化在训练她的音调辨别。",
          upgrade: "加入动作配合：小猫挠挠、小狗摇尾巴。让语言和动作配对。",
          prematureNote: ""
        }
      ],
      FRI: [
        {
          name: "安全翻滚乐园",
          domains: ["SE", "GM"],
          duration: "15-20分钟",
          materials: ["柔软毯子", "靠枕2-3个围成安全区"],
          scene: "地板，用靠枕围出一个柔软的小区域",
          steps: [
            "用靠枕围出一个舒适的\"小窝\"，铺上柔软毯子。让宝宝仰卧在中间。",
            "趴下来和她面对面，脸贴脸说\"爸爸在这里~\"然后慢慢\"消失\"到靠枕后面——\"爸爸去哪了？\"",
            "从不同方向\"出现\"——左边、右边、上方——\"Peekaboo！在这里！\"观察她是否开始期待。",
            "引导她翻身找你：你的声音从她侧面传来，她需要翻过去才能看到你的脸。",
            "每次她成功翻身看到你，热烈回应\"你找到爸爸了！\"然后拥抱。"
          ],
          interaction: "这个游戏结合了Peekaboo经典（客体永久性）和翻身练习。她翻过去的动力不是玩具，而是想找到爸爸——这是依恋驱动的运动发展，比任何训练都有效。",
          upgrade: "\"消失\"的时间逐渐延长（从1秒到3秒），建立她对\"爸爸会回来\"的信任。",
          prematureNote: "确保靠枕围得够紧，翻身时不会滚出安全区。如果她翻身后趴着回不来，温柔帮她翻回。"
        }
      ]
    },
    weekend: {
      saturday: {
        morning: {
          main: {
            name: "翻身大冒险",
            domains: ["GM", "SI", "COG"],
            duration: "25-30分钟",
            materials: ["游戏垫", "色彩鲜艳的玩具3-4个", "小毛巾卷", "铃铛或摇铃"],
            scene: "客厅地板，铺好的大游戏垫上",
            steps: [
              "让宝宝仰卧在游戏垫中央。把她最喜欢的玩具放在她身体一侧（不熟练翻身的那侧），距离刚好需要翻身才能够到。",
              "用声音吸引她：在玩具旁摇铃\"宝宝，看这里！\"——鼓励她向不熟练的方向翻。",
              "如果她尝试但卡住了，轻轻托一下她的髋部帮助完成翻转——\"翻过去了！太棒了！\"",
              "翻到趴姿后，让她在趴位够玩具。当她玩够了开始烦躁，帮她翻回仰卧——同时示范这个翻回动作。",
              "换到另一侧重复，两侧各练习3-4次，中间穿插休息和拥抱。"
            ],
            interaction: "两侧不对称是完全正常的！不熟练的一侧需要更多温柔鼓励，而不是强迫。她每一次尝试——哪怕没成功——都在建立新的运动神经通路。趴→仰的翻回能力通常比仰→趴晚1-2个月出现，不急。",
            upgrade: "当两侧翻身都比较流畅后，把玩具稍微放远一点，让她需要翻身+趴姿伸手够取的组合动作。",
            prematureNote: "早产儿两侧不对称可能更明显。不熟练侧只需温柔引导，绝不勉强。如果她连续3次尝试不成功就明显烦躁，切换到熟练侧让她获得成就感再结束。"
          },
          aux: {
            name: "趴姿探索百宝箱",
            domains: ["SI", "FM", "COG"],
            duration: "10-15分钟",
            materials: ["浅篮子", "不同材质小物品（毛巾角、木环、硅胶勺、丝巾）", "浴巾卷做胸部支撑"],
            scene: "地板游戏垫上",
            steps: [
              "浴巾卷放在宝宝胸下做支撑，让趴姿更舒适，双手可以自由活动。",
              "把浅篮子放在她面前10cm处，里面放3-4种不同材质的安全物品。",
              "让她自己选择拿取——不主导，观察她的自发兴趣。当她拿起一样就命名：\"这是滑滑的勺子！\"",
              "她把东西放进嘴里探索？完全OK！嘴巴也是重要的感官通道。"
            ],
            interaction: "趴姿+手部操作=同时训练核心力量和精细运动。有了浴巾支撑，她可以在趴姿待更久，手也更自由。",
            prematureNote: "浴巾支撑高度要合适——让她不费力就能抬头看到前方。一次只呈现3-4样，避免过度刺激。"
          }
        },
        afternoon: {
          outdoor: {
            name: "公园感官毯",
            domains: ["SI", "LANG", "SE"],
            duration: "30分钟",
            materials: ["大野餐毯", "遮阳帽", "1-2个随身玩具"],
            steps: [
              "找一片阴凉的草地铺好野餐毯。让宝宝仰卧，看看树叶和天空——\"看！叶子在动～风吹的！\"",
              "让她趴着，面前放一片安全的大树叶让她摸：\"这是树叶，粗粗的～\"再摸摸毯子\"滑滑的！\"",
              "抱起她，让她光脚轻轻踩草地（你扶着她站立片刻）——脚底触觉刺激是天然的感统训练。",
              "安静地抱着她坐在草地上听自然声音：鸟叫、风声、远处的说话声——指着声音方向\"听！小鸟在唱歌！\""
            ],
            interaction: "户外的意义不在于运动强度，而在于多感官的自然浸泡。关键是你的'解说'——把宝宝的每个体验转化为语言输入。她不需要爬来爬去，躺着感受就很好。",
            prematureNote: "避开人多嘈杂的地方。控制在30分钟内。注意防晒，观察疲倦信号（打哈欠、烦躁、揉眼）。"
          },
          indoor: {
            name: "泡泡仰望秀",
            domains: ["SI", "FM", "COG"],
            duration: "15-20分钟",
            materials: ["泡泡液", "吹泡泡棒"],
            steps: [
              "让宝宝仰卧或靠在你身上呈半躺姿势。在她上方轻轻吹泡泡。",
              "泡泡缓慢下落——\"看！泡泡～圆圆的！\"观察她的目光追踪。",
              "吹低一些，让泡泡落在她身上或手上——\"碰！破了！\" 她可能会惊喜地挥手。",
              "如果她伸手去拍——太棒了！\"你打到了！再来一个？\"每次碰到就是因果认知的强化。",
              "让她趴着时也吹几个低飞的泡泡在她面前——趴姿抬头追踪泡泡是天然的颈部力量训练。"
            ],
            interaction: "泡泡的慢速和不可预测轨迹是完美的视觉追踪训练器。不需要爬行追逐——仰卧追视和趴姿抬头追视就是最好的练习。",
            prematureNote: "确保泡泡液安全无毒。避免泡泡直接落在脸上。每次3-5个泡泡就够，给她处理信息的时间。"
          }
        },
        reading: {
          book: "《好饿的毛毛虫》(艾瑞·卡尔 著)",
          why: "洞洞书设计可以让宝宝把手指伸进去——触觉互动！色彩鲜艳，当当/京东经典绘本。宝宝可以仰卧或趴姿翻阅。",
          howTo: "让宝宝靠在你怀里或趴在你腿上看书。这本书最大的互动点是\"手指穿洞\"。每翻一页让宝宝把手指伸进洞里。不必从头到尾读完——她集中注意力在哪一页就停在那一页。",
          script: [
            "\"看！一条小毛毛虫！他好饿好饿~\"（用手指当毛毛虫在书上爬）",
            "\"他吃了一个苹果！\"（引导宝宝手指穿过洞）\"穿过去了！\"",
            "每翻一页用夸张语气数数：\"一个、两个、三个！\"",
            "最后变蝴蝶时展开翅膀：\"变~身！蝴蝶！\"（张开你的手臂，搂紧她）"
          ]
        }
      },
      sunday: {
        morning: {
          name: "周六精选重玩 + 微创新",
          note: "重复是学习的核心。选周六宝宝最投入的那个游戏重复一遍，但加入一个微小变化。她每次重复都在巩固新的神经连接——翻身动作会一次比一次流畅。",
          variations: [
            "翻身练习变化：换到不同的地面（如换一张毯子），让她适应微妙的触感差异",
            "材质变化：百宝箱换一批新材质（凉凉的金属勺、暖暖的毛绒球等）",
            "角色变化：让妈妈在一侧呼唤做翻身引导，爸爸在另一侧——观察她更愿意向谁翻"
          ]
        },
        afternoon: {
          name: "日常照料变游戏",
          scenes: [
            {
              scene: "换尿布时",
              script: "\"翻身小达人\"：换完尿布后，不急着抱起来。轻轻引导她翻个身（趴→仰或仰→趴），每次完成就亲亲她说\"你翻过来啦！\"把换尿布台变成小小翻身训练场。再加上数脚趾——\"1、2、3、4、5！五个小脚趾！\"",
              domain: "GM + LANG"
            },
            {
              scene: "洗澡时",
              script: "\"水中触觉课\"：准备两块小方巾，一块用温水浸湿，一块用微凉水浸湿。轮流放在她手臂上——\"暖暖的～\" \"凉凉的～\"。水中放一个浮球和一个沉底的勺子——\"浮上来了！\" \"沉下去了！\"观察她的表情变化。",
              domain: "SI + COG"
            },
            {
              scene: "穿衣服时",
              script: "\"Peekaboo穿衣版\"：套头衣经过头时\"宝宝去哪了？\"头露出来\"在这里！\"每次穿袖子\"手手在哪里？出来了！\"这个游戏在她能趴能翻的阶段特别好玩——她可能会试图翻身\"逃跑\"。",
              domain: "SE + LANG"
            }
          ]
        }
      }
    },
    morningRitual: {
      greeting: "每天到床边，用相同的语调说：\"早安，小探险家~爸爸来啦！\"（保持语调、节奏、用词完全一致）",
      bodyGame: "\"高高低低操\"——把她轻轻举高\"高高~\"放低\"低低~\"重复3次，最后亲亲额头",
      farewell: "固定告别动作：击掌（轻轻的high five），说\"爸爸去上班啦，你今天也要加油探索哦！拜拜~\"",
      whyRepeat: "在主动探索期，可预测的仪式是她安全基地的锚点。每天稳定的\"出发→回来\"仪式帮助她在分离焦虑开始显现时（6-8月典型表现），建立\"爸爸会回来\"的确定性认知。"
    },
    observationPrompts: [
      "观察翻身模式：她两侧翻身是否对称？不熟练的那侧有没有在进步？趴→仰翻回来的能力有没有变化？",
      "观察趴姿能力：她趴着时能撑多久？手臂是否能伸直撑起上身？头部能否灵活左右转动？",
      "观察因果理解：她是否反复做同一动作观察结果（如反复扔玩具、摇铃铛、拍打物品）？"
    ]
  }
};

// === 辅助函数 ===
Peekaboo.getCurrentWeekGames = function(date = new Date()) {
  const age = this.calcAge(date);
  const stageId = age.stage.id;
  const stageData = this.gameDB[stageId];
  if (!stageData) {
    // fallback to closest stage
    const ids = Object.keys(this.gameDB).map(Number).sort();
    const closest = ids.reduce((a, b) => Math.abs(b - stageId) < Math.abs(a - stageId) ? b : a);
    return this.gameDB[closest];
  }
  return stageData;
};

Peekaboo.getServeReturnTip = function(date = new Date()) {
  const age = this.calcAge(date);
  const cm = age.correctedMonths;
  let key;
  if (cm < 4) key = "0-4";
  else if (cm < 6) key = "4-6";
  else if (cm < 8) key = "6-8";
  else if (cm < 10) key = "8-10";
  else key = "10-12";

  const scripts = this.serveReturnScripts[key] || this.serveReturnScripts["4-6"];
  const weekNum = this.getWeekNumber(date);
  return scripts[weekNum % scripts.length];
};

// === 周计划归档系统 ===
Peekaboo.weeklyPlans = {
  STORAGE_KEY: "peekaboo_weekly_plans",

  // 获取 ISO 周标识 (e.g. "2026-W16")
  getWeekKey(date = new Date()) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    // 周四所在年份决定 ISO 周年
    d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
    const yearStart = new Date(d.getFullYear(), 0, 4);
    const weekNo = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
    return `${d.getFullYear()}-W${String(weekNo).padStart(2, "0")}`;
  },

  // 获取所有归档
  getAll() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "{}");
    } catch { return {}; }
  },

  // 获取某一周的归档
  get(weekKey) {
    return this.getAll()[weekKey] || null;
  },

  // 保存/更新一周的归档
  save(weekKey, planData) {
    const all = this.getAll();
    all[weekKey] = planData;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(all));
  },

  // 获取排序后的所有周 key（最新在前）
  getAllKeys() {
    return Object.keys(this.getAll()).sort().reverse();
  },

  // 为当前周生成并归档计划快照
  archiveCurrentWeek(date = new Date()) {
    const weekKey = this.getWeekKey(date);
    const age = Peekaboo.calcAge(date);
    const games = Peekaboo.getCurrentWeekGames(date);
    const weekRange = Peekaboo.getWeekRange(date);
    const weekNum = Peekaboo.getWeekNumber(date);
    const srTip = Peekaboo.getServeReturnTip(date);

    // 获取本周的 Serve & Return 脚本段
    const cm = age.correctedMonths;
    let srKey;
    if (cm < 4) srKey = "0-4";
    else if (cm < 6) srKey = "4-6";
    else if (cm < 8) srKey = "6-8";
    else if (cm < 10) srKey = "8-10";
    else srKey = "10-12";

    const plan = {
      weekKey: weekKey,
      weekNumber: weekNum,
      dateRange: weekRange.display,
      mondayDate: Peekaboo._formatDateFull(weekRange.monday),
      sundayDate: Peekaboo._formatDateFull(weekRange.sunday),
      archivedAt: new Date().toISOString(),

      // 宝宝月龄快照
      age: {
        actualDisplay: age.displayActual,
        correctedDisplay: age.displayCorrected,
        correctedMonths: age.correctedMonths,
        stageId: age.stage.id,
        stageName: age.stage.name,
        stageRange: age.stage.range,
        stageFocus: age.stage.focus,
      },

      // 游戏数据快照（完整副本，确保历史可回溯）
      stageId: age.stage.id,
      games: JSON.parse(JSON.stringify(games)), // deep clone

      // Serve & Return 快照
      serveReturn: srTip,
      serveReturnKey: srKey,
    };

    this.save(weekKey, plan);
    return plan;
  },

  // 确保当前周已归档（页面加载时调用）
  ensureCurrentWeekArchived(date = new Date()) {
    const weekKey = this.getWeekKey(date);
    const existing = this.get(weekKey);
    if (!existing) {
      return this.archiveCurrentWeek(date);
    }
    return existing;
  },

  // 获取统计摘要
  getSummary() {
    const all = this.getAll();
    const keys = Object.keys(all).sort();
    return {
      totalWeeks: keys.length,
      firstWeek: keys.length > 0 ? keys[0] : null,
      lastWeek: keys.length > 0 ? keys[keys.length - 1] : null,
      plans: all,
    };
  },
};

// === 反馈系统 ===
Peekaboo.feedback = {
  save(data) {
    const feedbacks = this.getAll();
    data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    data.createdAt = new Date().toISOString();
    feedbacks.push(data);
    localStorage.setItem("peekaboo_feedbacks", JSON.stringify(feedbacks));
    return data;
  },
  getAll() {
    try {
      return JSON.parse(localStorage.getItem("peekaboo_feedbacks") || "[]");
    } catch { return []; }
  },
  getByWeek(weekNum) {
    return this.getAll().filter(f => f.weekNumber === weekNum);
  },
  getByDate(dateStr) {
    return this.getAll().filter(f => f.date === dateStr);
  }
};

// === 产品建议系统 ===
Peekaboo.suggestions = {
  save(data) {
    const list = this.getAll();
    data.id = Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    data.createdAt = new Date().toISOString();
    data.status = "pending";
    list.push(data);
    localStorage.setItem("peekaboo_suggestions", JSON.stringify(list));
    return data;
  },
  getAll() {
    try {
      return JSON.parse(localStorage.getItem("peekaboo_suggestions") || "[]");
    } catch { return []; }
  },
  updateStatus(id, status) {
    const list = this.getAll();
    const item = list.find(s => s.id === id);
    if (item) {
      item.status = status;
      item.updatedAt = new Date().toISOString();
      localStorage.setItem("peekaboo_suggestions", JSON.stringify(list));
    }
  }
};

// 导出
if (typeof module !== "undefined") module.exports = Peekaboo;
