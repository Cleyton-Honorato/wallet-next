/*
 * Wallet — gera Componentes, Telas e Protótipo no arquivo
 * "Wallet — Brand & Design System" (Figma).
 *
 * COMO RODAR
 *   1. Abra o arquivo no Figma (navegador serve).
 *   2. Menu Figma ▸ Plugins ▸ procure "Scripter" (gratuito) ▸ Run.
 *   3. Apague o exemplo do Scripter, cole este arquivo inteiro e clique ▶ (Run).
 *
 * Pré-requisito: o arquivo já tem as variáveis (coleções Primitives, Color,
 * Spacing, Radius), os estilos de texto/sombra e as páginas Brand,
 * Componentes e Telas — criados antes pelo conector.
 *
 * Pode rodar de novo: ele limpa e recria as páginas Componentes e Telas.
 * A página Brand só recebe um ajuste (coluna da tipografia).
 */

// ====================================================================== base
const FAMILY = 'Plus Jakarta Sans';
for (const style of ['Regular', 'Medium', 'SemiBold', 'Bold', 'ExtraBold']) {
  await figma.loadFontAsync({ family: FAMILY, style });
}

const allVars = await figma.variables.getLocalVariablesAsync();
function V(name) {
  const v = allVars.find((x) => x.name === name);
  if (!v) throw new Error('Variável não encontrada: ' + name + ' (rode primeiro a etapa de tokens)');
  return v;
}
const textStyles = await figma.getLocalTextStylesAsync();
function TS(name) {
  const s = textStyles.find((x) => x.name === name);
  if (!s) throw new Error('Estilo de texto não encontrado: ' + name);
  return s;
}
const effectStyles = await figma.getLocalEffectStylesAsync();

function paint(varName) {
  return figma.variables.setBoundVariableForPaint(
    { type: 'SOLID', color: { r: 0, g: 0, b: 0 } }, 'color', V(varName));
}
function bindRadius(node, varName) {
  for (const k of ['topLeftRadius', 'topRightRadius', 'bottomLeftRadius', 'bottomRightRadius']) {
    node.setBoundVariable(k, V(varName));
  }
}
function bindPadding(node, x, y) {
  node.setBoundVariable('paddingLeft', V('space/' + x));
  node.setBoundVariable('paddingRight', V('space/' + x));
  node.setBoundVariable('paddingTop', V('space/' + y));
  node.setBoundVariable('paddingBottom', V('space/' + y));
}
async function applyTextStyle(node, styleName) {
  const s = TS(styleName);
  if (node.setTextStyleIdAsync) await node.setTextStyleIdAsync(s.id);
  else node.textStyleId = s.id;
}
async function applyEffectStyle(node, styleName) {
  const s = effectStyles.find((x) => x.name === styleName);
  if (!s) return;
  if (node.setEffectStyleIdAsync) await node.setEffectStyleIdAsync(s.id);
  else node.effectStyleId = s.id;
}
async function setReactions(node, reactions) {
  if (node.setReactionsAsync) await node.setReactionsAsync(reactions);
  else node.reactions = reactions;
}

/** Frame com auto-layout que abraça o conteúdo nos dois eixos. */
function AL(direction, props = {}) {
  const f = figma.createFrame();
  f.layoutMode = direction;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.fills = [];
  for (const [k, v] of Object.entries(props)) f[k] = v;
  return f;
}
/** Tamanho fixo num frame com auto-layout. */
function fixed(frame, w, h) {
  frame.resize(w, h);
  frame.primaryAxisSizingMode = 'FIXED';
  frame.counterAxisSizingMode = 'FIXED';
  return frame;
}
async function txt(content, style, colorVar = 'text/primary', name) {
  const t = figma.createText();
  await applyTextStyle(t, style);
  t.characters = content;
  t.fills = [paint(colorVar)];
  if (name) t.name = name;
  return t;
}

const ICONS = {
  minus: 'M5 12h14', plus: 'M12 5v14M5 12h14', left: 'M15 18l-6-6 6-6', right: 'M9 18l6-6-6-6',
  x: 'M18 6L6 18M6 6l12 12', menu: 'M4 6h16M4 12h16M4 18h16', chev: 'M9 18l6-6-6-6',
  home: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  list: 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01',
  target: 'M12 3a9 9 0 1 0 0 18a9 9 0 1 0 0-18zM12 7a5 5 0 1 0 0 10a5 5 0 1 0 0-10zM12 11a1 1 0 1 0 0 2a1 1 0 1 0 0-2z',
  user: 'M12 4a4 4 0 1 0 0 8a4 4 0 1 0 0-8zM4 21a8 8 0 0 1 16 0',
  alert: 'M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20zM12 8v4M12 16h.01',
  cart: 'M2 2h2l2.7 12.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L22 7H5.1M8 21h.01M19 21h.01',
  pen: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z',
  gauge: 'M12 14l4-4M3.34 19a10 10 0 1 1 17.32 0',
  tag: 'M12.6 2.6A2 2 0 0 0 11.2 2H4a2 2 0 0 0-2 2v7.2a2 2 0 0 0 .6 1.4l8.7 8.7a2.4 2.4 0 0 0 3.4 0l6.6-6.6a2.4 2.4 0 0 0 0-3.4zM7.5 7.5h.01',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10zM9 12l2 2 4-4',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  home2: 'M3 10l9-7 9 7v10a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  food: 'M3 2v7a3 3 0 0 0 6 0V2M6 2v20M18 22V2a5 5 0 0 0-3 5v6a2 2 0 0 0 2 2h1',
  bus: 'M6 4h12a2 2 0 0 1 2 2v11H4V6a2 2 0 0 1 2-2zM4 11h16M8 21v-4M16 21v-4',
  bolt: 'M13 2L3 14h9l-1 8 10-12h-9z',
  heart: 'M19 14c1.5-1.5 3-3.2 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.8 0-3 .5-4.5 2-1.5-1.5-2.7-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4 3 5.5l7 7z',
  film: 'M3 5h18v14H3zM7 5v14M17 5v14M3 12h18', dots: 'M5 12h.01M12 12h.01M19 12h.01',
  plane: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
  wallet: 'M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4',
};
const HEX = { navy: '#002366', ink: '#14171A', white: '#FFFFFF', green: '#007A35', alert: '#B5532F', inactive: '#8FA3CF', muted: '#5F6670', disabled: '#DDE1E6' };
function icon(name, color, size = 24, strokeWidth = 2) {
  const n = figma.createNodeFromSvg(
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">` +
    `<path d="${ICONS[name]}" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/></svg>`);
  n.name = 'icon/' + name;
  n.fills = [];
  return n;
}
/** Círculo/quadrado com um ícone centralizado. */
function iconBox(name, iconName, iconColor, size, bgVar, radiusVar, iconSize = 20) {
  const b = fixed(AL('HORIZONTAL', { name, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }), size, size);
  if (bgVar) b.fills = [paint(bgVar)];
  if (radiusVar) bindRadius(b, radiusVar); else b.cornerRadius = size / 2;
  b.appendChild(icon(iconName, iconColor, iconSize));
  return b;
}
function fillWidth(node) { node.layoutSizingHorizontal = 'FILL'; }

