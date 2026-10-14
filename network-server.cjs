const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {Lobby}=require('./multiplayer.cjs');
function createServer({lobby=new Lobby(),base=path.join(__dirname,'dist')}={}){
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.json':'application/json'};
const json=(res,status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
async function body(req){let text='';for await(const part of req){text+=part;if(text.length>16384)throw Object.assign(new Error('요청이 너무 큽니다.'),{status:413});}try{return text?JSON.parse(text):{};}catch{throw Object.assign(new Error('올바른 요청 형식이 아닙니다.'),{status:400});}}
const routes={create:'create',join:'join',quick:'quick',leave:'leave',edit:'edit',ready:'ready',ai:'ai','ai-edit':'aiEdit',kick:'kick',rematch:'rematch',logout:'logout',start:'start',action:'action'};
const server=http.createServer(async(req,res)=>{
 let p;try{p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{return json(res,400,{error:'주소가 잘못되었습니다.'});}
 if(p==='/health')return json(res,200,{game:'goeul-yut',version:12,multiplayer:true});
 if(p.startsWith('/api/')){
  const origin=req.headers.origin,allowed=!origin||origin==='http://'+req.headers.host||origin==='https://'+req.headers.host||(process.env.ALLOWED_ORIGINS||'').split(',').includes(origin);
  if(!allowed)return json(res,403,{error:'허용되지 않은 게임 주소입니다.'});
  if(origin){res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');}
  res.setHeader('Access-Control-Allow-Headers','Authorization,Content-Type');res.setHeader('Access-Control-Allow-Methods','GET,POST,OPTIONS');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  try{
   if(p==='/api/login'&&req.method==='POST'){if(lobby.users.size>=2000)throw Object.assign(new Error('접속자가 많습니다. 서버를 확인해주세요.'),{status:503});return json(res,200,lobby.login((await body(req)).nickname));}
   const u=lobby.user(String(req.headers.authorization||'').replace(/^Bearer /,''));
   if(p==='/api/state'&&req.method==='GET'){const revision=Number(new URL(req.url,'http://localhost').searchParams.get('revision'));return json(res,200,revision===lobby.revision?{unchanged:true,serverNow:Date.now()}:lobby.state(u));}
   const key=p.slice('/api/'.length);if(req.method!=='POST'||!routes[key])return json(res,404,{error:'없는 기능입니다.'});
   const result=lobby[routes[key]](u,await body(req));return json(res,200,{...result,...lobby.state(u)});
  }catch(error){return json(res,error.status||500,{error:error.status?error.message:'서버 처리 중 문제가 발생했습니다.'});}
 }
 const f=path.resolve(base,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(base+path.sep))return json(res,403,{error:'접근할 수 없습니다.'});
 fs.readFile(f,(error,data)=>{if(error){res.writeHead(404);res.end('Not found');}else{res.writeHead(200,{'Content-Type':mime[path.extname(f)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(data);}});
});
return server;
}
function start(){const lobby=new Lobby(),server=createServer({lobby}),port=Number(process.env.PORT||4173),host=process.env.HOST||'0.0.0.0';const timer=setInterval(()=>lobby.tick(),200);timer.unref();server.listen(port,host,()=>{console.log('Local: http://127.0.0.1:'+port);if(host==='0.0.0.0')for(const items of Object.values(os.networkInterfaces()))for(const ip of items||[])if(ip.family==='IPv4'&&!ip.internal)console.log('Network: http://'+ip.address+':'+port);});server.on('error',error=>{console.error(error.code==='EADDRINUSE'?'이미 서버가 실행 중입니다. 기존 서버를 종료한 뒤 다시 실행해주세요.':error.message);process.exitCode=1;});return server;}
module.exports={createServer,start};
