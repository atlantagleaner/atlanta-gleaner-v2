#!/usr/bin/env python3
"""
Update cases.json with formatted opinions extracted from DOCX files.
"""

import sys
import json
from pathlib import Path

sys.stdout.reconfigure(encoding='utf-8')

from extract_formatted_opinions import process_docx_file, verify_no_hyperlinks

# Mapping of filenames to case slugs
CASE_MAPPING = {
    'Arnsdorff v. State_321 Ga. 880.Docx': 'arnsdorff_v_state',
    'Bailey v. McIntosh Cnty._322 Ga. 602.Docx': 'bailey_v_mcintosh_cnty',
    'Barker v. Muschett_375 Ga. App. 585.Docx': 'barker_v_muschett',
    'Fuller v. State.Docx': 'fuller_v_state',
    'Richardson v. State_322 Ga. 360.Docx': 'richardson_v_state',
    'State v. Phillips_323 Ga. 125.Docx': 'state_v_phillips',
    'Woods v. State_361 Ga. App. 844.Docx': 'woods_v_state',
}

def main():
    # Load cases.json
    with open('src/data/cases.json', 'r', encoding='utf-8') as f:
        cases = json.load(f)

    # Create slug to case mapping
    case_by_slug = {case['slug']: case for case in cases}

    print("=== PROCESSING FORMATTED OPINIONS ===\n")

    success_count = 0
    fail_count = 0

    for filename, slug in CASE_MAPPING.items():
        docx_path = f'raw-opinions/{filename}'

        try:
            opinion_html, footnotes = process_docx_file(docx_path)

            # Verify no hyperlinks
            if not verify_no_hyperlinks(opinion_html, footnotes):
                print(f"❌ {slug}: HYPERLINKS DETECTED - SKIPPING")
                fail_count += 1
                continue

            # Update case
            if slug not in case_by_slug:
                print(f"❌ {slug}: Case not found in cases.json")
                fail_count += 1
                continue

            case = case_by_slug[slug]
            case['opinionText'] = opinion_html
            case['footnotes'] = footnotes

            print(f"✅ {slug}")
            print(f"   Opinion: {len(opinion_html):,} chars")
            print(f"   Footnotes: {len(footnotes)} entries, {sum(len(f) for f in footnotes.values()):,} chars total")
            success_count += 1

        except Exception as e:
            print(f"❌ {slug}: ERROR - {str(e)}")
            fail_count += 1

    # Write updated cases.json
    print(f"\n=== SAVING UPDATED cases.json ===")
    with open('src/data/cases.json', 'w', encoding='utf-8') as f:
        json.dump(cases, f, ensure_ascii=False, indent=2)

    print(f"\nProcessed: {success_count} successful, {fail_count} failed")
    print(f"Total cases in database: {len(cases)}")

if __name__ == '__main__':
    main()
