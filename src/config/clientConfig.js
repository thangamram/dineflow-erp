export const CLIENT_CONFIG = {
  restaurantId: 'REST-1001',
  clientName: 'DineFlow Signature Client',
  
  // The ERP will ONLY work if accessed from these specific domains/IPs.
  // Add your client's production domain here (e.g. 'www.abc-restaurant.com')
  // We include 'localhost' so you can develop and test it locally.
  authorizedDomains: [
    'localhost',
    '127.0.0.1',
    'www.abc-restaurant.com',
    'erp.abc-restaurant.com'
  ],

  // Optional: A hardcoded expiry date. 
  // If null, it never expires.
  // If set to '2026-12-31', it stops working on Jan 1, 2027.
  expiryDate: null
};
