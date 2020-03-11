var types = {
  ADD: 'add',
  MUL: 'mul',
  STAR: 'star',
  LIT: 'lit',
};

var specs = {
  LAMBDA: '\u03BB'
};

var minimize_list = [];

function minimize(tree, param) {
  var treeCopy = tree.clone();

  if (param === undefined) {
    param = {};
  }

  var paramCopy = JSON.parse(JSON.stringify(param));

  if (paramCopy.loopNo === undefined) {
    paramCopy.loopNo = null;
  }

  if (paramCopy.rulesDone === undefined) {
    paramCopy.rulesDone = null;

  } else {
    paramCopy.rulesDone = param.rulesDone;
  }

  var ruleDone = "temp";
  var counter = 0;

  while (ruleDone !== null && (paramCopy.loopNo === null || counter < paramCopy.loopNo)) {
    ruleDone = minimize_loop(treeCopy);

    if (ruleDone !== null && paramCopy.rulesDone !== null) {
      paramCopy.rulesDone.push(ruleDone);
    }

    counter += 1;
  }

  return treeCopy;
}

function minimize_loop(tree) {
  var pattern = null;
  var result = null;

  for (var i = 0; i < minimize_list.length; i++) {
    pattern = minimize_list[i];

    result = minimize_rec(tree, pattern['func']);

    if (result) {
      return pattern.rule;
    }
  }

  return null;
}

function minimize_rec(tree, ruleFunc) {
  var ruleDone = ruleFunc(tree);

  if (ruleDone) {
    return ruleDone;
  }

  var childArr = [];

  if (tree.isAdd() || tree.isMul()) {
    childArr = tree.val();

  } else if (tree.isStar()) {
    childArr = [tree.val()];
  }

  for (var i = 0; i < childArr.length; i++) {
    ruleDone = minimize_rec(childArr[i], ruleFunc);

    if (ruleDone) {
      return ruleDone;
    }
  }

  return false;
}

function minimize_step(regex) {
  var param = { loopNo: 1, rulesDone: [] };
  var result = strMinimize(regex, param);
  var lastRuleNo = param.rulesDone.length;

  while (result === regex) {
    param.loopNo += 1;
    param.rulesDone = [];
    result = strMinimize(regex, param);

    if (param.rulesDone.length === 0 ||
      param.rulesDone.length === lastRuleNo)
      break;

    lastRuleNo = param.rulesDone.length;
  }

  return [result, param.rulesDone];
}

minimize_list.push({ 'func': minimize_01, 'rule': "(A) -> A", 'type': '' });
minimize_list.push({ 'func': minimize_02, 'rule': "λA -> A", 'type': '' });
minimize_list.push({ 'func': minimize_03, 'rule': "A(BC) -> ABC", 'type': '' });
minimize_list.push({ 'func': minimize_04, 'rule': "λ+AA* -> A*", 'type': '' });
minimize_list.push({ 'func': minimize_05, 'rule': "A+B -> B IF A⊆B", 'type': '' });
minimize_list.push({ 'func': minimize_07, 'rule': "AB+AC -> A(B+C)", 'type': '' });
minimize_list.push({ 'func': minimize_08, 'rule': "λ* -> λ", 'type': '' });
minimize_list.push({ 'func': minimize_09, 'rule': "(A*)* -> A*", 'type': '' });
minimize_list.push({ 'func': minimize_10, 'rule': "(A*B*)* -> (A*+B*)*", 'type': '' });
minimize_list.push({ 'func': minimize_11, 'rule': "(A+B*)* -> (A+B)*", 'type': '' });
minimize_list.push({ 'func': minimize_12, 'rule': "A*AA* -> AA*", 'type': '' });
minimize_list.push({ 'func': minimize_13, 'rule': "A*B* -> B* IF A*⊆B*", 'type': '' });

function minimize_13(tree) {
  // A*B* -> B* IF A*⊆B*

  if (tree.isMul() && tree.mul.length >= 2) {
    var found = -1;

    for (var i = 0; i < tree.mul.length; i++) {
      var cur = tree.mul[i];

      for (var j = 0; j < tree.mul.length; j++) {
        if (i == j) continue;

        var cur2 = tree.mul[j];

        if (cur.isStar() && cur2.isStar) {
          if (isSub(cur, cur2)) {
            tree.mul.splice(i, 1);

            return true;
          }
        }
      }
    }
  }
  return false;
}

function minimize_12(tree) {
  // A*AA* -> AA*

  if (tree.isMul() && tree.mul.length >= 3) {
    for (var i = 1; i < tree.mul.length - 1; i++) {
      if (tree.mul[i - 1].isStar() && tree.mul[i + 1].isStar()) {
        if (areEqual(tree.mul[i - 1], tree.mul[i + 1]) &&
          areEqual(tree.mul[i - 1].star, tree.mul[i])) {
          tree.mul.splice(i - 1, 1);

          return true;
        }
      }
    }
  }

  return false;
}

