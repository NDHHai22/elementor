/**
 * Angie AI HTML to Elementor Converter - Modal UI
 */
(function($) {
    'use strict';

    /**
     * Show AI Converter Modal
     */
    window.showAngieAIConverter = function() {
        // Remove existing modal if any
        $('#angie-ai-converter-modal').remove();

        // Get current selected container info
        const selectedContainer = getSelectedContainer();
        const containerInfo = selectedContainer ? 
            `Working on: <strong>${selectedContainer.label}</strong>` : 
            'No container selected';

        const modalHtml = `
            <div id="angie-ai-converter-modal" class="angie-modal-overlay">
                <div class="angie-modal-container">
                    <div class="angie-modal-header">
                        <h2>
                            <i class="eicon-code"></i>
                            AI HTML to Elementor Converter
                        </h2>
                        <button class="angie-modal-close">&times;</button>
                    </div>

                    <div class="angie-modal-body">
                        <!-- Container Info -->
                        <div class="angie-container-info">
                            <i class="eicon-info-circle"></i>
                            ${containerInfo}
                        </div>

                        <!-- Mode Tabs -->
                        <div class="angie-tabs">
                            <button class="angie-tab angie-tab-active" data-tab="ai">
                                <i class="eicon-flash"></i> AI Generate
                            </button>
                            <button class="angie-tab" data-tab="html">
                                <i class="eicon-code"></i> Convert HTML
                            </button>
                        </div>

                        <!-- AI Generate Tab -->
                        <div id="angie-tab-ai" class="angie-tab-content angie-tab-content-active">
                            <div class="angie-form-group">
                                <label for="angie-prompt-input">
                                    <strong>Describe what you want to create:</strong>
                                </label>
                                <textarea 
                                    id="angie-prompt-input" 
                                    class="angie-textarea"
                                    placeholder="Examples:
- Create a hero section with title and CTA button
- Generate a pricing table with 3 columns
- Build a contact form
- Create a feature list with icons"
                                    rows="6"
                                ></textarea>
                            </div>

                            <div class="angie-form-group">
                                <label for="angie-context-input">
                                    <strong>Additional Instructions (Optional):</strong>
                                </label>
                                <input 
                                    type="text" 
                                    id="angie-context-input" 
                                    class="angie-input"
                                    placeholder="e.g., Make it modern, Use blue color scheme, Add animations, etc."
                                >
                            </div>

                            <div class="angie-button-group">
                                <button id="angie-convert-ai-btn" class="angie-btn angie-btn-primary">
                                    <i class="eicon-flash"></i>
                                    Generate with AI
                                </button>
                            </div>
                        </div>

                        <!-- HTML Convert Tab -->
                        <div id="angie-tab-html" class="angie-tab-content" style="display: none;">
                            <div class="angie-form-group">
                                <label for="angie-html-input">
                                    <strong>Paste your HTML code:</strong>
                                </label>
                                <textarea 
                                    id="angie-html-input" 
                                    class="angie-textarea"
                                    placeholder="<div style='background: #f4f4f9; padding: 60px;'>
  <h2>Your HTML here...</h2>
  <p>Paste any HTML with inline styles</p>
</div>"
                                    rows="12"
                                ></textarea>
                            </div>

                            <div class="angie-button-group">
                                <button id="angie-convert-html-btn" class="angie-btn angie-btn-primary">
                                    <i class="eicon-sync"></i>
                                    Convert to Elementor
                                </button>
                            </div>
                        </div>

                        <!-- Insert Button (shared) -->
                        <div class="angie-button-group" style="margin-top: 20px;">
                            <button id="angie-insert-btn" class="angie-btn angie-btn-success" disabled>
                                <i class="eicon-plus-circle"></i>
                                Insert to Page
                            </button>
                        </div>

                        <!-- Status Messages -->
                        <div id="angie-status" class="angie-status"></div>

                        <!-- Output Area -->
                        <div id="angie-output" class="angie-output">
                            <div class="angie-placeholder">
                                <i class="eicon-lightbulb-o"></i>
                                <p><strong>How it works:</strong></p>
                                <ol style="text-align: left; display: inline-block; margin: 10px 0;">
                                    <li>Describe what you want to create</li>
                                    <li>AI generates HTML code</li>
                                    <li>HTML automatically converts to Elementor</li>
                                    <li>Click "Insert to Page"</li>
                                </ol>
                                <p class="small">Powered by OpenAI + Angie Converter</p>
                            </div>
                        </div>
                    </div>

                    <div class="angie-modal-footer">
                        <a href="admin.php?page=angie-ai-settings" target="_blank" class="angie-settings-link">
                            <i class="eicon-settings"></i>
                            Configure AI Settings
                        </a>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);
        addModalStyles();
        bindModalEvents();
    };

    /**
     * Get selected container (column, section, etc.)
     */
    function getSelectedContainer() {
        if (typeof elementor === 'undefined') {
            return null;
        }

        const selection = elementor.selection.getElements();
        
        if (selection && selection.length > 0) {
            const element = selection[0];
            return {
                model: element.model,
                view: element,
                id: element.model.get('id'),
                type: element.model.get('elType'),
                label: getElementLabel(element)
            };
        }

        // Fallback to preview container
        try {
            const container = elementor.getPreviewContainer();
            if (container) {
                return {
                    model: container.model,
                    view: container,
                    id: container.model.get('id'),
                    type: 'document',
                    label: 'Document Root'
                };
            }
        } catch (e) {
            console.warn('Could not get preview container:', e);
        }

        return null;
    }

    /**
     * Get human-readable label for element
     */
    function getElementLabel(element) {
        const elType = element.model.get('elType');
        const id = element.model.get('id');
        
        let label = elType.charAt(0).toUpperCase() + elType.slice(1);
        
        if (elType === 'widget') {
            const widgetType = element.model.get('widgetType');
            label = widgetType ? widgetType.replace('-', ' ') : 'Widget';
            label = label.charAt(0).toUpperCase() + label.slice(1);
        } else if (elType === 'section') {
            label = 'Section';
        } else if (elType === 'column') {
            label = 'Column';
        }

        return `${label} #${id.substring(0, 6)}`;
    }

    /**
     * Bind modal events
     */
    function bindModalEvents() {
        const $modal = $('#angie-ai-converter-modal');
        let currentElements = null;

        // Tab switching
        $('.angie-tab').on('click', function() {
            const tab = $(this).data('tab');
            
            // Update tab buttons
            $('.angie-tab').removeClass('angie-tab-active');
            $(this).addClass('angie-tab-active');
            
            // Update tab content
            $('.angie-tab-content').removeClass('angie-tab-content-active').hide();
            $('#angie-tab-' + tab).addClass('angie-tab-content-active').show();
            
            // Clear output
            $('#angie-output').html(`
                <div class="angie-placeholder">
                    <i class="eicon-lightbulb-o"></i>
                    <p><strong>${tab === 'ai' ? 'AI Generate Mode' : 'HTML Convert Mode'}</strong></p>
                    <p class="small">${tab === 'ai' ? 'Describe what you want and AI will generate HTML' : 'Paste HTML and convert to Elementor JSON'}</p>
                </div>
            `);
        });

        // Close modal
        $modal.find('.angie-modal-close').on('click', function() {
            $modal.remove();
        });

        // Close on overlay click
        $modal.on('click', function(e) {
            if ($(e.target).hasClass('angie-modal-overlay')) {
                $modal.remove();
            }
        });

        // ESC key to close
        $(document).on('keydown.angieModal', function(e) {
            if (e.keyCode === 27) {
                $modal.remove();
                $(document).off('keydown.angieModal');
            }
        });

        // Convert with AI button
        $('#angie-convert-ai-btn').on('click', function() {
            const prompt = $('#angie-prompt-input').val().trim();
            const context = $('#angie-context-input').val().trim();

            if (!prompt) {
                showStatus('Please describe what you want to create!', 'error');
                return;
            }

            convertWithAI(prompt, context);
        });

        // Convert HTML button
        $('#angie-convert-html-btn').on('click', function() {
            const html = $('#angie-html-input').val().trim();

            if (!html) {
                showStatus('Please paste HTML code to convert!', 'error');
                return;
            }

            convertHTMLOnly(html);
        });

        // Insert button
        $('#angie-insert-btn').on('click', function() {
            if (!currentElements) {
                showStatus('No elements to insert!', 'error');
                return;
            }

            insertElements(currentElements);
        });

        // Store current elements for insert
        $modal.on('elementsConverted', function(e, elements) {
            currentElements = elements;
            $('#angie-insert-btn').prop('disabled', false);
        });
    }

    /**
     * Convert prompt to HTML using AI, then convert to Elementor
     */
    function convertWithAI(prompt, context) {
        const $btn = $('#angie-convert-ai-btn');
        const originalHtml = $btn.html();

        $btn.prop('disabled', true).html('<i class="eicon-loading eicon-animation-spin"></i> Generating...');
        showStatus('🤖 AI is generating HTML...', 'info');

        $.ajax({
            url: wpApiSettings.root + 'angie/v1/ai-convert',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                prompt: prompt,
                context: context
            }),
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', wpApiSettings.nonce);
            },
            success: function(response) {
                if (response.success && response.elements) {
                    let statusMsg = '✅ Success! ';
                    
                    if (response.html) {
                        statusMsg += 'AI generated HTML → Converted to Elementor';
                    }
                    
                    showStatus(statusMsg, 'success');
                    displayElements(response.elements, response.html || response.generated_html);
                    
                    // Trigger event for insert button
                    $('#angie-ai-converter-modal').trigger('elementsConverted', [response.elements]);
                } else {
                    showStatus('❌ Generation failed: Invalid response', 'error');
                }
            },
            error: function(xhr) {
                let errorMsg = '❌ Generation failed';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg += ': ' + xhr.responseJSON.message;
                }
                
                if (xhr.status === 400 && xhr.responseJSON && xhr.responseJSON.code === 'missing_api_key') {
                    errorMsg += ' - Please configure your OpenAI API key in AI Settings';
                }

                showStatus(errorMsg, 'error');
                console.error('AI Generation Error:', xhr);
            },
            complete: function() {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    /**
     * Convert HTML directly without AI (for testing)
     */
    function convertHTMLOnly(html) {
        const $btn = $('#angie-convert-html-btn');
        const originalHtml = $btn.html();

        $btn.prop('disabled', true).html('<i class="eicon-loading eicon-animation-spin"></i> Converting...');
        showStatus('🔄 Converting HTML to Elementor...', 'info');

        $.ajax({
            url: wpApiSettings.root + 'angie/v1/ai-convert',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                html: html
            }),
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', wpApiSettings.nonce);
            },
            success: function(response) {
                if (response.success && response.elements) {
                    showStatus('✅ Success! HTML converted to ' + response.elements.length + ' Elementor element(s)', 'success');
                    displayElements(response.elements, html);
                    
                    // Trigger event for insert button
                    $('#angie-ai-converter-modal').trigger('elementsConverted', [response.elements]);
                } else {
                    showStatus('❌ Conversion failed: Invalid response', 'error');
                    console.error('Response:', response);
                }
            },
            error: function(xhr) {
                let errorMsg = '❌ Conversion failed';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg += ': ' + xhr.responseJSON.message;
                }

                showStatus(errorMsg, 'error');
                console.error('Conversion Error:', xhr);
            },
            complete: function() {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    /**
     * Display converted elements
     */
    function displayElements(elements, generatedHtml) {
        const jsonStr = JSON.stringify(elements, null, 2);
        const count = elements.length;

        // Store data in window for copy functionality (avoid attribute size limits)
        window.angieConvertedData = {
            html: generatedHtml || '',
            json: elements,
            jsonString: jsonStr
        };

        let html = `
            <div class="angie-output-success">
                <div class="angie-output-header">
                    <i class="eicon-check-circle"></i>
                    <strong>${count} element${count > 1 ? 's' : ''} ready to insert</strong>
                </div>
        `;

        // Show generated HTML if available
        if (generatedHtml) {
            // Show full HTML in scrollable box (no truncation)
            const escapedHtml = $('<div>').text(generatedHtml).html(); // Escape HTML for display
                
            html += `
                <div class="angie-html-preview">
                    <div class="angie-preview-header">
                        <strong>📝 Source HTML</strong>
                        <button class="angie-copy-html-btn" title="Copy HTML to clipboard">
                            <i class="eicon-copy"></i> Copy
                        </button>
                    </div>
                    <pre class="angie-code-output">${escapedHtml}</pre>
                </div>
            `;
        }

        html += `
                <div class="angie-json-preview">
                    <div class="angie-preview-header">
                        <strong>⚡ Elementor JSON (${count} elements)</strong>
                        <div class="angie-btn-group">
                            <button class="angie-toggle-json-btn" title="Show/Hide JSON">
                                <i class="eicon-eye"></i> <span>Show</span>
                            </button>
                            <button class="angie-copy-json-btn" title="Copy JSON to clipboard">
                                <i class="eicon-copy"></i> Copy
                            </button>
                        </div>
                    </div>
                    <pre class="angie-code-output angie-json-output" style="display: none;">${jsonStr}</pre>
                </div>
            </div>
        `;

        $('#angie-output').html(html);

        // Copy HTML button
        $('.angie-copy-html-btn').on('click', function() {
            const data = window.angieConvertedData;
            if (!data || !data.html) {
                showStatus('No HTML to copy!', 'error');
                return;
            }
            
            navigator.clipboard.writeText(data.html).then(function() {
                showStatus('✓ HTML copied to clipboard!', 'success');
                $(this).html('<i class="eicon-check"></i> Copied!');
                setTimeout(() => {
                    $('.angie-copy-html-btn').html('<i class="eicon-copy"></i> Copy');
                }, 2000);
            }.bind(this)).catch(function(err) {
                showStatus('Failed to copy: ' + err, 'error');
            });
        });

        // Copy JSON button
        $('.angie-copy-json-btn').on('click', function() {
            const data = window.angieConvertedData;
            if (!data || !data.jsonString) {
                showStatus('No JSON to copy!', 'error');
                return;
            }
            
            navigator.clipboard.writeText(data.jsonString).then(function() {
                showStatus('✓ JSON copied to clipboard!', 'success');
                $(this).html('<i class="eicon-check"></i> Copied!');
                setTimeout(() => {
                    $('.angie-copy-json-btn').html('<i class="eicon-copy"></i> Copy');
                }, 2000);
            }.bind(this)).catch(function(err) {
                showStatus('Failed to copy: ' + err, 'error');
            });
        });

        // Toggle JSON visibility
        $('.angie-toggle-json-btn').on('click', function() {
            const $json = $('.angie-json-output');
            const $span = $(this).find('span');
            
            $json.slideToggle(300, function() {
                if ($json.is(':visible')) {
                    $span.text('Hide');
                } else {
                    $span.text('Show');
                }
            });
        });
    }

    /**
     * Normalize element to ensure it has all required Elementor properties
     */
    function normalizeElement(element) {
        // Ensure element has all required base properties
        const normalized = {
            id: element.id || generateRandomId(),
            elType: element.elType || 'widget',
            settings: element.settings || {},
            elements: []
        };
        
        // Add type-specific properties
        if (element.elType === 'widget') {
            normalized.widgetType = element.widgetType || 'text-editor';
        }
        
        // Keep v4 Atomic styles (class-based styling)
        if (element.styles) {
            normalized.styles = element.styles;
        }
        
        // Recursively normalize child elements
        if (element.elements && Array.isArray(element.elements)) {
            normalized.elements = element.elements.map(child => normalizeElement(child));
        }
        
        return normalized;
    }
    
    /**
     * Generate random ID for Elementor elements
     */
    function generateRandomId() {
        return Math.random().toString(36).substr(2, 7);
    }

    /**
     * Insert elements into Elementor
     */
    function insertElements(elements) {
        if (typeof elementor === 'undefined' || typeof $e === 'undefined') {
            showStatus('❌ Elementor not available!', 'error');
            return;
        }

        const selectedContainer = getSelectedContainer();
        
        if (!selectedContainer) {
            showStatus('❌ No container selected!', 'error');
            return;
        }

        try {
            // Get the container to insert into
            let targetContainer = selectedContainer.view;
            
            // If the view has a getContainer method, use it
            if (typeof targetContainer.getContainer === 'function') {
                targetContainer = targetContainer.getContainer();
            }
            
            // Normalize all elements before insertion
            const normalizedElements = elements.map(el => normalizeElement(el));
            
            console.log('Normalized elements:', normalizedElements);
            
            // Insert each element
            const insertedElements = [];
            
            normalizedElements.forEach(function(element, index) {
                console.log(`Inserting element ${index + 1}:`, element);
                
                try {
                    // Insert element using Elementor's command system
                    const result = $e.run('document/elements/create', {
                        model: element,
                        container: targetContainer,
                        options: {
                            at: index,  // Insert at specific position
                            edit: false  // Don't open edit panel
                        }
                    });
                    
                    if (result) {
                        insertedElements.push(result);
                        console.log(`Element ${index + 1} inserted successfully`);
                        
                        // Force model to be editable
                        if (result.model) {
                            result.model.trigger('request:edit');
                        }
                    }
                } catch (insertError) {
                    console.error(`Failed to insert element ${index + 1}:`, insertError, element);
                }
            });

            // CRITICAL: Mark document as modified
            if (elementor.documents && elementor.documents.getCurrent()) {
                const currentDoc = elementor.documents.getCurrent();
                
                // Set document as draft
                if (currentDoc.editor) {
                    currentDoc.editor.status = 'draft';
                }
                
                // Mark as changed
                if (currentDoc.$e) {
                    currentDoc.$e.internal('document/save/set-is-modified', { status: true });
                }
            }
            
            // Force saver to recognize changes
            if (elementor.saver) {
                elementor.saver.setFlagEditorChange(true);
                
                // Trigger autosave check
                if (elementor.saver.autoSave) {
                    elementor.saver.autoSave.update();
                }
            }
            
            // Trigger editor change events
            if (elementor.channels && elementor.channels.data) {
                elementor.channels.data.trigger('document:loaded');
            }
            
            // Force navigator refresh (shows delete buttons)
            if (elementor.navigator) {
                setTimeout(function() {
                    if (elementor.navigator.refresh) {
                        elementor.navigator.refresh();
                    }
                }, 200);
            }

            showStatus(`✅ ${insertedElements.length} element(s) inserted successfully!`, 'success');
            
            // Close modal after 1.5 seconds
            setTimeout(function() {
                $('#angie-ai-converter-modal').remove();
            }, 1500);

        } catch (error) {
            showStatus('❌ Insert failed: ' + error.message, 'error');
            console.error('Insert Error:', error);
            console.error('Selected Container:', selectedContainer);
            console.error('Elements to insert:', elements);
        }
    }

    /**
     * Show status message
     */
    function showStatus(message, type) {
        const icons = {
            info: 'eicon-info-circle',
            success: 'eicon-check-circle',
            error: 'eicon-close-circle'
        };

        const html = `
            <div class="angie-status-${type}">
                <i class="${icons[type] || 'eicon-info-circle'}"></i>
                ${message}
            </div>
        `;

        $('#angie-status').html(html);

        // Auto-clear success messages
        if (type === 'success') {
            setTimeout(function() {
                $('#angie-status').fadeOut(function() {
                    $(this).empty().show();
                });
            }, 3000);
        }
    }

    /**
     * Add modal styles
     */
    function addModalStyles() {
        if ($('#angie-modal-styles').length) {
            return;
        }

        const styles = `
            <style id="angie-modal-styles">
                .angie-modal-overlay {
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.8);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    animation: fadeIn 0.3s;
                }

                .angie-modal-container {
                    background: #fff;
                    border-radius: 8px;
                    max-width: 800px;
                    width: 90%;
                    max-height: 90vh;
                    overflow: hidden;
                    display: flex;
                    flex-direction: column;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
                    animation: slideIn 0.3s;
                }

                .angie-modal-header {
                    padding: 20px 24px;
                    border-bottom: 1px solid #e0e0e0;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #92003B;
                    color: white;
                }

                .angie-modal-header h2 {
                    margin: 0;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                .angie-modal-close {
                    background: none;
                    border: none;
                    font-size: 28px;
                    cursor: pointer;
                    color: white;
                    opacity: 0.8;
                    transition: opacity 0.3s;
                }

                .angie-modal-close:hover {
                    opacity: 1;
                }

                .angie-modal-body {
                    padding: 24px;
                    overflow-y: auto;
                    flex: 1;
                }

                .angie-container-info {
                    background: #e8f4fd;
                    border-left: 4px solid #2196F3;
                    padding: 12px 16px;
                    margin-bottom: 20px;
                    border-radius: 4px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    color: #0d47a1;
                }

                .angie-tabs {
                    display: flex;
                    gap: 0;
                    margin-bottom: 20px;
                    border-bottom: 2px solid #ddd;
                }

                .angie-tab {
                    flex: 1;
                    padding: 12px 20px;
                    background: transparent;
                    border: none;
                    border-bottom: 3px solid transparent;
                    cursor: pointer;
                    font-weight: 600;
                    color: #666;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                }

                .angie-tab:hover {
                    background: #f8f9fa;
                    color: #333;
                }

                .angie-tab-active {
                    color: #92003B;
                    border-bottom-color: #92003B;
                    background: #fff;
                }

                .angie-tab-content {
                    display: none;
                }

                .angie-tab-content-active {
                    display: block;
                }

                .angie-form-group {
                    margin-bottom: 20px;
                }

                .angie-form-group label {
                    display: block;
                    margin-bottom: 8px;
                    color: #333;
                }

                .angie-textarea,
                .angie-input {
                    width: 100%;
                    padding: 12px;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 13px;
                    resize: vertical;
                    transition: border-color 0.3s;
                }

                .angie-textarea:focus,
                .angie-input:focus {
                    outline: none;
                    border-color: #92003B;
                }

                .angie-button-group {
                    display: flex;
                    gap: 12px;
                    margin-bottom: 20px;
                }

                .angie-btn {
                    padding: 12px 24px;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-weight: 600;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    transition: all 0.3s;
                }

                .angie-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }

                .angie-btn-primary {
                    background: #92003B;
                    color: white;
                    flex: 1;
                }

                .angie-btn-primary:hover:not(:disabled) {
                    background: #D5001C;
                }

                .angie-btn-success {
                    background: #28a745;
                    color: white;
                }

                .angie-btn-success:hover:not(:disabled) {
                    background: #218838;
                }

                .angie-status {
                    padding: 12px;
                    border-radius: 4px;
                    margin-bottom: 16px;
                    min-height: 20px;
                }

                .angie-status-info {
                    background: #e3f2fd;
                    color: #1976d2;
                    border-left: 4px solid #2196F3;
                }

                .angie-status-success {
                    background: #e8f5e9;
                    color: #2e7d32;
                    border-left: 4px solid #4caf50;
                }

                .angie-status-error {
                    background: #ffebee;
                    color: #c62828;
                    border-left: 4px solid #f44336;
                }

                .angie-output {
                    background: #f8f9fa;
                    border: 2px solid #ddd;
                    border-radius: 4px;
                    padding: 16px;
                    min-height: 150px;
                    max-height: 400px;
                    overflow: auto;
                }

                .angie-placeholder {
                    text-align: center;
                    color: #999;
                    padding: 40px 20px;
                }

                .angie-placeholder i {
                    font-size: 48px;
                    margin-bottom: 16px;
                    opacity: 0.5;
                }

                .angie-placeholder p {
                    margin: 8px 0;
                }

                .angie-placeholder .small {
                    font-size: 12px;
                    color: #bbb;
                }

                .angie-output-success {
                    color: #333;
                }

                .angie-output-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 16px;
                    padding: 12px;
                    background: #e8f5e9;
                    border-radius: 4px;
                    border-left: 4px solid #4caf50;
                }

                .angie-html-preview,
                .angie-json-preview {
                    margin-bottom: 16px;
                }

                .angie-preview-header {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    padding: 10px 12px;
                    background: #f0f0f0;
                    border-radius: 4px 4px 0 0;
                }

                .angie-btn-group {
                    display: flex;
                    gap: 8px;
                }

                .angie-code-output {
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 16px;
                    border-radius: 0 0 4px 4px;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
                    font-size: 12px;
                    line-height: 1.6;
                    overflow-x: auto;
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                    max-height: 300px;
                    overflow-y: auto;
                }

                .angie-copy-btn,
                .angie-copy-json-btn,
                .angie-copy-html-btn,
                .angie-toggle-json-btn {
                    padding: 6px 12px;
                    background: #6c757d;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 12px;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    transition: all 0.3s;
                }

                .angie-copy-btn:hover,
                .angie-copy-json-btn:hover,
                .angie-copy-html-btn:hover,
                .angie-toggle-json-btn:hover {
                    background: #5a6268;
                }

                .angie-html-output,
                .angie-json-output {
                    background: #282c34;
                    color: #abb2bf;
                    padding: 16px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                    font-size: 12px;
                    overflow-x: auto;
                    margin: 0;
                    white-space: pre-wrap;
                    word-break: break-word;
                }

                .angie-modal-footer {
                    padding: 16px 24px;
                    border-top: 1px solid #e0e0e0;
                    background: #f8f9fa;
                    text-align: center;
                }

                .angie-settings-link {
                    color: #92003B;
                    text-decoration: none;
                    display: inline-flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 600;
                }

                .angie-settings-link:hover {
                    color: #D5001C;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideIn {
                    from { transform: translateY(-50px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            </style>
        `;

        $('head').append(styles);
    }

    // Export to global
    window.angieAI = {
        showConverter: window.showAngieAIConverter,
        getSelectedContainer: getSelectedContainer
    };

    console.log('✅ Angie AI HTML Converter loaded!');

})(jQuery);
