(function(){
  const STORAGE_KEY='ts_content_bank_v1';
  const STATUS_LABELS={idea:'Идея',week:'На эту неделю',writing:'В работе',published:'Опубликовано'};
  const topics=[
    ['Как написать текст песни с нуля','Основы','как написать текст песни','Инструкция для новичка','1'],
    ['Как придумать сильный припев','Припев','как написать припев песни','Пошаговая формула хука','1'],
    ['Как подобрать рифму к песне','Рифма','как подобрать рифму к песне','Типы рифм и практические примеры','1'],
    ['Как правильно оформить текст песни для Suno','Suno','как оформить текст для suno','Секции, теги и чистый пример','1'],
    ['Почему нейросеть пишет красивые, но бессмысленные тексты','Качество','нейросеть пишет плохие тексты песен','Разбор ошибок и способ проверки','1'],
    ['Как написать второй куплет и не повторить первый','Структура','как написать второй куплет','Функция второго куплета и примеры','1'],
    ['Как сделать текст песни ритмичным','Ритм','ритм текста песни','Слоги, ударения и дыхательные группы','1'],
    ['Как написать песню в стиле Pop','Жанры','как написать поп песню','Структура, язык и припев Pop','1'],
    ['Как заставить Suno правильно спеть русский текст','Suno','suno русский текст ударения','Подготовка строк и исправление ударений','1'],
    ['Как выбрать голос и тембр для песни','Вокал','как выбрать голос для песни','Бас, баритон, тенор, контральто и сопрано','1'],
    ['Как написать текст в стиле Indie Rock','Жанры','текст песни indie rock','Образы, напряжение и рефрен','2'],
    ['Как проверить готовый текст песни','Качество','как проверить текст песни','Чек-лист рифмы, смысла и певучести','1'],
    ['Точные и неточные рифмы: что лучше звучит в песне','Рифма','точные и неточные рифмы','Сравнение с примерами','2'],
    ['Как считать слоги в тексте песни','Ритм','как считать слоги в песне','Простой алгоритм для автора','2'],
    ['Пять признаков текста, написанного нейросетью','Качество','признаки текста нейросети','Диагностика клише и пустых образов','2'],
    ['Как убрать банальные фразы из песни','Качество','банальные фразы в песнях','Замена абстракций конкретными сценами','2'],
    ['Как написать текст для Dark Phonk','Жанры','текст для dark phonk','Ритмические ячейки, чант и плотность','2'],
    ['Как написать припев для Hip-Hop','Жанры','припев для хип хопа','Хук, ритм и цитируемая строка','2'],
    ['Как написать текст песни в стиле R&B','Жанры','как написать r&b песню','Интимность, пространство и внутренняя рифма','2'],
    ['Как написать современный шансон','Жанры','текст современного шансона','История, деталь и взрослый рефрен','2'],
    ['Что означают Verse, Chorus и Bridge в Suno','Suno','verse chorus bridge suno','Справочник по секциям песни','2'],
    ['Как составить Style Prompt для Suno','Suno','style prompt suno','Компактная формула стиля без лишних слов','2'],
    ['Как придумать название песни','Основы','как назвать песню','Название из хука, образа или конфликта','3'],
    ['Как превратить личную историю в песню','Основы','как написать песню по истории','От события к сцене, повороту и припеву','3']
  ].map((row,index)=>({id:`topic-${index+1}`,title:row[0],category:row[1],query:row[2],angle:row[3],priority:Number(row[4])}));
  const gate=document.getElementById('owner-gate'),app=document.getElementById('content-app'),grid=document.getElementById('topic-grid'),search=document.getElementById('topic-search'),categoryFilter=document.getElementById('category-filter'),statusFilter=document.getElementById('status-filter'),stats=document.getElementById('content-stats');
  let state={};
  function load(){try{state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')}catch{state={}}}
  function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
  function getStatus(id){return state[id]?.status||'idea'}
  function setStatus(id,status){state[id]={...(state[id]||{}),status,updatedAt:new Date().toISOString()};save();render()}
  function brief(topic){return `Напиши SEO/GEO-статью для Track Start.\n\nТема: ${topic.title}\nОсновной запрос: ${topic.query}\nРубрика: ${topic.category}\nУгол материала: ${topic.angle}\n\nСтруктура:\n1. Прямой ответ в первых двух абзацах.\n2. Пошаговая практическая инструкция.\n3. Собственные примеры «слабо → лучше».\n4. Частые ошибки.\n5. Короткий FAQ.\n6. Мягкий переход в генератор Track Start.\n\nНе растягивай текст и не повторяй ключевую фразу искусственно.`}
  async function copyBrief(topic,button){await navigator.clipboard.writeText(brief(topic));const old=button.textContent;button.textContent='Скопировано';setTimeout(()=>button.textContent=old,1400)}
  function render(){
    const q=search.value.trim().toLowerCase(),category=categoryFilter.value,status=statusFilter.value;
    const visible=topics.filter(topic=>(!category||topic.category===category)&&(!status||getStatus(topic.id)===status)&&(!q||`${topic.title} ${topic.query}`.toLowerCase().includes(q)));
    stats.innerHTML=Object.keys(STATUS_LABELS).map(key=>`<span class="content-stat">${STATUS_LABELS[key]}: ${topics.filter(topic=>getStatus(topic.id)===key).length}</span>`).join('');
    grid.innerHTML='';
    visible.forEach(topic=>{
      const card=document.createElement('article');card.className=`topic-card${getStatus(topic.id)==='week'?' is-week':''}`;
      card.innerHTML=`<div class="topic-top"><span class="topic-category"></span><span class="topic-priority">Приоритет ${topic.priority}</span></div><h2></h2><div class="topic-meta"><span><strong>Запрос:</strong> </span><span><strong>Материал:</strong> </span></div><div class="topic-controls"><select aria-label="Статус темы">${Object.entries(STATUS_LABELS).map(([value,label])=>`<option value="${value}"${getStatus(topic.id)===value?' selected':''}>${label}</option>`).join('')}</select><button class="btn btn-secondary" type="button">Скопировать ТЗ</button></div>`;
      card.querySelector('.topic-category').textContent=topic.category;card.querySelector('h2').textContent=topic.title;
      const meta=card.querySelectorAll('.topic-meta span');meta[0].append(document.createTextNode(topic.query));meta[1].append(document.createTextNode(topic.angle));
      card.querySelector('select').addEventListener('change',event=>setStatus(topic.id,event.target.value));card.querySelector('button').addEventListener('click',event=>copyBrief(topic,event.currentTarget));grid.append(card);
    });
  }
  function pickWeek(){topics.filter(topic=>getStatus(topic.id)==='week').forEach(topic=>{state[topic.id]={status:'idea'}});topics.filter(topic=>getStatus(topic.id)==='idea').sort((a,b)=>a.priority-b.priority).slice(0,2).forEach(topic=>{state[topic.id]={status:'week',updatedAt:new Date().toISOString()}});save();statusFilter.value='week';render()}
  async function init(){
    const owner=await fetch('/api/owner',{cache:'no-store'}).then(response=>response.json()).then(data=>data.owner===true).catch(()=>false);
    gate.hidden=owner;app.hidden=!owner;if(!owner)return;load();
    [...new Set(topics.map(topic=>topic.category))].sort().forEach(category=>{const option=document.createElement('option');option.value=category;option.textContent=category;categoryFilter.append(option)});
    [search,categoryFilter,statusFilter].forEach(control=>control.addEventListener('input',render));document.getElementById('pick-week').addEventListener('click',pickWeek);render();
  }
  init();
})();
