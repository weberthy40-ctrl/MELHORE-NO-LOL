import {URL} from 'node:url';
import {readFile} from 'node:fs/promises';
import process from 'node:process';
export function admission(policy, rounds, env) {
 if(!Number.isInteger(rounds)||rounds<0||!Number.isInteger(policy.max_monthly_rounds)||policy.max_monthly_rounds<1||!Number.isFinite(policy.estimated_round_usd)||policy.estimated_round_usd<=0)throw new Error("Invalid admission policy/history");
 // Budget-zero is a trusted policy boundary, not an overridable repository variable.
 if(env.RIFT_MODE!==undefined&&!['dry-run','live'].includes(env.RIFT_MODE))throw new Error('Unknown execution mode');
 if(policy.paid_api_allowed!==true)return {admit:false,reason:env.RIFT_MODE==='dry-run'?'dry-run: paid API forbidden by R$0 policy':'paid API forbidden by R$0 policy',limit:0,budget:0};
 const number=(value,fallback,max)=>{const n=value===''||value===undefined?fallback:Number(value);if(!Number.isFinite(n)||n<0||n>max)throw new Error('Invalid budget configuration');return n;};
 const budget=number(env.RIFT_MONTHLY_BUDGET_USD,policy.monthly_budget_usd,1000);
 const limit=Math.min(Math.floor(number(env.RIFT_MAX_MONTHLY_ROUNDS,policy.max_monthly_rounds,policy.max_monthly_rounds)),Math.floor(budget/policy.estimated_round_usd));
 if(env.RIFT_MODE==='dry-run')return {admit:false,reason:'dry-run: no model or publishing',limit,budget};
 if(env.RIFT_MODE!=='live')throw new Error('Unknown execution mode');
 if(env.RIFT_ENABLED!=='true')return {admit:false,reason:'disabled: RIFT_AUTOMATION_ENABLED is not true',limit,budget};
 return {admit:rounds<limit,reason:rounds<limit?'admitted':'monthly round allowance exhausted',limit,budget};
}
export default async function preflight({github,context,core},env=process.env) {
 const policy=JSON.parse(await readFile(new URL('./policy.json',import.meta.url),'utf8'));
 if(!['schedule','workflow_dispatch'].includes(context.eventName)||context.ref!==`refs/heads/${context.payload.repository.default_branch}`)throw new Error('Only the default branch may orchestrate evolution');
 if(Number(env.RIFT_RUN_ATTEMPT)!==1)throw new Error('Reruns are refused; create a new dispatch');
 const month=new Date().toISOString().slice(0,7)+'-01T00:00:00Z';let runs=[],complete=false;
 for(let page=1;page<=10;page++){
  const {data}=await github.rest.actions.listWorkflowRuns({...context.repo,workflow_id:'rift-lab-autoevolution.yml',created:`>=${month}`,per_page:100,page});
  runs.push(...data.workflow_runs);if(data.workflow_runs.length<100){complete=true;break;}
 }
 if(!complete)throw new Error('Budget history exceeds bounded pagination');
 let rounds=0;
 for(const run of runs){
  if(String(run.id)===String(context.runId))continue;
  const {data}=await github.rest.actions.listJobsForWorkflowRun({...context.repo,run_id:run.id,filter:'all',per_page:100});
  if(data.total_count>100)throw new Error('Incomplete job history; refusing admission');
  rounds+=data.jobs.filter(job=>job.name==='implement'&&job.conclusion!=='skipped').length;
 }
 let base=policy.seed_sha;
 try{const {data}=await github.rest.repos.getBranch({...context.repo,branch:policy.evolution_branch});base=data.commit.sha;}catch(error){if(error.status!==404)throw error;}
 if(!/^[a-f0-9]{40}$/.test(base))throw new Error('Invalid remote base SHA');
 const result=admission(policy,rounds,env);
 for(const [key,value]of Object.entries({...result,base,seed:policy.seed_sha,model:policy.model,cli:policy.codex_version,rounds}))core.setOutput(key,String(value));
 core.notice(result.reason);
 if(!result.admit&&env.RIFT_MODE==='live'&&env.RIFT_ENABLED==='true')core.warning('No API invocation: '+result.reason+'. USD estimates are not hard API spending caps.');
 await core.summary.addHeading('RIFT LAB — admission').addTable([
  [{data:'Status',header:true},{data:'Value',header:true}],['Decision',result.reason],['Started rounds this UTC month',String(rounds)],['Allowed rounds',String(result.limit)],['Budget estimate USD',String(result.budget)],['API expenditure',policy.paid_api_allowed===true?'Unknown; configure project alerts/billing separately':'No call admitted: R$0 policy'],['Base',base]
 ]).write();
 return result;
}
