import {nameSearch} from './data.js';

// Search aliases only. Keep official spellings and record identifiers intact.
const characterGroups=[
 '鈴铃','増增','陽阳','桜櫻樱','倉仓','髙高','﨑崎','瀬瀨濑','間间','輔辅',
 '冨富','橋桥','優优','宮宫','飛飞','広廣广','斉齊齋齐斋','狭狹','徳德','啓啟启',
 '寿壽','遼辽','寛寬宽','舘館馆','強强','浅淺','涼凉','綾绫','関關关','華华',
 '規规','純纯','岡冈','凛凜','楓枫','樹树','響响','亜亞亚','鶴鹤',
 '巻卷','蔵藏','絢绚','滝瀧泷','澤沢泽','貴贵','悦悅','連连','東东','諒谅',
 '嶋嶌島岛','圖図图','奥奧','謙谦','聖圣','羅罗','権權权','葉叶','織织',
 '渕淵渊','場场','遥遙','樂楽乐','濱浜滨','馬马','壮壯','歩步','蓮莲',
 '蔣蒋','篤笃','竜龍龙','郎郞','眞真','邊辺邉边'
];
const aliases=new Map(characterGroups.flatMap(group=>[...group].map(character=>[character,group[0]])));

export function athleteSearchKey(name){
 return Array.from(nameSearch(name).normalize('NFKC'),character=>aliases.get(character)??character).join('');
}
