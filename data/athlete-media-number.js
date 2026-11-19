// The Number original pages supply publication dates and access requirements.
// The competition field identifies the subject, not a claim of participation.
const hakone=['箱根驿传','箱根駅伝'];
const hakone102=['第102届箱根驿传','第102回箱根駅伝'];
const tokyo=['2026年东京马拉松','東京マラソン2026'];
const highSchool=['2025年全国高中驿传','2025年全国高校駅伝'];
const allJapan=['第58届全日本大学驿传','第58回全日本大学駅伝'];
const kudo=['工藤 慎作'];
const suzuki=['鈴木 琉胤'];
const masuko=['増子 陽太'];
const yamaguchi=['山口 竣平'];
const yamaguchiOb=['山口 智規'];

const videos=[
  [18335,'2025-02-02',kudo,['工藤慎作谈箱根爬坡与马拉松','工藤慎作が語る箱根の山上りとマラソン'],['第101届箱根驿传','第101回箱根駅伝']],
  [18930,'2025-09-09',kudo,['工藤慎作谈与世界顶尖选手的差距','工藤慎作が語る世界との差と独自の練習'],hakone],
  [18931,'2025-09-13',yamaguchi,['山口竣平谈驿传接力与后辈','山口竣平が語る襷への思いと後輩たち'],hakone],
  [18932,'2025-09-30',suzuki,['铃木琉胤谈比赛心态与成长空间','鈴木琉胤が語る勝負への意識と伸びしろ'],hakone],
  [18933,'2025-10-01',['佐々木 哲'],['佐佐木哲谈同届对手与障碍赛训练','佐々木哲が語る同期のライバルと障害の練習'],null],
  [19504,'2026-03-24',masuko,['增子阳太谈高中驿传夺冠与选择早稻田','増子陽太が語る都大路優勝と早稲田進学'],highSchool],
  [19746,'2026-07-10',yamaguchiOb,['山口智规谈墨尔本训练与5000米目标（上）','山口智規が語るメルボルンでの練習と5000mの目標（前編）'],null],
  [19747,'2026-07-10',yamaguchiOb,['山口智规回顾箱根与早稻田队友（下）','山口智規が振り返る箱根と早稲田の仲間（後編）'],hakone],
  [19938,'2026-09-16',['小平 敦之'],['小平敦之谈队长职责与突破','小平敦之が語る主将の役割と3年目の飛躍'],hakone],
  [19941,'2026-09-18',yamaguchi,['山口竣平谈赛季进步与箱根第2区','山口竣平が語る今季の成長と箱根2区'],hakone],
  [19964,'2026-09-19',suzuki,['铃木琉胤谈箱根第4区区间赏','鈴木琉胤が語る箱根4区の区間賞'],hakone102],
  [19969,'2026-09-20',['増子 陽太','本田 桜二郎','新妻 遼己'],['增子阳太、本田樱二郎、新妻辽己畅谈箱根','増子陽太・本田桜二郎・新妻遼己が語り合う箱根駅伝'],hakone],
  [20054,'2026-10-22',kudo,['工藤慎作谈箱根后的马拉松训练（上）','工藤慎作が語る箱根後のマラソン練習（前編）'],hakone102],
  [20055,'2026-10-22',kudo,['工藤慎作谈马拉松目标与训练计划（下）','工藤慎作が見据えるマラソンと今後の練習（後編）'],null]
];

const articles=[
  [869813,'2026-03-29',masuko,['增子阳太谈选择早稻田的原因','増子陽太が語る早稲田を選んだ理由'],highSchool],
  [870120,'2026-04-28',kudo,['工藤慎作回顾箱根爬坡与黑田朝日的表现','工藤慎作が振り返る箱根の山上りと黒田朝日の走り'],hakone102],
  [870135,'2026-04-28',kudo,['工藤慎作回顾首次马拉松','工藤慎作が振り返る初マラソン'],tokyo],
  [870136,'2026-04-28',kudo,['工藤慎作谈箱根与早稻田新生','工藤慎作が語る箱根と早稲田の新入生'],hakone],
  [872544,'2026-11-04',kudo,['工藤慎作回顾全日本大学驿传末棒','工藤慎作が振り返る全日本のアンカー区間'],allJapan]
];

const numberPremier=['Number PREMIER','Number PREMIER'];
const numberWeb=['Number Web','Number Web'];

export const NUMBER_ATHLETE_MEDIA=[
  ...videos.map(([id,date,athletes,title,meet])=>({
    date,athletes,title,meet,publisher:numberPremier,kind:'Video',paid:true,
    url:'https://number.bunshun.jp/premier/movies/'+id
  })),
  ...articles.map(([id,date,athletes,title,meet])=>({
    date,athletes,title,meet,publisher:numberWeb,kind:'Interview',
    url:'https://number.bunshun.jp/articles/-/'+id
  }))
];
