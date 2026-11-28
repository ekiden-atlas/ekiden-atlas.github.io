export const NITTAI_334 = '第334回日本体育大学長距離競技会';

const wasedaSpoLiveFixtures = 'https://web.spo.live/team/Waseda_Kyoso_LD/fixtures';

// Match results by the archive's exact meet label and edition dates.
export const COMPETITIONS = [
  {
    id:'waseda-otokomatsuri-2026', title:'第6回早稲田大学競技会・2026年漢祭り', start:'2026-12-27',
    venue:'早稲田大学織田幹雄記念陸上競技場', source:'https://waseda-ac.jp/wasedagames/detail/7',
    spoLive:wasedaSpoLiveFixtures, resultMeet:'第6回早稲田大学競技会・2026年漢祭り'
  },
  {
    id:'nittai-334', title:NITTAI_334, start:'2026-11-28', end:'2026-11-29',
    venue:'日本体育大学横浜健志台キャンパス陸上競技場',
    source:'https://waseda-ac.jp/competition/detail/1079',
    timetable:'https://blog.neet-shikakugets.com/nittaidai-ld-2026-1121-entry',
    intro:'nittai334Watch', resultMeet:NITTAI_334,
    entryStatus:'entriesAnnounced', entrySource:'https://waseda-ac.jp/news/detail/1059',
    entries:[
      {event:'男子5000m · 12組', start:'13:03', athletes:['髙久 拓己','神先 強志']},
      {event:'女子5000m · 2組', start:'15:10', athletes:['熊倉花萌']},
      {event:'女子5000m · 3組', start:'15:29', athletes:['始関千華']},
      {event:'男子5000m · 15組', start:'17:10', athletes:['鈴木 勇飛']},
      {event:'男子5000m · 17組', start:'17:44', athletes:['高舘 友杜']}
    ]
  },
  {
    id:'ageo-2026', title:'第39回2026上尾シティハーフマラソン', start:'2026-11-22',
    venue:'上尾運動公園陸上競技場', source:'https://www.ageocity-marathon.com/outline/',
    replayUrl:'https://www.youtube.com/watch?v=hVkUlAv3EKI',
    liveLinks:[
      ['scheduleVideoChannel','https://www.youtube.com/@teletama3ch/streams'],
      ['schedulePlayerLive','https://web.playerapp.tokyo/live/200223'],
      ['scheduleRunnerTracking','https://live.runport.run/r/ageo39-half'],
    ],
    liveSource:'https://ageocity-marathon.com/img/program2026.pdf',
    intro:'ageoWatch', resultMeet:'第39回2026上尾シティハーフマラソン',
    entryStatus:'entriesAnnounced', entrySource:'https://waseda-ac.jp/news/detail/1057',
    entries:[{event:'ハーフマラソン', start:'09:00', athletes:[
      '小平 敦之','武田 知典','増子 陽季','宮本 優希','安江 悠登','大和田 春','鈴木 翔瑛','瀬間 元輔',
      '辻 陽介','吉倉 ナヤブ直希','安食 光翔','桑原 マテウス大地','斉藤 天紀','佐々木 哲','多田 真',
      '冨田 拓臣','堀野 正太','山田 晃央','上杉 敦史','水出 依寿','若狭 奏汰','和田 寛'
    ]}]
  },
  {
    id:'hakone-2027', title:'第103回東京箱根間往復大学駅伝競走', start:'2027-01-02', end:'2027-01-03',
    venue:'東京・大手町 ⇄ 箱根・芦ノ湖', source:'https://www.hakone-ekiden.jp/',
    spoLive:wasedaSpoLiveFixtures, intro:'hakoneWatch', race:'hak'
  },
  {
    id:'tokai-253', title:'第253回東海大学長距離競技会', start:'2026-11-15',
    source:'https://waseda-ac.jp/competition/detail/1075',
    intro:'tokaiWatch', resultMeet:'第253回東海大学長距離競技会'
  },
  {
    id:'all-japan-58', title:'第58回全日本大学駅伝対校選手権大会', start:'2026-11-01',
    venue:'熱田神宮 → 伊勢神宮', source:'https://waseda-ac.jp/competition/detail/1066',
    intro:'allJapanWatch', race:'zen', entryHeading:'scheduleRelayEntries',
    entries:[
      {
        title:'scheduleTeamEntry', published:'2026-10-08',
        source:'https://daigaku-ekiden.com/news/files/e946626ecacbe9848c78c329dd03f3e6ee38b071.pdf',
        athletes:[
          '工藤 慎作','小平 敦之','増子 陽季','山﨑 一吹','瀬間 元輔','山口 竣平','吉倉 ナヤブ直希','佐々木 哲',
          '鈴木 琉胤','堀野 正太','山田 晃央','上杉 敦史','新妻 遼己','本田 桜二郎','増子 陽太','若狭 奏汰'
        ]
      },
      {
        title:'scheduleMemberEntry', published:'2026-10-30', orderedLegs:true,
        source:'https://daigaku-ekiden.com/news/#entry662',
        athletes:[
          '本田 桜二郎','増子 陽太','吉倉 ナヤブ直希','小平 敦之',
          '山田 晃央','堀野 正太','山口 竣平','工藤 慎作'
        ],
        reserves:['瀬間 元輔','佐々木 哲','鈴木 琉胤','上杉 敦史','新妻 遼己']
      }
    ]
  }
];
