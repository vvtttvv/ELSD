Clazz.declarePackage("J.render");
Clazz.load(["J.render.CageRenderer", "JU.P3"], "J.render.UccageRenderer", ["JU.BS", "$.DF", "JU.BSUtil", "$.BoxInfo", "$.C", "$.SimpleUnitCell"], function(){
var c$ = Clazz.decorateAsClass(function(){
this.verticesT = null;
this.vvertA = null;
this.cellRange = null;
this.offset = null;
this.offsetT = null;
this.unitcell = null;
this.lineheight = 0;
this.xpos = 0;
this.ypos = 0;
this.isPlanarGroup = false;
this.bsVerticals = null;
Clazz.instantialize(this, arguments);}, J.render, "UccageRenderer", J.render.CageRenderer);
Clazz.prepareFields (c$, function(){
this.verticesT =  new Array(8);
this.cellRange =  Clazz.newArray(-1, [ new JU.P3(),  new JU.P3()]);
this.offset =  new JU.P3();
this.offsetT =  new JU.P3();
});
Clazz.overrideMethod(c$, "initRenderer", 
function(){
for (var i = 8; --i >= 0; ) this.verticesT[i] =  new JU.P3();

this.tickEdges = JU.BoxInfo.uccageTickEdges;
this.draw000 = false;
});
Clazz.overrideMethod(c$, "setPeriodicity", 
function(vertices, scale){
this.setShifts();
var p0;
if (this.shifting) {
if (this.vvert == null) {
this.vvert =  new Array(8);
for (var i = 8; --i >= 0; ) {
this.vvert[i] =  new JU.P3();
}
}if (this.shiftC && this.periodicity == 0x1) {
if (this.vvertA == null) {
this.vvertA =  new Array(8);
for (var i = 8; --i >= 0; ) {
this.vvertA[i] =  new JU.P3();
}
}p0 = JU.P3.newP(vertices[1]);
p0.sub(vertices[0]);
p0.scale(0.5);
for (var i = 8; --i >= 0; ) {
this.pt.setT(vertices[i]);
this.pt.sub(vertices[0]);
this.pt.scaleAdd2(scale, this.pt, vertices[0]);
this.pt.sub(p0);
this.tm.transformPtNoClip(this.pt, this.vvertA[i]);
}
} else if (this.shiftA) {
if (this.vvertA == null) {
this.vvertA =  new Array(8);
for (var i = 8; --i >= 0; ) {
this.vvertA[i] =  new JU.P3();
}
}p0 = JU.P3.newP(vertices[4]);
p0.sub(vertices[0]);
p0.scale(0.5);
for (var i = 8; --i >= 0; ) {
this.pt.setT(vertices[i]);
this.pt.sub(vertices[0]);
this.pt.scaleAdd2(scale, this.pt, vertices[0]);
this.pt.sub(p0);
this.tm.transformPtNoClip(this.pt, this.vvertA[i]);
}
} else {
this.vvertA = null;
}p0 = JU.P3.newP(vertices[this.shiftB ? 2 : 1]);
p0.sub(vertices[0]);
p0.scale(0.5);
for (var i = 8; --i >= 0; ) {
this.pt.setT(vertices[i]);
this.pt.sub(vertices[0]);
this.pt.scaleAdd2(scale, this.pt, vertices[0]);
this.pt.sub(p0);
this.tm.transformPtNoClip(this.pt, this.vvert[i]);
}
}}, "~A,~N");
Clazz.overrideMethod(c$, "render", 
function(){
this.imageFontScaling = this.vwr.imageFontScaling;
this.font3d = this.vwr.gdata.getFont3DScaled((this.shape).font3d, this.imageFontScaling);
var mad10 = this.vwr.getObjectMad10(5);
if (mad10 == 0 || this.vwr.isJmolDataFrame() || this.tm.isNavigating() && this.vwr.getBoolean(603979890)) return false;
this.colix = this.vwr.getObjectColix(5);
var needTranslucent = JU.C.renderPass2(this.colix);
if (!this.isExport && needTranslucent != this.vwr.gdata.isPass2) return needTranslucent;
this.render1(mad10);
return false;
});
Clazz.defineMethod(c$, "render1", 
function(mad10){
this.g3d.setC(this.colix);
this.unitcell = this.vwr.getCurrentUnitCell();
if (this.unitcell == null) return;
this.isPolymer = this.unitcell.isPolymer();
this.isSlab = this.unitcell.isSlab();
this.periodicity = this.unitcell.getPeriodicity();
this.nDims = this.unitcell.getDimensionality();
this.isPlanarGroup = (this.periodicity == 0x03 && this.nDims == 2);
var vertices = this.unitcell.getUnitCellVerticesNoOffset();
this.offset.setT(this.unitcell.getCartesianOffset());
this.offsetT.setT(this.unitcell.getFractionalOrigin());
this.unitcell.toCartesian(this.offsetT, true);
this.offset.sub(this.offsetT);
var hiddenLines = this.vwr.getBoolean(603979856);
var fset = this.unitcell.getUnitCellMultiplier();
var haveMultiple = (fset != null && !fset.equals(J.render.UccageRenderer.fset0));
if (!haveMultiple) fset = J.render.UccageRenderer.fset0;
JU.SimpleUnitCell.getCellRange(fset, this.cellRange);
var firstLine;
var allow0;
var allow1;
var scale = Math.abs(fset.z);
var axes = this.vwr.shm.getShape(34);
if (axes != null && this.vwr.areAxesTainted()) axes.reinitShape();
var axisPoints = (axes == null || this.vwr.getObjectMad10(1) == 0 || axes.axisXY.z != 0 && (axes.axes2 == null || axes.axes2.length == 3) || axes.fixedOrigin != null || axes.fixedOriginUC.lengthSquared() > 0 ? null : axes.axisPoints);
var drawAllLines = (this.isExport || this.vwr.getObjectMad10(1) == 0 || this.vwr.getFloat(570425346) < 2 || axisPoints == null);
var aPoints = axisPoints;
var faces = (hiddenLines ? JU.BoxInfo.facePoints : null);
if (fset.z == 0) {
this.offsetT.setT(this.cellRange[0]);
this.unitcell.toCartesian(this.offsetT, true);
this.offsetT.add(this.offset);
aPoints = (this.cellRange[0].x == 0 && this.cellRange[0].y == 0 && this.cellRange[0].z == 0 ? axisPoints : null);
firstLine = 0;
allow0 = 0xFF;
allow1 = 0xFF;
var pts = JU.BoxInfo.unitCubePoints;
for (var i = 8; --i >= 0; ) {
var v = JU.P3.new3(pts[i].x * (this.cellRange[1].x - this.cellRange[0].x), pts[i].y * (this.cellRange[1].y - this.cellRange[0].y), pts[i].z * (this.cellRange[1].z - this.cellRange[0].z));
this.unitcell.toCartesian(v, true);
this.verticesT[i].add2(v, this.offsetT);
}
this.renderCage(mad10, this.verticesT, faces, aPoints, firstLine, allow0, allow1, 1);
} else {
for (var x = Clazz.floatToInt(this.cellRange[0].x); x < this.cellRange[1].x; x++) {
for (var y = Clazz.floatToInt(this.cellRange[0].y); y < this.cellRange[1].y; y++) {
for (var z = Clazz.floatToInt(this.cellRange[0].z); z < this.cellRange[1].z; z++) {
if (haveMultiple) {
this.offsetT.set(x, y, z);
this.offsetT.scale(scale);
this.unitcell.toCartesian(this.offsetT, true);
this.offsetT.add(this.offset);
aPoints = (x == 0 && y == 0 && z == 0 ? axisPoints : null);
firstLine = (drawAllLines || aPoints == null ? 0 : 3);
} else {
this.offsetT.setT(this.offset);
firstLine = (drawAllLines ? 0 : 3);
}allow0 = 0xFF;
allow1 = 0xFF;
for (var i = 8; --i >= 0; ) this.verticesT[i].add2(vertices[i], this.offsetT);

this.renderCage(mad10, this.verticesT, faces, aPoints, firstLine, allow0, allow1, scale);
}
}
}
}this.renderInfo();
}, "~N");
Clazz.overrideMethod(c$, "renderCageLine", 
function(i, edge0, edge1, d, drawTicks){
var p1;
var p2;
if (this.bsVerticals != null && this.bsVerticals.get(i)) {
if (this.vvertA != null && (i == 4 || i == 8 || i == 12 || i == 16 || i == 0 && this.periodicity != 0x2)) {
p1 = this.vvertA[edge0];
p2 = this.vvertA[edge1];
} else {
p1 = this.vvert[edge0];
p2 = this.vvert[edge1];
}} else {
p1 = this.p3Screens[edge0];
p2 = this.p3Screens[edge1];
}this.renderLine(p1, p2, d, drawTicks);
}, "~N,~N,~N,~N,~B");
Clazz.overrideMethod(c$, "setBSPeriod", 
function(){
var bs;
if (this.bsVerticals != null) this.bsVerticals.clearAll();
if (this.bsPeriod != null) this.bsPeriod.clearAll();
switch (this.periodicity) {
case 0x7:
return;
case 0x3:
bs = (this.bsPeriod == null ? (this.bsPeriod =  new JU.BS()) : this.bsPeriod);
if (this.nDims == 3) {
bs.set(0);
bs.set(10);
bs.set(16);
bs.set(22);
if (this.bsVerticals == null) {
this.bsVerticals =  new JU.BS();
}JU.BSUtil.copy2(bs, this.bsVerticals);
}bs.set(2);
bs.set(4);
bs.set(12);
bs.set(18);
break;
case 0x4:
bs = (this.bsPeriod == null ? (this.bsPeriod =  new JU.BS()) : this.bsPeriod);
bs.set(2);
bs.set(6);
bs.set(4);
bs.set(8);
if (this.bsVerticals == null) {
this.bsVerticals =  new JU.BS();
}JU.BSUtil.copy2(bs, this.bsVerticals);
bs.set(0);
break;
case 0x1:
bs = (this.bsPeriod == null ? (this.bsPeriod =  new JU.BS()) : this.bsPeriod);
bs.set(2);
bs.set(18);
if (this.nDims == 3) {
bs.set(0);
bs.set(16);
}if (this.bsVerticals == null) {
this.bsVerticals =  new JU.BS();
}JU.BSUtil.copy2(bs, this.bsVerticals);
bs.set(4);
break;
case 0x2:
bs = (this.bsPeriod == null ? (this.bsPeriod =  new JU.BS()) : this.bsPeriod);
bs.set(0);
bs.set(4);
bs.set(12);
bs.set(10);
if (this.bsVerticals == null) {
this.bsVerticals =  new JU.BS();
}JU.BSUtil.copy2(bs, this.bsVerticals);
bs.set(2);
break;
}
});
Clazz.defineMethod(c$, "renderInfo", 
function(){
var showDetails = this.vwr.getBoolean(603979937);
if (this.isExport || !this.vwr.getBoolean(603979828) || this.vwr.isPreviewOnly || !this.vwr.gdata.setC(this.vwr.cm.colixBackgroundContrast) || this.vwr.gdata.getTextPosition() != 0) return;
this.vwr.gdata.setFontBold("Monospaced", 14 * this.imageFontScaling);
this.xpos = Clazz.doubleToInt(Math.floor(10 * this.imageFontScaling));
this.ypos = this.lineheight = Clazz.doubleToInt(Math.floor(15 * this.imageFontScaling));
if (!this.unitcell.isSimple()) {
var sgName = this.unitcell.getUnitCellDisplayName();
if (sgName != null) this.drawInfo(sgName, 0, null);
var info = this.unitcell.getMoreInfo();
if (info != null) for (var i = 0; i < info.size(); i++) this.drawInfo(info.get(i), 0, null);

if (!showDetails) return;
}this.drawInfo("a=", 0, "\u00C5");
if (!this.isPolymer) this.drawInfo("b=", 1, "\u00C5");
if (!this.isPolymer && !this.isSlab && !this.isPlanarGroup) this.drawInfo("c=", 2, "\u00C5");
if (!this.isPolymer) {
if (!this.isSlab && !this.isPlanarGroup) {
this.drawInfo("\u03B1=", 3, "\u00B0");
this.drawInfo("\u03B2=", 4, "\u00B0");
}this.drawInfo("\u03B3=", 5, "\u00B0");
}});
Clazz.defineMethod(c$, "drawInfo", 
function(s, type, post){
this.ypos += this.lineheight;
if (post != null) s += JU.DF.formatDecimal(this.unitcell.getUnitCellInfoType(type), 3) + post;
this.g3d.drawStringNoSlab(s, null, this.xpos, this.ypos, 0, 0);
}, "~S,~N,~S");
c$.fset0 = JU.P3.new3(555, 555, 1);
});
;//5.0.1-v7 Mon Jun 09 20:25:06 CEST 2025
