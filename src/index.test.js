const vsmToRdf = require('./index.js');
const patchEnforceCorefs = vsmToRdf.patchEnforceCorefs;  // Temp. patch function.

const chai = require('chai');
const expect = chai.expect;  // eslint-disable-line no-unused-vars
chai.should();

const outdentBlock = s => s.replace(/^ +/gm, '').replace(/(^\n|\n$)/g, '');
const NS = '\n      ';  // For multiline `it()`-descriptions.


describe('vsmToRdf()', function() {


  it('converts a simple example, given as a VSM-JSON String', () => {
    var input = {
      terms: [
        { str: 'John',    classID: 'http://ont.ex/John',    instID: 'http://db.ex/00' },
        { str: 'eats',    classID: 'http://ont.ex/to-eat',  instID: 'http://db.ex/01' },
        { str: 'chicken', classID: 'http://ont.ex/chicken', instID: 'http://db.ex/02' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] }
      ]
    };

    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://db.ex/00 a http://ont.ex/John .
      http://db.ex/01 a http://ont.ex/to-eat .
      http://db.ex/02 a http://ont.ex/chicken .

      http://db.ex/01 vsmo:has-agent http://db.ex/00 ; vsmo:acts-on http://db.ex/02 .
    `);

    input = JSON.stringify(input);
    vsmToRdf(input).should.equal(output);
  });



  it('converts a simple example, given as a VSM-JSON JavaScript-Object', () => {
    var input = {
      terms: [
        { str: 'John',    classID: 'http://ont.ex/John',    instID: 'http://db.ex/00' },
        { str: 'eats',    classID: 'http://ont.ex/to-eat',  instID: 'http://db.ex/01' },
        { str: 'chicken', classID: 'http://ont.ex/chicken', instID: 'http://db.ex/02' },
        { str: 'with',    classID: 'http://ont.ex/to-use',  instID: 'http://db.ex/03' },
        { str: 'fork',    classID: 'http://ont.ex/fork',    instID: 'http://db.ex/04' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'T', pos: [ 1, 3, 4 ] }
      ]
    };
    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://db.ex/00 a http://ont.ex/John .
      http://db.ex/01 a http://ont.ex/to-eat .
      http://db.ex/02 a http://ont.ex/chicken .
      http://db.ex/03 a http://ont.ex/to-use .
      http://db.ex/04 a http://ont.ex/fork .

      http://db.ex/01 vsmo:has-agent http://db.ex/00 ; vsmo:acts-on http://db.ex/02 .
      http://db.ex/03 vsmo:has-agent http://db.ex/01 ; vsmo:acts-on http://db.ex/04 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('returns an empty string for an empty VSM structure', () => {
    vsmToRdf({ terms: [], conns: [] }).should.equal('');
  });



  it('returns `null` for some obvious errors', () => {
    expect(vsmToRdf(null)).to.equal(null);
    expect(vsmToRdf('not-a-json-string')).to.equal(null);
    expect(vsmToRdf({ terms: [] })).to.equal(null);
    expect(vsmToRdf({ conns: [] })).to.equal(null);

    expect(vsmToRdf({
      terms: [],
      conns: [ { type: 'T', pos: [ 0, 1, 2 ] } ]
    })).to.equal(null);
  });



  it('converts an example with the four VSM-term types, ' +
     NS + 'and replaces `null` IDs with dummy URIs', () => {
    var input = {
      terms: [
        { str: 'John',      classID: 'http://ont.ex/John',          instID: null },
        { str: 'saying',    classID: 'http://ont.ex/to-say',        instID: null },
        { str: 'duck',      classID: 'http://ont.ex/duck'                        },  // Class
        { str: 'has-label', classID: 'http://ont.ex/to-have-label', instID: null },
        { str: 'canard'                                                          },  // Literal
        { str: 'implies',   classID: 'http://ont.ex/to-imply',      instID: null },
        { str: 'he',        classID: 'http://ont.ex/John',          instID: null, parentID: null },  // RefInstance
        { str: 'knows',     classID: 'http://ont.ex/to-know',       instID: null },
        { str: 'French',    classID: null,                          instID: null }   // =request to create new Class.
      ],
      conns: [
        { type: 'T', pos: [ 2, 3, 4 ] },
        { type: 'T', pos: [ 0, 1, 3 ] },
        { type: 'T', pos: [ 6, 7, 8 ] },
        { type: 'T', pos: [ 1, 5, 7 ] },
        { type: 'R', pos: [ 6, 0 ] }
      ]
    };

    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://i.x/00 a http://ont.ex/John .
      http://i.x/01 a http://ont.ex/to-say .
      http://i.x/03 a http://ont.ex/to-have-label .
      http://i.x/05 a http://ont.ex/to-imply .
      http://i.x/06 a http://ont.ex/John .
      http://i.x/07 a http://ont.ex/to-know .
      http://i.x/08 a http://c.x/08-French .

      http://i.x/03 vsmo:has-agent http://ont.ex/duck ; vsmo:acts-on "canard"^^xsd:string .
      http://i.x/01 vsmo:has-agent http://i.x/00 ; vsmo:acts-on http://i.x/03 .
      http://i.x/07 vsmo:has-agent http://i.x/06 ; vsmo:acts-on http://i.x/08 .
      http://i.x/05 vsmo:has-agent http://i.x/01 ; vsmo:acts-on http://i.x/07 .
      http://i.x/06 vsmo:has-parent http://i.x/00 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('converts examples with an Edit-type VSM-term, giving them dummy URIs', () => {
    var input = {
      terms: [
        { type: 'ER' },
        { },
        { type: 'EC' },
        { type: 'EL' }
      ],
      conns: [
        { type: 'T', pos: [ 2, 1, 3 ] }
      ]
    };

    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://i.x/00 a http://c.x/00-(empty) .
      http://i.x/01 a http://c.x/01-(empty) .
      http://j.x/00 a http://c.x/00-(empty) .

      http://i.x/01 vsmo:has-agent http://c.x/02-(empty) ; vsmo:acts-on "(empty)"^^xsd:string .
      http://i.x/00 vsmo:has-parent http://j.x/00 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('converts an all-in-one example', () => {
    var input = {
      terms: [
        { str: 'John',          classID: 'http://ont.ex/John',          instID: 'http://db.ex/00' },
        { str: 'pushes',        classID: 'http://ont.ex/to-push',       instID: 'http://db.ex/01' },
        { str: 'button',        classID: 'http://ont.ex/button',        instID: 'http://db.ex/02' },
        { str: 'having color',  classID: 'http://ont.ex/to-have-color', instID: 'http://db.ex/03' },
        { str: 'green',         classID: 'http://ont.ex/green',         instID: 'http://db.ex/04' },
        { str: 'causing',       classID: 'http://ont.ex/to-cause',      instID: 'http://db.ex/05' },
        { str: 'it',            classID: 'http://ont.ex/button',        instID: 'http://db.ex/06', parentID: 'http://db.ex/02' },
        { str: 'to have color', classID: 'http://ont.ex/to-have-color', instID: 'http://db.ex/07' },
        { str: 'red',           classID: 'http://ont.ex/red',           instID: 'http://db.ex/08' },
        { str: 'and',           classID: 'http://ont.ex/and',           instID: 'http://db.ex/09' },
        { str: 'tiny',          classID: 'http://ont.ex/tiny',          instID: 'http://db.ex/10' },
        { str: 'bomb',          classID: 'http://ont.ex/bomb',          instID: 'http://db.ex/11' },
        { str: 'to explode',    classID: 'http://ont.ex/to-explode',    instID: 'http://db.ex/12' }
      ],
      conns: [
        { type: 'T', pos: [ 2, 3, 4 ] },
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'T', pos: [ 6, 7, 8 ] },
        { type: 'T', pos: [ 11, -1, 10 ] },
        { type: 'T', pos: [ 11, 12, -1 ] },
        { type: 'L', pos: [ 9, 7, 12 ] },
        { type: 'T', pos: [ 1, 5, 9 ] },
        { type: 'R', pos: [ 6, 2 ] }
      ]
    };

    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://db.ex/00 a http://ont.ex/John .
      http://db.ex/01 a http://ont.ex/to-push .
      http://db.ex/02 a http://ont.ex/button .
      http://db.ex/03 a http://ont.ex/to-have-color .
      http://db.ex/04 a http://ont.ex/green .
      http://db.ex/05 a http://ont.ex/to-cause .
      http://db.ex/06 a http://ont.ex/button .
      http://db.ex/07 a http://ont.ex/to-have-color .
      http://db.ex/08 a http://ont.ex/red .
      http://db.ex/09 a http://ont.ex/and .
      http://db.ex/10 a http://ont.ex/tiny .
      http://db.ex/11 a http://ont.ex/bomb .
      http://db.ex/12 a http://ont.ex/to-explode .

      http://db.ex/03 vsmo:has-agent http://db.ex/02 ; vsmo:acts-on http://db.ex/04 .
      http://db.ex/01 vsmo:has-agent http://db.ex/00 ; vsmo:acts-on http://db.ex/02 .
      http://db.ex/07 vsmo:has-agent http://db.ex/06 ; vsmo:acts-on http://db.ex/08 .
      [a vsmo:HasQuality] vsmo:has-agent http://db.ex/11 ; vsmo:acts-on http://db.ex/10 .
      http://db.ex/12 vsmo:has-agent http://db.ex/11 .
      http://db.ex/09 vsmo:has-first-element http://db.ex/07 .
      http://db.ex/07 vsmo:has-next-element http://db.ex/12 .
      http://db.ex/05 vsmo:has-agent http://db.ex/01 ; vsmo:acts-on http://db.ex/09 .
      http://db.ex/06 vsmo:has-parent http://db.ex/02 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('replaces a coreference-connected child\'s `null` parentID ' +
     NS + 'with the parent\'s instID, and copies the parent\'s classID', () => {
    var input = {
      terms: [
        { str: 'John',     classID: null, instID: null },
        { str: 'talks to', classID: null, instID: null },
        { str: 'himself',  classID: null, instID: null, parentID: null }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://i.x/00 a http://c.x/00-John .
      http://i.x/01 a http://c.x/01-talks-to .
      http://i.x/02 a http://c.x/00-John .

      http://i.x/01 vsmo:has-agent http://i.x/00 ; vsmo:acts-on http://i.x/02 .
      http://i.x/02 vsmo:has-parent http://i.x/00 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('replaces a not-coreferencing-in-this-sentence child\'s `null` parentID/' +
     NS + 'instID/classID with dummy URIs', () => {
    var input = {
      terms: [
        { str: 'John',     classID: 'http://ont.ex/John',       instID: 'http://db.ex/00' },
        { str: 'talks to', classID: 'http://ont.ex/to-talk-to', instID: 'http://db.ex/01' },
        { str: 'her',      classID: null,                       instID: null,              parentID: null }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] }
      ]
    };
    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://db.ex/00 a http://ont.ex/John .
      http://db.ex/01 a http://ont.ex/to-talk-to .
      http://i.x/02 a http://c.x/02-her .
      http://j.x/02 a http://c.x/02-her .

      http://db.ex/01 vsmo:has-agent http://db.ex/00 ; vsmo:acts-on http://i.x/02 .
      http://i.x/02 vsmo:has-parent http://j.x/02 .
    `);
    vsmToRdf(input).should.equal(output);
  });



  it('processes a not-coreferencing-in-this-sentence child\'s non-`null`' +
     NS + 'parentID correctly', () => {
    var input = {
      terms: [
        { str: 'John',     classID: 'http://ont.ex/John',       instID: 'http://db.ex/00' },
        { str: 'talks to', classID: 'http://ont.ex/to-talk-to', instID: 'http://db.ex/01' },
        { str: 'her',      classID: 'http://ont.ex/Alice',      instID: 'http://db.ex/02', parentID: 'http://db.ex/777' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] }
      ]
    };
    var output = outdentBlock(`
      PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
      PREFIX vsmo: <http://www.w3id.org/vsmo/>

      http://db.ex/00 a http://ont.ex/John .
      http://db.ex/01 a http://ont.ex/to-talk-to .
      http://db.ex/02 a http://ont.ex/Alice .
      http://db.ex/777 a http://ont.ex/Alice .

      http://db.ex/01 vsmo:has-agent http://db.ex/00 ; vsmo:acts-on http://db.ex/02 .
      http://db.ex/02 vsmo:has-parent http://db.ex/777 .
    `);
    vsmToRdf(input).should.equal(output);
  });
});



