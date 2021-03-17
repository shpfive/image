import defu from "defu";
import {joinURL} from "ufo";
import {imageMeta} from "./utils/meta";
import {parseSize} from "./utils";
import {useStaticImageMap} from "./utils/static-map";
export function createImage(globalOptions, nuxtContext) {
  const staticImageManifest = process.client && process.static ? useStaticImageMap(nuxtContext) : {};
  const ctx = {
    options: globalOptions,
    nuxtContext
  };
  const getImage = function(input, options = {}) {
    const image = resolveImage(ctx, input, options);
    if (image.isStatic) {
      handleStaticImage(image, input);
    }
    return image;
  };
  function $img(input, modifiers = {}, options = {}) {
    return getImage(input, {
      ...options,
      modifiers: {
        ...options.modifiers,
        ...modifiers
      }
    }).url;
  }
  function handleStaticImage(image, input) {
    if (process.static) {
      const staticImagesBase = "/_nuxt/image";
      if (process.client && "fetchPayload" in window.$nuxt) {
        const mappedURL = staticImageManifest[image.url];
        image.url = mappedURL ? joinURL(staticImagesBase, mappedURL) : input;
        return image;
      }
      if (process.server) {
        const {ssrContext} = ctx.nuxtContext;
        const ssrData = ssrContext.nuxt.data[0];
        const staticImages = ssrData._img = ssrData._img || {};
        const mapToStatic = ssrContext.image?.mapToStatic;
        if (typeof mapToStatic === "function") {
          const mappedURL = mapToStatic(image);
          if (mappedURL) {
            staticImages[image.url] = mappedURL;
            image.url = joinURL(staticImagesBase, mappedURL);
          }
        }
      }
    } else if (process.env.NODE_ENV === "production") {
      image.url = input;
    }
  }
  for (const presetName in globalOptions.presets) {
    $img[presetName] = (source, modifiers, options) => $img(source, modifiers, {...globalOptions.presets[presetName], ...options});
  }
  $img.options = globalOptions;
  $img.getImage = getImage;
  $img.getMeta = (input, options) => getMeta(ctx, input, options);
  $img.getSizes = (input, options) => getSizes(ctx, input, options);
  ctx.$img = $img;
  return $img;
}
async function getMeta(ctx, input, options) {
  const image = resolveImage(ctx, input, {...options});
  const meta = {};
  if (typeof image.getMeta === "function") {
    Object.assign(meta, await image.getMeta());
  } else {
    Object.assign(meta, await imageMeta(ctx, image.url));
  }
  return meta;
}
function resolveImage(ctx, input, options) {
  if (typeof input !== "string") {
    throw new TypeError(`input must be a string (received ${typeof input}: ${JSON.stringify(input)})`);
  }
  if (input.startsWith("data:")) {
    return {
      url: input
    };
  }
  const {provider, defaults} = getProvider(ctx, options.provider || ctx.options.provider);
  const preset = getPreset(ctx, options.preset);
  const _options = defu(options, preset, defaults);
  _options.modifiers = {..._options.modifiers};
  const expectedFormat = _options.modifiers.format;
  if (_options.modifiers?.width) {
    _options.modifiers.width = parseSize(_options.modifiers.width);
  }
  if (_options.modifiers?.height) {
    _options.modifiers.height = parseSize(_options.modifiers.height);
  }
  const image = provider.getImage(input, _options, ctx);
  image.format = image.format || expectedFormat || "";
  return image;
}
function getProvider(ctx, name) {
  const provider = ctx.options.providers[name];
  if (!provider) {
    throw new Error("Unknown provider: " + name);
  }
  return provider;
}
function getPreset(ctx, name) {
  if (!name) {
    return {};
  }
  if (!ctx.options.presets[name]) {
    throw new Error("Unknown preset: " + name);
  }
  return ctx.options.presets[name];
}
function getSizes(ctx, input, opts) {
  const ratio = parseSize(opts.modifiers.height) / parseSize(opts.modifiers.width);
  const variants = [];
  const sizes = {};
  if (typeof opts.sizes === "string") {
    for (const entry of opts.sizes.split(/[\s,]+/).filter((e) => e)) {
      const s = entry.split(":");
      if (s.length !== 2) {
        continue;
      }
      sizes[s[0].trim()] = s[1].trim();
    }
  } else {
    Object.assign(sizes, opts.sizes);
  }
  for (const key in sizes) {
    const screenMaxWidth = ctx.options.screens[key] || parseInt(key);
    let size = String(sizes[key]);
    const isFluid = size.endsWith("vw");
    if (!isFluid && /^\d+$/.test(size)) {
      size = size + "px";
    }
    if (!isFluid && !size.endsWith("px")) {
      continue;
    }
    let width = parseInt(size);
    if (!screenMaxWidth || !width) {
      continue;
    }
    if (isFluid) {
      width = Math.round(width / 100 * screenMaxWidth);
    }
    const height = ratio ? Math.round(width * ratio) : parseSize(opts.modifiers.height);
    variants.push({
      width,
      size,
      screenMaxWidth,
      media: `(max-width: ${screenMaxWidth}px)`,
      src: ctx.$img(input, {...opts.modifiers, width, height}, opts)
    });
  }
  variants.sort((v1, v2) => v1.screenMaxWidth - v2.screenMaxWidth);
  const defaultVar = variants[variants.length - 1];
  if (defaultVar) {
    defaultVar.media = "";
  }
  return {
    sizes: variants.map((v) => `${v.media ? v.media + " " : ""}${v.size}`).join(", "),
    srcset: variants.map((v) => `${v.src} ${v.width}w`).join(", "),
    src: defaultVar?.src
  };
}
