export async function imageMeta(ctx, url) {
  const cache = getCache(ctx);
  const cacheKey = "image:meta:" + url;
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }
  const meta = await _imageMeta(url).catch((err) => {
    console.error("Failed to get image meta for " + url, err + "");
    return {
      width: 0,
      height: 0,
      ratio: 0
    };
  });
  cache.set(cacheKey, meta);
  return meta;
}
async function _imageMeta(url) {
  if (process.client) {
    if (typeof Image === "undefined") {
      throw new TypeError("Image not supported");
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const meta = {
          width: img.width,
          height: img.height,
          ratio: img.width / img.height
        };
        resolve(meta);
      };
      img.onerror = (err) => reject(err);
      img.src = url;
    });
  }
  if (process.server) {
    const imageMeta2 = require("image-meta").default;
    const data = await fetch(url).then((res) => res.buffer());
    const {width, height} = await imageMeta2(data);
    const meta = {
      width,
      height,
      ratio: width / height
    };
    return meta;
  }
}
function getCache(ctx) {
  if (!ctx.nuxtContext.cache) {
    if (ctx.nuxtContext.ssrContext && ctx.nuxtContext.ssrContext.cache) {
      ctx.nuxtContext.cache = ctx.nuxtContext.ssrContext.cache;
    } else {
      const _cache = {};
      ctx.nuxtContext.cache = {
        get: (id) => _cache[id],
        set: (id, value) => {
          _cache[id] = value;
        },
        has: (id) => typeof _cache[id] !== "undefined"
      };
    }
  }
  return ctx.nuxtContext.cache;
}
