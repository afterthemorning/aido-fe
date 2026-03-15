# AIDO-FE UI Playbook: AIDO Excel Alert and Notification Reuse

## Goal
Use existing alert/notification pages to complete business workflow. Do not build datasource-specific notification screens unless explicitly required.

## UI Journey
1. Alert rule setup: `/aido/alert-rules`
2. Event observation: `/aido/alert-cur-events`
3. Pipeline orchestration: `/aido/event-pipelines`
4. Job template linkage: `/aido/job-tpls`
5. Notification strategy: `/aido/notification-rules`
6. Channel config: `/aido/notification-channels`
7. Template config: `/aido/notification-templates`
8. Component/template center reference: `/aido/components`

## AIDO Excel Task Mapping
- Explorer/datasource pages focus on data query and context.
- Alert rule and notification routing are configured in shared platform pages.
- UI improvements in datasource pages should optimize query experience, not duplicate notification orchestration.

## Acceptance Checklist
1. User can define a rule from existing alert rule page for aido-excel context.
2. User can see generated events in current events page.
3. User can apply pipeline processing for event enrichment/noise reduction.
4. User can map event to notification rule/channel/template.
5. User receives notification with expected aido-excel context fields.

## UX Rules
- Prefer links/jump paths between existing pages instead of new standalone forms.
- Keep naming consistent across alert, event, and notification entities.
- Keep error states explicit when linkage config is incomplete.

## Regression Checklist
- Existing alert pages remain unaffected.
- Existing notification pages remain unaffected.
- Datasource query pages do not break due to new linkage guidance.
