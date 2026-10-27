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

/** Stable HUD nodes avoid layout work when the displayed values have not changed. */
export function updateHud(node,text){
 if(node.dataset.hudText===text)return;node.dataset.hudText=text;node.classList.add('stat-hud');const parts=text.split(/\s+•\s+/);
 if(node.children.length!==parts.length){node.replaceChildren();for(const [i,part]of parts.entries()){if(i)node.append(node.ownerDocument.createTextNode(' • '));node.append(element(node.ownerDocument,'span','stat-chip',part));}}
 else for(const [i,part]of parts.entries())if(node.children[i].textContent!==part)node.children[i].textContent=part;
}
