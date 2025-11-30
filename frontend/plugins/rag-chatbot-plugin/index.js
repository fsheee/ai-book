/**
 * Docusaurus Plugin: RAG Chatbot Widget
 *
 * Injects the RagChatWidget component into all pages.
 * Provides configuration options for customization.
 */

const path = require('path');

module.exports = function ragChatbotPlugin(context, options) {
  const {
    position = 'bottom-right',
    startOpen = false,
    enableTextSelection = true,
  } = options;

  return {
    name: 'rag-chatbot-plugin',

    getClientModules() {
      return [path.resolve(__dirname, './client-module.js')];
    },

    injectHtmlTags() {
      return {
        headTags: [
          {
            tagName: 'link',
            attributes: {
              rel: 'stylesheet',
              href: '/css/chatbot.css',
            },
          },
        ],
        postBodyTags: [
          {
            tagName: 'div',
            attributes: {
              id: 'rag-chatbot-root',
              'data-position': position,
              'data-start-open': startOpen.toString(),
              'data-enable-text-selection': enableTextSelection.toString(),
            },
          },
        ],
      };
    },

    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@site': path.resolve(context.siteDir),
          },
        },
      };
    },
  };
};
