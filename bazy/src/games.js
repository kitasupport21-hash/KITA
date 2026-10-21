export const COLORS=['RED','BLUE','GREEN','YELLOW','PURPLE','ORANGE'];
export const EMOJIS=['🍎','🐶','🌟','🚀','🦄','🍉','🐸','🎈','🍕','🐼','🌈','⚽'];
export function levelConfig(level){return {time:Math.max(5,18-Math.floor(level/10)),speed:1+level*.035,size:Math.min(12,4+Math.floor(level/15)),targets:Math.min(12,3+Math.floor(level/10)),pairs:Math.min(8,3+Math.floor(level/15))}}
export function makeMath(level){const max=10+level*2;const a=1+Math.floor(Math.random()*max),b=1+Math.floor(Math.random()*max);return {text:`${a} + ${b}`,answer:a+b}}
