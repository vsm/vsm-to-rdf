module.exports = vsmToRdf;
module.exports.patchEnforceCorefs = patchEnforceCorefs;


const prefixRDF = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>';
const prefixXSD = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>';
const prefixVSM = 'PREFIX vsmo: <http://www.w3id.org/vsmo/>';

const Subj   = 'vsmo:has-agent';
const Obj    = 'vsmo:acts-on';
const Attr   = 'vsmo:HasQuality';
const First  = 'vsmo:has-first-element';
const Next   = 'vsmo:has-next-element';
const Parent = 'vsmo:has-parent';
//const Rel    = 'vsmo:ActiveRelation';

const StringTypeExt = '^^xsd:string';
const EditTermStr = '(empty)';
const NL = '\n';

const dummyID  = (pos, c) => `http://${c}.x/` + pos.toString().padStart(2, '0');
const dummyInstID         = pos => dummyID(pos, 'i');
const dummyInstParentID   = pos => dummyID(pos, 'j');
const dummyClassID = (pos, str) => dummyID(pos, 'c') + '-' + str.replace(/ /g, '-');



/*
 * Wraps the main code in thrown-Error detection, so the main code doesn't need
 * extra indentation. An error could be thrown by JSON.parse(), or some error in
 * the JSON-data could cause attempts to access a property of `undefined`.
 * On error, returns `null`.
 */
function vsmToRdf(strOrObj) {
  try {
    return convert(strOrObj);
  }
  catch(err)  { return null; }
}



