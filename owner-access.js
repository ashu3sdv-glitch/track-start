(function(){
  const form=document.getElementById('owner-form'),password=document.getElementById('owner-password'),status=document.getElementById('owner-status'),logout=document.getElementById('owner-logout'),copy=document.getElementById('owner-copy');
  function render(owner){form.hidden=owner;logout.hidden=!owner;copy.textContent=owner?'Режим владельца активен. В этом браузере доступны все функции Pro.':'Введите личный пароль. Доступ сохранится в этом браузере на 30 дней.';status.textContent=owner?'✓ Доступ владельца подтверждён':''}
  async function request(body){const response=await fetch('/api/owner',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'Не удалось выполнить запрос');return data}
  fetch('/api/owner',{cache:'no-store'}).then(r=>r.json()).then(d=>render(d.owner===true)).catch(()=>render(false));
  form.addEventListener('submit',async e=>{e.preventDefault();status.textContent='Проверяем…';try{const data=await request({password:password.value});password.value='';render(data.owner===true)}catch(err){status.textContent=err.message}});
  logout.addEventListener('click',async()=>{try{await request({action:'logout'});render(false)}catch(err){status.textContent=err.message}});
})();
