# VibeSpec Constraint Rules for Google Antigravity

## Routing Constraints

WHEN a user navigates to `/checkout`,
THE system SHALL verify that `Cart_Items > 0`.
IF `Cart_Items == 0`, THE system SHALL redirect to `/cart`.

WHEN a user navigates to `/profile` OR `/account` OR `/settings` OR `/orders`,
THE system SHALL verify that `User_Authenticated == true`.
IF `User_Authenticated == false`, THE system SHALL redirect to `/login`.

## Design Token Constraints

WHEN the system renders any component,
THE system SHALL use only design tokens defined in `DESIGN.md` or `brand-tokens.json`.
THE system SHALL NOT use hardcoded color values, spacing values, or font sizes.

## Layout Constraints

THE system SHALL ensure that no two visible elements overlap at any viewport width
between 320px and 4000px.

THE system SHALL ensure that all interactive elements (buttons, inputs, links) have
a minimum tap target of 44x44 device-independent pixels.

THE system SHALL ensure that all child elements are contained within their parent
element boundaries at every responsive breakpoint.

## Accessibility Constraints

THE system SHALL maintain a minimum color contrast ratio of 7:1 (WCAG 2.2 AAA)
for all text content against its background.

THE system SHALL ensure that keyboard navigation (`Tab`) can reach every interactive
element without becoming trapped.

THE system SHALL ensure that every interactive element has an accessible label
(ARIA label, text content, or title attribute).

## State Machine Constraints

THE system SHALL NOT allow any state transition that is not defined in the
XState state machine specification.

THE system SHALL NOT render a page component if the current XState state
does not match the page's guard condition.
