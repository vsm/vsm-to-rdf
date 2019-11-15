module.exports = convert;


const prefixRDF = 'PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>';
const prefixXSD = 'PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>';
const prefixVSM = 'PREFIX vsmo: <http://www.w3id.org/vsmo/>';

const Subj   = 'vsmo:has-agent';
const Obj    = 'vsmo:acts-on';
const Attr   = 'vsmo:HasQuality';
const First  = 'vsmo:has-first-element';
const Next   = 'vsmo:has-next-element';
const Parent = 'vsmo:has-parent';
const Rel    = 'vsmo:ActiveRelation';

const N = '\n';

const dummyInstID  = pos => 'http://inst.x/'  + pos.toString().padStart(2, '0');
const dummyClassID = pos => 'http://class.x/' + pos.toString().padStart(2, '0');



function convert(strOrObj) {

  // If the argument is a JSON String, convert it to a JavaScript-Object.
  try {
    var vsm = typeof strOrObj == 'string' ?
      JSON.parse(strOrObj) :
      JSON.parse(JSON.stringify(strOrObj));  // Cloning protects it from the..
  } catch(err)  { return null; }             // ..changes we may make below.

  // Check for some obvious errors.
  if (!vsm.terms || !vsm.conns)  return null;


  // Fill in `null` IDs.
  vsm.terms.forEach((t, pos) => {
    if (t.instID  === null)  t.instID  = dummyInstID (pos);
    if (t.classID === null)  t.classID = dummyClassID(pos);
  });

  // TODO: Deal with `null` parentIDs.  And add test.
  //
  //
  //


  // --- 0) Add RDF prefixes ---
  var xsd = vsm.terms.reduce((b, t) => b || typeof t.classID == 'undefined', 0);
  var rdf = [
    prefixRDF,
    ...(xsd ? [prefixXSD]: []),  // Only add XSD if there is a Literal-type VSM-term.
    prefixVSM];

  // Add a newline separator to make the output look nicer.
  rdf.push('');


  // --- 1) Process VSM-terms ---

  // Add a 'rdf:type' for VSM-Instance and -RefInstance terms.
  vsm.terms.forEach(t => t.instID  &&  rdf.push(`${t.instID} a ${t.classID} .`));
  rdf.push('');


  // --- 2) Process VSM-connectors ---
  vsm.conns.forEach(c => {
    // Map all connector-leg positions to their corresponding VSM-term's:
    // - instID  for VSM-Ref/Instances, or
    // - classID for VSM-Classes  (Note: null-IDs are gone here), or
    // - an RDF-Literal string for VSM-Literals, or
    // - -1 if no term is there (for bident omitted leg, or error in data).
    var q = c.pos.map(p => p == -1 ? -1 : vsm.terms[p]);
    q = q.map(t =>
      (t == -1 || !t) ?  -1 :
      (t.instID || t.classID || `"${t.str}"^^xsd:string`)
    );

    // Add custom RDF for each VSM-connector.
    if (c.type == 'T') {
      if      (q[2] == -1) {  // Object-omitting bident.
        rdf.push(`${q[1]} vsmo:has-agent ${q[0]} .`);
      }
      else if (q[0] == -1) {  // Subject-omitting bident.
        rdf.push(`${q[1]} vsmo:acts-on ${q[2]} .`);
      }
      else if (q[1] == -1) {  // Relation-omitting bident.
        rdf.push(`[a vsmo:HasQuality] vsmo:has-agent ${q[0]} ; vsmo:acts-on ${q[2]} .`);
      }
      else {                   // Full trident.
        rdf.push(`${q[1]} vsmo:has-agent ${q[0]} ; vsmo:acts-on ${q[2]} .`);
      }
    }
    else if (c.type == 'L') {  // List-connector.
      for (var i = 1;  i < q.length;  i++) {
        rdf.push(`${q[i - 1]} vsmo:has-${ i==1 ? 'first' : 'next' }-element ${q[i]} .`);
      }
    }
    else if (c.type == 'R') {  // Coreference.
      rdf.push(`${q[0]} vsmo:has-parent ${q[1]} .`);
    }

    // TODO: Deal with coreferencing to parentID not in the VSM-sentence
    //       (pointing to outside it).  And add test.
    //
    //
    //
  });


  return rdf.join(N);
}
