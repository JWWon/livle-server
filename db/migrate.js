// Use with cautions
// It forcefully syncs the schema

require('./_migrate')().then(() => process.exit())
