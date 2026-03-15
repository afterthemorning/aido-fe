#!/usr/bin/env python3
"""
Migrate antd 4 Tabs.TabPane usage to antd 6 items-array API.

Patterns handled (static JSX only — dynamic .map() files are in SKIP_PATHS):
1. `const { TabPane } = Tabs;` + `<TabPane tab=... key=...>children</TabPane>`
2. `<Tabs.TabPane tab=... key=...>children</Tabs.TabPane>`

Output: `<Tabs ... items={[{key, label, children}, ...]} />`
"""
import re
import sys
import os

EXTENSIONS = ('.tsx', '.ts', '.jsx', '.js')

# Files that use dynamic .map() or conditional {expr && <TabPane>} — handle manually.
SKIP_PATHS = {
    'src/pages/logExplorer/Header.tsx',
    'src/pages/explorer/Log.tsx',
    'src/pages/help/SSOConfigs/index.tsx',
    'src/pages/help/NotificationSettings/index.tsx',
    'src/pages/builtInComponents/List.tsx',
    'src/pages/monitor/object/metricViews/Form.tsx',
}


# ---------------------------------------------------------------------------
# Tag parsing helpers
# ---------------------------------------------------------------------------

def _find_tag_open_end(text: str, after: int) -> int:
    """
    Return index of the '>' that closes an opening JSX tag, starting scan at
    `after`.  Skips '>' characters that appear inside `{...}` or quoted strings.
    """
    i = after
    brace_depth = 0
    while i < len(text):
        c = text[i]
        if c == '{':
            brace_depth += 1
        elif c == '}':
            brace_depth = max(0, brace_depth - 1)
        elif c in ('"', "'") and brace_depth == 0:
            quote = c
            i += 1
            while i < len(text):
                if text[i] == '\\':
                    i += 1  # skip escaped char
                elif text[i] == quote:
                    break
                i += 1
        elif c == '>' and brace_depth == 0:
            return i
        i += 1
    return -1


def _find_closing(text: str, start: int, open_tag: str, close_tag: str) -> int:
    """Find the matching `close_tag` from `start`, tracking `open_tag` depth."""
    depth = 1
    i = start
    while i < len(text) and depth > 0:
        pos_open = text.find(open_tag, i)
        pos_close = text.find(close_tag, i)
        if pos_close == -1:
            return -1
        if pos_open != -1 and pos_open < pos_close:
            depth += 1
            i = pos_open + len(open_tag)
        else:
            depth -= 1
            if depth == 0:
                return pos_close
            i = pos_close + len(close_tag)
    return -1


def _parse_attributes(attr_str: str) -> dict:
    """
    Parse a JSX-attribute string like `key="v" tab={expr} disabled`.
    Returns dict of name -> raw_value (the literal text as it appears in JSX).
    Handles: "double-quoted", 'single-quoted', {brace-expression}, bare-boolean.
    """
    attrs = {}
    i = 0
    s = attr_str.strip()
    while i < len(s):
        # skip whitespace and trailing /
        while i < len(s) and (s[i].isspace() or s[i] == '/'):
            i += 1
        if i >= len(s):
            break
        # read attribute name (stop at =, space, or /)
        j = i
        while j < len(s) and s[j] not in ('=', ' ', '\t', '\n', '/'):
            j += 1
        name = s[i:j].strip()
        if not name:
            i = j + 1
            continue
        i = j
        if i >= len(s) or s[i] != '=':
            # boolean attribute
            attrs[name] = 'true'
            continue
        i += 1  # skip '='
        if i >= len(s):
            break
        if s[i] == '"':
            j = s.index('"', i + 1)
            attrs[name] = s[i:j + 1]
            i = j + 1
        elif s[i] == "'":
            j = s.index("'", i + 1)
            attrs[name] = s[i:j + 1]
            i = j + 1
        elif s[i] == '{':
            # brace-expression: find matching }
            depth = 1
            j = i + 1
            while j < len(s) and depth > 0:
                if s[j] == '{':
                    depth += 1
                elif s[j] == '}':
                    depth -= 1
                j += 1
            attrs[name] = s[i:j]
            i = j
        else:
            # unquoted: read until whitespace
            j = i
            while j < len(s) and not s[j].isspace():
                j += 1
            attrs[name] = s[i:j]
            i = j
    return attrs


