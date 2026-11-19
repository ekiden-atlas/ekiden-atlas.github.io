import {nameSearch,officialAthleteName,parseTime} from './data.js';
import {meetLabel,recordLabel} from './record-names.js';

const growthAthletes=new Set(['鈴木琉胤','増子陽太']);
const dayPattern=/^\d{4}-\d{2}-\d{2}$/;
const width=480,height=240,left=52,right=456,top=23,bottom=200;

function chart({points,ticks,xLabels,yLabel,label,line},E){
 const coords=rows=>rows.map(({x,y})=>`${x.toFixed(2)},${y.toFixed(2)}`).join(' ');
 return `<svg class="analysis-plot" viewBox="0 0 ${width} ${height}" role="img" aria-label="${E(label)}">
 <text x="${left}" y="13">${E(yLabel)}</text>
 ${ticks.map(({y,text})=>`<line class="analysis-grid" x1="${left}" x2="${right}" y1="${y}" y2="${y}"/><text x="${left-7}" y="${y}" text-anchor="end" dominant-baseline="middle">${E(text)}</text>`).join('')}
 ${xLabels.map(({x,text})=>`<text x="${x}" y="${bottom+25}" text-anchor="middle">${E(text)}</text>`).join('')}
 <polyline class="analysis-line" points="${coords(line)}"/>
 ${points.map(({x,y,tip,value})=>`<circle class="analysis-point" cx="${x}" cy="${y}" r="4"><title>${E(tip)}</title></circle>
 ${value==null?'':`<text class="analysis-value" x="${x}" y="${y+17}" text-anchor="middle">${E(value)}</text>`}`).join('')}
 </svg>`;
}

export function renderGrowthChart(name,records,{t,E,sourceLink}){
 if(!growthAthletes.has(nameSearch(name)))return '';
 const meets=new Map();
 for(const row of records){
   if(recordLabel(row.event)!=='5000m'||!dayPattern.test(row.date)||!row.source||
     !['primary','cited'].includes(row.verification)||!Number.isFinite(parseTime(row.time)))continue;
   const key=[row.date,row.time].join(':');
   if(!meets.has(key)||row.verification==='primary')meets.set(key,row);
 }
 const rows=[...meets.values()].sort((a,b)=>a.date.localeCompare(b.date)||parseTime(a.time)-parseTime(b.time));
 if(rows.length<2)return '';
 const firstYear=Number(rows[0].date.slice(0,4));
 const lastYear=Number(rows.at(-1).date.slice(0,4));
 const start=Date.UTC(firstYear,0,1),end=Date.UTC(lastYear+1,0,1);
 const x=date=>left+(right-left)*(Date.parse(date)-start)/(end-start);
 const times=rows.map(row=>parseTime(row.time));
 const min=Math.floor(Math.min(...times)/30)*30,max=Math.ceil(Math.max(...times)/30)*30;
 const y=time=>top+(bottom-top)*(time-min)/Math.max(max-min,30);
 const ticks=Array.from({length:(max-min)/30+1},(_,index)=>{
   const seconds=min+index*30;
   return {y:y(seconds),text:`${Math.floor(seconds/60)}:${String(seconds%60).padStart(2,'0')}`};
 });
 const xLabels=Array.from({length:lastYear-firstYear+1},(_,index)=>{
   const year=firstYear+index;
   return {x:x(`${year}-01-01`),text:String(year)};
 });
 const points=rows.map((row,index)=>({x:x(row.date),y:y(times[index]),tip:`${row.date} · ${meetLabel(row.meet)} · ${row.time}`}));
 const line=[points[0]];
 for(const point of points.slice(1)){
   const current=line.at(-1);
   if(point.y<current.y)line.push({x:point.x,y:current.y},point);
 }
 line.push({x:points.at(-1).x,y:line.at(-1).y});
 const title=t('growthChartTitle');
 return `<section class="card analysis-card" aria-labelledby="growth-chart-title">
 <h2 id="growth-chart-title">${E(title)}</h2>
 <p>${E(t('growthChartNote'))}</p>
 ${chart({points,ticks,xLabels,yLabel:t('resultMark'),label:`${officialAthleteName(name)} · ${title}`,line},E)}
 <details><summary>${E(t('chartSources'))}</summary><ul class="analysis-sources">
 ${rows.map(row=>`<li>${E(row.date)} · ${E(meetLabel(row.meet))} · <strong>${E(row.time)}</strong> ${sourceLink(row.source)}</li>`).join('')}
 </ul></details></section>`;
}

export function renderEkidenRankChart(race,{t,E}){
 if(race.year!==2026||!['izu','zen'].includes(race.race))return '';
 const legs=race.legs||[];
 const ranks=legs.map(leg=>Number(leg.team_position));
 if(legs.length<2||ranks.some(rank=>!Number.isInteger(rank)||rank<1))return '';
 const max=Math.max(2,...ranks);
 const y=rank=>top+(bottom-top-16)*(rank-1)/(max-1);
 const points=legs.map((leg,index)=>({
   x:left+(right-left)*index/(legs.length-1),y:y(ranks[index]),value:ranks[index],
   tip:`${leg.leg} · ${officialAthleteName(leg.name)} · ${t('handoffRank')} ${ranks[index]} · ${t('legRank')} ${leg.rank??'—'}`
 }));
 const ticks=Array.from({length:max},(_,index)=>({y:y(index+1),text:index+1}));
 const xLabels=points.map((point,index)=>({x:point.x,text:t('rankChartLeg',{leg:legs[index].leg})}));
 const title=t('rankChartTitle');
 return `<figure class="analysis-card ekiden-rank-chart">
 <figcaption><strong>${E(title)}</strong><p>${E(t('rankChartNote'))}</p></figcaption>
 ${chart({points,ticks,xLabels,yLabel:t('teamRank'),label:`${race.year} · ${title} · ${ranks.join(' → ')}`,line:points},E)}
 </figure>`;
}
