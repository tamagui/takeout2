// on-zero/server should never run on native — this stub prevents metro from
// bundling pg and other node-only dependencies
throw new Error('on-zero/server is not available on native')
