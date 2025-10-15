/**
 * Add Angie HTML Converter button to Elementor top bar
 */
jQuery(window).on('elementor:init', function() {
    'use strict';

    // Wait for Elementor to be fully loaded
    elementor.once('preview:loaded', function() {
        
        // Add button to Elementor top bar
        elementor.on('panel:init', function() {
            
            // Create button HTML
            const buttonHtml = `
                <div id="angie-converter-button" 
                     class="elementor-panel-footer-tool" 
                     title="Angie HTML Converter"
                     style="cursor: pointer;">
                    <i class="eicon-code" aria-hidden="true"></i>
                    <span class="elementor-screen-only">HTML Converter</span>
                </div>
            `;

            // Try to add to panel footer
            setTimeout(function() {
                const panelFooter = jQuery('#elementor-panel-footer-tools');
                
                if (panelFooter.length) {
                    // Insert before settings button
                    const settingsBtn = panelFooter.find('#elementor-panel-footer-settings');
                    
                    if (settingsBtn.length) {
                        settingsBtn.before(buttonHtml);
                    } else {
                        panelFooter.append(buttonHtml);
                    }

                    // Bind click event
                    jQuery('#angie-converter-button').on('click', function(e) {
                        e.preventDefault();
                        
                        // Show AI converter modal
                        if (typeof window.showAngieAIConverter === 'function') {
                            window.showAngieAIConverter();
                        } else {
                            console.error('Angie AI Converter not loaded');
                            alert('Angie AI Converter is not loaded. Please refresh the page.');
                        }
                    });

                    console.log('✅ Angie HTML Converter button added to Elementor panel');
                }
            }, 1000);
        });

        // Also add to top bar (alternative location)
        // Try multiple times to ensure button appears
        setTimeout(function() {
            addToTopBar();
        }, 1000);
        
        setTimeout(function() {
            addToTopBar();
        }, 2000);
        
        setTimeout(function() {
            addToTopBar();
        }, 3000);
    });

    /**
     * Add button to top bar (near hamburger menu)
     */
    function addToTopBar() {
        const topBar = jQuery('#elementor-panel-header-menu-button');
        
        if (topBar.length && !jQuery('#angie-top-bar-button').length) {
            const topBarButton = `
                <div id="angie-top-bar-button" 
                     style="
                        display: inline-flex;
                        align-items: center;
                        justify-content: center;
                        width: 40px;
                        height: 40px;
                        cursor: pointer;
                        background: #92003B;
                        color: white;
                        border-radius: 3px;
                        margin-left: 8px;
                        transition: all 0.3s;
                        box-shadow: 0 2px 5px rgba(146, 0, 59, 0.3);
                     "
                     title="Angie AI HTML to Elementor Converter (Ctrl+Shift+H)">
                    <i class="eicon-code" style="font-size: 18px;"></i>
                </div>
            `;

            topBar.parent().append(topBarButton);

            // Hover effect
            jQuery('#angie-top-bar-button').hover(
                function() {
                    jQuery(this).css({
                        'background': '#D5001C',
                        'box-shadow': '0 4px 8px rgba(213, 0, 28, 0.4)'
                    });
                },
                function() {
                    jQuery(this).css({
                        'background': '#92003B',
                        'box-shadow': '0 2px 5px rgba(146, 0, 59, 0.3)'
                    });
                }
            );

            // Click handler
            jQuery('#angie-top-bar-button').on('click', function(e) {
                e.preventDefault();
                if (typeof window.showAngieAIConverter === 'function') {
                    window.showAngieAIConverter();
                } else {
                    console.error('showAngieAIConverter not found');
                    alert('AI Converter is loading... Please try again in a moment.');
                }
            });

            console.log('✅ Angie RED button (</>) added to top bar');
        } else if (!topBar.length) {
            console.warn('⚠️ Top bar not found, will retry...');
            // Retry after 1 second
            setTimeout(addToTopBar, 1000);
        }
    }

    // Keyboard shortcut: Ctrl + Shift + H
    jQuery(document).on('keydown', function(e) {
        // Ctrl + Shift + H
        if (e.ctrlKey && e.shiftKey && e.keyCode === 72) {
            e.preventDefault();
            if (typeof window.showAngieAIConverter === 'function') {
                window.showAngieAIConverter();
                console.log('🎨 Opened AI converter via keyboard shortcut: Ctrl+Shift+H');
            }
        }
    });

    console.log('🎨 Angie HTML Converter integration loaded');
    console.log('💡 Keyboard shortcut: Ctrl + Shift + H');
});
