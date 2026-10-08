GEMI TAKIP - KURULUM

Bu proje Cloudflare Pages + Pages Functions + VesselAPI kullanır.
VesselAPI'nin ücretsiz katmanından API anahtarı gerekir. API anahtarını kodun içine koymayın; Cloudflare Environment Variable olarak ekleyin.

1) VesselAPI'de ücretsiz hesap açın ve API key alın.
2) GitHub'da yeni bir repository oluşturun (ör. gemi-takip).
3) Bu klasördeki index.html ve functions klasörünü repository'ye yükleyin.
4) Cloudflare hesabı açın -> Workers & Pages -> Create -> Pages -> Import existing Git repository.
5) Repository'yi seçin. Build command boş bırakılabilir. Build output directory boş bırakılabilir.
6) Deploy edin.
7) Cloudflare Pages projesinde Settings -> Environment variables bölümüne gidin.
   Variable name: VESSELAPI_KEY
   Value: VesselAPI API anahtarınız
   Production ortamına ekleyin.
8) Yeniden deploy edin.
9) Size https://PROJE-ADI.pages.dev şeklinde ücretsiz bir adres verilir.

NOTLAR
- Site gemi adını arar, canlı AIS pozisyonunu ve ETA'yı getirir.
- Nereden bilgisi, son 31 gündeki en son departure port event üzerinden bulunur.
- Yolculuk yüzdesi limanların ve geminin mevcut konumunun kuş uçuşu mesafesiyle yaklaşık hesaplanır; deniz rotası yüzdesi değildir.
- ETA geminin AIS verisinden alınır; kesin varış garantisi değildir.
- Terrestrial AIS kapsamı dışında kalan açık deniz gemilerinde ücretsiz katmanda canlı pozisyon bulunamayabilir; uydu AIS ek ücretli olabilir.
