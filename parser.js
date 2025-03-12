export default class Parser{
    constructor(tokens){
        this.tokens = tokens;
        this.node = {left: null, right: null, value: null, type: null};
        this.position = 0;
        this.end = this.tokens.length;
        this.root = this.node;
        this.leftRoot = this.node.left;
        this.rightRoot = this.node.right;
        this.set = new Set(["elif", "else", "if"]);
        this.isGood = true;
        this.identifiers = new Set();
    }

    isAtEnd(){
        return this.position >= this.tokens.length;
    }

    peek(){
        return this.tokens[this.position];
    }

    findEXP(start){
        for(let i = start; i < this.tokens.length; i++){
            if(this.tokens[i].value === ";"){
                return i;
            }
        }
        return this.tokens.length;
    }

    findEXPcur(start){
        let count = 0, endedCondition;
        for(let i = start; i < this.tokens.length; i++){
            if(this.tokens[i].value === "{"){
                endedCondition=i;
            }
        }
        for(let i = endedCondition; i < this.tokens.length; i++){
            if(this.tokens[i].value === "{"){
                count++;
            } else if(this.tokens[i].value === "}"){
                count--;
            } 
            if(count === 0){
                return i;
            }
        }
        return this.tokens.length;
    }

    advance(){
        return this.tokens[this.position++];
    }

    findKeyword(start, end){
        if(this.tokens[start].type === "IDENTIFIER_TOKEN" && this.tokens[start+1].value === "=" ){
            return start;
        }
        for(start; start < end; start++){
            if(this.tokens[start].type === "KEYWORD_TOKEN"){
                return start;
            }
        }
    }


    initHandler(start, end, key){
        if(key === start){
            this.leftRoot.value = this.tokens[key]?.value; 
            this.leftRoot.type = this.tokens[key]?.type;
            if(this.tokens[key+1].type === "IDENTIFIER_TOKEN"){
                this.identifiers.add(this.tokens[key+1].value);
                this.leftRoot.left = {left: null, right: null, value: this.tokens[start+1].value, type: this.tokens[start+1].type};
            } 
            if(end-start === 4){ 
                this.leftRoot.right = {left: null, right: null, value: this.tokens[end-1].value, type: this.tokens[end-1].type};
            } else if(this.tokens[start+3].type==="KEYWORD_TOKEN"){
                this.leftRoot.left = {left: null, right: null, value: this.tokens[key+3].value, type: this.tokens[key+3].type};
                this.leftRoot = this.leftRoot.left;
                this.generalHandler(start+3, end, key+3);
            }
        } else {
            this.isGood = false;
            alert("Near key: " + key + " Key type: " + this.tokens[key].type + " Key value: " + this.tokens[key].value + " Syntax Error: Expected an initialization");
        }
    }

    assignHandler(start, end, key){
        if(this.identifiers.has(this.tokens[key].value)){
            if(key === start && end-start>2 && this.tokens[key+1].value === "="){ 
                this.leftRoot.value = this.tokens[key]?.value; 
                this.leftRoot.type = this.tokens[key]?.type;
                if (this.tokens[key+2].type === "KEYWORD_TOKEN"){
                    this.leftRoot.left = {left: null, right: null, value: this.tokens[key+2].value, type: this.tokens[key+2].type};
                    this.leftRoot = this.leftRoot.left;
                    this.generalHandler(start+2, end, key+2);
                } else{
                    this.leftRoot.left = {left: null, right: null, value: this.tokens[key+2].value, type: this.tokens[key+2].type};
                }
            } else {
                this.isGood = false;
                alert("Near key: " + key + " Key type: " + this.tokens[key].type + " Key value: " + this.tokens[key].value + " Syntax Error: Expected an assigment");
            }
        } else{
            alert("Near key: " + key + " Key type: " + this.tokens[key].type + " Key value: " + this.tokens[key].value + " This variable isn't delcared!");
        }
    }

    parsePlus(start, end, key){  
        this.leftRoot.value = this.tokens[start+1].value;
        this.leftRoot.type = this.tokens[start+1].type;
        if(this.tokens[start+3]?.value===")" || start+3>end){ 
            this.leftRoot.left = {left: null, right: null, value: this.tokens[start].value, type: this.tokens[start].type};
            this.leftRoot.right = {left: null, right: null, value: this.tokens[start+2].value, type: this.tokens[start+2].type};
        } else{ 
            this.leftRoot.left = {left: null, right: null, value: this.tokens[start].value, type: this.tokens[start].type};
            this.leftRoot.right = {left: null, right: null, value: null, type: null};
            this.leftRoot = this.leftRoot.right;
            this.parsePlus(start+2, end, key);
        }
    }

    generalHandler(start, end, key){ 
        if(start===key && this.tokens[key+1].value === "("){
            start = key+2; 
            this.leftRoot.value = this.tokens[key]?.value;
            this.leftRoot.type = this.tokens[key]?.type;
            this.leftRoot.left = {left: null, right: null, value: null, type: null};
            this.leftRoot = this.leftRoot.left;
            if(this.tokens[start+1].value === ")"){
                this.leftRoot.value = this.tokens[start].value;
                this.leftRoot.type = this.tokens[start].type;
            } else if(this.tokens[start].type === "KEYWORD_TOKEN"){
                this.generalHandler(start, end-1, key+2)
            }else {
                this.parsePlus(start, end, key);
            }
        }
    }

    conditionHandler(){

    }

    
    conditionalHandler(start, end, key){
        this.leftRoot.value = this.tokens[key]?.value;
        this.leftRoot.type = this.tokens[key]?.type;
        this.leftRoot.left = {left: null, right: null, value: null, type: null};
        this.leftRoot.right = {left: null, right: null, value: null, type: null};
        let substart, subend;
        if(this.tokens[start+1].value==="("){
            let bracesCount = 1; 
            substart = start+2;
            for(let i = substart; i<end; i++){
                if(this.tokens[i].value === "("){
                    bracesCount++;
                } else if(this.tokens[i].value === ")"){
                    bracesCount--;
                } 
                if(bracesCount === 0){
                    subend = i; 
                    break;
                }
            }
            if(!subend){
                alert("Error: You didn't close if condition with '('. " + this.tokens[substart].value + " " + substart + " " + end);
            }
            this.rightRoot = this.leftRoot.right
            this.leftRoot = this.leftRoot.left;
            this.conditionHandler();

            if(this.tokens[subend+1].value === "{" && this.tokens[end].value === "}"){ 
                this.parse(subend+2, this.rightRoot);
            } else{
                alert("Error: You didn't open/close if body with '{'/'{'.");
            }


        } else{
            alert("Error: Incorrect expression nearly if/elif statement");
        }



    }

    expressionHandler(start, end, key) {
        if(this.tokens[key].type === "IDENTIFIER_TOKEN"){
            this.assignHandler(start, end, key);
        } else if (["resolve", "possible", "getOxidixngs", "getReducings", "show", 
            "getMolecWeight", "getVolume", "getV", "isAcid", "isBase"].includes(this.tokens[key].value)){
           this.generalHandler(start, end, key);
           return;
       } else {
            switch (this.tokens[key].value) {
                case "let":
                    this.initHandler(start, end, key);
                    break;
                case "if":
                case "elif":
                    this.conditionalHandler(start, end, key);
                    break;
                case "else":
                    break;
                default:
                    throw new Error(`Unknown keyword: ${this.tokens[key].value}`);
            }
        }
    }
    
    

    parse(position = this.position, root = this.root){ 
        let start = position;
        let key = this.findKeyword(position, this.findEXP(start)) || position;
        let end;
        if(this.set.has(this.tokens[key].value)){ 
            end  = this.findEXPcur(start);
        } else{
            end = this.findEXP(start);
        }
        root.value = this.tokens[end]?.value;
        root.type = this.tokens[end]?.type;


        root.left = {left: null, right: null, value: null, type: null};
        this.leftRoot = root.left;
        this.expressionHandler(start, end, key);

        position = end+1;
        if(this.findEXP(position) < this.tokens.length || this.findEXPcur(position) < this.tokens.length){ 
            root.right = {left: null, right: null, value: null, type: null};
            root = root.right;
            this.parse(position, root);
        }
    }

    getTree(){
        this.parse();
        if(this.isGood){
            return this.node;
        }
        return "Syntax Error";
    }
}