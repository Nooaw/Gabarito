export const Filesystem = {
  readFile: async () => { throw new Error('Filesystem não disponível no navegador'); },
  writeFile: async () => { throw new Error('Filesystem não disponível no navegador'); },
  deleteFile: async () => { throw new Error('Filesystem não disponível no navegador'); },
  mkdir: async () => { throw new Error('Filesystem não disponível no navegador'); },
  readdir: async () => { throw new Error('Filesystem não disponível no navegador'); },
  getUri: async () => ({ uri: '' }),
  stat: async () => { throw new Error('Filesystem não disponível no navegador'); },
  rename: async () => { throw new Error('Filesystem não disponível no navegador'); }
};

export const Directory = { Documents: 'DOCUMENTS', Data: 'DATA', Cache: 'CACHE', External: 'EXTERNAL' };
export const Encoding = { UTF8: 'utf8' };
