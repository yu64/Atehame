import Nesting from '@tailwindcss/nesting';
import daisyui from 'daisyui';
import postcss from 'postcss';
import Stringifier from 'postcss/lib/stringifier';
import { symbols } from 'unocss';

const IMPORTANT = /\s*!important\s*$/i, UNITLESS = /* @__PURE__ */ new Set(["box-flex", "box-flex-group", "column-count", "fill-opacity", "flex", "flex-grow", "flex-negative", "flex-positive", "flex-shrink", "font-weight", "line-clamp", "line-height", "opacity", "order", "orphans", "stroke-dashoffset", "stroke-opacity", "stroke-width", "tab-size", "widows", "z-index", "zoom"]);
function dashify(str) {
  return str.replace(/([A-Z])/g, "-$1").replace(/^ms-/, "-ms-").toLowerCase();
}
function decl(parent, name, value) {
  if (value === false || value === null) {
    return;
  }
  if (!name.startsWith("--")) {
    name = dashify(name);
  }
  if (typeof value === "number") {
    if (value === 0 || UNITLESS.has(name)) {
      value = value.toString();
    } else {
      value = `${value}}px`;
    }
  }
  if (name === "css-float") {
    name = "float";
  }
  if (IMPORTANT.test(value)) {
    value = value.replace(IMPORTANT, "");
    parent.push(postcss.decl({ important: true, prop: name, value }));
  } else {
    parent.push(postcss.decl({ prop: name, value }));
  }
}
function atRule(parent, parts, value) {
  const node = postcss.atRule({ name: parts[1], params: parts[3] || "" });
  if (typeof value === "object") {
    node.nodes = [];
    parse(value, node);
  }
  parent.push(node);
}
function parse(obj, parent = postcss.root()) {
  for (const name in obj) {
    const value = obj[name];
    if (value === null || typeof value === "undefined") {
      continue;
    } else if (name[0] === "@") {
      const parts = name.match(/@(\S+)(\s+([\s\S]*))?/);
      if (parts == null) {
        throw new Error("unexpected at rule name");
      }
      if (Array.isArray(value)) {
        for (const item of value) {
          atRule(parent, parts, item);
        }
      } else {
        atRule(parent, parts, value);
      }
    } else if (Array.isArray(value)) {
      for (const i of value) {
        decl(parent, name, i);
      }
    } else if (typeof value === "object") {
      const node = postcss.rule({ selector: name });
      parse(value, node);
      parent.push(node);
    } else {
      decl(parent, name, value);
    }
  }
  return parent;
}

