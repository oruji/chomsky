function minimize(str) {
  return toHier(str);
}

function toHier(str) {
  // convert str to array
  var arr = [];
  for ( var i = 0; i < str.length; i++) {
    arr.push(str[i]);
  }

  // generate hierarchical structure
  if (arr.length === 0) {
    return {
      type : "multiplication",
      elms : []
    };
  }
}