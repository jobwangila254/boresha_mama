const store = {};

const AsyncStorage = {
  getItem: async (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return store[key] ?? null;
    }
  },
  setItem: async (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch {
      store[key] = value;
    }
  },
  removeItem: async (key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      delete store[key];
    }
  },
  clear: async () => {
    try {
      localStorage.clear();
    } catch {
      for (const key in store) delete store[key];
    }
  },
};

export default AsyncStorage;
