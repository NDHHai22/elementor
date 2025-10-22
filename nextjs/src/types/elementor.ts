/**
 * Elementor v4 Atomic Elements Types
 * 
 * Complete type definitions for Elementor v4 format
 */

export type ElementorTypedValue<T extends string, V> = {
  $$type: T;
  value: V;
};

export type ColorValue = ElementorTypedValue<'color', string>;

export type SizeValue = ElementorTypedValue<'size', {
  size: number;
  unit: string; // 'px' | 'em' | 'rem' | '%' | 'vh' | 'vw' | 'auto' | ''
}>;

export type StringValue = ElementorTypedValue<'string', string>;

export type NumberValue = ElementorTypedValue<'number', number>;

export type DimensionsValue = ElementorTypedValue<'dimensions', {
  'block-start': SizeValue;
  'block-end': SizeValue;
  'inline-start': SizeValue;
  'inline-end': SizeValue;
}>;

export type BorderRadiusValue = ElementorTypedValue<'border-radius', {
  'top-left': SizeValue;
  'top-right': SizeValue;
  'bottom-right': SizeValue;
  'bottom-left': SizeValue;
} | SizeValue>;

export type BackgroundImageOverlay = ElementorTypedValue<'background-image-overlay', {
  id: NumberValue;
  url: string;
  size: StringValue; // 'cover' | 'contain' | 'auto'
  position: StringValue; // 'center center' | 'top left' | etc
  repeat: StringValue; // 'no-repeat' | 'repeat' | etc
  attachment: StringValue; // 'scroll' | 'fixed'
}>;

export type GradientValue = ElementorTypedValue<'gradient', {
  type: StringValue; // 'linear' | 'radial'
  angle: NumberValue;
  stops: Array<{
    color: ColorValue;
    position: NumberValue; // 0-100
  }>;
}>;

export type BackgroundValue = ElementorTypedValue<'background', {
  color?: ColorValue;
  'background-overlay'?: ElementorTypedValue<'background-overlay', Array<BackgroundImageOverlay | GradientValue>>;
}>;

export type BoxShadowValue = ElementorTypedValue<'box-shadow', Array<{
  'offset-x': SizeValue;
  'offset-y': SizeValue;
  blur: SizeValue;
  spread: SizeValue;
  color: ColorValue;
  inset?: ElementorTypedValue<'boolean', boolean>;
}>>;

export type LinkValue = ElementorTypedValue<'link', {
  destination: StringValue;
  isTargetBlank?: ElementorTypedValue<'boolean', boolean>;
  isNoFollow?: ElementorTypedValue<'boolean', boolean>;
}>;

export type ImageSourceValue = ElementorTypedValue<'image-source', {
  id: NumberValue;
  url: string;
}>;

export type ImageValue = ElementorTypedValue<'image', {
  src: ImageSourceValue;
  alt?: string;
}>;

// Style variant for responsive breakpoints
export interface StyleVariant {
  meta: {
    breakpoint: 'desktop' | 'tablet' | 'mobile';
    state: 'normal' | 'hover' | 'active';
  };
  props: Record<string, any>; // Color, Size, String, Dimensions, etc
}

// Style class object
export interface StyleClass {
  id: string;
  label: string;
  type: 'class';
  variants: StyleVariant[];
}

// Base Elementor Element
export interface ElementorElement {
  id: string;
  elType: string;
  settings: Record<string, any>;
  elements?: ElementorElement[];
  styles?: Record<string, StyleClass>;
}

// Container (e-div-block)
export interface ElementorContainer extends ElementorElement {
  elType: 'e-div-block';
  elements: ElementorElement[];
}

// Widget base
export interface ElementorWidget extends ElementorElement {
  elType: 'widget';
  widgetType: string;
}

// Specific widgets
export interface HeadingWidget extends ElementorWidget {
  widgetType: 'e-heading';
  settings: {
    title: string;
    tag: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  };
}

export interface ButtonWidget extends ElementorWidget {
  widgetType: 'e-button';
  settings: {
    text: StringValue;
    link?: LinkValue;
  };
}

export interface ParagraphWidget extends ElementorWidget {
  widgetType: 'e-paragraph';
  settings: {
    paragraph: ElementorTypedValue<'html', string>;
  };
}

export interface ImageWidget extends ElementorWidget {
  widgetType: 'e-image';
  settings: {
    image: ImageValue;
    alt?: string;
  };
}

// CSS Style Properties Map
export interface CSSProperties {
  color?: string;
  'background-color'?: string;
  'background-image'?: string;
  'background-size'?: string;
  'background-position'?: string;
  'background-repeat'?: string;
  'background-attachment'?: string;
  padding?: string;
  'padding-top'?: string;
  'padding-right'?: string;
  'padding-bottom'?: string;
  'padding-left'?: string;
  margin?: string;
  'margin-top'?: string;
  'margin-right'?: string;
  'margin-bottom'?: string;
  'margin-left'?: string;
  'border-radius'?: string;
  'border-color'?: string;
  'border-style'?: string;
  'border-width'?: string;
  width?: string;
  height?: string;
  'font-size'?: string;
  'font-weight'?: string;
  'line-height'?: string;
  'text-align'?: string;
  display?: string;
  position?: string;
  'z-index'?: string;
  opacity?: string;
  'box-shadow'?: string;
  cursor?: string;
  overflow?: string;
  'flex-direction'?: string;
  'justify-content'?: string;
  'align-items'?: string;
}
