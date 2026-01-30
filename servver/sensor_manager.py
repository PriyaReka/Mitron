import serial
import time
import threading
import random

# Configuration
PORT = "COM9"
BAUD = 9600
RETRY_DELAY = 3       # seconds between reconnect attempts
SILENCE_TIMEOUT = 6   # seconds with no data -> force reconnect

class SensorManager:
    def __init__(self):
        self.running = False
        self.thread = None
        self.latest_data = {
            "WATER": 0,
            "SOIL": 0,
            "N": 0,
            "P": 0,
            "K": 0,
            "PH": 0.0,
            "TEMP": 0.0,
            "HUM": 0.0
        }
        self.status = "Disconnected"
        self.last_update_time = 0

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._run_loop, daemon=True)
            self.thread.start()
            print("[SensorManager] Started background thread")

    def stop(self):
        self.running = False
        if self.thread:
            self.thread.join(timeout=1)
            print("[SensorManager] Stopped background thread")

    def get_data(self):
        # Check for staleness
        is_stale = (time.time() - self.last_update_time) > SILENCE_TIMEOUT
        
        # If disconnected or stale, we might want to return mock data if in DEV mode
        # or simply return the last known values with a "stale" flag.
        # For this implementation, we returning the dict as is, but you could add a 'connected' key.
        return {
            **self.latest_data,
            "status": self.status if not is_stale else "Stale/Connecting",
            "last_updated": self.last_update_time
        }

    def _connect(self):
        while self.running:
            try:
                print(f"[SensorManager] Connecting to {PORT}...")
                ser = serial.Serial(PORT, BAUD, timeout=1)
                ser.reset_input_buffer()
                ser.reset_output_buffer()
                print(f"[SensorManager] [✔] Connected to ESP32 on {PORT}")
                self.status = "Connected"
                return ser
            except Exception as e:
                self.status = "Disconnected"
                # print(f"[SensorManager] Connection failed: {e}")
                
                # --- MOCK MODE FOR DEV (Uncomment when testing without hardware) ---
                # self._generate_mock_data()
                # time.sleep(1)
                # continue
                # -----------------------------------------------------------------
                
                time.sleep(RETRY_DELAY)

    def _generate_mock_data(self):
        """Generates random data for testing when hardware is missing"""
        self.latest_data = {
            "WATER": random.randint(50, 80),
            "SOIL": random.randint(300, 700),
            "N": random.randint(80, 150),
            "P": random.randint(30, 60),
            "K": random.randint(40, 140),
            "PH": round(random.uniform(5.5, 7.5), 1),
            "TEMP": round(random.uniform(20, 35), 1),
            "HUM": round(random.uniform(30, 80), 1)
        }
        self.last_update_time = time.time()
        self.status = "Mock Data"

    def _run_loop(self):
        while self.running:
            ser = self._connect()
            if not ser:
                continue

            last_data_time = time.time()
            
            while self.running:
                try:
                    if ser.in_waiting:
                        line = ser.readline().decode(errors="ignore").strip()
                        if line:
                            self._parse_line(line)
                            last_data_time = time.time()
                            self.last_update_time = time.time()

                    # Watchdog
                    if time.time() - last_data_time > SILENCE_TIMEOUT:
                        print("[SensorManager] Silence timeout, reconnecting...")
                        break # Break inner loop to reconnect

                except serial.SerialException as e:
                    print(f"[SensorManager] Connection lost: {e}")
                    break
                except Exception as e:
                    print(f"[SensorManager] Error: {e}")
                    break
                
                time.sleep(0.1)  # tiny sleep to prevent CPU hogging

            try:
                ser.close()
            except:
                pass
            self.status = "Disconnected"

    def _parse_line(self, line):
        # Expected format: "WATER=68;SOIL=658;N=98;..."
        try:
            pairs = line.split(";")
            for pair in pairs:
                if "=" in pair:
                    key, val = pair.split("=")
                    key = key.strip().upper()
                    val = val.strip()
                    
                    # Convert to float/int
                    try:
                        if "." in val:
                            self.latest_data[key] = float(val)
                        else:
                            self.latest_data[key] = int(val)
                    except:
                        pass # Ignore parse errors for specific values
        except Exception as e:
            print(f"[SensorManager] Parse error: {e}")

# Global instance
sensor_manager = SensorManager()
