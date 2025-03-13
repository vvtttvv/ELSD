export default class Interpretor{
    constructor(parseTree){
        this.parseTree = parseTree;
    }


    interpret(){
        console.log(this.parseTree);
    }


}