function minimize_11(tree) {
  // (A+B*)* -> (A+B)*

  if (tree.isStar() && tree.star.isAdd()) {
    var changed = false;

    for (var i = 0; i < tree.star.add.length; i++) {
      if (tree.star.add[i].isStar()) {
        tree.star.add[i] = tree.star.add[i].star;

        return true;
      }
    }
  }

  return false;
}

function minimize_10(tree) {
  // (A*B*)* -> (A*+B*)*

  if (tree.isStar() && tree.star.isMul() && tree.star.mul.length > 0) {
    var check = true;

    for (var i = 0; i < tree.star.mul.length; i++) {
      if (!tree.star.mul[i].isStar()) {
        check = false;
        break;
      }
    }

    if (check) {
      tree.star.add = tree.star.mul;
      delete tree.star.mul;

      return true;
    }
  }

  return false;
}

function minimize_09(tree) {
  // (A*)* -> A*

  if (tree.isStar() && tree.star.isStar()) {
    tree.delOuter()

    return true;
  }

  return false;
}

function minimize_08(tree) {
  // λ* -> λ

  if (tree.isStar() && tree.star.isLam()) {
    tree.delOuter();

    return true;
  }

  return false;
}

function minimize_07(tree) {
  // AB+AC -> A(B+C)

  if (tree.isAdd() && tree.add.length >= 2) {
    var mulIdx = -1;
    var nMulIdx = -1;
    var bothMul = -1;

    for (var i = 0; i < tree.add.length; i++) {
      for (var j = i + 1; j < tree.add.length; j++) {

        // left is not mul and right is mul a+ab or a+ba
        if (!tree.add[i].isMul() && tree.add[j].isMul()) {
          nMulIdx = i;
          mulIdx = j;
          break;

          // lift is mul and right is not mul ab+a or ba+a
        } else if (tree.add[i].isMul() && !tree.add[j].isMul()) {
          mulIdx = i;
          nMulIdx = j;
          break;

          // both are mul ab+ac or ab+cb
        } else if (tree.add[i].isMul() && tree.add[i].mul.length >= 2
          && tree.add[j].isMul() && tree.add[j].mul.length >= 2) {
          bothMul = [i, j];
          break;
        }
      }

      // if one of them are not multiply
      if (mulIdx >= 0 && nMulIdx >= 0) {
        // if first is common a+ab or ab+a
        if (areEqual(tree.add[mulIdx].val()[0], tree.add[nMulIdx])) {
          var common = tree.add[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.add[mulIdx].val().slice(1, tree.add[mulIdx].val().length));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.add[nMulIdx] = _seq;
          tree.add.splice(mulIdx, 1);

          return true;
          // if last is common a+ba or ba+a
        } else if (areEqual(getLast(tree.add[mulIdx].val()), tree.add[nMulIdx])) {
          var common = tree.add[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.add[mulIdx].val().slice(0, tree.add[mulIdx].val().length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.add[nMulIdx] = _seq;
          tree.add.splice(mulIdx, 1);

          return true;
        }

      } else if (bothMul != -1) {
        // if first is common ab+ac
        if (areEqual(tree.add[bothMul[1]].val()[0], tree.add[bothMul[0]].val()[0])) {
          var common = tree.add[bothMul[0]].val()[0];
          var rest1 = genMul(tree.add[bothMul[0]].val().slice(1));
          var rest2 = genMul(tree.add[bothMul[1]].val().slice(1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.add[i] = _seq;
          tree.add.splice(bothMul[1], 1);

          return true;
          // if last is common ab+cb 
        } else if (areEqual(getLast(tree.add[bothMul[1]].val()), getLast(tree.add[bothMul[0]].val()))) {
          var common = getLast(tree.add[bothMul[0]].val());
          var rest1 = genMul(tree.add[bothMul[0]].val().slice(0, tree.add[bothMul[0]].val().length - 1));
          var rest2 = genMul(tree.add[bothMul[1]].val().slice(0, tree.add[bothMul[1]].val().length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.add[i] = _seq;
          tree.add.splice(bothMul[1], 1);

          return true;
        }
      }
    }
  }

  return false;
}

function minimize_05(tree) {
  // A+B -> B IF A⊆B

  if (tree.isAdd() && tree.add.length >= 2) {
    var found = -1;

    for (var i = 0; i < tree.add.length; i++) {
      var cur = tree.add[i];

      for (var j = 0; j < tree.add.length; j++) {
        if (i == j) continue;

        var cur2 = tree.add[j];

        if (isSub(cur, cur2)) {
          tree.add.splice(i, 1);

          return true;
        }
      }
    }
  }
  return false;
}

function minimize_04(tree) {
  // λ+AA* -> A*

  if (tree.isAdd() && tree.add.length >= 2) {
    var lamIndex = -1;
    var starIndex = -1;
    var sameStar = -1;
    var elemIndex = -1;

    for (var i = 0; i < tree.add.length; i++) {
      var cur = tree.add[i];

      if (cur.isLam()) {
        lamIndex = i;

      } else if (cur.isMul() && cur.mul.length === 2) {
        elemIndex = i;

        var starLit = null;
        var normLit = null;

        for (var j = 0; j < cur.mul.length; j++) {
          if (cur.mul[j].isStar()) {
            starIndex = j;
            starLit = cur.mul[j].star.val();

          } else if (cur.mul[j].isLit()) {
            sameStar = j;
            normLit = cur.mul[j].lit;
          }
        }
      }
      if (lamIndex >= 0 && starIndex >= 0 && sameStar >= 0 && elemIndex >= 0) {
        if (starLit === normLit) {
          tree.val()[elemIndex].val().splice(sameStar, 1)
          tree.val().splice(lamIndex, 1);

          return true;
        }
      }
    }
  }

  return false;
}

function minimize_03(tree) {
  // A(BC) -> ABC, Associative property

  if ((tree.isAdd() || tree.isMul()) && tree.val().length >= 2) {
    var found = -1, i;

    for (i = 0; i < tree.val().length; i++) {
      if (tree.val()[i].key() === tree.key()) {
        found = i;
      }
    }

    if (found >= 0) {
      var node = tree.val()[found];
      tree.val().splice(found, 1);

      for (i = 0; i < node.val().length; i++) {
        tree.val().splice(found + i, 0, node.val()[i]);
      }

      return true;
    }
  }

  return false;
}

function minimize_02(tree) {
  // λA -> A

  if (tree.isMul() && tree.mul.length >= 2) {
    var lamIndex = -1;

    for (var i = 0; i < tree.mul.length; i++) {
      if (tree.mul[i].isLam()) {
        lamIndex = i;
      }
    }

    if (lamIndex >= 0) {
      tree.mul.splice(lamIndex, 1);
      return true;
    }
  }

  return false;
}

function minimize_01(tree) {
  // (A) -> A

  if ((tree.isAdd() || tree.isMul()) && tree.val().length === 1) {
    tree.delOuter();

    return true;
  }

  return false;
}

function genType(type, item) {
  var tree = new Tree();
  tree[type] = item;
  return tree;
}

function genMul(item) {
  return genType(types.MUL, item);
}

function genAdd(item) {
  return genType(types.ADD, item);
}

function genLam() {
  return genType(types.LIT, specs.LAMBDA);
}

function genLit(item) {
  return genType(types.LIT, item);
}

function genStar(item) {
  return genType(types.STAR, item);
}

function RegError(message, position) {
  this.name = "RegError";
  this.message = message;
  this.position = position;
}

RegError.prototype = new Error();

function select() {
  return this.arr[this.index];
}
function next() {
  ++this.index;
}
function genGlobArr(arr) {
  return {
    arr: arr,
    index: 0,
    select: select,
    next: next
  };
}

function arrToTree(arr) {
  if (arr.length === 0) {
    return genType(types.MUL, []);
  }

  var globArr = genGlobArr(arr);
  var result = firstComp(globArr);

  if (globArr.select() !== undefined) {
    throw new RegError("Unexpected regex array: successfully parsed up to position " + globArr.index, globArr.index);
  }

  return result;
}

function firstComp(globArr) {
  var concats = [];

  while (true) {
    concats.push(secondComp(globArr));

    if (globArr.select() === "+") {
      globArr.next();
    } else {
      break;
    }
  }

  return genType(types.ADD, concats);
}

function secondComp(globArr) {
  var itemArr = [];
  var item;

  while (true) {
    item = thirdComp(globArr);

    if (item === undefined) {
      break;
    }

    itemArr.push(item);
  }

  if (itemArr.length === 0) {
    throw new RegError("Unexpected regex array: empty choice subexpression at index " +
      globArr.index, globArr.index);
  }

  return genType(types.MUL, itemArr);
}

function thirdComp(globArr) {
  var lit = forthComp(globArr);

  if (globArr.select() === "*") {
    globArr.next();
    lit = genType(types.STAR, lit);
  }

  return lit;
}

function forthComp(globArr) {
  if (globArr.select() === "(") {
    globArr.next();
    var expr = firstComp(globArr);

    if (globArr.select() !== ")") {
      throw new RegError("Unexpected regex array: missing matching right parenthesis at index " +
        globArr.index, globArr.index);
    }

    globArr.next();

    return expr;

  } else if (globArr.select() === specs.LAMBDA) {
    globArr.next();
    return genType(types.LIT, specs.LAMBDA);

  } else if (globArr.select() === undefined || globArr.select() === "+" ||
    globArr.select() === ")") {
    return undefined;

  } else if (globArr.select() === "*") {
    throw new RegError("Unexpected regex array: empty subexpression before Kleene star at index " +
      globArr.index, globArr.index);

  } else {
    var sym = genType(types.LIT, globArr.select());
    globArr.next();

    return sym;
  }
}

function arrMinimize(arr, loopNo, rulesDone) {
  var tree = arrToTree(arr);
  var treeSimplified = minimize(tree, loopNo, rulesDone);

  return toArray(treeSimplified);
}

var strEscapable = "λ+*()\\";

function strToArray(str) {
  var arr = [];
  var escaped = false;
  var chr;

  for (var i = 0; i < str.length; ++i) {
    if (escaped) {
      if (strEscapable.indexOf(str[i]) === -1) {
        throw new RegError("Unexpected string regex: illegal escape sequence \\" + str[i], i);
      }
      arr.push(str[i]);
      escaped = false;

    } else if (str[i] === '\\') {
      escaped = true;

    } else {
      chr = str[i];

      switch (chr) {
        case "λ": chr = specs.LAMBDA; break;
        case "+": chr = "+"; break;
        case "*": chr = "*"; break;
        case "(": chr = "("; break;
        case ")": chr = ")"; break;
      }
      arr.push(chr);
    }
  }
  if (escaped) {
    throw new RegError("Unexpected string regex: unfinished escape sequence at end of string", str.length - 1);
  }

  return arr;
}

function strToTree(str) {
  var arr = strToArray(str);

  return arrToTree(arr);
}

function strMinimize(str, loopNo, rulesDone) {
  var tree = strToTree(str);
  var treeMinimized = minimize(tree, loopNo, rulesDone);

  return treeMinimized.toString();
}

function isSub(tree1, tree2) {
  var fsm1 = noam.re.string.toAutomaton(tree1.toString().split(specs.LAMBDA).join("$"));
  var fsm2 = noam.re.string.toAutomaton(tree2.toString().split(specs.LAMBDA).join("$"));

  // merge alphabet, both alphabet must be the same
  var arr3 = arrMerge(fsm1.alphabet, fsm2.alphabet);

  fsm1.alphabet = arr3;
  fsm2.alphabet = arr3;

  fsm1 = noam.fsm.convertEnfaToNfa(fsm1);
  fsm1 = noam.fsm.convertNfaToDfa(fsm1);

  fsm2 = noam.fsm.convertEnfaToNfa(fsm2);
  fsm2 = noam.fsm.convertNfaToDfa(fsm2);

  return noam.fsm.isSubset(fsm2, fsm1);
}

// get last element of an array
function getLast(arr, num) {
  if (num === undefined)
    num = 1;
  return arr[arr.length - num];
}

function delObj(obj) {
  for (var o in obj) {
    if (obj.hasOwnProperty(o)) {
      delete obj[o];
    }
  }
}

function copyObj(obj1, obj2) {
  delObj(obj);

  for (var o in obj2) {
    if (o2.hasOwnProperty(o)) {
      obj1[o] = obj2[o];
    }
  }
}

function areEqual(obj1, obj2) {
  if (obj1 === obj2) {
    return true;
  }

  if (obj1 instanceof Date && obj2 instanceof Date) {
    return obj1.getTime() === obj2.getTime();
  }

  if (obj1 instanceof RegExp && obj2 instanceof RegExp) {
    return obj1.source === obj2.source &&
      obj1.global === obj2.global &&
      obj1.multiline === obj2.multiline &&
      obj1.lastIndex === obj2.lastIndex &&
      obj1.ignoreCase === obj2.ignoreCase;
  }

  if (!(obj1 instanceof Object) || !(obj2 instanceof Object)) {
    return false;
  }

  if (typeof obj1 === 'undefined' || typeof obj2 === 'undefined') {
    return false;
  }

  if (obj1.constructor !== obj2.constructor) {
    return false;
  }

  for (var p in obj1) {
    if (!(p in obj2)) {
      return false;
    }

    if (obj1[p] === obj2[p]) {
      continue;
    }

    if (typeof (obj1[p]) !== "object") {
      return false;
    }

    if (!(areEqual(obj1[p], obj2[p]))) {
      return false;
    }
  }

  for (p in obj2) {
    if (!(p in obj1)) {
      return false;
    }
  }

  return true;
}

function arrUnique(array) {
  var a = array.concat();
  for (var i = 0; i < a.length; ++i) {
    for (var j = i + 1; j < a.length; ++j) {
      if (a[i] === a[j])
        a.splice(j--, 1);
    }
  }

  return a;
}

function arrMerge(arr1, arr2) {
  return arrUnique(arr1.concat(arr2));
}