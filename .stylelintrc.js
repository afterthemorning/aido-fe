/**
 * Stylelint config for CSS/Less in React UI.
 * Focus: keep styles maintainable, predictable, and easy to refactor.
 */
module.exports = {
  defaultSeverity: 'warning',
  reportNeedlessDisables: null,
  reportInvalidScopeDisables: null,
  reportDescriptionlessDisables: null,
  extends: ['stylelint-config-standard', 'stylelint-config-standard-less', 'stylelint-config-recess-order'],
  plugins: ['stylelint-less'],
  overrides: [
    {
      files: ['**/*.less'],
      customSyntax: 'postcss-less',
    },
  ],
  rules: {
    // Disallow !important escalation to keep specificity manageable.
    'declaration-no-important': true,

    // Keep selector strategy simple and component-oriented.
    'selector-max-id': 0,
    'selector-max-specificity': '0,4,0',
    'selector-class-pattern': '^[a-z][a-z0-9-]*$',

    // Avoid visual bugs caused by imprecise values.
    'alpha-value-notation': 'number',
    'color-function-notation': 'modern',
    'length-zero-no-unit': true,
    'number-max-precision': 4,

    // Responsive friendliness: discourage fixed viewport anti-patterns.
    'unit-disallowed-list': ['pt'],

    // Allow project-specific Less patterns.
    'at-rule-no-unknown': null,
    'no-descending-specificity': null,
    'color-hex-length': 'short',
  },
};
