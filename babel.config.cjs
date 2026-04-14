module.exports = function(api) {
  const isTest = api.env('test')
  return {
    presets: [
      ['@babel/preset-env', { targets: { node: 'current' } }],
      isTest && ['@babel/preset-react', { runtime: 'automatic' }]
    ].filter(Boolean),
    plugins: [
      // Transforms import.meta.env.X → process.env.X for Jest
      isTest && 'babel-plugin-transform-import-meta'
    ].filter(Boolean),
  }
}
