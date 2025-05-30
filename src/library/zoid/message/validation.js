import arrayIncludes from 'core-js-pure/stable/array/includes';
import numberIsNaN from 'core-js-pure/stable/number/is-nan';
import stringStartsWith from 'core-js-pure/stable/string/starts-with';
import { logger, memoize, getEnv } from '../../../utils';
import { OFFER } from '../../../utils/constants';

export const Types = {
    ANY: 'ANY',
    STRING: 'STRING',
    BOOLEAN: 'BOOLEAN',
    NUMBER: 'NUMBER',
    FUNCTION: 'FUNCTION',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT'
};

export function validateType(expectedType, val) {
    switch (expectedType) {
        case Types.STRING:
            return typeof val === 'string';
        case Types.BOOLEAN:
            return typeof val === 'boolean';
        case Types.NUMBER:
            return typeof val === 'number' && !numberIsNaN(val);
        case Types.FUNCTION:
            return typeof val === 'function';
        case Types.ARRAY:
            return Array.isArray(val);
        case Types.OBJECT:
            return !Array.isArray(val) && typeof val === 'object' && val !== null;
        case Types.ANY:
            return true;
        default:
            return false;
    }
}

// Formalized validation logger helper functions
const logInvalid = memoize((location, message) =>
    logger.warn('invalid_option_value', {
        description: message,
        location
    })
);
const logInvalidType = (location, expectedType, val) => {
    const valType = Array.isArray(val) ? 'array' : typeof val;
    logInvalid(
        location,
        `Expected type "${expectedType.toLowerCase()}" but instead received "${valType}" (${JSON.stringify(val)}).`
    );
};
const logInvalidOption = (location, options, val) =>
    logInvalid(location, `Expected one of ["${options.join('", "').replace(/\|[\w|]+/g, '')}"] but received "${val}".`);

const logInvalidCombination = (location, expectation, val) =>
    logInvalid(location, `Invalid ${location} combination. ${expectation} but received "${val}"`);