describe('patchEnforceCorefs() [temporary patch for vsm-box@1.0.0]', function() {

  it('enforces that for coreference connectors, the child is a RefInstance and ' +
     NS + 'parent a (Ref/)Instance, by adding dummy IDs if needed ', () => {
    var vsm1 = {
      terms: [
        { str: 'John'                                  },
        { str: 'talks to', classID: null, instID: null },
        { str: 'himself'                               }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    var vsm2 = {
      terms: [
        { str: 'John',     classID: null, instID: null },
        { str: 'talks to', classID: null, instID: null },
        { str: 'himself',  classID: null, instID: null, parentID: null }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    patchEnforceCorefs(vsm1).should.deep.equal(vsm2);
  });



  it('enforces that for coreference connectors, the child term parent/classIDs ' +
     NS + 'correctly refers to the parent term', () => {
    var vsm1a = {
      terms: [
        { str: 'John',     classID: 'http://ont.ex/John',       instID: 'http://db.ex/00' },
        { str: 'talks to', classID: 'http://ont.ex/to-talk-to', instID: 'http://db.ex/01' },
        { str: 'himself',  classID: 'http://ont.ex/aaaaaa',     instID: 'http://db.ex/02', parentID: 'http://db.ex/9999' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    var vsm1b = {
      terms: [
        { str: 'John',     classID: 'http://ont.ex/John',       instID: 'http://db.ex/00' },
        { str: 'talks to', classID: 'http://ont.ex/to-talk-to', instID: 'http://db.ex/01' },
        { str: 'himself',  classID: null,                       instID: 'http://db.ex/02', parentID: 'http://db.ex/9999' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    var vsm2 = {
      terms: [
        { str: 'John',     classID: 'http://ont.ex/John',       instID: 'http://db.ex/00' },
        { str: 'talks to', classID: 'http://ont.ex/to-talk-to', instID: 'http://db.ex/01' },
        { str: 'himself',  classID: 'http://ont.ex/John',       instID: 'http://db.ex/02', parentID: 'http://db.ex/00' }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] }
      ]
    };
    patchEnforceCorefs(vsm1a).should.deep.equal(vsm2);
    patchEnforceCorefs(vsm1b).should.deep.equal(vsm2);
  });



  it('propagates IDs, respecting parent->child=parent->child dependency ' +
     'chains', () => {
    var vsm1 = {
      terms: [
        { str: 'John',      classID: 'http://ont.ex/John', instID: 'http://db.ex/00' },
        { str: 'talks to',  classID: null,                 instID: null              },
        { str: 'himself',   classID: null,                 instID: null              },
        { str: 'cheers up', classID: null,                 instID: null              },
        { str: 'him',       classID: null,                 instID: null              }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] },
        { type: 'T', pos: [ 1, 3, 4 ] },
        { type: 'R', pos: [ 4, 2 ] }
      ]
    };
    var vsm2 = {
      terms: [
        { str: 'John',      classID: 'http://ont.ex/John', instID: 'http://db.ex/00' },
        { str: 'talks to',  classID: null,                 instID: null              },
        { str: 'himself',   classID: 'http://ont.ex/John', instID: null              , parentID: 'http://db.ex/00' },
        { str: 'cheers up', classID: null,                 instID: null              },
        { str: 'him',       classID: 'http://ont.ex/John', instID: null              , parentID: null }
      ],
      conns: [
        { type: 'T', pos: [ 0, 1, 2 ] },
        { type: 'R', pos: [ 2, 0 ] },
        { type: 'T', pos: [ 1, 3, 4 ] },
        { type: 'R', pos: [ 4, 2 ] }
      ]
    };
    patchEnforceCorefs(vsm1).should.deep.equal(vsm2);

    // Switch order of the two coreferences in the array, and test that
    // filling-in still happens in the right order.
    var x = vsm1.conns[1];  vsm1.conns[1] = vsm1.conns[3];  vsm1.conns[3] = x;
    x     = vsm2.conns[1];  vsm2.conns[1] = vsm2.conns[3];  vsm2.conns[3] = x;
    patchEnforceCorefs(vsm1).should.deep.equal(vsm2);
  });
});
