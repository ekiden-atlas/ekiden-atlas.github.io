// Build-time allowlists for public source data. Links exclude personal repositories and articles.
const hosts = new Set([
  'waseda-ac.jp', 'www.waseda.jp', 'www.hakone-ekiden.jp', 'www.izumo-ekiden.jp',
  'daigaku-ekiden.com', 'www.tv-asahi.co.jp', 'www.nikkansports.com',
  'www.jaaf.or.jp', 'www.iuau.jp', 'www.asahi-kasei.com', 'www.subaru.co.jp',
  'worldathletics.org', 'www.logisteed.com', 'www.sg-hldgs.co.jp',
  'www.rikujyokyogi.co.jp', 'readyfor.jp', 'www.seiko.co.jp', 'goldengrandprix-japan.com'
]);
export function publicSource(value) {
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' && !url.username && !url.password && !url.port &&
        hosts.has(url.hostname) && !url.pathname.startsWith('/diary/')) return url.origin + url.pathname;
  } catch {}
  return null;
}

export function facts(row, fields) {
  return Object.fromEntries(fields.filter(key => {
    const value = row[key];
    if (typeof value === 'string') return value.length <= 240 &&
      !/(?:https?:|www\.|github|<[^>]*>)/i.test(value);
    return value === null || typeof value === 'boolean' || Number.isFinite(value);
  }).map(key => [key, row[key]]));
}

export function officialFacts(parsed) {
  const leg = row => facts(row, ['leg','name','time','rank','km']);
  const race = row => ({
    ...facts(row, ['year','type','edition','rank','total','out','back','out_rank','back_rank','status','reason','source_format_note']),
    source: publicSource(row.source),
    legs: Array.isArray(row.legs) ? row.legs.map(leg) : []
  });
  const score = row => ({
    ...facts(row, ['gender','event','performance','athlete','date','rank','year','sourceNote']),
    source: publicSource(row.source)
  });
  return {
    hakone: parsed.hakone.map(race), otherEkiden: parsed.otherEkiden.map(race),
    school: parsed.school.map(score), rankings: parsed.rankings.map(score)
  };
}
