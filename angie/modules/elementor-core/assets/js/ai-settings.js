/**
 * Angie AI Settings Page JavaScript
 */
(function($) {
    'use strict';

    let currentSettings = {};

    /**
     * Initialize settings page
     */
    function init() {
        loadSettings();
        bindEvents();
    }

    /**
     * Load current settings
     */
    function loadSettings() {
        $('#loading-indicator').show();

        $.ajax({
            url: angieAiSettings.restUrl + 'ai-settings',
            method: 'GET',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', angieAiSettings.nonce);
            },
            success: function(response) {
                if (response.success && response.data) {
                    currentSettings = response.data;
                    populateForm(response.data);
                }
            },
            error: function(xhr) {
                showMessage('Failed to load settings', 'error');
            },
            complete: function() {
                $('#loading-indicator').hide();
            }
        });
    }

    /**
     * Populate form with settings
     */
    function populateForm(data) {
        // Don't populate actual API key (security), show status only
        if (data.has_api_key) {
            $('#api-key-status')
                .text('✓ API Key configured: ' + (data.api_key_masked || '****'))
                .addClass('has-key')
                .show();
            $('#api_key').attr('placeholder', 'Enter new API key to change');
        }

        if (data.endpoint) {
            $('#endpoint').val(data.endpoint);
        }

        if (data.model) {
            // Check if it's a standard model or custom
            const standardModels = ['gpt-4', 'gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'];
            
            if (standardModels.includes(data.model)) {
                $('#model').val(data.model);
            } else {
                // Custom model
                $('#model').val('custom');
                $('#custom_model').val(data.model);
                $('#custom-model-wrapper').show();
            }
        }

        if (data.temperature !== undefined) {
            $('#temperature').val(data.temperature);
        }
    }

    /**
     * Bind event handlers
     */
    function bindEvents() {
        // Save settings
        $('#angie-ai-settings-form').on('submit', function(e) {
            e.preventDefault();
            saveSettings();
        });

        // Test connection
        $('#test-connection-btn').on('click', function(e) {
            e.preventDefault();
            testConnection();
        });

        // Toggle custom model input
        $('#model').on('change', function() {
            if ($(this).val() === 'custom') {
                $('#custom-model-wrapper').slideDown();
            } else {
                $('#custom-model-wrapper').slideUp();
            }
        });
    }

    /**
     * Save settings
     */
    function saveSettings() {
        const $btn = $('#save-settings-btn');
        const originalText = $btn.text();

        // Get form data
        let modelValue = $('#model').val();
        
        // If custom model selected, use custom model name
        if (modelValue === 'custom') {
            modelValue = $('#custom_model').val().trim();
            if (!modelValue) {
                showMessage('Please enter a custom model name', 'error');
                return;
            }
        }

        const formData = {
            endpoint: $('#endpoint').val().trim(),
            model: modelValue,
            temperature: parseFloat($('#temperature').val())
        };

        // Only include API key if it's changed/entered
        const apiKey = $('#api_key').val().trim();
        if (apiKey) {
            formData.api_key = apiKey;
        }

        // Validate
        if (!formData.endpoint) {
            showMessage(angieAiSettings.i18n.endpointRequired, 'error');
            return;
        }

        if (apiKey || !currentSettings.has_api_key) {
            if (!apiKey) {
                showMessage(angieAiSettings.i18n.apiKeyRequired, 'error');
                return;
            }
        }

        // Disable button
        $btn.prop('disabled', true).text(angieAiSettings.i18n.saving || 'Saving...');

        $.ajax({
            url: angieAiSettings.restUrl + 'ai-settings',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(formData),
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', angieAiSettings.nonce);
            },
            success: function(response) {
                if (response.success) {
                    showMessage(response.message || angieAiSettings.i18n.saved, 'success');
                    
                    // Clear API key field after save
                    $('#api_key').val('');
                    
                    // Reload settings to update status
                    setTimeout(function() {
                        loadSettings();
                    }, 1000);
                } else {
                    showMessage(response.message || angieAiSettings.i18n.saveFailed, 'error');
                }
            },
            error: function(xhr) {
                let errorMsg = angieAiSettings.i18n.saveFailed;
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showMessage(errorMsg, 'error');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    }

    /**
     * Test connection
     */
    function testConnection() {
        const $btn = $('#test-connection-btn');
        const originalText = $btn.text();

        // Check if API key is configured
        const apiKey = $('#api_key').val().trim();
        if (!apiKey && !currentSettings.has_api_key) {
            showMessage('Please enter and save your API key first', 'error');
            return;
        }

        // If settings not saved yet
        if (apiKey || $('#endpoint').val() !== currentSettings.endpoint) {
            showMessage('Please save your settings first, then test', 'error');
            return;
        }

        $btn.prop('disabled', true).text(angieAiSettings.i18n.testing || 'Testing...');

        $.ajax({
            url: angieAiSettings.restUrl + 'ai-settings/test',
            method: 'POST',
            beforeSend: function(xhr) {
                xhr.setRequestHeader('X-WP-Nonce', angieAiSettings.nonce);
            },
            success: function(response) {
                if (response.success) {
                    let message = angieAiSettings.i18n.testSuccess || 'Connection Successful!';
                    if (response.data && response.data.response) {
                        message += ' - Response: ' + response.data.response;
                    }
                    showMessage(message, 'success');
                } else {
                    showMessage(response.message || angieAiSettings.i18n.testFailed, 'error');
                }
            },
            error: function(xhr) {
                let errorMsg = angieAiSettings.i18n.testFailed || 'Connection Failed';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    errorMsg = xhr.responseJSON.message;
                }
                
                showMessage(errorMsg, 'error');
            },
            complete: function() {
                $btn.prop('disabled', false).text(originalText);
            }
        });
    }

    /**
     * Show message
     */
    function showMessage(message, type) {
        const $container = $('#settings-messages');
        const cssClass = type === 'success' ? 'notice-success' : 'notice-error';
        
        const $message = $('<div>')
            .addClass('notice ' + cssClass)
            .html('<p>' + message + '</p>');

        $container.empty().append($message);

        // Auto-hide after 5 seconds
        setTimeout(function() {
            $message.fadeOut(function() {
                $(this).remove();
            });
        }, 5000);
    }

    // Initialize when document ready
    $(document).ready(init);

})(jQuery);
