const convert = require('./index.js');
const sub = convert.sub;

const chai = require('chai');
const expect = chai.expect;  // eslint-disable-line no-unused-vars
chai.should();


describe('convert()', function() {
  it('converts a simple example', () => {
    convert('a').should.equal('a-todo');
    sub().should.equal(1);
  });

  it.skip('converts an example with he four VSM-term types, ' +
     'and some `null` IDs', () => {
    convert('a').should.equal('a-todo');
    sub().should.equal(1);
  });

  it.skip('converts an all-in-one example', () => {
    convert('a').should.equal('a-todo');
    sub().should.equal(1);
  });
});
