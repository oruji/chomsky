
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
    return this._toStr(this).trim();
  }

  toString2() {
    return JSON.stringify(this, undefined, 2);
  }

  toString3() {
    return JSON.stringify(this);
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
}
