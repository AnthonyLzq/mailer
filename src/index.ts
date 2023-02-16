import Fastify from 'fastify'
// import cors from '@fastify/cors'
import jwt from 'jsonwebtoken'

import { mailer } from 'mail'
import { addTokenToBlackList, isTokenInBlackList } from 'database'

const fastify = Fastify()
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 4000
const ORIGINS = ['http://localhost:3000', 'https://www.anthonylzq.dev']

const main = async () => {
  // await fastify.register(cors, {
  //   origin: (origin, cb) => {
  //     console.log('🚀 ~ file: index.ts:15 ~ main ~ origin', origin)

  //     if (!origin || !ORIGINS.includes(origin))
  //       return cb(new Error('Not allowed'), false)

  //     return cb(null, true)
  //   }
  // })
  fastify.addHook('preHandler', (req, reply, done) => {
    reply.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE')
    reply.header('Access-Control-Allow-Origin', '*')
    reply.header(
      'Access-Control-Allow-Headers',
      'Authorization, Content-Type, Origin'
    )
    reply.header('x-powered-by', 'TPG')
    done()
  })
  fastify.get('/', async (req, reply) => {
    return reply.send({ error: false, message: 'Hello World' })
  })
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const {
      params: { id },
      headers: { origin }
    } = req

    if (!origin || !ORIGINS.includes(origin))
      return reply.send({
        error: true,
        message: 'Origin not allowed'
      })

    const token = jwt.sign({ id, origin }, process.env.KEY as string, {
      expiresIn: '10m'
    })

    return reply.send({ error: false, token })
  })
  fastify.post<{
    Body: { from: string; subject: string; text: string }
    Headers: { 'api-key': string }
    Params: { id: string }
  }>('/:id', async (req, reply) => {
    const {
      body: { from, subject, text },
      headers,
      params: { id }
    } = req
    const token = headers['api-key']

    if (!token)
      return reply.code(401).send({
        error: true,
        message: 'Missing Api-Key header'
      })

    try {
      const isBlacklisted = await isTokenInBlackList(token)

      if (isBlacklisted)
        return reply.code(401).send({
          error: true,
          message: 'Token already used'
        })
    } catch (error) {
      return reply.code(500).send({
        error: true,
        message: 'Internal Server Error'
      })
    }

    try {
      const decoded = jwt.verify(token, process.env.KEY as string, {
        complete: true
      })

      if ((decoded.payload as jwt.JwtPayload).id !== id)
        return reply.code(401).send({
          error: true,
          message: 'Invalid token'
        })

      await addTokenToBlackList(token).catch(() => {
        console.log(`Error while trying to add token to blacklist: ${token}}`)
      })
      await mailer({ from, subject, text })

      return reply.send({ error: false, message: 'Mail sent' })
    } catch (error) {
      console.error(error)

      return reply.code(401).send({
        error: true
      })
    }
  })
  await fastify.listen({
    port: PORT
  })

  console.log(`Server listening on port: ${PORT}`)
}

main()
