// Note: requires that size is a power of two!
var crypto = require('crypto');
exports.hasher = function(size) {
  var mask = size - 1;
  return function(point) {
    var key = (point[0] + 31 * point[1]) | 0;
    return (key < 0 ? ~key : key) & mask;
  };
};
exports.arrayHasher =  function(list, reversed){
   var hasher = crypto.createHash('md5');
    if(reversed){
       list.reduceRight(function(a,b){
        return a.update(new Buffer(b));
      },hasher);
     } else{
    list.reduce(function(a,b){
      return a.update(new Buffer(b))
    },hasher);
    }
    return hasher.digest('hex');
}
