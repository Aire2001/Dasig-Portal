const { createClient } = require('@supabase/supabase-js');
const { Agent, setGlobalDispatcher } = require('undici');
const dns = require('dns');

// Configure robust DNS resolution (8.8.8.8 and 1.1.1.1) to avoid ISP DNS caching issues
const resolver = new dns.promises.Resolver();
resolver.setServers(['8.8.8.8', '1.1.1.1']);

const agent = new Agent({
  connect: {
    lookup: (hostname, options, callback) => {
      resolver.resolve4(hostname)
        .then(ips => {
          if (options && options.all) {
            callback(null, ips.map(ip => ({ address: ip, family: 4 })));
          } else {
            callback(null, ips[0], 4);
          }
        })
        .catch(() => dns.lookup(hostname, options, callback));
    },
  },
});
setGlobalDispatcher(agent);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false } }
);

module.exports = supabase;