const CSSCLASS = /\.(?<name>[-\w\P{ASCII}]+)/gu, NOMERGE = /^file-input(?:-.+)?|.*::-webkit-slider-runnable-track$/;
class NodesToFlatten {
  atrules = [];
  declarations = [];
  rules = [];
}
function* flattenRules(nodes, parentUnoSymbols = {}) {
  for (const node of nodes) {
    if (node.type !== "atrule" && node.type !== "rule") {
      if (node.type !== "comment") {
        console.warn("skipping", node.type);
      }
      continue;
    }
    if (!node.nodes || node.nodes.length === 0) {
      continue;
    }
    const unoSymbols = { ...parentUnoSymbols };
    let selector = "selector" in node ? node.selector : "";
    if (node.type === "atrule") {
      if (node.name === "keyframes") {
        yield node.toString();
        continue;
      } else if (node.name === "layer") {
        const layer = unoSymbols[symbols.layer] ?? "";
        unoSymbols[symbols.layer] = `${layer}${layer === "" ? "" : "."}${node.params}`;
      } else {
        selector = `@${node.name}${node.raws.afterName ?? " "}${node.params ?? ""}`;
      }
    }
    if (selector) {
      const previousSelector = unoSymbols[symbols.selector] ?? "";
      if (previousSelector && selector !== previousSelector) {
        const parent = unoSymbols[symbols.parent] ?? "";
        unoSymbols[symbols.parent] = `${parent}${parent ? " $$ " : ""}${previousSelector}`;
      }
      unoSymbols[symbols.selector] = selector;
    }
    const nodesToFlatten = new NodesToFlatten();
    node.nodes.forEach((n) => {
      const type = n.type;
      if (type === "decl") {
        nodesToFlatten.declarations.push(n);
      } else if (type === "atrule") {
        nodesToFlatten.atrules.push(n);
      } else if (type === "rule") {
        nodesToFlatten.rules.push(n);
      }
    });
    if (nodesToFlatten.declarations.length) {
      yield [unoSymbols, nodesToFlatten.declarations];
    }
    yield* flattenRules(nodesToFlatten.atrules, unoSymbols);
    yield* flattenRules(nodesToFlatten.rules, unoSymbols);
  }
}
function getUnoCssElements(childNodes, cssObjectInputsByClassToken, layer) {
  const preflights = [];
  Array.from(flattenRules(childNodes)).forEach((rawElement, idx) => {
    if (typeof rawElement === "string") {
      preflights.push({
        getCSS: () => rawElement,
        layer
      });
      return;
    }
    const [unoSymbols, declarations] = rawElement, { [symbols.parent]: parent = "", [symbols.selector]: selector = "" } = unoSymbols, classMatches = Array.from(
      [...parent.matchAll(CSSCLASS), ...selector.matchAll(CSSCLASS)],
      ([, name]) => name
    ), classTokens = new Set(classMatches);
    if (classTokens.size === 0) {
      throw new Error("why include this rule?");
    }
    for (const classToken of classTokens) {
      let cssObjectInputs = cssObjectInputsByClassToken.get(classToken);
      if (cssObjectInputs == null) {
        cssObjectInputs = [];
        cssObjectInputsByClassToken.set(classToken, cssObjectInputs);
      }
      cssObjectInputs.push({
        ...Object.fromEntries(declarations.map(({ important, prop, value }) => [prop, `${value}${important ? " !important" : ""}`])),
        ...unoSymbols,
        [symbols.selector]: (currentSelector) => selector === currentSelector ? selector : selector.replaceAll(CSSCLASS, (all, c) => {
          return c === classToken ? currentSelector : all;
        }),
        [symbols.sort]: idx
      });
    }
  });
  return preflights;
}
async function presetDaisy(options) {
  const cssObjectInputsByClassToken = /* @__PURE__ */ new Map(), processor = postcss({
    Once(root) {
      root.walkAtRules((atRule) => {
        if (atRule.name === "starting-style" && atRule.parent?.type === "rule") {
          let value = "{";
          new Stringifier((str) => value += str).body(atRule);
          value += "}";
          atRule.replaceWith(postcss.decl({ prop: `@${atRule.name}`, value }));
        }
      });
      const variablePrefix = options?.variablePrefix ?? "un-";
      if (variablePrefix !== "tw-") {
        root.walkDecls((decl) => {
          if (decl.prop.startsWith("--tw-")) {
            decl.prop = `--${variablePrefix}${decl.prop.substring(5)}`;
          }
          if (decl.value.includes("var(--tw-")) {
            decl.value = decl.value.replaceAll("var(--tw-", `var(--${variablePrefix}`);
          }
        });
      }
    },
    postcssPlugin: "fix-css"
  }, Nesting), { config, handler } = typeof daisyui === "function" ? daisyui(options) : daisyui, preflightPromises = [], variants = [];
  handler({
    addBase(jsCss) {
      preflightPromises.push(Promise.resolve([{
        getCSS: async () => processor.process(parse(jsCss), { from: "base", to: "base" }).then((ast) => ast.toString()),
        layer: "daisy"
      }]));
    },
    addComponents(jsCss) {
      preflightPromises.push(
        processor.process(parse(jsCss), { from: "components", to: "components" }).then((ast) => getUnoCssElements(ast.root.nodes, cssObjectInputsByClassToken, "daisyui.component"))
      );
    },
    addUtilities(jsCss) {
      preflightPromises.push(
        processor.process(parse(jsCss), { from: "utilities", to: "utilities" }).then((ast) => getUnoCssElements(ast.root.nodes, cssObjectInputsByClassToken, "daisyui.utility"))
      );
    },
    addVariant(name, selector) {
      variants.push(
        (matcher) => {
          if (!matcher.startsWith(`${name}:`)) {
            return matcher;
          }
          return {
            matcher: matcher.slice(name.length + 1),
            selector: (s) => {
              const variantSelector = Array.isArray(selector) ? selector.join("") : selector;
              return `${s}${variantSelector}`;
            }
          };
        }
      );
    },
    config: (key) => options?.[key.split(".")[1]]
    // for daisyui v4
  });
  const preflights = await Promise.all(preflightPromises).then((p) => p.flat()), rules = [];
  for (const [classToken, cssObjectInputs] of cssObjectInputsByClassToken) {
    const noMerge = cssObjectInputs.some((cssObjectInput) => {
      const selector = cssObjectInput[symbols.selector];
      return cssObjectInput[symbols.selector] != null && NOMERGE.test(selector(`.${classToken}`));
    });
    rules.push([new RegExp(`^${classToken}$`), () => cssObjectInputs, {
      autocomplete: classToken,
      noMerge
    }]);
  }
  return {
    ...config,
    name: "unocss-preset-daisy",
    preflights,
    rules,
    variants
  };
}

export { presetDaisy };
