import objectEntries from 'core-js-pure/stable/object/entries';
import { request, getActiveTags, ppDebug, getOrCreateStorageID, createState } from '../../utils';

const Message = function({ markup, meta, parentStyles, warnings }) {
    const { onClick, onReady, onHover, onMarkup, onProps, resize, style } = window.xprops;
    const dimensionsRef = { current: { width: 0, height: 0 } };

    const [propVars, updatePropVars] = createState({
        amount: window.xprops.amount ?? null,
        currency: window.xprops.currency ?? null,
        buyerCountry: window.xprops.buyerCountry ?? null,
        style: JSON.stringify(style),
        offer: window.xprops.offer ?? null,
        payerId: window.xprops.payerId ?? null,
        clientId: window.xprops.clientId ?? null,
        merchantId: window.xprops.merchantId ?? null
    });

    const [paramVars, updateParamVars] = createState({
        metaMessageRequestId: meta.messageRequestId ?? null,
        parentStyles: null,
        warnings: null,
        markup: null
    });

    const handleClick = () => {
        if (typeof onClick === 'function') {
            onClick({ meta });
        }
    };

    const handleHover = () => {
        if (typeof onHover === 'function') {
            onHover({ meta });
        }
    };

    // if there is a button reuse that instead of making a new one
    const button = document.createElement('button');

    button.setAttribute('type', 'button');
    button.setAttribute('aria-label', 'PayPal Pay Later Message');

    button.addEventListener('click', handleClick);
    button.addEventListener('mouseover', handleHover);
    button.addEventListener('focus', handleHover);

    button.style.display = 'block';
    button.style.background = 'transparent';
    button.style.padding = 0;
    button.style.border = 'none';
    button.style.outline = 'none';
    button.style.textAlign = style?.text?.align || 'left';
    button.style.fontFamily = 'inherit';
    button.style.fontSize = 'inherit';
    button.innerHTML = markup;

    function iframeRendered() {
        onReady({
            meta,
            activeTags: getActiveTags(button),
            // Utility will create iframe deviceID if it doesn't exist.
            deviceID: getOrCreateStorageID()
        });

        onMarkup({ meta, styles: parentStyles, warnings });
        updateParamVars({ ...paramVars, parentStyles, warnings, markup });
    }

    window.requestAnimationFrame(iframeRendered);

    if (typeof onProps === 'function') {
        onProps(() => {
            const { amount, currency, buyerCountry, offer, payerId, clientId, merchantId } = window.xprops;
            if (
                JSON.stringify(propVars) !==
                JSON.stringify({
                    amount: amount ?? null,
                    currency: currency ?? null,
                    buyerCountry: buyerCountry ?? null,
                    style: JSON.stringify(window.xprops.style) ?? null,
                    offer: offer ?? null,
                    payerId: payerId ?? null,
                    clientId: clientId ?? null,
                    merchantId: merchantId ?? null
                })
            ) {
                const { version, env } = window.xprops;

                const query = objectEntries({
                    message_request_id: meta.messageRequestId,
                    amount,
                    currency,
                    buyer_country: buyerCountry,
                    style: window.xprops.style,
                    credit_type: offer,
                    payer_id: payerId,
                    client_id: clientId,
                    merchant_id: merchantId,
                    version,
                    env
                })
                    .filter(([, val]) => Boolean(val))
                    .reduce(
                        (acc, [key, val]) =>
                            `${acc}&${key}=${encodeURIComponent(typeof val === 'object' ? JSON.stringify(val) : val)}`,
                        ''
                    )
                    .slice(1);

                ppDebug('Updating message with new props...', { inZoid: true });

                request('GET', `${window.location.origin}/credit-presentment/renderMessage?${query}`).then(
                    ({ data }) => {
                        button.innerHTML = data.markup ?? markup;

                        const buttonWidth = button.offsetWidth;
                        const buttonHeight = button.offsetHeight;
                        // Zoid will not fire a resize event if the markup has the same dimensions meaning the render event
                        // in the overflow observer will not fire. This forces the resize event to fire for every render
                        // so that the render complete logs will always fire
                        if (
                            dimensionsRef.current.width === buttonWidth &&
                            dimensionsRef.current.height === buttonHeight
                        ) {
                            // resizes the iframe
                            resize({ width: buttonWidth, height: buttonHeight });
                        } else {
                            dimensionsRef.current = { width: buttonWidth, height: buttonHeight };
                        }

                        if (typeof onReady === 'function') {
                            if (
                                paramVars.metaMessageRequestId !== (data.meta.messageRequestId ?? meta.messageRequestId)
                            ) {
                                onReady({
                                    meta: data.meta ?? meta,
                                    activeTags: getActiveTags(button),
                                    // Utility will create iframe deviceID if it doesn't exist.
                                    deviceID: getOrCreateStorageID()
                                });

                                paramVars.metaMessageRequestId = data.meta.messageRequestId ?? meta.messageRequestId;
                            }
                        }

                        if (typeof onMarkup === 'function') {
                            if (
                                paramVars.parentStyles !== (data.parentStyles ?? parentStyles) ||
                                paramVars.warnings !== (data.warnings ?? warnings) ||
                                paramVars.markup !== (data.markup ?? markup)
                            ) {
                                // resizes the parent message div
                                onMarkup({
                                    meta: data.meta ?? meta,
                                    styles: data.parentStyles ?? parentStyles,
                                    warnings: data.warnings ?? warnings
                                });
                                updateParamVars({
                                    ...paramVars,
                                    parentStyles: data.parentStyles ?? parentStyles,
                                    warnings: data.warnings ?? warnings,
                                    markup: data.markup ?? markup
                                });
                            }
                        }
                    }
                );
                updatePropVars({
                    ...propVars,
                    amount,
                    currency,
                    buyerCountry,
                    style: JSON.stringify(window.xprops.style),
                    offer,
                    payerId,
                    clientId,
                    merchantId
                });
            }
        });
    }

    return button;
};

export default Message;