const pages = Object.fromEntries(figma.root.children.map((p) => [p.name, p]));
for (const required of ['Brand', 'Componentes', 'Telas']) {
  if (!pages[required]) throw new Error('Página "' + required + '" não encontrada');
}

// ============================================== 1. ajuste na página Brand
const brandRoot = await figma.getNodeByIdAsync('4:2');
if (brandRoot && 'findAll' in brandRoot) {
  for (const n of brandRoot.findAll((x) => x.type === 'FRAME' && x.name === 'Meta')) {
    n.layoutSizingVertical = 'HUG';
  }
}

// ============================================== 2. componentes
await figma.setCurrentPageAsync(pages['Componentes']);
for (const n of [...pages['Componentes'].children]) n.remove();
const compPage = pages['Componentes'];

let cursorY = 0;
async function sectionLabel(title, note) {
  const g = AL('VERTICAL', { name: '— ' + title, itemSpacing: 4 });
  g.appendChild(await txt(title, 'Heading/H2'));
  if (note) g.appendChild(await txt(note, 'Caption/Default', 'text/secondary'));
  g.x = 0; g.y = cursorY;
  cursorY += g.height + 24;
}
function placeAndAdvance(node) {
  node.x = 0; node.y = cursorY;
  cursorY += node.height + 96;
}
/** Organiza as variantes em grade (combineAsVariants empilha tudo em 0,0). */
function layoutVariants(set, cols, gapX = 32, gapY = 32) {
  const kids = set.children;
  let w = 0, h = 0;
  for (const k of kids) { w = Math.max(w, k.width); h = Math.max(h, k.height); }
  kids.forEach((k, i) => { k.x = 32 + (i % cols) * (w + gapX); k.y = 32 + Math.floor(i / cols) * (h + gapY); });
  const rows = Math.ceil(kids.length / cols);
  set.resize(64 + cols * w + (cols - 1) * gapX, 64 + rows * h + (rows - 1) * gapY);
  set.fills = [paint('bg/page')];
  set.cornerRadius = 24;
}
function linkText(set, propName, defaultValue, nodeName) {
  const key = set.addComponentProperty(propName, 'TEXT', defaultValue);
  for (const v of set.children) {
    const t = v.findOne((n) => n.type === 'TEXT' && (!nodeName || n.name === nodeName));
    if (t) t.componentPropertyReferences = { characters: key };
  }
  return key;
}

// ---- Ícones (componentes: permitem trocar o ícone nas instâncias)
await sectionLabel('Icon', 'Ícones 24 px em traço de 2 px (lucide). Usados por troca de instância em CategoryTile e DrawerItem.');
const iconComps = {};
const iconRow = AL('HORIZONTAL', { name: 'Ícones', itemSpacing: 24, paddingLeft: 24, paddingRight: 24, paddingTop: 24, paddingBottom: 24 });
iconRow.fills = [paint('bg/page')]; iconRow.cornerRadius = 24;
for (const name of ['cart', 'home2', 'food', 'bus', 'bolt', 'heart', 'film', 'dots', 'gauge', 'tag', 'shield', 'plane', 'pen', 'wallet']) {
  const c = figma.createComponent();
  c.name = 'Icon/' + name;
  c.resize(24, 24); c.fills = [];
  const svg = icon(name, HEX.navy, 24);
  c.appendChild(svg); svg.x = 0; svg.y = 0;
  iconRow.appendChild(c);
  iconComps[name] = c;
}
placeAndAdvance(iconRow);
function linkIconSwap(set, defaultComp) {
  const key = set.addComponentProperty('Icon', 'INSTANCE_SWAP', defaultComp.id);
  for (const v of set.children) {
    const inst = v.findOne((n) => n.type === 'INSTANCE' && n.name.startsWith('Icon/'));
    if (inst) inst.componentPropertyReferences = { mainComponent: key };
  }
}

// ---- Button
await sectionLabel('Button', 'Ações em pílula, 52 px de altura (alvo ≥ 44).');
const buttonVariants = [];
for (const [variant, bg, fg, stroke] of [
  ['Primary', 'brand/primary', 'text/inverse', null],
  ['Accent', 'brand/accent', 'text/on-accent', null],
  ['Secondary', 'bg/card', 'text/primary', 'border/default'],
  ['Ghost', null, 'text/primary', null],
  ['Danger', 'status/danger-bg', 'status/danger', null],
]) {
  const c = figma.createComponent();
  c.name = 'Variant=' + variant;
  c.layoutMode = 'HORIZONTAL';
  c.resize(140, 52);
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 8;
  bindPadding(c, 5, 1); bindRadius(c, 'radius/full');
  c.fills = bg ? [paint(bg)] : [];
  if (stroke) { c.strokes = [paint(stroke)]; c.strokeWeight = 1; }
  c.appendChild(await txt('Salvar gasto', 'Body/Strong', fg, 'Label'));
  buttonVariants.push(c);
}
const Button = figma.combineAsVariants(buttonVariants, compPage);
Button.name = 'Button';
Button.description = 'Primary = ação principal (azul). Accent = destaque (verde, texto azul). Secondary = contorno. Ghost = terciário. Danger = excluir/sair.';
linkText(Button, 'Label', 'Salvar gasto');
layoutVariants(Button, 5);
placeAndAdvance(Button);

// ---- QuickAction
await sectionLabel('QuickAction', 'Gastei / Recebi — os dois botões grandes do Início (72 px).');
const qaVariants = [];
for (const [kind, bg, circle, ic, icColor, stroke, fg] of [
  ['Gastei', 'brand/accent', 'brand/primary', 'minus', HEX.white, null, 'text/on-accent'],
  ['Recebi', 'bg/card', 'status/income-bg', 'plus', HEX.green, 'border/default', 'text/primary'],
]) {
  const c = figma.createComponent();
  c.name = 'Kind=' + kind;
  c.layoutMode = 'HORIZONTAL';
  fixed(c, 171, 72);
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 10;
  bindRadius(c, 'radius/xl');
  c.fills = [paint(bg)];
  if (stroke) { c.strokes = [paint(stroke)]; c.strokeWeight = 1; }
  c.appendChild(iconBox('Ícone', ic, icColor, 36, circle, null, 20));
  c.appendChild(await txt(kind, 'Heading/H3', fg, 'Label'));
  qaVariants.push(c);
}
const QuickAction = figma.combineAsVariants(qaVariants, compPage);
QuickAction.name = 'QuickAction';
layoutVariants(QuickAction, 2, 16);
placeAndAdvance(QuickAction);

