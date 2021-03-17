export const imageMixin = {
  props: {
    src: {type: String, required: true},
    format: {type: String, default: void 0},
    quality: {type: [Number, String], default: void 0},
    background: {type: String, default: void 0},
    fit: {type: String, default: void 0},
    modifiers: {type: Object, default: void 0},
    preset: {type: String, default: void 0},
    provider: {type: String, default: void 0},
    sizes: {type: [Object, String], default: void 0},
    width: {type: [String, Number], default: void 0},
    height: {type: [String, Number], default: void 0},
    alt: {type: String, default: void 0},
    referrerpolicy: {type: String, default: void 0},
    usemap: {type: String, default: void 0},
    longdesc: {type: String, default: void 0},
    ismap: {type: Boolean, default: void 0},
    crossorigin: {type: Boolean, default: void 0},
    loading: {type: String, default: void 0},
    decoding: {type: String, default: void 0}
  },
  computed: {
    nImgAttrs() {
      return {
        width: this.width,
        height: this.height,
        alt: this.alt,
        referrerpolicy: this.referrerpolicy,
        usemap: this.usemap,
        longdesc: this.longdesc,
        ismap: this.ismap,
        crossorigin: this.crossorigin,
        loading: this.loading,
        decoding: this.decoding
      };
    },
    nModifiers() {
      return {
        ...this.modifiers,
        width: this.width,
        height: this.height,
        format: this.format,
        quality: this.quality,
        background: this.background,
        fit: this.fit
      };
    },
    nOptions() {
      return {
        provider: this.provider,
        preset: this.preset
      };
    }
  }
};
