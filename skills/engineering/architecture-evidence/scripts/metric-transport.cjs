'use strict';
const {gzipSync,gunzipSync}=require('node:zlib');
const BINDING_LIMIT=128*1024*1024;
// Private child-process wire representation; public collector/report records stay unchanged.
function packResult(result){
  if(!Array.isArray(result.metrics))return {result};
  const {metrics,...rest}=result,templates=[],indices=new Map();
  const rows=metrics.map(({itemId,value,...metadata})=>{
    const key=JSON.stringify(metadata);let index=indices.get(key);
    if(index===undefined){index=templates.length;indices.set(key,index);templates.push(metadata);}
    return [itemId,value,index];
  });
  let bindingWire;
  if(rest.bindingEvidence){
    const bytes=Buffer.from(JSON.stringify(rest.bindingEvidence));
    if(bytes.length>BINDING_LIMIT)throw new Error('binding evidence transport exceeds 128 MiB expanded limit');
    bindingWire={version:1,encoding:'gzip-base64',data:gzipSync(bytes).toString('base64')};
    delete rest.bindingEvidence;
  }
  return {result:rest,metricTable:{version:1,templates,rows},...(bindingWire?{bindingWire}:{})};
}
function unpackResult(envelope){
  let {result}=envelope;const {metricTable,bindingWire}=envelope;
  if(bindingWire){
    if(bindingWire.version!==1||bindingWire.encoding!=='gzip-base64'||typeof bindingWire.data!=='string'||Object.hasOwn(result,'bindingEvidence'))throw new Error('invalid binding evidence transport');
    result={...result,bindingEvidence:JSON.parse(gunzipSync(Buffer.from(bindingWire.data,'base64'),{maxOutputLength:BINDING_LIMIT}).toString('utf8'))};
  }
  if(!metricTable)return result;
  if(metricTable.version!==1||!Array.isArray(metricTable.templates)||!Array.isArray(metricTable.rows))throw new Error('invalid metric transport');
  return {...result,metrics:metricTable.rows.map(row=>{
    if(!Array.isArray(row)||row.length!==3||!Number.isSafeInteger(row[2])||row[2]<0||row[2]>=metricTable.templates.length)throw new Error('invalid metric transport row');
    return {...metricTable.templates[row[2]],itemId:row[0],value:row[1]};
  })};
}
module.exports={packResult,unpackResult};
