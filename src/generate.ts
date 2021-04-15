
import { createWriteStream } from 'fs'
import { promisify } from 'util'
import stream from 'stream'
import { mkdirp } from 'fs-extra'
import { dirname, join, relative, resolve, extname, basename } from 'upath'
import fetch from 'node-fetch'
import { joinURL, hasProtocol, parseURL } from 'ufo'
import { ModuleOptions, MapToStatic, ResolvedImage } from './types'
import { hash, logger } from './utils'
import * as Throttle from 'promise-parallel-throttle';

const pipeline = promisify(stream.pipeline)

export function setupStaticGeneration (nuxt: any, options: ModuleOptions) {
  const staticImages = {} // url ~> hashed file name

  nuxt.hook('vue-renderer:ssr:prepareContext', (renderContext) => {
    renderContext.image = renderContext.image || {}
    renderContext.image.mapToStatic = <MapToStatic> function ({ url, format }: ResolvedImage) {
      if (!staticImages[url]) {
        const ext = (format && `.${format}`) || extname(parseURL(url).pathname) || '.png'
        staticImages[url] = basename(parseURL(url).pathname, ext) + '-' + hash(url) + ext
      }
      return staticImages[url]
    }
  })

  nuxt.hook('generate:done', async () => {
    const { dir: generateDir } = nuxt.options.generate
    const downloads = Object.entries(staticImages).map(([url, name]) => () => {
      if (!hasProtocol(url)) {
        url = joinURL(options.internalUrl, url)
      }
      return downloadImage({
        url,
        name,
        outDir: resolve(generateDir, '_nuxt/image' /* TODO: staticImagesBase */)
      })
    })
    await Throttle.all(downloads, { maxInProgress: options.providerRequests })
  })
}

async function downloadImage ({ url, name, outDir }) {
  try {
    const response = await fetch(url)
    if (!response.ok) { throw new Error(`Unexpected response ${response.statusText}`) }
    const dstFile = join(outDir, name)
    await mkdirp(dirname(dstFile))
    await pipeline(response.body, createWriteStream(dstFile))
    logger.success('Generated static image ' + relative(process.cwd(), dstFile))
  } catch (error) {
    logger.error(error.message)
  }
}
