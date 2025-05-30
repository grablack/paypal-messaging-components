const postRobotGlobals = require('@krakenjs/post-robot/globals');
const zoidGlobals = require('@krakenjs/zoid/globals');

const { version } = require('./package.json');

const PORT = process.env.PORT || 8080;

module.exports = (env = { TARGET: 'sdk' }) => ({
    __DISABLE_SET_COOKIE__: false,
    __PAYPAL_DOMAIN__: 'https://www.paypal.com',
    __PAYPAL_API_DOMAIN__: 'https://api.paypal.com',
    __ZOID__: {
        ...zoidGlobals.__ZOID__,
        __DEFAULT_CONTAINER__: true,
        __DEFAULT_PRERENDER__: true,
        __FRAMEWORK_SUPPORT__: true,
        __SCRIPT_NAMESPACE__: true
    },
    __POST_ROBOT__: {
        ...postRobotGlobals.__POST_ROBOT__,
        __IE_POPUP_SUPPORT__: false,
        __SCRIPT_NAMESPACE__: true
    },

    __MESSAGES__: {
        __VERSION__: env.VERSION || version,
        __FEATURES__: 'no-common',
        __DEMO__: !!env.demo,
        __NATIVE_MODAL__: true,
        __TARGET__: env.TARGET.toUpperCase().replace(/-/g, '_'),
        __STAGE_TAG__: env.STAGE_TAG,
        __TEST_ENV__: env.TEST_ENV,
        __DEV_TOUCHPOINT__: env.DEV_TOUCHPOINT,
        __DOMAIN__: {
            __LOCAL__: `https://localhost.paypal.com:${PORT}`,
            __SANDBOX__: 'https://www.sandbox.paypal.com',
            __PRODUCTION__: 'https://www.paypal.com'
        },
        __API_DOMAIN__: {
            __LOCAL__: `https://localhost.paypal.com:${PORT}`,
            __SANDBOX__: 'https://api.sandbox.paypal.com',
            __PRODUCTION__: 'https://api.paypal.com'
        },
        __URI__: {
            __MESSAGE__: '/credit-presentment/smart/message',
            __TREATMENTS__: '/credit-presentment/experiments/local',
            __MODAL__: '/credit-presentment/smart/modal',
            __LOGGER__: '/v1/credit/upstream-messaging-events',
            __CREDIT_APPLY__: '/ppcreditapply/da/us'
        }
    }
});
