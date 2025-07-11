export default class Lexer {
    constructor(input) {
      this.input = input;
      this.position = 0;
      this.tokens = [];
    }
  
    isAtEnd() {
      return this.position >= this.input.length;
    }
   
    peek() {                // Look at the current character without consuming it
      return this.input[this.position];
    }
  
    
    peekAhead(n = 1) {      // Look ahead by n characters without consuming them
      if (this.position + n >= this.input.length) return null;
      return this.input[this.position + n];
    }
  
    advance() {             // Consume and return the current character
      return this.input[this.position++];
    }
  
    tokenize() {
      while (!this.isAtEnd()) {
        this.skipWhitespace();
        if (this.isAtEnd()) break;
  
        const ch = this.peek();
  
        if (this.isAlpha(ch)) {
          this.tokenizeIdentifierOrKeyword();
        } else if (this.isDigit(ch)) {
          this.tokenizeNumber();
        } else if (ch === '"' || ch === "'") {
          this.tokenizeString();
        } else {
          this.tokenizeSymbol();
        }
      }
      console.log(this.tokens);
      return this.tokens;
    }
  
    skipWhitespace() {
      while (!this.isAtEnd() && /\s/.test(this.peek())) {
        this.advance();
      }
    }
  
    isAlpha(ch) {
      return /[a-zA-Z]/.test(ch);
    }
  
    isDigit(ch) {
      return /[0-9]/.test(ch);
    }
  
    isAlphaNumeric(ch) {
      return /[a-zA-Z0-9]/.test(ch);
    }
  
    tokenizeIdentifierOrKeyword() {
      let start = this.position;
      while (!this.isAtEnd() && this.isAlphaNumeric(this.peek())) {
        this.advance();
      }
      const text = this.input.substring(start, this.position);
      const keywords = new Set([
        "let",
        "if",
        "elif",
        "else",
        "resolve",
        "possible",
        "getOxidixngs",
        "getReducings",
        "show",
        "getMolecWeight",
        "getVolume",
        "getV",
        "isAcid",
        "visualize",
        "isBase"
      ]);
      if (keywords.has(text)) {
        this.tokens.push({ type: "KEYWORD_TOKEN", value: text });
      } else {
        this.tokens.push({ type: "IDENTIFIER_TOKEN", value: text });
      }
    }
  
    tokenizeNumber() {
      let start = this.position;
      let hasDot = false;

      while (!this.isAtEnd()) {
        const ch = this.peek();
        if (this.isDigit(ch)) {
          this.advance();
        } else if (ch === '.' && !hasDot) {
          hasDot = true;
          this.advance();
        } else {
          break;
        }
      }

      const text = this.input.substring(start, this.position);
      this.tokens.push({ type: "NUMBER_TOKEN", value: text });
    }
  
    tokenizeString() {
      const quoteChar = this.advance(); // skip the opening quote and remember which type
      let start = this.position;
      while (!this.isAtEnd() && this.peek() !== quoteChar) {
        if (this.peek() === '\\') {
          this.advance(); // skip escape character
          if (!this.isAtEnd()) {
            this.advance(); // skip escaped character
          }
        } else {
          this.advance();
        }
      }
      if (this.isAtEnd()) {
        throw new Error("Unterminated string literal");
      }
      const value = this.input.substring(start, this.position);
      this.advance(); // skip the closing quote
      this.tokens.push({ type: "STRING_TOKEN", value });
    }
  
    tokenizeSymbol() {   // Tokenize symbols such as operators and punctuation
      const ch = this.advance();
      // Check for multi-character operators (>=, <=)
      if ((ch === '>' || ch === '<' || ch === '=' || ch === '!') && this.peek() === '=') {
        const op = ch + this.advance();
        this.tokens.push({ type: "OPERATOR_TOKEN", value: op });
        return;
      }
  
      switch (ch) {
        case '+':
        case '>':
        case '<':
        case '=':
          this.tokens.push({ type: "OPERATOR_TOKEN", value: ch });
          break;
        case '(':
        case ')':
        case '{':
        case '}':
        case ',':
        case ':':
          this.tokens.push({ type: "PUNCTUATION_TOKEN", value: ch });
          break;
        case ';':
            this.tokens.push({ type: "EXP", value: ch });
            break;
        default:
          throw new Error("Unexpected character: " + ch);
      }
    }
  }
  