function validateOffer(offer, offerType) {
    if (!validateType(Types.STRING, offer)) {
        logInvalidType('offer', Types.STRING, offer);
        throw new Error('offer_validation_error');
    }
    if (!offerType.includes(offer)) {
        logInvalid('offer', 'Ensure valid offer type.');
        throw new Error('offer_validation_error');
    }
}
export default {
    account: ({ props: { account } }) => {
        if (!validateType(Types.STRING, account)) {
            logInvalidType('account', Types.STRING, account);
        } else if (getEnv() === 'local' && stringStartsWith(account, 'DEV_')) {
            return account;
        } else if (account.length !== 13 && account.length !== 10 && !stringStartsWith(account, 'client-id:')) {
            logInvalid('account', 'Ensure the correct Merchant Account ID has been entered.');
        } else {
            return account;
        }

        return undefined;
    },
    merchantId: ({ props: { merchantId } }) => {
        if (typeof merchantId !== 'undefined') {
            if (!validateType(Types.STRING, merchantId)) {
                logInvalidType('merchantId', Types.STRING, merchantId);
            } else {
                const isInvalid = merchantId.split(',').some(id => id.length !== 13 && id.length !== 10);
                if (isInvalid) {
                    logInvalid('merchantId', 'Ensure the correct Merchant ID has been entered.');
                }
                return merchantId;
            }
        }
        return undefined;
    },
    customerId: ({ props: { customerId } }) => {
        if (typeof customerId !== 'undefined') {
            if (!validateType(Types.STRING, customerId)) {
                logInvalidType('customerId', Types.STRING, customerId);
            } else if (customerId.length !== 13 && customerId.length !== 10) {
                logInvalid('customerId', 'Ensure the correct Merchant ID has been entered.');
            } else {
                return customerId;
            }
        }

        return undefined;
    },
    amount: ({ props: { amount } }) => {
        if (typeof amount !== 'undefined') {
            const numberAmount = Number(amount);

            if (!validateType(Types.NUMBER, numberAmount)) {
                logInvalidType('amount', Types.NUMBER, amount);
            } else if (numberAmount < 0) {
                logInvalid('amount', 'Ensure value is a positive number.');
            } else {
                return numberAmount;
            }
        }

        return undefined;
    },
    offer: ({ props: { offer } }) => {
        const offerType = [...Object.values(OFFER), 'NI'];
        if (typeof offer !== 'undefined') {
            let validatedOffer = offer;
            if (typeof offer === 'string' && offer.includes(',')) {
                // If Offer list contains a comma , split it into an array
                validatedOffer = offer.split(',').map(o => o.trim());
            }

            if (Array.isArray(validatedOffer)) {
                // Check if we are sending more then the maximum amount of offers allowed
                if (validatedOffer.length > 2) {
                    logInvalid('offer', 'Ensure valid offer length');
                    throw new Error('offer_validation_error: offers cannot exceed 2');
                }
                // validate each offer
                const validatedOffers = validatedOffer.map(offr => {
                    validateOffer(offr, offerType);
                    return offr;
                });
                // If duplicate valid offers, return the first offer
                if (validatedOffers[0] === validatedOffers[1]) {
                    return validatedOffers[0];
                }
                return validatedOffers.sort().join();
            }
            validateOffer(offer, offerType);
            return offer;
        }
        return offer;
    },

    // TODO: Handle server side locale specific style validation warnings passed down to client.
    // Likely makes sens to pass down in the onReady callback
    style: ({ props: { style: styleInput } }) => {
        if (validateType(Types.OBJECT, styleInput)) {
            const style = styleInput?.layout ? styleInput : { ...styleInput, layout: 'text' };

            if (validateType(Types.STRING, style.layout)) {
                return style;
            }
            logInvalidType('style.layout', Types.STRING, style.layout);

            if (validateType(Types.STRING, style.preset)) {
                return {
                    layout: 'text',
                    ...style
                };
            }
        } else if (typeof styleInput !== 'undefined') {
            logInvalidType('style', Types.OBJECT, styleInput);
        }

        // Get the default settings for a text banner
        return { layout: 'text' };
    },
    currency: ({ props: { currency } }) => {
        if (typeof currency !== 'undefined') {
            if (!validateType(Types.STRING, currency)) {
                logInvalidType('currency', Types.STRING, currency);
            } else {
                return currency;
            }
        }

        return undefined;
    },
    pageType: ({ props: { pageType } }) => {
        if (typeof pageType !== 'undefined') {
            const options = [
                'home',
                'category',
                'product',
                'payment',
                'product-list',
                'product-listing',
                'search-results',
                'product-details',
                'mini-cart',
                'cart',
                'checkout'
            ];

            if (!validateType(Types.STRING, pageType)) {
                logInvalidType('pageType', Types.STRING, pageType);
            } else if (!arrayIncludes(options, pageType)) {
                logInvalidOption('pageType', options, pageType);
            } else {
                return pageType;
            }
        }
        return undefined;
    },
    buyerCountry: ({ props: { buyerCountry } }) => {
        if (typeof buyerCountry !== 'undefined') {
            if (!validateType(Types.STRING, buyerCountry)) {
                logInvalidType('buyerCountry', Types.STRING, buyerCountry);
            } else {
                return buyerCountry;
            }
        }

        return undefined;
    },
    language: ({ props: { language } }) => {
        if (typeof language !== 'undefined') {
            if (!validateType(Types.STRING, language)) {
                logInvalidType('language', Types.STRING, language);
            } else {
                return language;
            }
        }

        return undefined;
    },
    ignoreCache: ({ props: { ignoreCache } }) => {
        if (typeof ignoreCache !== 'undefined') {
            if (!validateType(Types.BOOLEAN, ignoreCache)) {
                logInvalidType('ignoreCache', Types.BOOLEAN, ignoreCache);
            } else {
                return ignoreCache;
            }
        }

        return undefined;
    },
    channel: ({ props: { channel } }) => {
        if (typeof channel !== 'undefined') {
            // Acceptable values include any case-sensitive alphanumeric string with optional underscores.
            const acceptedValues = /^[A-Z0-9_]+$/;
            if (!validateType(Types.STRING, channel)) {
                logInvalidType('channel', Types.STRING, channel);
            } else if (!acceptedValues.test(channel)) {
                // Return undefined if supplied channel value is not an accepted value.
                // We do not surface a warning here as we do not want instances where a channel is used in an incorrect context.
                return undefined;
            } else {
                return channel;
            }
        }

        return undefined;
    },
    ecToken: ({ props: { ecToken } }) => {
        if (typeof ecToken !== 'undefined') {
            if (!validateType(Types.STRING, ecToken)) {
                logInvalidType('ecToken', Types.STRING, ecToken);
            } else {
                return ecToken;
            }
        }

        return undefined;
    },
    contextualComponents: ({ props: { contextualComponents } }) => {
        // Return early if contextualComponents is undefined
        if (typeof contextualComponents === 'undefined') {
            return undefined;
        }

        let typesArray;

        // Normalize input to an array
        if (Array.isArray(contextualComponents)) {
            typesArray = contextualComponents.map(component => component.toUpperCase());
        } else if (typeof contextualComponents === 'string') {
            typesArray = contextualComponents.toUpperCase().split(',');
        } else {
            logInvalidType('contextualComponents', 'STRING or ARRAY', contextualComponents);
            return undefined;
        }

        // Check if values are of the same type (all buttons or all marks)
        const allButtons = typesArray.every(type => type.endsWith('_BUTTON'));
        const allMarks = typesArray.every(type => type.endsWith('_MARK'));

        if (!allButtons && !allMarks) {
            logInvalidCombination(
                'contextualComponents',
                "Expected all contextualComponents values to be either of type 'button' or 'mark'",
                contextualComponents
            );
        } else if (typesArray.filter(type => type.endsWith('_MARK')).length > 1) {
            logInvalid('contextualComponents', 'Ensure only one type of mark value is provided.');
        } else {
            // Return the sorted array of components joined by commas, converted to uppercase
            return typesArray.sort().join(',');
        }

        return undefined;
    },
    cspNonce: ({ props: { cspNonce } }) => {
        if (typeof cspNonce !== 'undefined') {
            if (!validateType(Types.STRING, cspNonce)) {
                logInvalidType('cspNonce', Types.STRING, cspNonce);
            } else {
                return cspNonce;
            }
        }
        return undefined;
    },
    merchantConfig: ({ props: { merchantConfig } }) => {
        if (typeof merchantConfig !== 'undefined') {
            if (!validateType(Types.STRING, merchantConfig)) {
                // fail silently since value is supplied by sdk
                return undefined;
            }
            return merchantConfig;
        }

        return undefined;
    },
    features: ({ props: { features } }) => {
        if (typeof features !== 'undefined') {
            if (!validateType(Types.STRING, features)) {
                logInvalidType('features', Types.STRING, features);
            } else {
                return features;
            }
        }
        return undefined;
    }
};
