const blog='https://tyouseiekidenouen.blog.fc2.com/blog-entry-837.html';
const nagano='https://nrk-dir.jp/pdf/2022/22172009m.pdf';
const junior='https://gold.jaic.org/gunma/menu/results/r_21/r210818JHS/records.pdf';
const lima='https://worldathletics.org/competitions/world-athletics-u20-championships/world-athletics-u20-championships-7180313/results/men/3000-metres-steeplechase/';
const east2023Results='https://nrk-dir.jp/pdf/2023/23172003m.pdf';
const east2024Results='https://nrk-dir.jp/pdf/2024/24172003m.pdf';
const east='東信高等学校陸上競技大会';
const naganoHigh2024Results='https://nrk-dir.jp/pdf/2024/24171001m.pdf';
const naganoHigh='長野県高等学校陸上競技対校選手権大会';
const regional='北信越高等学校陸上競技対校選手権大会';
const national='全国高等学校陸上競技対校選手権大会';
const spring='長野県春季陸上競技大会';
const tokai='東海大学長距離競技会';
const nittai='日本体育大学長距離競技会';
const heisei='平成国際大学長距離競技会';
const world='U20世界陸上競技選手権大会（リマ）';

// The support blog lists meets and marks, but generally omits finishing positions.
const races=[
 ['2022-05-15','800m','2:01.95',east,'オープン'],
 ['2022-05-13','1500m','4:10.97',east,'予選'],
 ['2022-05-13','1500m','4:06.22',east,'決勝'],
 ['2022-05-27','1500m','4:07.47',naganoHigh,'決勝'],
 ['2022-06-04','1500m','4:01.99',heisei],
 ['2022-09-19','1500m','4:05.80',heisei],
 ['2022-04-24','3000m','8:40.96',spring],
 ['2022-06-26','3000m','8:29.82',heisei],
 ['2022-07-23','3000m','8:41.16','佐久長距離競技会'],
 ['2022-09-11','5000m','15:26.17','東信高等学校新人陸上競技大会','オープン'],
 ['2022-11-26','5000m','14:36.33',nittai],
 ['2022-12-04','5000m','14:30.74','第215回東海大学長距離競技会'],
 ['2022-12-26','5000m','14:34.57','エスジーエイチチャレンジ'],
 ['2022-09-10','3000mSC','9:36.20','東信高等学校新人陸上競技大会','決勝',1,nagano],
 ['2023-05-12','1500m','4:08.24',east,'オープン決勝2組',9,east2023Results],
 ['2023-06-04','3000m','8:25.37',tokai],
 ['2023-04-15','5000m','15:03.93',spring],
 ['2023-05-14','5000m','15:12.88',east,'オープン決勝',6,east2023Results],
 ['2023-09-24','5000m','14:58.39',nittai],
 ['2023-11-25','5000m','14:03.51',nittai],
 ['2023-04-16','3000mSC','9:38.55',spring],
 ['2023-05-13','3000mSC','9:26.46',east,'決勝',3,east2023Results],
 ['2023-05-27','3000mSC','9:03.76',naganoHigh],
 ['2023-06-17','3000mSC','9:12.33',regional,'予選'],
 ['2023-06-18','3000mSC','9:01.90',regional,'決勝'],
 ['2023-08-05','3000mSC','9:07.63',national,'予選1組・決勝進出',1,'https://www.jaaf.or.jp/files/competition/document/1762-7.pdf'],
 ['2023-08-06','3000mSC','9:01.58',national,'決勝',8,'https://www.jaaf.or.jp/files/competition/document/1762-7.pdf'],
 ['2024-05-10','1500m','3:52.91',east,'決勝',2,east2024Results],
 ['2024-05-24','1500m','4:03.93',naganoHigh,'予選2組・決勝進出',1,naganoHigh2024Results],
 ['2024-05-24','1500m','3:50.33',naganoHigh,'決勝',2,naganoHigh2024Results],
 ['2024-04-21','3000m','8:18.84',tokai],
 ['2024-05-12','5000m','14:57.37',east,'オープン決勝',1,east2024Results],
 ['2024-07-20','2000mSC','5:44.66','佐久中長距離ナイター'],
 ['2024-04-14','3000mSC','8:59.71',spring],
 ['2024-05-11','3000mSC','9:02.51',east,'決勝',1,east2024Results],
 ['2024-05-25','3000mSC','9:39.56',naganoHigh,'予選1組・決勝進出',1,naganoHigh2024Results],
 ['2024-05-25','3000mSC','8:50.04',naganoHigh,'決勝',1,naganoHigh2024Results],
 ['2024-06-15','3000mSC','9:06.93',regional],
 ['2024-06-16','3000mSC','8:39.15',regional],
 ['2024-07-31','3000mSC','9:07.17',national,'予選'],
 ['2024-08-28','3000mSC','8:41.48',world,'予選1組・決勝進出',4,lima+'heats/result'],
 ['2024-08-31','3000mSC','9:16.20',world,'決勝',16,lima+'final/result'],
];

export const SASAKI_SCHOOL_RESULTS=races.map(([date,event,time,meet,stage='',rank=null,source=blog])=>{
 const year=Number(date.slice(0,4));
 return {id:`sasaki-school-${date}-${event}-${time.replace(/[:.]/g,'-')}`,name:'佐々木 哲',
   year,date,gradeAtRace:year-2021,status:'highSchool',unit:'佐久長聖高等学校',meet,event,time,stage,rank,source,
   verification:source===blog?'cited':'primary'};
});

SASAKI_SCHOOL_RESULTS.push(
 {id:'sasaki-middle-2021-zenchu-3000',name:'佐々木 哲',year:2021,date:'2021-08-19',gradeAtRace:3,
   status:'middleSchool',unit:'愛工大名電中学校',meet:'第48回全日本中学校陸上競技選手権大会',
   event:'3000m',time:'8:37.34',stage:'決勝',rank:2,source:junior,verification:'primary'}
);
