export { decodeCssString, encodeCssString } from "@src/features/designer/layoutCss/cssString";
export {
  addElementRule,
  duplicateElementRule,
  moveElementRule,
  renameElement,
  replaceStringValues,
  type RuleTarget,
  selectorFor,
  setDeclaration,
  setDeclarations,
} from "@src/features/designer/layoutCss/edit";
export { LayoutDocument } from "@src/features/designer/layoutCss/LayoutDocument";
export {
  type DeclarationInfo,
  type ElementRule,
  imageNameOf,
  imageProperty,
  type LayoutCss,
  type PageSize,
  parseLayoutCss,
  readPageSize,
  type RuleInfo,
  splitProperty,
  textProperty,
  textTemplateOf,
} from "@src/features/designer/layoutCss/parse";
export { removeElementRule } from "@src/features/designer/layoutCss/remove";
export {
  fieldPlaceholder,
  parseTextTemplate,
  templateFields,
  type TemplateSegment,
} from "@src/features/designer/layoutCss/textTemplate";
