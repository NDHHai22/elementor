/**
 * HTML to Elementor v4 Atomic JSON Converter
 * 
 * Ported from PHP atomic-html-converter.php
 */

import type {
  ElementorElement,
  ElementorContainer,
  ElementorWidget,
  HeadingWidget,
  ButtonWidget,
  ParagraphWidget,
  ImageWidget,
  ColorValue,
  SizeValue,
  StringValue,
  NumberValue,
  DimensionsValue,
  BackgroundValue,
  BoxShadowValue,
  BorderRadiusValue,
  StyleVariant,
  StyleClass,
  CSSProperties,
} from '@/types/elementor';

// Helper: Generate unique ID
function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

// Helper: Create typed value
function createTypedValue<T extends string, V>(type: T, value: V): { $$type: T; value: V } {
  return { $$type: type, value };
}

// Helper: Parse size value
function parseSize(value: string): SizeValue {
  const match = value.match(/^([\d.]+)(px|em|rem|%|vh|vw|auto)?$/);
  if (!match) {
    return createTypedValue('size', { size: 0, unit: 'px' });
  }
  return createTypedValue('size', {
    size: parseFloat(match[1]),
    unit: match[2] || '',
  });
}

// Helper: Parse color
function parseColor(value: string): ColorValue {
  return createTypedValue('color', value);
}

// Helper: Parse dimensions (padding/margin)
function parseDimensions(top?: string, right?: string, bottom?: string, left?: string): DimensionsValue {
  return createTypedValue('dimensions', {
    'block-start': parseSize(top || '0'),
    'block-end': parseSize(bottom || '0'),
    'inline-start': parseSize(left || '0'),
    'inline-end': parseSize(right || '0'),
  });
}

// Helper: Parse border-radius
function parseBorderRadius(
  value: string,
  topLeft?: string,
  topRight?: string,
  bottomRight?: string,
  bottomLeft?: string
): BorderRadiusValue {
  if (topLeft || topRight || bottomRight || bottomLeft) {
    return createTypedValue('border-radius', {
      'top-left': parseSize(topLeft || '0'),
      'top-right': parseSize(topRight || '0'),
      'bottom-right': parseSize(bottomRight || '0'),
      'bottom-left': parseSize(bottomLeft || '0'),
    });
  }
  return createTypedValue('border-radius', parseSize(value));
}