// ---- MonthPill
await sectionLabel('MonthPill', 'Setas andam um mês; tocar no nome abre o seletor de mês e ano.');
const MonthPill = figma.createComponent();
MonthPill.name = 'MonthPill';
MonthPill.layoutMode = 'HORIZONTAL';
MonthPill.resize(200, 44);
MonthPill.primaryAxisSizingMode = 'AUTO'; MonthPill.counterAxisSizingMode = 'FIXED';
MonthPill.counterAxisAlignItems = 'CENTER';
bindRadius(MonthPill, 'radius/full');
MonthPill.fills = [paint('bg/card')];
MonthPill.strokes = [paint('border/default')]; MonthPill.strokeWeight = 1;
MonthPill.appendChild(iconBox('Anterior', 'left', HEX.ink, 44, null, null, 20));
const mpLabel = AL('HORIZONTAL', { name: 'Mês', paddingLeft: 8, paddingRight: 8 });
mpLabel.appendChild(await txt('Novembro', 'Body/Small', 'text/primary', 'Label'));
MonthPill.appendChild(mpLabel);
MonthPill.appendChild(iconBox('Próximo', 'right', HEX.disabled, 44, null, null, 20));
const kMonth = MonthPill.addComponentProperty('Month', 'TEXT', 'Novembro');
mpLabel.children[0].componentPropertyReferences = { characters: kMonth };
placeAndAdvance(MonthPill);

// ---- TabBar
await sectionLabel('TabBar', 'Pílula flutuante, só ícones; o marcador verde desliza até a aba ativa (420 ms).');
const TABS = [['Início', 'home'], ['Lançamentos', 'list'], ['Metas', 'target'], ['Perfil', 'user']];
const tabVariants = [];
for (let a = 0; a < TABS.length; a++) {
  const c = figma.createComponent();
  c.name = 'Active=' + TABS[a][0];
  c.resize(366, 64);
  c.fills = [paint('bg/inverse')];
  bindRadius(c, 'radius/full');
  await applyEffectStyle(c, 'Shadow/Tabbar');
  const cell = (366 - 12) / 4;
  const marker = figma.createRectangle();
  marker.name = 'Marcador'; marker.resize(cell, 52); marker.x = 6 + a * cell; marker.y = 6;
  marker.cornerRadius = 26; marker.fills = [paint('brand/accent')];
  c.appendChild(marker);
  TABS.forEach(([label, ic], i) => {
    const n = icon(ic, i === a ? HEX.navy : HEX.inactive, 24, i === a ? 2.4 : 2);
    n.name = 'Aba/' + label;
    c.appendChild(n);
    n.x = 6 + i * cell + (cell - 24) / 2; n.y = 20;
  });
  tabVariants.push(c);
}
const TabBar = figma.combineAsVariants(tabVariants, compPage);
TabBar.name = 'TabBar';
TabBar.description = 'Barra de abas do celular, 12 px das bordas. Cada variante = aba ativa. Código: TabBar.tsx.';
layoutVariants(TabBar, 2);
placeAndAdvance(TabBar);

// ---- EntryRow
await sectionLabel('EntryRow', 'Gasto com ícone neutro, entrada em verde. A cor da categoria não entra na lista.');
const entryVariants = [];
for (const [type, ib, ic, icColor, amountVar, title, meta, amount] of [
  ['Expense', 'bg/subtle', 'cart', HEX.ink, 'text/primary', 'Mercado da semana', 'Mercado', '− R$ 84,00'],
  ['Income', 'status/income-bg', 'pen', HEX.green, 'text/income', 'Freela site', 'Freela · todo mês', '+ R$ 600,00'],
]) {
  const c = figma.createComponent();
  c.name = 'Type=' + type;
  c.layoutMode = 'HORIZONTAL';
  fixed(c, 310, 68);
  c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 12;
  c.fills = [];
  c.appendChild(iconBox('Ícone', ic, icColor, 44, ib, 'radius/md', 20));
  const t = AL('VERTICAL', { name: 'Texto', itemSpacing: 2 });
  c.appendChild(t); fillWidth(t);
  t.appendChild(await txt(title, 'Body/Small', 'text/primary', 'Title'));
  t.appendChild(await txt(meta, 'Caption/Default', 'text/secondary', 'Meta'));
  c.appendChild(await txt(amount, 'Body/Small', amountVar, 'Amount'));
  entryVariants.push(c);
}
const EntryRow = figma.combineAsVariants(entryVariants, compPage);
EntryRow.name = 'EntryRow';
linkText(EntryRow, 'Title', 'Mercado da semana', 'Title');
linkText(EntryRow, 'Meta', 'Mercado', 'Meta');
linkText(EntryRow, 'Amount', '− R$ 84,00', 'Amount');
layoutVariants(EntryRow, 1, 0, 16);
placeAndAdvance(EntryRow);

// ---- AlertNotice
await sectionLabel('AlertNotice', 'Alerta acionável na escala Tertiary.');
const AlertNotice = figma.createComponent();
AlertNotice.name = 'AlertNotice';
AlertNotice.layoutMode = 'HORIZONTAL';
AlertNotice.resize(350, 72);
AlertNotice.primaryAxisSizingMode = 'FIXED'; AlertNotice.counterAxisSizingMode = 'AUTO';
AlertNotice.counterAxisAlignItems = 'CENTER'; AlertNotice.itemSpacing = 12;
bindPadding(AlertNotice, 4, 3); bindRadius(AlertNotice, 'radius/xl');
AlertNotice.fills = [paint('status/alert-bg')];
AlertNotice.appendChild(iconBox('Ícone', 'alert', HEX.alert, 44, 'bg/card', null, 22));
const anText = AL('VERTICAL', { name: 'Texto', itemSpacing: 2 });
AlertNotice.appendChild(anText); fillWidth(anText);
anText.appendChild(await txt('2 contas vencidas', 'Body/Strong', 'text/primary', 'Title'));
anText.appendChild(await txt('Luz, Internet · R$ 310,00', 'Caption/Default', 'status/alert-text', 'Detail'));
AlertNotice.appendChild(await txt('Resolver ›', 'Body/Small', 'status/alert-text', 'Action'));
const kAT = AlertNotice.addComponentProperty('Title', 'TEXT', '2 contas vencidas');
const kAD = AlertNotice.addComponentProperty('Detail', 'TEXT', 'Luz, Internet · R$ 310,00');
AlertNotice.findOne((n) => n.name === 'Title').componentPropertyReferences = { characters: kAT };
AlertNotice.findOne((n) => n.name === 'Detail').componentPropertyReferences = { characters: kAD };
placeAndAdvance(AlertNotice);

