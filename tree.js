
class Tree {
  constructor(hier) {
    if (hier !== undefined) {
      var obj = this._toTree(hier);

      if (obj.has(types.ADD)) {
        this.add = obj.add;

      } else if (obj.has(types.MUL)) {
        this.mul = obj.mul;

      } else if (obj.has(types.LIT)) {
        this.lit = obj.lit;

      } else if (obj.has(types.STAR)) {
        this.star = obj.star;
      }
    }
  }

  toString() {
    var arr = this.toArray();
    var str = arr.join("");

    return str;
  }

  toString2() {
    return JSON.stringify(this, undefined, 2);
  }

  toString3() {
    return JSON.stringify(this);
  }

  toString4() {
    return this._toStr(this).trim();
  }

  toHier() {
    var myHier = {};
    var tempHier = this._toHier(this);

    delObj(myHier);

    myHier.tag = tempHier.tag;

    if (tempHier.tag === "literal") {
      myHier.obj = tempHier.obj;

    } else if (tempHier.tag === "sequence") {
      myHier.elements = tempHier.elements;

    } if (tempHier.tag === "kleene_star") {
      myHier.expr = tempHier.expr;

    } if (tempHier.tag === "alt") {
      myHier.choices = tempHier.choices;
    }

    return myHier;
  }

  has(key) {
    return this.hasOwnProperty(key);
  }

  isAdd() {
    return this.has(types.ADD);
  }

  isMul() {
    return this.has(types.MUL);
  }

  isLit() {
    return this.has(types.LIT);
  }

  isStar() {
    return this.has(types.STAR);
  }

  isLam() {
    return this.val() === specs.LAMBDA;
  }

  val() {
    if (this.isAdd()) {
      return this.add;

    } else if (this.isMul()) {
      return this.mul;

    } if (this.isStar()) {
      return this.star;

    } if (this.isLit()) {
      return this.lit;
    }
  }

  key() {
    if (this.isAdd()) {
      return types.ADD;

    } else if (this.isMul()) {
      return types.MUL;

    } if (this.isStar()) {
      return types.STAR;

    } if (this.isLit()) {
      return types.LIT;
    }
  }

  delOuter() {
    var myKey = null;
    var myVal = null;

    if (this.isAdd() || this.isMul()) {
      var tempVal = this.val()[0];
      myKey = tempVal.key();
      myVal = tempVal.val();

    } else if (this.isStar()) {
      myKey = this.val().key();
      myVal = this.val().val();
    }

    if (myKey !== null && myVal !== null) {
      delObj(this);
      this[myKey] = myVal;
    }
  }

  clone() {
    var obj = new Tree();
    obj[this.key()] = this.val();
    return obj;
  }

  _toTree(hier) {
    if (hier.tag === "literal") {
      var obj = new Tree();
      obj[types.LIT] = hier.obj;

      return obj;

    } else if (hier.tag === "kleene_star") {
      var obj = new Tree();
      obj[types.STAR] = this._toTree(hier.expr);

      return obj;

    } else if (hier.tag === "alt") {
      var arr = [];

      for (var i = 0; i < hier.choices.length; i++) {
        arr.push(this._toTree(hier.choices[i]));
      }

      var obj = new Tree();
      obj[types.ADD] = arr;

      return obj;

    } else if (hier.tag === "sequence") {
      var arr = [];

      for (var i = 0; i < hier.elements.length; i++) {
        arr.push(this._toTree(hier.elements[i]));
      }

      var obj = new Tree();
      obj[types.MUL] = arr;

      return obj;

    } else {
      return null;
    }
  }

  _toStr(tree, tab = "") {
    if (tree.has(types.LIT)) {
      return "\"" + tree.lit + "\"";

    } else if (tree.has(types.STAR)) {
      tab += "  ";
      return "star\n" + tab + this._toStr(tree.star, tab);

    } else if (tree.has(types.ADD)) {
      var str = "";
      tab += "  ";
      for (var i = 0; i < tree.add.length; i++) {
        str += this._toStr(tree.add[i], tab) + "\n" + tab;
      }

      return "add\n" + tab + str;

    } else if (tree.has(types.MUL)) {
      var str = "";
      tab += "  ";
      for (var i = 0; i < tree.mul.length; i++) {
        str += this._toStr(tree.mul[i], tab) + "\n" + tab;
      }

      return "mul\n" + tab + str;

    } else {
      return null;
    }
  }

  _toHier(tree) {
    if (tree.has(types.LIT)) {
      var obj = {};
      obj.tag = "literal";
      obj.obj = tree.val();

      return obj;

    } else if (tree.has(types.STAR)) {
      var obj = {};
      obj.tag = "kleene_star";
      obj.expr = this._toHier(tree.val());

      return obj;

    } else if (tree.has(types.ADD)) {
      var arr = [];
      var obj = {};
      for (var i = 0; i < tree.val().length; i++) {
        arr.push(this._toHier(tree.add[i]));
      }

      obj.tag = "alt";
      obj.choices = arr;
      return obj;

    } else if (tree.has(types.MUL)) {
      var arr = [];
      var obj = {};
      for (var i = 0; i < tree.val().length; i++) {
        arr.push(this._toHier(tree.val()[i]));
      }

      obj.tag = "sequence";
      obj.elements = arr;
      return obj;

    } else {
      return null;
    }
  }

  // array codes
  needParens(par, child) {
    var _prec = {};
    _prec[types.ADD] = 0;
    _prec[types.MUL] = 1;
    _prec[types.STAR] = 2;
    _prec[types.LIT] = 3;

    return _prec[par.key()] >= _prec[child.key()];
  }

  _optParenToArray(par, child, arr) {
    var parens = this.needParens(par, child);

    if (parens) {
      arr.push("(");
    }
    this._dispatchToArray(child, arr);

    if (parens) {
      arr.push(")");
    }
  }

  _binOpToArray(regex, arr, parts, operand) {
    for (var i = 0; i < parts.length; i++) {
      if (operand !== undefined && i > 0) {
        arr.push(operand);
      }
      this._optParenToArray(regex, parts[i], arr);
    }
  }

  addToArray(regex, arr) {
    regex._binOpToArray(regex, arr, regex.val(), "+");
  }

  mulToArray(regex, arr) {
    regex._binOpToArray(regex, arr, regex.val());
  }

  starToArray(regex, arr) {
    regex._optParenToArray(regex, regex.val(), arr);
    arr.push("*");
  }

  litToArray(regex, arr) {
    arr.push(regex.val());
  }

  _dispatchToArray(regex, arr) {
    var _toArrayFuns = {};
    _toArrayFuns[types.ADD] = this.addToArray;
    _toArrayFuns[types.MUL] = this.mulToArray;
    _toArrayFuns[types.STAR] = this.starToArray;
    _toArrayFuns[types.LIT] = this.litToArray;
    return _toArrayFuns[regex.key()](regex, arr);
  }

  toArray() {
    var arr = [];
    this._dispatchToArray(this, arr);
    return arr;
  }
}
