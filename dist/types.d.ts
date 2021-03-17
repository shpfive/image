import { IPXOptions } from 'ipx';

interface ImageModifiers {
  width: number
  height: number
  fit: string
  format: string
  [key: string]: any
}

interface ImageOptions {
  provider?: string,
  preset?: string,
  modifiers?: Partial<ImageModifiers>
  [key: string]: any
}

// eslint-disable-next-line no-use-before-define
type ProviderGetImage = (src: string, options: ImageOptions, ctx: ImageCTX) => ResolvedImage

interface ImageProvider {
  defaults?: any
  getImage: ProviderGetImage
}

interface CreateImageOptions {
  providers: {
    [name: string]: {
      defaults: any,
      provider: ImageProvider
    }
  }
  presets: { [name: string]: ImageOptions }
  provider: string
  intersectOptions: object
  screens?: Record<string, number>,
}

interface ImageInfo {
  width: number,
  height: number,
  placeholder?: string,
}

interface ResolvedImage {
  url: string,
  format?: string
  isStatic?: boolean
  getMeta?: () => Promise<ImageInfo>
}

interface $Img {
  (source: string, modifiers?: ImageOptions['modifiers'], options?: ImageOptions): ResolvedImage['url']
  options: CreateImageOptions
  getImage: (source: string, options?: ImageOptions) => ResolvedImage
  getSizes: (source: string, options?: ImageOptions, sizes?: string[]) => { srcset: string, sizes: string }
  getMeta: (source: string, options?: ImageOptions) => Promise<ImageInfo>
  [preset: string]: $Img['options'] | $Img['getImage'] | $Img['getSizes'] | $Img['getMeta'] | $Img /* preset */
}

interface ImageCTX {
  options: CreateImageOptions,
  nuxtContext: {
    ssrContext: any
    cache?: any
    isDev: boolean
    isStatic: boolean
    nuxtState?: any
  }
  $img?: $Img
}

interface InputProvider<T=any> {
  name?: string
  provider?: string
  options?: T
}

interface ImageProviders {
  cloudinary?: any
  fastly?: any
  imagekit?: any
  imgix?: any
  twicpics?: any
  ipx?: Partial<IPXOptions>
  static?: Partial<IPXOptions>
}

// TODO: use types from CreateImageOptions
interface ModuleOptions extends ImageProviders {
  provider: CreateImageOptions['provider']
  presets: { [name: string]: ImageOptions }
  dir: string
  domains: string[]
  sharp: {}
  screens: CreateImageOptions['screens'],
  internalUrl: string
  intersectOptions: CreateImageOptions['intersectOptions']
  providers: { [name: string]: InputProvider | any } & ImageProviders
}

declare module '@nuxt/types' {
  interface Context {
    $img: $Img
  }

  interface NuxtAppOptions {
    $img: $Img
  }

  interface Configuration {
    image?: Partial<ModuleOptions>
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $img: $Img
  }
}

declare module 'vuex/types/index' {
  // eslint-disable-next-line no-unused-vars,@typescript-eslint/no-unused-vars
  interface Store<S> {
    $img: $Img
  }
}

declare function imageModule(moduleOptions: ModuleOptions): Promise<void>;

export default imageModule;
