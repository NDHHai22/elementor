/**
 * Atomic HTML to Elementor v4 Converter
 * 
 * Converts HTML with inline CSS to Elementor v4 Atomic Elements format
 * 
 * Based on: angie/modules/elementor-core/components/atomic-html-converter.php
 * 
 * Key differences from v3:
 * - Uses e-div-block instead of section/column
 * - Styles separated into styles object with CSS classes  
 * - All values are typed ($$type)
 * - Responsive variants instead of separate mobile/tablet settings
 * 
 * @package Angie Next.js
 */

import type { ElementorElement } from './elementor-types';

// ============================================================================
// TYPES
// ============================================================================

interface AtomicStyle {
  id: string;
  label: string;
  type: string;
  variants: Array<{
    meta: {
      breakpoint: string;
      state: string | null;
    };
    props: Record<string, any>;
    custom_css: string | null;
  }>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate unique element ID (7-character)
 */
function generateId(): string {
  return Math.random().toString(36).substr(2, 7);
}

/**
 * Simple MD5-like hash for class IDs (shortened)
 */
function md5Short(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16).substr(0, 7);
}

/**
 * Parse size value (e.g., "10px" -> {size: 10, unit: "px"})
 * Supports: px, em, rem, %, vh, vw, auto, unitless (for line-height)
 */
function parseSizeValue(value: string, property = ''): { size: number; unit: string } {
  value = value.trim();
  
  // Handle 'auto' value
  if (value === 'auto') {
    return { size: 0, unit: 'auto' };
  }
  
  // Handle numeric values with units
  const match = value.match(/^([\d.]+)(.*)$/);
  
  const size = match?.[1] ? parseFloat(match[1]) : 0;
  let unit = match?.[2]?.trim() || '';
  
  // If no unit provided, check if property should be unitless
  if (!unit) {
    const unitlessProps = ['line-height', 'z-index', 'opacity', 'flex-grow', 'flex-shrink', 'order'];
    unit = unitlessProps.includes(property) ? '' : 'px';
  }
  
  return { size, unit };
}

/**
 * Expand shorthand dimensions (e.g., "10px 20px" -> {top, right, bottom, left})
 */
function expandShorthandDimensions(values: string[]): Record<string, string> {
  const count = values.length;
  
  if (count === 1) {
    return { top: values[0], right: values[0], bottom: values[0], left: values[0] };
  }
  
  if (count === 2) {
    return { top: values[0], right: values[1], bottom: values[0], left: values[1] };
  }
  
  if (count === 3) {
    return { top: values[0], right: values[1], bottom: values[2], left: values[1] };
  }
  
  return { top: values[0], right: values[1], bottom: values[2], left: values[3] };
}

/**
 * Expand border-radius shorthand to corner names
 */
function expandBorderRadius(values: string[]): Record<string, string> {
  const count = values.length;
  
  if (count === 1) {
    return {
      'start-start': values[0],
      'start-end': values[0],
      'end-start': values[0],
      'end-end': values[0],
    };
  }
  
  if (count === 2) {
    return {
      'start-start': values[0],
      'start-end': values[1],
      'end-start': values[1],
      'end-end': values[0],
    };
  }
  
  if (count === 3) {
    return {
      'start-start': values[0],
      'start-end': values[1],
      'end-start': values[1],
      'end-end': values[2],
    };
  }
  
  return {
    'start-start': values[0],
    'start-end': values[1],
    'end-end': values[2],
    'end-start': values[3],
  };
}

/**
 * Convert physical directions to logical properties
 */
const LOGICAL_MAP: Record<string, string> = {
  'top': 'block-start',
  'bottom': 'block-end',
  'left': 'inline-start',
  'right': 'inline-end',
};

/**
 * Get inner HTML of node
 */
function getInnerHTML(node: Element): string {
  return node.innerHTML;
}

/**
 * Get element children (excluding text nodes)
 */
function getElementChildren(node: Element): Element[] {
  return Array.from(node.children);
}

// ============================================================================
// MAIN PARSER
// ============================================================================

/**
 * Parse HTML to Atomic Elements
 */