def _jsx_value_to_js(val: str) -> str:
    """
    Convert a JSX attribute value string to a plain JS expression:
      {expr}        -> expr
      "double"      -> 'double'  (rewritten to single-quoted)
      'single'      -> 'single'  (kept as-is)
      unquoted      -> returned as-is
    """
    v = val.strip()
    if v.startswith('{') and v.endswith('}'):
        return v[1:-1]
    if v.startswith('"') and v.endswith('"'):
        inner = v[1:-1].replace("\\'", "'").replace("'", "\\'")
        return f"'{inner}'"
    return v  # single-quoted string or bare value


def _get_indent(text: str, pos: int) -> str:
    """Return the leading whitespace of the line that contains position `pos`."""
    line_start = text.rfind('\n', 0, pos) + 1
    j = line_start
    while j < pos and text[j] in (' ', '\t'):
        j += 1
    return text[line_start:j]


# ---------------------------------------------------------------------------
# Extraction helpers
# ---------------------------------------------------------------------------

def _find_tabs_open(text: str, start: int) -> int:
    """Find the next `<Tabs` that is not `<TabPane` or `<TabsList` etc."""
    i = start
    while True:
        pos = text.find('<Tabs', i)
        if pos == -1:
            return -1
        after = text[pos + 5] if pos + 5 < len(text) else ''
        if after in (' ', '\t', '\n', '>', '/'):
            return pos
        i = pos + 5


def _extract_tabpane_items(body: str) -> tuple:
    """
    Scan `body` for `<TabPane>` elements, extract each as an item dict.
    Returns (remaining_non_tabpane_text, list_of_items).
    Each item: {key, tab, label?, disabled?, _children}
    """
    items = []
    remaining_parts = []
    i = 0
    while True:
        start = body.find('<TabPane', i)
        if start == -1:
            remaining_parts.append(body[i:])
            break
        remaining_parts.append(body[i:start])
        open_end = _find_tag_open_end(body, start + len('<TabPane'))
        if open_end == -1:
            remaining_parts.append(body[start:])
            break
        attrs_str = body[start + len('<TabPane'):open_end]
        # self-closing?
        if body[open_end - 1] == '/':
            attrs_str = attrs_str.rstrip('/')
            attrs = _parse_attributes(attrs_str)
            items.append({
                'key': attrs.get('key', '"unknown"'),
                'tab': attrs.get('tab', '""'),
                'label': attrs.get('label', attrs.get('tab', '""')),
                '_children': '',
                **({'disabled': attrs['disabled']} if 'disabled' in attrs else {}),
            })
            i = open_end + 1
            continue
        close_pos = _find_closing(body, open_end + 1, '<TabPane', '</TabPane>')
        if close_pos == -1:
            remaining_parts.append(body[start:])
            break
        children = body[open_end + 1:close_pos].strip()
        attrs = _parse_attributes(attrs_str)
        items.append({
            'key': attrs.get('key', '"unknown"'),
            'tab': attrs.get('tab', '""'),
            'label': attrs.get('label', attrs.get('tab', '""')),
            '_children': children,
            **({'disabled': attrs['disabled']} if 'disabled' in attrs else {}),
        })
        i = close_pos + len('</TabPane>')
    return ''.join(remaining_parts), items


# ---------------------------------------------------------------------------
# Main conversion
# ---------------------------------------------------------------------------

