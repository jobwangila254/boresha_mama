import AsyncStorage from '@react-native-async-storage/async-storage';

const OFFLINE_VISITS_KEY = 'offline_visits';
const OFFLINE_REGISTRATIONS_KEY = 'offline_registrations';

export const offlineStore = {
  async saveVisit(visit) {
    const visits = await this.getOfflineVisits();
    visits.push({ ...visit, _localId: Date.now().toString(), _savedAt: new Date().toISOString() });
    await AsyncStorage.setItem(OFFLINE_VISITS_KEY, JSON.stringify(visits));
  },

  async getOfflineVisits() {
    const data = await AsyncStorage.getItem(OFFLINE_VISITS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async clearSyncedVisits() {
    await AsyncStorage.setItem(OFFLINE_VISITS_KEY, JSON.stringify([]));
  },

  async saveRegistration(registration) {
    const regs = await this.getOfflineRegistrations();
    regs.push({ ...registration, _localId: Date.now().toString(), _savedAt: new Date().toISOString() });
    await AsyncStorage.setItem(OFFLINE_REGISTRATIONS_KEY, JSON.stringify(regs));
  },

  async getOfflineRegistrations() {
    const data = await AsyncStorage.getItem(OFFLINE_REGISTRATIONS_KEY);
    return data ? JSON.parse(data) : [];
  },

  async clearSyncedRegistrations() {
    await AsyncStorage.setItem(OFFLINE_REGISTRATIONS_KEY, JSON.stringify([]));
  },

  async getSyncStatus() {
    const visits = await this.getOfflineVisits();
    const registrations = await this.getOfflineRegistrations();
    return {
      pendingVisits: visits.length,
      pendingRegistrations: registrations.length,
      totalPending: visits.length + registrations.length,
    };
  },
};
