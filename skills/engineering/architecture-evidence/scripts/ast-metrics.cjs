'use strict';
const ts = require('typescript');
const { sourcePath, evidenceId, evidenceItems, metricRecord, fingerprint } = require('./schema.cjs');
const SOURCE = 'typescript@5.3.3:ast-metrics-v2';
const decisions = new Set([ts.SyntaxKind.IfStatement, ts.SyntaxKind.ForStatement, ts.SyntaxKind.ForInStatement, ts.SyntaxKind.ForOfStatement, ts.SyntaxKind.WhileStatement, ts.SyntaxKind.DoStatement, ts.SyntaxKind.CaseClause, ts.SyntaxKind.CatchClause, ts.SyntaxKind.ConditionalExpression]);
function collectAstMetrics(inputs) {
  if (ts.version !== '5.3.3') throw new Error('Expected pinned TypeScript 5.3.3');
  const rows = [], anonymousAttributions = [], diagnostics = [], omittedSymbols = [], omittedAttributions = [];
  const ordered = inputs.map(input => ({ path: sourcePath(input.path), source: input.source })).sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  if (new Set(ordered.map(input => input.path)).size !== ordered.length) throw new Error('duplicate source path');
  for (const input of ordered) {
    const file = sourcePath(input.path);
    const language = /\.(?:[cm]?ts|tsx)$/.test(file) ? 'typescript' : /\.(?:[cm]?js|jsx)$/.test(file) ? 'javascript' : 'unsupported';
    const start = rows.length, attributionStart = anonymousAttributions.length;
    try {
    if (language === 'unsupported') throw new Error('unsupported language');
    const sf = ts.createSourceFile(file, input.source, ts.ScriptTarget.Latest, true);
    const options = { noLib: true, noResolve: true, noEmit: true, allowJs: true };
    const host = ts.createCompilerHost(options);
    host.getSourceFile = name => name === file ? sf : undefined;
    const syntaxErrors = ts.createProgram([file], options, host).getSyntacticDiagnostics(sf);
    if (syntaxErrors.length) throw new Error(syntaxErrors.map(d => ts.flattenDiagnosticMessageText(d.messageText, '\n')).join('; '));
    const fileRow = { identity: { kind: 'file', path: file }, language, values: { loc: input.source ? input.source.split(/\r\n|\r|\n/).length - (/\r?\n$|\r$/.test(input.source) ? 1 : 0) : 0, topLevelComplexity: 1 } };
    rows.push(fileRow);
    function visit(node, owner, scope = []) {
      if ((ts.isClassDeclaration(node) || ts.isClassExpression(node) || ts.isModuleDeclaration(node)) && node.name) scope = [...scope, node.name.getText(sf)];
      if (ts.isFunctionLike(node) && node.body) {
        let parent = node.parent;
        while (ts.isParenthesizedExpression(parent) || ts.isAsExpression(parent) || ts.isTypeAssertionExpression(parent) || ts.isSatisfiesExpression(parent) || ts.isNonNullExpression(parent)) parent = parent.parent;
        const declared = node.name || ((ts.isVariableDeclaration(parent) || ts.isPropertyDeclaration(parent) || ts.isPropertyAssignment(parent)) ? parent.name : null);
        if (declared) {
          const name = [...scope, declared.getText(sf)];
          owner = { identity: { kind: 'symbol', path: file, qualifiedName: name.join('.'), symbolKind: ts.isMethodDeclaration(node) ? 'method' : 'function' }, language, values: { functionLength: sf.getLineAndCharacterOfPosition(node.end - 1).line - sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1, complexity: 1 } };
          rows.push(owner); scope = name;
        } else anonymousAttributions.push({ path: file, ownerId: evidenceId(owner.identity), kind: ts.SyntaxKind[node.kind] });
      }
      if (decisions.has(node.kind) || ts.isBinaryExpression(node) && [ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken].includes(node.operatorToken.kind)) owner.values[owner.identity.kind === 'file' ? 'topLevelComplexity' : 'complexity']++;
      ts.forEachChild(node, child => { visit(child, owner, scope); });
    }
    visit(sf, fileRow);
    const fileRows=rows.slice(start),counts=new Map();
    for(const row of fileRows){const id=evidenceId(row.identity);counts.set(id,(counts.get(id)||0)+1);}
    const ambiguous=new Set([...counts].filter(([,count])=>count>1).map(([id])=>id));
    if(ambiguous.size){
      const reason='ambiguous symbol identity; all colliding symbols omitted';
      for(const id of ambiguous)omittedSymbols.push({id,identity:fileRows.find(row=>evidenceId(row.identity)===id).identity,count:counts.get(id),reason});
      rows.splice(start,rows.length-start,...fileRows.filter(row=>!ambiguous.has(evidenceId(row.identity))));
      const attributions=anonymousAttributions.splice(attributionStart);
      for(const attribution of attributions)if(ambiguous.has(attribution.ownerId))omittedAttributions.push({...attribution,reason});else anonymousAttributions.push(attribution);
      diagnostics.push({path:file,reason});
    }
    evidenceItems(rows.slice(start).map(row => row.identity));
    } catch (error) {
      rows.splice(start); anonymousAttributions.splice(attributionStart);
      diagnostics.push({ path: file, reason: error.message });
      rows.push({ identity: { kind: 'file', path: file }, language, values: { loc: null }, reason: error.message });
    }
  }
  const metrics = rows.flatMap(row => Object.entries(row.values).map(([name, value]) => metricRecord({ schemaVersion: 1, itemId: evidenceId(row.identity), name, value, unit: /complexity/i.test(name) ? 'branches+1' : 'lines', direction: 'higher', source: SOURCE, validity: row.reason ? 'unavailable' : 'valid', ...(row.reason ? { reason: row.reason } : {}), cohort: row.language + ':' + row.identity.kind, population: rows.filter(r => r.language === row.language && r.identity.kind === row.identity.kind).length })));
  return { status: diagnostics.length ? 'partial' : 'complete', inputIdentity: fingerprint(ordered), items: rows.map(row => ({ id: evidenceId(row.identity), identity: row.identity })), metrics, anonymousAttributions, omittedSymbols, omittedAttributions, diagnostics };
}
module.exports = { collectAstMetrics };
