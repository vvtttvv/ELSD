Clazz.declarePackage("J.rendersurface");
Clazz.load(["J.rendersurface.IsosurfaceRenderer"], "J.rendersurface.PmeshRenderer", null, function(){
var c$ = Clazz.declareType(J.rendersurface, "PmeshRenderer", J.rendersurface.IsosurfaceRenderer);
Clazz.overrideMethod(c$, "render", 
function(){
return this.renderIso();
});
});
;//5.0.1-v7 Tue May 20 13:40:34 CDT 2025
