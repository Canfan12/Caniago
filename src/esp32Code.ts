export const esp32Code = `/*
 * ESP32 / ESP8266 - Web Server & API for Dashboard
 * Kontrol 4 Relay + Sensor Suhu & Kelembaban DHT11
 * + Mode Variasi Running Light (1->2->3->4 dan 4->3->2->1)
 *
 * Library: ArduinoJson, DHT sensor library, WebServer (ESP32) / ESP8266WebServer (ESP8266)
 */

#ifdef ESP32
  #include <WiFi.h>
  #include <WebServer.h>
#else
  #include <ESP8266WiFi.h>
  #include <ESP8266WebServer.h>
#endif

#include <ArduinoJson.h>
#include <DHT.h>

// =============================================
// KONFIGURASI WIFI
// =============================================
const char* ssid     = "NAMA_WIFI_ANDA";
const char* password = "PASSWORD_WIFI_ANDA";

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
#endif

bool relayState[4] = {false, false, false, false};

// Variabel Mode Variasi
int  modeVariasi    = 0;   // 0=off, 1=variasi1, 2=variasi2
int  variasiStep    = 0;
unsigned long lastVariasiTime = 0;
const unsigned long VARIASI_DELAY = 50; // ms

// =============================================
// FUNGSI KONTROL RELAY
// =============================================
void setRelay(int index, bool state) {
  if (index < 0 || index > 3) return;
  relayState[index] = state;
  digitalWrite(relayPin[index], state ? LOW : HIGH);
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
// CORS HEADER
// =============================================
void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "*");
}

// =============================================
// ENDPOINT HANDLERS
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
    
    if (modeVariasi == 0) allRelayOff();
    
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
    digitalWrite(relayPin[i], HIGH); // Asumsi aktif LOW, ubah jika perlu
  }

  dht.begin();

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password);

  Serial.print("Menghubungkan ke WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\\nWiFi Terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Routing
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
  server.handleClient();
  runVariasi(); // Animasi non-blocking
}
`;
