import re
from typing import List, Dict, Any


def parse_inventory(raw_text: str) -> List[Dict[str, Any]]:
    inventory = []

    # Matches: " 2 | #37: x1  Golden Pickaxe | Damage: 15 | Fortune V"
    # Group 1: Slot (optional), Group 2: Count, Group 3: Name, Group 4: Lore
    pattern = re.compile(r"\s*(\d+)?\s*\|\s*#\d+:\s*x(\d+)\s+([^|]+)(?:\s*\|\s*(.*))?$")

    current_slot = 0

    for line in raw_text.splitlines():
        # Clean up weird MCC formatting artifacts
        clean_line = line.replace("▌", "").strip()

        match = pattern.search(clean_line)
        if match:
            slot_str = match.group(1)
            count_str = match.group(2)
            name = match.group(3).strip()
            lore_raw = match.group(4)

            # If MCC explicitly gives a slot number, use it. Otherwise, increment.
            if slot_str:
                current_slot = int(slot_str)

            count = int(count_str)
            lore = [l.strip() for l in lore_raw.split("|")] if lore_raw else []

            inventory.append(
                {"slot": current_slot, "name": name, "count": count, "lore": lore}
            )
            current_slot += 1

    return inventory
