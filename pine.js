//@version=5
indicator("Sakin Grafik: EMA, Yıllık-Aylık-Haftalık Açılış, RSI", overlay=true)

// ==========================================
// --- ZAMAN DİLİMİ KONTROLLERİ ---
// ==========================================
// 4 saat = 14400 saniye. Grafik 4 saat ve üzeriyse Yıllık çizgi görünür.
goster_yil_cizgisini = (timeframe.in_seconds() >= 14400)
// 1 saat = 3600 saniye. Grafik 1 saat ve üzeriyse Aylık çizgi görünür.
goster_ay_cizgisini  = (timeframe.in_seconds() >= 3600)

// ==========================================
// --- GÜVENLİ ZAMAN VE FİYAT VERİLERİ ---
// ==========================================
// En son aktif dönemlerin başlangıç zamanları (Zaman koordinatı için kesin veriler)
yil_baslangici   = request.security(syminfo.tickerid, "12M", time, lookahead=barmerge.lookahead_on)
ay_baslangici    = request.security(syminfo.tickerid, "M",   time, lookahead=barmerge.lookahead_on)
hafta_baslangici = request.security(syminfo.tickerid, "W",   time, lookahead=barmerge.lookahead_on)

// En son aktif dönemlerin açılış fiyatları
yo = request.security(syminfo.tickerid, "12M", open, lookahead=barmerge.lookahead_on)
mo = request.security(syminfo.tickerid, "M",   open, lookahead=barmerge.lookahead_on)
wo = request.security(syminfo.tickerid, "W",   open, lookahead=barmerge.lookahead_on)

// ==========================================
// --- GİRDİLER VE EMA ---
// ==========================================
show50  = input.bool(true,  "EMA 50 Göster")
show200 = input.bool(true,  "EMA 200 Göster")
plot(show50  ? ta.ema(close, 50)  : na, color=color.orange, title="EMA 50", linewidth=1)
plot(show200 ? ta.ema(close, 200) : na, color=color.red,    title="EMA 200", linewidth=1)

// ==========================================
// --- KESİNTİSİZ ÇİZGİLER, ETİKETLER VE HAFTALIK LİMİTLER ---
// ==========================================
// NOT: Geçmişe dönük basamaklar çizen tüm "plot" fonksiyonları kaldırılmıştır.
var line lineYO = na
var line lineMO = na
var line lineWO = na
var line lineHigh = na
var line lineLow = na

var label lblYO = label.new(na, na, "Y", color=color.new(#0043fd, 0), textcolor=color.white, style=label.style_label_left, size=size.normal, xloc=xloc.bar_time)
var label lblMO = label.new(na, na, "M", color=color.new(#028dff, 0), textcolor=color.white, style=label.style_label_left, size=size.normal, xloc=xloc.bar_time)
var label lblWO = label.new(na, na, "W", color=color.new(#79c6f3, 0), textcolor=color.black, style=label.style_label_left, size=size.small, xloc=xloc.bar_time)

if barstate.islast
    int bar_ms = nz(time - time[1], 60000)
    int x2_time = time + (bar_ms * 14)
    
    // Her yeni barda eski çizgileri silerek sadece en güncel olanı tutar
    line.delete(lineYO)
    line.delete(lineMO)
    line.delete(lineWO)
    line.delete(lineHigh)
    line.delete(lineLow)
    
    // 1. SADECE SON AKTİF YILIN AÇILIŞ ÇİZGİSİ
    if goster_yil_cizgisini and not na(yil_baslangici) and not na(yo)
        lineYO := line.new(yil_baslangici, yo, x2_time, yo, xloc=xloc.bar_time, color=color.new(#2904ce, 0), width=1, style=line.style_solid)
        label.set_xy(lblYO, x2_time, yo)
    else
        label.set_xy(lblYO, na, na)

    // 2. SADECE SON AKTİF AYIN AÇILIŞ ÇİZGİSİ
    if goster_ay_cizgisini and not na(ay_baslangici) and not na(mo)
        lineMO := line.new(ay_baslangici, mo, x2_time, mo, xloc=xloc.bar_time, color=color.new(#028dff, 0), width=1, style=line.style_solid)
        label.set_xy(lblMO, x2_time, mo)
    else
        label.set_xy(lblMO, na, na)

    // 3. SADECE SON AKTİF HAFTANIN AÇILIŞ VE LİMİT ÇİZGİLERİ
    if not na(hafta_baslangici) and not na(wo)
        lineWO := line.new(hafta_baslangici, wo, x2_time, wo, xloc=xloc.bar_time, color=color.new(#79c6f3, 0), width=1, style=line.style_solid)
        label.set_xy(lblWO, x2_time, wo)
        
        float gercek_haftalik_high = high
        float gercek_haftalik_low  = low
        
        for i = 0 to 5000
            if na(time[i]) or time[i] < hafta_baslangici
                break
            if high[i] > gercek_haftalik_high
                gercek_haftalik_high := high[i]
            if low[i] < gercek_haftalik_low
                gercek_haftalik_low := low[i]
        
        lineHigh := line.new(hafta_baslangici, gercek_haftalik_high, x2_time, gercek_haftalik_high, xloc=xloc.bar_time, color=color.new(color.yellow, 50), width=1, style=line.style_dashed)
        lineLow  := line.new(hafta_baslangici, gercek_haftalik_low,  x2_time, gercek_haftalik_low,  xloc=xloc.bar_time, color=color.new(color.yellow, 50), width=1, style=line.style_dashed)
    else
        label.set_xy(lblWO, na, na)

// ==========================================
// --- RSI UYUMSUZLUK ---
// ==========================================
rsiVal  = ta.rsi(close, 14)
lbLeft  = 5, lbRight = 5
rsiDIP  = ta.pivotlow(rsiVal, lbLeft, lbRight)
rsiTEPE = ta.pivothigh(rsiVal, lbLeft, lbRight)

var int lastDipBar = na, var float lastDipRsi = na, var float lastDipPrice = na
if not na(rsiDIP)
    if rsiVal[lbRight] > lastDipRsi and low[lbRight] < lastDipPrice
        line.new(lastDipBar, lastDipPrice, bar_index - lbRight, low[lbRight], color=color.new(color.green, 0), width=1)
    lastDipBar := bar_index - lbRight, lastDipRsi := rsiVal[lbRight], lastDipPrice := low[lbRight]

var int lastTepeBar = na, var float lastTepeRsi = na, var float lastTepePrice = na
if not na(rsiTEPE)
    if rsiVal[lbRight] < lastTepeRsi and high[lbRight] > lastTepePrice
        line.new(lastTepeBar, lastTepePrice, bar_index - lbRight, high[lbRight], color=color.new(color.red, 0), width=1)
    lastTepeBar := bar_index - lbRight, lastTepeRsi := rsiVal[lbRight], lastTepePrice := high[lbRight]
