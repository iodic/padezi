# Padež po padež

Mikro sajt za peti razred: pitanja za padeže, prepoznavanje imenica u rečenicama i tipične zabune. Ćirilica i latinica, objašnjenje posle svakog odgovora, ponavljanje grešaka i lokalni rekordi. Bez tajmera.

## Vercel

Projekat je statički: nema instalacije paketa ni build koraka.

1. Postavi sadržaj ovog foldera u Git repozitorijum i importuj ga u Vercel.
2. Framework Preset: **Other**; Root Directory: folder gde je `index.html`.
3. Build Command: prazno; Output Directory: `.`; ne treba Install Command.
4. Deploy.

Produkcija: https://padezi-kviz.vercel.app (projekat `padezi-kviz`). Ručni deploy: `vercel deploy --prod`.

Nema backend-a, ključeva, baze, kolačića ni spoljašnjih zavisnosti. `index.html` sadrži i stilove i sve zadatke; dovoljan je taj jedan fajl za rad kviza. Ne treba Service Worker niti podrška za module.

## Originalni iPad / iOS 5.1.1

Kod je namerno pisan u ES3 stilu: `var`, obične funkcije, `onclick`, `innerHTML`. Nema React-a, modula, fetch-a, Promise-a, let/const-a, arrow funkcija, Flexbox-a, Grid-a, CSS varijabli, web-fontova, SVG-a ni novijih API-ja. Raspored koristi inline-block; kontrole su velike i rade na dodir. Čuvanje rezultata je opciono i obuhvaćeno try/catch blokovima (privatni režim starog Safarija može zabraniti upis).

**Važno: prvi iPad ne može da otvori Vercel adresu.** Provereno 2026-11-23: `*.vercel.app` na TLS 1.2 prihvata samo AES-GCM i ChaCha20 cipher suite-ove, a iOS 5/6 Safari ima samo CBC (GCM stiže tek u iOS 9). HTTP zahtev Vercel preusmerava na HTTPS (308 + `Refresh`), pa ni to ne pomaže. Kod je kompatibilan; problem je samo TLS na hostingu.

Pouzdan rezervni put je običan HTTP na kućnoj mreži:

1. Mac i iPad poveži na istu Wi-Fi mrežu.
2. Na Mac-u, u ovom folderu, pokreni `python3 serve.py`.
3. Otvori na iPad-u jednu od ispisanih `http://…:8080` adresa (ne localhost).
4. Ako macOS pita, dozvoli Python-u dolazne veze na lokalnoj mreži. Mac ostaje uključen dok se stranica učitava. Kada se jednom učita, kviz više ne traži mrežu dok ne osvežiš/zatvoriš stranicu.

Ako mreža izoluje uređaje (guest Wi-Fi), koristi običnu kućnu mrežu. Ne izlaži lokalni server internetu. Za stalno dostupno rešenje može poslužiti isti statički fajl na kućnom NAS-u ili serveru koji već imaš, preko LAN HTTP-a. Dodavanje na Home Screen je opcionalno; to nije garantovani offline režim niti instalacija aplikacije.

## Sadržaj i dopune

- 71 originalna rečenica (tačan broj se prikazuje u odeljku za roditelje).
- Pitanja u oba smera; svaka puna runda obuhvata svih sedam padeža.
- Svaka puna runda rečenica sadrži svih sedam padeža, bez ponavljanja istog zadatka.
- Osam grupa zabuna: G/A, D/L, A/L, N/A, N/V, G/I uz „sa“, A/I uz „pod/pred“, D/I/L u množini.
- Uža grupa ima najviše 10 različitih zadataka; ako ih ima manje, runda je kraća.
- Prvi odgovor se računa, zatim sledi objašnjenje. Nema preskakanja greške bez prikaza tačnog odgovora.
- Rekordi su vezani za ovaj uređaj i browser. Pomoć je dozvoljena i rekord nije formalna procena znanja.

Sadržaj je u nizovima `cases`, `rows` i `traps` u `index.html`. Zapis jedne rečenice: `[tekst sa [označenom imenicom], indeks padeža, pitanje u kontekstu, objašnjenje, grupa zabune]`. Indeksi: 0 N, 1 G, 2 D, 3 A, 4 V, 5 I, 6 L. U rečenici označiti samo jednu imenicu. Samostalan oblik imenice često nije dovoljan za jednoznačan padež.

Gramatički pregled je proveren prema https://www.opsteobrazovanje.in.rs/srpski-jezik/gramatika/padezi/ (literatura tamo: I. Klajn, Gramatika srpskog jezika). Primeri i objašnjenja kviza su originalni. Obim prati osnovno prepoznavanje padeža; nije potpun pregled svih značenja i upotreba.

Tehničke reference:
- https://vercel.com/docs/deployments
- https://vercel.com/docs/cdn
- https://vercel.com/changelog/deprecating-the-dhe-cipher-suite-for-tls-connections
- https://support.apple.com/en-al/103815

## Provera

U ovom okruženju provere toka i sadržaja su prošle. Vizuelna provera u browseru nije završena: lokalni server i pristup lokalnom fajlu su blokirani pravilima okruženja. Prikaz u Safari-ju na fizičkom iPad-u nije testiran.

`node test.cjs` proverava tokove kviza u minimalnom DOM okruženju: pokrivenost svih padeža, bodovanje, ponovljeni klik, tačne i pogrešne odgovore, ponavljanje grešaka, menjanje pisma, sve grupe zabuna i nedostupno lokalno čuvanje. Test nije emulacija starog WebKit-a. Fizički iPad ostaje merodavan za konačnu proveru.
