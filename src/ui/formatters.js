export function formatDuration(value){
 if(!Number.isFinite(value)||value<0)return 'Não disponível nesta versão';
 const total=Math.floor(value),seconds=String(total%60).padStart(2,'0'),minutes=String(Math.floor(total/60)%60).padStart(2,'0'),hours=Math.floor(total/3600);
 return hours?`${hours}:${minutes}:${seconds}`:`${Math.floor(total/60)}:${seconds}`;
}
export function formatDate(value){if(typeof value!=='string'||!value.trim())return 'Data indisponível';const date=new Date(value);return Number.isFinite(date.getTime())?new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(date):'Data indisponível';}
