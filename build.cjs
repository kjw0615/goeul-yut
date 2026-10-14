const fs=require('node:fs'),path=require('node:path');
process.chdir(__dirname);
const api=(process.env.GOEUL_API_BASE||'').trim().replace(/\/$/,'');
if(api){const url=new URL(api);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash||url.pathname!=='/')throw Error('GOEUL_API_BASE에는 게임 서버의 공개 Origin만 입력하세요.');if(process.env.VERCEL&&url.protocol!=='https:')throw Error('Vercel에서는 HTTPS 게임 서버가 필요합니다.');}
else if(process.env.VERCEL)throw Error('Vercel의 GOEUL_API_BASE 환경변수에 별도 HTTPS 게임 서버 주소를 지정하세요.');
require('./validate.cjs');
fs.writeFileSync(path.join(__dirname,'dist/config.js'),'// Public game-server origin; never put credentials here.\nwindow.GOEUL_API_BASE = '+JSON.stringify(api)+';\n');
console.log('배포 설정 준비 완료: '+(api||'현재 주소의 게임 서버 사용'));
