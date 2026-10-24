// Touch controls for the existing editor commands; map data and coordinates are unchanged.
(()=>{
'use strict';
const $=id=>document.getElementById(id),mode=$('mode'),zoom=$('zoom'),entrance=$('entranceSelect');
let ready=false,lastMode=null,pendingMode=null,currentGroup='edit',entrySignature='',lastSync='';
const button=(label,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=fn;b.disabled=true;return b;};
const controls=[],track=b=>{controls.push(b);return b;};
const groups={edit:[['place','置く'],['select','選ぶ'],['move','移動'],['copy','複製'],['pan','画面移動']],collision:[['block','通行不可'],['passage','通行可'],['clear','判定を消す'],['occupied','物体の占有']],entrance:[['marker','入口'],['approach','接近セル'],['spawn','出現点'],['exit','出口追加']]};
const names={edit:'配置操作',collision:'歩行判定',entrance:'出入口'};
const hints={place:'素材を選び、接地範囲の最下段・左端マスをタップ',select:'地図の物体や出口をタップして選択',move:'移動先の接地マスをタップ',copy:'複製先の接地マスをタップ',pan:'地図を指でなぞって画面を移動',block:'なぞったマスを通行不可にする',passage:'橋などの地形を通行可能にする（物体の占有は維持）',clear:'なぞったマスの地形判定を消す',occupied:'選択した物体の占有マスをタップで切替',marker:'入口を置くマスをタップ',approach:'入口に隣接する接近マスをタップ',spawn:'緋月の出現マスをタップ',exit:'地図の出口マスをタップ',walk:'行き先をタップ、または方向ボタンで歩く'};
const panel=document.createElement('div');panel.className='touch-tools';
const tabs=document.createElement('div');tabs.className='tool-tabs';tabs.setAttribute('role','group');tabs.setAttribute('aria-label','操作の種類');
const modeButtons=[],tabButtons={},sections={};
function showGroup(group){currentGroup=group;for(const g of Object.keys(groups)){sections[g].hidden=g!==group;tabButtons[g].setAttribute('aria-pressed',String(g===group));}}
function changeMode(value){pendingMode=null;const hasObject=!!$('selected').dataset.object;if((value==='move'||value==='copy')&&!hasObject){pendingMode=value;value='select';}mode.value=value;mode.dispatchEvent(new Event('change',{bubbles:true}));closeSheet();sync(ready);}
for(const group of Object.keys(groups)){
tabButtons[group]=track(button(names[group],()=>showGroup(group)));tabs.append(tabButtons[group]);
const section=document.createElement('div');section.className='mode-buttons';section.setAttribute('role','group');section.setAttribute('aria-label',names[group]);sections[group]=section;
for(const [value,label]of groups[group]){const b=track(button(label,()=>changeMode(value)));b.dataset.mode=value;modeButtons.push(b);section.append(b);}
}
panel.append(tabs,...Object.values(sections));mode.before(panel);mode.hidden=true;
const main=document.querySelector('main.work'),hint=document.createElement('p');hint.id='touchHint';hint.className='touch-hint';main.querySelector('.toolbar').after(hint);
const brief=document.createElement('p');brief.id='selectedBrief';brief.className='selected-brief';hint.after(brief);

// Zoom buttons replace the native select; its value still feeds the existing renderer.
const zoomControls=document.createElement('div');zoomControls.className='zoom-buttons';zoomControls.setAttribute('role','group');zoomControls.setAttribute('aria-label','表示倍率');
const zoomLabel=zoom.closest('label');zoomLabel.replaceWith(zoomControls);zoom.hidden=true;zoomControls.append(zoom);
const levels=[.25,.5,.75,1,1.5,2,3];
function setZoom(value){value=Math.min(3,Math.max(.1,value));if(![...zoom.options].some(o=>Number(o.value)===value)){const o=document.createElement('option');o.value=String(value);o.textContent=Math.round(value*100)+'%';zoom.append(o);}zoom.value=String(value);zoom.dispatchEvent(new Event('change',{bubbles:true}));sync(ready);}
const smaller=track(button('−',()=>{const z=Number(zoom.value);setZoom([...levels].reverse().find(v=>v<z-.001)||.1);}));smaller.setAttribute('aria-label','表示を縮小');
const actual=track(button('100%',()=>setZoom(1)));actual.setAttribute('aria-label','等倍に戻す');
const larger=track(button('＋',()=>{const z=Number(zoom.value);setZoom(levels.find(v=>v>z+.001)||3);}));larger.setAttribute('aria-label','表示を拡大');
const fit=track(button('全体',()=>setZoom(Math.floor(Math.min(3,($('viewport').clientWidth-24)/$('map').width)*100)/100)));
zoomControls.append(smaller,actual,larger,fit);

// Entrances remain explicit selectable records, now shown as buttons.
const entryList=document.createElement('div');entryList.id='entranceButtons';entryList.className='entrance-buttons';entryList.setAttribute('role','group');entryList.setAttribute('aria-label','入口・出口を選択');entrance.closest('label').after(entryList);entrance.closest('label').hidden=true;

// On phones the existing panels become sheets, keeping the map in view.
const palette=document.querySelector('.layout > aside:not(.right)'),right=document.querySelector('aside.right'),settings=right.firstElementChild,walk=right.lastElementChild,inspector=document.createElement('div'),divider=settings.querySelector('hr');
while(divider?.nextSibling)inspector.append(divider.nextSibling);divider?.remove();settings.after(inspector);
const sheets={palette,settings,inspector,walk};
function closeSheet() {document.body.dataset.panel='';for(const b of document.querySelectorAll('[data-open-sheet]'))b.setAttribute('aria-expanded','false');}
function openSheet(name){const next=document.body.dataset.panel===name?'':name;closeSheet();document.body.dataset.panel=next;for(const b of document.querySelectorAll('[data-open-sheet]'))b.setAttribute('aria-expanded',String(b.dataset.openSheet===next));}
for(const [name,node]of Object.entries(sheets)){node.dataset.sheet=name;node.id='sheet-'+name;node.classList.add('touch-sheet');const close=button('× 閉じる',closeSheet);close.disabled=false;close.className='sheet-close';node.prepend(close);}
const shade=button('パネルを閉じる',closeSheet);shade.disabled=false;shade.className='sheet-shade';shade.setAttribute('aria-label','パネルを閉じる');document.body.append(shade);
const dock=document.createElement('nav');dock.className='mobile-dock';dock.setAttribute('aria-label','編集パネル');
for(const [name,label]of [['palette','素材'],['inspector','選択中'],['settings','保存・設定'],['walk','歩行']]){const b=track(button(label,()=>openSheet(name)));b.dataset.openSheet=name;b.setAttribute('aria-controls','sheet-'+name);b.setAttribute('aria-expanded','false');dock.append(b);}
document.body.append(dock);document.addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet();});
// Existing palette handlers also change the mode. Close the palette after choosing.
$('palette').addEventListener('click',e=>{if(e.target.closest('button[data-asset]')){pendingMode=null;closeSheet();sync(ready);}});
function sync(enabled){const key=[enabled,mode.value,zoom.value,$('selected').dataset.object,$('selected').textContent,entrance.value,[...entrance.options].map(o=>o.value+o.textContent).join('|'),pendingMode].join('~');if(key===lastSync)return;lastSync=key;ready=enabled;for(const b of controls)b.disabled=!ready;
const value=mode.value;if(value!==lastMode){lastMode=value;const group=Object.keys(groups).find(g=>groups[g].some(v=>v[0]===value));if(group)showGroup(group);}
if(pendingMode&&$('selected').dataset.object){const next=pendingMode;pendingMode=null;mode.value=next;mode.dispatchEvent(new Event('change',{bubbles:true}));return;}
for(const b of modeButtons)b.setAttribute('aria-pressed',String(b.dataset.mode===mode.value));
hint.textContent=pendingMode?'まず'+(pendingMode==='move'?'移動':'複製')+'する物体をタップ':hints[mode.value]||'';
brief.textContent=$('selected').textContent.trim()!=='なし'?'選択中：'+$('selected').textContent.split('\n')[0]:'選択中の物体なし';actual.textContent=Math.round(Number(zoom.value)*100)+'%';
const signature=[...entrance.options].map(o=>o.value+':'+o.textContent).join('|');if(signature!==entrySignature){entrySignature=signature;entryList.replaceChildren();for(const option of entrance.options){const b=button(option.value?option.textContent:'選択解除',()=>{pendingMode=null;entrance.value=option.value;entrance.dispatchEvent(new Event('change',{bubbles:true}));});b.dataset.entrance=option.value;entryList.append(b);}}
for(const b of entryList.children){b.disabled=!ready;b.setAttribute('aria-pressed',String(b.dataset.entrance===entrance.value));}
}
globalThis.SMUI={sync};showGroup(currentGroup);sync(false);
})();