// ---- BalanceCard
await sectionLabel('BalanceCard', '"Sobrou em <mês>" — a única pergunta do Início.');
const BalanceCard = figma.createComponent();
BalanceCard.name = 'BalanceCard';
BalanceCard.layoutMode = 'VERTICAL';
BalanceCard.resize(350, 100);
BalanceCard.primaryAxisSizingMode = 'AUTO'; BalanceCard.counterAxisSizingMode = 'FIXED';
BalanceCard.itemSpacing = 16;
bindPadding(BalanceCard, 6, 6); bindRadius(BalanceCard, 'radius/2xl');
BalanceCard.fills = [paint('bg/inverse')];
BalanceCard.appendChild(await txt('Sobrou em novembro', 'Body/Small', 'text/inverse-muted', 'Label'));
BalanceCard.appendChild(await txt('R$ 1.240,00', 'Display/Balance', 'text/inverse', 'Value'));
const track = figma.createFrame();
track.name = 'Barra'; track.resize(302, 10); track.cornerRadius = 5; track.fills = [paint('brand/primary-soft')];
const progress = figma.createRectangle();
progress.name = 'Progresso'; progress.resize(226, 10); progress.cornerRadius = 5; progress.fills = [paint('brand/accent')];
track.appendChild(progress);
BalanceCard.appendChild(track); fillWidth(track);
const bcFoot = AL('HORIZONTAL', { name: 'Rodapé', primaryAxisAlignItems: 'SPACE_BETWEEN' });
BalanceCard.appendChild(bcFoot); fillWidth(bcFoot);
bcFoot.appendChild(await txt('Gastou R$ 3.760,00', 'Caption/Default', 'text/inverse-muted', 'Spent'));
bcFoot.appendChild(await txt('Entrou R$ 5.000,00', 'Caption/Default', 'text/inverse-muted', 'Income'));
const kBL = BalanceCard.addComponentProperty('Label', 'TEXT', 'Sobrou em novembro');
const kBV = BalanceCard.addComponentProperty('Value', 'TEXT', 'R$ 1.240,00');
BalanceCard.findOne((n) => n.name === 'Label').componentPropertyReferences = { characters: kBL };
BalanceCard.findOne((n) => n.name === 'Value').componentPropertyReferences = { characters: kBV };
placeAndAdvance(BalanceCard);

// ---- CategoryTile / Chip / Switch
await sectionLabel('CategoryTile · Chip · Switch', 'Peças do lançamento rápido.');
const ctVariants = [];
for (const state of ['Default', 'Selected']) {
  const c = figma.createComponent();
  c.name = 'State=' + state;
  c.layoutMode = 'VERTICAL';
  fixed(c, 78, 80);
  c.primaryAxisAlignItems = 'CENTER'; c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 6;
  bindRadius(c, 'radius/lg');
  c.fills = [paint(state === 'Selected' ? 'brand/accent' : 'bg/subtle')];
  if (state === 'Selected') { c.strokes = [paint('brand/primary')]; c.strokeWeight = 2; c.strokeAlign = 'INSIDE'; }
  const tileIcon = iconComps.cart.createInstance(); tileIcon.resize(22, 22);
  c.appendChild(tileIcon);
  c.appendChild(await txt('Mercado', 'Caption/Tiny', state === 'Selected' ? 'text/on-accent' : 'text/primary', 'Label'));
  ctVariants.push(c);
}
const CategoryTile = figma.combineAsVariants(ctVariants, compPage);
CategoryTile.name = 'CategoryTile';
linkText(CategoryTile, 'Label', 'Mercado');
linkIconSwap(CategoryTile, iconComps.cart);
layoutVariants(CategoryTile, 2, 12);
CategoryTile.x = 0; CategoryTile.y = cursorY;

const chipVariants = [];
for (const state of ['Default', 'Selected']) {
  const c = figma.createComponent();
  c.name = 'State=' + state;
  c.layoutMode = 'HORIZONTAL';
  c.resize(80, 44);
  c.primaryAxisSizingMode = 'AUTO'; c.counterAxisSizingMode = 'FIXED';
  c.counterAxisAlignItems = 'CENTER';
  bindPadding(c, 5, 1); bindRadius(c, 'radius/full');
  c.fills = [paint(state === 'Selected' ? 'brand/primary' : 'bg/card')];
  if (state === 'Default') { c.strokes = [paint('border/default')]; c.strokeWeight = 1; }
  c.appendChild(await txt('Hoje', 'Label/Default', state === 'Selected' ? 'text/inverse' : 'text/primary', 'Label'));
  chipVariants.push(c);
}
const Chip = figma.combineAsVariants(chipVariants, compPage);
Chip.name = 'Chip';
linkText(Chip, 'Label', 'Hoje');
layoutVariants(Chip, 2, 12);
Chip.x = CategoryTile.width + 48; Chip.y = cursorY;

const switchVariants = [];
for (const value of ['Off', 'On']) {
  const c = figma.createComponent();
  c.name = 'Value=' + value;
  c.resize(52, 30); c.cornerRadius = 15;
  c.fills = [paint(value === 'On' ? 'text/income' : 'border/default')];
  const knob = figma.createEllipse();
  knob.name = 'Botão'; knob.resize(24, 24); knob.y = 3; knob.x = value === 'On' ? 25 : 3;
  knob.fills = [paint('bg/card')];
  c.appendChild(knob);
  switchVariants.push(c);
}
const Switch = figma.combineAsVariants(switchVariants, compPage);
Switch.name = 'Switch';
layoutVariants(Switch, 2, 12);
Switch.x = CategoryTile.width + Chip.width + 96; Switch.y = cursorY;
cursorY += Math.max(CategoryTile.height, Chip.height, Switch.height) + 96;

// ---- DrawerItem
await sectionLabel('DrawerItem', 'Linha do menu lateral (☰). Ativo = fundo verde suave.');
const diVariants = [];
for (const state of ['Default', 'Active']) {
  const c = figma.createComponent();
  c.name = 'State=' + state;
  c.layoutMode = 'HORIZONTAL';
  fixed(c, 298, 64);
  c.counterAxisAlignItems = 'CENTER'; c.itemSpacing = 12; c.paddingLeft = 12; c.paddingRight = 12;
  bindRadius(c, 'radius/lg');
  c.fills = state === 'Active' ? [paint('brand/accent-soft')] : [];
  const diBox = fixed(AL('HORIZONTAL', { name: 'Ícone', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }), 44, 44);
  diBox.fills = [paint(state === 'Active' ? 'brand/accent' : 'bg/subtle')]; bindRadius(diBox, 'radius/md');
  const diIcon = iconComps.gauge.createInstance(); diIcon.resize(22, 22); diBox.appendChild(diIcon);
  c.appendChild(diBox);
  const t = AL('VERTICAL', { name: 'Texto', itemSpacing: 2 });
  c.appendChild(t);
  t.appendChild(await txt('Limites de gasto', 'Body/Strong', 'text/primary', 'Title'));
  t.appendChild(await txt('Quanto gastar por categoria', 'Caption/Default', 'text/secondary', 'Hint'));
  diVariants.push(c);
}
const DrawerItem = figma.combineAsVariants(diVariants, compPage);
DrawerItem.name = 'DrawerItem';
linkText(DrawerItem, 'Title', 'Limites de gasto', 'Title');
linkText(DrawerItem, 'Hint', 'Quanto gastar por categoria', 'Hint');
linkIconSwap(DrawerItem, iconComps.gauge);
layoutVariants(DrawerItem, 2, 16);
placeAndAdvance(DrawerItem);

