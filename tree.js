
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

  toHier(hier) {
    var tempHIer = this._toHier(this);

    delObj(hier);
    hier.key = tempHIer.key;
    hier.val = tempHIer.val;
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

  getVal() {
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

  getKey() {
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
      var tempVal = this.getVal()[0];
      myKey = tempVal.getKey();
      myVal = tempVal.getVal();

    } else if (this.isStar()) {
      myKey = this.getVal().getKey();
      myVal = this.getVal().getVal();
    }

    if (myKey !== null && myVal !== null) {
      delObj(this);
      this[myKey] = myVal;
    }
  }

  _toTree(hier) {
    if (hier.key === types.LIT) {
      var obj = new Tree();
      obj[hier.key] = hier.val;

      return obj;

    } else if (hier.key === types.STAR) {
      var obj = new Tree();
      obj[hier.key] = this._toTree(hier.val);

      return obj;

    } else if (hier.key === types.ADD || hier.key === types.MUL) {
      var arr = [];

      for (var i = 0; i < hier.val.length; i++) {
        arr.push(this._toTree(hier.val[i]));
      }

      var obj = new Tree();
      obj[hier.key] = arr;

      return obj;

    } else {
      return null;
    }
  }

  _toStr(tree, tab = "") {
    if (tree.hasOwnProperty(types.LIT)) {
      return "\"" + tree.lit + "\"";

    } else if (tree.hasOwnProperty(types.STAR)) {
      tab += "  ";
      return "star\n" + tab + this._toStr(tree.star, tab);

    } else if (tree.hasOwnProperty(types.ADD)) {
      var str = "";
      tab += "  ";
      for (var i = 0; i < tree.add.length; i++) {
        str += this._toStr(tree.add[i], tab) + "\n" + tab;
      }

      return "add\n" + tab + str;

    } else if (tree.hasOwnProperty(types.MUL)) {
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
      obj.key = types.LIT;
      obj.val = tree.getVal();

      return obj;

    } else if (tree.has(types.STAR)) {
      var obj = {};
      obj.key = types.STAR;
      obj.val = this._toHier(tree.getVal());

      return obj;

    } else if (tree.has(types.ADD)) {
      var arr = [];
      var obj = {};
      for (var i = 0; i < tree.getVal().length; i++) {
        arr.push(this._toHier(tree.add[i]));
      }

      obj.key = types.ADD;
      obj.val = arr;
      return obj;

    } else if (tree.has(types.MUL)) {
      var arr = [];
      var obj = {};
      for (var i = 0; i < tree.getVal().length; i++) {
        arr.push(this._toHier(tree.getVal()[i]));
      }

      obj.key = types.MUL;
      obj.val = arr;
      return obj;

    } else {
      return null;
    }
  }
}
