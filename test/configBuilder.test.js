const sanitizeSvgoConfig = require('../svgoConfigBuilder');

const config = {
  plugins: [
    {
      name: 'preset-default',
      params: {
        overrides: {
          inlineStyles: {
            //force deletion of <style> tags in order for vue-loader to accept the template (no nested tags with side effects allowed)
            onlyMatchedOnce: false
          }
        }
      }
    }
  ]
}

const copy = obj => JSON.parse(JSON.stringify(obj));

it('should produce a valid svgo config', () => {
  expect(sanitizeSvgoConfig({})).toEqual(config);
});

it('should not change a valid svgo config', () => {
  expect(sanitizeSvgoConfig(config)).toEqual(config);
});

it('should override onlymatchedonce to false', () => {
  const test = copy(config);
  test.plugins[0].params.overrides.inlineStyles.onlyMatchedOnce = false;
  expect(sanitizeSvgoConfig(test)).toEqual(config);
});

it('should keep unrelated information unchanged', () => {
  const test = copy(config);
  test.plugins[0].params.overrides.inlineStyles.onlyMatchedOnce = true;
  test.plugins.push({name: "foobar", params: {foo: "bar", ...copy(config.plugins[0].params)}})
  const expectation = copy(test);
  expectation.plugins[0].params.overrides.inlineStyles.onlyMatchedOnce = false;
  expect(sanitizeSvgoConfig(test)).toEqual(expectation);
});

it('should create a new config from a passed svgoConfig', () => {
  expect(sanitizeSvgoConfig(config)).not.toBe(config);
});