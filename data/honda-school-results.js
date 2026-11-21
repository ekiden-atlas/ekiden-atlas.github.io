const interHigh='https://gold.jaic.org/jaic/member/okayama/2024/77IH/77m-results.pdf';
const u20Results='https://nrkk.net/wp-content/uploads/2025/09/b0993b3fbe8ae8c474d03cc5dc5de757.pdf';
const interHighMeet='第77回全国高等学校陸上競技対校選手権大会';
const u20Meet='第41回U20日本陸上競技選手権大会';

const races=[
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
