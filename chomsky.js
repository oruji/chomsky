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

function strMinimize(str, loopNo, rulesDone) {
  var arr = strToArray(str);
  var tree = arrToTree(arr);

  minimize(tree, loopNo, rulesDone);

  return tree.toString();
}

function minimize(tree, param) {
  // init param
  if (param === undefined) {
    param = {};
  }

  if (param.loopNo === undefined) {
    param.loopNo = null;
  }

  if (param.rulesDone === undefined) {
    param.rulesDone = null;
  }

  var ruleDone = "temp";
  var counter = 0;

  while (ruleDone !== null && (param.loopNo === null || counter < param.loopNo)) {
    ruleDone = minimize_loop(tree, minimize_list);

    if (ruleDone !== null && param.rulesDone !== null) {
      param.rulesDone.push(ruleDone);
    }

    counter++;
  }

  console.log("end of while");
}

function minimize_loop(tree, minArr) {
  var minItem = null;
  var result = null;

  for (var i = 0; i < minArr.length; i++) {
    minItem = minArr[i];

    result = minimize_rec(tree, minItem['func']);

    if (result) {
      return minItem.rule;
    }
  }

  return null;
}

function minimize_rec(tree, myFunc) {
  var isSuccess = myFunc(tree);

  if (isSuccess) {
    return isSuccess;
  }

  var childArr = [];

  if (tree.isAdd() || tree.isMul()) {
    childArr = tree.val();

  } else if (tree.isStar()) {
    childArr = [tree.val()];
  }

  for (var i = 0; i < childArr.length; i++) {
    isSuccess = minimize_rec(childArr[i], myFunc);

    if (isSuccess) {
      return isSuccess;
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
minimize_list.push({ 'func': minimize_08, 'rule': "λ* -> λ", 'type': '' });
minimize_list.push({ 'func': minimize_09, 'rule': "(A*)* -> A*", 'type': '' });
minimize_list.push({ 'func': minimize_10, 'rule': "(A*B*)* -> (A*+B*)*", 'type': '' });
minimize_list.push({ 'func': minimize_11, 'rule': "(A+B*)* -> (A+B)*", 'type': '' });
minimize_list.push({ 'func': minimize_13, 'rule': "A*B* -> B* IF A*⊆B*", 'type': '' });
minimize_list.push({ 'func': minimize_14, 'rule': "(A+λ)* -> (A)*", 'type': '' });
minimize_list.push({ 'func': minimize_15, 'rule': "A*(BA*)* -> (A+B)*", 'type': '' });
minimize_list.push({ 'func': minimize_16, 'rule': "(A*B)*A* -> (A+B)*", 'type': '' });
minimize_list.push({ 'func': minimize_07, 'rule': "AB+AC -> A(B+C)", 'type': '' });

function minimize_17(tree) {
  // A(B+λ) -> AB+A

  try {
    if (tree.isMul() && tree.mul.length >= 2) {
      var mulSing = -1;
      var mulAdd = -1;
      var addLam = -1;

      for (var i = 0; i < tree.mul.length; i++) {
        if (tree.mul[i].isAdd()) {
          addLam = arrHasObj(tree.mul[i].add, genLam());
          mulAdd = i;
          mulSing = (i === 0) ? i + 1 : i - 1;

          if (addLam >= 0) {

            if (mulSing < mulAdd) {
              // A(B+λ) -> A(AB+λ)
              for (var j = 0; j < tree.mul[i].add.length; j++) {
                if (tree.mul[i].add[j].isLam()) {
                  continue;

                } else {
                  tree.mul[i].add[j] = genMul([tree.mul[mulSing], tree.mul[i].add[j]]);
                }
              }

            } else {
              // (B+λ)A -> (BA+λ)A
              for (var j = 0; j < tree.mul[i].add.length; j++) {
                if (tree.mul[i].add[j].isLam()) {
                  continue;

                } else {
                  tree.mul[i].add[j] = genMul([tree.mul[i].add[j], tree.mul[mulSing]]);
                }
              }
            }

            // A(AB+λ) -> A(B+A)
            tree.mul[i].add[addLam] = tree.mul[mulSing];

            // A(AB+A) - > (AB+A)
            tree.mul.splice(mulSing, 1);

            return true;
          }
        }
      }
    }

  } catch (err) {
    console.log(err.message);
  }

  return false;
}

function minimize_16(tree) {
  // (A*B)*A* -> (A+B)*

  try {
    if (tree.isMul() && tree.mul.length >= 2) {
      for (var i = 0; i <= tree.mul.length - 1; i++) {
        if (tree.mul[i].isStar() && tree.mul[i + 1].isStar()) {
          if (tree.mul[i].star.isMul() && tree.mul[i].star.mul.length >= 2) {
            var found = -1;

            for (var f = 0; f <= tree.mul[i].star.mul.length - 1; f++) {
              if (areEqual(tree.mul[i + 1], tree.mul[i].star.mul[f])) {
                found = f;
                break;

              } else if (areEqual(tree.mul[i + 1].star, tree.mul[i].star.mul[f])) {
                continue;

              } else {
                break;
              }
            }

            if (found >= 0) {
              // remove found element of first mul (A*B)*A* -> (B)*A*
              tree.mul[i].star.mul.splice(found, 1);

              // B
              var myMul = genMul(tree.mul[i].star.mul);
              // A+B
              var myAdd = genAdd([tree.mul[i + 1].star, myMul]);

              // replace first Mul content (B)*A* -> (A+B)*A*
              tree.mul[i].star = myAdd;

              // remove second mul (A+B)*A* -> (A+B)*
              tree.mul.splice(i + 1, 1);

              return true;
            }
          }
        }
      }
    }

  } catch (err) {
    console.log(err.message);
  }

  return false;
}

function minimize_15(tree) {
  // A*(BA*)* -> (A+B)*

  try {
    if (tree.isMul() && tree.mul.length >= 2) {
      var secStar = -1;
      var found = -1;

      LoopI:
      for (var i = 0; i <= tree.mul.length - 1; i++) {
        // A*
        if (tree.mul[i].isStar()) {
          // A* _*
          if (tree.mul[i + 1].isStar()) {
            secStar = i + 1;
            // A* _
          } else {
            LoopJ:
            for (var j = i + 1; j < tree.mul.length - 1; j++) {
              // A* _
              if (!tree.mul[j].isStar()) {
                // A* A
                if (areEqual(tree.mul[i].star, tree.mul[j])) {
                  // A* A _*
                  if (tree.mul[j + 1].isStar()) {
                    secStar = j + 1;

                    // A* A A
                  } else if (areEqual(tree.mul[j], tree.mul[j + 1])) {
                    continue;

                    // A* A B
                  } else {
                    break;
                  }
                }
                // A* B
              } else {
                break;
              }
            }
          }

          if (secStar >= 0) {
            if (tree.mul[secStar].star.isMul() && tree.mul[secStar].star.mul.length >= 2) {
              for (var f = tree.mul[secStar].star.mul.length - 1; f >= 0; f--) {
                if (areEqual(tree.mul[i], tree.mul[secStar].star.mul[f])) {
                  found = f;
                  break LoopI;

                } else if (areEqual(tree.mul[i].star, tree.mul[secStar].star.mul[f])) {
                  continue;

                } else {
                  break;
                }
              }
            }
          }
        }
      }

      if (found >= 0) {
        // remove last element of second mul A*(BA*)* -> A*(B)*
        tree.mul[secStar].star.mul.splice(found, 1);

        // B
        var myMul = genMul(tree.mul[secStar].star.mul);
        // A+B
        var myAdd = genAdd([tree.mul[i].star, myMul]);

        // replace second Mul content A*(B)* -> A*(A+B)*
        tree.mul[secStar].star = myAdd;

        // remove first mul A*(A+B)* -> (A+B)*
        tree.mul.splice(i, 1);

        return true;
      }
    }

  } catch (err) {
    console.log(err.message);
  }

  return false;
}

function minimize_14(tree) {
  // (A+λ)* -> (A)*

  if (tree.isStar() && tree.star.isAdd() && tree.star.add.length >= 2) {
    for (var i = 0; i < tree.star.add.length; i++) {
      if (tree.star.add[i].isLam()) {
        tree.star.add.splice(i, 1);

        return true;
      }
    }
  }

  return false;
}

function minimize_13(tree) {
  // A*B* -> B* IF A*⊆B*

  if (tree.isMul() && tree.mul.length >= 2) {
    found = -1;
    found2 = -1;

    for (var i = 0; i < tree.mul.length - 1; i++) {
      // A*
      if (tree.mul[i].isStar()) {
        found = i;

        // A* _*
        if (tree.mul[i + 1].isStar()) {
          found2 = i + 1;
          break;

          // A*
        } else {
          for (var j = i + 1; j < tree.mul.length - 1; j++) {
            // A* _
            if (!tree.mul[j].isStar()) {

              // A* _ _*
              if (tree.mul[j + 1].isStar()) {
                // A*BB*
                if (areEqual(tree.mul[j], tree.mul[j + 1].star)) {
                  found2 = j + 1;
                  break;

                  // A*AB*
                } else if (areEqual(tree.mul[i].star, tree.mul[j])) {
                  found2 = j + 1;
                  break;

                  // A*BC*
                } else {
                  break;
                }

                // A* B B
              } else if (areEqual(tree.mul[j], tree.mul[j + 1])
                || (areEqual(tree.mul[i].star, tree.mul[j]) && areEqual(tree.mul[j], tree.mul[j + 1]))) {
                continue;
              }
            }
          }
        }
      }
    }
    if (found >= 0 && found2 >= 0) {
      if (isSub(tree.mul[found], tree.mul[found2])) {
        tree.mul.splice(found, 1);

        return true;
      }

      if (isSub(tree.mul[found2], tree.mul[found])) {
        tree.mul.splice(found2, 1);

        return true;
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

        // both are mul AB+AC or AB+CB
        if (tree.add[i].isMul() && tree.add[i].mul.length >= 2
          && tree.add[j].isMul() && tree.add[j].mul.length >= 2) {
          bothMul = [i, j];
          break;
        }

        // left is not mul and right is mul a+ab or a+ba
        else if (!tree.add[i].isMul() && tree.add[j].isMul()) {
          nMulIdx = i;
          mulIdx = j;
          break;

          // left is mul and right is not mul ab+a or ba+a
        } else if (tree.add[i].isMul() && !tree.add[j].isMul()) {
          mulIdx = i;
          nMulIdx = j;
          break;
        }
      }

      if (bothMul != -1) {
        // if first is common AB+AC
        if (areEqual(tree.add[bothMul[1]].val()[0], tree.add[bothMul[0]].val()[0])) {
          var common = tree.add[bothMul[0]].val()[0];
          var rest1 = genMul(tree.add[bothMul[0]].val().slice(1));
          var rest2 = genMul(tree.add[bothMul[1]].val().slice(1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.add[i] = _seq;
          tree.add.splice(bothMul[1], 1);

          return true;
          // if last is common AB+CB 
        } else if (areEqual(arrLast(tree.add[bothMul[1]].val()), arrLast(tree.add[bothMul[0]].val()))) {
          var common = arrLast(tree.add[bothMul[0]].val());
          var rest1 = genMul(tree.add[bothMul[0]].val().slice(0, tree.add[bothMul[0]].val().length - 1));
          var rest2 = genMul(tree.add[bothMul[1]].val().slice(0, tree.add[bothMul[1]].val().length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.add[i] = _seq;
          tree.add.splice(bothMul[1], 1);

          return true;
        }
      }

      // one of them are not multiply
      else if (mulIdx >= 0 && nMulIdx >= 0) {
        // A*+A*BA*
        if (tree.add[nMulIdx].isStar()
          && areEqual(tree.add[nMulIdx], tree.add[mulIdx].mul[0])
          && areEqual(tree.add[mulIdx].mul[0], arrLast(tree.add[mulIdx].mul))
        ) {
          var common = tree.add[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.add[mulIdx].val().slice(1, tree.add[mulIdx].mul.length - 1));
          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt, common]);
          tree.add[nMulIdx] = _seq;
          tree.add.splice(mulIdx, 1);

          return true;

          // first is common A+AB or AB+A
        } else if (areEqual(tree.add[mulIdx].val()[0], tree.add[nMulIdx])) {
          var common = tree.add[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.add[mulIdx].val().slice(1, tree.add[mulIdx].val().length));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([common, _alt]);

          tree.add[nMulIdx] = _seq;
          tree.add.splice(mulIdx, 1);

          return true;
          // last is common A+BA or ba+a
        } else if (areEqual(arrLast(tree.add[mulIdx].val()), tree.add[nMulIdx])) {
          var common = tree.add[nMulIdx];
          var rest1 = genLam();
          var rest2 = genMul(tree.add[mulIdx].val().slice(0, tree.add[mulIdx].val().length - 1));

          var _alt = genAdd([rest1, rest2]);
          var _seq = genMul([_alt, common]);

          tree.add[nMulIdx] = _seq;
          tree.add.splice(mulIdx, 1);

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

  // "λ" & "AA*"
  if (tree.isAdd() && tree.add.length >= 2) {
    var lamIdx = -1;
    var starIdx = -1;
    var nStarIdx = -1;
    var elemIdx = -1;

    for (var i = 0; i < tree.add.length; i++) {
      if (tree.add[i].isLam()) {
        lamIdx = i;

      } else if (tree.add[i].isMul() && tree.add[i].mul.length === 2) {
        elemIdx = i;

        var starVal = null;
        var nStarVal = null;

        for (var j = 0; j < tree.add[i].mul.length; j++) {
          if (tree.add[i].mul[j].isStar()) {
            starIdx = j;
            starVal = tree.add[i].mul[j].star.val();

          } else {
            nStarIdx = j;
            nStarVal = tree.add[i].mul[j].val();
          }
        }
      }

      if (lamIdx >= 0 && starIdx >= 0 && nStarIdx >= 0 && elemIdx >= 0) {
        if (starVal === nStarVal) {
          tree.add[elemIdx].mul.splice(nStarIdx, 1)
          tree.add.splice(lamIdx, 1);

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
    throw new RegError("Unexpected regex array: empty choice substaression at index " +
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
    var star = firstComp(globArr);

    if (globArr.select() !== ")") {
      throw new RegError("Unexpected regex array: missing matching right parenthesis at index " +
        globArr.index, globArr.index);
    }

    globArr.next();

    return star;

  } else if (globArr.select() === specs.LAMBDA) {
    globArr.next();
    return genType(types.LIT, specs.LAMBDA);

  } else if (globArr.select() === undefined || globArr.select() === "+" ||
    globArr.select() === ")") {
    return undefined;

  } else if (globArr.select() === "*") {
    throw new RegError("Unexpected regex array: empty substaression before Kleene star at index " +
      globArr.index, globArr.index);

  } else {
    var sym = genType(types.LIT, globArr.select());
    globArr.next();

    return sym;
  }
}

function arrMinimize(arr, loopNo, rulesDone) {
  var tree = arrToTree(arr);

  minimize(tree, loopNo, rulesDone);

  return toArray(tree);
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