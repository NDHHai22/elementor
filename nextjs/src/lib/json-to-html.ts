/**
 * Elementor v4 Atomic JSON to HTML Converter
 * 
 * Ported from PHP atomic-json-to-html.php
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
  DimensionsValue,
  BackgroundValue,
  BoxShadowValue,
  BorderRadiusValue,
  StyleVariant,
  CSSProperties,
} from '@/types/elementor';

// Helper: Extract value from typed property
function getTypedValue<T>(prop: { $$type: string; value: T }): T {
  return prop?.value;
}

// Helper: Size to CSS string
function sizeToCSS(size: SizeValue | undefined): string {
  if (!size) return '';
  const val = getTypedValue(size);
  if (!val) return '';
  return `${val.size}${val.unit}`;
}

// Helper: Color to CSS string
function colorToCSS(color: ColorValue | undefined): string {
  if (!color) return '';
  return getTypedValue(color) || '';
}

// Helper: Dimensions to CSS string
function dimensionsToCSS(dims: DimensionsValue | undefined): string {
  if (!dims) return '';
  const val = getTypedValue(dims);
  if (!val) return '';
  
  const top = sizeToCSS(val['block-start']);
  const right = sizeToCSS(val['inline-end']);
  const bottom = sizeToCSS(val['block-end']);
  const left = sizeToCSS(val['inline-start']);
  
  if (top === right && right === bottom && bottom === left) {
    return top;
  }
  return `${top} ${right} ${bottom} ${left}`;
}

// Helper: Border radius to CSS string
function borderRadiusToCSS(radius: BorderRadiusValue | undefined): string {
  if (!radius) return '';
  const val = getTypedValue(radius);
  if (!val) return '';
  
  // Single value
  if ('size' in val) {
    return sizeToCSS(val as SizeValue);
  }
  
  // Four corners
  const corners = val as { 'top-left': SizeValue; 'top-right': SizeValue; 'bottom-right': SizeValue; 'bottom-left': SizeValue };
  const topLeft = sizeToCSS(corners['top-left']);
  const topRight = sizeToCSS(corners['top-right']);
  const bottomRight = sizeToCSS(corners['bottom-right']);
  const bottomLeft = sizeToCSS(corners['bottom-left']);
  
  if (topLeft === topRight && topRight === bottomRight && bottomRight === bottomLeft) {
    return topLeft;
  }
  return `${topLeft} ${topRight} ${bottomRight} ${bottomLeft}`;
}

// Helper: Box shadow to CSS string
function boxShadowToCSS(shadow: BoxShadowValue | undefined): string {
  if (!shadow) return '';
  const shadows = getTypedValue(shadow);
  if (!Array.isArray(shadows)) return '';
  
  return shadows.map((s) => {
    const x = sizeToCSS(s['offset-x']);
    const y = sizeToCSS(s['offset-y']);
    const blur = sizeToCSS(s.blur);
    const spread = sizeToCSS(s.spread);
    const color = colorToCSS(s.color);
    const inset = s.inset && getTypedValue(s.inset) ? 'inset ' : '';
    
    return `${inset}${x} ${y} ${blur} ${spread} ${color}`;
  }).join(', ');
}

// Helper: Background to CSS string
function backgroundToCSS(bg: BackgroundValue | undefined): CSSProperties {
  const styles: CSSProperties = {};
  if (!bg) return styles;
  
  const val = getTypedValue(bg);
  if (!val) return styles;
  
  // Background color
  if (val.color) {
    styles['background-color'] = colorToCSS(val.color);
  }
  
  // Background overlay (gradient/image)
  if (val['background-overlay']) {
    const overlays = getTypedValue(val['background-overlay']);
    if (Array.isArray(overlays) && overlays.length > 0) {
      const firstOverlay = overlays[0];
      
      // Gradient
      if (firstOverlay.$$type === 'gradient') {
        const gradient = getTypedValue(firstOverlay);
        if (gradient) {
          const type = getTypedValue(gradient.type);
          const angle = getTypedValue(gradient.angle);
          const stops = gradient.stops.map((stop) => {
            const color = colorToCSS(stop.color);
            const position = getTypedValue(stop.position);
            return `${color} ${position}%`;
          }).join(', ');
          
          styles['background-image'] = `${type}-gradient(${angle}deg, ${stops})`;
        }
      }
      
      // Background image
      if (firstOverlay.$$type === 'background-image-overlay') {
        const image = getTypedValue(firstOverlay);
        if (image && image.url) {
          styles['background-image'] = `url(${image.url})`;
          if (image.size) {
            styles['background-size'] = getTypedValue(image.size) || 'cover';
          }
          if (image.position) {
            styles['background-position'] = getTypedValue(image.position) || 'center';
          }
          if (image.repeat) {
            styles['background-repeat'] = getTypedValue(image.repeat) || 'no-repeat';
          }
          if (image.attachment) {
            styles['background-attachment'] = getTypedValue(image.attachment) || 'scroll';
          }
        }
      }
    }
  }
  
  return styles;
}

// Helper: Extract inline style from element's style variants
function extractInlineStyle(element: ElementorElement): string {
  const styles: CSSProperties = {};
  
  if (!element.styles) return '';
  
  // Get first style class
  const styleClasses = Object.values(element.styles);
  if (styleClasses.length === 0) return '';
  
  const styleClass = styleClasses[0];
  if (!styleClass.variants || styleClass.variants.length === 0) return '';
  
  // Get desktop normal variant
  const desktopVariant = styleClass.variants.find(
    (v) => v.meta.breakpoint === 'desktop' && v.meta.state === 'normal'
  );
  
  if (!desktopVariant || !desktopVariant.props) return '';
  
  const props = desktopVariant.props;
  
  // Convert atomic props to CSS
  if (props.color) {
    styles.color = colorToCSS(props.color);
  }
  
  if (props.background) {
    Object.assign(styles, backgroundToCSS(props.background));
  }
  
  if (props.padding) {
    styles.padding = dimensionsToCSS(props.padding);
  }
  
  if (props.margin) {
    styles.margin = dimensionsToCSS(props.margin);
  }
  
  if (props['border-radius']) {
    styles['border-radius'] = borderRadiusToCSS(props['border-radius']);
  }
  
  if (props.width) {
    styles.width = sizeToCSS(props.width);
  }
  
  if (props.height) {
    styles.height = sizeToCSS(props.height);
  }
  
  if (props['font-size']) {
    styles['font-size'] = sizeToCSS(props['font-size']);
  }
  
  if (props['font-weight']) {
    styles['font-weight'] = getTypedValue(props['font-weight']);
  }
  
  if (props['text-align']) {
    styles['text-align'] = getTypedValue(props['text-align']);
  }
  
  if (props.opacity !== undefined) {
    styles.opacity = String(getTypedValue(props.opacity));
  }
  
  if (props['box-shadow']) {
    styles['box-shadow'] = boxShadowToCSS(props['box-shadow']);
  }
  
  if (props.display) {
    styles.display = getTypedValue(props.display);
  }
  
  if (props['flex-direction']) {
    styles['flex-direction'] = getTypedValue(props['flex-direction']);
  }
  
  if (props['justify-content']) {
    styles['justify-content'] = getTypedValue(props['justify-content']);
  }
  
  if (props['align-items']) {
    styles['align-items'] = getTypedValue(props['align-items']);
  }
  
  // Convert styles object to CSS string
  return Object.entries(styles)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([property, value]) => `${property}: ${value}`)
    .join('; ');
}

// Convert widget to HTML
function widgetToHTML(widget: ElementorWidget): string {
  const styleAttr = extractInlineStyle(widget);
  const style = styleAttr ? ` style="${styleAttr}"` : '';
  
  // Heading widget
  if (widget.widgetType === 'e-heading') {
    const heading = widget as HeadingWidget;
    const tag = heading.settings.tag || 'h2';
    const title = heading.settings.title || '';
    return `<${tag}${style}>${title}</${tag}>`;
  }
  
  // Button widget
  if (widget.widgetType === 'e-button') {
    const button = widget as ButtonWidget;
    const text = getTypedValue(button.settings.text) || '';
    
    if (button.settings.link) {
      const link = getTypedValue(button.settings.link);
      const href = getTypedValue(link.destination) || '#';
      const target = link.isTargetBlank && getTypedValue(link.isTargetBlank) ? ' target="_blank"' : '';
      const rel = link.isNoFollow && getTypedValue(link.isNoFollow) ? ' rel="nofollow"' : '';
      return `<a href="${href}"${target}${rel} class="button"${style}>${text}</a>`;
    }
    
    return `<button${style}>${text}</button>`;
  }
  
  // Image widget
  if (widget.widgetType === 'e-image') {
    const image = widget as ImageWidget;
    const imageValue = getTypedValue(image.settings.image);
    if (!imageValue) return '';
    
    const src = getTypedValue(imageValue.src);
    const url = src?.url || '';
    const alt = image.settings.alt || '';
    
    return `<img src="${url}" alt="${alt}"${style} />`;
  }
  
  // Paragraph widget
  if (widget.widgetType === 'e-paragraph') {
    const paragraph = widget as ParagraphWidget;
    const html = getTypedValue(paragraph.settings.paragraph) || '';
    return `<p${style}>${html}</p>`;
  }
  
  return '';
}

// Convert container to HTML
function containerToHTML(container: ElementorContainer): string {
  const styleAttr = extractInlineStyle(container);
  const style = styleAttr ? ` style="${styleAttr}"` : '';
  
  const children = container.elements?.map((child) => elementToHTML(child)).join('') || '';
  
  return `<div${style}>${children}</div>`;
}

// Convert element to HTML
function elementToHTML(element: ElementorElement): string {
  if (element.elType === 'e-div-block') {
    return containerToHTML(element as ElementorContainer);
  }
  
  if (element.elType === 'widget') {
    return widgetToHTML(element as ElementorWidget);
  }
  
  return '';
}

// Main conversion function
export function elementorJsonToHtml(elements: ElementorElement[]): string {
  return elements.map((element) => elementToHTML(element)).join('');
}
