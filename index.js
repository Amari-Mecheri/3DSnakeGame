// Require the framework and instantiate it
const fastify = require('fastify')({ logger: true })
const path = require('path')

// Serve the static assets
fastify.register(require('fastify-static'), {
  root: path.join(__dirname, ''),
  prefix: '/'
})

// Run the server!
const start = async () => {
  try {
    await fastify.listen(8080)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
start()