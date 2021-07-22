#!/usr/bin/env node

'use strict'

const { cosmiconfig: createCosmiconfig } = require('cosmiconfig')
const { omit, isEmpty } = require('lodash')
const beautyError = require('beauty-error')

const pkg = require('../../package.json')

const cosmiconfig = createCosmiconfig(pkg.name)

const metatags = require('@metatags/core')

const getUrl = require('./get-url')
const build = require('./build')
const view = require('../view')

require('update-notifier')({ pkg }).notify()

const cli = require('meow')(require('./help'), {
  pkg,
  description: false,
  flags: {
    concurrence: {
      alias: 'c',
      type: 'number',
      default: 8
    },
    followRedirect: {
      alias: 'f',
      type: 'boolean',
      default: true
    },
    logspeed: {
      type: 'number',
      default: 100
    },
    prerender: {
      alias: 'p',
      default: 'auto'
    },
    timeout: {
      alias: 't',
      type: 'number',
      default: 30000
    },
    retries: {
      alias: 'r',
      type: 'number',
      default: 2
    }
  }
})

const main = async () => {
  const { config = {} } = (await cosmiconfig.search()) || {}
  const input = config.url || cli.input

  if (isEmpty(input)) {
    cli.showHelp()
    await build.exit({ buildCode: 1, exitCode: 0 })
  }

  const flags = {
    ...omit(config, ['url']),
    ...cli.flags
  }

  const url = getUrl(input)

  await build.start()
  const emitter = await metatags(url, flags)
  view({ emitter, ...flags })
}

main().catch(async genericError => {
  console.error(beautyError(genericError))
  await build.exit({ buildCode: 1, exitCode: 1 })
})
