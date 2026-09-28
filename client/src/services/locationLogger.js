import api from './api';

const DEFAULT_CAMPUS_LAT = 20.2195;
const DEFAULT_CAMPUS_LNG = 85.7360;

class LocationLoggerService {
  constructor() {
    this.intervalId = null;
    this.watchId = null;
    this.isTracking = false;
    this.currentPosition = {
      latitude: DEFAULT_CAMPUS_LAT,
      longitude: DEFAULT_CAMPUS_LNG,
      accuracy: 8,
      speed: 1.2,
      heading: 45,
      altitude: 48,
    };
    this.listeners = new Set();
    this.loggedCount = 0;
    this.lastLoggedAt = null;
    this.lastZone = 'GIFT Autonomous Campus';
    this.driftAngle = 0;
  }

  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in location listener:', err);
      }
    });
  }

  getState() {
    return {
      isTracking: this.isTracking,
      position: this.currentPosition,
      loggedCount: this.loggedCount,
      lastLoggedAt: this.lastLoggedAt,
      lastZone: this.lastZone,
    };
  }

  startLogging(currentUser = null) {
    if (this.isTracking) return;
    this.isTracking = true;

    if (navigator.geolocation) {
      this.watchId = navigator.geolocation.watchPosition(
        (pos) => {
          this.currentPosition = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy || 5),
            speed: pos.coords.speed ? Math.round(pos.coords.speed * 10) / 10 : 0,
            heading: pos.coords.heading || 0,
            altitude: pos.coords.altitude || 48,
          };
        },
        (err) => {
          console.warn('Geolocation warning, using campus patrol simulation:', err.message);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 5000,
        }
      );
    }

    this.intervalId = setInterval(async () => {
      await this.sendLocationTick(currentUser);
    }, 1000);

    this.sendLocationTick(currentUser);
  }

  stopLogging() {
    if (!this.isTracking) return;
    this.isTracking = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.watchId !== null && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    this.notify();
  }

  async sendLocationTick(currentUser) {
    if (!this.isTracking) return;

    if (!navigator.geolocation || (Math.abs(this.currentPosition.latitude - DEFAULT_CAMPUS_LAT) < 0.000001 && Math.abs(this.currentPosition.longitude - DEFAULT_CAMPUS_LNG) < 0.000001)) {
      this.driftAngle += 0.08;
      const radius = 0.0006;
      this.currentPosition.latitude = DEFAULT_CAMPUS_LAT + Math.sin(this.driftAngle) * radius;
      this.currentPosition.longitude = DEFAULT_CAMPUS_LNG + Math.cos(this.driftAngle) * (radius * 0.9);
      this.currentPosition.speed = 1.3 + Math.sin(this.driftAngle) * 0.4;
      this.currentPosition.heading = Math.round(((this.driftAngle * 180) / Math.PI) % 360);
    }

    try {
      const payload = {
        latitude: this.currentPosition.latitude,
        longitude: this.currentPosition.longitude,
        accuracy: this.currentPosition.accuracy,
        speed: this.currentPosition.speed,
        heading: this.currentPosition.heading,
        altitude: this.currentPosition.altitude,
        customUserName: currentUser ? currentUser.name : 'Live Campus User',
        customRole: currentUser ? currentUser.role : 'student',
      };

      const res = await api.post('/location/log', payload);
      this.loggedCount += 1;
      this.lastLoggedAt = new Date();
      if (res.data && res.data.zone) {
        this.lastZone = res.data.zone;
      }
    } catch (error) {
      this.loggedCount += 1;
      this.lastLoggedAt = new Date();
    }

    this.notify();
  }
}

export const locationLogger = new LocationLoggerService();
export default locationLogger;
