// Google BSD license http://code.google.com/google_bsd_license.html
// Copyright 2013 Google Inc. johnjbarton@google.com

(function() {
  'use strict';
  
  var debug = DebugLogger.register('FileChainViewModel', function(flag){
    return debug = (typeof flag === 'boolean') ? flag : debug;
  });

  QuerypointPanel.FileChainViewModel = function(containerElement, panel) {
    this._panel = panel;
    this.fileViewModels = ko.observableArray();
    this.editorSizes = ko.computed(function() {
      this.fileViewModels().forEach(function(fileViewModel){
        var editor = fileViewModel.editorViewModel && fileViewModel.editorViewModel.editor();
        if (editor)
          editor.setSize();
      });

    }.bind(this));
    ko.applyBindings(this, containerElement);
  }
  
  QuerypointPanel.FileChainViewModel.prototype = {

    openChainedFileView: function(url, fromFileView) {
      var linkTarget = this._nameAndOffsetsFromURL(url);
      var editorViewModel;
      if (!fromFileView) {  // no link in the current chain contains this URL, start new chain
           editorViewModel = this.openURL(linkTarget.name).editorViewModel;
      } else {  // we are opening a new link in an existing chain
        var fromFileViewModel = this.fileViewModels()[fromFileView.getAttribute('chainIndex')];
        var editor = fromFileViewModel.editor();
        if (!editor.isShowingRegion(linkTarget.start, linkTarget.end)) {
          var fileViewModel = this.openURL(linkTarget.name);   
          this._appendFileChain(fileViewModel, fromFileViewModel);
          editorViewModel = fileViewModel.editorViewModel;
        }  else { //  we are already showing it
          editorViewModel = fromFileViewModel.editorViewModel;
        }
      }
      editorViewModel.mark(linkTarget);
    },
    /*
      @return true if we find the content matching @param url and open a view on it.
    */
    openURL: function(url) {
      var sourceFile = this._panel.project.getFile(url);
      if (sourceFile) {
        return QuerypointPanel.FileViewModel.openSourceFileView(sourceFile);
      } else {
        var fileViewModel;
        var foundResource = this._panel.page.resources.some(function(resource){
            if (resource.url) 
              fileViewModel = QuerypointPanel.FileViewModel.openResourceView(resource);
        }.bind(this));
        if (!fileViewModel)
          fileViewModel = QuerypointPanel.FileViewModel.openErrorMessage("Found no source file or resource named " + url);
        return fileViewModel;
      }
    },

    /* Start a new chain for a resource */
    openResourceView: function(resource) {
      var fileViewModel = QuerypointPanel.FileViewModel.openResourceView(resource);
      return this._createFileChain(fileViewModel);
    },
    
    /* Start a new chain for a (traceur) sourceFile */
    openSourceFileView: function(sourceFile) {
      var fileViewModel = QuerypointPanel.FileViewModel.openSourceFileView(sourceFile);
      return this._createFileChain(fileViewModel);
    },

    showFileViewModel: function(fileViewModel) {
      this.fileViewModels([fileViewModel]);
    },
      
    //------------------------------------------------------------------------------------------------------------------  
    project: function() {
      return this._panel.project;
    },
    
    _nameAndOffsetsFromURL: function(url) {
      var parsedURI = parseUri(url);
      if (parsedURI) {
        var name = url.split('?')[0];
        return {
          name: name, 
          start: parseInt(parsedURI.queryKey.start, 10),
          end: parseInt(parsedURI.queryKey.end, 10),
        };
      } else {
        console.error("_nameAndOffsetsFromURL failed for "+url);
      }
    },

    //------- Chain

    _createFileChain: function(fileViewModel) {
      this.fileViewModels([fileViewModel]);
      return fileViewModel;
    },

    _appendFileChain: function(fileViewModel, fromFileViewModel) {
      this.fileViewModels([fileViewModel, fromFileViewModel]);
      return fileViewModel;
    },

  }
}());