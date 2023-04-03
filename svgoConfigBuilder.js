const defaultConfig = {
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

module.exports = function sanitizeSvgoConfig(svgoConfig) {
  const newConfig = JSON.parse(JSON.stringify(svgoConfig || {}));
  let plugins = newConfig.plugins = newConfig.plugins || [];
  let defaultPreset = plugins.find(plugin => plugin.name === 'preset-default');

  if(!defaultPreset) {
    const preset = {name: 'preset-default'}
    plugins.push(preset);
    defaultPreset = preset;
  }

  const params = defaultPreset.params = defaultPreset.params || {}
  const overrides = params.overrides = params.overrides || {}
  const inlineStyles = overrides.inlineStyles = overrides.inlineStyles || {}
  inlineStyles.onlyMatchedOnce = false;
  return newConfig;
}