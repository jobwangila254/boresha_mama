const NetInfo = {
  fetch: async () => ({ isConnected: true, isInternetReachable: true, type: 'wifi' }),
  addEventListener: () => () => {},
};

export default NetInfo;
