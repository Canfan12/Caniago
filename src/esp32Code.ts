export const esp32Code = `/*
 * ESP32 / ESP8266 - Web Server & Telegram Bot
 * Kontrol 4 Relay + Sensor Suhu & Kelembaban DHT11
 * + Mode Variasi Running Light (1->2->3->4 dan 4->3->2->1)
 * + Notifikasi Telegram (Boot & Perubahan Web)
 *
 * Library yang dibutuhkan (install via Library Manager):
 *  - UniversalTelegramBot by Brian Lough
 *  - ArduinoJson
 *  - DHT sensor library by Adafruit
 *  - Adafruit Unified Sensor
 */

#ifdef ESP32
  #include <WiFi.h>
  #include <WebServer.h>
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
#endif
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <DHT.h>

// =============================================
// KONFIGURASI WIFI & TELEGRAM
// =============================================
const char* ssid     = "miki";
const char* password = "12345678";

#define BOTtoken  "8713655585:AAHg-uGCdBp8IewB5-0aQWc5HE60yuCKOog"
#define CHAT_ID   "1759241045"

// =============================================
// KONFIGURASI PIN
// =============================================
const int relayPin[4] = {5, 18, 19, 23};  // GPIO untuk Relay 1-4

#define DHTPIN  4
#define DHTTYPE DHT11

// =============================================
// INISIALISASI
// =============================================
DHT dht(DHTPIN, DHTTYPE);

#ifdef ESP32
  WebServer server(80);
#else
  ESP8266WebServer server(80);
  X509List cert(TELEGRAM_CERTIFICATE_ROOT);
#endif

WiFiClientSecure client;
UniversalTelegramBot bot(BOTtoken, client);

bool relayState[4] = {false, false, false, false};
String relayName[4] = {"Relay 1", "Relay 2", "Relay 3", "Relay 4"};

int botRequestDelay = 1000;
unsigned long lastTimeBotRan = 0;

// Variabel Mode Variasi
int  modeVariasi    = 0;   // 0=off, 1=variasi1, 2=variasi2
int  variasiStep    = 0;
unsigned long lastVariasiTime = 0;
const unsigned long VARIASI_DELAY = 50; // ms

// =============================================
// FUNGSI NOTIFIKASI TELEGRAM
// =============================================
void sendTelegramNotification(String message) {
  bot.sendMessage(CHAT_ID, message, "Markdown");
}

// =============================================
// FUNGSI KONTROL RELAY
// =============================================
void setRelay(int index, bool state) {
  if (index < 0 || index > 3) return;
  relayState[index] = state;
  digitalWrite(relayPin[index], state ? LOW : HIGH); // Asumsi relay aktif LOW
}

void allRelayOff() {
  for (int i = 0; i < 4; i++) setRelay(i, false);
}

void runVariasi() {
  if (modeVariasi == 0) return;
  if (millis() - lastVariasiTime < VARIASI_DELAY) return;
  lastVariasiTime = millis();

  allRelayOff();

  if (modeVariasi == 1) {
    setRelay(variasiStep, true);
    variasiStep = (variasiStep + 1) % 4;
  }
  else if (modeVariasi == 2) {
    setRelay(3 - variasiStep, true);
    variasiStep = (variasiStep + 1) % 4;
  }
}

// =============================================
// FUNGSI BACA SENSOR (UNTUK TELEGRAM)
// =============================================
String getSensorData() {
  float suhu       = dht.readTemperature();
  float kelembaban = dht.readHumidity();

  if (isnan(suhu) || isnan(kelembaban)) {
    return "❌ Gagal membaca sensor DHT11. Periksa koneksi sensor.";
  }

  String msg = "🌡️ *Data Sensor DHT11*\\n";
  msg += "──────────────────\\n";
  msg += "🔆 Suhu      : " + String(suhu, 1) + " °C\\n";
  msg += "💧 Kelembaban: " + String(kelembaban, 1) + " %\\n";

  if (suhu >= 35)      msg += "\\n⚠️ Peringatan: Suhu terlalu tinggi!";
  else if (suhu <= 18) msg += "\\n🥶 Suhu rendah.";
  else                 msg += "\\n✅ Kondisi normal.";

  return msg;
}

// =============================================
// FUNGSI STATUS RELAY (UNTUK TELEGRAM)
// =============================================
String getAllRelayStatus() {
  String msg = "🔌 *Status Relay*\\n";
  msg += "──────────────────\\n";
  for (int i = 0; i < 4; i++) {
    msg += relayName[i] + ": ";
    msg += relayState[i] ? "🟢 ON" : "🔴 OFF";
    msg += "\\n";
  }
  if (modeVariasi > 0) {
    msg += "\\n✨ Mode Variasi " + String(modeVariasi) + " *aktif*";
  }
  return msg;
}

// =============================================
// HANDLER PESAN TELEGRAM
// =============================================
void handleNewMessages(int numNewMessages) {
  Serial.println("handleNewMessages: " + String(numNewMessages));

  for (int i = 0; i < numNewMessages; i++) {
    String chat_id = String(bot.messages[i].chat_id);

    if (chat_id != CHAT_ID) {
      bot.sendMessage(chat_id, "⛔ Akses ditolak. Anda tidak berwenang.", "");
      continue;
    }

    String text      = bot.messages[i].text;
    String from_name = bot.messages[i].from_name;
    Serial.println("Pesan: " + text);

    if (text == "/start" || text == "/help") {
      String welcome = "👋 Halo, " + from_name + "!\\n\\n";
      welcome += "📋 Daftar Perintah:\\n";
      welcome += "──────────────────\\n";
      welcome += "🌡️ Sensor:\\n";
      welcome += "/suhu — Baca suhu & kelembaban\\n\\n";
      welcome += "🔌 Kontrol Relay:\\n";
      welcome += "/relay1_on  — " + relayName[0] + " ON\\n";
      welcome += "/relay1_off — " + relayName[0] + " OFF\\n";
      welcome += "/relay2_on  — " + relayName[1] + " ON\\n";
      welcome += "/relay2_off — " + relayName[1] + " OFF\\n";
      welcome += "/relay3_on  — " + relayName[2] + " ON\\n";
      welcome += "/relay3_off — " + relayName[2] + " OFF\\n";
      welcome += "/relay4_on  — " + relayName[3] + " ON\\n";
      welcome += "/relay4_off — " + relayName[3] + " OFF\\n\\n";
      welcome += "🔁 Semua Relay:\\n";
      welcome += "/all_on  — Nyalakan semua relay\\n";
      welcome += "/all_off — Matikan semua relay\\n";
      welcome += "/status  — Cek status semua relay\\n\\n";
      welcome += "✨ Mode Variasi (jeda 50ms):\\n";
      welcome += "/variasi1 — Running: 1→2→3→4...\\n";
      welcome += "/variasi2 — Running: 4→3→2→1...\\n";
      welcome += "/variasi_stop — Hentikan mode variasi\\n";
      bot.sendMessage(chat_id, welcome, "");
    }

    else if (text == "/suhu") {
      bot.sendMessage(chat_id, getSensorData(), "Markdown");
    }

    else if (text == "/status") {
      bot.sendMessage(chat_id, getAllRelayStatus(), "Markdown");
    }

    else if (text == "/all_on") {
      modeVariasi = 0;
      for (int r = 0; r < 4; r++) setRelay(r, true);
      bot.sendMessage(chat_id, "✅ Semua relay *ON*", "Markdown");
    }

    else if (text == "/all_off") {
      modeVariasi = 0;
      allRelayOff();
      bot.sendMessage(chat_id, "⛔ Semua relay *OFF*", "Markdown");
    }

    else if (text == "/relay1_on") {
      modeVariasi = 0; setRelay(0, true);
      bot.sendMessage(chat_id, "✅ " + relayName[0] + " *ON*", "Markdown");
    }
    else if (text == "/relay1_off") {
      modeVariasi = 0; setRelay(0, false);
      bot.sendMessage(chat_id, "⛔ " + relayName[0] + " *OFF*", "Markdown");
    }

    else if (text == "/relay2_on") {
      modeVariasi = 0; setRelay(1, true);
      bot.sendMessage(chat_id, "✅ " + relayName[1] + " *ON*", "Markdown");
    }
    else if (text == "/relay2_off") {
      modeVariasi = 0; setRelay(1, false);
      bot.sendMessage(chat_id, "⛔ " + relayName[1] + " *OFF*", "Markdown");
    }

    else if (text == "/relay3_on") {
      modeVariasi = 0; setRelay(2, true);
      bot.sendMessage(chat_id, "✅ " + relayName[2] + " *ON*", "Markdown");
    }
    else if (text == "/relay3_off") {
      modeVariasi = 0; setRelay(2, false);
      bot.sendMessage(chat_id, "⛔ " + relayName[2] + " *OFF*", "Markdown");
    }

    else if (text == "/relay4_on") {
      modeVariasi = 0; setRelay(3, true);
      bot.sendMessage(chat_id, "✅ " + relayName[3] + " *ON*", "Markdown");
    }
    else if (text == "/relay4_off") {
      modeVariasi = 0; setRelay(3, false);
      bot.sendMessage(chat_id, "⛔ " + relayName[3] + " *OFF*", "Markdown");
    }

    else if (text == "/variasi1") {
      modeVariasi = 1; variasiStep = 0; lastVariasiTime = 0;
      bot.sendMessage(chat_id, "✨ Mode Variasi 1 aktif\\n➡️ Urutan: 1 → 2 → 3 → 4...\\n⏱ Jeda: 50ms", "Markdown");
    }

    else if (text == "/variasi2") {
      modeVariasi = 2; variasiStep = 0; lastVariasiTime = 0;
      bot.sendMessage(chat_id, "✨ Mode Variasi 2 aktif\\n⬅️ Urutan: 4 → 3 → 2 → 1...\\n⏱ Jeda: 50ms", "Markdown");
    }

    else if (text == "/variasi_stop") {
      modeVariasi = 0;
      allRelayOff();
      bot.sendMessage(chat_id, "⛔ Mode variasi *dihentikan*. Semua relay OFF.", "Markdown");
    }

    else {
      bot.sendMessage(chat_id, "❓ Perintah tidak dikenal. Ketik /start untuk melihat daftar perintah.", "");
    }
  }
}

// =============================================
// HEADER CORS UTK WEB SERVER
// =============================================
void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

// =============================================
// ENDPOINT HANDLERS WEB SERVER
// =============================================
void handleOptions() {
  sendCORSHeaders();
  server.send(204);
}

void handleStatus() {
  float suhu = dht.readTemperature();
  float kelembaban = dht.readHumidity();

  StaticJsonDocument<256> doc;
  
  if (isnan(suhu) || isnan(kelembaban)) {
    doc["error"] = "Gagal membaca DHT11";
  } else {
    doc["temp"] = suhu;
    doc["hum"] = kelembaban;
  }
  
  JsonArray relays = doc.createNestedArray("relays");
  for (int i = 0; i < 4; i++) {
    relays.add(relayState[i]);
  }
  
  doc["mode"] = modeVariasi;

  String response;
  serializeJson(doc, response);
  sendCORSHeaders();
  server.send(200, "application/json", response);
}

void handleRelay() {
  if (server.hasArg("id") && server.hasArg("state")) {
    int id = server.arg("id").toInt();
    int state = server.arg("state").toInt();
    modeVariasi = 0; // Matikan variasi jika relay dikontrol manual
    setRelay(id, state == 1);
    
    // Notifikasi ke Telegram
    String notif = "🌐 *Web Dashboard Control*\\n";
    notif += relayName[id] + " diubah menjadi *" + (state == 1 ? "ON" : "OFF") + "*";
    sendTelegramNotification(notif);
    
    sendCORSHeaders();
    server.send(200, "application/json", "{\\"status\\":\\"ok\\"}");
  } else {
    sendCORSHeaders();
    server.send(400, "application/json", "{\\"error\\":\\"Missing args\\"}");
  }
}

void handleAll() {
  if (server.hasArg("state")) {
    int state = server.arg("state").toInt();
    modeVariasi = 0;
    for (int i = 0; i < 4; i++) {
      setRelay(i, state == 1);
    }
    
    // Notifikasi ke Telegram
    String notif = "🌐 *Web Dashboard Control*\\n";
    notif += "Semua relay diubah menjadi *" + String(state == 1 ? "ON" : "OFF") + "*";
    sendTelegramNotification(notif);
    
    sendCORSHeaders();
    server.send(200, "application/json", "{\\"status\\":\\"ok\\"}");
  } else {
    sendCORSHeaders();
    server.send(400, "application/json", "{\\"error\\":\\"Missing args\\"}");
  }
}

void handleVariasi() {
  if (server.hasArg("mode")) {
    modeVariasi = server.arg("mode").toInt();
    variasiStep = 0;
    lastVariasiTime = 0;
    
    // Notifikasi ke Telegram
    String notif = "🌐 *Web Dashboard Control*\\n";
    if (modeVariasi == 0) {
      allRelayOff();
      notif += "Mode Variasi *dihentikan*. Semua relay *OFF*.";
    } else {
      notif += "Mode Variasi *" + String(modeVariasi) + "* diaktifkan.";
    }
    sendTelegramNotification(notif);
    
    sendCORSHeaders();
    server.send(200, "application/json", "{\\"status\\":\\"ok\\"}");
  } else {
    sendCORSHeaders();
    server.send(400, "application/json", "{\\"error\\":\\"Missing args\\"}");
  }
}

// =============================================
// SETUP
// =============================================
void setup() {
  Serial.begin(115200);

  for (int i = 0; i < 4; i++) {
    pinMode(relayPin[i], OUTPUT);
    digitalWrite(relayPin[i], HIGH); // Mulai OFF (aktif LOW)
  }

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  #ifdef ESP8266
    configTime(0, 0, "pool.ntp.org");
    client.setTrustAnchors(&cert);
  #endif

  #ifdef ESP32
    client.setCACert(TELEGRAM_CERTIFICATE_ROOT);
  #endif

  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Kirim Notifikasi Online ke Telegram
  String bootMsg = "✅ *Sistem ESP Online!*\\n\\n";
  bootMsg += "🌐 IP Address Lokal: " + WiFi.localIP().toString() + "\\n\\n";
  bootMsg += "Ketik /help atau /start untuk melihat daftar perintah kontrol.";
  bot.sendMessage(CHAT_ID, bootMsg, "Markdown");

  // Set up Web Server Routing
  server.on("/", HTTP_OPTIONS, handleOptions);
  server.on("/api/status", HTTP_OPTIONS, handleOptions);
  server.on("/api/relay", HTTP_OPTIONS, handleOptions);
  server.on("/api/all", HTTP_OPTIONS, handleOptions);
  server.on("/api/variasi", HTTP_OPTIONS, handleOptions);
  
  server.on("/api/status", HTTP_GET, handleStatus);
  server.on("/api/relay", HTTP_GET, handleRelay);
  server.on("/api/all", HTTP_GET, handleAll);
  server.on("/api/variasi", HTTP_GET, handleVariasi);

  server.begin();
  Serial.println("HTTP Server siap.");
}

// =============================================
// LOOP
// =============================================
void loop() {
  // 1. Web Server Client Handling
  server.handleClient();
  
  // 2. Animasi Variasi
  runVariasi(); 

  // 3. Telegram Bot Handling
  if (millis() > lastTimeBotRan + botRequestDelay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    while (numNewMessages) {
      Serial.println("Ada pesan masuk!");
      handleNewMessages(numNewMessages);
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
    lastTimeBotRan = millis();
  }
}
`;
