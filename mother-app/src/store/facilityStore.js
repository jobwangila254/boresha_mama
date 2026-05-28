import AsyncStorage from '@react-native-async-storage/async-storage';

const FACILITIES_CACHE_KEY = 'cached_facilities';
const CACHED_AT_KEY = 'facilities_cached_at';

export const facilityStore = {
  async cacheFacilities(facilities) {
    await AsyncStorage.setItem(FACILITIES_CACHE_KEY, JSON.stringify(facilities));
    await AsyncStorage.setItem(CACHED_AT_KEY, new Date().toISOString());
  },

  async getCachedFacilities() {
    const data = await AsyncStorage.getItem(FACILITIES_CACHE_KEY);
    return data ? JSON.parse(data) : [];
  },

  async getCachedAt() {
    return await AsyncStorage.getItem(CACHED_AT_KEY);
  },

  async clearCache() {
    await AsyncStorage.removeItem(FACILITIES_CACHE_KEY);
    await AsyncStorage.removeItem(CACHED_AT_KEY);
  },
};
