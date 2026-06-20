---
name: tailwindcss
description: Tailwind CSS utility-first CSS framework. Use when styling web applications with utility classes, building responsive designs, or customizing design systems with theme variables.
metadata:
  author: Hairyf
  version: "2026.2.2"
  source: Generated from https://github.com/tailwindlabs/tailwindcss.com
---

# Tailwind CSS

> The skill is based on Tailwind CSS v4.1.18, generated at 2026-01-28.

Tailwind CSS is a utility-first CSS framework for rapidly building custom user interfaces. Instead of writing custom CSS, you compose designs using utility classes directly in your markup. Tailwind v4 introduces CSS-first configuration with theme variables, making it easier to customize your design system.

## Core References

| Topic | Description |
|-------|-------------|
| Installation | Vite, PostCSS, CLI, and CDN setup |
| Utility Classes | Understanding Tailwind's utility-first approach and styling elements |
| Theme Variables | Design tokens, customizing theme, and theme variable namespaces |
| Responsive Design | Mobile-first breakpoints, responsive variants, and container queries |
| Variants | Applying utilities conditionally with state, pseudo-class, and media query variants |
| Preflight | Tailwind's base styles and how to extend or disable them |

## Layout

### Display & Flexbox & Grid

| Topic | Description |
|-------|-------------|
| Display | flex, grid, block, inline, hidden, sr-only, flow-root, contents |
| Flexbox | flex-direction, justify, items, gap, grow, shrink, wrap, order |
| Grid | grid-cols, grid-rows, gap, place-items, col-span, row-span, subgrid |
| Aspect Ratio | Controlling element aspect ratio for responsive media |
| Columns | Multi-column layout for magazine-style or masonry layouts |

### Positioning

| Topic | Description |
|-------|-------------|
| Position | Controlling element positioning with static, relative, absolute, fixed, and sticky |
| Inset | Controlling placement of positioned elements with top, right, bottom, left, and inset utilities |

### Sizing

| Topic | Description |
|-------|-------------|
| Width | Setting element width with spacing scale, fractions, container sizes, and viewport units |
| Height | Setting element height with spacing scale, fractions, viewport units, and content-based sizing |
| Min & Max Sizing | min-width, max-width, min-height, max-height constraints |

### Spacing

| Topic | Description |
|-------|-------------|
| Margin | Controlling element margins with spacing scale, negative values, logical properties |
| Padding | Controlling element padding with spacing scale, logical properties |

## Typography

| Topic | Description |
|-------|-------------|
| Font & Text | Font size, weight, color, line-height, letter-spacing, decoration, truncate |
| Text Align | Controlling text alignment with left, center, right, justify |
| List Style | list-style-type, list-style-position for bullets and markers |

## Visual

| Topic | Description |
|-------|-------------|
| Background | Background color, gradient, image, size, position |
| Border | Border width, color, radius, divide, ring |
| Effects | Box shadow, opacity, mix-blend, backdrop-blur, filter |
| SVG | fill, stroke, stroke-width for SVG and icon styling |

## Effects & Interactivity

| Topic | Description |
|-------|-------------|
| Transition & Animation | CSS transitions, animation keyframes, reduced motion |
| Visibility & Interactivity | Visibility, cursor, pointer-events, user-select, z-index |
| Form Controls | accent-color, appearance, caret-color, resize |
| Scroll Snap | scroll-snap-type, scroll-snap-align for carousels |

## Features

### Dark Mode
Implementing dark mode with the `dark` variant and custom strategies.

### Migration
Migrating from v3 to v4, breaking changes, rename mappings.

### Customization
- **Custom Styles** — Adding custom styles, utilities, variants, and arbitrary values
- **Functions & Directives** — `@theme`, `@utility`, `@custom-variant`, `@layer`
- **Content Detection** — How Tailwind detects classes and how to customize content scanning

## Key Recommendations

- **Use utility classes directly in markup** — Compose designs by combining utilities
- **Customize with theme variables** — Use `@theme` directive to define design tokens
- **Mobile-first responsive design** — Use unprefixed utilities for mobile, prefixed for breakpoints
- **Use complete class names** — Never construct classes dynamically with string interpolation
- **Leverage variants** — Stack variants for complex conditional styling
- **Prefer CSS-first configuration** — Use `@theme`, `@utility`, and `@custom-variant` over JavaScript configs

## v4 Key Changes

- Configuration moves from `tailwind.config.js` to CSS `@theme` blocks
- Use `@import "tailwindcss"` instead of `@tailwind base/components/utilities`
- Theme values are now CSS custom properties (`--color-*`, `--spacing-*`)
- New `@utility` directive for custom utilities
- New `@custom-variant` for custom variants
- Container queries built-in (no plugin needed)
