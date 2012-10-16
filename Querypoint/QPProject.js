// Google BSD license http://code.google.com/google_bsd_license.html
// Copyright 2011 Google Inc. johnjbarton@google.com

// A traceur RemoteWebPageProject that adds tracing to every compile

function QPProject(url) {
  RemoteWebPageProject.call(this, url);
  // FIXME override parent __getter__ for reporter
  this.reporter_ = new QPErrorReporter();

  this.compiler_ = new QPCompiler(this.reporter, {}); // TODO traceur options
      

}

QPProject.prototype = Object.create(RemoteWebPageProject.prototype);
      
      function generateFileName(location) {
        if (location) {
          return location.start.source.name;
        } else {
          return "internal";
        }
      };

QPProject.prototype.generateSourceFromTrees = function(trees) {
  return trees.keys().map(function(file) {
    var tree = trees.get(file);
        // QPFunctionPreamble must precede Linearize
    // TODO Only trees subject to tracing need linearize 
    var identifierGenerator = new traceur.codegeneration.UniqueIdentifierGenerator();
    var transformer = new Querypoint.LinearizeTransformer(identifierGenerator, generateFileName);
    tree = transformer.transformAny(tree);
    
    // TODO only trees that the developer *might* debug needs dynamic hooks
    var preambleTransformer = new Querypoint.QPFunctionPreambleTransformer(generateFileName);
    tree = preambleTransformer.transformAny(tree);


    var writer = new QPTreeWriter(file.name + '.js', QPController.tracequeries());
    file = writer.generateSource(file, tree);
    return file;
  }.bind(this));
}

QPProject.prototype.startRuntime = function() {
  function startRuntime() {  // runs in web page
    window.__qp.fireLoad();
  }
  function onRuntimeStarted() {
    console.log("QP runtime started");
  }
  chrome.devtools.inspectedWindow.eval(this.evalStringify(startRuntime, []), onRuntimeStarted);
}

QPProject.prototype.runInWebPage = function(trees) {
  RemoteWebPageProject.prototype.runInWebPage.call(this, trees);
  this.startRuntime();
}

