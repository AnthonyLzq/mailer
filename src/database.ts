import type { RedisClientType } from 'redis'
import { createClient } from 'redis'

let redisConnected = false

declare global {
  // eslint-disable-next-line no-var
  var __redisDb__: RedisClientType
}

const redisConnection = (): {
  connect: () => Promise<RedisClientType>
  disconnect: () => Promise<boolean>
} => {
  return {
    connect: async () => {
      if (!global.__redisDb__) {
        global.__redisDb__ = createClient({
          url: process.env.REDIS_URL
        })
        await global.__redisDb__.connect()
        redisConnected = true
        console.log('Redis connection established.')
      }

      return global.__redisDb__
    },
    disconnect: async () => {
      if (global.__redisDb__) {
        await global.__redisDb__.disconnect()
        redisConnected = false
        console.log('Redis connection established.')
      }

      return redisConnected
    }
  }
}

const getBlackList = async () => {
  const redisClient = await redisConnection().connect()
  const blacklist = await redisClient.LRANGE('blacklist', 0, -1)

  return blacklist
}

const addMailToBlackList = async (email: string) => {
  const redisClient = await redisConnection().connect()
  const { length: previousBlackListLength } = await getBlackList()

  await redisClient.LPUSH('blacklist', email)

  const { length: laterBlackListLength } = await getBlackList()

  return laterBlackListLength > previousBlackListLength
}

const addTokenToBlackList = async (token: string) => {
  const redisClient = await redisConnection().connect()

  await redisClient.set(token, 'true', {
    EX: 60 * 60 * 15
  })
}

const isTokenInBlackList = async (token: string) => {
  const redisClient = await redisConnection().connect()
  const isTokenInBlackList = await redisClient.get(token)

  return Boolean(isTokenInBlackList)
}

export {
  getBlackList,
  addMailToBlackList,
  redisConnection,
  addTokenToBlackList,
  isTokenInBlackList
}
