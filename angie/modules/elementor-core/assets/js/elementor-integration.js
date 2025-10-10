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
                        
                        // Show converter modal
                        if (typeof window.showAngieConverter === 'function') {
                            window.showAngieConverter();
                        } else {
                            console.error('Angie Converter not loaded');
                            alert('Angie HTML Converter is not loaded. Please refresh the page.');
                        }
                    });

                    console.log('✅ Angie HTML Converter button added to Elementor panel');
                }
            }, 1000);
        });

        // Also add to top bar (alternative location)
        setTimeout(function() {
            addToTopBar();
        }, 1500);
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
                     "
                     title="Angie HTML to Elementor Converter">
                    <i class="eicon-code" style="font-size: 18px;"></i>
                </div>
            `;

            topBar.parent().append(topBarButton);

            // Hover effect
            jQuery('#angie-top-bar-button').hover(
                function() {
                    jQuery(this).css('background', '#D5001C');
                },
                function() {
                    jQuery(this).css('background', '#92003B');
                }
            );

            // Click handler
            jQuery('#angie-top-bar-button').on('click', function(e) {
                e.preventDefault();
                if (typeof window.showAngieConverter === 'function') {
                    window.showAngieConverter();
                }
            });

            console.log('✅ Angie button added to top bar');
        }
    }

    // Keyboard shortcut: Ctrl + Shift + H
    jQuery(document).on('keydown', function(e) {
        // Ctrl + Shift + H
        if (e.ctrlKey && e.shiftKey && e.keyCode === 72) {
            e.preventDefault();
            if (typeof window.showAngieConverter === 'function') {
                window.showAngieConverter();
                console.log('🎨 Opened via keyboard shortcut: Ctrl+Shift+H');
            }
        }
    });

    console.log('🎨 Angie HTML Converter integration loaded');
    console.log('💡 Keyboard shortcut: Ctrl + Shift + H');
});
