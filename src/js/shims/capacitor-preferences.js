export const Preferences = {
  get: async ({ key }) => ({ value: localStorage.getItem(key) }),
  set: async ({ key, value }) => { localStorage.setItem(key, String(value)); },
  remove: async ({ key }) => { localStorage.removeItem(key); },
  clear: async () => { localStorage.clear(); },
  keys: async () => ({ keys: Object.keys(localStorage) })
};
