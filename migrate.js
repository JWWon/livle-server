require('./src/user/user').sync()
  .then(() => { console.log('User migrated'); process.exit() })
  .catch(err => { console.error('Failed to migrate User', err); process.exit(1) })


