export { decodeCssString, encodeCssString } from "@src/features/designer/layoutCss/cssString";
export {
  addElementRule,
  duplicateElementRule,
  formatMm,
  moveElementRule,
  renameElement,
  selectorFor,
  setDeclaration,
  setDeclarations,
  type RuleTarget,
} from "@src/features/designer/layoutCss/edit";
export { LayoutDocument } from "@src/features/designer/layoutCss/LayoutDocument";
export { removeElementRule } from "@src/features/designer/layoutCss/remove";
export {
  lengthToMm,
  parseLayoutCss,
  readPageSize,
  splitProperty,
  textProperty,
  type DeclarationInfo,
  type ElementRule,
  type LayoutCss,
  type PageSize,
  type RuleInfo,
} from "@src/features/designer/layoutCss/parse";
export {
  fieldPlaceholder,
  parseTextTemplate,
  templateFields,
  type TemplateSegment,
} from "@src/features/designer/layoutCss/textTemplate";
