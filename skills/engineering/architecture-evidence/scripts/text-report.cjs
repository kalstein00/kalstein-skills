'use strict';
const fs=require('node:fs'),path=require('node:path'),{randomUUID}=require('node:crypto');
const text=value=>value===undefined||value===null?'확인 불가':String(value).replace(/[\r\n\t]/g,' ');
function couplingExplanation(report,item,metrics){
 const lines=[],rank=report.ranking?.groups?.find(g=>g.name==='coupling')?.items?.find(r=>r.id===item.id);
 const winners=rank?.signals?.filter(s=>Number.isFinite(s.percentile)&&s.percentile===rank.percentile)||[];
 if(!winners.length)lines.push('   선정 기여: 확인 불가 (저장된 coupling 선정 신호 없음)');
 for(const signal of [...winners].sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0)){
  const row=metrics.find(m=>m.name===signal.name&&m.source===signal.source&&m.cohort===signal.cohort&&m.percentile===signal.percentile);
  if(!row){lines.push(`   선정 기여: ${text(signal.name)} — 확인 불가 (일치하는 원시 metric 없음)`);continue;}
  lines.push(`   선정 기여: ${text(row.name)}: ${text(row.value)} ${text(row.unit)}; 비교군=${text(row.cohort)}; 유효 표본=${text(row.validPopulation)}; 관측 표본=${text(row.observedPopulation)}; percentile=${text(row.percentile)}`);
  if(row.validPopulation==null||row.observedPopulation==null)lines.push('   비교 표본 확인 불가: 원시 metric에 모집단 필드 없음.');
 }
 const collector=report.collectors?.coupling,c=collector?.confirmation;
 lines.push(c?.status==='observed'?'   근거: 확인된 정적 연결의 관측값; 런타임 호출 증명이나 전체 의존성 완전성이 아님':`   근거: 확인 불가 (${text(c?.reason||'저장된 근거 분류 없음')})`);
 lines.push(`   관측 그래프 전체: 확인된 연결=${text(c?.confirmedEdges)}; 추정/판정 불가=${text(c?.unresolvedEdges)}`);
 const reasons=new Map();
 for(const entry of collector?.bindingEvidence?.entries||[])if(entry.classification!=='confirmed')reasons.set(entry.reason,(reasons.get(entry.reason)||0)+1);
 for(const [reason,count]of [...reasons].sort(([a],[b])=>a<b?-1:a>b?1:0))lines.push(`   그래프 전체 근거 한계: ${text(reason)} (${count}개)`);
 lines.push('   graph 누락 및 partial 상태는 아래 측정 공백과 진단에 보존됨; 높은 값은 결함 판정이 아님.');
 return lines;
}
function renderReport(report,{createdAt,root,rawOutput,elapsedMs}){
 const m=report.measurement||{},c=m.counts||{},selection=report.queue?.selection;
 const items=new Map([...(report.collectors?.graph?.nodes||[]),...(report.items||[])].map(i=>[i.id,i.identity]));
 const label=id=>{const i=items.get(id);
  if(i?.path)return i.path+(i.qualifiedName?' :: '+i.qualifiedName:'');
  if(i?.kind==='cluster')return 'cycle ['+i.members.map(m=>items.get(m)?.path||m).join(', ')+']';
  if(i?.kind==='violation')return i.rule+': '+(items.get(i.source)?.path||i.source)+' -> '+(items.get(i.target)?.path||i.target);
  return id;
 };
 const lines=['Architecture Evidence 측정 보고서','이 파일은 스크립트가 관측 결과로 생성했습니다. LLM 해석이나 결함 판정을 포함하지 않습니다.','',
 '[실행 요약]',`생성 시각 (UTC): ${createdAt}`,`대상 저장소: ${text(root)}`,`상태: ${text(report.status)}`,`입력 검증: ${report.snapshotVerified===true?'확인됨':'확인되지 않음'}`,`측정 처리 시간 (준비 제외): ${text(elapsedMs)} ms`,
 `Snapshot: ${text(report.snapshot?.id)}`,`HEAD: ${text(report.snapshot?.input?.source?.head)}`,`설정 identity: ${text(report.snapshot?.input?.config)}`,`원시 JSON: ${text(rawOutput)}`,'',
 '[측정 범위]',`범위: ${text(m.scope)}`,`Production 파일: ${text(c.production)}`,`지원 / 미지원 / 읽기 실패: ${text(c.supported)} / ${text(c.unsupported)} / ${text(c.failed)}`,`미분류 / 테스트 근거 / 제외 / 범위 밖: ${text(c.unclassified)} / ${text(c.evidence)} / ${text(c.excluded)} / ${text(c.outOfScope)}`,
 `전체 metric 행: ${text(m.metrics)}`,`필수 metric: ${text(m.required)}`,`필수 metric 누락 / 측정 불가: ${text(m.missing)} / ${text(m.unavailable)}`,
 `실제 LLM 검토: ${text(report.review?.reviewedCount)}개 (${text(report.review?.status)})`,
 'partial/blocked 또는 확인 불가는 전체 측정 완료가 아닙니다. 누락 값은 0으로 해석하지 않습니다.','',
 '[선정된 검토 근거]', '선정은 결함 확정이 아닙니다. 신호군별 최대 5개, 전체 최대 20개, owner별 최대 3개입니다.',
 'confirmed-coupling 지표는 확인된 정적 연결 부분집합의 값입니다. fanIn/impact의 0은 실제 사용처가 없다는 뜻이 아닙니다.',
 '근거 위치의 UTF-16 offset은 0부터 시작하는 문자 좌표이며 [start, end)의 끝은 제외합니다. 줄 번호가 아닙니다.'];
 if(!selection)lines.push('선정 결과: 확인 불가');else{
  lines.push(`선정 수: ${selection.selected.length}`);
  const selectedIds=new Set(selection.selected.map(i=>i.id)),metrics=new Map();
  for(const row of report.metrics||[])if(selectedIds.has(row.itemId)){if(!metrics.has(row.itemId))metrics.set(row.itemId,[]);metrics.get(row.itemId).push(row);}
  for(const [index,item] of selection.selected.entries()){
   lines.push('',`${index+1}. ${text(label(item.id))}`,`   ID: ${text(item.id)}`,`   신호군: ${(item.groups||[]).map(text).join(', ')}`,`   owner: ${(item.owners||[]).map(text).join(', ')}`,`   선정 단계: ${text(item.phase)}; 최대 percentile: ${text(item.bestPercentile)}`);
   const signalLabels={'shape-only':'형태 지표만 선정됨 — size/interface Top 목록; 책임·변경 비용 검토 필요',
    'multiple-signal-groups':'여러 신호군의 Top 목록에 함께 선정됨 — 독립적인 결함 증명은 아님',
    'single-signal-group':'단일 신호군의 Top 목록에 선정됨 — 추가 의미 검토 필요'};
   lines.push('   신호 성격: '+(signalLabels[item.signalContext]||'확인 불가 (저장된 신호 분류 없음)'));
   const cluster=report.collectors?.structure?.clusters?.find(c=>c.id===item.id);
   if(cluster){
    const kinds={'requires-type-only':'type-only 선언 edge를 제외하면 관측 순환이 사라짐',
     'value-capable':'type-only 선언 edge를 제외해도 관측 순환이 남음','unknown':'edge의 타입 구분 근거 부족'};
    lines.push(`   순환 성격: ${kinds[cluster.dependencyKind]||'확인 불가'}; 런타임 결함 판정이 아님`);
    if(cluster.valueCyclePaths?.length)lines.push('   값 가능 순환 참여 파일: '+cluster.valueCyclePaths.map(text).join(', '));
   }
   const surfaceFile=report.collectors?.surface?.files?.find(f=>f.path===items.get(item.id)?.path),b=surfaceFile?.breakdown;
   if(b)lines.push(`   export 구성: 타입 선언=${text(b.typeDeclarations)}; 값 선언=${text(b.valueDeclarations)}; 타입 re-export=${text(b.typeReExports)}; 값 가능 re-export=${text(b.valueCapableReExports)}; 타입 local export=${text(b.typeLocalExports)}; 값 가능 local export=${text(b.valueCapableLocalExports)}; assignment=${text(b.exportAssignments)}`,
    '   export 수는 선언 entry 수이며 실제 런타임 API 개수나 Interface 결함 수가 아닙니다.');
   for(const r of (metrics.get(item.id)||[]).sort((a,b)=>a.name<b.name?-1:a.name>b.name?1:0))lines.push(`   - ${text(r.name)}: ${text(r.value)} ${text(r.unit)}; 유효성=${text(r.validity)}; percentile=${text(r.percentile)}; 출처=${text(r.source)}`);
   if(item.groups?.includes('coupling'))lines.push(...couplingExplanation(report,item,metrics.get(item.id)||[]));
   if(item.groups?.includes('coupling')){
    const paths=report.couplingPaths?.items?.filter(p=>p.itemId===item.id)||[];
    if(!paths.length)lines.push('   대표 경로: 확인 불가 (저장된 경로 설명 없음)');
    for(const entry of paths){
     lines.push(`   경로 상태 (${text(entry.name)}): ${text(entry.status)}; 생략=${text(entry.omitted)}; 이유=${text(entry.reason)}`);
     for(const witness of entry.paths||[]){
      lines.push(`   대표 경로 (${text(entry.name)}): ${witness.nodes.map(n=>text(label(n))).join(' -> ')}`);
      for(const edge of witness.edges)lines.push(`     근거: ${text(edge.classification)} / ${text(edge.reason)} / ${text(edge.proof?.sourcePath)}; UTF-16 offset [${text(edge.proof?.start)}, ${text(edge.proof?.end)})`);
     }
    }
   }
  }
  lines.push('','[신호군별 Top 목록]');for(const g of selection.groups||[])lines.push(`${text(g.name)}: ${g.ids.map(id=>text(label(id))).join(', ')||'없음'}`);
  lines.push('','[배제 사유별 집계]');const counts={};for(const e of selection.excluded||[])counts[e.reason]=(counts[e.reason]||0)+1;for(const reason of Object.keys(counts).sort())lines.push(`${text(reason)}: ${counts[reason]}개`);
  lines.push('','[판정 비교 진단 — 개선 후보와 별도]');
  const comparisons=report.queue?.comparisonDiagnostics||[];
  if(!comparisons.length&&!report.reconciliation?.mappings?.some(row=>row.status==='unresolved'))lines.push('없음');
  for(const row of comparisons){
   const entry=report.collectors?.capture?.ledger?.data?.entries?.find(e=>e.id===(row.priorId||row.id));
   lines.push(`${text(label(row.id))}: ${text(row.reason)}`,`   이전 판단: ${text(entry?.reason)}; 참조=${text(entry?.candidateRef)}`);
   for(const d of row.decision?.structure?.diagnostics||[])lines.push('   구조 비교: '+text(d));
   if(row.decision?.history?.reason)lines.push('   이력 비교: '+text(row.decision.history.reason));
   lines.push('   복구: '+text(row.decision?.history?.recovery||'원본 baseline과 수집 진단을 확인하세요. 비교 불가는 새 결함이 아니며 기존 판정을 자동 갱신하지 않습니다.'));
  }
  for(const row of report.reconciliation?.mappings||[])if(row.status==='unresolved')lines.push(`   Identity 비교: ${text(row.originalId)}; ${text(row.reason)}; 기존 판정=${text(row.entry?.reason)}`);
  lines.push('','[이전 검토의 재검토 상태]');
  for(const [id,decision] of Object.entries(report.decisions||{}).sort(([a],[b])=>a<b?-1:1)){
   const entry=report.collectors?.capture?.ledger?.data?.entries?.find(e=>e.id===(report.eligibility?.find(e=>e.id===id)?.priorId||id));
   lines.push(`${text(label(id))}: 구조=${text(decision.structure?.status)}; 이력=${text(decision.history?.status)}; 기준=${text(decision.structure?.basis)}`,
    `   이전 판단: ${text(entry?.reason)}; 참조=${text(entry?.candidateRef)}`);
   for(const diagnostic of decision.structure?.diagnostics||[])lines.push('   보존된 측정 한계: '+text(diagnostic));
  }
 }
 lines.push('','[측정 공백과 진단]');
 if(report.reason)lines.push(`실행 차단 사유: ${text(report.reason)}`);if(report.recovery)lines.push(`복구: ${text(report.recovery)}`);
 const graph=report.collectors?.graph,ast=report.collectors?.ast,surface=report.collectors?.surface;
 lines.push(`Graph 누락 파일 / 모호한 node / 누락 edge: ${text(graph?.missingFiles?.length)} / ${text(graph?.omittedNodes?.length)} / ${text(graph?.omittedEdges?.length)}`,
 `Graph 미해결 참조: ${text(graph?.unresolved?.validity)}; ${text(graph?.unresolved?.reason)}`,
 `AST 누락 symbol / 귀속: ${text(ast?.omittedSymbols?.length)} / ${text(ast?.omittedAttributions?.length)}`,
 `선언 추출: ${text(surface?.status)}; 진단 ${text(surface?.diagnostics?.length)}개`);
 const diagnostics=[...(report.diagnostics||[])];
 for(const [collector,data] of Object.entries(report.collectors||{}))for(const entry of data.gaps||[])diagnostics.push({collector,...entry});
 const seen=new Set();for(const d of diagnostics){const value=JSON.stringify(d);if(seen.has(value))continue;seen.add(value);lines.push(`- ${text(d.collector)}: ${text(d.reason)}`);if(d.recovery)lines.push('  복구: '+text(typeof d.recovery==='string'?d.recovery:JSON.stringify(d.recovery)));}
 lines.push('','[해석 범위]','높은 값이나 순위만으로 구조 결함, 테스트 품질, 실제 런타임 호출 관계를 확정할 수 없습니다.','선정 ID와 원시 metric은 별도 검토의 근거입니다. 전체 상세 행과 개별 배제 ID는 위 원시 JSON에 보존됩니다.','다음 batch는 명시적으로 요청할 때만 진행합니다. 이 보고서는 ledger 판단이나 소스 변경을 수행하지 않습니다.');
 return lines.join('\n')+'\n';
}
function writeReport(report,context){
 const createdAt=new Date().toISOString(),name='architecture-evidence-'+createdAt.replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.txt';
 const output=path.join(path.dirname(context.rawOutput),name);
 require('node:child_process').execFileSync('git',['-C',context.root,'check-ignore','--quiet','--no-index','--',path.relative(context.root,output)],{windowsHide:true,stdio:'pipe',timeout:30000});
 fs.writeFileSync(output,renderReport(report,{...context,createdAt}),{encoding:'utf8',flag:'wx'});return output;
}
function writeFailure(report,context){
 const createdAt=new Date().toISOString(),directory=path.join(require('node:os').tmpdir(),'architecture-evidence-reports');
 fs.mkdirSync(directory,{recursive:true});const output=path.join(directory,'architecture-evidence-'+createdAt.replace(/[:.]/g,'-')+'-'+randomUUID().slice(0,8)+'.txt');
 fs.writeFileSync(output,renderReport(report,{...context,createdAt,elapsedMs:undefined}),{encoding:'utf8',flag:'wx'});return output;
}
module.exports={renderReport,writeReport,writeFailure};
