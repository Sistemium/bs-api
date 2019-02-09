import { roles } from 'sistemium-telegram/services/auth';
import log from 'sistemium-telegram/services/log';

const { debug, error } = log('api');

export default async function (ctx, next) {

  const { header: { authorization }, assert, state } = ctx;

  assert(authorization, 401);

  try {

    const { account, roles: { site } } = await roles(authorization);

    debug('authorized', site, `"${account.name}"`);
    state.site = site;

  } catch (e) {
    error('auth', e.response && e.response.status, e.message);
    ctx.throw(401);
  }

  await next();

}
