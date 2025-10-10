/**
 * Angie HTML to Elementor JSON Converter
 * 
 * JavaScript tool để convert HTML thành exact Elementor JSON format
 * Chạy trong browser console hoặc inject vào Elementor Editor
 * 
 * @package Angie
 * @version 1.0.0
 */

(function(window) {
    'use strict';

    /**
     * Main Converter Class
     */
    class AngieHtmlToElementor {
        constructor() {
            this.elementIdCounter = 0;
        }

        /**
         * Generate unique element ID (giống Elementor format)
         * @returns {string} 8-character hex ID
         */
        generateId() {
            // Elementor format: 8 hex characters
            return Math.random().toString(16).substr(2, 8);
        }

        /**
         * Parse HTML string và convert sang Elementor JSON
         * @param {string} html - HTML string to parse
         * @returns {Array} Array of Elementor element objects
         */
        parseHtml(html) {
            // Create temporary container
            const temp = document.createElement('div');
            temp.innerHTML = html.trim();

            const elements = [];
            
            // Parse each top-level node
            Array.from(temp.childNodes).forEach(node => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    const element = this.parseNode(node);
                    if (element) {
                        elements.push(element);
                    }
                }
            });

            return elements;
        }

        /**
         * Parse DOM node thành Elementor element
         * @param {HTMLElement} node - DOM node to parse
         * @returns {Object|null} Elementor element object
         */
        parseNode(node) {
            const tagName = node.tagName.toLowerCase();

            // Map HTML tags to Elementor widgets
            switch(tagName) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'h4':
                case 'h5':
                case 'h6':
                    return this.createHeading(node);
                
                case 'p':
                    return this.createTextEditor(node);
                
                case 'img':
                    return this.createImage(node);
                
                case 'a':
                    return this.createButton(node);
                
                case 'button':
                    return this.createButton(node);
                
                case 'ul':
                case 'ol':
                    return this.createIconList(node);
                
                case 'div':
                case 'section':
                case 'article':
                case 'aside':
                    return this.createContainer(node);
                
                case 'video':
                    return this.createVideo(node);
                
                case 'iframe':
                    return this.createHtml(node);
                
                default:
                    // Unknown tag -> HTML widget
                    return this.createHtml(node);
            }
        }

        /**
         * Create Heading widget
         */
        createHeading(node) {
            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    title: node.textContent.trim(),
                    header_size: node.tagName.toLowerCase(),
                    align: this.getAlignment(node),
                    title_color: this.getColor(node),
                    typography_typography: 'custom'
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'heading',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Text Editor widget
         */
        createTextEditor(node) {
            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    editor: node.innerHTML.trim(),
                    text_color: this.getColor(node),
                    typography_typography: 'custom'
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'text-editor',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Image widget
         */
        createImage(node) {
            const src = node.getAttribute('src') || '';
            const alt = node.getAttribute('alt') || '';
            const width = node.getAttribute('width') || '';
            const height = node.getAttribute('height') || '';

            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    image: {
                        url: src,
                        id: '',
                        alt: alt,
                        source: 'library'
                    },
                    image_size: 'full',
                    width: width ? { unit: 'px', size: parseInt(width) } : { unit: '%', size: 100 },
                    height: height ? { unit: 'px', size: parseInt(height) } : { unit: 'px', size: '' },
                    align: this.getAlignment(node),
                    caption_source: 'none'
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'image',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Button widget (for <a> or <button>)
         */
        createButton(node) {
            const text = node.textContent.trim();
            const href = node.getAttribute('href') || '#';
            const target = node.getAttribute('target') || '';

            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    text: text,
                    link: {
                        url: href,
                        is_external: target === '_blank' ? 'on' : '',
                        nofollow: node.getAttribute('rel')?.includes('nofollow') ? 'on' : '',
                        custom_attributes: ''
                    },
                    align: this.getAlignment(node),
                    size: 'md',
                    typography_typography: 'custom',
                    button_type: 'primary',
                    button_text_color: this.getColor(node),
                    background_color: this.getBackgroundColor(node)
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'button',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Icon List widget (for <ul> or <ol>)
         */
        createIconList(node) {
            const items = [];
            const listItems = node.querySelectorAll('li');

            listItems.forEach(li => {
                items.push({
                    text: li.textContent.trim(),
                    icon: {
                        value: 'fas fa-check',
                        library: 'fa-solid'
                    },
                    link: {
                        url: '',
                        is_external: '',
                        nofollow: ''
                    },
                    _id: this.generateId()
                });
            });

            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    icon_list: items,
                    space_between: {
                        unit: 'px',
                        size: 15
                    },
                    icon_color: '#000000',
                    text_color: '#000000'
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'icon-list',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Video widget
         */
        createVideo(node) {
            const src = node.getAttribute('src') || '';
            
            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    video_type: 'hosted',
                    hosted_url: {
                        url: src,
                        id: ''
                    },
                    aspect_ratio: '169',
                    autoplay: node.hasAttribute('autoplay') ? 'yes' : '',
                    mute: node.hasAttribute('muted') ? 'yes' : '',
                    loop: node.hasAttribute('loop') ? 'yes' : '',
                    controls: node.hasAttribute('controls') ? 'yes' : ''
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'video',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create HTML widget (fallback)
         */
        createHtml(node) {
            return {
                id: this.generateId(),
                elType: 'widget',
                isInner: false,
                isLocked: false,
                settings: {
                    html: node.outerHTML
                },
                defaultEditSettings: {
                    defaultEditRoute: 'content'
                },
                elements: [],
                widgetType: 'html',
                editSettings: {
                    defaultEditRoute: 'content'
                },
                htmlCache: ''
            };
        }

        /**
         * Create Container (Section with Column)
         */
        createContainer(node) {
            const children = [];
            
            // Parse children
            Array.from(node.children).forEach(child => {
                const element = this.parseNode(child);
                if (element) {
                    element.isInner = true; // Mark as inner element
                    children.push(element);
                }
            });

            // Create column
            const column = {
                id: this.generateId(),
                elType: 'column',
                isInner: false,
                isLocked: false,
                settings: {
                    _column_size: 100,
                    _inline_size: null
                },
                defaultEditSettings: {},
                elements: children,
                editSettings: {}
            };

            // Create section
            return {
                id: this.generateId(),
                elType: 'section',
                isInner: false,
                isLocked: false,
                settings: {
                    structure: '10',
                    content_width: 'boxed',
                    gap: 'default'
                },
                defaultEditSettings: {},
                elements: [column],
                editSettings: {}
            };
        }

        /**
         * Get text alignment from node
         */
        getAlignment(node) {
            const align = node.style.textAlign || 
                         window.getComputedStyle(node).textAlign;
            
            switch(align) {
                case 'center': return 'center';
                case 'right': return 'right';
                case 'justify': return 'justify';
                default: return 'left';
            }
        }

        /**
         * Get color from node
         */
        getColor(node) {
            const color = node.style.color || 
                         window.getComputedStyle(node).color;
            return this.rgbToHex(color) || '';
        }

        /**
         * Get background color from node
         */
        getBackgroundColor(node) {
            const bgColor = node.style.backgroundColor || 
                           window.getComputedStyle(node).backgroundColor;
            return this.rgbToHex(bgColor) || '';
        }

        /**
         * Convert RGB to Hex
         */
        rgbToHex(rgb) {
            if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '';
            
            const match = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)/);
            if (!match) return '';
            
            const r = parseInt(match[1]);
            const g = parseInt(match[2]);
            const b = parseInt(match[3]);
            
            return '#' + [r, g, b].map(x => {
                const hex = x.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            }).join('');
        }

        /**
         * Convert HTML và copy JSON to clipboard
         */
        async convertAndCopy(html) {
            const elements = this.parseHtml(html);
            const json = JSON.stringify(elements, null, 2);
            
            try {
                await navigator.clipboard.writeText(json);
                console.log('✅ JSON copied to clipboard!');
                console.log('Elements:', elements);
                return { success: true, elements, json };
            } catch (err) {
                console.error('Failed to copy:', err);
                console.log('JSON Output:', json);
                return { success: false, elements, json };
            }
        }

        /**
         * Show conversion modal in Elementor
         */
        showModal() {
            // Create modal HTML
            const modalHtml = `
                <div id="angie-html-converter-modal" style="
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0,0,0,0.8);
                    z-index: 999999;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                ">
                    <div style="
                        background: white;
                        border-radius: 8px;
                        padding: 30px;
                        max-width: 800px;
                        width: 90%;
                        max-height: 90%;
                        overflow: auto;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.3);
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                            <h2 style="margin: 0; color: #92003B;">Angie HTML to Elementor Converter</h2>
                            <button id="angie-modal-close" style="
                                background: none;
                                border: none;
                                font-size: 24px;
                                cursor: pointer;
                                color: #999;
                            ">&times;</button>
                        </div>
                        
                        <div style="margin-bottom: 20px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: 600;">Paste HTML:</label>
                            <textarea id="angie-html-input" style="
                                width: 100%;
                                height: 200px;
                                padding: 10px;
                                border: 2px solid #ddd;
                                border-radius: 4px;
                                font-family: monospace;
                                font-size: 13px;
                                resize: vertical;
                            " placeholder="<div><button>Click Here</button></div>"></textarea>
                        </div>

                        <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                            <button id="angie-convert-btn" style="
                                background: #92003B;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: 600;
                                flex: 1;
                            ">Convert to JSON</button>
                            
                            <button id="angie-copy-json-btn" style="
                                background: #6c757d;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: 600;
                            " disabled>Copy JSON</button>
                            
                            <button id="angie-insert-btn" style="
                                background: #28a745;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 4px;
                                cursor: pointer;
                                font-weight: 600;
                            " disabled>Insert to Page</button>
                        </div>

                        <div id="angie-output" style="
                            background: #f8f9fa;
                            border: 2px solid #ddd;
                            border-radius: 4px;
                            padding: 15px;
                            min-height: 150px;
                            max-height: 300px;
                            overflow: auto;
                        ">
                            <p style="color: #999; text-align: center;">JSON output will appear here...</p>
                        </div>

                        <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 4px; font-size: 13px;">
                            <strong>💡 Tip:</strong> Paste HTML → Convert → Copy JSON or Insert directly to page
                        </div>
                    </div>
                </div>
            `;

            // Insert modal
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Bind events
            this.bindModalEvents();
        }

        /**
         * Bind modal events
         */
        bindModalEvents() {
            const modal = document.getElementById('angie-html-converter-modal');
            const closeBtn = document.getElementById('angie-modal-close');
            const convertBtn = document.getElementById('angie-convert-btn');
            const copyBtn = document.getElementById('angie-copy-json-btn');
            const insertBtn = document.getElementById('angie-insert-btn');
            const input = document.getElementById('angie-html-input');
            const output = document.getElementById('angie-output');

            let currentElements = null;

            // Close modal
            closeBtn.onclick = () => modal.remove();
            modal.onclick = (e) => {
                if (e.target === modal) modal.remove();
            };

            // Convert button
            convertBtn.onclick = () => {
                const html = input.value.trim();
                if (!html) {
                    alert('Please paste HTML first!');
                    return;
                }

                const elements = this.parseHtml(html);
                currentElements = elements;
                
                const json = JSON.stringify(elements, null, 2);
                output.innerHTML = `<pre style="margin: 0; font-family: monospace; font-size: 12px; white-space: pre-wrap;">${json}</pre>`;
                
                // Enable buttons
                copyBtn.disabled = false;
                insertBtn.disabled = false;
                copyBtn.style.opacity = '1';
                insertBtn.style.opacity = '1';

                console.log('✅ Converted:', elements);
            };

            // Copy JSON button
            copyBtn.onclick = async () => {
                if (!currentElements) return;
                
                const json = JSON.stringify(currentElements);
                try {
                    await navigator.clipboard.writeText(json);
                    copyBtn.textContent = '✓ Copied!';
                    setTimeout(() => {
                        copyBtn.textContent = 'Copy JSON';
                    }, 2000);
                } catch (err) {
                    alert('Failed to copy: ' + err.message);
                }
            };

            // Insert to page button
            insertBtn.onclick = () => {
                if (!currentElements) return;
                
                // Check if in Elementor
                if (typeof elementor === 'undefined' || typeof $e === 'undefined') {
                    alert('Please run this inside Elementor Editor!');
                    return;
                }

                try {
                    currentElements.forEach(element => {
                        $e.run('document/elements/create', {
                            model: element,
                            container: elementor.getPreviewContainer(),
                            options: {}
                        });
                    });

                    modal.remove();
                    alert('✅ Elements inserted successfully!');
                } catch (err) {
                    alert('Failed to insert: ' + err.message);
                    console.error(err);
                }
            };
        }
    }

    // Export to window
    window.AngieHtmlToElementor = AngieHtmlToElementor;
    
    // Create global instance
    window.angieConverter = new AngieHtmlToElementor();

    // Convenience function
    window.convertHtml = (html) => {
        return window.angieConverter.convertAndCopy(html);
    };

    // Show modal function
    window.showAngieConverter = () => {
        window.angieConverter.showModal();
    };

    console.log('✅ Angie HTML to Elementor Converter loaded!');
    console.log('📝 Usage: convertHtml("<div><button>Click</button></div>")');
    console.log('🎨 Or use: showAngieConverter() for modal UI');

})(window);
