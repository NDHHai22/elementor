/**
 * Elementor v4 Atomic Elements Type Definitions
 * Based on: angie/modules/elementor-core/components/atomic-html-converter.php
 */

// ============================================================================
// MAIN TYPES
// ============================================================================

export interface ElementorElement {
  id: string;
  elType: 'container' | 'widget' | 'e-div-block';
  isInner?: boolean;
  isLocked?: boolean;
  settings?: ElementorSettings | Record<string, any>;
  defaultEditSettings?: {
    defaultEditRoute?: string;
  };
  elements?: ElementorElement[];
  widgetType?: string;
  htmlCache?: string | null;
  styles?: Record<string, AtomicStyle>;
  editor_settings?: Record<string, any>;
  editSettings?: {
    defaultEditRoute?: string;
  };
}

export interface AtomicStyle {
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

export interface ElementorSettings {
  // Text content
  title?: string;
  text?: string | TypedValue<string>;
  paragraph?: string | TypedValue<string>;
  editor?: string;
  
  // HTML tag
  tag?: string;
  _heading_tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  
  // Links
  link?: LinkValue | TypedLink;
  
  // Images
  image?: ImageValue | TypedImage;
  alt?: string;
  image_alt?: string;
  
  // Layout
  display?: string;
  _flex_direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  _flex_justify_content?: string;
  _flex_align_items?: string;
  _flex_gap?: SizeValue | GapValue;
  _flex_wrap?: string;
  
  // Spacing
  padding?: DimensionValue | TypedDimensions;
  margin?: DimensionValue | TypedDimensions;
  
  // Colors
  color?: string;
  background_color?: string;
  background?: string | TypedBackground;
  
  // Typography
  font_family?: string;
  font_size?: SizeValue | TypedSize;
  font_weight?: string | number;
  text_align?: 'left' | 'center' | 'right' | 'justify';
  text_decoration?: string;
  font_style?: string;
  text_transform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
  line_height?: SizeValue | TypedSize;
  
  // Borders
  border_border?: string;
  border_width?: DimensionValue | TypedDimensions;
  border_color?: string;
  border_radius?: DimensionValue | SizeValue | TypedBorderRadius | TypedSize;
  border_style?: string;
  
  // Effects
  opacity?: number | SizeValue | TypedSize;
  box_shadow?: BoxShadowValue | TypedBoxShadow;
  
  // Position
  position?: 'static' | 'relative' | 'absolute' | 'fixed' | 'sticky';
  z_index?: number | TypedNumber;
  top?: SizeValue | TypedSize;
  right?: SizeValue | TypedSize;
  bottom?: SizeValue | TypedSize;
  left?: SizeValue | TypedSize;
  
  // Dimensions
  width?: SizeValue | TypedSize;
  height?: SizeValue | TypedSize;
  max_width?: SizeValue | TypedSize;
  min_width?: SizeValue | TypedSize;
  max_height?: SizeValue | TypedSize;
  min_height?: SizeValue | TypedSize;
  
  // Classes
  classes?: TypedValue<string[]>;
  
  // Custom properties
  [key: string]: any;
}

// ============================================================================
// TYPED VALUE WRAPPERS
// ============================================================================

export interface TypedValue<T> {
  $$type: string;
  value: T;
}

export interface TypedSize {
  $$type: 'size';
  value: {
    size: number;
    unit: string;
  };
}

export interface TypedDimensions {
  $$type: 'dimensions';
  value: Record<string, TypedSize>;
}

export interface TypedBorderRadius {
  $$type: 'border-radius';
  value: Record<string, TypedSize>;
}

export interface TypedNumber {
  $$type: 'number';
  value: number;
}

export interface TypedColor {
  $$type: 'color';
  value: string;
}

export interface TypedLink {
  $$type: 'link';
  value: {
    destination: {
      $$type: 'url';
      value: string;
    };
    label: {
      $$type: 'string';
      value: string;
    };
    isTargetBlank: {
      $$type: 'boolean';
      value: boolean;
    };
  };
}

export interface TypedImage {
  $$type: 'image';
  value: {
    src: {
      $$type: 'image-src';
      value: {
        id: {
          $$type: 'image-attachment-id';
          value: number;
        };
        url: string | null;
      };
    };
    size?: {
      $$type: 'string';
      value: string;
    };
  };
}

export interface TypedBackground {
  $$type: 'background';
  value: {
    color: TypedColor;
    'background-overlay'?: {
      $$type: 'background-overlay';
      value: Array<TypedBackgroundImageOverlay | TypedBackgroundGradientOverlay>;
    };
  };
}

export interface TypedBackgroundImageOverlay {
  $$type: 'background-image-overlay';
  value: {
    image: TypedImage;
    position: TypedValue<string>;
    repeat: TypedValue<string>;
    size: TypedValue<string>;
    attachment: TypedValue<string>;
  };
}

export interface TypedBackgroundGradientOverlay {
  $$type: 'background-gradient-overlay';
  value: {
    type: TypedValue<string>;
    angle: TypedNumber;
    stops: {
      $$type: 'gradient-color-stop';
      value: Array<{
        $$type: 'color-stop';
        value: {
          color: TypedColor;
          offset: TypedNumber;
        };
      }>;
    };
  };
}

export interface TypedBoxShadow {
  $$type: 'box-shadow';
  value: Array<{
    $$type: 'shadow';
    value: {
      hOffset: TypedSize;
      vOffset: TypedSize;
      blur: TypedSize;
      spread: TypedSize;
      color: TypedColor;
      position: string | null;
    };
  }>;
}

// ============================================================================
// LEGACY TYPES (for backward compatibility)
// ============================================================================

export interface SizeValue {
  unit: string;
  size: number;
}

export interface DimensionValue {
  unit: string;
  top: number;
  right: number;
  bottom: number;
  left: number;
  isLinked?: boolean;
}

export interface GapValue {
  unit: string;
  size: number;
}

export interface LinkValue {
  url: string;
  is_external?: boolean;
  nofollow?: boolean;
}

export interface ImageValue {
  id?: string | number;
  url: string;
  alt?: string;
}

export interface BoxShadowValue {
  horizontal: number;
  vertical: number;
  blur: number;
  spread: number;
  color: string;
}

export interface BorderValue {
  width: DimensionValue;
  color: string;
  style: string;
}
