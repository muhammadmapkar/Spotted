// Helpers for the "whole app" audit tests: read every screen and component file and look at it with the TypeScript parser.
const fs = require('node:fs');
const path = require('node:path');
const ts = require(path.join(__dirname, '..', '..', 'node_modules', 'typescript'));

const root = path.join(__dirname, '..', '..');

// Every .tsx / .ts file of the app (not tests, not node_modules).
function appFiles(extensions = ['.tsx']) {
  const found = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (extensions.includes(path.extname(entry.name))) found.push(full);
    }
  };
  for (const folder of ['app', 'src', 'components']) if (fs.existsSync(path.join(root, folder))) walk(path.join(root, folder));
  return found;
}

const parse = (file) => ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true, file.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
const relative = (file) => path.relative(root, file);

function visit(node, fn) {
  fn(node);
  ts.forEachChild(node, (child) => visit(child, fn));
}

module.exports = { ts, root, appFiles, parse, relative, visit };
