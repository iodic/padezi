/* No test dependencies. Check actual inline application using a minimal DOM. */
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const html = fs.readFileSync(__dirname + '/index.html', 'utf8');
const source = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function boot(blockStorage) {
	const elements = {};
	const data = {};
	const doc = {getElementById(id) {
		if (!elements[id]) elements[id] = {innerHTML:'', focus(){}};
		return elements[id];
	}};
	const storage = {
		getItem(k) { if (blockStorage) throw Error('denied'); return data[k] || null; },
		setItem(k,v) { if (blockStorage) throw Error('denied'); data[k]=v; },
		removeItem(k) { if (blockStorage) throw Error('denied'); delete data[k]; }
	};
	const ctx = {document:doc,localStorage:storage,window:{scrollTo(){},confirm(){return true;}},JSON,Math};
	vm.createContext(ctx); vm.runInContext(source,ctx);
	return {app:ctx.App, page:()=>elements.app.innerHTML, data};
}
function choices(page) {
	return Array.from(page.matchAll(/onclick="App.answer\((\d)\)"[^>]*>([\s\S]*?)<\/button>/g)).map(m=>({id:+m[1],text:m[2].replace(/<[^>]+>/g,'')}));
}
const labels = ['Номинатив','Генитив','Датив','Акузатив','Вокатив','Инструментал','Локатив'];
/* Use the authored case key to exercise UI, not a second grammar implementation. */
const rowText = source.match(/var rows = (\[[\s\S]*?\n\t\]);/)[1];
const rows = vm.runInNewContext(rowText);
assert(rows.length >= 70);
const seen = new Set();
rows.forEach((r,i)=>{
	assert.strictEqual(r.length,5, 'row '+i);
	assert.strictEqual((r[0].match(/\[/g)||[]).length,1,'one highlighted noun');
	assert(r[1]>=0 && r[1]<=6); assert(r[2]&&r[3]);
	assert(!seen.has(r[0]));seen.add(r[0]);
});
function answerId(page) {
	if(page.includes('У ком је падежу')) {
		const sentence = page.match(/<div class="sentence">([\s\S]*?)<\/div>/)[1].replace(/<mark>/g,'[').replace(/<\/mark>/g,']');
		const r=rows.find(r=>r[0]===sentence); assert(r,'sentence found'); return r[1];
	}
	const prompt=page.match(/<div class="sentence">([\s\S]*?)<\/div>/)[1];
	const questions=['Ко? Шта?','Кога? Чега?','Коме? Чему?','Кога? Шта?','Нема питање — хеј!','С ким? Чиме?','О коме? О чему?'];
	const n=labels.indexOf(prompt);return n<0?questions.indexOf(prompt):n;
}
for(let attempt=0;attempt<25;attempt++) {
	const b=boot(false);b.app.start('sentences');const cases=new Set(), sentences=new Set();
	for(let i=0;i<10;i++) {
		const p=b.page(), id=answerId(p);cases.add(id);
		const sentence=p.match(/<div class="sentence">([\s\S]*?)<\/div>/)[1];assert(!sentences.has(sentence));sentences.add(sentence);
		b.app.next();assert.strictEqual(b.page(),p,'cannot skip unanswered');
		b.app.answer(id);const answered=b.page();b.app.answer((id+1)%7);assert.strictEqual(b.page(),answered,'double tap ignored');
		assert(answered.includes('Тачно!'));b.app.next();
	}
	assert.strictEqual(cases.size,7);assert(b.page().includes('10 / 10'));assert.strictEqual(JSON.parse(b.data['padezi-best']).sentences,100);
}
for(const mode of ['questions','sentences','traps']) {
	const b=boot(false);b.app.start(mode);const expected=new Set();
	for(let i=0;i<10;i++) {
		const id=answerId(b.page());expected.add(id);const wrong=choices(b.page()).find(c=>c.id!==id);assert(wrong);b.app.answer(wrong.id);assert(b.page().includes('Хајде да разјаснимо.'));b.app.next();
	}
	assert(b.page().includes('0 / 10'));assert(b.page().includes('Понови погрешене (10)'));
	if(mode!=='traps') assert.strictEqual(expected.size,7);
	b.app.retry();for(let i=0;i<10;i++){b.app.answer(answerId(b.page()));b.app.next();} assert(b.page().includes('10 / 10'));
	assert.strictEqual(JSON.parse(b.data['padezi-best'])[mode],0,'retry does not inflate records');
	b.app.toggleScript();assert(b.page().includes('RUNDA JE GOTOVA'));b.app.toggleScript();b.app.home();
}
for(const group of ['ga','dl','al','na','nv','gi','ai','dil']) {
	const b=boot(true);b.app.start('traps',group);const n=Math.min(10,rows.filter(r=>r[4]===group).length);
	for(let i=0;i<n;i++){const p=b.page(), id=answerId(p);assert(choices(p).length>=2);b.app.hint();assert(b.page().includes('class="hint"'));b.app.answer(id);b.app.next();}
	assert(b.page().includes(n+' / '+n));b.app.home();assert(b.page().includes('Чување резултата није доступно'));
}
const b=boot(false);b.app.learn();assert(b.page().includes('Вокатив'));b.app.trapPage();assert(b.page().includes('Датив, инструментал или локатив'));b.app.parents();assert(b.page().includes(rows.length+' реченица'));b.app.toggleScript();assert(b.page().includes('Kratko za roditelje.'));b.app.reset();
assert(!/\b(const|let|class|async|await)\s+\w|=>|\.forEach\(|\.map\(/.test(source),'legacy runtime syntax');
assert(!/<script[^>]+src=|@import|display:\s*(flex|grid)|var\(--/.test(html),'no modern/external dependencies');
console.log('PASS: '+rows.length+' sentences; scoring, all modes, all 8 trap groups, retry, script toggle, storage fallback, coverage and duplicate-click guard.');
