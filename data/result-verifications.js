// Independent corrections to the imported snapshot. Keep snapshot IDs stable for administrator edits.
const waseda = id => `https://waseda-ac.jp/competition/detail/${id}`;
const springTrial = 'https://readyfor.jp/projects/waseda-ac2025/announcements/421606';

export const RESULT_CORRECTIONS = {
  'annual-1': {date:'2026-03-01',precision:'日',gradeAtRace:3,rank:20,japaneseRank:5,verification:'primary',source:'https://www.jaaf.or.jp/news/article/23192/'},
  'annual-2': {date:'2026-05-04',precision:'日',gradeAtRace:4,meet:'Tokyo : Speed : Race',meetAlias:'Tokyo Road Race',rank:1,pb:true,stage:'エリート男子',verification:'primary',source:waseda(842)},
  'annual-3': {date:'2026-05-24',precision:'日',gradeAtRace:4,rank:5,stage:'男子1部・決勝',verification:'primary',source:waseda(869)},
  'annual-4': {date:'2026-06-21',precision:'日',gradeAtRace:4,rank:8,verification:'primary',source:'https://worldathletics.org/competition/calendar-results/results/7240976'},
  'annual-171': {gradeAtRace:3,rank:3,stage:'5区 · 20.8km',verification:'primary',source:waseda(747)},
  'selected-4': {gradeAtRace:2,verification:'primary',source:waseda(451)},
  'selected-24': {gradeAtRace:2,pb:true,verification:'primary',source:waseda(464)},
  // The annual snapshot's grade can reflect the year beginning in April, even for earlier races.
  'annual-7': {gradeAtRace:3,source:waseda(780)},
  'annual-10': {gradeAtRace:2,source:waseda(784)},
  'annual-18': {gradeAtRace:2,source:waseda(780)},
  'annual-19': {gradeAtRace:2,source:waseda(784)},
  'annual-25': {gradeAtRace:1,source:waseda(773)},
  'annual-35': {gradeAtRace:1,source:waseda(784)},
  'annual-36': {gradeAtRace:1,gradeSource:waseda(784)},
  'annual-41': {gradeAtRace:1,source:waseda(784)},
  'annual-45': {status:'highSchool',gradeAtRace:3,unit:'学校法人石川高等学校',gradeSource:springTrial},
  'annual-46': {status:'highSchool',gradeAtRace:3,unit:'学校法人石川高等学校',source:springTrial},
  'annual-51': {status:'highSchool',gradeAtRace:3,unit:'兵庫県立西脇工業高等学校',source:springTrial},
  'annual-57': {status:'highSchool',gradeAtRace:3,unit:'鳥取城北高等学校',gradeSource:springTrial},
  'annual-58': {status:'highSchool',gradeAtRace:3,unit:'鳥取城北高等学校',source:springTrial},
  'annual-67': {gradeAtRace:2,source:waseda(780)},
  'annual-72': {gradeAtRace:3,gradeSource:waseda(747)},
  'special-0': {gradeAtRace:2},
  'special-1': {gradeAtRace:2},
  'special-2': {gradeAtRace:2},
  'special-3': {gradeAtRace:2,gradeSource:'https://waseda-ac.jp/news/detail/944'},
};

const kudo = (id,date,gradeAtRace,meet,event,time,rank,stage,source,extra={})=>({
  id:'kudo-'+id,date,year:Number(date.slice(0,4)),gradeAtRace,name:'工藤 慎作',gender:'男',
  status:'student',verification:'primary',meet,event,time,rank,stage,source,...extra
});
export const KUDO_EARLY_RESULTS = [
  kudo('2023-izumo','2023-10-09',1,'第35回出雲全日本大学選抜駅伝競走','駅伝4区','18:04',9,'6.2km',waseda(78)),
  kudo('2023-all-japan','2023-11-05',1,'第55回全日本大学駅伝対校選手権大会','駅伝4区','35:36',13,'11.8km',waseda(88)),
  kudo('2024-hakone','2024-01-02',1,'第100回東京箱根間往復大学駅伝競走','駅伝5区','1:12:12',6,'20.8km',waseda(124)),
  kudo('2024-student-half','2024-03-10',1,'第27回日本学生ハーフマラソン選手権大会','ハーフマラソン','1:02:29',3,'',waseda(163),{pb:true}),
  kudo('2024-all-japan-qualifier','2024-06-23',2,'第56回全日本大学駅伝 関東学連推薦校選考会','10000m','29:07.55',19,'4組','https://waseda-ac.jp/news/detail/280'),
  kudo('2024-izumo','2024-10-14',2,'第36回出雲全日本大学選抜駅伝競走','駅伝6区','29:35',2,'10.2km',waseda(410)),
  kudo('2024-all-japan','2024-11-03',2,'第56回全日本大学駅伝対校選手権大会','駅伝8区','58:12',3,'19.7km',waseda(412)),
];
