# Proje Bağlamı — Proof-Based Portfolio Platform

Bu projede tüm kod iki yaşayan dokümana bağlı kalınarak yazılır.
Her görevden önce ikisi de okunur.

## Kaynaklar

- `docs/prd.md` — **Tek doğruluk kaynağı (SSoT).** Vizyon, mimari kararlar,
  veri modeli, UI bileşenleri, sprint planı, risk yönetimi. Yaşayan doküman:
  her sprint sonunda ve her mimari değişiklikte güncellenir.
- `docs/implementation-plan.md` — Kod seviyesinde yol haritası. Her madde
  dosya yolu, fonksiyon imzası, bağımlılık ve kabul kriteri içerir.

## Çalışma Kuralları

1. **Her görevden önce ikisini de oku.** PRD bağlamı, plan eylemi verir.
2. **PRD tek doğruluk kaynağıdır.** PRD ile plan/kod arasında çelişki varsa
   PRD esastır — bana bildir, plan veya kodu PRD'ye uydururuz.
3. **Plan maddelerine sadık kal.** Bir madde üzerinde çalışırken o maddedeki
   dosya yolu, fonksiyon imzası ve kabul kriterini birebir uygula.
4. **Kapsam dışına çıkma.** PRD'de tanımlı olmayan davranış, plan'da olmayan
   dosya/fonksiyon ekleme — önce sor.
5. **Kabul kriterini doğrula.** Bir maddeyi tamamladığında ilgili kabul
   kriterini açıkça kontrol et, karşılandığını belirt.
6. **Sapma gerekirse durup sor.** Teknik engel, eksik bilgi veya daha iyi
   bir yaklaşım gördüğünde uygulamadan önce bildir; PRD/plan güncellensin,
   sonra koda geç.
7. **İz bırak.** Yazdığın kodun hangi PRD bölümünü ve hangi plan maddesini
   karşıladığını kısaca belirt (commit mesajı veya yanıt başında).

## Yaşayan Doküman Disiplini

PRD ve plan değişebilir. Bir görevde dokümanların güncellenmesi gerektiğini
fark edersen (ör. yeni mimari karar, plan maddesinin yetersiz kalması), bana
söyle — kodla birlikte doküman güncellemesini de öneririm.