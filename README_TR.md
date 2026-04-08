# RPG Maker MZ — Kurts eklenti paketi

Bu projeye özel eklentiler ve kullanım kuralları: çözünürlüğe duyarlı arayüz, kamera, ara sahneler, etkileşim, animasyon ve seçenekler.  
**Yazar:** Furkan Kurt

---

## İçindekiler

1. [Hızlı özet](#hızlı-özet)
2. [Önerilen eklenti sırası](#önerilen-eklenti-sırası)
3. [Eklentiler (referans)](#eklentiler-referans)
4. [Ara sahneler, resimler ve script](#ara-sahneler-resimler-ve-script)
5. [Kurulum](#kurulum)
6. [Uyumluluk ve sorun giderme](#uyumluluk-ve-sorun-giderme)
7. [Lisans](#lisans)

---

## Hızlı özet

| Eklenti | Görevi |
|---------|--------|
| **KurtsAnimationPlugin** | `$` karakterler için LibreSprite JSON ile yön başına farklı kare sayıları |
| **KurtsPerpectivePlugin** | İsteğe bağlı Y konumuna göre sprite ölçekleme (2.5B derinlik) |
| **KurtsKeyMapper** | Etkileşim tuşu + hareket (ör. WASD) |
| **KurtsInteractionRangePlugin** | Yönlü etkileşim mesafesi + isteğe bağlı yüz yönü + ikon |
| **KurtsShakePlugin** | Sadece oyuncu sprite’ı için sarsıntı |
| **KurtsMouseWheelZoom** | Harita zoom (tekerlek), çözünürlüğe göre; isimle hariç tutulan ara sahne haritaları |
| **KurtsCameraLag** | Yumuşak takip + zoom dışta iken “sabit” kamera |
| **KurtsMapForeground** | Haritaya sabit ön plan resimleri (karakterlerin üstünde); script ile opaklık |
| **KurtsFPSLogger** | Konsola FPS günlüğü + seçeneklerdeki FPS sınırı ile uyum |
| **KurtsOptionsMenu** | Başlık/seçenek arayüzü, çözünürlük listesi, FPS, kamera gecikmesi, kontroller |
| **KurtsTranslationTooltip** | Mesajlarda `\TR<metin|ipucu>` ile üzerine gelince çeviri kutusu |
| **KurtsPlayerDefaults** | Varsayılan hız / sıklık / yön / through; harita değişince şeffaflığı sıfırlar |
| **KurtsResolutionPictures** | Referans tabanlı resimler + ölçekli mesaj penceresi + `\PX` / `\PY` |

---

## Önerilen eklenti sırası

**KurtsResolutionPictures** eklentisini **KurtsTranslationTooltip**’ten **önce** yükleyin; böylece ipucu ölçeği `KurtsResolutionUiScale()` ile uyumlu olur.

Önerilen sıra (kullandıklarınıza göre düzenleyin):

1. KurtsAnimationPlugin  
2. KurtsPerpectivePlugin (kullanılıyorsa)  
3. KurtsKeyMapper  
4. KurtsInteractionRangePlugin  
5. KurtsShakePlugin  
6. KurtsMouseWheelZoom  
7. KurtsCameraLag  
8. KurtsMapForeground *(zoom ve kamera gecikmesinden sonra)*  
9. KurtsFPSLogger  
10. KurtsOptionsMenu *(CameraLag, KeyMapper, FPSLogger’dan sonra)*  
11. KurtsResolutionPictures  
12. KurtsTranslationTooltip  
13. KurtsPlayerDefaults  

---

## Eklentiler (referans)

### KurtsAnimationPlugin

- **Amaç:** Her animasyon için (idle / yürü / koş × 4 yön) farklı kare sayısı; LibreSprite’tan JSON.
- **Dosyalar:** `img/characters/` altında `$İsim.png` + isteğe bağlı `$İsim.json`.
- **Kare adları:** örn. `idleUp0`, `walkLeft3`, `runDown2` (tam liste için eklenti yardımı).
- **Parametreler:** Her yön için `f` (kare sayısı) ile hız formülleri; koşu eşiği; isteğe bağlı hata ayıklama katmanı; **JSON Animation Characters** beyaz listesi (sadece yazılan `$` sayfaları JSON yükler; boşsa yerleşik varsayılan); beyaz liste boşken **Static Dollar Characters**.
- **Eksik veri:** Animasyon veya JSON yoksa güvenli geri dönüş.

### KurtsPerpectivePlugin

- **Amaç:** Y konumuna göre karakter ölçeği (harita veya ekran). **Sadece görsel** — çarpışma değişmez.
- **Durum:** Birçok projede kapalıdır; efekt istenirse açılır.

### KurtsKeyMapper

- **Amaç:** **Etkileşim** tuşu (E, Space, Enter vb. — fare yine çalışır) ve **hareket** düzeni (oklar / WASD).

### KurtsInteractionRangePlugin

- **Amaç:** Oyuncunun olayı tetikleyebileceği alanı **yön başına** genişletme; isteğe bağlı **yüz yönü** kuralları; isteğe bağlı **etkileşim** ikonu.
- **Not etiketi:** `<interactionRange:URDL[ek]>` — dört rakam = yukarı, sağ, aşağı, sol karo mesafesi; isteğe bağlı `u` `d` `l` `r` ikonun hangi yönlerde görüneceği (örn. `lu`).
- **İkonu gizle:** Notlara `<noInteractIcon>`.
- **Parametreler:** Debug günlüğü, ikon görseli (`img/system/`), ikon Y ofseti, etkileşim başlangıcı sprite yüksekliğine göre %.

### KurtsShakePlugin

- **Script:** `$gamePlayer.startShake(güç, hız, süre);` — sadece **oyuncu sprite’ı** (kamera değil).  
- Örnek: `$gamePlayer.startShake(4, 10, 20);`

### KurtsMouseWheelZoom

- **Amaç:** **Scene_Map** üzerinde tekerlek zoom; **1280** referans genişliğine göre **faktör** — farklı çözünürlüklerde benzer dünya alanı.
- **Script:** `resetMapZoom()`, `setMapZoom(faktör)`, `getMapZoom()`.
- **Ara sahne haritaları:** Haritanın **görünen adı** `cutscene` ile başlıyorsa (büyük/küçük harf fark etmez) bu eklenti **devreye girmez** (tekerlek zoom yok, o haritada varsayılan paralaks davranışı).
- **Parametreler:** Min/max faktör, adım, yumuşaklık, **Disable During Events** (sadece ana harita yorumlayıcısı — Paralel engellemez), **Disable During Message** (diyalog / mesaj penceresi / kaydırma metni açıkken engeller).

### KurtsCameraLag

- **Amaç:** Kamera oyuncuya doğru yumuşak yaklaşır; zoom belirli bir **ölçekli** eşiğin altındayken haritaya **ortalanmış** “sabit” mod olabilir.
- **Seçenekler menüsü:** **KurtsOptionsMenu** ile birlikte `ConfigManager.cameraLag` kullanılır.

### KurtsMapForeground

- **Amaç:** `img/pictures/` katmanlarını karakterlerin **üstünde** çizer; paralaks gibi hizalama (resmin sağ altı = haritanın sağ altı); genel ofset parametreleri.
- **Harita notu:** `<foreground:resimAdı>` (birden fazla satır mümkün).
- **Show Picture / Move Picture ile kontrol edilmez** — yalnızca **Script**:
  - `setForegroundOpacity("ad", 0–255)` veya `"all"`
  - `fadeForeground("ad", hedefOpaklık, kare)`
  - `isForegroundFading("ad")`
- **Sıra:** MouseWheelZoom ve CameraLag’dan sonra.

### KurtsFPSLogger

- **Amaç:** Tarayıcı konsolunda (F8) isteğe bağlı **saniyede bir** FPS günlüğü; **FPS limiti** `ConfigManager.fpsLimit` ile seçeneklerden.

### KurtsOptionsMenu

- **Amaç:** Özel başlık / seçenek / oyun menüsü (ör. `fonts/RoyalnCurvy.ttf`, `img/pictures/menuBg.png`), **çözünürlük** listesi (16:9), **FPS sınırı**, **kamera gecikmesi** kaydırıcısı, **hareket** ve **eylem** kontrolleri (KurtsKeyMapper / ConfigManager ile).
- **Şundan sonra yükleyin:** KurtsCameraLag, KurtsKeyMapper, KurtsFPSLogger.

### KurtsTranslationTooltip

- **Amaç:** **Metin göster** içinde `\TR<görünen metin|ipucu metni>` — sol kısım stilli (varsayılan altın + alt çizgi); fareyle üzerine gelince çeviri kutusu.
- **Parametreler:** Kutu resmi adı, yazı boyutu, renk, Y ofseti, **Match Resolution UI Scaling** (KurtsResolutionPictures ile bağlantı).
- **Şundan sonra:** KurtsResolutionPictures (önerilir).

### KurtsPlayerDefaults

- **Amaç:** Yeni oyunda ve **her harita transferinden sonra** hareket hızı, sıklık, yön (isteğe bağlı) ve **Through** uygular.
- **Ek:** **Farklı haritaya** geçerken `$gamePlayer.setTransparent(false)` yapar; ara sahnede gizlenen oyuncu bir sonraki haritada görünmez kalmaz.

### KurtsResolutionPictures

- **Referans boyutu:** Varsayılan **1280×720** (parametreler: Reference Width / Height). **Resim göster / taşı** komutlarındaki **x, y ve ölçek %** bu uzayda yorumlanır; gerçek çözünürlük ve **ekran zoom** için dönüştürülür.
- **Mesaj penceresi:** Yükseklik, dolgu, yazı tipi ve **satır yüksekliği** ölçeklenir; düşük çözünürlükte satır üst üste binmez; **isim kutusu** uyumludur.
- **Kaçış kodları:** `\PX[n]` ve `\PY[n]` referans ile mevcut kutu boyutuna göre konumlar.
- **Script API:** `window.KurtsResolutionUiScale()` → `Graphics.boxHeight / Reference Height` — özel arayüz veya diğer eklentiler için.

---

## Ara sahneler, resimler ve script

**KurtsResolutionPictures** açıkken **resimler** için düzen koordinat sistemi genelde **1280×720** (veya ayarladığınız referans) kabul edilir.

### 1. “Cutscene” haritaları ve zoom

- Harita **Görünen Ad**ını **`cutscene`** ile başlatın; **KurtsMouseWheelZoom** o haritada tamamen atlanır (tekerlek zoom yok, eklentinin kare başına zoom’u yok).
- Karo hareketi yerine resimle anlatılan sahneler için uygundur.

### 2. Script bloklarında resim yardımcıları

Üstte küçük fonksiyonlar tanımlayıp çağırmak yaygın bir kalıptır:

```javascript
function picShow(id, name, origin, x, y, scalePct, opacity) {
    $gameScreen.showPicture(id, name, origin, x, y, scalePct, scalePct, opacity, 0);
}
function picMove(id, origin, x, y, scalePct, opacity, duration) {
    $gameScreen.movePicture(id, origin, x, y, scalePct, scalePct, opacity, 0, duration);
}
function picErase(id) {
    $gameScreen.erasePicture(id);
}
```

- **x, y, scalePct** **referans** uzayındadır; eklenti bunları mevcut çözünürlük ve zoom için dönüştürür.
- **Ekran kararma:** transfer veya resim hazırlığında **Ekranı Karart** (221) / **Ekranı Aç** (222).
- **Bekleme:** gecikmeler için olay **Bekle** komutlarını kullanın; tek bir Script bloğunda `this.wait()` kullanımı yorumlayıcı zamanlamasını bilmeden güvenilir değildir (aşağıya bakın).

### 3. Ara sahnede oyuncuyu gizleme

- **Script:** `$gamePlayer.setTransparent(true);` — oyuncu görünmez, olaylar çalışabilir.
- **Önemli:** **Oyuncuyu transfer et** öncesi veya varış haritasında `$gamePlayer.setTransparent(false);` kullanın **veya** harita değişiminde bunu yapan **KurtsPlayerDefaults**’a güvenin.

### 4. Paralel vs Otomatik; “olay çalışıyor” vs zoom

- Kapatılmayan **Otomatik çalıştır** haritayı kilitler; döngüler için **Paralel işlem** veya Otomatik + öz anahtar + boş ikinci sayfa tercih edin.
- **KurtsMouseWheelZoom** “Disable During Events” seçeneği **ana harita yorumlayıcısını** (`$gameMap._interpreter`) kullanır, `isEventRunning()` değil; bu yüzden **Paralel** olaylar tekerlek zoom’u aynı şekilde engellemez.

### 5. Mesaj metni ve yerleşim

- **KurtsResolutionPictures:** mesaj ve isim kutusu çözünürlükle ölçeklenir; piksel hassasiyeti için **\PX[n]** ve **\PY[n]** kullanın.
- **KurtsTranslationTooltip:** `\TR<Yabancı kelimeler|Türkçe açıklama>` — mesaj başına birden fazla; ipucu görseli `img/pictures/` altında.

### 6. Ön plan (oda katmanı) vs resimler

- **Resim göster** = ekran resim yığını (ara sahneler, Arayüz için uygun).
- **Harita ön planı** = haritaya bağlı, oyuncunun **üstünde** çizilir; harita notu `<foreground:ad>` ve yalnızca **KurtsMapForeground** script fonksiyonları ile kontrol.

### 7. Oynanışta kamera ve zoom

- **Tekerlek zoom** ve **kamera gecikmesi** birlikte çalışır; güçlü zoom-out’ta gecikme eklentisi kamerayı haritaya **ortalar** (**Center Zoom Threshold**’a bakın).
- **Script:** **KurtsMouseWheelZoom** ile `setMapZoom(faktör)`, `resetMapZoom()`, `getMapZoom()`.

### 8. Efektler

- **Sarsıntı:** `$gamePlayer.startShake(güç, hız, süre);` (**KurtsShakePlugin**).

### 9. İsteğe bağlı: script’te tekerlek

- **Koşul dalı → Script** içinde `TouchInput.wheelY` özel mantık için kullanılabilir; tekerlek aynı zamanda haritada KurtsMouseWheelZoom tarafından da kullanılır (eklenti kurallarına göre).

---

## Kurulum

1. İstediğiniz `Kurts*.js` dosyalarını `js/plugins/` içine kopyalayın.
2. RPG Maker MZ → **Araçlar** → **Eklenti Yöneticisi** → eklentileri ekleyin/açın.
3. **Eklenti sırasını** yukarıdaki gibi ayarlayın.
4. **KurtsOptionsMenu** kullanıyorsanız beklenen varlıkları ekleyin (`fonts/`, `img/pictures/menuBg.png` vb.).
5. **KurtsAnimationPlugin** için `img/characters/` altına `$` görselleri ve isteğe bağlı JSON ekleyin.

---

## Uyumluluk ve sorun giderme

- **Motor:** RPG Maker MZ.
- **F8 konsolu:** **KurtsFPSLogger**, **KurtsInteractionRangePlugin** debug ve genel hatalar için.
- **Düşük çözünürlükte mesaj satırlarının üst üste binmesi:** **KurtsResolutionPictures** içinde ölçekli yazı ile `calcTextHeight` uyumu giderilir; eklentiyi açık tutun ve Reference Height’ı tasarımınıza göre ayarlayın.
- **Ara sahneden sonra görünmez oyuncu:** transfer öncesi `setTransparent(false)` veya **KurtsPlayerDefaults**.
- **Eklenti çakışması:** önce **yükleme sırasını** değiştirin; sonra `Game_Screen` resimleri, `Window_Message` veya `Game_Map` kaydırmasını değiştiren başka eklentilere bakın.

---

## Lisans

RPG Maker MZ projelerinde olduğu gibi kullanım için sağlanmıştır; oyunlarınız için değiştirebilirsiniz.

---

**Furkan Kurt tarafından oluşturulmuştur.**
