import {
  compose,
  isEmpty,
  isNil,
  curry,
  merge,
  omit,
  reject,
  pick
} from "ramda";
import { Dimensions } from "react-native";

const firstCharacterToLowerCase = str =>
  str.charAt(0).toLowerCase() + str.slice(1);

export const capitalize = str => str.charAt(0).toUpperCase() + str.slice(1);

export { firstCharacterToLowerCase };

export const stringToSelectItem = str => ({ label: str, value: str });
export const stringsToSelectItems = arr =>
  arr.map(str => stringToSelectItem(str));
export const capitalizeLabels = items =>
  items.map(item => ({ ...item, label: capitalize(item.label) }));

export const numberToSelectItemLengthCm = num => ({
  label: `${num}cm`,
  value: num
});
export const numbersToSelectItemsLengthCm = arr =>
  arr.map(num => numberToSelectItemLengthCm(num));

export const omitWhen = curry((fn, ks, obj) =>
  merge(omit(ks, obj), reject(fn, pick(ks, obj)))
);

export const isEmptyIgnoreNil = compose(
  isEmpty,
  reject(isNil)
);

export const getImageScaleSize = (width, height) => {
  const dimensions = Dimensions.get('window');
  const k = width ? height / width : 0;
  const imageHeight = Math.round(dimensions.width * k);
  const imageWidth = dimensions.width;
  return {imageWidth, imageHeight}
};
