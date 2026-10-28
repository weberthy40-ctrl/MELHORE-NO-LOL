import {URL} from 'node:url';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import preflight,{admission} from '../preflight.mjs';
const readPolicy=await readFile(new URL('../policy.json',import.meta.url),'utf8');
const policy=JSON.parse(readPolicy);
test('disabled/dry-run never admit; both limits close admission when paid policy explicitly authorized',()=>{
 const policy={...JSON.parse(readPolicy),paid_api_allowed:true,monthly_budget_usd:20};
 assert.equal(admission(policy,0,{RIFT_MODE:'dry-run',RIFT_ENABLED:'true'}).admit,false);
 assert.equal(admission(policy,0,{RIFT_MODE:'live'}).admit,false);
 assert.equal(admission(policy,0,{RIFT_MODE:'live',RIFT_ENABLED:'true'}).admit,true);
 assert.equal(admission(policy,5,{RIFT_MODE:'live',RIFT_ENABLED:'true'}).admit,false);
 for(const value of ['NaN','Infinity','-1','2000'])assert.throws(()=>admission(policy,0,{RIFT_MONTHLY_BUDGET_USD:value}));
 assert.throws(()=>admission(policy,0,{RIFT_MODE:'other'}));
 assert.equal(admission(policy,0,{RIFT_MODE:'live',RIFT_ENABLED:'true',RIFT_MONTHLY_BUDGET_USD:'0'}).admit,false);
});
function mock(){
 const output={};const core={setOutput(k,v){output[k]=v;},notice(){},warning(){},summary:{addHeading(){return this;},addTable(){return this;},async write(){}}};
 const context={eventName:'workflow_dispatch',ref:'refs/heads/main',payload:{repository:{default_branch:'main'}},repo:{owner:'owner',repo:'repo'},runId:100};
 const github={rest:{actions:{async listWorkflowRuns(){return {data:{workflow_runs:[{id:99}]}};},async listJobsForWorkflowRun(){return {data:{total_count:2,jobs:[{name:'implement',conclusion:'failure'},{name:'implement',conclusion:'skipped'}]}};}},repos:{async getBranch(){throw Object.assign(new Error('absent'),{status:404});}}}};
 return {github,context,core,output};
}
test('counts failed admitted rounds, ignores skipped jobs, and defaults only on404',async()=>{
 const m=mock();await preflight(m,{RIFT_RUN_ATTEMPT:'1',RIFT_MODE:'dry-run'});assert.equal(m.output.rounds,'1');assert.equal(m.output.base,policy.seed_sha);assert.equal(m.output.admit,'false');
 m.github.rest.repos.getBranch=async()=>{throw Object.assign(new Error('denied'),{status:403});};await assert.rejects(()=>preflight(m,{RIFT_RUN_ATTEMPT:'1',RIFT_MODE:'dry-run'}),/denied/);
});
test('rejects nondefault refs, reruns and incomplete budget history',async()=>{
 const m=mock();m.context.ref='refs/heads/attacker';await assert.rejects(()=>preflight(m,{RIFT_RUN_ATTEMPT:'1'}),/default branch/);m.context.ref='refs/heads/main';await assert.rejects(()=>preflight(m,{RIFT_RUN_ATTEMPT:'2'}),/Reruns/);
 m.github.rest.actions.listJobsForWorkflowRun=async()=>({data:{total_count:101,jobs:[]}});await assert.rejects(()=>preflight(m,{RIFT_RUN_ATTEMPT:'1'}),/Incomplete/);
});

test('R$0 policy blocks live even with enabled variable and increased estimated budget',()=>{
 for(const current of [policy,{...policy,paid_api_allowed:false},{...policy,paid_api_allowed:undefined}]){
  const result=admission(current,0,{RIFT_MODE:'live',RIFT_ENABLED:'true',RIFT_MONTHLY_BUDGET_USD:'1000',RIFT_MAX_MONTHLY_ROUNDS:'10'});
  assert.equal(result.admit,false);assert.equal(result.limit,0);assert.equal(result.budget,0);assert.match(result.reason,/R\$0/);
 }
 assert.equal(admission(policy,0,{RIFT_MODE:'dry-run',RIFT_ENABLED:'true'}).admit,false);
});
