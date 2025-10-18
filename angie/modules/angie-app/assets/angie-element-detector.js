/**
 * Angie Element Detector
 * Detects selected Elementor/Gutenberg elements and sends to iframe
 */

(function() {
    'use strict';

    let iframe = null;
    let selectionCheckInterval = null;
    let lastSelectedId = null;

    // Initialize when DOM is ready
    function init() {
        console.log('Angie Element Detector initialized');

        // Find iframe
        iframe = document.getElementById('angie-iframe');
        if (!iframe) {
            console.warn('Angie iframe not found');
            return;
        }

        // Listen for messages from iframe
        window.addEventListener('message', handleIframeMessage);

        // Start checking for selection changes
        startSelectionWatcher();

        // Send initial context
        setTimeout(() => {
            sendElementorContext();
        }, 1000);
    }

    // Handle messages from iframe
    function handleIframeMessage(event) {
        if (!event.data || typeof event.data !== 'object') return;

        console.log('Parent received message:', event.data);

        switch (event.data.type) {
            case 'ANGIE_IFRAME_READY':
                console.log('Iframe is ready');
                sendElementorContext();
                break;

            case 'GET_ELEMENTOR_CONTEXT':
                sendElementorContext();
                break;

            case 'GET_SELECTED_ELEMENT':
                sendSelectedElement();
                break;

            case 'ANGIE_HEARTBEAT':
                // Optional: respond to heartbeat
                break;

            default:
                console.log('Unknown message from iframe:', event.data.type);
        }
    }

    // Send Elementor context to iframe
    function sendElementorContext() {
        if (!iframe || !iframe.contentWindow) return;

        const context = {
            isElementorEditor: isElementorEditor(),
            selectedElement: getSelectedElement(),
        };

        iframe.contentWindow.postMessage({
            type: 'ELEMENTOR_CONTEXT',
            payload: context,
            timestamp: Date.now(),
        }, '*');

        console.log('Sent Elementor context:', context);
    }

    // Send selected element to iframe
    function sendSelectedElement() {
        if (!iframe || !iframe.contentWindow) return;

        const element = getSelectedElement();
        
        iframe.contentWindow.postMessage({
            type: 'ELEMENT_SELECTED',
            payload: element,
            timestamp: Date.now(),
        }, '*');

        console.log('Sent selected element:', element);
    }

    // Check if we're in Elementor editor
    function isElementorEditor() {
        return typeof window.elementor !== 'undefined' && window.elementor !== null;
    }

    // Get selected element
    function getSelectedElement() {
        // Try Elementor first
        if (isElementorEditor()) {
            return getElementorSelectedElement();
        }

        // Try Gutenberg
        if (typeof wp !== 'undefined' && wp.data && wp.data.select) {
            return getGutenbergSelectedElement();
        }

        return null;
    }

    // Get selected Elementor element
    function getElementorSelectedElement() {
        try {
            const elementor = window.elementor;

            // Method 1: Try to get from selection
            if (elementor.selection && elementor.selection.getElements) {
                const elements = elementor.selection.getElements();
                if (elements && elements.length > 0) {
                    const firstElement = elements[0];
                    const model = firstElement.model;
                    
                    return {
                        id: model.get('id'),
                        type: model.get('elType'),
                        label: model.get('settings')?.get('_title') || model.get('widgetType') || 'Element',
                        widgetType: model.get('widgetType'),
                        settings: model.get('settings')?.attributes || {},
                    };
                }
            }

            // Method 2: Try panel editor
            if (window.$e && $e.routes && $e.routes.isPartOf && $e.routes.isPartOf('panel/editor')) {
                const editedView = elementor.getPanelView()?.getCurrentPageView()?.getOption('editedElementView');
                if (editedView && editedView.model) {
                    const model = editedView.model;
                    return {
                        id: model.get('id'),
                        type: model.get('elType'),
                        label: model.get('settings')?.get('_title') || model.get('widgetType') || 'Element',
                        widgetType: model.get('widgetType'),
                        settings: model.get('settings')?.attributes || {},
                    };
                }
            }

            // Method 3: Try context menu
            if (elementor.channels && elementor.channels.editor) {
                const contextView = elementor.channels.editor.request('contextMenu:targetView');
                if (contextView && contextView.model) {
                    const model = contextView.model;
                    return {
                        id: model.get('id'),
                        type: model.get('elType'),
                        label: model.get('settings')?.get('_title') || model.get('widgetType') || 'Element',
                        widgetType: model.get('widgetType'),
                        settings: model.get('settings')?.attributes || {},
                    };
                }
            }

            // Method 4: Check global context variable
            if (window.elementorAiCurrentContext && window.elementorAiCurrentContext.selectedElement) {
                return window.elementorAiCurrentContext.selectedElement;
            }

        } catch (error) {
            console.error('Error getting Elementor selection:', error);
        }

        return null;
    }

    // Get selected Gutenberg block
    function getGutenbergSelectedElement() {
        try {
            const blockEditor = wp.data.select('core/block-editor');
            if (!blockEditor) return null;

            const selectedBlockIds = blockEditor.getSelectedBlockClientIds();
            if (!selectedBlockIds || selectedBlockIds.length === 0) {
                return null;
            }

            const blockId = selectedBlockIds[0];
            const block = blockEditor.getBlock(blockId);
            
            if (!block) return null;

            return {
                id: block.clientId,
                type: 'gutenberg-block',
                label: block.name || 'Block',
                widgetType: block.name,
                settings: {
                    attributes: block.attributes,
                    name: block.name,
                    isValid: block.isValid,
                },
            };

        } catch (error) {
            console.error('Error getting Gutenberg selection:', error);
        }

        return null;
    }

    // Start watching for selection changes
    function startSelectionWatcher() {
        // Stop existing watcher if any
        if (selectionCheckInterval) {
            clearInterval(selectionCheckInterval);
        }

        // Check for selection changes every 500ms
        selectionCheckInterval = setInterval(() => {
            const element = getSelectedElement();
            const currentId = element ? element.id : null;

            // Only send if selection changed
            if (currentId !== lastSelectedId) {
                lastSelectedId = currentId;
                sendSelectedElement();
            }
        }, 500);

        console.log('Selection watcher started');
    }

    // Cleanup
    function cleanup() {
        if (selectionCheckInterval) {
            clearInterval(selectionCheckInterval);
            selectionCheckInterval = null;
        }
        window.removeEventListener('message', handleIframeMessage);
        console.log('Angie Element Detector cleaned up');
    }

    // Listen for Elementor events if available
    if (window.elementor) {
        // Listen for selection changes via Elementor's event system
        try {
            elementor.on('preview:loaded', () => {
                console.log('Elementor preview loaded');
                setTimeout(sendElementorContext, 500);
            });

            elementor.channels.editor.on('change', () => {
                // Selection might have changed
                setTimeout(sendSelectedElement, 100);
            });
        } catch (error) {
            console.warn('Could not attach to Elementor events:', error);
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup);

    // Expose to window for debugging
    window.angieElementDetector = {
        getSelectedElement,
        isElementorEditor,
        sendElementorContext,
        sendSelectedElement,
    };

})();