def _convert_tabs_blocks(text: str) -> str:
    """
    Find every `<Tabs ...>...<TabPane>...</TabPane>...</Tabs>` block and
    rewrite it to `<Tabs ... items={[...]} />`.
    """
    result_parts = []
    i = 0
    while True:
        start = _find_tabs_open(text, i)
        if start == -1:
            result_parts.append(text[i:])
            break

        tabs_open_end = _find_tag_open_end(text, start + len('<Tabs'))
        if tabs_open_end == -1:
            result_parts.append(text[i:])
            break

        # self-closing <Tabs ... /> — leave untouched
        if text[tabs_open_end - 1] == '/':
            result_parts.append(text[i:tabs_open_end + 1])
            i = tabs_open_end + 1
            continue

        tabs_attrs_str = text[start + len('<Tabs'):tabs_open_end]
        tabs_close = _find_closing(text, tabs_open_end + 1, '<Tabs', '</Tabs>')
        if tabs_close == -1:
            result_parts.append(text[i:])
            break

        body = text[tabs_open_end + 1:tabs_close]
        if '<TabPane' not in body:
            result_parts.append(text[i:tabs_close + len('</Tabs>')])
            i = tabs_close + len('</Tabs>')
            continue

        converted_body, items = _extract_tabpane_items(body)

        # Build indent levels
        indent = _get_indent(text, start)
        item_indent = indent + '  '
        child_indent = item_indent + '  '

        items_entries = []
        for item in items:
            key_val = _jsx_value_to_js(item.get('key', '"unknown"'))
            tab_val = item.get('tab', '""')
            label_val = _jsx_value_to_js(item.get('label', tab_val))
            disabled_val = item.get('disabled', None)
            children_content = item.get('_children', '').strip()

            entry_lines = [f'key: {key_val}', f'label: {label_val}']
            if disabled_val and disabled_val not in ('false', 'true'):
                entry_lines.append(f'disabled: {_jsx_value_to_js(disabled_val)}')
            elif disabled_val == 'true':
                entry_lines.append('disabled: true')
            if children_content:
                # Always wrap in <> fragment so multi-sibling children are valid
                entry_lines.append(
                    f'children: (\n{child_indent}<>\n'
                    f'{child_indent}  {children_content}\n'
                    f'{child_indent}</>\n{item_indent})'
                )
            sep = ',\n' + item_indent
            entry_body = sep.join(entry_lines)
            items_entries.append(
                '{\n' + item_indent + entry_body + ',\n' + indent + '}'
            )

        items_str = (
            '[\n' + item_indent
            + (',\n' + item_indent).join(items_entries)
            + '\n' + indent + ']'
        )

        # Strip any existing `items=` prop from the Tabs attrs
        new_attrs = re.sub(r'\s*items=\{[^}]+\}', '', tabs_attrs_str)
        non_tabpane = converted_body.strip()
        new_tabs = f'<Tabs{new_attrs} items={{{items_str}}}'
        if non_tabpane:
            new_tabs += f'>\n{item_indent}{non_tabpane}\n{indent}</Tabs>'
        else:
            new_tabs += ' />'

        result_parts.append(text[i:start])
        result_parts.append(new_tabs)
        i = tabs_close + len('</Tabs>')

    return ''.join(result_parts)


# ---------------------------------------------------------------------------
# File-level entry point
# ---------------------------------------------------------------------------

def migrate_file(path: str) -> tuple:
    with open(path, encoding='utf-8') as f:
        original = f.read()

    text = original

    # Remove `const { TabPane } = Tabs;` or `const TabPane = Tabs.TabPane;`
    text = re.sub(r'\n[ \t]*const \{ TabPane \} = Tabs;[ \t]*\n', '\n', text)
    text = re.sub(r'\n[ \t]*const TabPane = Tabs\.TabPane;[ \t]*\n', '\n', text)

    # Normalise Tabs.TabPane → TabPane
    text = text.replace('<Tabs.TabPane', '<TabPane')
    text = text.replace('</Tabs.TabPane', '</TabPane')

    if '<TabPane' not in text:
        return False, original

    result = _convert_tabs_blocks(text)
    if result == text:
        return False, original
    return True, result


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    root = sys.argv[1] if len(sys.argv) > 1 else 'src'
    changed = 0
    failed = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d != 'node_modules' and not d.startswith('.')]
        for fname in filenames:
            if not fname.endswith(EXTENSIONS):
                continue
            path = os.path.join(dirpath, fname)
            rel = path.replace('\\', '/')
            if any(rel.endswith(s.replace('\\', '/')) for s in SKIP_PATHS):
                print(f'  SKIP (manual): {path}')
                continue
            try:
                did_change, new_content = migrate_file(path)
                if did_change:
                    with open(path, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f'  migrated: {path}')
                    changed += 1
            except Exception as e:
                failed.append((path, str(e)))
                print(f'  SKIP (error): {path}: {e}')

    print(f'\nTotal migrated: {changed}')
    if failed:
        print(f'Failed ({len(failed)}):')
        for p, e in failed:
            print(f'  {p}: {e}')
