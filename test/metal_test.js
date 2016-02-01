'use strict';

const broccoli = require('broccoli');
const chai = require('chai');
const metal = require('..');
const expect = chai.expect;
const fs = require('fs');
const path = require('path');

const fixtureDir = './test/fixture';

let builder;

describe('accessing the files tree', function() {

  afterEach(function() {
    if (builder) {
      builder.cleanup();
      builder = null;
    }
  });

  it('can access all files in the tree', function() {
    var tree = fixtureDir;

    tree = metal(tree, function(files) {
      expect(Object.keys(files).length).to.equal(7);
      expect(files['a.js']).to.equal('a');
      expect(files['b.txt']).to.equal('b');
      expect(files['foo/c.js']).to.equal('c');
      expect(files['foo/d.js']).to.equal('d');
      expect(files['foo/e.txt']).to.equal('e');
      expect(files['foo/bar/f.txt']).to.equal('f');
      expect(files['foo/bar/g.js']).to.equal('g');
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      expect(getFileContents(dir, 'a.js')).to.equal('a');
      expect(getFileContents(dir, 'b.txt')).to.equal('b');
      expect(getFileContents(dir, 'foo/c.js')).to.equal('c');
      expect(getFileContents(dir, 'foo/d.js')).to.equal('d');
      expect(getFileContents(dir, 'foo/e.txt')).to.equal('e');
      expect(getFileContents(dir, 'foo/bar/f.txt')).to.equal('f');
      expect(getFileContents(dir, 'foo/bar/g.js')).to.equal('g');
    });
  });

  it('can delete files in the tree', function() {
    let tree = metal(fixtureDir, function(files) {
      delete files['foo/c.js'];
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      expect(getFileContents(dir, 'foo/c.js')).to.equal(undefined);
    });
  });

  it('can modify file contents', function() {
    let tree = metal(fixtureDir, function(files) {
      expect(files['foo/c.js']).to.equal('c');
      files['foo/c.js']  = 'jakers';
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      expect(getFileContents(dir, 'foo/c.js')).to.equal('jakers');
    });
  });

  it('can generate new files', function() {
    let tree = metal(fixtureDir, function(files) {
      files['my/new/file.js'] = 'foo';
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      expect(getFileContents(dir, 'my/new/file.js')).to.equal('foo');
    });
  });

  it('can create a whole new tree', function() {
    let tree = metal(fixtureDir, function() {
      return {'my/new/file.txt': 'foo'};
    });

    builder = new broccoli.Builder(tree);

    return builder.build().then(function(dir) {
      expect(getFileContents(dir, 'a.js')).to.equal(undefined);
      expect(getFileContents(dir, 'my/new/file.txt')).to.equal('foo');
    });
  });

});

function getFileContents(output, filePath) {
  filePath = path.join(output.directory, filePath);
  try {
    return fs.readFileSync(filePath).toString('utf8');
  } catch(e) {}
}
