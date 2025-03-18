/**
 * EmptyModulePlugin for Webpack
 * 
 * This plugin provides empty modules for specified module requests
 * instead of letting the build fail when these modules are imported.
 */
class EmptyModulePlugin {
  constructor(options = {}) {
    this.modulesToIgnore = options.modules || [];
    this.exactPaths = options.exactPaths || [];
    this.ignorePaths = options.ignorePaths || [];
    this.verbose = options.verbose || false;
  }

  apply(compiler) {
    const modulesToIgnore = this.modulesToIgnore;
    const exactPaths = this.exactPaths;
    const ignorePaths = this.ignorePaths;
    const verbose = this.verbose;

    // Hook into the normal module factory
    compiler.hooks.normalModuleFactory.tap('EmptyModulePlugin', factory => {
      // Hook into the "before resolve" phase of module resolution
      factory.hooks.beforeResolve.tap('EmptyModulePlugin', resolveData => {
        if (!resolveData) return;

        const request = resolveData.request;
        
        // Skip if the request is in the ignore paths
        const shouldSkip = ignorePaths.some(path => request.includes(path));
        if (shouldSkip) {
          return;
        }
        
        // Check if the request matches any exact paths
        const exactMatch = exactPaths.some(path => request === path);
        if (exactMatch) {
          if (verbose) {
            console.log(`[EmptyModulePlugin] Exact match: Providing empty module for: ${request}`);
          }
          resolveData.request = require.resolve('./dummy-utils.js');
          return;
        }
        
        // Check if the request includes any of our specified modules to ignore
        const shouldIgnore = modulesToIgnore.some(moduleToIgnore => 
          request.includes(moduleToIgnore)
        );

        if (shouldIgnore) {
          if (verbose) {
            console.log(`[EmptyModulePlugin] Providing empty module for: ${request}`);
          }
          
          // Replace the request with our empty module
          resolveData.request = require.resolve('./dummy-utils.js');
        }
      });
    });
  }
}

module.exports = EmptyModulePlugin; 