export const Share = {
  share: async (options) => {
    if (navigator.share) {
      try {
        await navigator.share(options);
        return { activityType: 'web-share' };
      } catch (e) {
        throw e;
      }
    }
    throw new Error('Compartilhamento não suportado neste navegador');
  },
  canShare: async () => ({ value: !!navigator.share })
};
