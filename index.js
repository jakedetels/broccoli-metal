'use strict';

const Plugin = require('broccoli-plugin');
const fs = require('fs-extra');
const path = require('path');

module.exports = Metal;

function Metal(inputNodes, modifierFn) {
  if ( ! (this instanceof Metal)) {
    return new Metal(inputNodes, modifierFn);
  }

  inputNodes = [].concat(inputNodes);

  Plugin.call(this, inputNodes);

  this.modifierFn = modifierFn;
}

Metal.prototype = Object.create(Plugin.prototype);

Metal.prototype.constructor = Metal;

Metal.prototype.build = function() {
  this.inputPaths.forEach(this.processNode.bind(this));
};

Metal.prototype.processNode = function(inputPath) {
  let files = {};

  processDirectory(files, inputPath, inputPath);

  let filesOriginal = simpleClone(files);

  // allow the modifer function to optionally return a new file structure
  files = this.modifierFn(files) || files;

  Object.keys(files).forEach(filePath => {
    let contents = files[filePath];
    let originalContents = filesOriginal[filePath];
    let newFilePath = path.join(this.outputPath, filePath);

    if (contents === originalContents) {
      let oldFilePath = path.join(inputPath, filePath);
      fs.ensureSymlinkSync(oldFilePath, newFilePath);
    } else {
      fs.createFileSync(newFilePath);
      fs.writeFileSync(newFilePath, contents);
    }
  });  
};

function processDirectory(filesObj, rootDir, dir) {
  let contents = fs.readdirSync(dir);
  contents.forEach( file => {
    let filePath = path.join(dir, file);
    let stat = fs.statSync(filePath);
    if (stat.isFile()) {
      let contents = fs.readFileSync(filePath);
      filePath = filePath.replace(rootDir, '').replace(/^[\/\\]/, '').replace(/\\/g, '/');
      filesObj[filePath] = contents.toString('utf8');
    } else if (stat.isDirectory()) {
      processDirectory(filesObj, rootDir, filePath);
    }
  });
}

function simpleClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}