// Variante de um conjunto pelo valor de uma propriedade (ex.: Variant=Primary)
function variant(set, value) {
  const v = set.children.find((c) => c.name.endsWith('=' + value));
  if (!v) throw new Error(set.name + ': variante ' + value + ' não existe');
  return v;
}
function setProps(instance, values) {
  const defs = instance.componentProperties;
  const out = {};
  for (const [short, value] of Object.entries(values)) {
    const key = Object.keys(defs).find((k) => k.split('#')[0] === short);
    if (key) out[key] = value;
  }
  instance.setProperties(out);
  return instance;
}

// ============================================== 3. telas
await figma.setCurrentPageAsync(pages['Telas']);
for (const n of [...pages['Telas'].children]) n.remove();
const screensPage = pages['Telas'];

function screen(name, x, y = 0, w = 390, h = 844) {
  const f = figma.createFrame();
  f.name = name; f.resize(w, h); f.x = x; f.y = y;
  f.fills = [paint('bg/page')];
  f.clipsContent = true;
  screensPage.appendChild(f);
  return f;
}
function contentColumn(parent, top = 8) {
  const c = AL('VERTICAL', { name: 'Conteúdo', itemSpacing: 16, paddingLeft: 20, paddingRight: 20, paddingTop: top, paddingBottom: 100 });
  c.resize(parent.width, 10);
  c.counterAxisSizingMode = 'FIXED';
  c.primaryAxisSizingMode = 'AUTO';
  parent.appendChild(c);
  c.x = 0; c.y = 0;
  return c;
}
async function card(parent, name, padX = 5, padY = 5) {
  const c = AL('VERTICAL', { name, itemSpacing: 12 });
  c.fills = [paint('bg/card')];
  bindPadding(c, padX, padY);
  bindRadius(c, 'radius/xl');
  parent.appendChild(c); fillWidth(c);
  return c;
}
function tabBar(parent, active) {
  const t = variant(TabBar, active).createInstance();
  parent.appendChild(t);
  t.x = 12; t.y = parent.height - 64 - 12;
  return t;
}
async function mobileBar(parent) {
  const bar = AL('HORIZONTAL', { name: 'Barra do topo', itemSpacing: 8, counterAxisAlignItems: 'CENTER' });
  const menu = iconBox('☰ Abrir menu', 'menu', HEX.ink, 44, null, null, 24);
  bar.appendChild(menu);
  const logo = iconBox('Logo', 'wallet', HEX.navy, 28, 'brand/accent', null, 16);
  logo.cornerRadius = 8;
  bar.appendChild(logo);
  bar.appendChild(await txt('Wallet', 'Heading/H3'));
  parent.appendChild(bar);
  return { bar, menu };
}
async function greeting(parent) {
  const row = AL('HORIZONTAL', { name: 'Saudação', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' });
  parent.appendChild(row); fillWidth(row);
  const hello = AL('VERTICAL', { name: 'Olá' });
  hello.appendChild(await txt('Boa tarde,', 'Body/Small', 'text/secondary'));
  hello.appendChild(await txt('Demo', 'Heading/H2'));
  row.appendChild(hello);
  row.appendChild(MonthPill.createInstance());
}
async function savingsCard(parent, goals) {
  const c = await card(parent, 'Seu dinheiro guardado');
  c.itemSpacing = 14;
  const head = AL('HORIZONTAL', { name: 'Título', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' });
  c.appendChild(head); fillWidth(head);
  const left = AL('HORIZONTAL', { name: 'Rótulo', itemSpacing: 8, counterAxisAlignItems: 'CENTER' });
  left.appendChild(icon('shield', HEX.ink, 20));
  left.appendChild(await txt('Seu dinheiro guardado', 'Body/Strong'));
  head.appendChild(left);
  head.appendChild(icon('chev', HEX.ink, 20));
  for (const [name, value, of, pct, colorVar] of goals) {
    const g = AL('VERTICAL', { name, itemSpacing: 6 });
    c.appendChild(g); fillWidth(g);
    const top = AL('HORIZONTAL', { name: 'Linha', primaryAxisAlignItems: 'SPACE_BETWEEN' });
    g.appendChild(top); fillWidth(top);
    top.appendChild(await txt(name, 'Label/Default'));
    top.appendChild(await txt(value, 'Body/Small'));
    const tr = figma.createFrame(); tr.name = 'Trilho'; tr.resize(300, 8); tr.cornerRadius = 4; tr.fills = [paint('bg/subtle')];
    const fl = figma.createRectangle(); fl.name = 'Progresso'; fl.resize(Math.max(6, 300 * pct), 8); fl.cornerRadius = 4; fl.fills = [paint(colorVar)];
    tr.appendChild(fl);
    g.appendChild(tr); fillWidth(tr);
    g.appendChild(await txt(of, 'Caption/Default', 'text/secondary'));
  }
  return c;
}
async function recentCard(parent) {
  const c = await card(parent, 'Últimos lançamentos', 5, 4);
  c.itemSpacing = 0;
  const head = AL('HORIZONTAL', { name: 'Título', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', paddingBottom: 4 });
  c.appendChild(head); fillWidth(head);
  head.appendChild(await txt('Últimos lançamentos', 'Heading/H3'));
  head.appendChild(await txt('Ver tudo', 'Label/Default'));
  for (const [type, title, meta, amount] of [
    ['Expense', 'Mercado da semana', 'Mercado', '− R$ 84,00'],
    ['Expense', 'Café da padaria', 'Alimentação', '− R$ 9,50'],
    ['Income', 'Freela site', 'Freela · todo mês', '+ R$ 600,00'],
  ]) {
    const r = setProps(variant(EntryRow, type).createInstance(), { Title: title, Meta: meta, Amount: amount });
    c.appendChild(r); fillWidth(r);
  }
  return c;
}

// ---- Início
const home = screen('Início', 0);
const homeCol = contentColumn(home);
const { menu: homeMenu } = await mobileBar(homeCol);
await greeting(homeCol);
const balance = BalanceCard.createInstance(); homeCol.appendChild(balance); fillWidth(balance);
const qaRow = AL('HORIZONTAL', { name: 'Gastei / Recebi', itemSpacing: 12 });
homeCol.appendChild(qaRow); fillWidth(qaRow);
const gastei = variant(QuickAction, 'Gastei').createInstance(); qaRow.appendChild(gastei); fillWidth(gastei);
const recebi = variant(QuickAction, 'Recebi').createInstance(); qaRow.appendChild(recebi); fillWidth(recebi);
const alert = AlertNotice.createInstance(); homeCol.appendChild(alert); fillWidth(alert);
await savingsCard(homeCol, [['Reserva de emergência', 'R$ 1.500,00', 'de R$ 30.000,00 · 5%', 0.05, 'brand/primary']]);
await recentCard(homeCol);
const homeTabs = tabBar(home, 'Início');

// ---- Lançar gasto
const add = screen('Lançar gasto', 470);
add.fills = [paint('bg/card')];
const addCol = AL('VERTICAL', { name: 'Conteúdo', itemSpacing: 20, paddingLeft: 20, paddingRight: 20, paddingTop: 24, paddingBottom: 28 });
add.appendChild(addCol); fixed(addCol, 390, 844); addCol.x = 0; addCol.y = 0;
const top = AL('HORIZONTAL', { name: 'Topo', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' });
addCol.appendChild(top); fillWidth(top);
const closeBtn = iconBox('Fechar', 'x', HEX.ink, 44, 'bg/subtle', null, 20);
top.appendChild(closeBtn);
const toggle = AL('HORIZONTAL', { name: 'Gastei | Recebi', paddingLeft: 4, paddingRight: 4, paddingTop: 4, paddingBottom: 4 });
toggle.fills = [paint('bg/subtle')]; bindRadius(toggle, 'radius/full');
for (const [label, on] of [['Gastei', true], ['Recebi', false]]) {
  const seg = fixed(AL('HORIZONTAL', { name: label, primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }), 104, 36);
  seg.cornerRadius = 18; seg.fills = on ? [paint('bg/card')] : [];
  seg.appendChild(await txt(label, 'Body/Strong', on ? 'text/primary' : 'text/secondary'));
  toggle.appendChild(seg);
}
top.appendChild(toggle);
const spacerTop = figma.createFrame(); spacerTop.name = 'Espaço'; spacerTop.resize(44, 44); spacerTop.fills = []; top.appendChild(spacerTop);
const amountBlock = AL('VERTICAL', { name: 'Valor', itemSpacing: 4, counterAxisAlignItems: 'CENTER' });
addCol.appendChild(amountBlock); fillWidth(amountBlock);
amountBlock.appendChild(await txt('Quanto você gastou?', 'Label/Default', 'text/secondary'));
const amountRow = AL('HORIZONTAL', { name: 'R$', itemSpacing: 8, counterAxisAlignItems: 'BASELINE' });
amountRow.appendChild(await txt('R$', 'Heading/H2', 'text/secondary'));
amountRow.appendChild(await txt('84,00', 'Display/Amount'));
amountBlock.appendChild(amountRow);
const descField = AL('VERTICAL', { name: 'Com o quê?', itemSpacing: 8 });
addCol.appendChild(descField); fillWidth(descField);
descField.appendChild(await txt('Com o quê? (opcional)', 'Label/Default', 'text/secondary'));
const input = AL('HORIZONTAL', { name: 'Campo', paddingLeft: 16, paddingRight: 16, counterAxisAlignItems: 'CENTER' });
input.fills = [paint('bg/card')]; input.strokes = [paint('border/default')]; input.strokeWeight = 1; bindRadius(input, 'radius/lg');
descField.appendChild(input); input.resize(350, 54); input.counterAxisSizingMode = 'FIXED'; fillWidth(input);
input.appendChild(await txt('Mercado da semana', 'Body/Regular'));
const catBlock = AL('VERTICAL', { name: 'Categoria', itemSpacing: 10 });
addCol.appendChild(catBlock); fillWidth(catBlock);
catBlock.appendChild(await txt('Categoria', 'Label/Default', 'text/secondary'));
const catGrid = AL('HORIZONTAL', { name: 'Grade', itemSpacing: 10, layoutWrap: 'WRAP', counterAxisSpacing: 10 });
catBlock.appendChild(catGrid); fillWidth(catGrid);
for (const [label, ic, selected] of [['Mercado', 'cart', true], ['Casa', 'home2'], ['Comida', 'food'], ['Transporte', 'bus'], ['Contas', 'bolt'], ['Saúde', 'heart'], ['Lazer', 'film'], ['Outros', 'dots']]) {
  const tile = setProps(variant(CategoryTile, selected ? 'Selected' : 'Default').createInstance(), { Label: label, Icon: iconComps[ic].id });
  catGrid.appendChild(tile);
}
const chipRow = AL('HORIZONTAL', { name: 'Quando foi', itemSpacing: 8 });
addCol.appendChild(chipRow);
for (const [label, sel] of [['Hoje', true], ['Ontem', false], ['Outra data', false]]) {
  chipRow.appendChild(setProps(variant(Chip, sel ? 'Selected' : 'Default').createInstance(), { Label: label }));
}
const repeatRow = AL('HORIZONTAL', { name: 'Repete todo mês', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER', paddingLeft: 16, paddingRight: 16, paddingTop: 12, paddingBottom: 12 });
repeatRow.fills = [paint('bg/subtle')]; bindRadius(repeatRow, 'radius/lg');
addCol.appendChild(repeatRow); fillWidth(repeatRow);
const repText = AL('VERTICAL', { name: 'Texto' });
repText.appendChild(await txt('Repete todo mês', 'Body/Strong'));
repText.appendChild(await txt('Ex.: aluguel, academia, internet', 'Caption/Default', 'text/secondary'));
repeatRow.appendChild(repText);
repeatRow.appendChild(variant(Switch, 'Off').createInstance());
const grow = figma.createFrame(); grow.name = 'Espaço'; grow.fills = []; grow.resize(10, 10);
addCol.appendChild(grow); grow.layoutGrow = 1;
const save = setProps(variant(Button, 'Primary').createInstance(), { Label: 'Salvar gasto' });
addCol.appendChild(save);
save.resize(350, 60);
fillWidth(save);

// ---- Metas
const goals = screen('Metas', 940);
const goalsCol = contentColumn(goals, 24);
const gHead = AL('HORIZONTAL', { name: 'Cabeçalho', primaryAxisAlignItems: 'SPACE_BETWEEN', counterAxisAlignItems: 'CENTER' });
goalsCol.appendChild(gHead); fillWidth(gHead);
gHead.appendChild(await txt('Metas', 'Heading/H1'));
gHead.appendChild(setProps(variant(Button, 'Primary').createInstance(), { Label: '+ Nova meta' }));
goalsCol.appendChild(await txt('Guardado nas metas: R$ 3.800,00', 'Label/Default', 'text/secondary'));
const reserve = AL('VERTICAL', { name: 'Reserva de emergência', itemSpacing: 12 });
reserve.fills = [paint('brand/accent')]; bindPadding(reserve, 6, 6); bindRadius(reserve, 'radius/2xl');
goalsCol.appendChild(reserve); fillWidth(reserve);
const rHead = AL('HORIZONTAL', { name: 'Título', itemSpacing: 12, counterAxisAlignItems: 'CENTER' });
rHead.appendChild(iconBox('Ícone', 'shield', '#00C853', 44, 'brand/primary', null, 22));
rHead.appendChild(await txt('Reserva de emergência', 'Heading/H3', 'text/on-accent'));
reserve.appendChild(rHead);
reserve.appendChild(await txt('R$ 1.500,00', 'Display/Balance', 'text/on-accent'));
reserve.appendChild(await txt('de R$ 30.000,00 · faltam R$ 28.500,00', 'Label/Default', 'text/on-accent'));
const rBtn = setProps(variant(Button, 'Primary').createInstance(), { Label: 'Guardar ou resgatar' });
reserve.appendChild(rBtn); fillWidth(rBtn);
for (const [name, ic, meta, pct, value, toneVar, softVar] of [
  ['Viagem pro Chile', 'plane', 'Até julho 2027 · guarde R$ 600,00/mês', 0.4, 'R$ 3.200,00 de R$ 8.000,00', 'brand/primary', 'bg/subtle'],
  ['Celular novo', 'pen', 'Até março 2027 · guarde R$ 850,00/mês', 0.15, 'R$ 600,00 de R$ 4.000,00', 'status/alert', 'status/alert-bg'],
]) {
  const c = await card(goalsCol, name);
  const head = AL('HORIZONTAL', { name: 'Topo', itemSpacing: 12, counterAxisAlignItems: 'CENTER' });
  c.appendChild(head); fillWidth(head);
  head.appendChild(iconBox('Ícone', ic, toneVar === 'status/alert' ? HEX.alert : HEX.navy, 48, softVar, 'radius/md', 22));
  const ht = AL('VERTICAL', { name: 'Texto', itemSpacing: 2 }); head.appendChild(ht); fillWidth(ht);
  ht.appendChild(await txt(name, 'Body/Strong'));
  ht.appendChild(await txt(meta, 'Caption/Default', 'text/secondary'));
  head.appendChild(await txt(Math.round(pct * 100) + '%', 'Heading/H3'));
  const tr = figma.createFrame(); tr.name = 'Trilho'; tr.resize(310, 10); tr.cornerRadius = 5; tr.fills = [paint('bg/subtle')];
  const fl = figma.createRectangle(); fl.name = 'Progresso'; fl.resize(310 * pct, 10); fl.cornerRadius = 5; fl.fills = [paint(toneVar)];
  tr.appendChild(fl); c.appendChild(tr); fillWidth(tr);
  c.appendChild(await txt(value, 'Label/Default', 'text/secondary'));
  const b = setProps(variant(Button, 'Secondary').createInstance(), { Label: 'Guardar dinheiro' });
  c.appendChild(b); fillWidth(b);
}
const goalsTabs = tabBar(goals, 'Metas');

// ---- Menu lateral (Início por baixo + painel)
const drawerScreen = screen('Menu lateral', 1410);
const homeCopy = homeCol.clone();
drawerScreen.appendChild(homeCopy); homeCopy.x = 0; homeCopy.y = 0;
const homeTabsCopy = tabBar(drawerScreen, 'Início');
const overlay = figma.createRectangle();
overlay.name = 'Fundo escurecido'; overlay.resize(390, 844);
overlay.fills = [{ type: 'SOLID', color: { r: 0, g: 20 / 255, b: 60 / 255 }, opacity: 0.45 }];
drawerScreen.appendChild(overlay);
const panel = AL('VERTICAL', { name: 'Painel', itemSpacing: 20, paddingLeft: 16, paddingRight: 16, paddingTop: 24, paddingBottom: 20 });
panel.fills = [paint('bg/card')];
panel.topRightRadius = 28; panel.bottomRightRadius = 28;
await applyEffectStyle(panel, 'Shadow/Sheet');
drawerScreen.appendChild(panel); fixed(panel, 330, 844); panel.x = 0; panel.y = 0;
const who = AL('HORIZONTAL', { name: 'Usuário', itemSpacing: 12, counterAxisAlignItems: 'CENTER' });
panel.appendChild(who); fillWidth(who);
const avatar = fixed(AL('HORIZONTAL', { name: 'Avatar', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }), 52, 52);
avatar.cornerRadius = 26; avatar.fills = [paint('brand/primary')];
avatar.appendChild(await txt('D', 'Heading/H2', 'text/inverse'));
who.appendChild(avatar);
const whoText = AL('VERTICAL', { name: 'Nome' }); who.appendChild(whoText); fillWidth(whoText);
whoText.appendChild(await txt('Demo', 'Heading/H3'));
whoText.appendChild(await txt('demo@wallet.com', 'Caption/Default', 'text/secondary'));
const drawerClose = iconBox('Fechar menu', 'x', HEX.ink, 44, 'bg/subtle', null, 20);
who.appendChild(drawerClose);
const navList = AL('VERTICAL', { name: 'Ajustes', itemSpacing: 4 });
panel.appendChild(navList); fillWidth(navList);
for (const [title, hint, ic] of [['Limites de gasto', 'Quanto gastar por categoria', 'gauge'], ['Categorias', 'Organize seus lançamentos', 'tag'], ['Reserva de emergência', 'Dinheiro para imprevistos', 'shield']]) {
  const item = setProps(variant(DrawerItem, 'Default').createInstance(), { Title: title, Hint: hint, Icon: iconComps[ic].id });
  navList.appendChild(item); fillWidth(item);
}
const install = AL('HORIZONTAL', { name: 'Instalar o app', itemSpacing: 16, counterAxisAlignItems: 'CENTER', paddingLeft: 20, paddingRight: 20, paddingTop: 12, paddingBottom: 12 });
install.fills = [paint('brand/accent')]; bindRadius(install, 'radius/xl');
panel.appendChild(install); fillWidth(install);
install.appendChild(iconBox('Ícone', 'download', '#00C853', 44, 'brand/primary', 'radius/md', 22));
const instText = AL('VERTICAL', { name: 'Texto' }); install.appendChild(instText);
instText.appendChild(await txt('Instalar o app', 'Body/Strong', 'text/on-accent'));
instText.appendChild(await txt('Abra o Wallet direto da tela inicial', 'Caption/Default', 'text/on-accent'));
const dGrow = figma.createFrame(); dGrow.name = 'Espaço'; dGrow.fills = []; dGrow.resize(10, 10);
panel.appendChild(dGrow); dGrow.layoutGrow = 1;
const logout = setProps(variant(Button, 'Danger').createInstance(), { Label: 'Sair da conta' });
panel.appendChild(logout); fillWidth(logout);

// ---- Início (desktop)
const desk = screen('Início (desktop)', 0, 1000, 1440, 900);
const deskCol = AL('VERTICAL', { name: 'Página', itemSpacing: 0 });
desk.appendChild(deskCol); fixed(deskCol, 1440, 900); deskCol.x = 0; deskCol.y = 0;
const nav = AL('HORIZONTAL', { name: 'Topo', itemSpacing: 28, counterAxisAlignItems: 'CENTER', paddingLeft: 160, paddingRight: 160, paddingTop: 14, paddingBottom: 14 });
nav.fills = [paint('bg/card')]; nav.strokes = [paint('border/subtle')]; nav.strokeBottomWeight = 1; nav.strokeTopWeight = 0; nav.strokeLeftWeight = 0; nav.strokeRightWeight = 0;
deskCol.appendChild(nav); fillWidth(nav);
const brandMark = AL('HORIZONTAL', { name: 'Marca', itemSpacing: 8, counterAxisAlignItems: 'CENTER' });
const dlogo = iconBox('Logo', 'wallet', HEX.navy, 32, 'brand/accent', null, 18); dlogo.cornerRadius = 10;
brandMark.appendChild(dlogo); brandMark.appendChild(await txt('Wallet', 'Heading/H3'));
nav.appendChild(brandMark);
const links = AL('HORIZONTAL', { name: 'Navegação', itemSpacing: 4 }); nav.appendChild(links); fillWidth(links);
for (const [label, on] of [['Início', true], ['Lançamentos', false], ['Metas', false]]) {
  const l = AL('HORIZONTAL', { name: label, paddingLeft: 20, paddingRight: 20, counterAxisAlignItems: 'CENTER' });
  l.resize(100, 44); l.counterAxisSizingMode = 'FIXED'; l.primaryAxisSizingMode = 'AUTO'; l.cornerRadius = 22;
  l.fills = on ? [paint('brand/primary')] : [];
  l.appendChild(await txt(label, 'Body/Small', on ? 'text/inverse' : 'text/secondary'));
  links.appendChild(l);
}
const dAvatar = fixed(AL('HORIZONTAL', { name: 'Perfil', primaryAxisAlignItems: 'CENTER', counterAxisAlignItems: 'CENTER' }), 44, 44);
dAvatar.cornerRadius = 22; dAvatar.fills = [paint('brand/primary')];
dAvatar.appendChild(await txt('D', 'Body/Strong', 'text/inverse'));
nav.appendChild(dAvatar);
const main = AL('VERTICAL', { name: 'Conteúdo', itemSpacing: 24, paddingLeft: 160, paddingRight: 160, paddingTop: 32, paddingBottom: 48 });
deskCol.appendChild(main); fillWidth(main);
await greeting(main);
const cols = AL('HORIZONTAL', { name: 'Colunas', itemSpacing: 24 });
main.appendChild(cols); fillWidth(cols);
const leftCol = AL('VERTICAL', { name: 'Esquerda', itemSpacing: 16 }); cols.appendChild(leftCol); leftCol.resize(500, 10); leftCol.counterAxisSizingMode = 'FIXED'; leftCol.primaryAxisSizingMode = 'AUTO';
const rightCol = AL('VERTICAL', { name: 'Direita', itemSpacing: 16 }); cols.appendChild(rightCol); fillWidth(rightCol);
const dBal = BalanceCard.createInstance(); leftCol.appendChild(dBal); fillWidth(dBal);
const dQa = AL('HORIZONTAL', { name: 'Gastei / Recebi', itemSpacing: 12 }); leftCol.appendChild(dQa); fillWidth(dQa);
for (const k of ['Gastei', 'Recebi']) { const i = variant(QuickAction, k).createInstance(); dQa.appendChild(i); fillWidth(i); }
const dAlert = AlertNotice.createInstance(); leftCol.appendChild(dAlert); fillWidth(dAlert);
await savingsCard(leftCol, [
  ['Reserva de emergência', 'R$ 1.500,00', 'de R$ 30.000,00 · 5%', 0.05, 'brand/primary'],
  ['Viagem pro Chile', 'R$ 3.200,00', 'de R$ 8.000,00 · 40%', 0.4, 'brand/primary'],
]);
const where = await card(rightCol, 'Para onde foi o dinheiro');
where.appendChild(await txt('Para onde foi o dinheiro', 'Heading/H3'));
for (const [name, value, pct] of [['Casa', 'R$ 1.800,00', 1], ['Mercado', 'R$ 900,00', 0.5], ['Transporte', 'R$ 450,00', 0.25], ['Outros', 'R$ 610,00', 0.34]]) {
  const r = AL('HORIZONTAL', { name, itemSpacing: 12, counterAxisAlignItems: 'CENTER' });
  where.appendChild(r); fillWidth(r);
  const n = await txt(name, 'Label/Default'); r.appendChild(n); n.resize(120, n.height); n.textAutoResize = 'HEIGHT';
  const tr = figma.createFrame(); tr.name = 'Trilho'; tr.resize(400, 12); tr.cornerRadius = 6; tr.fills = [paint('bg/subtle')];
  const fl = figma.createRectangle(); fl.name = 'Barra'; fl.resize(400 * pct, 12); fl.cornerRadius = 6; fl.fills = [paint('brand/primary')];
  tr.appendChild(fl); r.appendChild(tr); fillWidth(tr);
  r.appendChild(await txt(value, 'Body/Small'));
}
await recentCard(rightCol);

// ============================================== 4. protótipo
function go(destination, transitionType = 'SMART_ANIMATE') {
  return [{
    trigger: { type: 'ON_CLICK' },
    actions: [{
      type: 'NODE', destinationId: destination.id, navigation: 'NAVIGATE',
      transition: transitionType === 'MOVE_IN'
        ? { type: 'MOVE_IN', direction: 'LEFT', matchLayers: false, easing: { type: 'EASE_OUT' }, duration: 0.3 }
        : { type: transitionType, easing: { type: 'EASE_OUT' }, duration: 0.3 },
      preserveScrollPosition: false,
    }],
  }];
}
/** Área de toque transparente por cima das abas da TabBar (instâncias não deixam ligar cada ícone). */
function tabHotspot(screenFrame, tabIndex, destination, label) {
  const cell = (366 - 12) / 4;
  const h = figma.createFrame();
  h.name = 'Toque · ' + label; h.fills = [];
  h.resize(cell, 52);
  screenFrame.appendChild(h);
  h.x = 12 + 6 + tabIndex * cell; h.y = screenFrame.height - 64 - 12 + 6;
  return h;
}
await setReactions(gastei, go(add, 'MOVE_IN'));
await setReactions(recebi, go(add, 'MOVE_IN'));
await setReactions(closeBtn, go(home, 'DISSOLVE'));
await setReactions(save, go(home, 'DISSOLVE'));
await setReactions(homeMenu, go(drawerScreen, 'DISSOLVE'));
await setReactions(drawerClose, go(home, 'DISSOLVE'));
await setReactions(overlay, go(home, 'DISSOLVE'));
await setReactions(tabHotspot(home, 2, goals, 'Metas'), go(goals));
await setReactions(tabHotspot(goals, 0, home, 'Início'), go(home));
screensPage.flowStartingPoints = [{ nodeId: home.id, name: 'Wallet — celular' }];

const summary = {
  componentes: [Button, QuickAction, MonthPill, TabBar, EntryRow, AlertNotice, BalanceCard, CategoryTile, Chip, Switch, DrawerItem].map((c) => c.name),
  telas: screensPage.children.filter((n) => n.type === 'FRAME').map((n) => n.name),
};
const message = 'Wallet: ' + summary.componentes.length + ' componentes e ' + summary.telas.length + ' telas criados.';
try { figma.notify(message); } catch (e) { /* Scripter sem notify */ }
if (typeof print === 'function') print(summary); else console.log(summary);
