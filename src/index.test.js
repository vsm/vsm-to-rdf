const convert = require('./index.js');

const chai = require('chai');
const expect = chai.expect;  // eslint-disable-line no-unused-vars
chai.should();

const outdentBlock = s => s.replace(/^ +/gm, '').replace(/(^\n|\n$)/g, '');



describe('convert()', function() {


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
    convert(input).should.equal(output);
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
    convert(input).should.equal(output);
  });



  it('returns `null` for some obvious errors', () => {
    expect(convert('not-a-json-string')).to.equal(null);
    expect(convert({ terms: [] })).to.equal(null);
    expect(convert({ conns: [] })).to.equal(null);
  });



  it('converts an example with the four VSM-term types, ' +
     'and some `null` IDs', () => {
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

      http://inst.x/00 a http://ont.ex/John .
      http://inst.x/01 a http://ont.ex/to-say .
      http://inst.x/03 a http://ont.ex/to-have-label .
      http://inst.x/05 a http://ont.ex/to-imply .
      http://inst.x/06 a http://ont.ex/John .
      http://inst.x/07 a http://ont.ex/to-know .
      http://inst.x/08 a http://class.x/08 .

      http://inst.x/03 vsmo:has-agent http://ont.ex/duck ; vsmo:acts-on "canard"^^xsd:string .
      http://inst.x/01 vsmo:has-agent http://inst.x/00 ; vsmo:acts-on http://inst.x/03 .
      http://inst.x/07 vsmo:has-agent http://inst.x/06 ; vsmo:acts-on http://inst.x/08 .
      http://inst.x/05 vsmo:has-agent http://inst.x/01 ; vsmo:acts-on http://inst.x/07 .
      http://inst.x/06 vsmo:has-parent http://inst.x/00 .
    `);
    convert(input).should.equal(output);
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
    convert(input).should.equal(output);
  });
});
