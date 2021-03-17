import {joinURL, encodeQueryItem, encodePath, hasProtocol} from "ufo";
import {createOperationsGenerator} from "~image";
const operationsGenerator = createOperationsGenerator({
  keyMap: {
    format: "f",
    fit: "fit",
    width: "w",
    height: "h",
    resize: "s",
    quality: "q",
    background: "b"
  },
  joinWith: "&",
  formatter: (key, val) => encodeQueryItem(key, val)
});
export const getImage = (src, {modifiers = {}, baseURL = "/_ipx", domains = []} = {}) => {
  if (modifiers.width && modifiers.height) {
    modifiers.resize = `${modifiers.width}_${modifiers.height}`;
    delete modifiers.width;
    delete modifiers.height;
  }
  const params = operationsGenerator(modifiers);
  if (hasProtocol(src)) {
    if (!domains.find((d) => src.startsWith(d))) {
      return {
        url: src
      };
    }
  }
  return {
    url: joinURL(baseURL, encodePath(src) + (params ? "?" + params : ""))
  };
};