function convert(strOrObj) {

  // If the argument is a JSON String, convert it to a JavaScript-Object.
  var vsm = typeof strOrObj == 'string' ? JSON.parse(strOrObj) : strOrObj;

  // If there is no actual content, return ''.
  if (!vsm.terms.length && !vsm.conns.length)  return '';

  // Apply a patch for vsm-box@1.0.0 (see the function's description).
  vsm = patchEnforceCorefs(vsm);


  // --- 1) Fill in `null` IDs, if any ---

  // Make an array of copied terms (don't change the originals), in which `null`
  // class/instIDs are replaced with dummy IDs.  Leave the parentIDs unchanged.
  var terms = vsm.terms.map((t, pos) => {
    return t.str ?
      {
        str: t.str,
        ...(t.classID  === undefined ? 0 : { classID:  t.classID || dummyClassID(pos, t.str) }),
        ...(t.instID   === undefined ? 0 : { instID:   t.instID  || dummyInstID (pos) }),
        ...(t.parentID === undefined ? 0 : { parentID: t.parentID })
      } :
      {
        str: EditTermStr,
        ...(t.type == 'EL'                   ? 0 : { classID:  dummyClassID     (pos, EditTermStr) }),
        ...(t.type == 'EL' || t.type == 'EC' ? 0 : { instID:   dummyInstID      (pos) }),
        ...(t.type != 'ER'                   ? 0 : { parentID: dummyInstParentID(pos) })
      };
  });

  // For each coreference connector's child term having a `null` parentID:
  // copy from parent's instID, and copy classID in case the child got a dummyID.
  var refConns = vsm.conns.filter(c => c.type == 'R');
  refConns.forEach(c => {
    var tc = terms[c.pos[0]];    // Child term.
    if (tc.parentID === null) {
      var tp = terms[c.pos[1]];  // Parent term.
      tc.parentID = tp.instID;
      tc.classID  = tp.classID;
    }
  });

  // Replace any remaining `null` parentIDs with a dummy ID.
  terms.forEach((t, pos) => {
    if (t.parentID === null)  t.parentID = dummyInstParentID(pos);
  });

  // Make a list of VSM-RefInstance terms, that refer to a parent term that is
  // outside of this VSM-sentence.
  var extRefTerms = terms.filter((t, pos) =>
    t.parentID  &&  !refConns.filter(c => c.pos[0] == pos).length
  );


  // --- 2) Add RDF prefixes ---

  var xsd = terms.reduce((b, t) => b || t.classID === undefined, 0);
  var rdf = [
    prefixRDF,
    ...(xsd ? [prefixXSD]: []),  // Only add XSD if there is a VSM-Literal term.
    prefixVSM];

  // Add a newline separator to make the output look nicer.
  rdf.push('');


  // --- 3) Add RDF for VSM-terms ---

  // Add a 'rdf:type' for VSM-Instance and -RefInstance terms.
  terms.forEach(t => t.instID  &&  rdf.push(`${t.instID  } a ${t.classID} .`));
  extRefTerms.forEach(t =>         rdf.push(`${t.parentID} a ${t.classID} .`));
  rdf.push('');


  // --- 4) Add RDF for VSM-connectors ---

  vsm.conns.forEach(c => {
    // Map all connector-leg positions to their corresponding VSM-term's:
    // - instID  for VSM-Ref/Instances, or
    // - classID for VSM-Classes  (Note: null-IDs are gone here), or
    // - an RDF-Literal string for VSM-Literals, or
    // - -1 if no term is there.
    var q = c.pos.map(p => p == -1 ? -1 : terms[p]);
    q = q.map(t =>
      t == -1 ?  -1 :  (t.instID || t.classID || `"${t.str}"${StringTypeExt}`)
    );

    // Add custom RDF for each VSM-connector.
    if (c.type == 'T') {
      if      (q[2] == -1) {  // Object-omitting bident.
        rdf.push(`${q[1]} ${Subj} ${q[0]} .`);
      }
      else if (q[0] == -1) {  // Subject-omitting bident.
        rdf.push(`${q[1]} ${Obj} ${q[2]} .`);
      }
      else if (q[1] == -1) {  // Relation-omitting bident.
        rdf.push(`[a ${Attr}] ${Subj} ${q[0]} ; ${Obj} ${q[2]} .`);
      }
      else {                   // Full trident.
        rdf.push(`${q[1]} ${Subj} ${q[0]} ; ${Obj} ${q[2]} .`);
      }
    }
    else if (c.type == 'L') {  // List-connector.
      for (var i = 1;  i < q.length;  i++) {
        rdf.push(`${q[i - 1]} ${ i==1 ? First : Next } ${q[i]} .`);
      }
    }
    else if (c.type == 'R') {  // Coreference.
      rdf.push(`${q[0]} ${Parent} ${q[1]} .`);
    }
  });

  extRefTerms.forEach(t => rdf.push(`${t.instID} ${Parent} ${t.parentID} .`));


  return rdf.join(NL);
}



/**
 * Enforces something that is not yet implemented in vsm-box@1.0.0's output:
 * for each coreference connector:
 * - the parent term should have at least the 2 IDs to be a VSM-Instance,
 * - the child should have all 3 IDs to be a VSM-RefInstance,
 * - child.parentID == parent.instID,
 * - their classID is the same.
 *
 * For chains of coreferences, it ensures this is done in the right order
 * of possible dependencies: by following a list of coreference-connectors in
 * `vsm`, sorted first by parent and then by child position.
 *
 * Returns a cloned, changed object based on `vsm`.
 */
function patchEnforceCorefs(vsm) {
  vsm = JSON.parse(JSON.stringify(vsm));
  vsm.conns
    .filter(c => c.type == 'R')
    .sort((c1, c2) => c1.pos[0] - c2.pos[0] || c1.pos[1] - c2.pos[1])
    .forEach(c => {
      var tp = vsm.terms[c.pos[1]];  // Parent term.
      tp.classID  = tp.classID || null;
      tp.instID   = tp.instID  || null;
      var tc = vsm.terms[c.pos[0]];  // Child term.
      tc.classID  = tp.classID;
      tc.instID   = tc.instID  || null;
      tc.parentID = vsm.terms[c.pos[1]].instID;
    });
  return vsm;
}
