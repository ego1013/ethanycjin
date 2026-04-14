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
          name: "彩色隧道探险",
          domains: ["SI", "GM"],
          duration: "15-20分钟",
          materials: ["大纸箱或床单搭的隧道", "手电筒", "彩色玻璃纸"],
          scene: "客厅地板",
          steps: [
            "用大纸箱或床单搭建一个短隧道，在另一头用手电筒照亮。",
            "让宝宝趴在隧道入口，你在另一头呼唤她：\"宝宝，快来找爸爸！\"",
            "她爬过来时，用彩色光引导方向，到达后热烈庆祝。",
            "反过来你也钻进去，让她在外面看你\"消失\"又\"出现\"。"
          ],
          interaction: "爬行是这个阶段的核心大运动。隧道增加了探索的趣味性和小小的冒险感——这正是爸爸游戏的特色。",
          upgrade: "在隧道里放不同材质的垫子（毛巾、泡沫、软垫），爬过时感受不同触觉。",
          prematureNote: "隧道要短（宝宝身长的1.5倍），确保她能看到你在另一头。"
        }
      ],
      TUE: [
        {
          name: "坐立小骑士",
          domains: ["GM", "COG"],
          duration: "15-20分钟",
          materials: ["大枕头或瑜伽球", "有声玩具"],
          scene: "铺好的地垫上",
          steps: [
            "让宝宝坐在你的大腿上，逐渐减少支撑——你的手从扶腰到扶髋到只扶大腿。",
            "在她面前放有趣的玩具，让她伸手去够——练习坐姿平衡。",
            "坐在大枕头上轻微弹跳，唱\"骑马歌\"：\"驾驾驾，骑大马~\"",
            "当她侧倒时温柔接住，笑着说\"倒了！再来！\"——让跌倒变好玩而非可怕。"
          ],
          interaction: "独立坐是这个阶段的大运动里程碑。关键是让她在安全环境中体验重心变化。",
          upgrade: "在她坐稳时，从侧面递玩具，让她需要转体才能拿到——强化核心。",
          prematureNote: "早产儿坐立可能需要更多支撑，不急于减少辅助。"
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
          name: "信任跌倒游戏",
          domains: ["SE", "GM"],
          duration: "15-20分钟",
          materials: ["软垫", "枕头围成的安全区"],
          scene: "铺满软垫的地板",
          steps: [
            "在软垫区域让宝宝坐着，你坐在她后方。",
            "轻轻让她向后倒，接住她——\"爸爸接住你了！\"",
            "从各个方向轻推——前、左、右（温柔地），每次都接住。",
            "最后让她自由探索在软垫区翻滚——跌倒不可怕，因为爸爸在。"
          ],
          interaction: "这个游戏直接建构\"信任\"——跌倒→被接住→世界是安全的。这是依恋理论的核心体验。",
          upgrade: "让距离稍微大一点点再接住，延长\"信任的悬空时刻\"。",
          prematureNote: "动作极其轻柔，确保每次都稳稳接住。"
        }
      ]
    },
    weekend: {
      saturday: {
        morning: {
          main: {
            name: "爬行障碍赛",
            domains: ["GM", "COG", "SI"],
            duration: "30分钟",
            materials: ["枕头", "毯子", "纸箱隧道", "不同材质垫子"],
            scene: "客厅地板，清出一片区域",
            steps: [
              "用枕头、卷起的毯子建造一条\"赛道\"——有小山丘、有隧道、有斜坡。",
              "你在终点等着，摇铃鼓励她向你爬来。",
              "她翻越障碍时夸张欢呼：\"翻过去了！太厉害了！\"",
              "在赛道中间放一个小惊喜玩具——中途奖励。",
              "让她可以选择路线：左边绕过还是右边翻过——早期决策体验。"
            ],
            interaction: "爬行障碍赛是爸爸游戏的王牌——提供安全范围内的冒险感和身体挑战。",
            upgrade: "增加\"动态障碍\"：你的腿变成需要翻越的横木。",
            prematureNote: "障碍物高度不超过她趴下时的肩高。每翻越一个障碍后给10秒休息。"
          },
          aux: {
            name: "彩色冰块探索",
            domains: ["SI", "COG"],
            duration: "10分钟",
            materials: ["用食用色素冻的彩色冰块", "浅盘"],
            steps: [
              "把彩色冰块放在浅盘里，让宝宝触摸——冰冰的！",
              "冰融化后颜色扩散：\"看！红色变大了！\"",
              "引导她双手同时拿两块不同颜色的冰——\"一个红色，一个蓝色！\""
            ],
            interaction: "温度+颜色+融化=三重感官体验。手口探索期注意冰块大小。",
            prematureNote: "冰块大小要确保不能吞咽。触摸控制在几秒内，避免过冷。"
          }
        },
        afternoon: {
          outdoor: {
            name: "公园爬行探险",
            domains: ["GM", "SI", "LANG"],
            duration: "30-40分钟",
            materials: ["野餐垫", "宝宝的鞋"],
            steps: [
              "在干净的草地上铺垫子，让宝宝在垫子和草地之间爬行。",
              "让她触摸草、泥土、树叶（安全的）——\"粗粗的草！软软的泥！\"",
              "追逐游戏：你慢慢爬着\"追\"她——\"爸爸来抓你啦~\"",
              "找到小石子、落叶等自然材料，放在她面前——自然探索。"
            ],
            interaction: "户外爬行提供无限的感觉刺激。爬行追逐是爸爸独特的激活性游戏。",
            prematureNote: "注意地面温度和清洁度。户外时间控制在30分钟内。"
          },
          indoor: {
            name: "泡泡抓抓乐",
            domains: ["SI", "FM", "GM"],
            duration: "30分钟",
            materials: ["泡泡液", "吹泡泡棒"],
            steps: [
              "在宝宝面前吹泡泡，让她视觉追踪上升的泡泡。",
              "吹低一点，让她可以伸手去碰——\"啪！破了！\"",
              "引导她爬向飘远的泡泡——追逐泡泡是天然的爬行动力。",
              "让泡泡落在她手上——\"好轻~破了！再来一个？\""
            ],
            interaction: "泡泡是完美的多感官刺激：视觉追踪+手眼协调+因果（碰→破）。",
            prematureNote: "确保泡泡液安全无毒。避免大量泡泡同时出现造成过度刺激。"
          }
        },
        reading: {
          book: "《好饿的毛毛虫》(艾瑞·卡尔 著)",
          why: "洞洞书设计可以让宝宝把手指伸进去——触觉互动！色彩鲜艳，当当/京东经典绘本。",
          howTo: "这本书最大的互动点是\"手指穿洞\"。每翻一页让宝宝把手指伸进洞里：\"毛毛虫吃了一个苹果！你的手指穿过去了！\"",
          script: [
            "\"看！一条小毛毛虫！他好饿好饿~\"（用手指当毛毛虫在书上爬）",
            "\"他吃了一个苹果！\"（让宝宝手指穿过洞）\"吃到了！\"",
            "每翻一页用夸张语气数数：\"一个、两个、三个！\"",
            "最后变蝴蝶时展开翅膀：\"变~身！蝴蝶！\"（张开你的手臂）"
          ]
        }
      },
      sunday: {
        morning: {
          name: "周六精选重玩 + 微创新",
          note: "重复是学习的核心。选周六她最投入的那个游戏，但加入一个小变化，观察她如何适应。",
          variations: [
            "障碍赛变化：改变路线布局，看她是否走新路线",
            "材料变化：换不同颜色/材质的同类物品",
            "角色变化：让妈妈也参与，观察宝宝在不同照料者间的社交反应"
          ]
        },
        afternoon: {
          name: "日常照料变游戏",
          scenes: [
            {
              scene: "换尿布时",
              script: "\"藏脚丫\"：用尿布挡住她的脚，\"脚丫去哪了？\"揭开——\"在这里！十个脚趾头！\"配合数脚趾。已经够取物品的她可能会自己拉开。",
              domain: "COG + LANG"
            },
            {
              scene: "洗澡时",
              script: "\"水中实验室\"：给她两个杯子，一个有洞，演示倒水进去——有洞的杯子水流出来！\"哇，水跑掉了！\"因果认知+触觉体验。",
              domain: "COG + SI"
            },
            {
              scene: "穿衣服时",
              script: "\"Peekaboo穿衣版\"：套头衣经过头时\"宝宝去哪了？\"头露出来\"在这里！\"。每次穿袖子\"手手在哪里？出来了！\"把穿衣变成期待游戏。",
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
      "观察爬行模式：她是肚子贴地匍匐爬还是四肢着地爬？手掌是否打开？",
      "观察因果理解：她是否反复做同一动作观察结果（如反复扔玩具、按按钮）？",
      "观察社交参照：面对新事物时，她是否会回头看你的表情来判断安全与否？"
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
