# Agent Coordination

Purpose: keep parallel agents from editing the same scope without coordination.

Use this folder for live work claims. Do not use one shared status file for all
frequent updates, because two agents editing the same file can create conflicts.

## Protocol

1. Before editing, create or update your own claim file in this folder.
2. Claim the smallest possible scope: route, feature, and expected file paths.
3. Check `git status --short` and treat unrelated dirty files as owned by
   another agent unless the user says otherwise.
4. Do not edit another agent's claimed files without an explicit handoff.
5. If scope changes, update only your own claim file.
6. When finished, mark the claim as `done` and include verification evidence.

## Claim File Format

Use one file per agent or task:

```md
# <agent/task name>

Status: active
Started: YYYY-MM-DD HH:mm TZ

## Scope

- Route/feature:
- Files I may edit:
- Files I will avoid:

## Current Notes

- ...

## Verification

- ...
```
