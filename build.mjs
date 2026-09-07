import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const sectionNames = ['hero', 'projects', 'about', 'stack', 'journey', 'contact'];
const includePattern = /^<!-- include:sections\/([a-z]+)\.html -->\r?\n/gm;

// The template owns document metadata, stylesheet order, and scripts. Section
// fragments own the homepage content. Edit those sources, then run build:html.
async function renderHomepage() {
  const template = await readFile(path.join(root, 'home', 'index.template.html'), 'utf8');
  const includes = [...template.matchAll(includePattern)];
  const markers = template.match(/<!--\s*include:[\s\S]*?-->/g) ?? [];

  if (markers.length !== includes.length || includes.length !== sectionNames.length) {
    throw new Error('The homepage template must contain exactly six valid section include lines.');
  }

  for (const name of sectionNames) {
    if (includes.filter((include) => include[1] === name).length !== 1) {
      throw new Error(`The homepage template must include sections/${name}.html exactly once.`);
    }
  }

  const fragments = new Map(await Promise.all(sectionNames.map(async (name) => {
    const fragment = await readFile(path.join(root, 'home', 'sections', `${name}.html`), 'utf8');
    if (!fragment.trim() || !fragment.endsWith('\n') || /<!--\s*include:/.test(fragment)) {
      throw new Error(`sections/${name}.html must be nonempty, end with a newline, and contain no includes.`);
    }
    return [name, fragment];
  })));

  return template.replace(includePattern, (_, name) => fragments.get(name));
}

async function main() {
  let check = false;
  let outputPath = path.join(root, 'index.html');
  const args = process.argv.slice(2);

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === '--check') {
      check = true;
    } else if (argument === '--output' && args[index + 1] && !args[index + 1].startsWith('--')) {
      outputPath = path.resolve(process.cwd(), args[++index]);
    } else {
      throw new Error('Usage: node build.mjs [--check] [--output <path>]');
    }
  }

  const document = await renderHomepage();
  let existing;
  try {
    existing = await readFile(outputPath, 'utf8');
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }

  const outputLabel = path.relative(root, outputPath) || outputPath;
  if (check) {
    if (existing !== document) {
      throw new Error(`${outputLabel} is out of date. Run npm run build:html to regenerate the homepage.`);
    }
    console.log(`${outputLabel} matches the homepage template and all six section fragments.`);
    return;
  }

  if (existing === document) {
    console.log(`${outputLabel} is already up to date.`);
    return;
  }

  await writeFile(outputPath, document);
  console.log(`Built ${outputLabel} from home/index.template.html and six section fragments.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
