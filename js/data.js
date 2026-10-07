window.YK_DATA=(()=>{
const outfits={
 normal:{name:"花守り装束",body:"#f0e1cf",trim:"#c13e67",skirt:"#7a294f"},
 basewear:{name:"白の稽古着",body:"#ffffff",trim:"#c13e67",skirt:"#ffffff"},
 light:{name:"軽装・薄紅",body:"#f4b9c9",trim:"#fff0df",skirt:"#a34867"},
 white:{name:"水辺の白装束",body:"#f7f5ee",trim:"#71b7c5",skirt:"#dce8e7"},
 navy:{name:"水辺の藍装束",body:"#183b67",trim:"#f1d6a0",skirt:"#102844"},
 yukata:{name:"宵桜の浴衣",body:"#503567",trim:"#ef9fba",skirt:"#382347"},
 demon:{name:"小鬼の戯れ着",body:"#a43d59",trim:"#2b1636",skirt:"#51213b"}
};
const areas={
 field:{name:"花霞野",ground:"#88a857",path:"#d6bf8a",water:"#4f93a8",encounter:.045,min:14,grace:9},
 village:{name:"鬼灯の里",ground:"#8ca25d",path:"#c9ad78",water:"#5599aa",encounter:0,min:99,grace:0},
 teahouse:{name:"花見茶屋",ground:"#6b4932",path:"#b78a58",water:"#5599aa",encounter:0,min:9999,grace:0},
 osumiHome:{name:"お澄の家",ground:"#6b4932",path:"#b78a58",water:"#5599aa",encounter:0,min:9999,grace:0},
 shrine:{name:"天妖の社",ground:"#557f57",path:"#a79a72",water:"#467f90",encounter:.028,min:20,grace:12},
 cove:{name:"海の入り江",ground:"#c6b783",path:"#e0c996",water:"#3e8ea7",encounter:.035,min:17,grace:10},
 forest:{name:"忘れの森",ground:"#426d49",path:"#82795c",water:"#3f7882",encounter:.052,min:12,grace:10},
 waterfall:{name:"龍神の滝",ground:"#50765d",path:"#9d997c",water:"#4f9fb8",encounter:.04,min:15,grace:10},
 hotspring:{name:"月見の湯",ground:"#23383a",encounter:0,min:9999,grace:12},
fox:{name:"九尾の祠",ground:"#665f4f",path:"#9e8965",water:"#526f78",encounter:.048,min:14,grace:12}
};
const enemies={
 field:[["野の小鬼",42,8,10,8],["化け狸",48,9,12,9]],
 shrine:[["灯火狐",58,11,16,12]],
 cove:[["磯妖",62,12,18,13],["泡くらげ",54,10,15,11]],
 forest:[["木霊",70,13,22,15],["迷い蜘蛛",76,14,25,16]],
 waterfall:[["水蛇",86,16,30,20],["滝童",80,15,28,18]],
 fox:[["妖狐",98,18,38,25],["影九尾",120,20,48,32]]
};
const enemyProfiles={
 "野の小鬼":{atlas:0,fallback:"redoni",style:"bruiser",scale:1.04,attack:"角突進",fx:"impact",variance:3},
 "化け狸":{atlas:1,fallback:"crowtengu",style:"trickster",scale:.94,attack:"木の葉ばらまき",fx:"petals",variance:5},
 "灯火狐":{atlas:2,fallback:"ninefox",style:"caster",scale:.96,attack:"狐火",fx:"petals",variance:4},
 "磯妖":{atlas:3,fallback:"umibozu",style:"bruiser",scale:1.02,attack:"潮打ち",fx:"impact",variance:4},
 "泡くらげ":{atlas:4,fallback:"umibozu",style:"floater",scale:.90,attack:"泡まとい",fx:"petals",variance:5},
 "木霊":{atlas:5,fallback:"yokai_flower",style:"caster",scale:.94,attack:"木の葉散らし",fx:"petals",variance:4},
 "迷い蜘蛛":{atlas:6,fallback:"yokai_flower",style:"trickster",scale:.98,attack:"糸がらめ",fx:"impact",variance:5},
 "水蛇":{atlas:7,fallback:"umibozu",style:"bruiser",scale:1.00,attack:"水刃",fx:"impact",variance:4},
 "滝童":{atlas:8,fallback:"crowtengu",style:"caster",scale:.96,attack:"水柱",fx:"impact",variance:4},
 "妖狐":{fallback:"ninefox",style:"caster",scale:1.00,attack:"狐火連ね",fx:"petals",variance:4},
 "影九尾":{atlas:9,fallback:"ninefox",style:"boss",scale:1.08,attack:"影尾の一閃",fx:"impact",variance:3}
};
// Static artwork must exist for both states before a variant enters the encounter pool.
const rareKinds={
 "野の小鬼":{id:"oni",name:"紅角の鬼女",art:"oni-woman"},
 "化け狸":{id:"tanuki",name:"葉隠れ狸女",art:"tanuki-woman",hpMultiplier:1.35,atkMultiplier:1.15,trait:"leafDodge",traitChance:.22},
 "灯火狐":{id:"lantern",name:"灯籠の狐女",art:"lantern-woman",hpMultiplier:1.35,atkMultiplier:1.2,trait:"foxfire",traitChance:.28},
 "磯妖":{id:"shell",name:"磯貝の妖女",art:"shell-woman",hpMultiplier:1.35,atkMultiplier:1.15,trait:"shellGuard",traitChance:.25},
 "泡くらげ":{id:"jelly",name:"泡衣の海月女"},
 "木霊":{id:"tree",name:"若葉の木霊女"},
 "迷い蜘蛛":{id:"spider",name:"糸織り蜘蛛女"},
 "水蛇":{id:"snake",name:"水鏡の蛇女"},
 "滝童":{id:"falls",name:"滝守りの妖女"},
 "妖狐":{id:"fox",name:"宵火の狐女"},
 "影九尾":{id:"ninefox",name:"朧九尾の妖女"}
};
const relics={
 oni:{name:"鬼のパンツ♀",text:"虎柄の予備の旅装。攻撃力+2・守備力+2",atk:2,def:2},
 tanuki:{name:"狸女の葉守り",text:"葉隠れ狸女の髪飾り。守備力+1・薬草の回復+8",def:1,heal:8},
 lantern:{name:"狐女の灯芯",text:"灯籠の狐女が残す妖火の灯芯。花結びの威力+4",skill:4},
 shell:{name:"磯姫の貝飾り",text:"磯貝の妖女の真珠飾り。守備力+3",def:3},
 jelly:{name:"海月女の泡帯",text:"薬草の回復+12",heal:12},
 tree:{name:"木霊女の若葉櫛",text:"花結びの威力+2・薬草の回復+6",skill:2,heal:6},
 spider:{name:"蜘蛛女の糸巻き",text:"攻撃力+1・花結びの威力+3",atk:1,skill:3},
 snake:{name:"蛇女の水鱗",text:"守備力+2・花結びの威力+2",def:2,skill:2},
 falls:{name:"滝守りの水帯",text:"守備力+2・薬草の回復+6",def:2,heal:6},
 fox:{name:"狐女の火扇",text:"攻撃力+2・花結びの威力+2",atk:2,skill:2},
 ninefox:{name:"九尾女の影鈴",text:"攻撃力+2・守備力+1・花結びの威力+2",atk:2,def:1,skill:2}
};
const rareRules={chance:.10,goldMultiplier:1.25,breakHpRatio:.5,repeatDropChance:.25};
const story=[
 {area:"village",speaker:"里長",target:"shrine",objective:"鬼灯の里で里長の話を聞く",lines:["天妖の社の鈴が、昨夜から鳴らなくなった。","この里の結び札を持って、白妙を訪ねておくれ。"],unlock:"結び札を受け取った。湖を左に見て北の草原へ。山裾の天妖の社を訪ねよう。"},
 {area:"shrine",speaker:"白妙",target:"cove",objective:"天妖の社で白妙に結び札を見せる",lines:["この札は、ほどけた縁をたどる道しるべです。","まずは海の入り江へ。潮平さんが、光る花びらを見たそうです。"],unlock:"次は海の入り江。社の先の川沿いを進み、橋を渡ろう。"},
 {area:"cove",speaker:"漁師・潮平",target:"forest",objective:"入り江で潮平から花びらを受け取る",lines:["探していたのは、この潮花の花びらかい？","ほら、森の方へ光が伸びている。これなら迷わず進めそうだ。"],unlock:"潮花の花びらを入手。浜から北東の忘れの森へ。",petal:true},
 {area:"forest",speaker:"旅の薬師",target:"waterfall",objective:"忘れの森で旅の薬師を探す",lines:["その光は、水鏡に映せば記憶を見せてくれる。","龍神の滝へ向かいなさい。滝の前の子が案内してくれるはず。"],unlock:"森から海沿いの草原を北へ進み、龍神の滝を訪ねよう。"},
 {area:"waterfall",speaker:"滝童",target:"fox",objective:"龍神の滝で滝童と水鏡を調べる",lines:["花びらを水鏡へかざしてみて。……赤い葉と、九本の尾が映った！","九尾の祠が君を待っているよ。"],unlock:"次は西の九尾の祠へ。途中の温泉で休むのもよさそう。"},
 {area:"fox",speaker:"白狐の使い",target:null,objective:"九尾の祠で白狐の使いに会う",lines:["その花びらは、かつて交わされた約束の欠片。","続く旅の手がかりは、ここで預かっておこう。今は巡った土地を訪ねてみるといい。"],unlock:"約束の手がかりを得た。続きの物語は制作中です。"}
];
const objectives=[...story.map(s=>s.objective),"手がかりを得た。各地を探索する（物語の続きは制作中）"];
return {outfits,areas,enemies,enemyProfiles,objectives,story,rareKinds,relics,rareRules};
})();
