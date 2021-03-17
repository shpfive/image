import {joinURL} from "ufo";
import {createOperationsGenerator} from "~image";
const operationsGenerator = createOperationsGenerator({
  keyMap: {
    width: "w",
    height: "h",
    format: "fm"
  },
  valueMap: {
    fit: {
      fill: "scale",
      inside: "fit-max",
      outside: "fit-min",
      cover: "crop",
      contain: "fill"
    }
  },
  joinWith: "&",
  formatter: (key, value) => `${key}=${value}`
});
export const getImage = (src, {modifiers = {}, baseURL = "/"} = {}) => {
  const operations = operationsGenerator(modifiers);
  return {
    url: joinURL(baseURL, src + (operations ? "?" + operations : ""))
  };
};
