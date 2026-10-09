window.YK_DATA=(()=>{
const outfits={
 normal:{name:"花守り装束",body:"#f0e1cf",trim:"#c13e67",skirt:"#7a294f"}
 // The stardust design is withheld from public builds; artwork retained outside runtime listings.
};
const areas={
 field:{name:"花霞野",ground:"#88a857",path:"#d6bf8a",water:"#4f93a8",encounter:.045,min:14,grace:9},
 village:{name:"鬼灯の里",ground:"#8ca25d",path:"#c9ad78",water:"#5599aa",encounter:0,min:99,grace:0},
 teahouse:{name:"花見茶屋",ground:"#6b4932",path:"#b78a58",water:"#5599aa",encounter:0,min:9999,grace:0},
 osumiHome:{name:"お澄の家",ground:"#6b4932",path:"#b78a58",water:"#5599aa",encounter:0,min:9999,grace:0},
 villageRoom:{name:"里の建物",ground:"#6b4932",encounter:0,min:9999,grace:0},
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
 "野の小鬼":{atlas:0,fallback:"redoni",style:"bruiser",scale:1.04,attack:"角突進",fx:"impact",variance:3,yOffset:14,shadowScale:.82,shadowYOffset:10},
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
 "野の小鬼":{id:"oni",name:"紅角の鬼女",variantAtlas:0},
 "化け狸":{id:"tanuki",name:"葉隠れ狸女",variantAtlas:1,hpMultiplier:1.35,atkMultiplier:1.15,trait:"leafDodge",traitChance:.22},
 "灯火狐":{id:"lantern",name:"灯籠の狐女",variantAtlas:2,hpMultiplier:1.35,atkMultiplier:1.2,trait:"foxfire",traitChance:.28},
 "磯妖":{id:"shell",name:"磯貝の妖女",variantAtlas:3,hpMultiplier:1.35,atkMultiplier:1.15,trait:"shellGuard",traitChance:.25},
 "泡くらげ":{id:"jelly",name:"泡衣の海月女",variantAtlas:4},
 "木霊":{id:"tree",name:"若葉の木霊女",variantAtlas:5},
 "迷い蜘蛛":{id:"spider",name:"糸織り蜘蛛女",variantAtlas:6},
 "水蛇":{id:"snake",name:"水鏡の蛇女",variantAtlas:7},
 "滝童":{id:"falls",name:"滝守りの妖女",variantAtlas:8},
 "妖狐":{id:"fox",name:"宵火の狐女"},
 "影九尾":{id:"ninefox",name:"朧九尾の妖女",variantAtlas:9}
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
// Chapter 1: 花の声が消える里. Keep stage indices, speakers and targets stable for old saves.
const story=[
 {area:"village",speaker:"里長",target:"shrine",objective:"鬼灯の里で鳴らなくなった鈴の謎を聞く",lines:["緋月、今朝から里の鈴が鳴らんのじゃ。昨日まであった道のことさえ、誰も覚えておらん。","お澄は『見知らぬ地蔵に挨拶した』と言うが、あの地蔵は昔からあったはず……。","古い約束を記した結び札を預ける。天妖の社の白妙なら、何か分かるかもしれん。","緋月『鈴が鳴らないだけなら直せばいいと思ったけど……みんなの記憶まで変なのね。分かった、行ってくる！』"],unlock:"結び札を託された。湖を左に見て北の草原へ。天妖の社で白妙を探そう。"},
 {area:"shrine",speaker:"白妙",target:"cove",objective:"天妖の社で結び札の秘密を尋ねる",lines:["白妙『この札の糸が、一本だけ途切れています。誰かとの縁を忘れたときに現れる印です。』","白妙『かつて争いを鎮めた花契りは、憎しみだけでなく、大切な約束まで忘れさせたと伝わります。』","緋月『大切なものを忘れて平和になるなんて、変な話ね。』","白妙『答えはまだ分かりません。海の入り江で、潮平という漁師が光る花びらを見つけたそうです。』"],unlock:"結び札が淡く光った。川沿いの道を進み、海の入り江へ向かおう。"},
 {area:"cove",speaker:"漁師・潮平",target:"forest",objective:"海の入り江で潮花の花びらを受け取る",lines:["潮平『昨夜の潮は妙だった。波が引いたあと、見たこともない花がひとひら残っていてな。』","潮平『これを見ると、昔ここで誰かを待っていた気がする。誰だったかは思い出せないが……。』","緋月『そんな寂しい顔しないでよ。きっと思い出せるって！』","潮平『持っていきな。忘れの森の方へ光が伸びている。俺はここで、帰る人を待つよ。』"],unlock:"潮花の花びらを受け取った。浜から北東の忘れの森へ向かおう。",petal:true},
 {area:"forest",speaker:"旅の薬師",target:"waterfall",objective:"忘れの森で記憶の花の手がかりを得る",lines:["旅の薬師『この森の木々は、人が忘れた言葉を代わりに覚えているんです。耳を澄ますと聞こえるでしょう。』","緋月『……『忘れても、迎えに行く』？ 誰の声だろう。』","旅の薬師『花びらに宿った記憶でしょう。龍神の滝の水鏡に映せば、その景色が見えるはずです。』","旅の薬師『ただし、思い出せば必ず幸せになるとは限りません。それでも進みますか？』","緋月『うん。知らないまま誰かを置いていくのは、もっと嫌だから。』"],unlock:"潮花の光が北へ向いた。龍神の滝の水鏡を訪ねよう。"},
 {area:"waterfall",speaker:"滝童",target:"fox",objective:"龍神の滝で花びらを水鏡に映す",lines:["滝童『お姉ちゃん、花びらを水にかざして！ 水鏡は、忘れられた景色を映すんだ。』","水面に、九本の尾を持つ白い影と、手を取り合う二人の姿が揺れた。","緋月『この景色……知らないはずなのに、胸が苦しい。』","滝童『西の九尾の祠へ行けば、白狐の使いに会えるよ。だけど、見えたものが全部、本当とは限らないんだ。』"],unlock:"水鏡が九尾の祠を示した。西へ向かおう。途中の月見の湯で休むこともできる。"},
 {area:"fox",speaker:"白狐の使い",target:null,objective:"九尾の祠で忘れた約束の真相を聞く",lines:["白狐の使い『よく来たね、緋月。花契りは世界の憎しみを鎮めた。だが、消されたのは憎しみだけではない。』","白狐の使い『誰かの名も、帰る場所も、守ると誓った約束も……人々は忘れた。』","緋月『だったら思い出せばいい。全部取り戻して、もう一度やり直せば！』","白狐の使い『それができるなら、どれほどよかったか。……お前が忘れたのは誰かの名ではない。お前自身が交わした約束だ。』","緋月『わたしの……約束？』","白狐の使い『続きを知りたければ、海の向こうへ行くことだ。だが真実は、誰もが望む姿とは限らないよ。』"],unlock:"第1章『花の声が消える里』完。緋月の忘れた約束を探す旅は、新たな大陸へ続く。"}
];
const objectives=[...story.map(s=>s.objective),"手がかりを得た。各地を探索する（物語の続きは制作中）"];
const vegetables={radish:{name:'だいこん',hp:18,mp:0},carrot:{name:'にんじん',hp:12,mp:0},cucumber:{name:'きゅうり',hp:8,mp:2}};
return {vegetables,outfits,areas,enemies,enemyProfiles,objectives,story,rareKinds,relics,rareRules};
})();
