export default class Parser{
    constructor(tokens){
        this.tokens = tokens;
        this.node = {left: null, right: null, value: null, type: null};
        this.position = 0;
        this.end = this.tokens.length;
        this.root = this.node;
        this.set = new Set(["elif", "else", "if"]);
    }

    isAtEnd(){
        return this.position >= this.tokens.length;
    }

    peek(){
        return this.tokens[this.position];
    }

    findEXP(start, endCh = ";"){
        for(let i = start; i < this.tokens.length; i++){
            if(this.tokens[i].value === endCh){
                return i;
            }
        }
        return this.tokens.length;
    }

    advance(){
        return this.tokens[this.position++];
    }

    findKeyword(start, end){
        for(start; start < end; start++){
            if(this.tokens[start].type === "KEYWORD_TOKEN"){
                return start;
            }
        }

    }

    parse(){ 
        let key = this.findKeyword(this.position, this.tokens.length) || this.position;
        let start = this.position;
        let end;
        if(this.set.has(this.tokens[key].value)){ 
           end  = this.findEXP(start, "}");
        } else{
            end = this.findEXP(start);
        }
        this.root.value = this.tokens[end].value;
        this.root.type = this.tokens[end].type;


        //Some parse logic for left

        this.position = end+1;
        console.log(this.position);
        console.log(this.tokens.length);
        console.log(this.findEXP(this.position));
        
        if(this.findEXP(this.position) < this.tokens.length || this.findEXP(this.position, '}') < this.tokens.length){ 
            console.log("Worked");
            this.root.right = {left: null, right: null, value: null, type: null};
            this.root = this.root.right;
            this.parse();
        }




    }

    getTree(){
        this.parse();
        return this.node;
    }
}