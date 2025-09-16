facts = {"fever", "cough", "high_risk"}
rules = [
    ({"fever", "cough"}, "flu"),
    ({"flu"}, "recommend_rest"),
    ({"flu", "high_risk"}, "see_doctor"),
]

derived = set()
changed = True
while changed:
    changed = False
    for conds, concl in rules:
        if conds.issubset(facts.union(derived)) and concl not in derived:
            derived.add(concl)
            print(f"[Forward] {conds} -> {concl}")
            changed = True

print("최종 결론:", facts.union(derived))