export function htmlToElementorJSON(html: string): ElementorElement[] {
  if (!html.trim()) {
    console.error('Empty HTML input');
    return [];
  }
  
  try {
    console.log('=== Atomic Converter Parse ===');
    
    const parser = new DOMParser();
    const wrappedHtml = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`;
    const doc = parser.parseFromString(wrappedHtml, 'text/html');
    
    const elements: ElementorElement[] = [];
    const body = doc.body;
    
    if (body && body.childNodes.length > 0) {
      body.childNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const element = parseNode(node as Element);
          if (element) {
            elements.push(element);
          }
        }
      });
    }
    
    console.log(`Atomic Converter: Generated ${elements.length} elements`);
    return elements;
    
  } catch (error) {
    console.error('Atomic Converter Error:', error);
    return [];
  }
}

/**
 * Parse DOM node to Atomic element
 */
function parseNode(node: Element): ElementorElement | null {
  // Skip comment nodes
  if (node.nodeType === Node.COMMENT_NODE) {
    return null;
  }
  
  // Skip text nodes
  if (node.nodeType === Node.TEXT_NODE) {
    return null;
  }
  
  const tag = node.tagName.toLowerCase();
  const styles = parseInlineStyles(node);
  
  console.log(`Parsing <${tag}>: ${Object.keys(styles).length} styles found`);
  if (Object.keys(styles).length > 0) {
    console.log('Styles:', styles);
  }
  
  // Determine element type
  const role = detectElementRole(node, tag);
  
  // Create element based on role
  switch (role) {
    case 'container':
      return createAtomicContainer(node, styles);
    
    case 'heading':
      return createAtomicHeading(node, styles, tag);
    
    case 'button':
      return createAtomicButton(node, styles);
    
    case 'image':
      return createAtomicImage(node, styles);
    
    case 'text':
    default:
      return createAtomicText(node, styles);
  }
}

/**
 * Detect element role based on HTML tag ONLY (no style inference)
 */
function detectElementRole(node: Element, tag: string): string {
  // Images
  if (tag === 'img') {
    return 'image';
  }
  
  // Headings
  if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
    return 'heading';
  }
  
  // Buttons (only <button> or <a> tags)
  if (tag === 'button' || tag === 'a') {
    return 'button';
  }
  
  // Inline text elements - always treat as text, never container
  const inlineTags = ['span', 'em', 'strong', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup'];
  if (inlineTags.includes(tag)) {
    return 'text';
  }
  
  // Check if element has children
  const children = getElementChildren(node);
  if (children.length > 0) {
    // Check if all children are inline formatting elements
    const inlineFormattingTags = ['br', 'span', 'em', 'strong', 'b', 'i', 'u', 'mark', 'small', 'sub', 'sup', 'a'];
    const allInline = children.every(child => {
      const childTag = child.tagName.toLowerCase();
      return inlineFormattingTags.includes(childTag);
    });
    
    // If all children are inline, treat as text (preserve innerHTML)
    if (allInline) {
      return 'text';
    }
    
    return 'container'; // e-div-block
  }
  
  // Default: text element (e-paragraph)
  return 'text';
}

/**
 * Parse inline styles to object
 */
function parseInlineStyles(node: Element): Record<string, string> {
  const styleAttr = node.getAttribute('style');
  if (!styleAttr) {
    return {};
  }
  
  const styles: Record<string, string> = {};
  const declarations = styleAttr.split(';');
  
  declarations.forEach(declaration => {
    const parts = declaration.split(':');
    if (parts.length === 2) {
      const property = parts[0].trim();
      const value = parts[1].trim();
      styles[property] = value;
    }
  });
  
  return styles;
}

// ============================================================================
// ELEMENT CREATORS
// ============================================================================

/**
 * Create Atomic container (e-div-block)
 */
function createAtomicContainer(node: Element, styles: Record<string, string>): ElementorElement {
  const elementId = generateId();
  
  // Parse children
  const children: ElementorElement[] = [];
  node.childNodes.forEach(child => {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const childElement = parseNode(child as Element);
      if (childElement) {
        children.push(childElement);
      }
    }
  });
  
  const element: ElementorElement = {
    id: elementId,
    elType: 'e-div-block',
    isInner: false,
    isLocked: false,
    settings: {},
    defaultEditSettings: {
      defaultEditRoute: 'content',
    },
    elements: children,
    styles: {},
    editor_settings: {},
    editSettings: {
      defaultEditRoute: 'content',
    },
    htmlCache: null,
  };
  
  // Add styles if container has any
  if (Object.keys(styles).length > 0) {
    const classId = `e-${elementId}-${md5Short(JSON.stringify(styles))}`;
    
    // Add classes to settings
    element.settings = {
      classes: {
        $$type: 'classes',
        value: [classId],
      },
    };
    
    // Add styles object
    element.styles = {
      [classId]: createAtomicStyle(classId, styles, 'container'),
    };
  }
  
  return element;
}

/**
 * Create Atomic heading (e-heading widget)
 */
function createAtomicHeading(node: Element, styles: Record<string, string>, tag: string): ElementorElement {
  return createAtomicWidget('e-heading', node, styles, {
    title: node.textContent?.trim() || '',
    tag,
  });
}

/**
 * Create Atomic button (e-button widget)
 */
function createAtomicButton(node: Element, styles: Record<string, string>): ElementorElement {
  const settings: any = {
    text: {
      $$type: 'string',
      value: node.textContent?.trim() || '',
    },
  };
  
  // Only add link if href exists (for <a> tags)
  const href = node.getAttribute('href');
  if (href) {
    settings.link = {
      $$type: 'link',
      value: {
        destination: {
          $$type: 'url',
          value: href,
        },
        label: {
          $$type: 'string',
          value: '',
        },
        isTargetBlank: {
          $$type: 'boolean',
          value: false,
        },
      },
    };
  }
  
  return createAtomicWidget('e-button', node, styles, settings);
}

/**
 * Create Atomic text (e-paragraph widget for v4)
 */
function createAtomicText(node: Element, styles: Record<string, string>): ElementorElement {
  const html = getInnerHTML(node);
  return createAtomicWidget('e-paragraph', node, styles, {
    paragraph: {
      $$type: 'string',
      value: html,
    },
  });
}

/**
 * Create Atomic image (e-image widget)
 */
function createAtomicImage(node: Element, styles: Record<string, string>): ElementorElement {
  const src = node.getAttribute('src') || '';
  const alt = node.getAttribute('alt') || '';
  
  // Note: In real implementation, you would upload image to WordPress
  // For now, we'll use external URL
  const settings: any = {
    image: {
      $$type: 'image',
      value: {
        src: {
          $$type: 'image-src',
          value: {
            id: {
              $$type: 'image-attachment-id',
              value: 0, // Would be attachment ID after upload
            },
            url: src,
          },
        },
      },
    },
  };
  
  // Add alt text if present
  if (alt) {
    settings.alt = alt;
  }
  
  return createAtomicWidget('e-image', node, styles, settings);
}

/**
 * Universal Atomic widget creator
 */
function createAtomicWidget(
  widgetType: string,
  node: Element,
  styles: Record<string, string>,
  customSettings: any = {}
): ElementorElement {
  const elementId = generateId();
  const classId = `e-${elementId}-${md5Short(JSON.stringify(styles))}`;
  
  // Only add classes if there are actual styles to apply
  const hasStyles = Object.keys(styles).length > 0;
  
  if (hasStyles) {
    customSettings.classes = {
      $$type: 'classes',
      value: [classId],
    };
  }
  
  const element: ElementorElement = {
    id: elementId,
    elType: 'widget',
    isInner: false,
    isLocked: false,
    settings: customSettings,
    defaultEditSettings: {
      defaultEditRoute: 'content',
    },
    elements: [],
    widgetType,
    htmlCache: '',
    editor_settings: {},
    editSettings: {
      defaultEditRoute: 'content',
    },
  };
  
  // Only add styles if there are actual styles
  if (hasStyles) {
    element.styles = {
      [classId]: createAtomicStyle(classId, styles, widgetType),
    };
  }
  
  return element;
}

// ============================================================================
// STYLE CONVERSION
// ============================================================================

/**
 * Create Atomic style object
 */
function createAtomicStyle(
  classId: string,
  cssStyles: Record<string, string>,
  elementType = 'container'
): AtomicStyle {
  let props: Record<string, any> = {};
  
  // Convert CSS to Atomic typed props
  Object.entries(cssStyles).forEach(([property, value]) => {
    const atomicProp = cssToAtomicProp(property, value, cssStyles);
    if (atomicProp) {
      props[atomicProp.name] = atomicProp.value;
    }
  });
  
  // Post-process: Group individual padding/margin properties into dimensions
  props = groupIndividualProperties(props);
  
  // Post-process: Merge background properties
  props = mergeBackgroundProperties(props, cssStyles);
  
  return {
    id: classId,
    label: 'local',
    type: 'class',
    variants: [
      {
        meta: {
          breakpoint: 'desktop',
          state: null,
        },
        props,
        custom_css: null,
      },
    ],
  };
}

/**
 * Group individual padding/margin properties into dimensions
 * Auto-fills missing sides with 0
 */
function groupIndividualProperties(props: Record<string, any>): Record<string, any> {
  // Auto-fill missing padding sides with 0
  const paddingSides = ['padding-top', 'padding-right', 'padding-bottom', 'padding-left'];
  let hasAnyPadding = false;
  
  paddingSides.forEach(side => {
    if (props[side]) {
      hasAnyPadding = true;
    }
  });
  
  // If we have at least one padding side, fill missing ones with 0
  if (hasAnyPadding) {
    const zeroValue = {
      $$type: 'size',
      value: { size: 0, unit: 'px' },
    };
    
    paddingSides.forEach(side => {
      if (!props[side]) {
        props[side] = zeroValue;
      }
    });
    
    // Now group padding into dimensions with logical properties
    const dimensionValues: Record<string, any> = {};
    
    paddingSides.forEach(side => {
      const logicalSide = LOGICAL_MAP[side.replace('padding-', '')];
      dimensionValues[logicalSide] = props[side];
      delete props[side]; // Remove individual property
    });
    
    props['padding'] = {
      $$type: 'dimensions',
      value: dimensionValues,
    };
  }
  
  // Auto-fill missing margin sides with 0
  const marginSides = ['margin-top', 'margin-right', 'margin-bottom', 'margin-left'];
  let hasAnyMargin = false;
  
  marginSides.forEach(side => {
    if (props[side]) {
      hasAnyMargin = true;
    }
  });
  
  // If we have at least one margin side, fill missing ones with 0
  if (hasAnyMargin) {
    const zeroValue = {
      $$type: 'size',
      value: { size: 0, unit: 'px' },
    };
    
    marginSides.forEach(side => {
      if (!props[side]) {
        props[side] = zeroValue;
      }
    });
    
    // Now group margin into dimensions with logical properties
    const dimensionValues: Record<string, any> = {};
    
    marginSides.forEach(side => {
      const logicalSide = LOGICAL_MAP[side.replace('margin-', '')];
      dimensionValues[logicalSide] = props[side];
      delete props[side]; // Remove individual property
    });
    
    props['margin'] = {
      $$type: 'dimensions',
      value: dimensionValues,
    };
  }
  
  return props;
}

/**
 * Merge background properties (size, position, repeat, attachment) into background overlay
 */
function mergeBackgroundProperties(
  props: Record<string, any>,
  cssStyles: Record<string, string>
): Record<string, any> {
  // Only process if background exists and is an image overlay
  if (!props.background) {
    return props;
  }
  
  const background = props.background;
  
  // Check if it's a background-image-overlay
  if (!background.value?.['background-overlay']?.value?.[0]?.$$type ||
      background.value['background-overlay'].value[0].$$type !== 'background-image-overlay') {
    return props;
  }
  
  // Get reference to image overlay value
  const overlay = background.value['background-overlay'].value[0].value;
  
  // Merge background-size
  if (cssStyles['background-size']) {
    overlay.size = {
      $$type: 'string',
      value: cssStyles['background-size'],
    };
  }
  
  // Merge background-position
  if (cssStyles['background-position']) {
    let position = cssStyles['background-position'];
    
    // Normalize single value to "horizontal vertical" format
    if (!/\s/.test(position)) {
      if (position === 'center') {
        position = 'center center';
      } else if (['top', 'bottom'].includes(position)) {
        position = `center ${position}`;
      } else if (['left', 'right'].includes(position)) {
        position = `${position} center`;
      }
    }
    
    overlay.position = {
      $$type: 'string',
      value: position,
    };
  }
  
  // Merge background-repeat
  if (cssStyles['background-repeat']) {
    overlay.repeat = {
      $$type: 'string',
      value: cssStyles['background-repeat'],
    };
  }
  
  // Merge background-attachment
  if (cssStyles['background-attachment']) {
    overlay.attachment = {
      $$type: 'string',
      value: cssStyles['background-attachment'],
    };
  }
  
  // Update props with merged background
  props.background = background;
  
  return props;
}

/**
 * Convert CSS property to Atomic typed prop
 */
function cssToAtomicProp(
  property: string,
  value: string,
  cssStyles: Record<string, string>
): { name: string; value: any } | null {
  // Skip background helper properties - they will be merged into background later
  const skipProps = ['background-size', 'background-position', 'background-repeat', 'background-attachment'];
  if (skipProps.includes(property)) {
    return null;
  }
  
  // Color properties
  if (['color', 'border-color'].includes(property)) {
    return {
      name: property,
      value: {
        $$type: 'color',
        value,
      },
    };
  }
  
  // Background-image with url()
  if (property === 'background-image') {
    const urlMatch = value.match(/url\(['"]?([^'"]+)['"]?\)/i);
    if (urlMatch) {
      const imageUrl = urlMatch[1];
      
      // Note: In real implementation, upload image to WordPress
      // For now, use URL directly
      return {
        name: 'background',
        value: {
          $$type: 'background',
          value: {
            color: {
              $$type: 'color',
              value: 'transparent',
            },
            'background-overlay': {
              $$type: 'background-overlay',
              value: [
                {
                  $$type: 'background-image-overlay',
                  value: {
                    image: {
                      $$type: 'image',
                      value: {
                        src: {
                          $$type: 'image-src',
                          value: {
                            id: {
                              $$type: 'image-attachment-id',
                              value: 0,
                            },
                            url: imageUrl,
                          },
                        },
                        size: {
                          $$type: 'string',
                          value: 'large',
                        },
                      },
                    },
                    position: {
                      $$type: 'string',
                      value: 'center center',
                    },
                    repeat: {
                      $$type: 'string',
                      value: 'no-repeat',
                    },
                    size: {
                      $$type: 'string',
                      value: 'cover',
                    },
                    attachment: {
                      $$type: 'string',
                      value: 'scroll',
                    },
                  },
                },
              ],
            },
          },
        },
      };
    }
    
    return null;
  }
  
  // Background-color or background shorthand
  if (property === 'background-color' || property === 'background') {
    // Check if it's a gradient
    if (value.includes('gradient')) {
      const gradient = parseGradient(value);
      if (gradient) {
        return {
          name: 'background',
          value: {
            $$type: 'background',
            value: {
              color: {
                $$type: 'color',
                value: 'transparent',
              },
              'background-overlay': {
                $$type: 'background-overlay',
                value: [
                  {
                    $$type: 'background-gradient-overlay',
                    value: gradient,
                  },
                ],
              },
            },
          },
        };
      } else {
        console.log(`Gradient format not recognized, skipping: ${value}`);
        return null;
      }
    }
    
    // Simple solid color background
    return {
      name: 'background',
      value: {
        $$type: 'background',
        value: {
          color: {
            $$type: 'color',
            value,
          },
        },
      },
    };
  }
  
  // Padding/Margin shorthand - expand to dimensions
  if (property === 'padding' || property === 'margin') {
    const values = value.trim().split(/\s+/);
    
    // If single value, use size type
    if (values.length === 1) {
      const parsed = parseSizeValue(values[0]);
      return {
        name: property,
        value: {
          $$type: 'size',
          value: parsed,
        },
      };
    }
    
    // Multiple values - expand to logical properties
    const dimensions = expandShorthandDimensions(values);
    const dimensionValues: Record<string, any> = {};
    
    Object.entries(dimensions).forEach(([side, sideValue]) => {
      const parsed = parseSizeValue(sideValue);
      const logicalSide = LOGICAL_MAP[side];
      dimensionValues[logicalSide] = {
        $$type: 'size',
        value: parsed,
      };
    });
    
    return {
      name: property,
      value: {
        $$type: 'dimensions',
        value: dimensionValues,
      },
    };
  }
  
  // Border-radius - special dimensions type with corner names
  if (property === 'border-radius') {
    const values = value.trim().split(/\s+/);
    
    // If single value, use size type
    if (values.length === 1) {
      const parsed = parseSizeValue(values[0]);
      return {
        name: property,
        value: {
          $$type: 'size',
          value: parsed,
        },
      };
    }
    
    // Multiple values - expand to corners
    const corners = expandBorderRadius(values);
    const cornerValues: Record<string, any> = {};
    
    Object.entries(corners).forEach(([corner, cornerValue]) => {
      const parsed = parseSizeValue(cornerValue);
      cornerValues[corner] = {
        $$type: 'size',
        value: parsed,
      };
    });
    
    return {
      name: property,
      value: {
        $$type: 'border-radius',
        value: cornerValues,
      },
    };
  }
  
  // Number properties (no units)
  if (['z-index'].includes(property)) {
    return {
      name: property,
      value: {
        $$type: 'number',
        value: parseInt(value),
      },
    };
  }
  
  // Opacity - size type with percentage
  if (property === 'opacity') {
    let numeric = parseFloat(value);
    // Convert 0-1 to 0-100%
    if (numeric <= 1) {
      numeric = numeric * 100;
    }
    return {
      name: property,
      value: {
        $$type: 'size',
        value: {
          size: numeric,
          unit: '%',
        },
      },
    };
  }
  
  // Individual size properties (with units)
  const sizeProps = [
    'font-size', 'width', 'height',
    'max-width', 'min-width', 'max-height', 'min-height',
    'border-width', 'gap',
    'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
    'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
    'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end',
    'scroll-margin-top', 'scroll-margin-bottom', 'scroll-margin-left', 'scroll-margin-right',
    'top', 'right', 'bottom', 'left',
  ];
  
  if (sizeProps.includes(property)) {
    const parsed = parseSizeValue(value, property);
    return {
      name: property,
      value: {
        $$type: 'size',
        value: parsed,
      },
    };
  }
  
  // Line-height special handling
  if (property === 'line-height') {
    const parsed = parseSizeValue(value, property);
    
    // If unitless, default to 'em' unit
    if (!parsed.unit) {
      parsed.unit = 'em';
    }
    
    return {
      name: property,
      value: {
        $$type: 'size',
        value: parsed,
      },
    };
  }
  
  // String properties
  const stringProps = [
    'display', 'flex-direction', 'justify-content', 'align-items',
    'text-align', 'font-weight', 'text-decoration', 'font-style',
    'text-transform', 'position', 'overflow', 'cursor',
    'font-family', 'flex-wrap', 'align-content',
    'border-style', 'mix-blend-mode',
  ];
  
  if (stringProps.includes(property)) {
    return {
      name: property,
      value: {
        $$type: 'string',
        value,
      },
    };
  }
  
  // Box-shadow
  if (property === 'box-shadow' && value !== 'none') {
    value = value.trim();
    
    // Extract color (rgba/rgb/hex at end)
    let color = 'rgba(0, 0, 0, 1)';
    const colorMatch = value.match(/(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8})$/);
    if (colorMatch) {
      color = colorMatch[1];
      value = value.replace(colorMatch[0], '').trim();
    }
    
    // Parse remaining values (h-offset v-offset blur spread)
    const parts = value.split(/\s+/);
    
    if (parts.length >= 2) {
      return {
        name: 'box-shadow',
        value: {
          $$type: 'box-shadow',
          value: [
            {
              $$type: 'shadow',
              value: {
                hOffset: {
                  $$type: 'size',
                  value: parseSizeValue(parts[0]),
                },
                vOffset: {
                  $$type: 'size',
                  value: parseSizeValue(parts[1]),
                },
                blur: {
                  $$type: 'size',
                  value: parts[2] ? parseSizeValue(parts[2]) : { size: 0, unit: 'px' },
                },
                spread: {
                  $$type: 'size',
                  value: parts[3] ? parseSizeValue(parts[3]) : { size: 0, unit: 'px' },
                },
                color: {
                  $$type: 'color',
                  value: color,
                },
                position: null,
              },
            },
          ],
        },
      };
    } else {
      console.log(`Box-shadow format not recognized: ${value}`);
      return null;
    }
  }
  
  // Complex properties - skip
  const complexProps = ['transform', 'transition', 'filter', 'backdrop-filter'];
  if (complexProps.includes(property)) {
    console.log(`Complex property skipped: ${property} = ${value}`);
    return null;
  }
  
  // Unknown property - skip
  console.log(`Unknown CSS property skipped: ${property} = ${value}`);
  return null;
}

/**
 * Parse CSS gradient to Elementor v4 format
 */
function parseGradient(gradientString: string): any | null {
  // Match linear-gradient(135deg, #667eea 0%, #764ba2 100%)
  const match = gradientString.match(/linear-gradient\s*\(\s*([^,]+),\s*(.+)\s*\)/);
  if (!match) {
    return null;
  }
  
  const angleStr = match[1].trim();
  const stopsStr = match[2].trim();
  
  // Parse angle (135deg → 135)
  let angle = 0;
  const angleMatch = angleStr.match(/(\d+)deg/);
  if (angleMatch) {
    angle = parseInt(angleMatch[1]);
  }
  
  // Parse color stops: "#667eea 0%, #764ba2 100%"
  const stopsParts = stopsStr.split(/,(?![^(]*\))/);
  const stops: any[] = [];
  
  stopsParts.forEach((stopStr, index) => {
    stopStr = stopStr.trim();
    
    // Match: "rgba(0,0,0,1) 0%" or "#667eea 50%" or "white"
    const stopMatch = stopStr.match(/^(rgba?\([^)]+\)|#[0-9a-fA-F]{3,8}|\w+)\s*(\d+)?%?\s*$/);
    if (stopMatch) {
      const color = stopMatch[1];
      const offset = stopMatch[2] ? parseInt(stopMatch[2]) : (index === 0 ? 0 : 100);
      
      stops.push({
        $$type: 'color-stop',
        value: {
          color: {
            $$type: 'color',
            value: color,
          },
          offset: {
            $$type: 'number',
            value: offset,
          },
        },
      });
    }
  });
  
  // Need at least 2 stops
  if (stops.length < 2) {
    return null;
  }
  
  return {
    type: {
      $$type: 'string',
      value: 'linear',
    },
    angle: {
      $$type: 'number',
      value: angle,
    },
    stops: {
      $$type: 'gradient-color-stop',
      value: stops,
    },
  };
}

// ============================================================================
// JSON TO HTML CONVERSION
// ============================================================================

/**
 * Convert Elementor JSON to HTML
 */
export function elementorJSONToHTML(elements: ElementorElement[]): string {
  if (!elements || elements.length === 0) {
    return '';
  }
  
  return elements.map(element => elementToHTML(element)).join('\n');
}

/**
 * Convert single Elementor element to HTML
 */
function elementToHTML(element: ElementorElement): string {
  if (element.elType === 'e-div-block' || element.elType === 'container') {
    return containerToHTML(element);
  }
  
  if (element.elType === 'widget' && element.widgetType) {
    return widgetToHTML(element);
  }
  
  return '';
}

/**
 * Convert container to HTML
 */
function containerToHTML(element: ElementorElement): string {
  const children = element.elements?.map((child: ElementorElement) => elementToHTML(child)).join('\n') || '';
  const styles = extractStylesFromElement(element);
  const styleAttr = styles ? ` style="${styles}"` : '';
  
  return `<div${styleAttr}>${children}</div>`;
}

/**
 * Convert widget to HTML
 */
function widgetToHTML(element: ElementorElement): string {
  const widgetType = element.widgetType;
  const settings = element.settings || {};
  const styles = extractStylesFromElement(element);
  const styleAttr = styles ? ` style="${styles}"` : '';
  
  switch (widgetType) {
    case 'e-heading':
    case 'heading': {
      const tag = settings.tag || settings._heading_tag || 'h2';
      const title = settings.title || '';
      return `<${tag}${styleAttr}>${title}</${tag}>`;
    }
    
    case 'e-button':
    case 'button': {
      const text = typeof settings.text === 'object' ? settings.text.value : (settings.text || 'Button');
      const link = settings.link;
      
      if (link && typeof link === 'object' && link.value?.destination?.value) {
        const href = link.value.destination.value;
        const target = link.value.isTargetBlank?.value ? ' target="_blank"' : '';
        return `<a href="${href}"${target}${styleAttr}>${text}</a>`;
      }
      
      return `<button${styleAttr}>${text}</button>`;
    }
    
    case 'e-image':
    case 'image': {
      const image = settings.image;
      let src = '';
      let alt = settings.alt || settings.image_alt || '';
      
      if (typeof image === 'object' && image.value?.src?.value) {
        src = image.value.src.value.url || '';
      } else if (typeof image === 'object' && image.url) {
        src = image.url;
      }
      
      return src ? `<img src="${src}" alt="${alt}"${styleAttr} />` : '';
    }
    
    case 'e-paragraph':
    case 'text-editor': {
      const content = typeof settings.paragraph === 'object' ? 
        settings.paragraph.value : 
        (settings.editor || settings.paragraph || '');
      return `<p${styleAttr}>${content}</p>`;
    }
    
    default:
      return `<!-- Unknown widget type: ${widgetType} -->`;
  }
}

/**
 * Extract inline styles from element
 */
function extractStylesFromElement(element: ElementorElement): string {
  // Get styles from styles object if it exists
  if (element.styles && typeof element.styles === 'object') {
    const firstStyleKey = Object.keys(element.styles)[0];
    if (firstStyleKey) {
      const styleObj = element.styles[firstStyleKey];
      if (styleObj.variants && styleObj.variants[0]) {
        const props = styleObj.variants[0].props;
        return propsToCSS(props);
      }
    }
  }
  
  // Fallback to old settings format
  const settings = element.settings || {};
  const styles: string[] = [];
  
  // Extract basic styles from settings
  if (settings.background_color) {
    styles.push(`background-color: ${settings.background_color}`);
  }
  
  if (settings.color) {
    styles.push(`color: ${settings.color}`);
  }
  
  // Add more style extraction as needed
  
  return styles.join('; ');
}

/**
 * Convert Atomic props to CSS string
 */
function propsToCSS(props: Record<string, any>): string {
  const styles: string[] = [];
  
  Object.entries(props).forEach(([name, prop]) => {
    if (!prop || typeof prop !== 'object') return;
    
    const cssValue = propToCSS(name, prop);
    if (cssValue) {
      styles.push(cssValue);
    }
  });
  
  return styles.join('; ');
}

/**
 * Convert single Atomic prop to CSS
 */
function propToCSS(name: string, prop: any): string | null {
  const type = prop.$$type;
  const value = prop.value;
  
  if (!type || value === undefined) return null;
  
  switch (type) {
    case 'color':
      return `${name}: ${value}`;
    
    case 'size':
      return `${name}: ${value.size}${value.unit}`;
    
    case 'dimensions': {
      // Convert logical properties back to physical
      const reverseLogicalMap: Record<string, string> = {
        'block-start': 'top',
        'block-end': 'bottom',
        'inline-start': 'left',
        'inline-end': 'right',
      };
      
      const parts: string[] = [];
      Object.entries(value).forEach(([logicalSide, sizeValue]: [string, any]) => {
        const physicalSide = reverseLogicalMap[logicalSide] || logicalSide;
        if (sizeValue?.value) {
          parts.push(`${sizeValue.value.size}${sizeValue.value.unit}`);
        }
      });
      
      if (parts.length === 4) {
        return `${name}: ${parts.join(' ')}`;
      }
      return null;
    }
    
    case 'string':
      return `${name}: ${value}`;
    
    case 'background': {
      if (value.color?.value && value.color.value !== 'transparent') {
        return `background-color: ${value.color.value}`;
      }
      // Handle background-image and gradients
      // TODO: Implement if needed
      return null;
    }
    
    default:
      return null;
  }
}
