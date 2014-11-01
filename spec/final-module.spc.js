var FinalModule = require('../build/FinalModule.js');

describe('FinalModule', function () {

  it('returns deps with suffixes', function () {
    var mod = new FinalModule('test', 'a', 'b', 'c');

    var depsSuffixed = mod.getDepsWithSuffix('ok');
    expect(mod.deps).toEqual(['a:ok', 'b:ok', 'c:ok']);
  });


});