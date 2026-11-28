/* Original repo's 2026 roster snapshot, extracted 2026-11-18. NOT independently verified. */
import {VERIFIED_ROSTER_PROFILES} from './roster-verified-profiles.js';

const hakoneEntry='https://www.kgrr.org/files/upload/202512/102teamentry.pdf';
const ito1500='https://www.waseda-ac.org/dbf/profile.cgi?hor=1&max=10&page=10&tpl=view2&view=rvs&width=100%25';
const maseda1500='https://www.jaaf.or.jp/files/competition/document/1563-7.pdf';
const yamaguchiProfile='https://www.sg-hldgs.co.jp/trackfield/member/yamaguchi.html';
const graduationSource='https://www.waseda.jp/top/news/117621';
const students = [
['山口 竣平',3,'3:55.75','13:17.19','27:59.47',''],
['吉倉 ナヤブ直希',3,'3:44.81','13:37.61','28:13.07','1:02:26'],
['工藤 慎作',4,'3:55.08','13:38.67','28:31.87','1:00:06'],
['上杉 敦史',1,'3:55.18','14:12.92','28:50.87',''],
['小平 敦之',4,'3:55.06','14:09.87','28:59.94','1:01:54'],
['堀野 正太',2,'3:59.57','14:08.70','29:15.33','1:02:28'],
['瀬間 元輔',3,'3:55.61','14:04.97','29:20.39','1:03:33'],
['増子 陽季',4,'3:59.20','14:30.48','29:36.19','1:06:45'],
['冨田 拓臣',2,'3:50.91','14:25.51','29:38.65','1:04:18'],
['山﨑 一吹',4,'3:54.07','13:50.40','29:39.35','1:04:22'],
['武田 知典',4,'4:10.71','14:06.44','29:41.30','1:06:38'],
['多田 真',2,'3:54.93','14:26.60','29:45.30','1:03:17'],
['高橋 優喜',4,'3:58.56','14:30.40','29:47.70',''],
['宮本 優希',4,'3:53.34','14:32.30','29:57.69','1:03:06'],
['安江 悠登',4,'','14:49.20','30:00.58','1:04:48'],
['鈴木 翔瑛',3,'','14:34.79','30:01.49','1:06:23'],
['佐藤 広人',3,'3:54.40','14:34.20','30:14.81','1:08:35'],
['斉藤 天紀',2,'','14:55.78','30:18.90',''],
['若狭 奏汰',1,'4:01.25','14:29.39','30:20.59',''],
['大和田 春',3,'4:09.14','14:40.85','30:26.79','1:04:27'],
['桑原 マテウス大地',2,'3:59.07','14:35.77','30:30.58',''],
['鈴木 琉胤',2,'3:45.76','13:20.64','30:40.21',''],
['髙尾 啓太朗',4,'3:55.88','14:43.33','30:41.01','1:06:26'],
['水出 依寿',1,'3:55.81','14:32.66','30:47.56',''],
['辻 陽介',3,'','14:24.97','31:25.69',''],
['立迫 大徳',3,'3:42.76','13:57.98','31:28.79','1:16:13'],
['増子 陽太',1,'3:45.00','13:20.35','',''],
['本田 桜二郎',1,'3:37.53','13:32.61','',''],
['新妻 遼己',1,'3:40.83','13:35.33','',''],
['佐々木 哲',2,'3:45.22','13:40.02','',''],
['山田 晃央',2,'3:47.11','14:05.40','',''],
['和田 寛',1,'3:56.24','14:22.16','',''],
['高舘 友杜',1,'3:53.03','14:29.29','',''],
['神先 強志',2,'3:58.54','14:30.93','',''],
['安食 光翔',2,'','14:47.65','',''],
['浅川 京平',3,'4:01.68','14:54.18','',''],
['鈴木 勇飛',1,'3:59.94','14:54.28','',''],
['谷川 航太',2,'4:04.00','15:20.17','','1:08:21'],
['木村涼太',2,'','','',''],
['吉田新',2,'','','',''],
['石崎友太朗',2,'','','',''],
['林優太',2,'','','',''],
['金野真綾',2,'5:00.11','','','', '女'],
['田村るう',1,'','','','', '女'],
['熊倉花萌',2,'','16:56.82','','', '女'],
['始関千華',3,'','16:35.75','','', '女']
].map(([name,grade,pb1500,pb5000,pb10000,pbHalf,gender='男'])=>({
 name,grade,gender,pb1500,pb5000,pb10000,pbHalf
}));

const alumni = [
 ['山口 智規','3:38.16','13:16.38','27:52.37','1:01:16',yamaguchiProfile],
 ['間瀬田 純平','3:42.22','13:55.61','29:13.46','1:02:31',hakoneEntry,maseda1500],
 ['宮岡 凛太','','14:16.96','29:46.31','1:01:59',hakoneEntry],
 ['伊藤 幸太郎','4:05.93','14:16.44','29:44.34','1:02:14',hakoneEntry,ito1500]
].map(([name,pb1500,pb5000,pb10000,pbHalf,pbSource,pb1500Source=pbSource])=>({
 name,grade:null,gender:'男',pb1500,pb5000,pb10000,pbHalf,
 graduation_year:2026,graduation_source:graduationSource,
 _pbSources:{...(pb1500?{pb1500:pb1500Source}:{}),pb5000:pbSource,pb10000:pbSource,pbHalf:pbSource}
}));

const osakoJaaf='https://www.jaaf.or.jp/athletes/profile/suguru_osako/';
const osakoProfile={
 name:'大迫 傑',grade:null,gender:'男',block:'長距離',reading:'おおさこ すぐる',
 birthday:'1991-05-23',home_prefecture:'東京都',middle_school:'金井中学校',high_school:'佐久長聖高等学校',
 mainEvent:'マラソン',affiliation:'LI-NING',graduation_year:2014,
 graduation_source:'https://www.waseda.jp/inst/tokyo/other/2021/05/31/8925/',
 source_url:osakoJaaf,updated_at:'2026-11-28',
 pb5000:'13:08.40',pb10000:'27:36.93',pbHalf:'1:01:13',
 _pbSources:{pb5000:osakoJaaf,pb10000:osakoJaaf,pbHalf:'https://worldathletics.org/news/report/kirwa-and-hawkins-win-marugame-half-marathon'},
 _profileSources:{birthday:osakoJaaf,home_prefecture:osakoJaaf,middle_school:osakoJaaf,high_school:osakoJaaf,affiliation:osakoJaaf}
};

export const ROSTER=[...students.map(row=>({...row,...VERIFIED_ROSTER_PROFILES[row.name]})),...alumni,osakoProfile];
export const FEATURED=['山口 竣平','増子 陽太','工藤 慎作','鈴木 琉胤','本田 桜二郎','新妻 遼己'];
export const DATA_SNAPSHOT='2026-11-18';
