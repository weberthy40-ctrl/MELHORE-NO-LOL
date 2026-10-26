/** Provisional ordered table for the three diagnostic scores (not a personal rating). */
export function recommendStartingLevel(easy,mid,hard){
 if(![easy,mid,hard].every(q=>Number.isInteger(q)&&q>=0&&q<=100))throw new TypeError('Invalid diagnostic scores.');
 return [[10,hard>=95&&mid>=85&&easy>=75],[9,hard>=85&&mid>=75&&easy>=65],[8,hard>=70&&mid>=65&&easy>=55],[7,hard>=55&&mid>=65&&easy>=55],[6,mid>=85&&easy>=60],[5,mid>=70&&easy>=50],[4,mid>=55&&easy>=45],[3,easy>=85],[2,easy>=65],[1,true]].find(([,eligible])=>eligible)[0];
}
