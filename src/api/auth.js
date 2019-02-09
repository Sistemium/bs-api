import { roles as getGoles } from 'sistemium-telegram/services/auth';
import log from 'sistemium-telegram/services/log';

const { debug, error } = log('api');

const REQUIRED_ROLE = 'bs.1c';

export default async function (ctx, next) {

  const { header: { authorization }, assert, state } = ctx;

  assert(authorization, 401);

  try {

    const { account, roles } = await getGoles(authorization);
    const { site, [REQUIRED_ROLE]: hasAuth } = roles;

    if (!hasAuth) {
      ctx.throw(403);
    }

    debug('authorized:', site, `"${account.name}"`);
    state.site = site;

  } catch (e) {
    error('auth:', e.message);
    ctx.throw(401);
  }

  await next();

}
