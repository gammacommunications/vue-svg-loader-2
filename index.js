const { optimize } = require('svgo');
const { version } = require('vue');
const semverMajor = require('semver/functions/major')
const sanitizeSvgoConfig = require('./svgoConfigBuilder')

module.exports = function vueSvgLoader(svg) {
  let { svgo: svgoConfig } = this.getOptions() || {};

  svgoConfig = sanitizeSvgoConfig(svgoConfig);

  let optimized;
  optimized = optimize(svg, {
    path: this.resourcePath,
    ...svgoConfig
  });
  
  const error = (optimized.modernError || optimized.error) || false

  if(error){
    // we'll throw a fatal error here for now
    // this will stop the current compilation run and make the user aware that at least one of the svgs could not be processed
    throw error;
  }

  let data = optimized.data;

  if (semverMajor(version) === 2) {
    data = data.replace('<svg', '<svg v-on="$listeners"');
  }

  return `<template>${data}</template>`;
};
