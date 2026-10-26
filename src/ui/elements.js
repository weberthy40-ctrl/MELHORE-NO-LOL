/** Build DOM with textContent; supplied strings are never interpreted as markup. */
export function element(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
export function link(document, text, path, className = 'text-link') {
  const node = element(document, 'a', className, text);
  node.href = `#${path}`;
  return node;
}