// Helper: Parse box-shadow
function parseBoxShadow(value: string): BoxShadowValue {
  const shadows = value.split(',').map((shadow) => {
    const parts = shadow.trim().match(/(-?[\d.]+px)\s+(-?[\d.]+px)\s+(-?[\d.]+px)\s+(-?[\d.]+px)?\s*(rgba?\([^)]+\)|#[\da-f]{3,8}|\w+)/i);
    if (!parts) return null;

    return {
      'offset-x': parseSize(parts[1]),
      'offset-y': parseSize(parts[2]),
      blur: parseSize(parts[3]),
      spread: parseSize(parts[4] || '0px'),
      color: parseColor(parts[5]),
    };
  }).filter(Boolean);

  return createTypedValue('box-shadow', shadows as any);
}

// Helper: Parse background gradient
function parseGradient(value: string): BackgroundValue | null {
  const linearMatch = value.match(/linear-gradient\((\d+)deg,\s*(.+)\)/);
  if (linearMatch) {
    const angle = parseInt(linearMatch[1]);
    const stopsStr = linearMatch[2];
    const stops = stopsStr.split(/,(?![^(]*\))/).map((stop) => {
      const match = stop.trim().match(/(rgba?\([^)]+\)|#[\da-f]{3,8}|\w+)\s+([\d.]+%)/);
      if (!match) return null;
      return {
        color: parseColor(match[1]),
        position: createTypedValue('number', parseFloat(match[2])),
      };
    }).filter(Boolean);

    return createTypedValue('background', {
      'background-overlay': createTypedValue('background-overlay', [
        createTypedValue('gradient', {
          type: createTypedValue('string', 'linear'),
          angle: createTypedValue('number', angle),
          stops: stops as any,
        }),
      ]),
    });
  }
  return null;
}

// Helper: Extract inline styles from element
function extractInlineStyles(element: HTMLElement): CSSProperties {
  const styles: CSSProperties = {};
  const styleAttr = element.getAttribute('style');
  
  if (!styleAttr) return styles;

  styleAttr.split(';').forEach((rule) => {
    const [property, value] = rule.split(':').map((s) => s.trim());
    if (property && value) {
      styles[property as keyof CSSProperties] = value;
    }
  });

  return styles;
}

// Helper: Convert CSS properties to Elementor atomic properties
function cssToAtomicProps(styles: CSSProperties): Record<string, any> {
  const props: Record<string, any> = {};

  // Color
  if (styles.color) {
    props.color = parseColor(styles.color);
  }

  // Background
  if (styles['background-color']) {
    props.background = createTypedValue('background', {
      color: parseColor(styles['background-color']),
    });
  }

  // Background gradient
  if (styles['background-image']?.includes('gradient')) {
    const gradient = parseGradient(styles['background-image']);
    if (gradient) {
      props.background = gradient;
    }
  }

  // Padding
  const paddingTop = styles['padding-top'] || styles.padding;
  const paddingRight = styles['padding-right'] || styles.padding;
  const paddingBottom = styles['padding-bottom'] || styles.padding;
  const paddingLeft = styles['padding-left'] || styles.padding;
  
  if (paddingTop || paddingRight || paddingBottom || paddingLeft) {
    props.padding = parseDimensions(paddingTop, paddingRight, paddingBottom, paddingLeft);
  }

  // Margin
  const marginTop = styles['margin-top'] || styles.margin;
  const marginRight = styles['margin-right'] || styles.margin;
  const marginBottom = styles['margin-bottom'] || styles.margin;
  const marginLeft = styles['margin-left'] || styles.margin;
  
  if (marginTop || marginRight || marginBottom || marginLeft) {
    props.margin = parseDimensions(marginTop, marginRight, marginBottom, marginLeft);
  }

  // Border radius
  if (styles['border-radius']) {
    props['border-radius'] = parseBorderRadius(styles['border-radius']);
  }

  // Width/Height
  if (styles.width) {
    props.width = parseSize(styles.width);
  }
  if (styles.height) {
    props.height = parseSize(styles.height);
  }

  // Font size
  if (styles['font-size']) {
    props['font-size'] = parseSize(styles['font-size']);
  }

  // Font weight
  if (styles['font-weight']) {
    props['font-weight'] = createTypedValue('string', styles['font-weight']);
  }

  // Text align
  if (styles['text-align']) {
    props['text-align'] = createTypedValue('string', styles['text-align']);
  }

  // Opacity
  if (styles.opacity) {
    props.opacity = createTypedValue('number', parseFloat(styles.opacity));
  }

  // Box shadow
  if (styles['box-shadow']) {
    props['box-shadow'] = parseBoxShadow(styles['box-shadow']);
  }

  // Display
  if (styles.display) {
    props.display = createTypedValue('string', styles.display);
  }

  // Flex properties
  if (styles['flex-direction']) {
    props['flex-direction'] = createTypedValue('string', styles['flex-direction']);
  }
  if (styles['justify-content']) {
    props['justify-content'] = createTypedValue('string', styles['justify-content']);
  }
  if (styles['align-items']) {
    props['align-items'] = createTypedValue('string', styles['align-items']);
  }

  return props;
}

// Helper: Create style class with variants
function createStyleClass(props: Record<string, any>): StyleClass {
  const classId = `angie-${generateId()}`;
  
  const variant: StyleVariant = {
    meta: {
      breakpoint: 'desktop',
      state: 'normal',
    },
    props,
  };

  return {
    id: classId,
    label: classId,
    type: 'class',
    variants: [variant],
  };
}

// Parse HTML element to Elementor widget/container
function parseElement(element: HTMLElement): ElementorElement | null {
  const tagName = element.tagName.toLowerCase();
  const styles = extractInlineStyles(element);
  const atomicProps = cssToAtomicProps(styles);
  const styleClass = createStyleClass(atomicProps);

  // Heading widget
  if (/^h[1-6]$/.test(tagName)) {
    const widget: HeadingWidget = {
      id: generateId(),
      elType: 'widget',
      widgetType: 'e-heading',
      settings: {
        title: element.textContent || '',
        tag: tagName as any,
      },
      styles: {
        [styleClass.id]: styleClass,
      },
    };
    return widget;
  }

  // Button widget
  if (tagName === 'button' || (tagName === 'a' && element.classList.contains('button'))) {
    const href = element.getAttribute('href');
    const widget: ButtonWidget = {
      id: generateId(),
      elType: 'widget',
      widgetType: 'e-button',
      settings: {
        text: createTypedValue('string', element.textContent || ''),
        ...(href && {
          link: createTypedValue('link', {
            destination: createTypedValue('string', href),
            isTargetBlank: createTypedValue('boolean', element.getAttribute('target') === '_blank'),
            isNoFollow: createTypedValue('boolean', element.getAttribute('rel')?.includes('nofollow') || false),
          }),
        }),
      },
      styles: {
        [styleClass.id]: styleClass,
      },
    };
    return widget;
  }

  // Image widget
  if (tagName === 'img') {
    const src = element.getAttribute('src') || '';
    const alt = element.getAttribute('alt') || '';
    
    const widget: ImageWidget = {
      id: generateId(),
      elType: 'widget',
      widgetType: 'e-image',
      settings: {
        image: createTypedValue('image', {
          src: createTypedValue('image-source', {
            id: createTypedValue('number', 0), // No media library ID in HTML
            url: src,
          }),
        }),
        alt,
      },
      styles: {
        [styleClass.id]: styleClass,
      },
    };
    return widget;
  }

  // Paragraph widget
  if (tagName === 'p') {
    const widget: ParagraphWidget = {
      id: generateId(),
      elType: 'widget',
      widgetType: 'e-paragraph',
      settings: {
        paragraph: createTypedValue('html', element.innerHTML),
      },
      styles: {
        [styleClass.id]: styleClass,
      },
    };
    return widget;
  }

  // Container (div and others)
  const children: ElementorElement[] = [];
  Array.from(element.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      const parsed = parseElement(child);
      if (parsed) children.push(parsed);
    }
  });

  // If has text content and no children, treat as paragraph
  if (children.length === 0 && element.textContent?.trim()) {
    const widget: ParagraphWidget = {
      id: generateId(),
      elType: 'widget',
      widgetType: 'e-paragraph',
      settings: {
        paragraph: createTypedValue('html', element.innerHTML),
      },
      styles: {
        [styleClass.id]: styleClass,
      },
    };
    return widget;
  }

  const container: ElementorContainer = {
    id: generateId(),
    elType: 'e-div-block',
    settings: {},
    elements: children,
    styles: {
      [styleClass.id]: styleClass,
    },
  };

  return container;
}

// Main conversion function
export function htmlToElementorJson(html: string): ElementorElement[] {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  const elements: ElementorElement[] = [];
  
  Array.from(doc.body.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      const parsed = parseElement(child);
      if (parsed) elements.push(parsed);
    }
  });

  return elements;
}
