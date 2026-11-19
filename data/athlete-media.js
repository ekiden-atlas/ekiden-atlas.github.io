import {NUMBER_ATHLETE_MEDIA} from './athlete-media-number.js';

// Dates refer to publication. Group interviews are listed only for athletes
// who speak in the source. Titles are concise editorial labels.
const waseda=['早稻田大学竞技体育中心','早稲田大学競技スポーツセンター'];
const wasedaSports=['早稻田体育新闻会','早稲田スポーツ新聞会'];
const izumo=['第38届出云驿传','第38回出雲駅伝'];
const intercollegiate=['2026年日本大学生田径锦标赛','2026年日本インカレ'];

export const ATHLETE_MEDIA=[
  {
    athletes:['本田 桜二郎','増子 陽太','新妻 遼己','小平 敦之','鈴木 琉胤','堀野 正太','山口 竣平','工藤 慎作'],
    title:['早稻田夺冠后八棒选手发布会','早大の優勝メンバー8人が振り返る全日本'],
    publisher:wasedaSports, date:'2026-11-03', meet:['第58届全日本大学驿传','第58回全日本大学駅伝'],
    kind:'Interview', url:'https://wasedasports-sousupo.com/news/trackandfield/ekiden/300863/'
  },
  {
    athletes:['山口 竣平'], title:['山口竣平与花田教练的出云夺冠感言','山口竣平と花田監督の出雲優勝報告'],
    publisher:waseda, date:'2026-10-14', meet:izumo,
    kind:'Video', url:'https://sports.yahoo.co.jp/official/detail/2026101400056-spnaviow'
  },
  {
    athletes:['吉倉ナヤブ直希','本田 桜二郎','鈴木 琉胤','新妻 遼己','山口 竣平','工藤 慎作'],
    title:['早稻田出云夺冠后六棒选手采访','出雲優勝後の選手コメント集'],
    publisher:waseda, date:'2026-10-14', meet:izumo,
    kind:'Interview', url:'https://www.waseda.jp/inst/athletic/news/2026/10/14/61904/'
  },
  {
    athletes:['佐々木 哲'], title:['佐佐木哲谈男子3000米障碍赛夺冠','佐々木哲が語る男子3000m障害の優勝'],
    publisher:['4years.（朝日新闻）','4years.（朝日新聞）'], date:'2026-09-12', meet:intercollegiate,
    kind:'Interview', url:'https://4years.asahi.com/article/16873929'
  },
  {
    athletes:['佐々木 哲'], title:['男子3000米障碍赛决赛与佐佐木哲赛后采访','男子3000m障害決勝と佐々木哲のレース後インタビュー'],
    publisher:['读卖电视台 Asu Athlete 频道','読売テレビ あすリートチャンネル'], date:'2026-09-07', meet:intercollegiate,
    kind:'Video', url:'https://www.youtube.com/watch?v=fLpzMIpcNV8'
  },
  {
    athletes:['工藤 慎作'], title:['工藤慎作谈首次马拉松与获得 MGC 资格','工藤慎作が語る初マラソンとMGC出場権'],
    publisher:['日本田径协会（JAAF）','日本陸上競技連盟（JAAF）'], date:'2026-03-04', meet:['2026年东京马拉松','東京マラソン2026'],
    kind:'Interview', url:'https://www.jaaf.or.jp/news/article/23192/'
  },
  {
    athletes:['鈴木 琉胤'], title:['铃木琉胤谈箱根第4区区间赏','箱根4区区間賞の鈴木琉胤に聞く'],
    publisher:['文化放送','文化放送'], date:'2026-01-02', meet:['第102届箱根驿传','第102回箱根駅伝'],
    kind:'Interview', url:'https://www.joqr.co.jp/qr/article/167508/'
  },
  ...NUMBER_ATHLETE_MEDIA
].sort((left,right)=>right.date.localeCompare(left.date));
