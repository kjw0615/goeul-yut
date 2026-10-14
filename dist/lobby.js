(function(){
const apiBase=(window.GOEUL_API_BASE||'').replace(/\/$/,'');
const net={data:null,revision:-1,pending:false,offset:0,token:sessionStorage.getItem('goeul-session')||'',renderKey:'',pollTimer:null,
 async request(path,body){const options={method:body===undefined?'GET':'POST',headers:{}};if(this.token)options.headers.Authorization='Bearer '+this.token;if(body!==undefined){options.headers['Content-Type']='application/json';options.body=JSON.stringify(body);}const response=await fetch(apiBase+'/api/'+path,options);let data;try{data=await response.json();}catch{throw Error('게임 서버를 새로 실행한 뒤 다시 접속해주세요.');}if(!response.ok){if(response.status===401){this.token='';sessionStorage.removeItem('goeul-session');this.data=null;this.renderKey='';window.onNetUpdate?.();}throw Error(data.error||'서버와 연결하지 못했습니다.');}return data;},
 accept(data){if(data.serverNow)this.offset=data.serverNow-Date.now();else if(data.room?.serverNow)this.offset=data.room.serverNow-Date.now();if(data.unchanged)return;this.data=data;this.revision=data.revision;const key=data.room?data.room.id+':'+data.room.revision:JSON.stringify(data.rooms);if(key!==this.renderKey){this.renderKey=key;window.onNetUpdate?.();}},
 async call(path,body={}){if(this.pending)throw Error('이전 선택을 처리하고 있습니다.');this.pending=true;try{const data=await this.request(path,body);this.accept(data);return data;}finally{this.pending=false;}},
 async login(nickname){const data=await this.request('login',{nickname});this.token=data.token;sessionStorage.setItem('goeul-session',this.token);this.revision=-1;this.renderKey='';await this.poll();},
 async poll(){if(!this.token)return;try{this.accept(await this.request('state?revision='+this.revision));document.querySelector('#connection-note')?.replaceChildren();}catch(error){const el=document.querySelector('#connection-note');if(el)el.textContent=this.token?'연결 복구 중… 서버가 켜져 있는지 확인해주세요.':'';}},
 init(){this.poll();this.pollTimer=setInterval(()=>this.poll(),650);setInterval(()=>window.updateNetClock?.(),150);},
 canAct(){const r=this.data?.room;if(!r?.state||r.spectator)return false;const state=r.state,actor=state.choice?.kind==='freeze'?state.players[state.choice.responders[0]]:state.players[state.order[state.turn]];return actor?.uid===this.data.user.id&&!actor.ai;},
 isHost(){return this.data?.room?.host===this.data?.user.id;},
 now(){return Date.now()+this.offset;},
};window.NET=net;
})();
