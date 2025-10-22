# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the **ThemeREX Addons** WordPress plugin (v2.30.3.1) that provides extensive functionality for WordPress themes sold on ThemeForest. The plugin includes:

- Custom post types, widgets, and shortcodes
- Third-party plugin integrations (30+ APIs)
- Theme-specific premium addons
- Auto-update system via separate updater plugin

## Architecture

### Core Structure

- **Main Plugin**: `trx_addons/trx_addons.php` - Primary plugin file with WordPress headers and initialization
- **Updater Plugin**: `trx_updater/trx_updater.php` - Separate auto-update system for themes and plugins
- **Components**: `trx_addons/components/` - Modular architecture with 4 main component types:
  - `api/` - Third-party plugin integrations (Elementor, WooCommerce, etc.)
  - `cpt/` - Custom Post Types (Portfolio, Services, Team, etc.)
  - `shortcodes/` - UI shortcodes (buttons, sliders, forms, etc.)
  - `widgets/` - Custom widgets (social media, content, utility)
- **Addons**: `trx_addons/addons/` - Premium theme-specific addons (AI Helper, Effects, etc.)
- **Includes**: `trx_addons/includes/` - Core plugin functionality and utilities

### Component Loading System

Components are loaded dynamically via:
```php
$trx_addons_components_list = glob(TRX_ADDONS_PLUGIN_DIR . TRX_ADDONS_PLUGIN_COMPONENTS . '*', GLOB_ONLYDIR);
```

Each component follows the pattern: `component_name/component_name.php`

### WordPress Integration

- Uses WordPress plugin standards with proper headers, hooks, and filters
- Implements WordPress security best practices (ABSPATH checks, nonces)
- Follows WordPress coding standards and action/filter system
- Includes proper localization support with text domain `trx_addons`

## Development Environment

### Build System

This plugin uses **traditional WordPress development** approach:
- **No modern build tools** (no package.json, webpack, gulp)
- **Manual SCSS compilation** for styling
- **Direct file editing** for development
- **WordPress standards** for script/style enqueuing

### CSS/SCSS Architecture

- **Main styles**: `trx_addons/css/trx_addons.front.scss` (compiled to .css)
- **Admin styles**: `trx_addons/css/trx_addons.admin.scss`
- **Responsive styles**: `trx_addons/css/trx_addons.responsive.scss`
- **Component styles**: Each component has its own .scss/.css files
- **Compilation**: Manual SCSS compilation required when editing styles

### JavaScript Architecture

- **Main scripts**: `trx_addons/js/trx_addons.front.js`, `trx_addons/js/trx_addons.admin.js`
- **Component scripts**: Each component has its own JS files
- **Third-party libraries**: Included in `trx_addons/js/` (swiper, magnific, etc.)
- **Optimization**: Script merging and minification handled by plugin

### File Organization

- **Templates**: `trx_addons/templates/` - Reusable template files
- **Languages**: `trx_addons/languages/` - Translation files
- **Images**: `trx_addons/css/images/` - Core images and icons
- **Third-party assets**: Organized in component-specific directories

## Key Development Concepts

### Plugin Constants

Important constants defined in `trx_addons.php`:
- `TRX_ADDONS_VERSION` - Plugin version
- `TRX_ADDONS_PLUGIN_DIR` - Plugin directory path
- `TRX_ADDONS_PLUGIN_URL` - Plugin URL
- `TRX_ADDONS_PLUGIN_COMPONENTS` - Components directory
- `TRX_ADDONS_PLUGIN_ADDONS` - Addons directory

### Global Storage

`$TRX_ADDONS_STORAGE` array contains:
- `post_types` - Registered custom post types
- `admin_message`/`front_message` - Operation result messages
- `widgets_args` - Widget registration arguments
- `responsive` - Responsive breakpoints configuration
- `components_list` - Loaded components
- `addons_list` - Loaded addons

### Hook System

The plugin uses WordPress hooks extensively:
- `after_setup_theme` - Component initialization (priority 2-6)
- `init` - Plugin initialization (priority 11)
- `trx_addons_action_*` - Custom action hooks
- `trx_addons_filter_*` - Custom filter hooks

### Security Features

- Input sanitization and validation
- WordPress nonce verification
- User capability checks
- ABSPATH security checks
- Proper database query escaping

## Common Development Tasks

### Adding New Components

1. Create directory: `trx_addons/components/component_name/`
2. Create main file: `component_name.php`
3. Follow existing component structure
4. Components auto-load via glob pattern

### Styling Components

1. Create SCSS file in component directory
2. Include component styles in main SCSS files
3. Manually compile SCSS to CSS
4. Ensure responsive breakpoints are followed

### Theme Integration

The plugin integrates with themes through:
- Theme-specific hooks and filters
- Customizer integration
- Options framework
- Template override system

## File Locations

### Core Files
- Main plugin: `trx_addons/trx_addons.php`
- Core classes: `trx_addons/includes/classes/`
- Plugin utilities: `trx_addons/includes/plugin.*.php`

### Components
- Custom Post Types: `trx_addons/components/cpt/`
- API integrations: `trx_addons/components/api/`
- Shortcodes: `trx_addons/components/shortcodes/`
- Widgets: `trx_addons/components/widgets/`

### Assets
- CSS: `trx_addons/css/`
- JavaScript: `trx_addons/js/`
- Images: `trx_addons/css/images/`

## Performance Considerations

- Asset optimization through merging/minification
- Conditional loading of components
- Caching mechanisms for options and data
- Image optimization and lazy loading support
- Responsive image handling with retina support

## Testing

No formal testing framework is implemented. Testing approach should include:
- Manual testing in WordPress environment
- Cross-browser compatibility testing
- Theme compatibility testing
- Plugin conflict testing
- Performance testing with large datasets