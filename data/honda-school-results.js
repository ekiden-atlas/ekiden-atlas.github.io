const interHigh='https://gold.jaic.org/jaic/member/okayama/2024/77IH/77m-results.pdf';
const u20Results='https://nrkk.net/wp-content/uploads/2025/09/b0993b3fbe8ae8c474d03cc5dc5de757.pdf';
const interHighMeet='第77回全国高等学校陸上競技対校選手権大会';
const u20Meet='第41回U20日本陸上競技選手権大会';

const races=[
 ['2023-07-29',1,'第2回佐賀長距離記録会','3000m','8:28.65',null,'','http://www.sagarikujyo.jp/data/20230801_001.pdf','contemporaryRecord'],
 ["2024-03-24",1,"第47回春の高校伊那駅伝","5区（5.1km）","15:14",6,"区間順位","https://www.chiben.ac.jp/naracollege/wp-content/uploads/sites/6/2024/03/6b4bf672c445c51a56bcc1a5a9040d9d.pdf"],
 ["2024-02-04",1,"第78回南九州駅伝競走大会","3区（8km）","23:12",4,"区間順位","https://www.miyariku.org/keitai/result/2024/02_minami/indexPC.html"],
 ["2023-11-25",1,"全国都道府県駅伝代表選手選考会","5000m","14:33.66",5,"","https://www.fukuriku.com/cms/wp-content/uploads/2023/08/20231125%E5%AF%BE%E6%8A%97%E9%A7%85%E4%BC%9D%E9%81%B8%E8%80%83%E4%BC%9A%E9%AB%98%E6%A0%A1%E4%B8%80%E8%88%AC.pdf"],
 ["2023-11-04",1,"第74回福岡県高校男子駅伝","7区（5km）","15:15",1,"区間賞","http://frk.jpn.org/mobile/231104m/indexPC.html"],
 ["2023-05-04",1,"福岡県選手権大会兼国体選考会","3000m","8:40.00",1,"少年B男子","https://www.fukuriku.com/cms/wp-content/uploads/2023/02/20230504164347_%E7%A6%8F%E5%B2%A1%E7%9C%8C%E9%81%B8%E6%89%8B%E6%A8%A9%E5%A4%A7%E4%BC%9A%E5%85%BC%E5%9B%BD%E4%BD%93%E9%81%B8%E8%80%83%E4%BC%9A_%E3%83%AA%E3%82%B6%E3%83%AB%E3%83%88%E3%83%AA%E3%82%B9%E3%83%88.pdf"],
 ["2023-04-09",1,"第76回全九州都市対抗陸上競技大会","3000m","8:41.04",1,"男子OP","https://www.fukuriku.com/cms/wp-content/uploads/2023/03/20230409%E4%B9%9D%E5%B7%9E%E9%83%BD%E5%B8%82%E5%AF%BE%E6%8A%97%E5%BE%A1.pdf"],
 ['2023-09-17',1,'第3回長崎陸協ナイター記録会','3000m','8:15.01',3,'7組','https://jaaf-nagasaki.net/result/2023/23420306/results.pdf'],
 ['2024-06-30',2,'第40回U20日本陸上競技選手権大会','3000m','8:03.60',3,'決勝','https://www.jaaf.or.jp/gallery/article/20421/'],
 ['2024-07-28',2,interHighMeet,'1500m','3:49.60',2,'予選4組',interHigh],
 ['2024-07-29',2,interHighMeet,'1500m','3:46.98',4,'決勝',interHigh],
 ['2025-07-13',3,'第239回東海大学長距離競技会','1500m','3:43.23',1,'13組','https://www.go-tokai-ekiden.com/file/239_result.pdf'],
 ['2025-09-20',3,'第2回中国実業団長距離記録会','5000m','13:43.59',4,'タイムレース','https://blog.neet-shikakugets.com/chugoku-jitsugyodan-ld-2025-0920','cited'],
 ['2025-09-27',3,u20Meet,'5000m','13:44.44',1,'決勝',u20Results],
 ['2025-09-28',3,u20Meet,'3000m','8:04.13',1,'決勝',u20Results],
 ['2025-11-01',3,'第60回鳥取県高等学校総合体育大会駅伝競走大会','3区（8.1075km）','23:28',1,'区間賞・区間新','https://rikujyo.matsusakaaaano.com/wp-content/uploads/2025/11/%E5%B8%B8%E7%9B%A4.pdf'],
 ['2025-11-16',3,'第67回中国高等学校駅伝競走大会','1区（10km）','28:57',1,'区間賞・区間新','https://gold.jaic.org/jaic/member/okayama/2025/1116/2025results.pdf'],
 ['2026-02-01',3,'第80回南九州駅伝競走大会','1区（12.1km）','34:44',1,'区間賞・区間新','https://www.miyariku.org/keitai/result/2026/02_minami/s01.html'],
];

export const HONDA_SCHOOL_RESULTS=races.map(([date,gradeAtRace,meet,event,time,rank,stage,source,verification='primary'])=>({
 id:`honda-school-${date}-${event}`,name:'本田 桜二郎',year:Number(date.slice(0,4)),date,gradeAtRace,
 status:'highSchool',unit:gradeAtRace===3?'鳥取城北高等学校':'大牟田高等学校',
 meet,event,time,rank,stage,source,verification
}));
