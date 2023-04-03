/**
 * @jest-environment node
 */
import compiler from './compiler.js';
const fs = require('fs');
import path from 'path';
import vueSvgLoader from '../index.js';
const sanitizeSvgoConfig = require('../svgoConfigBuilder.js');
const semVerMajor = require('semver/functions/major');

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

function getActualTemplate(stats){
  let source = stats.toJson({source: true}).modules[0].source; //get the compilation result
  source = source.replace("export default ", ""); //retrieve the plain JSON string built by the testloader
  return JSON.parse(source);
}

function removeVueTags(data){
  return data.replace(/<\\?template>/, "");
}

it('can produce a valid template, which can be compiled by vue-loader', async () => {
  const stats = compiler('test.svg');
  await expect(stats).resolves.not.toThrow();
})

it('Is wrapped by template tags', async () => {
  const stats = await compiler('test.svg', { useDummyLoader: true });
  const source = getActualTemplate(stats);
  
  expect(source.startsWith("<template><svg")).toBe(true);
  expect(source.endsWith("</svg></template>")).toBe(true);
});

it('equals the optimized original data', async () => {
  let file = fs.readFileSync(path.resolve(__dirname, './test.svg'), 'utf8');
  const stats = await compiler('test.svg', { useDummyLoader: true });
  let source = getActualTemplate(stats);
  source = removeVueTags(source);

  let context = { getOptions: () => {} }; //mock the necessary context for vueSvgLoader
  file = vueSvgLoader.call(context, file);
  file = removeVueTags(file);

  expect(file).toEqual(source);
})

jest.mock('semver/functions/major', () => jest.fn())

it('injects listeners for Vue 2', async () => {
  
  const stats = await compiler('test.svg', { useDummyLoader: true });
  let source = getActualTemplate(stats);

  let context = { getOptions: () => {} };
  let file = fs.readFileSync(path.resolve(__dirname, './test.svg'), 'utf8');
  
  semVerMajor.mockImplementation(() => 2);
  let vueTemplate = vueSvgLoader.call(context, file);
  expect(vueTemplate).toContain('v-on="$listeners"');

  semVerMajor.mockImplementation(() => 3);
  vueTemplate = vueSvgLoader.call(context, file);
  expect(vueTemplate).not.toContain('v-on="$listeners"');
})

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