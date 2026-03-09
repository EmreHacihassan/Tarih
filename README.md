# AI 4 Social Good Club - Ortak Musait Saat Bulucu

Kulup uyelerinin haftalik uygunluk planlarini tek yerde toplayip ortak bos zamanlari gormeyi kolaylastiran dosya tabanli bir web uygulamasi.

## Ozellikler
- 7 gunluk takvim gorunumu (00:00-23:59).
- Mesgul saatleri blok olarak cizer, bosluklar net sekilde gorulur.
- Manuel kayit ekleme ve kayit silme.
- CSV ice aktarma (toplu plan yukleme).
- CSV disa aktarma (baska kullanicilarla birebir ayni veriyi paylasma).
- Verileri JSON dosyasinda saklama (veritabani gerekmez).

## Kullanim Senaryosu
1. Her uye kendi planini CSV olarak hazirlar.
2. Yonetici tum CSV dosyalarini uygulamaya ice aktarir.
3. Takvimde ortak musait saatler gorunur.
4. Istenirse mevcut durum CSV disa aktarilir.
5. Bu CSV baska bir makinede ice aktarildiginda ayni gorunum tekrar elde edilir.

## Kurulum ve Calistirma (Windows PowerShell)
```powershell
cd "C:\Users\LENOVO\Desktop\Aktif Projeler\Tarih"
npm install
npm start
```

Varsayilan adres:
- http://localhost:3000

Eger 3000 portu doluysa:
```powershell
$env:PORT=3001
npm start
```

## CSV Formati
Uygulama asagidaki basliklari bekler:

```csv
name,day,start,end
Ayse,0,09:00,10:00
Ali,Sali,13:30,15:00
Zeynep,carsamba,08:15,09:45
```

Notlar:
- day alani 0..6 veya gun adi olabilir.
- Saatler HH:MM formatinda olmalidir.
- end degeri start degerinden buyuk olmalidir.

## Disa Aktarma Uyumlulugu
Uygulama tarafindan uretilen CSV dosyasi, ayni uygulamanin CSV ice aktarma akisiyla dogrudan uyumludur.
Bu sayede farkli kullanicilar ayni veri gorunumunu tekrar olusturabilir.

## API
- GET /api/events
	- Cikti: { events: Array }
- POST /api/events
	- Girdi: { name, day, start, end }
	- day: 0..6
	- start/end: HH:MM
- DELETE /api/events/:id
- GET /api/meta
	- Cikti: kullanilan veri dosyasi yolu

## Veri Dosyasi Secimi
Uygulama veri dosyasini su oncelikle belirler:
1. SCHEDULE_FILE ortam degiskeni
2. Proje kokundeki Tarih.json
3. data/schedule.json

Ornek:
```powershell
$env:SCHEDULE_FILE="D:\team-data\schedule.json"
npm start
```

## Proje Yapisi
- public/index.html: Arayuz
- public/styles.css: Tasarim
- public/app.js: Takvim, form, CSV ice/disa aktarma
- server.js: Express API ve dosya tabanli kayit

## Notlar
- data klasoru varsayilan olarak surum kontrolune alinmaz.
- Ayni CSV birden fazla kez ice aktarilirsa kayitlar tekrar edebilir.
