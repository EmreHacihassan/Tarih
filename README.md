# Ortak Boş Saat Bulucu (Dosya Tabanlı)

- 7 gün sütunlu, 00:00–23:59 arası yeşil zemin.
- Ders aralıkları kırmızı blok ve üzerinde saat aralığı etiketi.
- Kayıtlar tek bir JSON dosyasına eklenir. Dosya yoksa otomatik oluşturulur.

## Çalıştırma (Windows PowerShell)
```powershell
cd "c:\Users\LENOVO\Desktop\Aktif Projeler\tarih belirleyici"
npm install
npm run dev
# Tarayıcı: http://localhost:3000
```

## API
- GET /api/events → { events: Array }
- POST /api/events → body: { name, day(0..6), start("HH:MM"), end("HH:MM") }
- DELETE /api/events/:id

## Veri dosyası
Öncelik: SCHEDULE_FILE ortam değişkeni > proje kökünde Tarih.json > .\data\schedule.json  
Örnek:
```powershell
$env:SCHEDULE_FILE="D:\team-data\schedule.json"; npm run start
```

Not: data/ klasörü .gitignore içindedir. Dosyayı repo’ya dahil etmek isterseniz .gitignore’dan kaldırın.