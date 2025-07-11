Clazz.declarePackage("J.render");
Clazz.load(null, "J.render.ShapeRenderer", ["JV.JC"], function(){
var c$ = Clazz.decorateAsClass(function(){
this.vwr = null;
this.tm = null;
this.g3d = null;
this.ms = null;
this.shape = null;
this.myVisibilityFlag = 0;
this.shapeID = 0;
this.colix = 0;
this.mad = 0;
this.exportType = 0;
this.isExport = false;
this.flags = 0;
Clazz.instantialize(this, arguments);}, J.render, "ShapeRenderer", null);
Clazz.defineMethod(c$, "initRenderer", 
function(){
});
Clazz.defineMethod(c$, "setViewerG3dShapeID", 
function(vwr, shapeID){
this.vwr = vwr;
this.tm = vwr.tm;
this.shapeID = shapeID;
this.myVisibilityFlag = JV.JC.getShapeVisibilityFlag(shapeID);
this.initRenderer();
}, "JV.Viewer,~N");
Clazz.defineMethod(c$, "renderShape", 
function(g3d, modelSet, shape, flags){
this.setup(g3d, modelSet, shape);
this.flags = flags;
var needsTranslucent = this.render();
this.exportType = 0;
this.isExport = false;
return needsTranslucent;
}, "J.api.JmolRendererInterface,JM.ModelSet,J.shape.Shape,~N");
Clazz.defineMethod(c$, "setup", 
function(g3d, modelSet, shape){
this.g3d = g3d;
this.ms = modelSet;
this.shape = shape;
this.exportType = g3d.getExportType();
this.isExport = (this.exportType != 0);
}, "J.api.JmolRendererInterface,JM.ModelSet,J.shape.Shape");
Clazz.defineMethod(c$, "isVisibleForMe", 
function(a){
return a != null && a.isVisible(this.myVisibilityFlag | 9);
}, "JM.Atom");
});
;//5.0.1-v7 Mon Jun 09 20:29:14 CDT 2025
