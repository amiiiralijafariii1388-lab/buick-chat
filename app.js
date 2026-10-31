/* BUICK CHAT — Supabase realtime prototype. */
const $ = id => document.getElementById(id);
const params = new URLSearchParams(location.search);
const requestedRoom = (params.get('room') || '').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,8);
let client = null, roomId = null, channel = null, messagesCache = [];
let myName = localStorage.getItem('buick_name') || 'کاربر بیوک';
function toast(msg){const t=$('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2300)}
function initials(s){return (s||'B').trim().charAt(0).toUpperCase()}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
function timeLabel(ts){return ts?new Date(ts).toLocaleTimeString('fa-IR',{hour:'2-digit',minute:'2-digit'}):''}
function setConnection(s){$('connectionLabel').textContent=s}
function showModal(html){$('modalContent').innerHTML=html;$('modalBackdrop').classList.remove('hidden')}
function closeModal(){$('modalBackdrop').classList.add('hidden')}
function newRoomCode(){return Math.random().toString(36).slice(2,10).toUpperCase()}
function showSetupMessage(msg){$('welcomeScreen').classList.remove('hidden');$('welcomeScreen').querySelector('.welcome-note').textContent=msg;setConnection('نیاز به تنظیم')}
async function boot(){
 $('myName').textContent=myName;$('myAvatar').textContent=initials(myName);
 if(!window.supabase || !window.BUICK_SUPABASE_URL || !window.BUICK_SUPABASE_ANON_KEY){showSetupMessage('اتصال Supabase تنظیم نشده است.');return}
 try{
  client=window.supabase.createClient(window.BUICK_SUPABASE_URL,window.BUICK_SUPABASE_ANON_KEY);
  const {error}=await client.from('rooms').select('room_code').limit(1);
  if(error) throw error;
  setConnection('متصل به سرویس');
  if(requestedRoom) await joinRoom(requestedRoom); else await createRoom(false);
 }catch(e){console.error(e);setConnection('خطای اتصال');showSetupMessage('اتصال پایگاه داده هنوز آماده نیست. راهنمای README را برای اجرای SQL و فعال‌کردن Realtime دنبال کن.');toast('هنوز جدول‌های Supabase ساخته نشده‌اند.')}
}
async function createRoom(showToast=true){
 if(!client){toast('اتصال Supabase آماده نیست.');return}
 const code=newRoomCode();
 const {error}=await client.from('rooms').insert({room_code:code,title:'گفتگوی بیوک'});
 if(error){console.error(error);toast('ساخت گفتگو انجام نشد؛ تنظیمات دیتابیس را بررسی کن.');return}
 await openRoom(code);if(showToast)toast('گفتگوی جدید ساخته شد');
}
async function joinRoom(code){
 const {data,error}=await client.from('rooms').select('room_code').eq('room_code',code).maybeSingle();
 if(error||!data){toast('این کد گفتگو پیدا نشد.');return}
 await openRoom(code);$('sidebar').classList.remove('open');toast('به گفتگو وصل شدی');
}
async function openRoom(code){
 roomId=code;$('roomCodeDisplay').textContent=code;$('welcomeScreen').classList.add('hidden');$('chatView').classList.remove('hidden');
 $('activeName').textContent='گفتگوی خصوصی';$('activeAvatar').textContent='B';$('activeStatus').textContent='گفتگو آماده است';
 await loadMessages();
 if(channel) await client.removeChannel(channel);
 channel=client.channel('room-'+roomId).on('postgres_changes',{event:'INSERT',schema:'public',table:'messages',filter:'room_code=eq.'+roomId},payload=>{
  const m=payload.new;if(!messagesCache.some(x=>x.id===m.id)){messagesCache.push(m);renderMessages();if(m.name!==myName)toast('پیام جدید دریافت شد')}
 }).subscribe(status=>{if(status==='SUBSCRIBED')$('activeStatus').textContent='اتصال زنده برقرار است'});
}
async function loadMessages(){
 const {data,error}=await client.from('messages').select('*').eq('room_code',roomId).order('created_at',{ascending:true}).limit(250);
 if(error){console.error(error);toast('دریافت پیام‌ها ناموفق بود.');return}
 messagesCache=data||[];renderMessages();
}
function renderMessages(){
 const box=$('messages');box.innerHTML='<div class="day-divider">گفتگوی شما</div>';
 messagesCache.forEach(m=>{const el=document.createElement('div');el.className='message '+(m.name===myName?'out':'in');el.innerHTML=`${escapeHtml(m.text)}<time>${escapeHtml(m.name||'کاربر')} · ${escapeHtml(timeLabel(m.created_at))}</time>`;box.appendChild(el)});
 box.scrollTop=box.scrollHeight;
}
async function sendMessage(text){
 if(!text.trim()||!roomId)return;
 const {error}=await client.from('messages').insert({room_code:roomId,text:text.trim(),name:myName});
 if(error){console.error(error);toast('ارسال پیام انجام نشد؛ اتصال را بررسی کن.')}
}
async function copyRoom(){if(!roomId)return;const link=location.origin+location.pathname+'?room='+roomId;try{await navigator.clipboard.writeText(link);toast('لینک گفتگو کپی شد')}catch{toast('کد گفتگو: '+roomId)}}
function connectModal(){showModal(`<h2>اتصال به دوست</h2><p>کد گفتگویی را که دوستت فرستاده وارد کن.</p><div class="field"><label>کد گفتگو</label><input id="joinCode" maxlength="8" placeholder="مثلاً A8K2QZ" style="direction:ltr;text-transform:uppercase"></div><div class="modal-actions"><button id="cancelModal">انصراف</button><button class="confirm" id="joinButton">ورود به گفتگو</button></div>`);$('cancelModal').onclick=closeModal;$('joinButton').onclick=async()=>{const code=$('joinCode').value.trim().toUpperCase();if(!code){toast('کد گفتگو را وارد کن');return}await joinRoom(code);if(roomId===code)closeModal()}}
function settingsModal(){showModal(`<h2>پروفایل</h2><p>نامی که کنار پیام‌ها نمایش داده می‌شود.</p><div class="field"><label>نام نمایشی</label><input id="profileName" value="${escapeHtml(myName)}"></div><div class="modal-actions"><button id="cancelModal">بستن</button><button class="confirm" id="saveProfile">ذخیره</button></div>`);$('cancelModal').onclick=closeModal;$('saveProfile').onclick=()=>{myName=$('profileName').value.trim()||'کاربر بیوک';localStorage.setItem('buick_name',myName);$('myName').textContent=myName;$('myAvatar').textContent=initials(myName);closeModal();renderMessages();toast('نام ذخیره شد')}}
$('messageForm').addEventListener('submit',async e=>{e.preventDefault();const input=$('messageInput');const value=input.value;input.value='';await sendMessage(value)});
$('newChatBtn').onclick=connectModal;$('startChatBtn').onclick=()=>createRoom();$('settingsBtn').onclick=settingsModal;$('topSettings').onclick=settingsModal;
$('modalClose').onclick=closeModal;$('modalBackdrop').addEventListener('click',e=>{if(e.target===$('modalBackdrop'))closeModal()});$('mobileMenu').onclick=()=>$('sidebar').classList.toggle('open');
$('copyCodeBtn').onclick=copyRoom;$('copyRoomBtn').onclick=copyRoom;
$('contactInfoBtn').onclick=()=>showModal(`<h2>گفتگوی خصوصی</h2><p>کد این گفتگو: <b style="direction:ltr;display:inline-block">${roomId||'—'}</b></p><p>این نسخه آزمایشی است؛ هرکسی که لینک یا کد را داشته باشد می‌تواند وارد شود. اطلاعات حساس ارسال نکن.</p><div class="modal-actions"><button class="confirm" id="okInfo">باشه</button></div>`);
$('emojiBtn').onclick=()=>{$('messageInput').value+=' 😊';$('messageInput').focus()};$('messageInput').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();$('messageForm').requestSubmit()}});
boot();
