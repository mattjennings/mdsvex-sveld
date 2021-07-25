/* eslint-disable no-async-promise-executor */
import { visit } from "unist-util-visit";
import path from "path";
import fs from "fs";
import { ComponentParser } from "sveld";
import sveltePreprocess from "svelte-preprocess";
import * as svelte from "svelte/compiler";
import { sveldToMarkdown } from "./markdown.js";
import { resolveAlias } from "./resolve-alias.js";

const RE_SCRIPT_START =
  /<script(?:\s+?[a-zA-z]+(=(?:["']){0,1}[a-zA-Z0-9]+(?:["']){0,1}){0,1})*\s*?>/;

export default function mdsvexSveld() {
  let viteConfig;
  return function transformer(tree, file) {
    return new Promise(async (resolve) => {
      if (!viteConfig) {
        viteConfig = await loadViteConfig();
      }

      let id = 0;
      const nodes = new Map();
      const components = new Map();

      visit(tree, "code", (node) => {
        if (node.lang.startsWith("docs")) {
          nodes.set(node, node);
        }
      });

      for (const node of nodes.values()) {
        const relativeImport = node.value;

        const [, section] = node.lang.split(":");
        try {
          if (relativeImport) {
            const aliasImport = resolveAlias(
              relativeImport,
              viteConfig.resolve.alias
            );

            const parsed = path.parse(file.filename);
            const componentPath = aliasImport
              ? path.resolve(process.cwd(), aliasImport)
              : path.resolve(parsed.dir, relativeImport);

            if (!components.has(componentPath)) {
              const data = await processComponent(componentPath);

              components.set(componentPath, {
                id: `_docs_import_${++id}`,
                path: componentPath,
                data,
              });
            }

            const { data } = components.get(componentPath);

            const tableNodes = sveldToMarkdown(data, section);

            node.type = "leaf";
            delete node.lang;
            delete node.value;
            delete node.position;
            node.children = tableNodes;
          }
        } catch (e) {
          console.error(e);
        }
      }

      // this is a hack to get "HMR" working when the imported component changes.
      // we take the componentPath and add an import for it
      if (process.env.NODE_ENV === "development") {
        let scripts = "";
        components.forEach(
          (x) => (scripts += `import ${x.id} from "${x.path}?raw";\n`)
        );

        let is_script = false;

        visit(tree, "html", (node) => {
          if (RE_SCRIPT_START.test(node.value)) {
            is_script = true;
            node.value = node.value.replace(RE_SCRIPT_START, (script) => {
              return `${script}\n${scripts}`;
            });
          }
        });

        if (!is_script) {
          tree.children.push({
            type: "html",
            value: `<script>\n${scripts}</script>`,
          });
        }
      }

      resolve();
    });
  };
}

async function processComponent(path) {
  const { code } = await svelte.preprocess(
    fs.readFileSync(path, "utf8"),
    sveltePreprocess(),
    {
      filename: path,
    }
  );
  const data = new ComponentParser({
    verbose: false,
  }).parseSvelteComponent(code, {
    filePath: path,
    moduleName: null,
  });
  return data;
}

async function loadViteConfig() {
  const svelteConfigPath = path.resolve(process.cwd(), "svelte.config.js");
  const viteConfigPath = path.resolve(process.cwd(), "vite.config.js");
  const svelteConfigExists = fs.existsSync(svelteConfigPath);
  const viteConfigExists = fs.existsSync(viteConfigPath);

  if (svelteConfigExists) {
    const svelteConfig = await import(svelteConfigPath).then((r) => r.default);

    if (svelteConfig.kit?.vite) {
      const config = svelteConfig.kit?.vite;
      return {
        ...config,
        resolve: {
          ...config.resolve,
          alias: {
            $lib: ["src/lib"],
            ...config.resolve?.alias,
          },
        },
      };
    }
  }

  if (viteConfigExists) {
    const viteConfig = await import(viteConfigPath).then((r) => r.default);
    return viteConfig;
  }

  return null;
}
